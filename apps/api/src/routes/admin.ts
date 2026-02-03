import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { authMiddleware, comparePassword } from '../middleware/auth.js'
import {
  getSettings,
  updateSettings,
  getItems,
  getItemById,
  createItem,
  updateItem,
  deleteItem,
  createToken,
  getTokenById,
  revokeToken,
  revokeUser,
  calculateBasePriceRp,
} from '../db/client.js'
import type { Item } from '../types.ts'
import type { Bindings } from '../index.js'

const adminRoutes = new Hono<{ Bindings: Bindings }>()

// POST /api/admin/login
adminRoutes.post('/login', async (c) => {
  const db = c.env.DB
  const { password } = await c.req.json<{ password: string }>()

  const settings = await getSettings(db)
  if (!settings) {
    return c.json({ success: false, error: 'Server error' }, 500)
  }

  const isValid = await comparePassword(password, settings.adminPasswordHash)

  if (!isValid) {
    return c.json({ success: false, error: 'Invalid password' }, 401)
  }

  return c.json({ success: true, data: { token: password } })
})

// Apply auth middleware to all other admin routes
adminRoutes.use('*', authMiddleware)

// GET /api/admin/settings
adminRoutes.get('/settings', async (c) => {
  const db = c.env.DB
  const settings = await getSettings(db)

  if (!settings) {
    return c.json({ success: false, error: 'Settings not found' }, 404)
  }

  return c.json({ success: true, data: settings })
})

// PATCH /api/admin/settings
const updateSettingsSchema = z.object({
  exchangeRate: z.number().positive().optional(),
  defaultMarginPercent: z.number().min(0).max(100).optional(),
  totalBaggageQuotaGrams: z.number().positive().optional(),
  jastipStatus: z.enum(['open', 'closed']).optional(),
  jastipCloseDate: z.string().nullable().optional(),
  estimatedArrivalDate: z.string().nullable().optional(),
  itemCategories: z.array(z.string()).optional(),
})

adminRoutes.patch('/settings', zValidator('json', updateSettingsSchema), async (c) => {
  const db = c.env.DB
  const updates = c.req.valid('json')

  const settings = await updateSettings(db, updates)

  if (!settings) {
    return c.json({ success: false, error: 'Failed to update settings' }, 500)
  }

  return c.json({ success: true, data: settings })
})

// GET /api/admin/items
adminRoutes.get('/items', async (c) => {
  const db = c.env.DB
  const items = await getItems(db)
  return c.json({ success: true, data: items })
})

// GET /api/admin/items/:id
adminRoutes.get('/items/:id', async (c) => {
  const db = c.env.DB
  const id = c.req.param('id')

  const item = await getItemById(db, id)
  if (!item) {
    return c.json({ success: false, error: 'Item not found' }, 404)
  }

  return c.json({ success: true, data: item })
})


// POST /api/admin/items
const createItemSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  photos: z.array(z.string()).min(1),
  basePriceYen: z.number().positive(),
  sellingPriceRp: z.number().positive(),
  weightGrams: z.number().positive(),
  withoutBoxNote: z.boolean().optional().default(false),
  isLimitedEdition: z.boolean().optional().default(false),
  isPreorder: z.boolean().optional().default(false),
  isFragile: z.boolean().optional().default(false),
  category: z.string().optional(),
  infoNotes: z.array(z.object({
    type: z.enum(['amber', 'purple', 'blue', 'red']),
    text: z.string().min(1),
  })).optional(),
  maxOrders: z.number().positive().default(10),
  isDraft: z.boolean().optional().default(false),
})

adminRoutes.post('/items', zValidator('json', createItemSchema), async (c) => {
  const db = c.env.DB
  const data = c.req.valid('json')

  // Get exchange rate from settings to calculate basePriceRp
  const settings = await getSettings(db)
  const exchangeRate = settings?.exchangeRate || 108.5
  const basePriceRp = calculateBasePriceRp(data.basePriceYen, exchangeRate)

  const item: Omit<Item, 'createdAt' | 'updatedAt'> = {
    id: crypto.randomUUID(),
    name: data.name,
    description: data.description || null,
    photos: data.photos,
    basePriceYen: data.basePriceYen,
    basePriceRp,
    sellingPriceRp: data.sellingPriceRp,
    weightGrams: data.weightGrams,
    withoutBoxNote: data.withoutBoxNote,
    isLimitedEdition: data.isLimitedEdition,
    isPreorder: data.isPreorder,
    isFragile: data.isFragile,
    category: data.category || null,
    infoNotes: data.infoNotes || [],
    maxOrders: data.maxOrders,
    currentOrders: 0,
    isAvailable: true,
    isDraft: data.isDraft,
    viewCount: 0,
  }

  const created = await createItem(db, item)
  return c.json({ success: true, data: created }, 201)
})

// PATCH /api/admin/items/:id
adminRoutes.patch('/items/:id', async (c) => {
  try {
    const db = c.env.DB
    const id = c.req.param('id')
    const updates = await c.req.json()

    // Check if item exists
    const existing = await getItemById(db, id)
    if (!existing) {
      return c.json({ success: false, error: 'Item not found' }, 404)
    }

    // If basePriceYen is being updated, recalculate basePriceRp
    if (updates.basePriceYen !== undefined) {
      const settings = await getSettings(db)
      const exchangeRate = settings?.exchangeRate || 108.5
      updates.basePriceRp = calculateBasePriceRp(updates.basePriceYen, exchangeRate)
    }

    const updated = await updateItem(db, id, updates)
    return c.json({ success: true, data: updated })
  } catch (err: any) {
    console.error('Update item error:', err)
    return c.json({ success: false, error: err.message || 'Update failed' }, 500)
  }
})

// DELETE /api/admin/items/:id
adminRoutes.delete('/items/:id', async (c) => {
  const db = c.env.DB
  const id = c.req.param('id')
  const force = c.req.query('force') === 'true'

  // Check if item exists
  const existing = await getItemById(db, id)
  if (!existing) {
    return c.json({ success: false, error: 'Item not found' }, 404)
  }

  // Check for existing orders before hard delete
  if (force && existing.currentOrders > 0) {
    return c.json({
      success: false,
      error: 'Item has orders. Hide it instead or use force=true to delete anyway.',
      hasOrders: true,
    }, 400)
  }

  await deleteItem(db, id, force)
  return c.json({ success: true })
})

// POST /api/admin/upload
adminRoutes.post('/upload', async (c) => {
  const bucket = c.env.PHOTOS_BUCKET

  const formData = await c.req.formData()
  const file = formData.get('file') as File | null

  if (!file) {
    return c.json({ success: false, error: 'No file provided' }, 400)
  }

  console.log(`[Upload] Received file: ${file.name}, type: ${file.type}, size: ${file.size}`)

  // Validate file type
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
  if (!allowedTypes.includes(file.type)) {
    return c.json({ success: false, error: 'Invalid file type. Allowed: jpg, png, webp' }, 400)
  }

  // Validate file size (5MB)
  const maxSize = 5 * 1024 * 1024
  if (file.size > maxSize) {
    return c.json({ success: false, error: 'File too large. Max 5MB' }, 400)
  }

  // Generate unique filename
  const ext = file.type.split('/')[1]
  const uuid = crypto.randomUUID()
  const key = `uploads/${uuid}.${ext}`

  console.log(`[Upload] Saving to R2 with key: ${key}`)

  // Upload to R2
  await bucket.put(key, file, {
    httpMetadata: {
      contentType: file.type,
    },
  })

  // Verify upload
  const check = await bucket.get(key)
  console.log(`[Upload] R2 object exists: ${!!check}, size: ${check?.size || 0}`)

  // Generate public URL (assuming R2 public access or signed URL)
  // For now, return the key - in production, you'd use a custom domain or signed URL
  const url = `/api/public/photos/${key}`

  return c.json({
    success: true,
    data: {
      url,
      key,
      thumbnailUrl: url, // Same for now, could generate thumbnail
    },
  })
})

// Token management endpoints
// GET /api/admin/tokens
adminRoutes.get('/tokens', async (c) => {
  const db = c.env.DB
  const result = await db.prepare(`
    SELECT t.*, u.name as used_by_name, u.email as used_by_email, u.is_revoked as user_revoked
    FROM tokens t
    LEFT JOIN users u ON t.used_by = u.id
    ORDER BY t.created_at DESC
  `).all()

  const tokens = result.results.map((row: any) => ({
    id: row.id,
    code: row.code,
    createdBy: row.created_by,
    usedBy: row.used_by,
    usedByName: row.used_by_name,
    usedByEmail: row.used_by_email,
    usedAt: row.used_at,
    expiresAt: row.expires_at,
    isRevoked: row.is_revoked === 1,
    userRevoked: row.user_revoked === 1,
    createdAt: row.created_at,
  }))

  return c.json({ success: true, data: tokens })
})

// POST /api/admin/tokens - Generate new invite token
const createTokenSchema = z.object({
  note: z.string().optional(),
})

adminRoutes.post('/tokens', zValidator('json', createTokenSchema), async (c) => {
  const db = c.env.DB
  const { note } = c.req.valid('json')

  // Generate 5-digit OTP-style token
  const code = Math.floor(10000 + Math.random() * 90000).toString()

  const token = await createToken(db, {
    id: crypto.randomUUID(),
    code,
    createdBy: 'admin', // TODO: Get from admin auth context
    expiresAt: null, // No expiration
    isRevoked: false,
  })

  return c.json({ success: true, data: token }, 201)
})

// DELETE /api/admin/tokens/:id - Revoke a token and user access
adminRoutes.delete('/tokens/:id', async (c) => {
  const db = c.env.DB
  const id = c.req.param('id')

  const token = await getTokenById(db, id)
  if (!token) {
    return c.json({ success: false, error: 'Token not found' }, 404)
  }

  // Revoke the token
  await revokeToken(db, id)

  // If token was used by a user, also revoke that user's access (soft delete)
  if (token.usedBy) {
    await revokeUser(db, token.usedBy, 'admin')
  }

  return c.json({
    success: true,
    data: {
      message: token.usedBy
        ? 'Token and user access revoked'
        : 'Token revoked'
    }
  })
})

export { adminRoutes }

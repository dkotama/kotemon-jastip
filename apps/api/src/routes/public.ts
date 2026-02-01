import { Hono } from 'hono'
import { getSettings, getItems, getItemById, calculateRemainingQuota, incrementItemViewCount } from '../db/client.js'
import type { PublicConfig, PublicItem } from '../types.ts'
import type { Bindings } from '../index.js'

// Helper to get content type from file extension
function getContentType(key: string): string {
  const ext = key.split('.').pop()?.toLowerCase()
  switch (ext) {
    case 'jpg':
    case 'jpeg': return 'image/jpeg'
    case 'png': return 'image/png'
    case 'webp': return 'image/webp'
    case 'gif': return 'image/gif'
    default: return 'application/octet-stream'
  }
}

const publicRoutes = new Hono<{ Bindings: Bindings }>()

// GET /api/public/config
publicRoutes.get('/config', async (c) => {
  const db = c.env.DB
  
  const settings = await getSettings(db)
  if (!settings) {
    return c.json({ success: false, error: 'Settings not found' }, 500)
  }
  
  // Calculate countdown days
  let countdownDays: number | null = null
  if (settings.jastipStatus === 'open' && settings.jastipCloseDate) {
    const closeDate = new Date(settings.jastipCloseDate)
    const today = new Date()
    const diffTime = closeDate.getTime() - today.getTime()
    countdownDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    if (countdownDays < 0) countdownDays = 0
  }
  
  // Calculate remaining quota
  const remainingGrams = await calculateRemainingQuota(db)
  
  const config: PublicConfig = {
    jastipStatus: settings.jastipStatus,
    countdownDays,
    remainingQuotaKg: Math.round(remainingGrams / 100) / 10, // Convert to kg with 1 decimal
    totalQuotaKg: settings.totalBaggageQuotaGrams / 1000,
    estimatedArrivalDate: settings.estimatedArrivalDate,
  }
  
  return c.json({ success: true, data: config })
})

// GET /api/public/items
publicRoutes.get('/items', async (c) => {
  const db = c.env.DB
  
  const search = c.req.query('search')
  const limit = Math.min(parseInt(c.req.query('limit') || '20'), 100)
  const offset = parseInt(c.req.query('offset') || '0')
  
  const items = await getItems(db, {
    onlyAvailable: true,
    onlyPublished: true,
    search,
    limit,
    offset,
  })
  
  // Transform to public items
  const now = new Date()
  const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000)
  
  const publicItems: PublicItem[] = items.map(item => {
    const availableSlots = item.maxOrders - item.currentOrders
    const createdAt = new Date(item.createdAt)

    // Determine badge
    let badge: PublicItem['badge'] = 'available'
    if (availableSlots <= 0) {
      badge = 'full'
    } else if (availableSlots <= 2) {
      badge = 'low_stock'
    } else if (createdAt > threeDaysAgo) {
      badge = 'new'
    }

    return {
      id: item.id,
      name: item.name,
      description: item.description,
      photos: item.photos,
      basePriceRp: item.basePriceRp,
      sellingPriceRp: item.sellingPriceRp,
      weightGrams: item.weightGrams,
      withoutBoxNote: item.withoutBoxNote,
      isLimitedEdition: item.isLimitedEdition,
      isPreorder: item.isPreorder,
      isFragile: item.isFragile,
      category: item.category,
      infoNotes: item.infoNotes,
      availableSlots,
      badge,
      viewCount: item.viewCount,
    }
  })
  
  return c.json({
    success: true,
    data: { items: publicItems, total: publicItems.length },
  })
})

// GET /api/public/items/:id
publicRoutes.get('/items/:id', async (c) => {
  const db = c.env.DB
  const id = c.req.param('id')

  const item = await getItemById(db, id)

  if (!item || !item.isAvailable || item.isDraft) {
    return c.json({ success: false, error: 'Item not found' }, 404)
  }

  const now = new Date()
  const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000)
  const availableSlots = item.maxOrders - item.currentOrders
  const createdAt = new Date(item.createdAt)

  let badge: PublicItem['badge'] = 'available'
  if (availableSlots <= 0) {
    badge = 'full'
  } else if (availableSlots <= 2) {
    badge = 'low_stock'
  } else if (createdAt > threeDaysAgo) {
    badge = 'new'
  }

  const publicItem: PublicItem = {
    id: item.id,
    name: item.name,
    description: item.description,
    photos: item.photos,
    basePriceRp: item.basePriceRp,
    sellingPriceRp: item.sellingPriceRp,
    weightGrams: item.weightGrams,
    withoutBoxNote: item.withoutBoxNote,
    isLimitedEdition: item.isLimitedEdition,
    isPreorder: item.isPreorder,
    isFragile: item.isFragile,
    category: item.category,
    infoNotes: item.infoNotes,
    availableSlots,
    badge,
    viewCount: item.viewCount,
  }

  return c.json({ success: true, data: publicItem })
})

// POST /api/public/items/:id/view
// Increments view_count and returns new count
publicRoutes.post('/items/:id/view', async (c) => {
  const db = c.env.DB
  const id = c.req.param('id')

  // First check if item exists and is available
  const item = await getItemById(db, id)
  if (!item || !item.isAvailable || item.isDraft) {
    return c.json({ success: false, error: 'Item not found' }, 404)
  }

  // Increment view count
  const newCount = await incrementItemViewCount(db, id)

  if (newCount === null) {
    return c.json({ success: false, error: 'Failed to increment view count' }, 500)
  }

  return c.json({ success: true, viewCount: newCount })
})

// GET /api/public/photos/* - Serve photo from R2 bucket (wildcard for paths like uploads/filename.png)
publicRoutes.get('/photos/*', async (c) => {
  const bucket = c.env.PHOTOS_BUCKET
  // Get the full path after /api/public/photos/
  const key = c.req.path.replace('/api/public/photos/', '')
  
  console.log(`[Photos] Requested key: ${key}`)
  
  // Get the object from R2
  const object = await bucket.get(key)
  
  console.log(`[Photos] Object found: ${!!object}`)
  
  if (!object) {
    return c.json({ success: false, error: 'Photo not found' }, 404)
  }
  
  // Set appropriate headers
  c.header('Content-Type', object.httpMetadata?.contentType || getContentType(key))
  c.header('Cache-Control', 'public, max-age=31536000') // Cache for 1 year
  
  // Return the object body
  return c.body(object.body)
})

export { publicRoutes }

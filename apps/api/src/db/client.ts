import type { Item, Settings, User, Token } from '../types.ts'

/**
 * Calculate base price in IDR from JPY using exchange rate
 * Formula: basePriceRp = basePriceYen × exchangeRate
 */
export function calculateBasePriceRp(basePriceYen: number, exchangeRate: number): number {
  return Math.round(basePriceYen * exchangeRate)
}

// Settings queries
export async function getSettings(db: D1Database): Promise<Settings | null> {
  const result = await db.prepare('SELECT * FROM settings WHERE id = ?')
    .bind('default')
    .first()
  
  if (!result) return null
  
  return {
    id: result.id as 'default',
    exchangeRate: result.exchange_rate as number,
    defaultMarginPercent: result.default_margin_percent as number,
    totalBaggageQuotaGrams: result.total_baggage_quota_grams as number,
    jastipStatus: result.jastip_status as 'open' | 'closed',
    jastipCloseDate: result.jastip_close_date as string | null,
    estimatedArrivalDate: result.estimated_arrival_date as string | null,
    adminPasswordHash: result.admin_password_hash as string,
    updatedAt: result.updated_at as string,
  }
}

export async function updateSettings(
  db: D1Database,
  updates: Partial<Omit<Settings, 'id' | 'updatedAt'>>
): Promise<Settings | null> {
  const fields: string[] = []
  const values: (string | number | null)[] = []
  
  if (updates.exchangeRate !== undefined) {
    fields.push('exchange_rate = ?')
    values.push(updates.exchangeRate)
  }
  if (updates.defaultMarginPercent !== undefined) {
    fields.push('default_margin_percent = ?')
    values.push(updates.defaultMarginPercent)
  }
  if (updates.totalBaggageQuotaGrams !== undefined) {
    fields.push('total_baggage_quota_grams = ?')
    values.push(updates.totalBaggageQuotaGrams)
  }
  if (updates.jastipStatus !== undefined) {
    fields.push('jastip_status = ?')
    values.push(updates.jastipStatus)
  }
  if (updates.jastipCloseDate !== undefined) {
    fields.push('jastip_close_date = ?')
    values.push(updates.jastipCloseDate)
  }
  if (updates.estimatedArrivalDate !== undefined) {
    fields.push('estimated_arrival_date = ?')
    values.push(updates.estimatedArrivalDate)
  }
  if (updates.adminPasswordHash !== undefined) {
    fields.push('admin_password_hash = ?')
    values.push(updates.adminPasswordHash)
  }
  
  if (fields.length === 0) return getSettings(db)
  
  values.push('default')
  
  const query = `UPDATE settings SET ${fields.join(', ')} WHERE id = ?`
  await db.prepare(query).bind(...values).run()
  
  return getSettings(db)
}

// Item queries
export async function getItems(
  db: D1Database,
  options: {
    onlyAvailable?: boolean
    onlyPublished?: boolean
    search?: string
    limit?: number
    offset?: number
  } = {}
): Promise<Item[]> {
  const { onlyAvailable = false, onlyPublished = false, search, limit = 100, offset = 0 } = options
  
  let whereClause = ''
  const params: (string | number)[] = []
  
  if (onlyAvailable && onlyPublished) {
    whereClause = 'WHERE is_available = 1 AND is_draft = 0'
  } else if (onlyAvailable) {
    whereClause = 'WHERE is_available = 1'
  } else if (onlyPublished) {
    whereClause = 'WHERE is_draft = 0'
  }
  
  if (search) {
    whereClause = whereClause ? `${whereClause} AND (name LIKE ? OR description LIKE ?)` : 'WHERE (name LIKE ? OR description LIKE ?)'
    params.push(`%${search}%`, `%${search}%`)
  }
  
  params.push(limit, offset)
  
  const query = `SELECT * FROM items ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`
  const result = await db.prepare(query).bind(...params).all()
  
  if (!result.results) return []
  
  return result.results.map(rowToItem)
}

export async function getItemById(db: D1Database, id: string): Promise<Item | null> {
  const result = await db.prepare('SELECT * FROM items WHERE id = ?').bind(id).first()
  if (!result) return null
  return rowToItem(result)
}

export async function createItem(db: D1Database, item: Omit<Item, 'createdAt' | 'updatedAt'>): Promise<Item> {
  await db.prepare(`
    INSERT INTO items (
      id, name, description, photos, base_price_yen, base_price_rp, selling_price, weight_grams,
      without_box_note, is_limited_edition, is_preorder, is_fragile, category, info_notes,
      max_orders, current_orders, is_available, is_draft
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    item.id,
    item.name,
    item.description,
    JSON.stringify(item.photos),
    item.basePriceYen,
    item.basePriceRp,
    item.sellingPriceRp,
    item.weightGrams,
    item.withoutBoxNote ? 1 : 0,
    item.isLimitedEdition ? 1 : 0,
    item.isPreorder ? 1 : 0,
    item.isFragile ? 1 : 0,
    item.category,
    JSON.stringify(item.infoNotes || []),
    item.maxOrders,
    item.currentOrders,
    item.isAvailable ? 1 : 0,
    item.isDraft ? 1 : 0
  ).run()
  
  return getItemById(db, item.id) as Promise<Item>
}

export async function updateItem(
  db: D1Database,
  id: string,
  updates: Partial<Omit<Item, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<Item | null> {
  const fields: string[] = []
  const values: (string | number | null)[] = []
  
  if (updates.name !== undefined) {
    fields.push('name = ?')
    values.push(updates.name)
  }
  if (updates.description !== undefined) {
    fields.push('description = ?')
    values.push(updates.description)
  }
  if (updates.photos !== undefined) {
    fields.push('photos = ?')
    values.push(JSON.stringify(updates.photos))
  }
  if (updates.basePriceYen !== undefined) {
    fields.push('base_price_yen = ?')
    values.push(updates.basePriceYen)
  }
  if (updates.basePriceRp !== undefined) {
    fields.push('base_price_rp = ?')
    values.push(updates.basePriceRp)
  }
  if (updates.sellingPriceRp !== undefined) {
    fields.push('selling_price = ?')
    values.push(updates.sellingPriceRp)
  }
  if (updates.weightGrams !== undefined) {
    fields.push('weight_grams = ?')
    values.push(updates.weightGrams)
  }
  if (updates.withoutBoxNote !== undefined) {
    fields.push('without_box_note = ?')
    values.push(updates.withoutBoxNote ? 1 : 0)
  }
  if (updates.isLimitedEdition !== undefined) {
    fields.push('is_limited_edition = ?')
    values.push(updates.isLimitedEdition ? 1 : 0)
  }
  if (updates.isPreorder !== undefined) {
    fields.push('is_preorder = ?')
    values.push(updates.isPreorder ? 1 : 0)
  }
  if (updates.isFragile !== undefined) {
    fields.push('is_fragile = ?')
    values.push(updates.isFragile ? 1 : 0)
  }
  if (updates.category !== undefined) {
    fields.push('category = ?')
    values.push(updates.category)
  }
  if (updates.infoNotes !== undefined) {
    fields.push('info_notes = ?')
    values.push(JSON.stringify(updates.infoNotes))
  }
  if (updates.maxOrders !== undefined) {
    fields.push('max_orders = ?')
    values.push(updates.maxOrders)
  }
  if (updates.currentOrders !== undefined) {
    fields.push('current_orders = ?')
    values.push(updates.currentOrders)
  }
  if (updates.isAvailable !== undefined) {
    fields.push('is_available = ?')
    values.push(updates.isAvailable ? 1 : 0)
  }
  if (updates.isDraft !== undefined) {
    fields.push('is_draft = ?')
    values.push(updates.isDraft ? 1 : 0)
  }
  if (updates.viewCount !== undefined) {
    fields.push('view_count = ?')
    values.push(updates.viewCount)
  }
  
  if (fields.length === 0) return getItemById(db, id)
  
  values.push(id)
  
  const query = `UPDATE items SET ${fields.join(', ')} WHERE id = ?`
  await db.prepare(query).bind(...values).run()
  
  return getItemById(db, id)
}

export async function deleteItem(db: D1Database, id: string, force = false): Promise<boolean> {
  if (force) {
    await db.prepare('DELETE FROM items WHERE id = ?').bind(id).run()
  } else {
    await db.prepare('UPDATE items SET is_available = 0 WHERE id = ?').bind(id).run()
  }
  return true
}

// Increment view count for an item
export async function incrementItemViewCount(db: D1Database, id: string): Promise<number | null> {
  await db.prepare(`
    UPDATE items SET view_count = view_count + 1 WHERE id = ?
  `).bind(id).run()
  
  const result = await db.prepare('SELECT view_count FROM items WHERE id = ?').bind(id).first()
  return result ? (result.view_count as number) : null
}

// Helper to convert DB row to Item type
function rowToItem(row: Record<string, unknown>): Item {
  return {
    id: row.id as string,
    name: row.name as string,
    description: row.description as string | null,
    photos: JSON.parse(row.photos as string) as string[],
    basePriceYen: row.base_price_yen as number,
    basePriceRp: (row.base_price_rp as number) || 0,
    sellingPriceRp: row.selling_price as number,
    weightGrams: row.weight_grams as number,
    withoutBoxNote: Boolean(row.without_box_note),
    isLimitedEdition: Boolean(row.is_limited_edition),
    isPreorder: Boolean(row.is_preorder),
    isFragile: Boolean(row.is_fragile),
    category: (row.category as Item['category']) || null,
    infoNotes: row.info_notes ? JSON.parse(row.info_notes as string) as Item['infoNotes'] : [],
    maxOrders: row.max_orders as number,
    currentOrders: row.current_orders as number,
    isAvailable: Boolean(row.is_available),
    isDraft: Boolean(row.is_draft),
    viewCount: (row.view_count as number) || 0,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  }
}

// Calculate remaining quota
export async function calculateRemainingQuota(db: D1Database): Promise<number> {
  const settings = await getSettings(db)
  if (!settings) return 0
  
  const result = await db.prepare(`
    SELECT COALESCE(SUM(weight_grams * current_orders), 0) as used
    FROM items
    WHERE is_available = 1 AND is_draft = 0
  `).first()
  
  const usedGrams = (result?.used as number) || 0
  return settings.totalBaggageQuotaGrams - usedGrams
}

// ============================================
// User queries
// ============================================

export async function getUserById(db: D1Database, id: string): Promise<User | null> {
  const result = await db.prepare('SELECT * FROM users WHERE id = ?').bind(id).first()
  if (!result) return null
  return rowToUser(result)
}

export async function getUserByGoogleId(db: D1Database, googleId: string): Promise<User | null> {
  const result = await db.prepare('SELECT * FROM users WHERE google_id = ?').bind(googleId).first()
  if (!result) return null
  return rowToUser(result)
}

export async function getUserByEmail(db: D1Database, email: string): Promise<User | null> {
  const result = await db.prepare('SELECT * FROM users WHERE email = ?').bind(email).first()
  if (!result) return null
  return rowToUser(result)
}

export async function createUser(
  db: D1Database,
  user: Omit<User, 'createdAt' | 'lastLoginAt' | 'isRevoked' | 'revokedAt' | 'revokedBy'>
): Promise<User> {
  const now = new Date().toISOString()
  
  await db.prepare(`
    INSERT INTO users (id, google_id, email, name, photo_url, token_id, is_revoked, revoked_at, revoked_by, created_at, last_login_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    user.id,
    user.googleId,
    user.email,
    user.name,
    user.photoUrl,
    user.tokenId,
    false,
    null,
    null,
    now,
    now
  ).run()
  
  return getUserById(db, user.id) as Promise<User>
}

export async function updateUserLoginTime(db: D1Database, id: string): Promise<void> {
  const now = new Date().toISOString()
  await db.prepare('UPDATE users SET last_login_at = ? WHERE id = ?').bind(now, id).run()
}

export async function revokeUser(
  db: D1Database,
  userId: string,
  revokedBy: string
): Promise<void> {
  const now = new Date().toISOString()
  await db.prepare(`
    UPDATE users 
    SET is_revoked = 1, revoked_at = ?, revoked_by = ?
    WHERE id = ?
  `).bind(now, revokedBy, userId).run()
}

function rowToUser(row: Record<string, unknown>): User {
  return {
    id: row.id as string,
    googleId: row.google_id as string,
    email: row.email as string,
    name: row.name as string,
    photoUrl: row.photo_url as string | null,
    tokenId: row.token_id as string | null,
    isRevoked: row.is_revoked === 1,
    revokedAt: row.revoked_at as string | null,
    revokedBy: row.revoked_by as string | null,
    createdAt: row.created_at as string,
    lastLoginAt: row.last_login_at as string,
  }
}

// ============================================
// Token queries
// ============================================

export async function getTokenById(db: D1Database, id: string): Promise<Token | null> {
  const result = await db.prepare('SELECT * FROM tokens WHERE id = ?').bind(id).first()
  if (!result) return null
  return rowToToken(result)
}

export async function getTokenByCode(db: D1Database, code: string): Promise<Token | null> {
  const result = await db.prepare('SELECT * FROM tokens WHERE code = ?').bind(code).first()
  if (!result) return null
  return rowToToken(result)
}

export async function createToken(
  db: D1Database,
  token: Omit<Token, 'createdAt' | 'usedAt' | 'usedBy'>
): Promise<Token> {
  const now = new Date().toISOString()
  
  await db.prepare(`
    INSERT INTO tokens (id, code, created_by, used_by, used_at, expires_at, is_revoked, created_at)
    VALUES (?, ?, ?, NULL, NULL, ?, ?, ?)
  `).bind(
    token.id,
    token.code,
    token.createdBy,
    token.expiresAt,
    token.isRevoked ? 1 : 0,
    now
  ).run()
  
  return getTokenById(db, token.id) as Promise<Token>
}

export async function markTokenAsUsed(
  db: D1Database,
  tokenId: string,
  userId: string
): Promise<void> {
  const now = new Date().toISOString()
  await db.prepare(`
    UPDATE tokens SET used_by = ?, used_at = ? WHERE id = ?
  `).bind(userId, now, tokenId).run()
}

export async function revokeToken(db: D1Database, id: string): Promise<void> {
  await db.prepare('UPDATE tokens SET is_revoked = 1 WHERE id = ?').bind(id).run()
}

export async function isTokenValid(db: D1Database, code: string): Promise<{ valid: boolean; token?: Token; error?: string }> {
  const token = await getTokenByCode(db, code)
  
  if (!token) {
    return { valid: false, error: 'Invalid token' }
  }
  
  if (token.isRevoked) {
    return { valid: false, token, error: 'Token has been revoked' }
  }
  
  if (token.usedBy) {
    return { valid: false, token, error: 'Token has already been used' }
  }
  
  if (token.expiresAt && new Date(token.expiresAt) < new Date()) {
    return { valid: false, token, error: 'Token has expired' }
  }
  
  return { valid: true, token }
}

function rowToToken(row: Record<string, unknown>): Token {
  return {
    id: row.id as string,
    code: row.code as string,
    createdBy: row.created_by as string,
    usedBy: row.used_by as string | null,
    usedAt: row.used_at as string | null,
    expiresAt: row.expires_at as string | null,
    isRevoked: Boolean(row.is_revoked),
    createdAt: row.created_at as string,
  }
}

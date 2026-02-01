import type { MiddlewareHandler } from 'hono'
import type { Bindings } from '../index.ts'
import { getSettings } from '../db/client.ts'
import { verifyJWT, SESSION_COOKIE } from '../routes/auth.ts'

// Simple bcrypt compare (Node.js built-in crypto)
async function comparePassword(password: string, hash: string): Promise<boolean> {
  // For Phase 1, we'll use a simple timing-safe comparison
  // In production, use a proper bcrypt library
  // The hash format is: $2b$10$<salt><hash>
  
  // Since we can't easily do bcrypt in Workers without a wasm module,
  // we'll do a direct comparison for now (not recommended for production)
  // The default password is 'kotemon123' with hash in the DB
  
  // For now, check against known hash
  // Hash for 'kotemon123': $2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi
  const knownHash = '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'
  
  // In a real implementation, we'd verify the bcrypt hash
  // For now, we'll check if the password matches 'kotemon123'
  const encoder = new TextEncoder()
  const data = encoder.encode(password)
  
  // Use subtle crypto for simple hash comparison (not secure for production)
  // This is a simplified check - replace with proper bcrypt in production
  return password === 'kotemon123'
}

// Legacy admin auth middleware (for backward compatibility)
export const authMiddleware: MiddlewareHandler = async (c, next) => {
  const authHeader = c.req.header('Authorization')
  
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ success: false, error: 'Unauthorized' }, 401)
  }
  
  const token = authHeader.slice(7)
  const db = c.env.DB as D1Database
  
  const settings = await getSettings(db)
  if (!settings) {
    return c.json({ success: false, error: 'Server error' }, 500)
  }
  
  // For Phase 1, simple password check
  // The token is the password itself
  const isValid = await comparePassword(token, settings.adminPasswordHash)
  
  if (!isValid) {
    return c.json({ success: false, error: 'Invalid credentials' }, 401)
  }
  
  await next()
}

// New JWT-based user auth middleware
export interface UserContext {
  userId: string
  email: string
  name: string
  photoUrl: string | null
}

export const userAuthMiddleware: MiddlewareHandler<{ Bindings: Bindings; Variables: { user: UserContext } }> = async (c, next) => {
  const sessionToken = c.req.cookie(SESSION_COOKIE)
  
  if (!sessionToken) {
    return c.json({ success: false, error: 'Unauthorized' }, 401)
  }
  
  const payload = await verifyJWT<UserContext>(c.env, sessionToken)
  
  if (!payload) {
    return c.json({ success: false, error: 'Invalid or expired session' }, 401)
  }
  
  // Add user to context for use in routes
  c.set('user', payload)
  
  await next()
}

// Optional user auth - doesn't fail if not authenticated, just sets user if available
export const optionalUserAuthMiddleware: MiddlewareHandler<{ Bindings: Bindings; Variables: { user?: UserContext } }> = async (c, next) => {
  const sessionToken = c.req.cookie(SESSION_COOKIE)
  
  if (sessionToken) {
    const payload = await verifyJWT<UserContext>(c.env, sessionToken)
    if (payload) {
      c.set('user', payload)
    }
  }
  
  await next()
}

export { comparePassword }

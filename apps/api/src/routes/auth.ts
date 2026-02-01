import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { SignJWT, jwtVerify } from 'jose'
import type { Bindings } from '../index.js'
import type { GoogleUserInfo, TempOAuthSession } from '../types.ts'
import {
  getUserByGoogleId,
  getUserById,
  createUser,
  updateUserLoginTime,
  isTokenValid,
  markTokenAsUsed,
} from '../db/client.ts'

const authRoutes = new Hono<{ Bindings: Bindings }>()

// Environment variables (set in wrangler.toml or secrets)
const GOOGLE_CLIENT_ID = '738635943854-58oaehg7i2ghd6ec6ekfh906ppi76ls3.apps.googleusercontent.com'
const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth'
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token'
const GOOGLE_USERINFO_URL = 'https://www.googleapis.com/oauth2/v3/userinfo'

// Cookie names
const SESSION_COOKIE = 'jastip_session'
const TEMP_SESSION_COOKIE = 'jastip_temp_session'

// Helper: Get JWT secret from environment
function getJWTSecret(env: Bindings): Uint8Array {
  const secret = (env as unknown as Record<string, string>).JWT_SECRET || 'dev-secret-change-in-production'
  return new TextEncoder().encode(secret)
}

// Helper: Create session JWT
async function createSessionJWT(
  env: Bindings,
  payload: { userId: string; email: string; name: string; photoUrl: string | null }
): Promise<string> {
  const secret = getJWTSecret(env)
  const now = Math.floor(Date.now() / 1000)
  
  return new SignJWT({
    userId: payload.userId,
    email: payload.email,
    name: payload.name,
    photoUrl: payload.photoUrl,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt(now)
    .setExpirationTime(now + 7 * 24 * 60 * 60) // 7 days
    .sign(secret)
}

// Helper: Create temp session JWT (for new users before token verification)
async function createTempSessionJWT(
  env: Bindings,
  payload: TempOAuthSession
): Promise<string> {
  const secret = getJWTSecret(env)
  const now = Math.floor(Date.now() / 1000)
  
  return new SignJWT({
    type: 'temp',
    googleId: payload.googleId,
    email: payload.email,
    name: payload.name,
    photoUrl: payload.photoUrl,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt(now)
    .setExpirationTime(now + 60 * 60) // 1 hour temp session
    .sign(secret)
}

// Helper: Verify JWT
async function verifyJWT<T>(env: Bindings, token: string): Promise<T | null> {
  try {
    const secret = getJWTSecret(env)
    const { payload } = await jwtVerify(token, secret)
    return payload as T
  } catch {
    return null
  }
}

// Helper: Generate OAuth state parameter (includes frontend URL)
function generateState(frontendUrl: string): string {
  const stateData = {
    nonce: crypto.randomUUID(),
    frontend: frontendUrl,
  }
  return btoa(JSON.stringify(stateData))
}

// Helper: Parse OAuth state parameter
function parseState(state: string): { nonce: string; frontend: string } | null {
  try {
    return JSON.parse(atob(state))
  } catch {
    return null
  }
}

// Helper: Build Google OAuth URL
function buildGoogleAuthUrl(state: string, redirectUri: string): string {
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    state: state,
    access_type: 'online',
    prompt: 'consent',
  })
  
  return `${GOOGLE_AUTH_URL}?${params.toString()}`
}

// Helper: Exchange code for tokens
async function exchangeCodeForTokens(
  code: string,
  redirectUri: string,
  clientSecret: string
): Promise<{ access_token: string; id_token: string } | null> {
  try {
    const response = await fetch(GOOGLE_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    })
    
    if (!response.ok) {
      const error = await response.text()
      console.error('Token exchange failed:', error)
      return null
    }
    
    const data = await response.json() as { access_token: string; id_token: string }
    return data
  } catch (error) {
    console.error('Error exchanging code:', error)
    return null
  }
}

// Helper: Get user info from Google
async function getGoogleUserInfo(accessToken: string): Promise<GoogleUserInfo | null> {
  try {
    const response = await fetch(GOOGLE_USERINFO_URL, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })
    
    if (!response.ok) {
      const error = await response.text()
      console.error('Failed to get user info:', error)
      return null
    }
    
    return await response.json() as GoogleUserInfo
  } catch (error) {
    console.error('Error getting user info:', error)
    return null
  }
}

// GET /api/auth/google - Initiate OAuth flow
authRoutes.get('/google', async (c) => {
  const env = c.env
  const clientSecret = (env as unknown as Record<string, string>).GOOGLE_CLIENT_SECRET
  
  if (!clientSecret) {
    console.error('GOOGLE_CLIENT_SECRET not configured')
    return c.json({ success: false, error: 'OAuth not configured' }, 500)
  }
  
  // Get frontend URL from query param
  const frontendUrl = c.req.query('frontend') || 'https://jastip.dkotama.com'
  
  // Use the actual request URL host for the callback
  // This ensures the redirect_uri matches what Google will call back to
  const url = new URL(c.req.url)
  console.log(`[OAuth Init] Request URL: ${c.req.url}, frontend: ${frontendUrl}`)
  
  // Determine if this is a local/dev environment
  const isLocalhost = url.hostname === 'localhost' || url.hostname === '10.0.0.1' || url.hostname === '127.0.0.1'
  
  // OAuth redirect URI must match what Google will send back
  // Use the actual request host (what Google calls back to)
  const redirectUri = isLocalhost
    ? `http://${url.host}/api/auth/google/callback`
    : `https://jastip.dkotama.com/api/auth/google/callback`
  
  console.log(`[OAuth Init] Using redirectUri: ${redirectUri}`)
  
  // Encode frontend URL in state (avoids cookie domain issues)
  const state = generateState(frontendUrl)
  const authUrl = buildGoogleAuthUrl(state, redirectUri)
  
  // Store state in cookie for verification (optional, as backup)
  c.header('Location', authUrl)
  c.header('Set-Cookie', `oauth_state=${state}; Path=/api/auth; HttpOnly; SameSite=Lax; Max-Age=600${!isLocalhost ? '; Secure' : ''}`)
  
  return c.body(null, 302)
})

// GET /api/auth/google/callback - Handle OAuth callback
authRoutes.get('/google/callback', async (c) => {
  const env = c.env
  const db = env.DB
  const clientSecret = (env as unknown as Record<string, string>).GOOGLE_CLIENT_SECRET
  
  console.log(`[OAuth Callback] Received request: ${c.req.url}`)
  
  if (!clientSecret) {
    return c.json({ success: false, error: 'OAuth not configured' }, 500)
  }
  
  // Get code, state, and error from query
  const code = c.req.query('code')
  const state = c.req.query('state')
  const error = c.req.query('error')
  
  // Parse state to get frontend URL (avoids cookie domain issues)
  const stateData = state ? parseState(state) : null
  const frontendUrl = stateData?.frontend || 'https://jastip.dkotama.com'
  const baseRedirect = frontendUrl || '/'
  
  console.log(`[OAuth Callback] frontendUrl: ${frontendUrl}`)
  
  // Handle OAuth errors
  if (error) {
    console.error('OAuth error:', error)
    return c.redirect(`${baseRedirect}?error=oauth_denied`)
  }
  
  if (!code) {
    return c.redirect(`${baseRedirect}?error=missing_code`)
  }
  
  // Determine redirect URI (must match the one used in /google)
  // IMPORTANT: Must match exactly what was sent to Google, including hostname
  const url = new URL(c.req.url)
  console.log(`[OAuth Callback] Request URL host: ${url.host}`)
  
  // Use the actual request hostname for the redirect URI to match what Google sees
  const isLocalhost = url.hostname === 'localhost' || url.hostname === '127.0.0.1'
  const redirectUri = isLocalhost
    ? `http://${url.host}/api/auth/google/callback`
    : `https://jastip.dkotama.com/api/auth/google/callback`
  
  console.log(`[OAuth Callback] Using redirectUri: ${redirectUri}`)
  
  // Exchange code for tokens
  const tokens = await exchangeCodeForTokens(code, redirectUri, clientSecret)
  if (!tokens) {
    return c.redirect(`${baseRedirect}?error=token_exchange_failed`)
  }
  
  // Get user info from Google
  const googleUser = await getGoogleUserInfo(tokens.access_token)
  if (!googleUser) {
    return c.redirect(`${baseRedirect}?error=user_info_failed`)
  }
  
  // Check if email is verified
  if (!googleUser.email_verified) {
    return c.redirect(`${baseRedirect}?error=email_not_verified`)
  }
  
  // Check if user already exists
  const existingUser = await getUserByGoogleId(db, googleUser.sub)
  console.log(`[OAuth Callback] existingUser: ${existingUser ? existingUser.email : 'null'}`)
  
  if (existingUser) {
    // User exists - update login time and create session
    await updateUserLoginTime(db, existingUser.id)
    
    const sessionToken = await createSessionJWT(env, {
      userId: existingUser.id,
      email: existingUser.email,
      name: existingUser.name,
      photoUrl: existingUser.photoUrl,
    })
    
    console.log(`[OAuth] Existing user ${existingUser.email}, redirecting to ${baseRedirect}?token=...`)
    
    // Also set cookie for same-origin requests, but pass token in URL for cross-origin
    c.header('Location', `${baseRedirect}?token=${sessionToken}`)
    c.header('Set-Cookie', `${SESSION_COOKIE}=${sessionToken}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${7 * 24 * 60 * 60}${!isLocalhost ? '; Secure' : ''}`)
    
    return c.body(null, 302)
  }
  
  // New user - create temp session and redirect to token verification
  console.log(`[OAuth] New user ${googleUser.email}, creating temp session`)
  const tempSession: TempOAuthSession = {
    googleId: googleUser.sub,
    email: googleUser.email,
    name: googleUser.name,
    photoUrl: googleUser.picture || null,
  }
  
  const tempToken = await createTempSessionJWT(env, tempSession)
  
  const redirectUrl = `${baseRedirect}/verify-token?tempToken=${tempToken}`
  console.log(`[OAuth] Redirecting new user to: ${redirectUrl}`)
  
  // Pass temp token in URL for cross-origin, also set cookie
  c.header('Location', redirectUrl)
  c.header('Set-Cookie', `${TEMP_SESSION_COOKIE}=${tempToken}; Path=/api/auth; HttpOnly; SameSite=Lax; Max-Age=3600${!isLocalhost ? '; Secure' : ''}`)
  
  return c.body(null, 302)
})

// POST /api/auth/verify-token - Verify invite token and create user
const verifyTokenSchema = z.object({
  token: z.string().min(1),
  tempToken: z.string().optional(), // For cross-origin scenarios
})

authRoutes.post('/verify-token', zValidator('json', verifyTokenSchema), async (c) => {
  const env = c.env
  const db = env.DB
  const { token: inviteCode, tempToken: bodyTempToken } = c.req.valid('json')
  
  // Get temp session from cookie or request body (for cross-origin)
  const tempToken = c.req.cookie(TEMP_SESSION_COOKIE) || bodyTempToken
  if (!tempToken) {
    return c.json({ success: false, error: 'Session expired. Please try logging in again.' }, 401)
  }
  
  // Verify temp session
  const tempSession = await verifyJWT<TempOAuthSession & { type: string }>(env, tempToken)
  if (!tempSession || tempSession.type !== 'temp') {
    return c.json({ success: false, error: 'Invalid session. Please try logging in again.' }, 401)
  }
  
  // Validate invite token
  const tokenCheck = await isTokenValid(db, inviteCode.toUpperCase().trim())
  if (!tokenCheck.valid) {
    return c.json({
      success: false,
      error: tokenCheck.error || 'Invalid token',
    }, 400)
  }
  
  const inviteToken = tokenCheck.token!
  
  // Create new user
  const userId = crypto.randomUUID()
  const user = await createUser(db, {
    id: userId,
    googleId: tempSession.googleId,
    email: tempSession.email,
    name: tempSession.name,
    photoUrl: tempSession.photoUrl,
    tokenId: inviteToken.id,
  })
  
  // Mark token as used
  await markTokenAsUsed(db, inviteToken.id, userId)
  
  // Create session JWT
  const sessionToken = await createSessionJWT(env, {
    userId: user.id,
    email: user.email,
    name: user.name,
    photoUrl: user.photoUrl,
  })
  
  // Determine if localhost
  const url = new URL(c.req.url)
  const isLocalhost = url.hostname === 'localhost' || url.hostname === '10.0.0.1'
  
  // Clear temp cookie and set session cookie
  const clearTempCookie = `${TEMP_SESSION_COOKIE}=; Path=/api/auth; HttpOnly; SameSite=Lax; Max-Age=0${!isLocalhost ? '; Secure' : ''}`
  const sessionCookie = `${SESSION_COOKIE}=${sessionToken}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${7 * 24 * 60 * 60}${!isLocalhost ? '; Secure' : ''}`
  
  c.header('Set-Cookie', clearTempCookie)
  c.header('Set-Cookie', sessionCookie)
  
  return c.json({
    success: true,
    data: {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        photoUrl: user.photoUrl,
      },
    },
  })
})

// POST /api/auth/logout - Clear session
authRoutes.post('/logout', async (c) => {
  const url = new URL(c.req.url)
  const isLocalhost = url.hostname === 'localhost' || url.hostname === '10.0.0.1'
  
  const clearCookie = `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${!isLocalhost ? '; Secure' : ''}`
  c.header('Set-Cookie', clearCookie)
  
  return c.json({ success: true })
})

// GET /api/auth/me - Get current user info
authRoutes.get('/me', async (c) => {
  const sessionToken = c.req.cookie(SESSION_COOKIE)
  if (!sessionToken) {
    return c.json({ success: false, error: 'Not authenticated' }, 401)
  }
  
  const payload = await verifyJWT<{
    userId: string
    email: string
    name: string
    photoUrl: string | null
  }>(c.env, sessionToken)
  
  if (!payload) {
    return c.json({ success: false, error: 'Invalid session' }, 401)
  }
  
  // Check if user is revoked
  const db = c.env.DB
  const user = await getUserById(db, payload.userId)
  if (user?.isRevoked) {
    return c.json({ success: false, error: 'Account access has been revoked' }, 403)
  }
  
  return c.json({
    success: true,
    data: {
      user: {
        id: payload.userId,
        email: payload.email,
        name: payload.name,
        photoUrl: payload.photoUrl,
      },
    },
  })
})

// GET /api/auth/status - Check if user is authenticated (used by frontend)
authRoutes.get('/status', async (c) => {
  const sessionToken = c.req.cookie(SESSION_COOKIE)
  
  if (!sessionToken) {
    return c.json({
      success: true,
      data: { authenticated: false },
    })
  }
  
  const payload = await verifyJWT<{ userId: string; name: string }>(c.env, sessionToken)
  
  if (!payload) {
    return c.json({
      success: true,
      data: { authenticated: false },
    })
  }
  
  // Check if user is revoked
  const db = c.env.DB
  const user = await getUserById(db, payload.userId)
  if (user?.isRevoked) {
    return c.json({
      success: true,
      data: { authenticated: false, revoked: true },
    })
  }
  
  return c.json({
    success: true,
    data: {
      authenticated: true,
      user: {
        id: payload.userId,
        name: payload.name,
      },
    },
  })
})

// POST /api/auth/test/mock-oauth - Mock OAuth callback for local testing (DEVELOPMENT ONLY)
authRoutes.post('/test/mock-oauth', async (c) => {
  const env = c.env
  const db = env.DB
  const url = new URL(c.req.url)
  const isLocalhost = url.hostname === 'localhost' || url.hostname === '10.0.0.1' || url.hostname === '127.0.0.1'
  
  if (!isLocalhost) {
    return c.json({ success: false, error: 'Test endpoint only available on localhost' }, 403)
  }
  
  // Generate mock Google user data
  const mockGoogleUser = {
    sub: `mock-google-${crypto.randomUUID()}`,
    email: `test-${Date.now()}@example.com`,
    name: 'Test User',
    picture: 'https://example.com/avatar.jpg',
    email_verified: true,
  }
  
  // Check if user exists
  const existingUser = await getUserByGoogleId(db, mockGoogleUser.sub)
  
  if (existingUser) {
    // User exists - update login time and create session
    await updateUserLoginTime(db, existingUser.id)
    
    const sessionToken = await createSessionJWT(env, {
      userId: existingUser.id,
      email: existingUser.email,
      name: existingUser.name,
      photoUrl: existingUser.photoUrl,
    })
    
    return c.json({
      success: true,
      data: {
        message: 'Existing user logged in',
        user: {
          id: existingUser.id,
          email: existingUser.email,
          name: existingUser.name,
          photoUrl: existingUser.photoUrl,
        },
        sessionToken,
      },
    })
  }
  
  // New user - create temp session and return temp token
  const tempSession: TempOAuthSession = {
    googleId: mockGoogleUser.sub,
    email: mockGoogleUser.email,
    name: mockGoogleUser.name,
    photoUrl: mockGoogleUser.picture,
  }
  
  const tempToken = await createTempSessionJWT(env, tempSession)
  
  return c.json({
    success: true,
    data: {
      message: 'New user - needs token verification',
      tempToken,
      user: tempSession,
    },
  })
})

// Export verification function for use in middleware
export { verifyJWT, SESSION_COOKIE }
export type { JWTPayload }

interface JWTPayload {
  userId: string
  email: string
  name: string
  photoUrl: string | null
  iat: number
  exp: number
}

export { authRoutes }

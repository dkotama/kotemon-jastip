import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { publicRoutes } from './routes/public.js'
import { adminRoutes } from './routes/admin.js'
import { authRoutes } from './routes/auth.js'
import orders from './routes/orders.js'

// Environment bindings type
export type Bindings = {
  DB: D1Database
  PHOTOS_BUCKET: R2Bucket
  JWT_SECRET: string
  GOOGLE_CLIENT_SECRET: string
}

const app = new Hono<{ Bindings: Bindings }>()

// Middleware
app.use(logger())

// Handle CORS preflight for all routes
app.options('*', (c) => {
  const origin = c.req.header('Origin')
  const allowedOrigins = ['http://localhost:5173', 'http://10.0.0.1:5173', 'https://kotemon-jastip.pages.dev']

  if (origin && allowedOrigins.includes(origin)) {
    c.header('Access-Control-Allow-Origin', origin)
    c.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS')
    c.header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    c.header('Access-Control-Allow-Credentials', 'true')
  }

  return c.body(null, 204)
})

app.use(cors({
  origin: ['http://localhost:5173', 'http://10.0.0.1:5173', 'https://kotemon-jastip.pages.dev'],
  allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}))

// Health check
app.get('/health', (c) => c.json({ success: true, message: 'OK' }))

// Routes
app.route('/api/public', publicRoutes)
app.route('/api/admin', adminRoutes)
app.route('/api/auth', authRoutes)
app.route('/api/orders', orders)

// 404 handler
app.notFound((c) => c.json({ success: false, error: 'Not Found' }, 404))

// Error handler
app.onError((err, c) => {
  console.error('Error:', err)
  return c.json({ success: false, error: 'Internal Server Error' }, 500)
})

export default app

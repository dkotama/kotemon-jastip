# Phase 1 Implementation Plan

## Pre-Development Setup Checklist

### 1. Cloudflare Account Setup

**Required:**
- [ ] Cloudflare account (free tier sufficient)
- [ ] Domain added to Cloudflare (or use `*.pages.dev`)

**Services to Enable:**
- [ ] **R2 Bucket** — For product photos
  - Bucket name: `kotemon-jastip-photos` (or similar)
  - CORS policy: Allow GET from your domain
  - Public access: Off (use signed URLs via Worker)
  
- [ ] **D1 Database** — For all data
  - Database name: `kotemon-jastip-db`
  - Location: Asia-Pacific (APAC) for lowest latency to Indonesia
  
- [ ] **Pages Project** — For React frontend
  - Project name: `kotemon-jastip`
  - Build command: `npm run build`
  - Output directory: `dist` (or `build`)

- [ ] **Worker** — For API backend
  - Worker name: `kotemon-jastip-api`
  - Bind to D1 and R2

### 2. Environment Variables

**Cloudflare Worker Secrets (via Dashboard or Wrangler):**
```bash
# D1 Binding (auto-configured when binding database)
# D1_DATABASE_ID=xxx

# R2 Binding (auto-configured when binding bucket)
# R2_BUCKET_NAME=kotemon-jastip-photos

# Admin Auth
ADMIN_PASSWORD_HASH=bcrypt_hash_of_your_password

# App Settings (defaults, can be overridden in DB)
DEFAULT_EXCHANGE_RATE=108.5
DEFAULT_MARGIN_PERCENT=30
DEFAULT_BAGGAGE_QUOTA_GRAMS=20000
```

**Frontend Environment (Build-time):**
```bash
VITE_API_BASE_URL=https://kotemon-jastip-api.your-account.workers.dev
```

### 3. Local Development Setup

**Prerequisites:**
```bash
# Install Node.js 20+
node --version  # v20.x.x

# Install Wrangler CLI
npm install -g wrangler

# Authenticate with Cloudflare
wrangler login
```

**Project Structure:**
```
kotemon-jastip/
├── apps/
│   ├── web/                    # React + Vite frontend
│   │   ├── src/
│   │   ├── public/
│   │   ├── package.json
│   │   └── vite.config.ts
│   └── api/                    # Cloudflare Worker
│       ├── src/
│       │   ├── index.ts        # Worker entry
│       │   ├── routes/         # API routes
│       │   ├── db/             # D1 queries
│       │   └── utils/          # Helpers
│       ├── migrations/         # D1 migrations
│       ├── wrangler.toml
│       └── package.json
├── package.json                # Root workspace config
└── README.md
```

### 4. D1 Database Migrations

**Migration 001 - Initial Schema:**
```sql
-- settings table
CREATE TABLE settings (
  id TEXT PRIMARY KEY DEFAULT 'default',
  exchange_rate REAL NOT NULL DEFAULT 108.5,
  default_margin_percent INTEGER NOT NULL DEFAULT 30,
  total_baggage_quota_grams INTEGER NOT NULL DEFAULT 20000,
  jastip_status TEXT NOT NULL DEFAULT 'closed' CHECK (jastip_status IN ('open', 'closed')),
  jastip_close_date TEXT,
  estimated_arrival_date TEXT,
  admin_password_hash TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Insert default settings (replace hash with your bcrypt password)
INSERT INTO settings (admin_password_hash) VALUES ('$2b$10$...');

-- items table
CREATE TABLE items (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  photos TEXT NOT NULL, -- JSON array
  base_price_yen INTEGER NOT NULL,
  selling_price INTEGER NOT NULL,
  weight_grams INTEGER NOT NULL,
  without_box_note INTEGER NOT NULL DEFAULT 0,
  is_limited_edition INTEGER NOT NULL DEFAULT 0,
  is_preorder INTEGER NOT NULL DEFAULT 0,
  is_fragile INTEGER NOT NULL DEFAULT 0,
  max_orders INTEGER NOT NULL DEFAULT 10,
  current_orders INTEGER NOT NULL DEFAULT 0,
  is_available INTEGER NOT NULL DEFAULT 1,
  is_draft INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- indexes
CREATE INDEX idx_items_available ON items(is_available, is_draft) WHERE is_available = 1 AND is_draft = 0;
CREATE INDEX idx_items_search ON items(name, description);
```

**Apply Migration:**
```bash
cd apps/api
wrangler d1 migrations apply kotemon-jastip-db --local    # Local dev
wrangler d1 migrations apply kotemon-jastip-db              # Production
```

### 5. R2 Bucket Configuration

**CORS Policy (via Cloudflare Dashboard or API):**
```json
[
  {
    "AllowedOrigins": ["https://kotemon-jastip.pages.dev", "http://localhost:5173"],
    "AllowedMethods": ["GET", "PUT"],
    "AllowedHeaders": ["*"],
    "MaxAgeSeconds": 3600
  }
]
```

### 6. Wrangler Configuration

**apps/api/wrangler.toml:**
```toml
name = "kotemon-jastip-api"
main = "src/index.ts"
compatibility_date = "2025-01-01"

# D1 Database
[[d1_databases]]
binding = "DB"
database_name = "kotemon-jastip-db"
database_id = "your-d1-database-id"

# R2 Bucket
[[r2_buckets]]
binding = "PHOTOS_BUCKET"
bucket_name = "kotemon-jastip-photos"

# Environment Variables
[vars]
DEFAULT_EXCHANGE_RATE = "108.5"
DEFAULT_MARGIN_PERCENT = "30"
DEFAULT_BAGGAGE_QUOTA_GRAMS = "20000"

# Secrets (set via wrangler secret put)
# ADMIN_PASSWORD_HASH
```

## Development Order

### Sprint 1: Infrastructure & API Foundation
1. Set up monorepo structure (pnpm workspaces)
2. Configure Wrangler, D1, R2 bindings
3. Create database migrations
4. Build core API utilities (DB client, R2 client, auth middleware)
5. Implement Settings CRUD API
6. Implement Items CRUD API (admin)
7. Implement Public Items API (with search, filters)

### Sprint 2: Frontend Foundation
1. Set up React + Vite + Tailwind + DaisyUI
2. Build layout components (Header, Footer, Navigation)
3. Build API client (fetch wrapper)
4. Implement Landing Page (public view)
5. Implement Admin Login
6. Implement Admin Item List & Forms

### Sprint 3: Polish & Deploy
1. Photo upload to R2
2. Info boxes (tanpa box, limited edition, etc.)
3. Fake viewers count
4. Mobile responsiveness
5. Deploy to Cloudflare
6. Test end-to-end

## Tech Stack Versions

| Package | Version |
|---------|---------|
| React | ^18.2.0 |
| Vite | ^5.0.0 |
| Tailwind CSS | ^3.4.0 |
| DaisyUI | ^4.0.0 |
| React Router | ^6.20.0 |
| Hono | ^3.12.0 |
| @valuemelody/auth | ^1.x |
| Wrangler | ^3.0.0 |
| TypeScript | ^5.3.0 |

## Backend Architecture (Hono + @valuemelody/auth)

### Hono Route Structure
```typescript
// apps/api/src/index.ts
import { Hono } from 'hono'
import { authMiddleware } from './middleware/auth'

const app = new Hono()

// Public routes
app.get('/api/public/config', getPublicConfig)
app.get('/api/public/items', getPublicItems)

// Admin routes (protected)
app.use('/api/admin/*', authMiddleware)
app.get('/api/admin/items', getAdminItems)
app.post('/api/admin/items', createItem)
app.patch('/api/admin/items/:id', updateItem)
app.delete('/api/admin/items/:id', deleteItem)
app.post('/api/admin/upload', uploadPhoto)
app.get('/api/admin/settings', getSettings)
app.patch('/api/admin/settings', updateSettings)

export default app
```

### Auth Setup (@valuemelody/auth)

**Phase 1: Admin Password Auth**
```typescript
// Using @valuemelody/auth for password verification
import { Auth } from '@valuemelody/auth'

const auth = new Auth({
  adapter: 'cf-wokers-kv', // or custom D1 adapter
  secret: env.AUTH_SECRET,
})

// Admin login
const valid = await auth.password.verify(
  inputPassword, 
  storedHash // from D1 settings
)
```

**Phase 2: Google OAuth**
```typescript
// @valuemelody/auth built-in Google provider
const google = auth.provider('google', {
  clientId: env.GOOGLE_CLIENT_ID,
  clientSecret: env.GOOGLE_CLIENT_SECRET,
  redirectUri: 'https://api.kotemon-jastip.workers.dev/api/auth/google/callback'
})

// Handle OAuth callback
app.get('/api/auth/google/callback', async (c) => {
  const { user, tokens } = await google.callback(c.req.query('code'))
  // user.email, user.name, user.picture, user.sub (Google ID)
  
  // Check if new user -> show token verification
  // If existing -> issue JWT session
})
```

### Hono Middleware

```typescript
// Admin auth middleware
export const authMiddleware = async (c, next) => {
  const authHeader = c.req.header('Authorization')
  
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401)
  }
  
  const token = authHeader.slice(7)
  const valid = await verifyAdminToken(token, c.env) // Custom or @valuemelody/auth
  
  if (!valid) {
    return c.json({ error: 'Invalid token' }, 401)
  }
  
  await next()
}
```

### Hono + D1 Binding

```typescript
// Type definitions for Cloudflare bindings
type Bindings = {
  DB: D1Database
  PHOTOS_BUCKET: R2Bucket
  AUTH_SECRET: string
  ADMIN_PASSWORD_HASH: string
  GOOGLE_CLIENT_ID: string
  GOOGLE_CLIENT_SECRET: string
}

const app = new Hono<{ Bindings: Bindings }>()

// Access D1 in route
app.get('/api/public/items', async (c) => {
  const db = c.env.DB
  const items = await db.prepare('SELECT * FROM items WHERE is_draft = 0').all()
  return c.json({ success: true, data: items })
})
```

## Commands Reference

```bash
# Development
pnpm dev          # Start frontend + worker locally
pnpm dev:web      # Frontend only (Vite)
pnpm dev:api      # Worker only (Wrangler)

# Database
pnpm db:migrate   # Apply D1 migrations
pnpm db:studio    # View D1 data (if using drizzle-kit)

# Deploy
pnpm deploy:api   # Deploy Worker
pnpm deploy:web   # Deploy to Pages
```

## Testing Checklist (MVP)

**Core Logic:**
- [ ] Price calculation: ¥500 × 108.5 = Rp 54,250
- [ ] Selling price with 30% margin: Rp 54,250 × 1.3 = Rp 70,525
- [ ] Quota calculation: 20kg - sum(order weights)
- [ ] Draft items excluded from public API
- [ ] Search filters items by name and description

**Admin Auth:**
- [ ] Wrong password rejected
- [ ] Correct password grants access
- [ ] Admin endpoints reject without auth

**File Upload:**
- [ ] Photos upload to R2
- [ ] Thumbnails generated
- [ ] Public URLs accessible

**UI:**
- [ ] Landing page responsive (mobile → desktop)
- [ ] Info boxes display correctly
- [ ] Fake viewers count randomizes
- [ ] Countdown shows days until close

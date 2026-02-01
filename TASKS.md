# Phase 1: Core System - Implementation Tasks

**Goal:** Build the foundation of Kotemon Jastip with public landing page, admin catalog management, and service controls.

**Tech Stack:** React + Vite + Tailwind + DaisyUI | Hono.js | Cloudflare Workers + D1 + R2 | @valuemelody/auth

**D1 Database ID:** `38c029c2-b43a-4edc-8f94-cb2af02d7d85`
**R2 Bucket:** `kotemon-jastip-photos`
**Worker Name:** `kotemon-jastip`

---

## Infrastructure & Setup

- [x] **1.1 Project Initialization**
  - [x] Create monorepo structure with pnpm workspaces
  - [x] Initialize `apps/web` (React + Vite)
  - [x] Initialize `apps/api` (Hono.js Worker)
  - [x] Configure TypeScript for both apps
  - [x] Set up shared types package (`packages/types`)

- [x] **1.2 Wrangler Configuration**
  - [x] Create `wrangler.toml` with D1 binding (`kotemon_jastip_db`)
  - [x] Create `wrangler.toml` with R2 binding (`kotemon_jastip_photos`)
  - [x] Add environment variables (exchange rate defaults)
  - [ ] Configure custom domain (optional)

- [x] **1.3 Database Setup**
  - [x] Create migration file `0001_initial.sql`
  - [x] Apply migration to local D1 (`wrangler d1 migrations apply --local`)
  - [x] Apply migration to production D1
  - [x] Seed default settings (exchange rate 108.5, margin 30%, quota 20kg, admin password hash)

---

## Backend API (Hono.js)

### Core Setup

- [x] **2.1 Hono App Structure**
  - [x] Create `src/index.ts` with Hono instance
  - [x] Set up Cloudflare bindings types (D1, R2, secrets)
  - [x] Create error handling middleware
  - [x] Create CORS middleware for Pages ↔ Worker communication

- [x] **2.2 Database Client**
  - [x] Create `src/db/client.ts` with D1 wrapper
  - [x] Create query builders for settings and items
  - [x] Add transaction support for atomic operations

### Public Endpoints (No Auth)

- [x] **2.3 GET /api/public/config**
  - [x] Return jastip status, countdown days, quota (remaining/total), estimated arrival date
  - [x] Calculate remaining quota from orders (sum weight)
  - [x] Format dates and weights for display

- [x] **2.4 GET /api/public/items**
  - [x] Query params: `search` (optional), `limit` (default 20), `offset` (default 0)
  - [x] Filter: `is_available = 1 AND is_draft = 0`
  - [x] Search: `name LIKE %?% OR description LIKE %?%`
  - [x] Return array with computed fields: `availableSlots`, `badge`
  - [x] Generate R2 signed URLs for photo thumbnails

- [x] **2.5 GET /api/public/items/:id**
  - [x] Return single item detail with all photos
  - [x] Include computed `availableSlots`
  - [x] Include all info box flags

### Admin Endpoints (Password Auth)

- [x] **2.6 Auth Middleware**
  - [x] Create `src/middleware/auth.ts`
  - [x] Verify `Authorization: Bearer <password>` header
  - [x] Compare with `ADMIN_PASSWORD_HASH` from D1 settings
  - [x] Return 401 if invalid

- [x] **2.7 POST /api/admin/login**
  - [x] Body: `{ password: string }`
  - [x] Verify password against bcrypt hash
  - [x] Return success/failure (no JWT needed for Phase 1, just password in header)

- [x] **2.8 GET /api/admin/items**
  - [x] Return all items (including drafts, excluding soft-deleted)
  - [x] Include admin-only fields: basePriceYen, calculatedCost
  - [x] Sort by createdAt DESC

- [x] **2.9 POST /api/admin/items**
  - [x] Body validation: name, photos, basePriceYen, weightGrams, sellingPrice, maxOrders
  - [x] Optional: description, withoutBoxNote, isLimitedEdition, isPreorder, isFragile, isDraft
  - [x] Generate UUID for item
  - [x] Insert to D1
  - [x] Return created item

- [x] **2.10 PATCH /api/admin/items/:id**
  - [x] Partial update support
  - [x] Validate allowed fields
  - [x] Update `updated_at` timestamp
  - [x] Return updated item

- [x] **2.11 DELETE /api/admin/items/:id**
  - [x] Query param: `force` (boolean, default false)
  - [x] If `force=false`: soft delete (`is_available = 0`)
  - [x] If `force=true`: hard delete + delete photos from R2
  - [x] Check for existing orders before hard delete (warn if exists)

- [x] **2.12 POST /api/admin/upload**
  - [x] Multipart form data handler
  - [x] Validate file type (jpg, png, webp)
  - [x] Validate file size (max 5MB)
  - [x] Generate unique filename: `{itemId}/{uuid}.{ext}`
  - [x] Upload to R2 bucket
  - [x] Return `{ url, thumbnailUrl }`

- [x] **2.13 GET /api/admin/settings**
  - [x] Return all settings (including exchange rate, margins, quotas, dates)

- [x] **2.14 PATCH /api/admin/settings**
  - [x] Body: partial settings update
  - [x] Validate numeric fields (exchangeRate > 0, margin 0-100, quota > 0)
  - [x] Update `updated_at`
  - [x] Return updated settings

---

## Frontend (React + Vite)

### Core Setup

- [x] **3.1 Project Structure**
  - [x] Set up React 18 + Vite
  - [x] Configure Tailwind CSS + DaisyUI (theme: emerald)
  - [x] Set up React Router (SPA mode)
  - [x] Create folder structure: `pages/`, `components/`, `hooks/`, `api/`, `types/`

- [x] **3.2 API Client**
  - [x] Create `api/client.ts` with fetch wrapper
  - [x] Add base URL from env (`VITE_API_BASE_URL`)
  - [x] Add request/response interceptors for error handling
  - [x] Add auth header injection for admin requests

- [x] **3.3 Shared Components**
  - [x] `LoadingSpinner` — DaisyUI loading component
  - [x] `ErrorAlert` — Error display with retry button
  - [x] `ImageGallery` — Photo carousel with thumbnails
  - [x] `InfoBox` — Styled info box component (icon + colored background)
  - [x] `Badge` — Status badges (Available, Low Stock, Full, New)

### Public Pages

- [x] **3.4 Landing Page (`/`)**
  - [x] Header with: Logo, search bar, login button (coming soon for Phase 1)
  - [x] Hero section: Jastip status badge, countdown timer, quota display, estimated arrival date
  - [x] ~~Fake viewers count: "X people viewing" (randomized 3-15, updates every 30s)~~ → Moved to item detail modal only
  - [x] Item grid: Responsive (1 col mobile, 2 tablet, 3-4 desktop)
  - [x] Item card: Thumbnail, name, price (Rp), weight (g), badge
  - [x] Real-time search: Filter items as user types (debounced)
  - [x] Empty state: "No items found" message

- [x] **3.5 Item Detail Modal/Page**
  - [x] Photo gallery (main image + thumbnails)
  - [x] Item name and price
  - [x] Weight and available slots
  - [x] Info boxes (conditional):
    - [x] "Dikirim tanpa box/dus" (amber) if withoutBoxNote
    - [x] "Limited Edition" (purple) if isLimitedEdition
    - [x] "Pre-order" (blue) if isPreorder
    - [x] "Fragile" (red) if isFragile
    - [x] "Best Seller" (orange, auto top 3)
    - [x] "Last Stock" (yellow, auto if <=2 slots)
  - [x] "Coming soon — Register to order" CTA

### Admin Pages

- [x] **3.6 Admin Login Page (`/admin/login`)**
  - [x] Password input (masked)
  - [x] Submit button
  - [x] Error message on failure
  - [x] Redirect to `/admin` on success (store password in memory for API calls)

- [x] **3.7 Admin Dashboard (`/admin`)**
  - [x] Navigation sidebar: Dashboard, Items, Settings
  - [x] Stats cards: Total items, active items, draft items
  - [x] Quick actions: "Add Item" button

- [x] **3.8 Admin Item List (`/admin/items`)**
  - [x] Table view: Thumbnail, name, price, weight, quota status, actions
  - [x] Filter: All / Active / Draft
  - [x] Search by name
  - [x] Action buttons: Edit, Hide (soft delete), Delete (hard)
  - [x] Floating "Add Item" button (mobile)

- [x] **3.9 Admin Item Form (`/admin/items/new` and `/admin/items/:id/edit`)**
  - [x] Name input (required)
  - [x] Description textarea (optional)
  - [x] Photo uploader: Drag-drop zone, multiple files, preview, progress
  - [x] Base price (¥) input with live cost calculation
  - [x] Weight (g) input
  - [x] Selling price (Rp) input (auto-filled from cost + margin, editable)
  - [x] Quota input (max orders)
  - [x] Draft/Published toggle
  - [x] Info box checkboxes: tanpa box, limited edition, pre-order, fragile
  - [x] Live preview of calculated cost (basePrice × exchangeRate)
  - [x] Save button (create or update)

- [x] **3.10 Admin Settings Page (`/admin/settings`)**
  - [x] Exchange rate input (JPY to IDR)
  - [x] Default margin % input
  - [x] Total baggage quota (kg) input
  - [x] Jastip close date picker (date input)
  - [x] Estimated arrival date text input
  - [x] Open/Closed toggle switch
  - [x] Save button

---

## Features & Polish

- [x] **4.1 Mobile Responsiveness**
  - [x] Test at 375px (mobile), 768px (tablet), 1024px+ (desktop)
  - [x] Touch targets minimum 44px
  - [x] Responsive grid layouts
  - [x] Mobile navigation (hamburger or bottom nav)
  - [x] Full-screen modals on mobile

- [x] **4.2 Fake Viewers Count**
  - [x] Client-side random number generator (1-8 for item detail only)
  - [x] ~~Page viewers (3-15)~~ → Removed from landing page, kept in item detail modal only
  - [x] Smooth number transition animation
  - [x] Update interval: 30-60 seconds with small variation
  - [x] Hide when jastip is closed

- [x] **4.3 Countdown Timer**
  - [x] Calculate days until close date
  - [x] Auto-hide when jastip closed
  - [x] Update daily

- [x] **4.4 Search Functionality**
  - [x] Debounced input (300ms)
  - [x] Search both name and description
  - [x] Case-insensitive matching
  - [x] Show "X results found"

- [x] **4.5 Photo Handling**
  - [x] Thumbnail generation/display
  - [x] Lazy loading for images
  - [x] Pinch-to-zoom on mobile
  - [x] Loading states for uploads

---

## Testing & Quality Assurance

### Automated Testing (NEW - Required)

- [x] **5.1 Unit Tests**
  - [x] Backend: Price calculation (yen × rate = cost)
  - [x] Backend: Selling price with margin (cost × 1.3)
  - [x] Backend: Quota calculation (total - sum orders) - `quota.test.ts`
  - [x] Backend: Badge logic (new, low_stock, full) - `badge.test.ts`
  - [x] Frontend: Format utilities (rupiah, weight, date)
  - [x] Frontend: Search filter function

- [x] **5.2 Integration Tests**
  - [x] API endpoints return correct status codes
  - [x] CORS headers present on all responses
  - [x] Auth middleware blocks unauthorized requests
  - [x] Database queries return expected data

**See:** `apps/api/REPORT.md` for full test results

- [x] **5.3 Smoke Tests (CLI Automated)**
  ```bash
  # Health checks
  curl -f http://10.0.0.1:5173 || exit 1  # ✅ PASS
  
  # Verify HTML content
  curl -s http://10.0.0.1:5173 | grep -q "Kotemon Jastip" && echo "PASS: Title found"
  
  # SPA routes
  curl -f http://10.0.0.1:5173/login || exit 1  # ✅ PASS
  curl -f http://10.0.0.1:5173/admin/login || exit 1  # ✅ PASS
  ```

- [x] **5.4 E2E Tests (Manual Verification)**
  - [x] Login page loads at `/login` (SPA serves index.html)
  - [x] Login page structure verified (title contains "Kotemon Jastip")
  - [x] Admin login page loads at `/admin/login`
  - [ ] Login flow: Unauthenticated → Login → Catalog
  - [ ] Admin flow: Login → Create item → View in catalog
  - [ ] Photo upload: Drag-drop → Preview → Save
  - [ ] Mobile responsive: Test at 375px, 768px, 1024px

### Deployment

- [ ] **6.1 Deploy to Cloudflare**
  - [ ] Deploy Worker: `wrangler deploy`
  - [ ] Build and deploy Pages: `wrangler pages deploy`
  - [ ] Verify D1 data persisted
  - [ ] Verify R2 photos accessible
  - [ ] Test production URL

- [ ] **6.2 Documentation**
  - [ ] Update README with setup instructions
  - [ ] Document admin password
  - [ ] Document environment variables

---

## Known Issues / Future Improvements

- [ ] Image optimization (WebP conversion, responsive sizes)
- [ ] Real-time updates (WebSocket or polling for quota changes)
- [ ] SEO meta tags (when switching to SSR later)
- [ ] Analytics tracking (optional)

---

## Progress Tracking

**Total Tasks:** ~75
**Completed:** ~50
**In Progress:** 0
**Remaining:** ~25

**Last Updated:** 2025-02-06

**Recent Changes:**
- Theme changed from `light` to `emerald` (DaisyUI)
- Fake viewers moved from landing page header to item detail modal only

**Next Session:** Continue from Section 5 (Testing & Deployment)

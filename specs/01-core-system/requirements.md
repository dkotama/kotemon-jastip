# Requirements: Phase 1 - Core System

## Introduction

Establish the foundation of Kotemon Jastip: a public landing page where friends can browse available items, and an admin panel to manage the catalog, pricing, and service availability.

**Tech Stack:**
- Frontend: React + Tailwind CSS + DaisyUI (Single Page App)
- Hosting: Cloudflare Pages
- Backend: Cloudflare Workers
- Database: Cloudflare D1 (SQLite)
- Storage: Cloudflare R2 (product photos)
- Auth: Simple admin password (Phase 1 only)

**Core Concepts:**
- **Weight-based quota**: Each item has weight in grams; total orders cannot exceed baggage quota
- **Auto pricing**: Base price (¥) × exchange rate = cost; admin adds margin = selling price
- **Packaging options**: "With box" or "Without box" (box weight deducted for tax avoidance)
- **Countdown + Quota**: Landing shows both "Closes in X days" and "X kg remaining"

---

## Requirements

### Requirement 1: Gated Landing Page (Login Required)

**As a visitor, I want a private shopping experience where only invited friends can access the catalog, so that the jastip service remains exclusive.**

#### Acceptance Criteria

1. WHEN an unauthenticated visitor opens the site (`/`), THEN the system SHALL redirect to the login page (`/login`).
2. WHEN the user is authenticated (has valid session), THEN the system SHALL display the full landing page with catalog.
3. THE login page SHALL display:
   - App name/logo
   - "Login with Google" button (dummy for Phase 1)
   - A message: "Private jastip service - Invitation only"
4. WHEN the user clicks "Login with Google" (dummy), THEN the system SHALL:
   - Show a "Coming soon - Google OAuth" message OR
   - Create a mock session for testing (auto-login for development)
5. IF the user is authenticated AND jastip is open, THEN the system SHALL display:
   - Search bar prominently at top
   - Current jastip status: "Open" or "Closed"
   - Countdown: "Closes in X days"
   - Baggage quota: "X.X kg remaining of Y.Y kg total"
   - Estimated arrival date
   - Item grid with all catalog features
6. THE admin login SHALL NOT be visible in the UI - accessible only by directly navigating to `/admin`.

#### Tests

- **Unit Tests**
  - Validate countdown calculation (days until close date)
  - Validate remaining quota calculation (total - sum of ordered weights)
  - Validate item availability badge logic (available, low stock threshold, full)
  - Validate search filtering (name and description matching)

- **UI Tests**
  - Verify countdown displays correctly and updates daily
  - Verify remaining kg displays with 1 decimal precision (e.g., "4.5 kg")
  - Verify search bar appears at top of page
  - Verify search filters items in real-time as user types
  - Verify "No results" message appears when search has no matches
  - Verify item grid is responsive (mobile: 1-2 columns, desktop: 3-4 columns)
  - Verify "Closed" banner appears when admin closes jastip
  - Verify item detail modal/page opens on click
  - Verify photos load from R2 and display in gallery
  - Verify "tanpa box" info box displays with distinctive styling (icon + highlighted background)

---

### Requirement 2: Item Data Model (Physical Items)

**As an admin, I want to add items with Japanese cost, estimated weight, shipping notes, and special flags, so that the system can calculate selling prices and display compelling item details.**

#### Acceptance Criteria

1. WHEN the admin creates an item, THEN the system SHALL accept:
   - Name (text, required)
   - Photos (multiple, upload to R2, required)
   - Description/notes (text, optional, searchable)
   - Base price in Japanese Yen (number, required, admin-only visible)
   - Weight in grams (number, required, admin enters estimated weight manually)
   - Item quota: max orders allowed (number, required)
   - Draft mode toggle (optional, default: published)
   - Info box flags (checkboxes):
     - "Dikirim tanpa box/dus" (optional)
     - "Limited Edition" (optional)
     - "Pre-order" (optional)
     - "Fragile" (optional)
2. WHEN the admin sets the exchange rate in system settings, THEN the system SHALL store it for auto-calculations (e.g., 108.5).
3. WHEN the admin views an item, THEN the system SHALL display:
   - Calculated cost: `basePriceYen × exchangeRate` (admin-only)
   - Suggested selling price (editable, auto-filled with cost + default margin)
4. IF the admin changes the exchange rate, THEN the system SHALL recalculate costs for all items (display only, does not change selling prices).
5. WHEN an item is saved as draft, THEN the system SHALL NOT display it on the public landing page.
6. WHEN an item is published (not draft), THEN the system SHALL display it on the public landing page according to availability rules.
7. THE weight entered is the final weight used for quota calculations (no automatic deductions).

#### Tests

- **Unit Tests**
  - Validate cost calculation (yen × exchange rate)
  - Validate suggested selling price with margin
  - Validate item quota enforcement
  - Validate search indexing of description field
  - Validate draft items excluded from public API

- **UI Tests**
  - Verify weight input accepts grams (e.g., "350")
  - Verify all info box checkboxes in admin form
  - Verify draft toggle in admin form
  - Verify cost calculation updates when exchange rate changes
  - Verify photos upload to R2 and show preview
  - Verify draft items don't appear on landing page

---

### Requirement 3: Admin Catalog Management

**As an admin, I want to add, edit, and remove items from the catalog, so that I can keep the offering current.**

#### Acceptance Criteria

1. WHEN the admin navigates to `/admin` and enters the admin password, THEN the system SHALL grant access to the admin panel.
2. WHEN the admin views the catalog list, THEN the system SHALL display:
   - Item thumbnail, name, selling price, weight contribution
   - Item quota status (ordered / max)
   - Quick actions: Edit, Delete
3. WHEN the admin clicks "Add Item", THEN the system SHALL show a form with:
   - Name input
   - Description/notes textarea (searchable, optional)
   - Photo upload (multiple, drag-drop or click)
   - Base price (¥) input
   - Weight (grams) input (admin enters estimated weight)
   - Item quota input
   - Selling price (Rp) input (auto-filled, editable)
   - Draft/Published toggle (default: Published)
   - Info box checkboxes:
     - "Dikirim tanpa box/dus"
     - "Limited Edition"
     - "Pre-order"
     - "Fragile"
4. IF the admin uploads photos, THEN the system SHALL:
   - Generate optimized thumbnails
   - Store in R2 with unique paths
   - Show upload progress and preview
5. WHEN the admin edits an item, THEN the system SHALL allow modifying all fields and adding/removing photos.
6. IF the admin deletes an item with zero orders, THEN the system SHALL remove it from the catalog and delete photos from R2.
7. IF the admin attempts to delete an item with existing orders, THEN the system SHALL warn: "This item has orders. Hide it instead?" and offer "Hide" or "Force Delete".

#### Tests

- **Unit Tests**
  - Validate admin password authentication
  - Validate item CRUD operations
  - Validate photo upload and R2 storage
  - Validate soft delete (hide) vs hard delete

- **UI Tests**
  - Verify admin login form accepts password
  - Verify catalog list displays all items with status
  - Verify add item form validates required fields
  - Verify photo upload shows progress and preview
  - Verify edit form pre-fills existing data
  - Verify delete confirmation for items with orders

---

### Requirement 4: Admin System Settings

**As an admin, I want to configure global settings like exchange rate and baggage quota, so that the system calculates correctly.**

#### Acceptance Criteria

1. WHEN the admin navigates to Settings, THEN the system SHALL display:
   - Exchange rate (JPY to IDR): input field (e.g., 108.5)
   - Default margin %: input field (e.g., 30% for auto-calculating selling price)
   - Total baggage quota (kg): input field (e.g., 20)
   - Jastip close date: date picker (optional)
   - Estimated arrival date: text input (e.g., "6-10 May 2025")
   - Jastip status: toggle "Open" / "Closed"
2. WHEN the admin updates the exchange rate, THEN the system SHALL immediately recalculate and display all item costs (admin view only).
3. WHEN the admin sets a close date, THEN the system SHALL display the countdown on the landing page.
4. IF the admin clears the close date, THEN the system SHALL hide the countdown.
5. WHEN the admin toggles jastip status to "Closed", THEN the system SHALL:
   - Immediately update the landing page banner
   - Hide the countdown
   - Keep the catalog visible but show "Closed" status

#### Tests

- **Unit Tests**
  - Validate settings CRUD
  - Validate exchange rate recalculation trigger
  - Validate countdown display/hide based on close date
  - Validate jastip status toggle propagation

- **UI Tests**
  - Verify settings form loads current values
  - Verify exchange rate update reflects in item cost preview
  - Verify close date picker shows calendar
  - Verify toggle switch updates status immediately

---

### Requirement 5: Item View Counter (Instagram-style)

**As a visitor viewing an item, I want to see how many times the item has been viewed, so that I know its popularity and feel urgency to order.**

#### Acceptance Criteria

1. WHEN a visitor opens an item detail view, THEN the system SHALL increment the view count for that item and display it (e.g., "1,024 dilihat").
2. THE view count SHALL be persistent (stored in database) and cumulative (counts all-time views).
3. WHEN the view count is displayed, THEN it SHALL be formatted with Indonesian locale (e.g., "1.024", "12.5rb" for thousands).
4. IF an item has 0 views, THEN the system SHALL display "Belum dilihat" or hide the counter.
5. THE same user viewing the same item multiple times SHALL count as multiple views (simple implementation, no duplicate prevention needed for Phase 1).

#### Database Changes

Add to `items` table:
- `viewCount`: INTEGER, default 0

#### Tests

- **Unit Tests**
  - Validate view count increments on API call
  - Validate number formatting (1,024 → "1.024", 1,500,000 → "1,5jt")

- **UI Tests**
  - Verify view count displays under/ near item photos
  - Verify count updates after viewing
  - Verify "Belum dilihat" shows for 0 views

---

### Requirement 6: Mobile Responsive Design

**As a visitor or admin, I want to use the site comfortably on mobile, so that I can browse or manage items on the go.**

#### Acceptance Criteria

1. WHEN the site is viewed on mobile (≤768px), THEN the landing page SHALL:
   - Show single or two-column item grid
   - Display countdown and quota prominently at top
   - Use touch-friendly buttons (min 44px)
2. WHEN the admin panel is viewed on mobile, THEN the system SHALL:
   - Use collapsible/scrollable tables or card list for items
   - Show floating action button for "Add Item"
   - Use bottom sheet or full-screen modal for item forms
3. WHEN photos are displayed, THEN the system SHALL:
   - Load appropriately sized images for viewport
   - Support pinch-to-zoom in item detail view
4. WHEN forms are used on mobile, THEN input fields SHALL be appropriately sized for touch and numeric keyboards for number inputs.

#### Tests

- **UI Tests**
  - Verify layout at 375px, 768px, and 1024px viewports
  - Verify touch targets are minimum 44px
  - Verify images load appropriate sizes
  - Verify admin item list is usable on mobile
  - Verify forms are scrollable and submit button accessible

---

## Out of Scope (Phase 2+)

Features intentionally excluded from Phase 1, to be addressed in later phases:

- **User registration / Google OAuth** — Phase 2
- **User order placement** — Phase 2  
- **Token management / invite system** — Phase 2
- **Custom / inquiry items** — Phase 3 (items without fixed price, user submits request)
- **Order status tracking** — Phase 3
- **Payment processing** — Phase 3
- **User order history** — Phase 3
- **Admin dashboard / analytics** — Phase 3
- **Notifications** (email, WhatsApp) — Future
- **Multi-admin roles** — Future

---

## Data Model Summary

### Item (Physical)
| Field | Type | Visibility | Notes |
|-------|------|------------|-------|
| id | string | system | UUID |
| name | string | public | Item name |
| description | string | public | Notes, searchable |
| photos | string[] | public | R2 URLs |
| basePriceYen | number | admin only | ¥ cost |
| exchangeRate | number | admin only | From settings |
| calculatedCost | number | admin only | Auto: basePriceYen × exchangeRate |
| sellingPrice | number | public | Rp price (auto-calculated, editable) |
| weightGrams | number | public | Estimated weight in grams (manual entry) |
| withoutBoxNote | boolean | public | Show "tanpa box" info box |
| isLimitedEdition | boolean | public | Show "Limited Edition" badge |
| isPreorder | boolean | public | Show "Pre-order" info box |
| isFragile | boolean | public | Show "Fragile" warning |
| maxOrders | number | public | Item quota |
| currentOrders | number | system | Count of orders placed |
| isAvailable | boolean | public | Soft delete/hide |
| isDraft | boolean | public | Draft mode (hide from public) |
| createdAt | datetime | system | |
| updatedAt | datetime | system | |

### Settings
| Field | Type | Notes |
|-------|------|-------|
| exchangeRate | number | JPY to IDR |
| defaultMarginPercent | number | For auto-calculating selling price |
| totalBaggageQuotaKg | number | Total weight limit |
| jastipStatus | enum | "open" or "closed" |
| jastipCloseDate | date | Optional, for countdown |
| estimatedArrivalDate | string | "6-10 May 2025" format |
| adminPassword | string | Hashed |

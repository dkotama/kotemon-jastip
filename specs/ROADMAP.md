# Kotemon Jastip - Feature Roadmap

## Overview
Split the initial monolithic feature into 3 deliverable phases for iterative development.

---

## Phase 1: Core System (Foundation)
**Goal:** Admin can manage catalog and control service availability. Public can view.

**Folder:** `specs/01-core-system/`

**Features:**
1. Public landing page
   - Display baggage quota (X kg remaining of Y kg)
   - Display "Jastip Full" banner when closed
   - Preview available items (photo, name, price)
   - "Coming soon" or simple info (no auth yet)

2. Admin catalog management
   - Login (simple admin password or basic auth for now)
   - Add/edit/delete items
   - Upload photos to R2
   - Set per-item quota
   - Set total baggage quota

3. Admin service control
   - Toggle: Jastip Open / Closed
   - When closed: show banner on landing page

**Out of scope for Phase 1:**
- User registration/orders
- Google OAuth
- Token system
- User-facing order flow

---

## Phase 2: User Access (Authentication & Ordering)
**Goal:** Friends can register with tokens and place orders.

**Folder:** `specs/02-user-access/`

**Features:**
1. Google OAuth integration
2. Token verification (one-time for new users)
3. User catalog browsing (full detail view)
4. Order placement
   - Add items to cart
   - Check per-item quota
   - Check total baggage quota
   - Confirm order
5. Simple order history for users

**Dependencies:** Phase 1 must be complete (items exist, quotas set)

---

## Phase 3: Admin Tools (Management)
**Goal:** Admin can invite friends and view metrics.

**Folder:** `specs/03-admin-tools/`

**Features:**
1. Token management
   - Generate single-use tokens
   - View token status (active/used/expired/revoked)
   - Revoke tokens
   - See which Google account used each token

2. Admin dashboard
   - Total orders, revenue
   - Quota utilization charts
   - Active users count
   - Recent orders list

**Dependencies:** Phase 2 must be complete (users exist, orders exist)

---

## Development Order

```
Phase 1 → Phase 2 → Phase 3
(Core)   → (Auth)  → (Tools)
```

Each phase builds on the previous. Can deploy Phase 1 to production for testing before adding users.

---

## Tech Stack (All Phases)
- Frontend: React + Tailwind CSS + DaisyUI
- Hosting: Cloudflare Pages  
- Backend: Cloudflare Workers
- Database: Cloudflare D1 (SQLite)
- Storage: Cloudflare R2 (photos)
- Auth: Google OAuth (Phase 2+)

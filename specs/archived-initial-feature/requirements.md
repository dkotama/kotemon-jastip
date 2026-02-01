# Requirements: Initial Feature - Jastip Ordering System

## Introduction

**Kotemon Jastip** is a personal shopping service where users can order items from overseas (Japan) through an admin. This initial feature establishes the core ordering system with quota management, catalog browsing, and order placement capabilities.

**Tech Stack:**
- Frontend: React + Tailwind CSS + DaisyUI (Single Page App)
- Hosting: Cloudflare Pages
- Backend: Cloudflare Workers
- Database: Cloudflare D1 (SQLite)
- Storage: Cloudflare R2 (product photos)
- Auth: Google OAuth + Custom token verification (admin-generated single-use tokens)

**Problem Being Solved:**
Friends need a simple, mobile-friendly way to browse available items, check baggage quotas, and place orders for overseas shopping. The service must be private (invite-only) to avoid strangers, using Google OAuth for identity and admin-generated tokens for access control. The admin needs tools to manage inventory, generate invite tokens, set quotas per item type and total baggage, and control when the service is open/closed.

**Primary Objectives:**
1. Public landing page shows baggage quota, item preview, and Google Login
2. Private access via Google OAuth + one-time admin token verification
3. Verified users can browse catalog and place orders within quota limits
4. Admin can manage catalog, generate tokens, set quotas, and control availability
5. Mobile-first responsive design

---

## Requirements

### Requirement 1: Landing Page with Baggage Quota

**As a visitor, I want to see the available baggage quota and item preview immediately, so that I know if the jastip service is open before logging in.**

#### Acceptance Criteria

1. WHEN any visitor opens the site, THEN the system SHALL display the current baggage quota status (e.g., "5kg remaining of 20kg total").
2. IF the admin has marked jastip as "Full" or remaining quota is zero, THEN the system SHALL display a prominent "Jastip Full" banner.
3. WHEN the landing page loads, THEN the system SHALL display a preview of available items (photos, names, prices) without requiring login.
4. WHEN the landing page loads, THEN the system SHALL display "Login with Google" as the primary call-to-action.
5. IF the visitor clicks "Login with Google", THEN the system SHALL initiate OAuth flow.
6. WHEN photos are loaded from R2, THEN the system SHALL display optimized/resized images for mobile performance.

#### Tests

- **Unit Tests**
  - Validate baggage quota calculation (total - used)
  - Validate "full" status determination
  - Validate public item preview data structure

- **UI Tests**
  - Verify baggage quota displays prominently on landing page
  - Verify "Jastip Full" banner appears when appropriate
  - Verify item preview displays without authentication
  - Verify "Login with Google" button appears on landing page
  - Verify images load and display correctly on mobile

---

### Requirement 1b: Catalog Browsing (Registered Users)

**As a registered user, I want to browse the full catalog with detailed item information, so that I can decide what to order.**

#### Acceptance Criteria

1. WHEN a registered user views the catalog, THEN the system SHALL display all available items with thumbnails, names, prices, and per-item quota status.
2. IF an item has no available quota, THEN the system SHALL display a "Sold Out" or "Full" badge.
3. WHEN the user clicks on an item, THEN the system SHALL display a detail view with full description, multiple photos from R2, price, and remaining quota.
4. WHEN the user views the catalog, THEN the system SHALL display the current baggage quota in the header or sidebar.

#### Tests

- **Unit Tests**
  - Validate item data structure (name, price, quota, photos)
  - Validate quota calculation logic (ordered vs available)
  - Validate "sold out" status determination

- **UI Tests**
  - Verify catalog grid displays on mobile viewport
  - Verify item detail modal/page opens on click
  - Verify "Sold Out" badge appears when quota reached
  - Verify baggage quota displays in header for registered users

---

### Requirement 2: Google OAuth + Token Verification (Private Access)

**As a user, I want to log in with Google and verify my access with a one-time token, so that only friends with an invite can use the jastip service.**

#### Acceptance Criteria

1. WHEN any visitor opens the landing page, THEN the system SHALL display "Login with Google" as the primary action.
2. WHEN the user clicks "Login with Google", THEN the system SHALL initiate OAuth flow with Google.
3. WHEN OAuth succeeds and the user is NEW (not in database), THEN the system SHALL display a one-time token verification screen.
4. WHEN the user enters a valid, unused token on the verification screen, THEN the system SHALL create their account, mark the token as used, and redirect to the catalog.
5. IF the user enters an invalid, expired, or already-used token, THEN the system SHALL display an error: "Invalid or expired token. Please contact the admin for an invite."
6. WHEN OAuth succeeds and the user ALREADY EXISTS in the database, THEN the system SHALL redirect directly to the catalog without showing the token screen.
7. IF a new user fails token verification, THEN the system SHALL NOT create an account and SHALL allow retry with a different token.

#### Tests

- **Unit Tests**
  - Validate Google OAuth callback handling
  - Validate new vs existing user detection
  - Validate token verification (valid, invalid, expired, used)
  - Validate user creation only after valid token
  - Validate token consumption (marked as used after successful verification)

- **UI Tests**
  - Verify "Login with Google" button appears on landing page
  - Verify token input screen appears only for new users after OAuth
  - Verify token input shows only once (one-time verification)
  - Verify success message and redirect to catalog on valid token
  - Verify error message on invalid/used token without account creation
  - Verify existing users skip token screen and go directly to catalog

---

### Requirement 3: Order Placement

**As a registered user, I want to place an order for items within quota limits, so that I can purchase items through the jastip service.**

#### Acceptance Criteria

1. IF the user is registered and jastip is open, THEN the system SHALL allow adding items to an order cart.
2. WHEN the user adds an item to cart, THEN the system SHALL validate the quantity does not exceed available per-item quota OR total baggage quota.
3. IF the user attempts to order more than available quota (item or baggage), THEN the system SHALL display an error and prevent the order.
4. WHEN the user confirms the order, THEN the system SHALL create the order record, decrement both item quota and baggage quota, and display a confirmation.
5. IF the order creation fails (network, server error), THEN the system SHALL display an error and allow retry without double-counting quota.
6. WHEN an order is successfully placed, THEN the system SHALL display order details and estimated weight contribution.

#### Tests

- **Unit Tests**
  - Validate per-item quota decrement logic
  - Validate baggage quota decrement logic
  - Validate order total calculation
  - Validate concurrent order race condition handling
  - Validate quota rollback on order failure

- **UI Tests**
  - Verify "Add to Order" button appears for registered users when jastip is open
  - Verify quantity selector respects available quotas
  - Verify error displays when exceeding item quota
  - Verify error displays when exceeding baggage quota
  - Verify order confirmation page displays after successful order

---

### Requirement 4: Admin Catalog Management

**As an admin, I want to add, update, and remove items from the catalog, so that I can keep the offering current.**

#### Acceptance Criteria

1. IF the user has admin privileges, THEN the system SHALL display an "Admin" navigation option.
2. WHEN the admin navigates to the admin panel, THEN the system SHALL display the catalog management interface.
3. WHEN the admin adds a new item, THEN the system SHALL accept name, description, price, quota limit, and photos.
4. IF the admin uploads photos, THEN the system SHALL store them in R2 and generate optimized variants.
5. WHEN the admin updates an item, THEN the system SHALL validate the changes and update the catalog immediately.
6. IF the admin deletes an item with no active orders, THEN the system SHALL remove it from the catalog.
7. IF the admin attempts to delete an item with active orders, THEN the system SHALL display a warning and require confirmation.

#### Tests

- **Unit Tests**
  - Validate admin privilege checking
  - Validate item CRUD operations
  - Validate photo upload to R2
  - Validate soft delete vs hard delete logic

- **UI Tests**
  - Verify admin panel is accessible only to admin users
  - Verify item creation form validates required fields
  - Verify photo upload displays preview
  - Verify update reflects immediately in catalog
  - Verify delete confirmation modal appears

---

### Requirement 5: Admin Token Management

**As an admin, I want to generate and manage access tokens, so that I can invite friends to verify their access after Google OAuth login.**

#### Acceptance Criteria

1. WHEN the admin navigates to the token management page, THEN the system SHALL display a list of all tokens (active, used, expired, revoked).
2. WHEN the admin generates a new token, THEN the system SHALL create a unique single-use token and display it for sharing with a friend.
3. IF the admin sets an expiration date for a token, THEN the system SHALL invalidate the token after that date.
4. WHEN the admin revokes a token, THEN the system SHALL mark it as invalid immediately.
5. IF a token is used for verification after OAuth, THEN the system SHALL mark it as "used" and link it to the new user account.
6. WHEN the admin views a token, THEN the system SHALL show if it was used and which Google account (email) was verified with it.

#### Tests

- **Unit Tests**
  - Validate token generation (unique, format)
  - Validate token expiration logic
  - Validate token revocation
  - Validate token consumption tracking and user linking

- **UI Tests**
  - Verify token generation button creates and displays new token
  - Verify token list shows status (active/used/expired/revoked)
  - Verify copy-to-clipboard button works for sharing tokens
  - Verify revoke button invalidates token immediately
  - Verify used tokens show linked user email

---

### Requirement 6: Admin Quota Management

**As an admin, I want to set and adjust quota limits per item type/category, so that I can control order volume.**

#### Acceptance Criteria

1. WHEN the admin creates or edits an item, THEN the system SHALL allow setting a maximum order quota.
2. WHEN the admin views the item list, THEN the system SHALL display current orders vs quota for each item.
3. IF the admin reduces quota below current orders, THEN the system SHALL display a warning but allow (backlog scenario).
4. WHEN the admin views the dashboard, THEN the system SHALL display total baggage quota utilization and per-item quotas.
5. WHEN the admin sets the total baggage quota, THEN the system SHALL update the landing page display immediately.

#### Tests

- **Unit Tests**
  - Validate per-item quota validation logic
  - Validate total baggage quota calculation
  - Validate quota utilization calculation
  - Validate warning trigger when quota < orders

- **UI Tests**
  - Verify quota input appears in item form
  - Verify total baggage quota input in admin settings
  - Verify quota utilization displays in item list
  - Verify warning displays when reducing quota below orders
  - Verify dashboard shows overall utilization metrics

---

### Requirement 7: Admin Service Availability Control

**As an admin, I want to open and close the jastip service, so that I can control when users can place orders.**

#### Acceptance Criteria

1. WHEN the admin toggles the "Jastip Open/Closed" switch, THEN the system SHALL immediately update the service status.
2. IF the jastip is marked as "Closed", THEN the system SHALL display a banner to all users and disable the order button.
3. WHEN the jastip is closed, THEN authenticated users can still view their past orders but cannot place new orders.
4. IF the admin reopens the jastip, THEN the system SHALL immediately enable order placement again.

#### Tests

- **Unit Tests**
  - Validate service status toggle logic
  - Validate order button state based on status
  - Validate banner visibility based on status

- **UI Tests**
  - Verify toggle switch appears in admin panel
  - Verify banner displays when jastip is closed
  - Verify order button is disabled when closed
  - Verify reopening re-enables order functionality

---

### Requirement 8: Mobile Responsive Design

**As a user, I want to use the site comfortably on my mobile phone, so that I can browse and order on the go.**

#### Acceptance Criteria

1. WHEN the site is viewed on a mobile viewport (≤768px), THEN all layouts SHALL adapt to single-column or appropriate mobile layouts.
2. WHEN the user interacts with forms, THEN input fields SHALL be appropriately sized for touch input.
3. WHEN images are displayed, THEN they SHALL be optimized for mobile bandwidth and screen size.
4. WHEN navigation is used on mobile, THEN it SHALL use a hamburger menu or bottom navigation pattern.
5. WHEN modals or dialogs appear, THEN they SHALL be full-screen or appropriately sized for mobile.

#### Tests

- **UI Tests**
  - Verify layout adapts at 375px, 768px, and 1024px viewports
  - Verify touch targets are minimum 44px
  - Verify images load appropriate sizes for viewport
  - Verify navigation is accessible on mobile
  - Verify modals are usable without horizontal scroll

---

## Out of Scope (Future Enhancements)

The following features are intentionally excluded from the initial feature and will be considered for future iterations:

- Payment processing / checkout flow
- Order status tracking (pending, purchased, shipped, delivered)
- Real-time notifications (push, email, WhatsApp)
- Multiple currency support
- Advanced item categorization and filtering
- User reviews/ratings
- Order history export
- Multi-admin role management
- Analytics dashboard
- Inventory/source management

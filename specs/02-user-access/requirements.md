# Requirements: Phase 2 - User Access

## Introduction

Add user authentication and ordering capabilities to Kotemon Jastip. Friends can register using Google OAuth and admin-generated tokens, then place orders within quota limits.

**Dependencies:** Phase 1 (Core System) must be complete — items exist, quotas are set, and jastip can be opened/closed.

**New Tech:**
- Google OAuth 2.0 (via Cloudflare Workers)
- Token verification system (admin-generated single-use tokens)
- Session management (JWT or secure cookies)

---

## Requirements

### Requirement 1: Google OAuth Integration

**As a user, I want to log in with my Google account, so that I don't need to create a new password.**

#### Acceptance Criteria

1. WHEN a visitor clicks "Login with Google" on the landing page, THEN the system SHALL initiate Google OAuth 2.0 flow.
2. WHEN OAuth succeeds, THEN the system SHALL receive: Google ID, email, name, and profile photo.
3. WHEN the user is NEW (Google ID not in database), THEN the system SHALL redirect to token verification screen.
4. WHEN the user is EXISTING (Google ID found), THEN the system SHALL create a session and redirect to catalog.
5. IF OAuth fails or is cancelled, THEN the system SHALL return to landing page with error message.
6. WHEN the user is logged in, THEN the system SHALL display their name and profile photo in the header.

#### Tests

- **Unit Tests**
  - Validate Google OAuth callback handling
  - Validate new vs existing user detection
  - Validate session creation with JWT

- **UI Tests**
  - Verify "Login with Google" button appears on landing page
  - Verify OAuth popup/redirect works
  - Verify new users see token verification screen
  - Verify existing users go directly to catalog
  - Verify user profile displays in header after login

---

### Requirement 2: Token Verification (One-Time)

**As a new user, I want to verify my invite token after Google login, so that I can gain access to the private jastip service.**

#### Acceptance Criteria

1. WHEN a new user completes Google OAuth, THEN the system SHALL display a token verification screen with:
   - Input field for token (e.g., "KOTEMON-2025-ABC123")
   - Instructions: "Enter the token given by admin"
   - User's Google profile info (name, email) for confirmation
2. WHEN the user enters a VALID, UNUSED, NON-EXPIRED token, THEN the system SHALL:
   - Create user record (link Google ID, email, name, photo)
   - Mark token as used (link to user ID)
   - Create session
   - Redirect to catalog with welcome message
3. IF the token is INVALID, EXPIRED, or ALREADY USED, THEN the system SHALL display error: "Invalid or expired token. Please contact the admin for a new invite."
4. IF token verification fails, THEN the system SHALL NOT create a user account and SHALL allow retry with different token.
5. WHEN a user successfully verifies, THEN they SHALL NEVER see the token screen again (even on new devices, they just OAuth and go to catalog).

#### Tests

- **Unit Tests**
  - Validate token lookup (exists, not used, not expired)
  - Validate user creation on valid token
  - Validate token consumption (marked used + user link)
  - Validate rejection of invalid/expired/used tokens

- **UI Tests**
  - Verify token input screen appears only for new users
  - Verify valid token grants access and redirects
  - Verify error message on invalid token
  - Verify existing users skip token screen on subsequent logins

---

### Requirement 3: User Catalog Browsing (Full Access)

**As a logged-in user, I want to browse the full catalog with enhanced features, so that I can find and select items to order.**

#### Acceptance Criteria

1. WHEN a logged-in user views the catalog, THEN the system SHALL display:
   - Same landing page features as public (search, countdown, quota, arrival date)
   - "Add to Order" button on each item card (instead of "Coming soon")
   - User's current order summary (items, total weight, total price)
2. WHEN the user clicks an item, THEN the system SHALL show detail view with:
   - All photos, info boxes, specifications
   - "Add to Order" button with quantity selector
   - "Available slots: X of Y" for item quota
   - "Adds Xg to your baggage" weight indicator
3. IF the item is out of stock (quota full), THEN the system SHALL disable the "Add to Order" button.
4. IF remaining baggage quota is insufficient for the item, THEN the system SHALL display warning: "Not enough baggage quota remaining."
5. WHEN the user adds an item to order, THEN the system SHALL update their order summary in real-time.

#### Tests

- **Unit Tests**
  - Validate user-specific order cart state
  - Validate quota checks before adding to order
  - Validate real-time order summary updates

- **UI Tests**
  - Verify "Add to Order" button appears for logged-in users
  - Verify order summary displays in sidebar/header
  - Verify out-of-stock items are disabled
  - Verify warning when baggage quota insufficient
  - Verify order updates in real-time

---

### Requirement 4: Order Placement

**As a logged-in user, I want to place an order for selected items, so that I can purchase items through the jastip service.**

#### Acceptance Criteria

1. WHEN the user has items in their order cart, THEN the system SHALL display an "Review Order" button.
2. WHEN the user reviews their order, THEN the system SHALL show:
   - List of items with quantities
   - Individual prices and subtotals
   - Total weight contribution
   - Total price
   - Remaining baggage quota after this order
3. WHEN the user confirms the order, THEN the system SHALL:
   - Validate all quotas (per-item and total baggage) are still available
   - Create order record with status "Confirmed"
   - Increment item `currentOrders` counts
   - Decrement available baggage quota
   - Clear user's order cart
   - Display order confirmation with order ID
4. IF quota validation fails (race condition), THEN the system SHALL:
   - Display which item(s) are no longer available
   - Allow user to modify order and retry
5. WHEN order is confirmed, THEN the system SHALL show:
   - Order ID
   - Summary of ordered items
   - Total weight and price
   - Message: "Admin will contact you for payment details"

#### Tests

- **Unit Tests**
  - Validate order creation with quota checks
  - Validate concurrent order race condition handling
  - Validate order total calculations
  - Validate quota rollback on failure

- **UI Tests**
  - Verify order review page displays all items
  - Verify quota validation before confirmation
  - Verify confirmation page shows order details
  - Verify error handling for race conditions

---

### Requirement 5: User Order History

**As a logged-in user, I want to view my past orders, so that I can track what I've ordered.**

#### Acceptance Criteria

1. WHEN the user navigates to "My Orders", THEN the system SHALL display:
   - List of all their orders (newest first)
   - Order ID, date, total items, total price, status
2. WHEN the user clicks an order, THEN the system SHALL display:
   - Full order details (items, quantities, prices)
   - Total weight
   - Order status: "Confirmed", "Purchased", "Shipped", "Delivered" (Phase 3)
3. IF the user has no orders, THEN the system SHALL display: "You haven't placed any orders yet."

#### Tests

- **Unit Tests**
  - Validate order retrieval by user ID
  - Validate order sorting (newest first)

- **UI Tests**
  - Verify order list displays for user
  - Verify order detail view shows all information
  - Verify empty state message when no orders

---

### Requirement 6: Logout

**As a logged-in user, I want to log out, so that I can switch accounts or secure my session.**

#### Acceptance Criteria

1. WHEN the user clicks "Logout", THEN the system SHALL clear their session.
2. WHEN logged out, THEN the user SHALL be redirected to the public landing page.
3. WHEN the user returns to the site later, THEN they SHALL need to OAuth again (but skip token if already verified).

#### Tests

- **UI Tests**
  - Verify logout button appears in header
  - Verify logout clears session and redirects

---

## Out of Scope (Phase 3+)

- **Payment processing** — Phase 3
- **Order status updates** (Purchased, Shipped, Delivered) — Phase 3
- **Notifications** (email, WhatsApp confirmations) — Future
- **Order cancellation** — Future
- **Edit order after placement** — Future

---

## Data Model Additions (Phase 2)

### Users
| Field | Type | Notes |
|-------|------|-------|
| id | string | UUID |
| googleId | string | Google OAuth ID |
| email | string | From Google |
| name | string | From Google |
| photoUrl | string | From Google |
| tokenId | string | FK to tokens table (which token they used) |
| createdAt | datetime | |
| lastLoginAt | datetime | |

### Tokens
| Field | Type | Notes |
|-------|------|-------|
| id | string | UUID |
| code | string | Unique token code (e.g., "KOTEMON-2025-ABC123") |
| createdBy | string | Admin who generated it |
| usedBy | string | FK to users (null if unused) |
| usedAt | datetime | |
| expiresAt | datetime | Optional |
| isRevoked | boolean | |
| createdAt | datetime | |

### Orders
| Field | Type | Notes |
|-------|------|-------|
| id | string | UUID |
| userId | string | FK to users |
| items | JSON | Array of {itemId, quantity, priceAtTime} |
| totalWeightGrams | number | Sum of item weights |
| totalPrice | number | Sum of item prices |
| status | enum | "Confirmed" (Phase 2), later: "Purchased", "Shipped", "Delivered" |
| createdAt | datetime | |
| updatedAt | datetime | |

### OrderItems (junction table)
| Field | Type | Notes |
|-------|------|-------|
| orderId | string | FK |
| itemId | string | FK |
| quantity | number | |
| priceAtTime | number | Price when ordered |
| weightAtTime | number | Weight when ordered |

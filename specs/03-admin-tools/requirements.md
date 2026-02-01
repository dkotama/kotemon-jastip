# Requirements: Phase 3 - Admin Tools

## Introduction

Advanced admin capabilities for managing invites, tracking orders, and viewing analytics. This phase completes the admin experience with token management and dashboard insights.

**Dependencies:** Phase 2 (User Access) must be complete — users exist, orders exist, tokens have been used.

---

## Requirements

### Requirement 1: Token Management

**As an admin, I want to generate and manage invite tokens, so that I can control who gets access to the jastip service.**

#### Acceptance Criteria

1. WHEN the admin navigates to "Token Management", THEN the system SHALL display:
   - Button to generate new token
   - List of all tokens with status: Active, Used, Expired, Revoked
   - Filter/search by status
2. WHEN the admin clicks "Generate Token", THEN the system SHALL:
   - Create a unique token code (format: "KOTEMON-YYYY-XXXXXX")
   - Display the token prominently for copying/sharing
   - Show copy-to-clipboard button
   - Optionally set expiration date
3. WHEN viewing a token, THEN the system SHALL display:
   - Token code
   - Status (Active, Used, Expired, Revoked)
   - Creation date
   - Expiration date (if set)
   - Usage info (if used): User name, email, used date
4. WHEN the admin revokes a token, THEN the system SHALL:
   - Mark it as "Revoked" immediately
   - Prevent it from being used (if not already used)
5. IF a token expires (past expiration date), THEN the system SHALL automatically mark it as "Expired".
6. WHEN the admin exports tokens, THEN the system SHALL provide CSV export with all token data.

#### Tests

- **Unit Tests**
  - Validate token generation (unique format)
  - Validate token status transitions
  - Validate revocation logic
  - Validate expiration logic

- **UI Tests**
  - Verify token generation creates copyable code
  - Verify token list shows status badges
  - Verify used tokens display user info
  - Verify revoke action updates status immediately

---

### Requirement 2: Admin Dashboard Overview

**As an admin, I want to see a dashboard with key metrics, so that I can understand the state of my jastip business.**

#### Acceptance Criteria

1. WHEN the admin opens the dashboard, THEN the system SHALL display:
   - **Current Trip Status:**
     - Jastip status (Open/Closed)
     - Days until close (if open)
     - Baggage quota: X kg used of Y kg total
     - Percentage used (progress bar)
   - **Order Summary:**
     - Total orders this trip
     - Total revenue (sum of all order totals)
     - Average order value
   - **Item Performance:**
     - Top 5 most ordered items
     - Items with low stock (<= 2 slots remaining)
   - **User Stats:**
     - Total registered users
     - New users this week
2. WHEN the admin clicks a metric, THEN the system SHALL navigate to relevant detailed view.
3. IF no orders exist yet, THEN the system SHALL show friendly empty state with call-to-action to share tokens.

#### Tests

- **Unit Tests**
  - Validate metric calculations (totals, averages)
  - Validate top items query
  - Validate low stock detection

- **UI Tests**
  - Verify dashboard loads with all metrics
  - Verify progress bar displays correctly
  - Verify clicking metrics navigates to details
  - Verify empty state when no data

---

### Requirement 3: Order Management

**As an admin, I want to view and manage all orders, so that I can track what needs to be purchased.**

#### Acceptance Criteria

1. WHEN the admin navigates to "Orders", THEN the system SHALL display:
   - List of all orders (newest first)
   - Filters: by status, by user, by date range
   - Search by order ID or user name
2. FOR each order in the list, the system SHALL display:
   - Order ID
   - User name and contact
   - Total items, total weight, total price
   - Order status
   - Order date
3. WHEN the admin clicks an order, THEN the system SHALL display:
   - Full order details
   - User profile (name, email, photo)
   - List of items with quantities
   - Actions to update status (Phase 3 extension)
4. WHEN the admin exports orders, THEN the system SHALL provide CSV/Excel export.
5. IF orders exist with status "Confirmed", THEN the system SHALL show a notification badge on the Orders menu.

#### Tests

- **Unit Tests**
  - Validate order filtering and search
  - Validate order detail retrieval

- **UI Tests**
  - Verify order list displays with filters
  - Verify order detail view shows all information
  - Verify export button generates file
  - Verify notification badge for new orders

---

### Requirement 4: Order Status Updates (Extended)

**As an admin, I want to update order statuses, so that users know the progress of their orders.**

#### Acceptance Criteria

1. WHEN viewing an order, THEN the admin SHALL be able to update status:
   - Confirmed → Purchased → Shipped → Delivered
2. WHEN the admin updates status, THEN the system SHALL:
   - Record the status change with timestamp
   - (Future) Trigger notification to user
3. WHEN the user views their order history, THEN they SHALL see the current status.

#### Tests

- **Unit Tests**
  - Validate status transition logic
  - Validate status history recording

- **UI Tests**
  - Verify status dropdown/selector in order detail
  - Verify status updates reflect in user view

---

### Requirement 5: User Management

**As an admin, I want to view registered users, so that I can see who has access.**

#### Acceptance Criteria

1. WHEN the admin navigates to "Users", THEN the system SHALL display:
   - List of all registered users
   - User name, email, photo, registration date
   - Number of orders per user
   - Which token they used to register
2. WHEN the admin clicks a user, THEN the system SHALL display:
   - User profile details
   - Full order history for that user
3. IF needed, THEN the admin SHALL be able to disable a user's access (soft delete).

#### Tests

- **Unit Tests**
  - Validate user list retrieval
  - Validate user order count aggregation

- **UI Tests**
  - Verify user list displays with order counts
  - Verify user detail shows order history

---

## Out of Scope (Future)

- **Real-time notifications** (push, email, WhatsApp) — Future
- **Multi-admin roles** (super admin vs manager) — Future
- **Advanced analytics** (charts, trends, predictions) — Future
- **Inventory management** (stock at source) — Future
- **Financial reports** (profit/loss, tax reports) — Future

---

## Data Model (Phase 3 uses existing tables)

No new tables — uses existing:
- `tokens` (created in Phase 2)
- `users` (created in Phase 2)
- `orders` (created in Phase 2)
- `items` (from Phase 1)

### Enhanced Order Status Flow
```
Confirmed → Purchased → Shipped → Delivered
   ↑
(Cancelled - Future)
```

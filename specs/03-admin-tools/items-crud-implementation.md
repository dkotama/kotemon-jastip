# Admin Items CRUD - Implementation Report

## Overview

This document describes the implementation of the Admin Items CRUD integration, connecting the frontend admin panel to the backend API.

## Implementation Date
2026-02-01

---

## API Endpoints Implemented

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/admin/items` | Fetch all items (including archived) |
| `GET` | `/api/admin/items/:id` | Fetch single item for editing |
| `POST` | `/api/admin/items` | Create new item |
| `PATCH` | `/api/admin/items/:id` | Update existing item |
| `DELETE` | `/api/admin/items/:id` | Archive item (soft delete) |
| `POST` | `/api/admin/upload` | Upload item photos |

---

## Frontend Components

### ItemListPage (`sections/admin/ItemListPage.tsx`)
- Displays table of all items with search filter
- Status badges: Available, Low Stock, Full, Draft, Archived
- Actions: Edit, Archive (soft delete)
- Image rendering via `getImageUrl()` helper

### ItemFormPage (`sections/admin/ItemFormPage.tsx`)
- Create/Edit form with live preview
- Fields implemented:
  - Name, Description, Category
  - Base Price (JPY) - Input
  - Base Price (IDR) - Read-only, calculated by backend
  - Selling Price (IDR) - Input
  - Weight (grams), Max Orders
  - Flags: Draft, Limited Edition, Preorder, Fragile, Without Box
  - Photos: Upload with preview
  - Info Notes: Array of colored badges (amber/purple/blue/red)

---

## Database Schema Changes

The following columns are required in the `items` table:

```sql
-- Migration 0005
ALTER TABLE items ADD COLUMN category TEXT CHECK (category IN ('snack', 'skincare', 'makeup', 'stationery', 'gift', 'beverage', 'accessories'));
ALTER TABLE items ADD COLUMN info_notes TEXT DEFAULT '[]';

-- Migration 0006
ALTER TABLE items ADD COLUMN base_price_rp INTEGER NOT NULL DEFAULT 0;
```

---

## API Client Functions (`api/client.ts`)

```typescript
// Admin API namespace
adminApi = {
  login: (password) => ...,
  getItems: (token) => fetchApi<Item[]>('/api/admin/items', ...),
  getItemById: (token, id) => fetchApi<Item>(`/api/admin/items/${id}`, ...),
  createItem: (token, payload) => ...,
  updateItem: (token, id, payload) => ...,
  deleteItem: (token, id) => ...,
  uploadPhoto: (token, file) => ...,
}
```

### Image URL Helper
```typescript
getImageUrl(photoPath: string): string
// Handles relative paths like "/api/public/photos/uploads/..." 
// by prepending the correct base URL
```

---

## Key Implementation Details

### Price Calculation
- `basePriceYen` is input by admin
- `basePriceRp` is **calculated by backend**: `basePriceYen × exchangeRate`
- `sellingPriceRp` is input by admin (what customer pays)
- Exchange rate comes from Settings

### Archive (Soft Delete)
- Sets `isAvailable = false`
- Item hidden from public catalog
- Data preserved for order history
- Admin can restore by editing item

### Info Notes
- Array of `{ type: 'amber'|'purple'|'blue'|'red', text: string }`
- Displayed as colored badges on item detail
- Stored as JSON in `info_notes` column

---

## Files Modified

### Backend (`apps/api/`)
- `src/routes/admin.ts` - Added GET /items/:id route, fixed field mappings
- `src/db/client.ts` - Already had proper CRUD functions

### Frontend (`apps/web/`)
- `src/api/client.ts` - adminApi methods, getImageUrl helper
- `src/sections/admin/ItemListPage.tsx` - List with archive action
- `src/sections/admin/ItemFormPage.tsx` - Create/edit form with all fields
- `src/components/PublicItemCard.tsx` - Reusable item card component
- `src/types/index.ts` - Item, InfoNote, CreateItemPayload types

---

## Future Improvements

- [ ] Add status filter (All / Available / Archived / Draft)
- [ ] Add "Restore" quick action for archived items
- [ ] Bulk actions (archive multiple, update category)
- [ ] Image reordering via drag-and-drop
- [ ] Duplicate item functionality

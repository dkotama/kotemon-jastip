# Index/Landing Page API - Implementation Report

## Overview

This document describes the implementation of the consolidated Index/Landing Page API, which optimizes the initial page load by combining multiple API calls into a single request.

## Implementation Date
2026-02-01

---

## Problem Statement

The landing page was making **2 separate API calls** on initial load:
1. `GET /api/public/config` - jastip status, countdown, quota
2. `GET /api/public/items` - all available items

This caused:
- Extra network latency (2 round trips)
- Frontend complexity managing multiple loading states
- No organized grouping of items (latest, featured, popular)

---

## Solution

New **`GET /api/public/index`** endpoint that returns all landing page data in a single request with organized item groupings.

---

## API Endpoint

### GET /api/public/index

**Response:**
```json
{
  "success": true,
  "data": {
    "config": {
      "jastipStatus": "open",
      "countdownDays": 5,
      "remainingQuotaKg": 15.5,
      "totalQuotaKg": 20,
      "estimatedArrivalDate": "6-10 May 2025"
    },
    "items": {
      "latest": [...],      // 8 newest items
      "featured": [...],    // Limited edition, preorder items
      "popular": [...],     // 8 most viewed items
      "all": [...]          // All available items for search/filter
    },
    "meta": {
      "totalItems": 45,
      "lastUpdated": "2026-02-01T10:00:00.000Z"
    }
  }
}
```

### Item Grouping Logic

| Section | Criteria | Limit |
|---------|----------|-------|
| `latest` | `ORDER BY created_at DESC` | 8 items |
| `featured` | `is_limited_edition = 1 OR is_preorder = 1` | 8 items |
| `popular` | `ORDER BY view_count DESC` | 8 items |
| `all` | All available, non-draft items | No limit |

---

## Files Modified

### Backend (`apps/api/`)

#### 1. `src/types.ts`
Added new interfaces:
```typescript
export interface IndexPageItems {
  latest: PublicItem[];
  featured: PublicItem[];
  popular: PublicItem[];
  all: PublicItem[];
}

export interface IndexPageResponse {
  config: PublicConfig;
  items: IndexPageItems;
  meta: {
    totalItems: number;
    lastUpdated: string;
  };
}
```

#### 2. `src/db/client.ts`
Added database query function:
```typescript
export interface IndexItemsResult {
  latest: Item[];
  featured: Item[];
  popular: Item[];
  all: Item[];
}

export async function getItemsForIndex(db: D1Database): Promise<IndexItemsResult>
```

#### 3. `src/routes/public.ts`
- Added `toPublicItem()` helper for consistent item transformation
- Added `GET /api/public/index` route handler
- Consolidated config calculation and item fetching

### Frontend (`apps/web/`)

#### 4. `src/api/client.ts`
Added API method:
```typescript
publicApi.getIndexPage: () => Promise<IndexPageResponse>
```

#### 5. `src/App.tsx`
- Replaced `Promise.all([getConfig(), getItems()])` with single `getIndexPage()` call
- Updated item transformation to use `sellingPriceRp` (correct field name)
- Added `infoNotes` mapping to transformed items

---

## Benefits

1. **Reduced Latency**: Single HTTP request vs 2 requests
2. **Better Organization**: Backend controls item groupings (latest, featured, popular)
3. **Extensible**: Easy to add personalized sections later (e.g., "Recommended for you")
4. **Consistent**: Follows existing API patterns from Phase 1-3 specs
5. **Future-Proof**: Meta information (lastUpdated) enables client-side caching

---

## Database Queries

The implementation uses the existing `getItems()` function with optimized in-memory sorting/filtering:

```sql
-- Single query to get all available items
SELECT * FROM items 
WHERE is_available = 1 AND is_draft = 0 
ORDER BY created_at DESC
LIMIT 1000;
```

Then filtered in JavaScript:
- `latest`: First 8 items (already sorted by created_at)
- `featured`: Filter by `isLimitedEdition || isPreorder`
- `popular`: Sort by `viewCount` descending

---

## Backward Compatibility

Existing endpoints remain functional:
- `GET /api/public/config` ✓
- `GET /api/public/items` ✓
- `GET /api/public/items/:id` ✓
- `POST /api/public/items/:id/view` ✓
- `GET /api/public/photos/*` ✓

---

## Testing Checklist

- [ ] API returns correct structure
- [ ] Config values match individual endpoint
- [ ] Item counts are correct (8 latest, 8 featured, 8 popular)
- [ ] Badge calculation (new, low_stock, full) works correctly
- [ ] Frontend displays items correctly
- [ ] Search/filter still works with `all` items array
- [ ] Loading states work correctly

---

## Future Improvements

- [ ] Add server-side caching with `Cache-Control` headers
- [ ] Add `If-Modified-Since` support for conditional requests
- [ ] Add personalized "Recommended" section based on user history
- [ ] Add category breakdown in meta (e.g., "15 snacks, 10 skincare...")
- [ ] Support for pagination on `all` items

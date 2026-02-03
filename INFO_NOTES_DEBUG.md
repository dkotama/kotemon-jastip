# Info Notes Debug - Fix Summary

## Issues Fixed

### Issue 1: "Informasi Penting" showing for items without info notes
**Problem**: The `withoutBoxNote` is a **boolean** (`true`/`false`), but the code was using it as a string:
```typescript
// BEFORE (WRONG)
if (item.withoutBoxNote) {
  infoNotes.push({ type: 'blue', text: item.withoutBoxNote }); // text = true (boolean!)
}
```

**Fix**: Use proper string message:
```typescript
// AFTER (CORRECT)
if (item.withoutBoxNote) {
  infoNotes.push({ type: 'amber', text: 'Dikirim tanpa box/dus - Untuk menghindari pajak bea cukai' });
}
```

### Issue 2: "No box information" not rendered
**Problem**: The `withoutBoxNote` was using `blue` type but should be `amber` per design spec.

**Fix**: Updated colors to match design spec:
- `withoutBoxNote` → **Amber** (Tanpa Box)
- `isLimitedEdition` → **Purple** (Limited Edition)  
- `isPreorder` → **Blue** (Pre-order)
- `isFragile` → **Red** (Fragile)

### Issue 3: Backend `infoNotes` array was ignored
**Problem**: Only boolean flags were used, custom `infoNotes` from backend were not displayed.

**Fix**: Added merging of backend `infoNotes` with auto-generated flag notes (with duplicate detection).

---

## Test Items Created

8 test items inserted with various flag combinations:

| ID | Name | Flags | Expected Info Notes |
|----|------|-------|---------------------|
| `test-all-flags` | All Flags Enabled | withoutBox + Limited + Preorder + Fragile | 4 notes + 1 custom |
| `test-no-box-only` | Tanpa Box Only | withoutBox only | 1 amber note |
| `test-limited-only` | Limited Edition Only | Limited only | 1 purple note |
| `test-preorder-only` | Preorder Only | Preorder only | 1 blue note |
| `test-fragile-only` | Fragile Only | Fragile only | 1 red note |
| `test-custom-only` | Custom Info Only | None (custom notes only) | 2 custom notes |
| `test-mix-custom` | Mix + Custom | withoutBox + Fragile + custom | 2 auto + 1 custom |
| `test-no-info` | No Info | None | No "Informasi Penting" section |

---

## Files Modified

1. **`apps/web/src/sections/ItemDetailModal.tsx`**
   - Fixed `withoutBoxNote` to use proper string text
   - Updated color mapping per design spec
   - Added `PackageX` icon import
   - Updated icon mapping (amber=PackageX, blue=Clock)
   - Added backend `infoNotes` merging with duplicate detection

2. **`apps/api/scripts/seed-test-items.sql`** (new)
   - SQL to insert 8 test items with various flag combinations

3. **`apps/api/scripts/fix-test-images.sql`** (new)
   - SQL to update photo paths to use localhost:5173 URLs

---

## How to Test

### 1. Start the API server
```bash
cd apps/api
npm run dev
```

### 2. Start the web dev server (in another terminal)
```bash
cd apps/web
npm run dev
```

### 3. Open the landing page
Navigate to `http://localhost:5173` and login if needed.

### 4. Test the items
Look for items starting with "TEST:" and click on each to verify:

- **TEST: All Flags Enabled** → Should show 5 info notes (4 auto + 1 custom)
- **TEST: Tanpa Box Only** → Should show 1 amber note with box icon
- **TEST: Limited Edition Only** → Should show 1 purple note with sparkles
- **TEST: Preorder Only** → Should show 1 blue note with clock
- **TEST: Fragile Only** → Should show 1 red note with warning triangle
- **TEST: Custom Info Only** → Should show 2 custom notes (no auto-generated)
- **TEST: Mix + Custom** → Should show 3 notes (withoutBox, Fragile, custom)
- **TEST: No Info** → Should NOT show "Informasi Penting" section at all

---

## Design Spec Reference

From `specs/01-core-system/design.md`:

| Type | Icon | Color | Trigger |
|------|------|-------|---------|
| **Tanpa Box** | 📦❌ | **Amber** | `withoutBoxNote = true` |
| **Limited Edition** | ⭐ | **Purple** | `isLimitedEdition = true` |
| **Pre-order** | ⏰ | **Blue** | `isPreorder = true` |
| **Fragile** | 🥚 | **Red** | `isFragile = true` |

---

## Cleanup (when done testing)

To remove test items:
```sql
DELETE FROM items WHERE id LIKE 'test-%';
```

Or run:
```bash
cd apps/api
npx wrangler d1 execute kotemon-jastip-db --local --command="DELETE FROM items WHERE id LIKE 'test-%'"
```

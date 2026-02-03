# Date Synchronization Fix - Estimasi & Tutup

## Problem
The "Estimasi" (estimated arrival date) and "Tutup" (close date) were not synchronized because:

1. **Frontend used wrong field names:**
   - `arrivalDate` instead of `estimatedArrivalDate`
   - `countdownTarget` instead of `jastipCloseDate`

2. **Settings were not being saved to backend** because the field names didn't match the API schema

## Solution

### 1. Updated Type Definitions (`apps/web/src/types/index.ts`)

```typescript
// BEFORE (wrong)
export interface JastipSettings {
  arrivalDate: Date | null;        // ❌ Wrong name
  countdownTarget: Date | null;    // ❌ Wrong name
}

// AFTER (correct)
export interface JastipSettings {
  jastipCloseDate: Date | string | null;      // ✅ Matches backend
  estimatedArrivalDate: Date | string | null; // ✅ Matches backend
}
```

### 2. Updated SettingsPage (`apps/web/src/sections/admin/SettingsPage.tsx`)

- Changed field names from `arrivalDate` → `estimatedArrivalDate`
- Changed field names from `countdownTarget` → `jastipCloseDate`
- Added validation: calendar disables dates before close date for arrival
- Added validation: calendar disables past dates for close date
- Updated labels to Indonesian:
  - "Estimasi Tanggal Sampai" (was: Arrival Date)
  - "Tanggal Tutup Order" (was: Countdown Target)

### 3. Updated StatusBanner (`apps/web/src/sections/StatusBanner.tsx`)

- Added date synchronization check
- Shows warning if `arrivalDate < closeDate`:
  - Red text for arrival date
  - Warning icon with tooltip "(sebelum tutup!)"

### 4. Updated App.tsx

- Maps `estimatedArrivalDate` correctly from API response
- Passes `closeDate` to StatusBanner for validation

## Validation Rules

1. **Tutup (Close Date)**:
   - Cannot be in the past
   - Saved as `jastipCloseDate`

2. **Estimasi (Arrival Date)**:
   - Cannot be before close date
   - Calendar disables invalid dates
   - Saved as `estimatedArrivalDate`

## Date Flow

```
Admin Settings Page
├─ Select "Tanggal Tutup" → saves to backend (jastipCloseDate)
├─ Select "Estimasi Tanggal Sampai" → saves to backend (estimatedArrivalDate)
│   └─ Calendar disables dates before "Tanggal Tutup"
│
Landing Page (StatusBanner)
├─ Shows: "Tutup dalam X hari" (from jastipCloseDate)
├─ Shows: "Estimasi sampai: [date]" (from estimatedArrivalDate)
└─ Shows warning if arrival < close
```

## Testing Checklist

- [ ] Set close date (tutup) in admin settings
- [ ] Set arrival date (estimasi) - should not allow dates before close date
- [ ] Check landing page shows correct dates
- [ ] Check warning appears if arrival < close
- [ ] Verify countdown shows days until close date

## Files Modified

1. `apps/web/src/types/index.ts` - Fixed field names
2. `apps/web/src/sections/admin/SettingsPage.tsx` - Updated to use correct fields + validation
3. `apps/web/src/sections/StatusBanner.tsx` - Added sync warning
4. `apps/web/src/App.tsx` - Correct field mapping

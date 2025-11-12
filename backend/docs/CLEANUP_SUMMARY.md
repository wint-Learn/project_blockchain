# Cleanup Summary: pre_verified_cccd Table

**Date**: 2025-10-27

## Changes Made:

### 1. Database Structure

#### Added Column:
- ✅ `cccd_number` VARCHAR(12) - CCCD plaintext (for demo/development)

#### Removed Columns:
- ❌ `place_of_origin` - Không cần thiết
- ❌ `place_of_residence` - Không cần thiết

#### Data Cleanup:
- ❌ Deleted 6 records with NULL `cccd_number`
- ✅ Kept 2 valid records:
  - ID 1: CCCD 036202012345
  - ID 14: CCCD 036202012346

### 2. Code Changes

#### Modified Files:

**1. `src/services/verification/pre-verification.service.js`**
- Removed `placeOfOrigin` and `placeOfResidence` from `formatCitizenInfo()`

**2. `src/services/shared/database.helper.js`**
- Updated SQL query in `getCitizenInfo()` to remove `place_of_origin, place_of_residence`

**3. `src/services/admin/cccd-management.service.js`**
- Updated INSERT to include `cccd_number` plaintext
- Query: `INSERT INTO pre_verified_cccd (cccd_number, cccd_number_hash, phone_number, status, notes)`

### 3. Impact Analysis

#### ✅ No Breaking Changes:
- All existing code using `cccd_number_hash` still works
- Backend services query by hash (unchanged)
- Frontend unchanged (no impact)

#### ✅ Benefits:
- Easier debugging: Can see CCCD plaintext in database
- Admin import now saves plaintext + hash
- Cleaner schema: Removed unused columns

#### ⚠️ Note:
- `cccd_number` is for **development/demo only**
- In production, consider encrypting or removing plaintext column
- Hash is still used for all queries and blockchain mapping

### 4. Migration Scripts

Created scripts:
- `run-add-cccd-plaintext.js` - Add cccd_number column
- `populate-cccd-plaintext.js` - Populate existing records
- `clean-pre-verified-table.js` - Remove NULL records and unused columns

## Final Schema

```sql
pre_verified_cccd:
  - id (PK)
  - cccd_number VARCHAR(12) NULL         -- NEW: plaintext
  - cccd_number_hash VARCHAR(66) NULL
  - phone_number VARCHAR(15) NOT NULL
  - status VARCHAR(20)
  - verified_at TIMESTAMP
  - claimed_at TIMESTAMP
  - notes TEXT
  - created_at TIMESTAMP
  - updated_at TIMESTAMP
  - full_name VARCHAR(255)
  - date_of_birth DATE
  - gender VARCHAR(10)
  - address TEXT
  - issue_date DATE
```

## Testing Checklist

- [x] Database migration successful
- [x] Records with NULL cccd_number deleted
- [x] Unused columns dropped
- [x] Code updated to remove references to dropped columns
- [x] No syntax errors in backend files
- [x] Admin CCCD import updated to save plaintext
- [ ] Test OTP flow (should work unchanged)
- [ ] Test registration flow (should work unchanged)
- [ ] Test admin import CSV (should now save plaintext)

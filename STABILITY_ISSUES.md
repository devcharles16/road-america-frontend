# Stability Issues & Recommended Fixes

## 1. API Base URL Inconsistencies

### Issue
Multiple services define `API_BASE_URL` with different default values, creating inconsistency and potential runtime errors.

**Files with inline definitions:**
- `src/services/apiClient.ts` - Default: `"http://localhost:4000"`
- `src/services/shipmentsService.ts` - Default: `"http://localhost:4000"`
- `src/services/blogService.ts` - Default: `"http://localhost:4000"`
- `src/services/adminUsersService.ts` - Default: `"http://localhost:4000"`

**Files using centralized config:**
- `src/services/adminQuotesService.ts` - Uses `config/api.ts` (default: `"https://road-america-backend.onrender.com"`)
- `src/services/quotesService.ts` - Uses `config/api.ts`
- `src/pages/QuotePage.tsx` - Uses `config/api.ts`
- `src/pages/AdminShipmentsPage.tsx` - Uses `config/api.ts`

### Problems
1. **Different defaults** between centralized config and inline definitions
2. **Harder to maintain** - changes require updates in multiple files
3. **Runtime errors** if env var is missing and defaults differ

### Fix
**Change all services to import from `src/config/api.ts`:**
- `src/services/apiClient.ts` - Remove inline definition, import from config
- `src/services/shipmentsService.ts` - Remove inline definition, import from config
- `src/services/blogService.ts` - Remove inline definition, import from config
- `src/services/adminUsersService.ts` - Remove inline definition, import from config

**Update `src/config/api.ts` to have consistent default:**
```typescript
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "https://road-america-backend.onrender.com";
```

---

## 2. Reference ID Field Name Mismatches (reference_id vs referenceId)

### Issue
Backend uses snake_case (`reference_id`), frontend expects camelCase (`referenceId`). Mapping is inconsistent across services.

**Backend responses:**
- Database columns: `reference_id` (snake_case)
- Some endpoints map to `referenceId`, others don't

**Frontend type mismatches:**
- `src/services/quotesService.ts:35` - `AdminQuoteRow` has BOTH `reference_id?: string | null` AND `referenceId?: string | null` (confusing)
- `src/components/admin/LiveShipmentsCard.tsx:23` - Uses `reference_id?: string` (snake_case)
- Most other components expect `referenceId` (camelCase)

**Backend mapping inconsistencies:**
- `server/routes/shipmentsRouter.js:67` - Maps `referenceId: data.reference_id` ✓
- `server/routes/shipmentsRouter.js:220` - Maps `referenceId: s.reference_id` ✓
- `server/routes/shipmentsRouter.js:274` - Maps `referenceId: s.reference_id` ✓
- `server/routes/shipmentsRouter.js:338` - Maps `referenceId: q.reference_id` ✓
- But `src/components/admin/LiveShipmentsCard.tsx` expects `reference_id` (direct DB field)

### Problems
1. **Type confusion** - `AdminQuoteRow` has both fields
2. **Runtime errors** - Components accessing wrong field name
3. **Inconsistent data shape** - Some endpoints map, others don't

### Fix
**Backend (server/routes/shipmentsRouter.js):**
- Ensure ALL endpoints that return quote/shipment data map `reference_id` → `referenceId`
- Verify `GET /api/track` response includes `referenceId` mapping (currently does ✓)

**Frontend:**
- `src/services/quotesService.ts` - Remove `reference_id` from `AdminQuoteRow`, keep only `referenceId`
- `src/components/admin/LiveShipmentsCard.tsx` - Change `reference_id` to `referenceId` in type and usage (lines 23, 80, 197, 201)

---

## 3. Token Access Function Duplication

### Issue
Multiple services define their own `getAccessToken()` or `getAccessTokenOrThrow()` functions instead of using the centralized `apiClient.ts`.

**Duplicate implementations:**
- `src/services/shipmentsService.ts:90` - `getAccessToken()` (returns `string | null`)
- `src/services/quotesService.ts:63` - `getAccessTokenOrThrow()` (throws on missing)
- `src/services/blogService.ts:33` - `getAccessToken()` (returns `string | null`)
- `src/services/adminUsersService.ts:21` - `getAccessToken()` (returns `string | null`)

**Centralized (should use this):**
- `src/services/apiClient.ts:15` - `getAccessTokenOrThrow()` (throws on missing)
- `src/services/apiClient.ts:10` - `getFreshAccessToken()` (returns `string | null`)

### Problems
1. **Code duplication** - Same logic in multiple files
2. **Inconsistent error handling** - Some throw, some return null
3. **Harder to fix token refresh bugs** - Must update multiple locations

### Fix
**Replace all duplicate functions with imports from `apiClient.ts`:**

- `src/services/shipmentsService.ts` - Remove `getAccessToken()`, import `getAccessTokenOrThrow` from `apiClient.ts`
  - Update calls: `await getAccessToken()` → `await getAccessTokenOrThrow()`
  - Remove null checks (function throws on missing token)

- `src/services/blogService.ts` - Remove `getAccessToken()`, import `getAccessTokenOrThrow` from `apiClient.ts`
  - Update calls: `await getAccessToken()` → `await getAccessTokenOrThrow()`
  - Remove null checks

- `src/services/adminUsersService.ts` - Remove `getAccessToken()`, import `getAccessTokenOrThrow` from `apiClient.ts`
  - Update calls: `await getAccessToken()` → `await getAccessTokenOrThrow()`
  - Remove null checks

- `src/services/quotesService.ts` - Remove `getAccessTokenOrThrow()`, import from `apiClient.ts`

**Note:** `quotesService.ts` already uses `fetchWithAuth()` for conversion (good), but `adminListQuotes()` uses duplicate token function.

---

## 4. Logout/Session Persistence Issues

### Issue
Complex logout flow with multiple cleanup attempts. Admin key storage not cleared on logout.

**Current logout flow (AuthContext.tsx:178-208):**
1. Sets `isLoggingOutRef.current = true`
2. Calls `supabase.auth.signOut({ scope: "global" })`
3. Calls `clearSupabaseAuthStorage()` (localStorage/sessionStorage cleanup)
4. Verifies session still exists, calls `signOut({ scope: "local" })` again
5. Clears storage again
6. Resets `isLoggingOutRef.current = false`

**Missing cleanup:**
- `src/utils/adminAuth.ts` - `clearAdminKey()` is never called during logout
- Admin key persists in localStorage after logout

### Problems
1. **Admin key leakage** - Admin key remains in localStorage after logout
2. **Complex logout flow** - Multiple cleanup attempts suggest race conditions
3. **Potential session persistence** - Multiple cleanup attempts needed suggests underlying issue

### Fix
**Add admin key cleanup to logout:**
- `src/context/AuthContext.tsx:178` - Import `clearAdminKey` from `utils/adminAuth`
- In `logout()` function, call `clearAdminKey()` after `clearSupabaseAuthStorage()`

```typescript
import { clearAdminKey } from "../utils/adminAuth";

// In logout() function:
clearSupabaseAuthStorage();
clearAdminKey(); // Add this
```

---

## 5. Route Guard Logic Issues

### Issue 5a: AuthPublicGate Logic is Inverted
**File:** `src/routes/AuthPublicGate.tsx:4-5`

```typescript
const AUTH_PUBLIC_ENABLED =
  import.meta.env.VITE_AUTH_PUBLIC_ENABLED === "false";
```

**Problem:** Variable name suggests `true` = enabled, but logic checks for `"false"` string, making it confusing.

**Fix:** Rename or invert logic:
```typescript
const AUTH_PUBLIC_DISABLED =
  import.meta.env.VITE_AUTH_PUBLIC_ENABLED === "false";
```
Then update condition: `if (AUTH_PUBLIC_DISABLED && !isAllowed)`

### Issue 5b: Duplicate Redirect Logic
**Files:**
- `src/components/Header.tsx:42-62` - Redirects from auth pages based on role
- `src/pages/PostLoginRedirectPage.tsx:21-49` - Same redirect logic

**Problem:** Two places handle the same redirect logic, potential conflicts.

**Fix:** Remove redirect logic from `Header.tsx:42-62`. Let `PostLoginRedirectPage` handle all post-login redirects. The Header redirects are redundant since auth pages should redirect via `PostLoginRedirectPage` or the route guards.

### Issue 5c: RequireRoles Loading State
**File:** `src/routes/RequireRoles.tsx:18-20`

**Current:** Shows loading message when `loading || role === undefined`

**Potential issue:** If `loading` is false but `role` is still `undefined`, shows loading message. This is correct but could be clearer.

**Fix:** Current implementation is fine, but consider adding a timeout/fallback if loading takes too long (similar to PostLoginRedirectPage).

---

## 6. Quote to Shipment Conversion - User ID Mapping

### Issue
When quotes are converted to shipments, `user_id` may not be set, causing client shipments to not appear in `/my-shipments`.

**Backend conversion:**
- `server/routes/shipmentsRouter.js:93` - Calls `convert_quote_to_shipment` RPC function
- No explicit `user_id` mapping in the conversion
- Quotes don't have `user_id` (they're public submissions)

**Client shipments endpoint:**
- `server/routes/shipmentsRouter.js:200-212` - Filters by `user_id.eq.${userId}` OR `customer_email.ilike.%${email}%`
- If shipment `user_id` is null and email doesn't match exactly, shipment won't appear

### Problems
1. **Missing shipments** - Clients may not see their shipments if:
   - Quote was submitted before they registered
   - Email case/format doesn't match exactly
   - `user_id` is null after conversion

2. **No user association** - Quotes converted to shipments don't get linked to user accounts

### Fix
**Option 1 (Recommended):** Update `convert_quote_to_shipment` DB function to:
- Accept optional `user_id` parameter
- If provided, set shipment `user_id` during conversion
- Backend should pass `user_id` from authenticated user when available

**Option 2:** Improve email matching in `/api/my-shipments`:
- Use case-insensitive exact match: `.eq("customer_email", email)` instead of `.ilike("%${email}%")`
- Or normalize emails (lowercase, trim) before comparison

**Option 3:** Allow admins to manually link shipments to users via a user assignment feature.

---

## Summary of Required Changes

### High Priority (Runtime Errors)
1. ✅ **API Base URL inconsistencies** - Standardize on `config/api.ts`
2. ✅ **Reference ID field mismatches** - Fix `LiveShipmentsCard.tsx` and `AdminQuoteRow` type
3. ✅ **Token function duplication** - Use centralized `apiClient.ts` functions

### Medium Priority (Data/UX Issues)
4. ✅ **Admin key cleanup on logout** - Add `clearAdminKey()` call
5. ✅ **Quote→Shipment user_id mapping** - Link shipments to user accounts during conversion
6. ✅ **Duplicate redirect logic** - Remove from Header.tsx

### Low Priority (Code Quality)
7. ✅ **AuthPublicGate variable naming** - Rename for clarity
8. ✅ **Route guard loading timeouts** - Add fallbacks if needed


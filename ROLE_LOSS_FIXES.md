# Role Loss Issue - Fixes Applied

## Summary
Fixed critical bugs causing role to be lost on refresh/navigation/logout-login. The fixes ensure role is always fetched from the database (single source of truth) and prevent race conditions with Supabase auth hydration.

## Changes Made

### 1. Added Explicit Initial Session Fetch (CRITICAL FIX)
**File**: `src/context/AuthContext.tsx` (lines 370-410)

**Problem**: Relied solely on `onAuthStateChange` to hydrate session, but Supabase may not fire this event immediately on mount if session already exists in localStorage.

**Fix**: Added a `useEffect` that explicitly calls `getSession()` on mount (after a 100ms delay to let `onAuthStateChange` fire first if it will). This ensures:
- Session is always hydrated on page refresh
- Role is fetched even if `onAuthStateChange` doesn't fire immediately
- No duplicate fetches (checks if user is already loaded)

### 2. Fixed Stale Closure Bug
**File**: `src/context/AuthContext.tsx` (lines 228-265)

**Problem**: `hydrateFromSession` had `role` in dependency array, creating a stale closure. The optimization check `role !== undefined` used stale values.

**Fix**: 
- Removed `role` from dependencies
- Added `roleFetchedForUserRef` to track if role has been fetched (distinguishes "not fetched" from "fetched and got null")
- Changed optimization check to use refs instead of state: `roleFetchInProgressRef.current || roleFetchedForUserRef.current`

### 3. Improved Role Fetch Tracking
**File**: `src/context/AuthContext.tsx` (lines 108, 126, 138-156, 260)

**Problem**: Couldn't distinguish between "role not fetched yet" and "role fetched and is null".

**Fix**: 
- Added `roleFetchedForUserRef` to track fetch completion
- Set to `true` after successful fetch (even if role is null)
- Set to `false` on timeout errors (allows retry)
- Set to `true` on other errors (prevents infinite retries, user can manually retry)

### 4. Reset Flags on Logout
**File**: `src/context/AuthContext.tsx` (line 126)

**Fix**: Reset `roleFetchedForUserRef.current = false` in `setLoggedOut` to ensure clean state.

## How It Works Now

### On Page Refresh:
1. Component mounts, all refs reset
2. `onAuthStateChange` listener is set up
3. Initial session fetch runs after 100ms
4. If `onAuthStateChange` fired first:
   - Role fetch already in progress or completed
   - Initial session fetch sees `roleFetchedForUserRef.current === true` and skips
5. If `onAuthStateChange` didn't fire:
   - Initial session fetch hydrates session and fetches role
   - `onAuthStateChange` fires later but sees role already fetched and skips

### On Logout-Login:
1. Logout resets all refs (`roleFetchedForUserRef.current = false`)
2. Login triggers `onAuthStateChange`
3. `hydrateFromSession` sees new user (or `roleFetchedForUserRef.current === false`)
4. Role is fetched from database

### On Navigation (Token Refresh):
1. `onAuthStateChange` fires with `TOKEN_REFRESHED` event
2. `hydrateFromSession` sees same user and `roleFetchedForUserRef.current === true`
3. Skips role fetch, just updates user object
4. Role persists correctly

## Single Source of Truth

Role is **always** fetched from the database (`profiles` table) when:
- User logs in
- Page refreshes (if not already fetched)
- User changes

Role is **never** cached in a way that prevents refetching when needed. The `roleFetchedForUserRef` flag only prevents unnecessary refetches on benign auth events (token refresh), not on user changes or page refreshes.

## Testing Recommendations

1. **Page Refresh**: Login, refresh page, verify role persists
2. **Logout-Login**: Login, logout, login again, verify role loads
3. **Navigation**: Login, navigate between pages, verify role persists
4. **Token Refresh**: Wait for token to refresh, verify role persists
5. **Multiple Tabs**: Login in one tab, refresh other tab, verify role loads

## Files Modified

- `src/context/AuthContext.tsx`: Core fixes for role fetching and hydration

## Notes

- The 100ms delay in initial session fetch is intentional to let `onAuthStateChange` fire first if it will, avoiding duplicate fetches
- Timeout errors allow retry (don't mark as fetched), other errors prevent infinite retries
- All fixes are minimal and focused on the root causes - no major refactoring



# Role Loss Issue - Root Cause Analysis

## Symptoms
- User logs in successfully
- Role is correct initially
- After refresh / navigation / logout-login, role becomes null or undefined
- RequireRoles redirects or blocks access

## Root Causes Identified

### 1. **Missing Initial Session Fetch** (CRITICAL)
**Location**: `AuthContext.tsx` line 319-353

**Problem**: The code relies solely on `onAuthStateChange` to hydrate the session. However:
- Supabase's `onAuthStateChange` may not fire immediately on mount if the session is already in localStorage
- There's no explicit `getSession()` call on mount to ensure we hydrate from an existing session
- On page refresh, the component mounts but might not receive the initial `INITIAL_SESSION` event

**Impact**: On refresh, if `onAuthStateChange` doesn't fire immediately, the user remains logged in (session exists) but role is never fetched.

### 2. **Stale Closure Bug in `hydrateFromSession`** (CRITICAL)
**Location**: `AuthContext.tsx` line 225-254

**Problem**: The `hydrateFromSession` callback includes `role` in its dependency array (line 253), creating a closure that captures a stale `role` value. The optimization check on line 239:
```typescript
if (activeUserIdRef.current === userId && role !== undefined) {
```
uses this stale `role` value, not the current state.

**Impact**: 
- After logout-login with the same user, `activeUserIdRef.current` might still match, and the stale `role` check might incorrectly skip fetching
- On refresh, if the callback was created with `role = null`, it might prevent refetching even when it should

### 3. **Flawed Optimization Logic**
**Location**: `AuthContext.tsx` line 237-242

**Problem**: The check `role !== undefined` is meant to prevent unnecessary refetches, but:
- It uses stale closure value (see #2)
- `role = null` is a valid state meaning "user has no role", but the check treats it as "needs fetching"
- The logic should distinguish between "loading" (`undefined`) and "no role" (`null`)

**Impact**: May prevent legitimate refetches when role should be reloaded.

### 4. **Race Condition on State Reset**
**Location**: `AuthContext.tsx` line 83, 110-121

**Problem**: 
- `role` is initialized to `null` (line 83)
- On logout, `setLoggedOut` resets everything including `activeUserIdRef.current` to `null`
- On refresh, state resets but `activeUserIdRef.current` also resets
- If `onAuthStateChange` fires before state is fully initialized, the optimization check might fail

**Impact**: Role might not be fetched on refresh if timing is off.

### 5. **No Single Source of Truth**
**Problem**: Role is stored in:
- React state (`role`)
- Ref (`lastGoodRoleRef`)
- Database (profiles table)

But there's no clear priority or fallback strategy when these diverge.

## Proposed Fixes

### Fix 1: Add Explicit Initial Session Fetch
Add a `useEffect` that explicitly fetches the session on mount, independent of `onAuthStateChange`.

### Fix 2: Remove Stale Closure Dependency
Remove `role` from `hydrateFromSession` dependencies and use a ref or functional state update instead.

### Fix 3: Improve Optimization Check
Use a ref to track "role fetch in progress" instead of relying on state value checks.

### Fix 4: Ensure Single Source of Truth
Always fetch role from database when user changes, don't rely on cached state.



# Authentication 401 Error - Fix Summary

## Problem

Users were experiencing **401 Unauthorized** errors when making API calls to `/api/auth/me` despite being authenticated. This occurred because:

1. **Token Storage Mismatch**: The `useAuth` hook stored tokens in `funnelagents_auth_token`
2. **API Client**: The `nestjsClient` looked for tokens in `nestjs_access_token`
3. **Result**: Tokens were stored in one location but read from another, causing authentication failures

## Solution

### Changes Made

1. **Updated `useAuth` hook** (`apps/web-ui/src/hooks/useAuth.jsx`)
   - Changed to use the unified `nestjsClient` for all authentication operations
   - Updated storage keys to match `nestjsClient` conventions:
     - `nestjs_access_token` (access token)
     - `nestjs_refresh_token` (refresh token)
     - `nestjs_user_data` (user data)
     - `nestjs_token_expiry` (token expiry)

2. **Created Token Migration Utility** (`apps/web-ui/src/utils/migrateAuthTokens.js`)
   - Automatically migrates existing tokens from old storage to new storage
   - Ensures users who logged in with the old system can continue without re-logging in

3. **Added Migration to App** (`apps/web-ui/src/App.jsx`)
   - Migration runs automatically on app load
   - One-time operation that cleans up old tokens after migration

## What This Fixes

✅ **401 Unauthorized errors** on `/api/auth/me` and other authenticated endpoints  
✅ **Token storage consistency** - All components now use the same token storage  
✅ **Automatic token refresh** - Tokens refresh properly before expiry  
✅ **Seamless migration** - Existing users don't need to re-login  

## Testing the Fix

### For Users Currently Logged In

1. **Refresh the page** - The migration will run automatically
2. **Check browser console** - You should see: `[Auth Migration] Migration complete!`
3. **Verify no 401 errors** - API calls should now work correctly

### For Users Not Logged In

1. **Log in normally** - Authentication will work with the new unified system
2. **No migration needed** - New tokens are stored correctly from the start

### Verify the Fix

Open browser DevTools (F12) and check localStorage:

**Before fix:**
```
funnelagents_auth_token: "eyJhbGc..."
funnelagents_user: "{...}"
```

**After fix:**
```
nestjs_access_token: "eyJhbGc..."
nestjs_refresh_token: "eyJhbGc..."
nestjs_user_data: "{...}"
nestjs_token_expiry: "1234567890"
```

## Technical Details

### Authentication Flow (Updated)

```
┌─────────────────────────────────────────────────────────────┐
│                     User Login                               │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
            ┌────────────────────────────┐
            │  useAuth.login()           │
            │  → client.auth.login()     │
            └────────────┬───────────────┘
                         │
                         ▼
            ┌────────────────────────────┐
            │  POST /api/auth/login      │
            │  Returns: accessToken,     │
            │           refreshToken     │
            └────────────┬───────────────┘
                         │
                         ▼
            ┌────────────────────────────┐
            │  client.setTokens()        │
            │  Stores in localStorage:   │
            │  - nestjs_access_token     │
            │  - nestjs_refresh_token    │
            │  - nestjs_token_expiry     │
            └────────────┬───────────────┘
                         │
                         ▼
            ┌────────────────────────────┐
            │  All API Calls             │
            │  → client._request()       │
            │  → Adds: Authorization     │
            │           Bearer {token}   │
            └────────────────────────────┘
```

### Token Refresh Flow

```
┌─────────────────────────────────────────────────────────────┐
│  API Request with Expired/Expiring Token                    │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
            ┌────────────────────────────┐
            │  client._request()         │
            │  Checks: isTokenExpired()  │
            └────────────┬───────────────┘
                         │
                     Yes │ Token Expired
                         ▼
            ┌────────────────────────────┐
            │  client._refreshToken()    │
            │  POST /api/auth/refresh    │
            └────────────┬───────────────┘
                         │
                         ▼
            ┌────────────────────────────┐
            │  New Tokens Received       │
            │  client.setTokens()        │
            └────────────┬───────────────┘
                         │
                         ▼
            ┌────────────────────────────┐
            │  Retry Original Request    │
            │  with New Token            │
            └────────────────────────────┘
```

## Files Modified

1. `apps/web-ui/src/hooks/useAuth.jsx` - Updated to use nestjsClient
2. `apps/web-ui/src/utils/migrateAuthTokens.js` - New migration utility
3. `apps/web-ui/src/App.jsx` - Added migration call

## Rollback (If Needed)

If you need to rollback these changes:

1. Restore the original `useAuth.jsx` from git
2. Remove the migration import from `App.jsx`
3. Users will need to log in again

## Future Improvements

- [ ] Add token refresh failure notifications to UI
- [ ] Implement secure token storage (httpOnly cookies)
- [ ] Add session timeout warnings
- [ ] Implement remember me functionality properly

---

**Status**: ✅ **FIXED**  
**Date**: 2025-11-25  
**Author**: Claude (AI Assistant)  


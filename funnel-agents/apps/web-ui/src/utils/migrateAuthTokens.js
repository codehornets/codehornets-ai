/**
 * @fileoverview Token Migration Utility
 * 
 * Migrates existing authentication tokens from the old storage system
 * (funnelagents_*) to the new unified storage system (nestjs_*).
 * 
 * This should be called once on app initialization to ensure users
 * who logged in with the old system can continue using the app.
 */

const OLD_KEYS = {
  TOKEN: 'funnelagents_auth_token',
  USER: 'funnelagents_user',
  EXPIRY: 'funnelagents_token_expiry',
};

const NEW_KEYS = {
  ACCESS_TOKEN: 'nestjs_access_token',
  REFRESH_TOKEN: 'nestjs_refresh_token',
  USER: 'nestjs_user_data',
  EXPIRY: 'nestjs_token_expiry',
};

/**
 * Migrate authentication tokens from old to new storage keys
 * @returns {boolean} True if migration occurred, false if no migration needed
 */
export function migrateAuthTokens() {
  try {
    // Check if old tokens exist
    const oldToken = localStorage.getItem(OLD_KEYS.TOKEN);
    const oldUser = localStorage.getItem(OLD_KEYS.USER);
    const oldExpiry = localStorage.getItem(OLD_KEYS.EXPIRY);

    // Check if migration already done
    const newTokenExists = localStorage.getItem(NEW_KEYS.ACCESS_TOKEN);

    if (!oldToken || newTokenExists) {
      // No migration needed
      return false;
    }

    console.log('[Auth Migration] Found old tokens, but skipping migration...');
    console.warn('[Auth Migration] Old auth system detected. Please log in again with the new system.');

    // Don't migrate - the old system doesn't have refresh tokens
    // and the token format may be different
    // Just clean up old tokens and require re-login
    localStorage.removeItem(OLD_KEYS.TOKEN);
    localStorage.removeItem(OLD_KEYS.USER);
    localStorage.removeItem(OLD_KEYS.EXPIRY);

    console.log('[Auth Migration] Old tokens cleaned up. Please log in again.');
    return false;
  } catch (error) {
    console.error('[Auth Migration] Migration failed:', error);
    return false;
  }
}

/**
 * Clean up old token storage keys
 * Call this after successful migration or if you want to force cleanup
 */
export function cleanupOldTokens() {
  try {
    localStorage.removeItem(OLD_KEYS.TOKEN);
    localStorage.removeItem(OLD_KEYS.USER);
    localStorage.removeItem(OLD_KEYS.EXPIRY);
    console.log('[Auth Migration] Old tokens cleaned up');
  } catch (error) {
    console.error('[Auth Migration] Cleanup failed:', error);
  }
}

export default {
  migrateAuthTokens,
  cleanupOldTokens,
};


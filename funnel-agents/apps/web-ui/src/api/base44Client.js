/**
 * @fileoverview Base44 Client - Lazy Loaded
 *
 * This module conditionally initializes the Base44 SDK client only when
 * VITE_BACKEND_MODE is set to 'base44'. When using NestJS backend mode,
 * the client is not initialized to prevent unnecessary connection attempts.
 */

/**
 * Backend mode from environment variable
 * @type {'nestjs'|'base44'}
 * @default 'nestjs'
 */
const BACKEND_MODE = import.meta.env.VITE_BACKEND_MODE || 'nestjs';

/**
 * Base44 client - only initialized when using Base44 backend mode
 * This prevents unnecessary connection attempts when using NestJS backend
 */
let base44 = null;
let isInitialized = false;

/**
 * Initialize the Base44 client lazily only when needed
 * This prevents the socket.io connection from being established on module import
 */
async function initBase44Client() {
  if (isInitialized) return base44;

  if (BACKEND_MODE === 'base44') {
    const [{ createClient }, { appParams }] = await Promise.all([
      import('@base44/sdk'),
      import('@/lib/app-params')
    ]);

    const { appId, serverUrl, token, functionsVersion } = appParams;
    base44 = createClient({
      appId,
      serverUrl,
      token,
      functionsVersion,
      requiresAuth: false
    });
  }

  isInitialized = true;
  return base44;
}

// Only initialize if we're in base44 mode - do this lazily
if (BACKEND_MODE === 'base44') {
  // Auto-initialize in base44 mode, but don't block
  initBase44Client().catch(err => {
    console.error('[Base44 Client] Failed to initialize:', err);
  });
}

export { base44, initBase44Client };

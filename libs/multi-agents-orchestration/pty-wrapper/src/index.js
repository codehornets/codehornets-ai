/**
 * PTY Wrapper Module
 *
 * Exports the main wrapper, client, and completion detector components.
 */

export { PtyWrapper, CommandQueue } from './wrapper.js';
export { PtyClient, createClient } from './client.js';
export { CompletionDetector, createCompletionPromise } from './completion-detector.js';

// Default export is the wrapper
export { default } from './wrapper.js';

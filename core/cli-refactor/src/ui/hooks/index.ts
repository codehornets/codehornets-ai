/**
 * @fileoverview Hook exports for CLI UI
 * @module ui/hooks
 *
 * This module re-exports all React hooks used for session state management
 * in the terminal UI.
 */

// Main session hooks
export {
  useSessionState,
  useToolState,
  usePermissionState,
  useScreenState,
  useInputState,
  useProgressMessages,
  useTerminalDimensions,
  useAnimation,
  useSession,
} from './useSession.js';

// Type exports
export type {
  SessionState,
  ToolState,
  PermissionState,
  ScreenState,
  InputState,
} from './useSession.js';

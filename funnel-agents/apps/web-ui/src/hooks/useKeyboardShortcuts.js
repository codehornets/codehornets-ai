import { useEffect, useCallback, useRef } from 'react';

/**
 * Custom hook for managing global keyboard shortcuts
 *
 * @param {Object} shortcuts - Map of key combinations to handlers
 * @param {Object} options - Configuration options
 * @returns {Object} - Utility functions for managing shortcuts
 *
 * @example
 * useKeyboardShortcuts({
 *   'ctrl+k': () => openCommandPalette(),
 *   'ctrl+s': () => save(),
 *   'escape': () => closeModal(),
 * }, { enabled: true, preventDefault: true });
 */
export function useKeyboardShortcuts(shortcuts = {}, options = {}) {
  const {
    enabled = true,
    preventDefault = true,
    allowInInput = false,
  } = options;

  const shortcutsRef = useRef(shortcuts);

  // Update ref when shortcuts change
  useEffect(() => {
    shortcutsRef.current = shortcuts;
  }, [shortcuts]);

  const handleKeyDown = useCallback((event) => {
    if (!enabled) return;

    // Check if we should ignore this event (e.g., if in input field)
    const target = event.target;
    const isInput =
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.tagName === 'SELECT' ||
      target.isContentEditable;

    if (isInput && !allowInInput) {
      // Only allow Escape key in input fields
      if (event.key !== 'Escape') {
        return;
      }
    }

    // Build the key combination string
    const modifiers = [];
    if (event.ctrlKey || event.metaKey) modifiers.push('ctrl');
    if (event.altKey) modifiers.push('alt');
    if (event.shiftKey) modifiers.push('shift');

    const key = event.key.toLowerCase();
    const combination = [...modifiers, key].join('+');

    // Also try without shift for uppercase letters
    const combinationWithoutShift = modifiers
      .filter(m => m !== 'shift')
      .concat(key)
      .join('+');

    // Check if any shortcut matches
    const handler =
      shortcutsRef.current[combination] ||
      shortcutsRef.current[combinationWithoutShift];

    if (handler) {
      if (preventDefault) {
        event.preventDefault();
        event.stopPropagation();
      }
      handler(event);
    }
  }, [enabled, preventDefault, allowInInput]);

  useEffect(() => {
    if (!enabled) return;

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [enabled, handleKeyDown]);

  return {
    // Helper to check if a key combo is pressed
    isPressed: (combo) => {
      // This would require tracking key state
      // Implementation depends on use case
      return false;
    },
  };
}

/**
 * Default keyboard shortcuts for the application
 * These can be imported and used across the app
 */
export const DEFAULT_SHORTCUTS = {
  // Command palette
  'ctrl+k': 'Open command palette',
  'ctrl+/': 'Show keyboard shortcuts',

  // Navigation
  'ctrl+h': 'Go to home/dashboard',
  'ctrl+b': 'Toggle sidebar',

  // Actions
  'ctrl+n': 'Create new item',
  'ctrl+s': 'Save',
  'ctrl+e': 'Edit',
  'ctrl+f': 'Find/Search',

  // UI
  'escape': 'Close modal/dialog',
  '?': 'Show help',

  // Lists
  'j': 'Next item',
  'k': 'Previous item',
  'g+g': 'Go to top',
  'shift+g': 'Go to bottom',
};

/**
 * Hook for handling application-wide keyboard shortcuts
 * Includes common shortcuts like command palette, navigation, etc.
 */
export function useAppShortcuts(handlers = {}) {
  const defaultHandlers = {
    'ctrl+k': handlers.openCommandPalette || (() => {}),
    'ctrl+/': handlers.showShortcutsHelp || (() => {}),
    'ctrl+s': handlers.save || (() => {}),
    'ctrl+n': handlers.createNew || (() => {}),
    'escape': handlers.closeModal || (() => {}),
    '?': handlers.showHelp || (() => {}),
  };

  useKeyboardShortcuts(defaultHandlers, {
    enabled: true,
    preventDefault: true,
  });
}

/**
 * Hook for modal-specific shortcuts
 */
export function useModalShortcuts(isOpen, onClose, additionalShortcuts = {}) {
  const shortcuts = {
    'escape': onClose,
    ...additionalShortcuts,
  };

  useKeyboardShortcuts(shortcuts, {
    enabled: isOpen,
    preventDefault: true,
    allowInInput: false,
  });
}

/**
 * Hook for list navigation shortcuts (j/k, arrow keys)
 */
export function useListNavigation(itemCount, selectedIndex, onSelect, enabled = true) {
  const shortcuts = {
    'j': () => {
      const nextIndex = Math.min(selectedIndex + 1, itemCount - 1);
      onSelect(nextIndex);
    },
    'k': () => {
      const prevIndex = Math.max(selectedIndex - 1, 0);
      onSelect(prevIndex);
    },
    'arrowdown': () => {
      const nextIndex = Math.min(selectedIndex + 1, itemCount - 1);
      onSelect(nextIndex);
    },
    'arrowup': () => {
      const prevIndex = Math.max(selectedIndex - 1, 0);
      onSelect(prevIndex);
    },
    'home': () => onSelect(0),
    'end': () => onSelect(itemCount - 1),
  };

  useKeyboardShortcuts(shortcuts, {
    enabled: enabled && itemCount > 0,
    preventDefault: true,
    allowInInput: false,
  });
}

/**
 * Format keyboard shortcut for display
 * @param {string} combo - Key combination (e.g., 'ctrl+k')
 * @returns {string} - Formatted shortcut (e.g., '⌘K' on Mac, 'Ctrl+K' on Windows)
 */
export function formatShortcut(combo) {
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;

  let formatted = combo
    .split('+')
    .map(key => {
      switch (key.toLowerCase()) {
        case 'ctrl':
          return isMac ? '⌘' : 'Ctrl';
        case 'alt':
          return isMac ? '⌥' : 'Alt';
        case 'shift':
          return isMac ? '⇧' : 'Shift';
        case 'meta':
          return isMac ? '⌘' : 'Win';
        default:
          return key.toUpperCase();
      }
    })
    .join(isMac ? '' : '+');

  return formatted;
}

export default useKeyboardShortcuts;

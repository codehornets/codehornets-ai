import { useEffect, useCallback, useState } from 'react';
import { Tldraw, getSnapshot, loadSnapshot, createTLStore, defaultShapeUtils } from 'tldraw';
import 'tldraw/tldraw.css';
import client from '@/api/client';
import { toast } from 'sonner';

/**
 * Whiteboard component using tldraw
 *
 * Props:
 * - initialData: Initial board data (legacy format with elements, or tldraw snapshot)
 * - onChange: Callback when canvas changes
 * - boardId: Board ID for collaboration features
 */
export default function Whiteboard({ initialData, onChange, boardId }) {
  const [editor, setEditor] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Detect dark mode from document
  useEffect(() => {
    const checkDarkMode = () => {
      const isDark = document.documentElement.classList.contains('dark');
      setIsDarkMode(isDark);
    };

    checkDarkMode();

    // Watch for theme changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          checkDarkMode();
        }
      });
    });

    observer.observe(document.documentElement, { attributes: true });
    return () => observer.disconnect();
  }, []);

  // Load current user
  useEffect(() => {
    const loadUser = async () => {
      try {
        const user = await client.auth.me();
        setCurrentUser(user);
      } catch (error) {
        console.error('Failed to load user:', error);
      }
    };
    loadUser();
  }, []);

  // Handle mount and store editor reference
  const handleMount = useCallback((editorInstance) => {
    setEditor(editorInstance);

    // Load initial data if provided
    if (initialData) {
      try {
        // Check if it's a tldraw snapshot format
        if (initialData.document || initialData.session) {
          // It's a tldraw snapshot
          loadSnapshot(editorInstance.store, initialData);
        } else if (initialData.elements && Array.isArray(initialData.elements)) {
          // It's the legacy excalidraw-compatible format
          // Convert legacy elements to tldraw format if needed
          // For now, we'll start fresh but preserve in storage
          console.log('Legacy format detected, starting with empty canvas');
          // The legacy data is preserved in the database
        }
      } catch (error) {
        console.error('Error loading initial data:', error);
      }
    }
  }, [initialData]);

  // Handle changes and propagate to parent
  useEffect(() => {
    if (!editor || !onChange) return;

    const handleChange = () => {
      try {
        const snapshot = getSnapshot(editor.store);
        // Send the tldraw snapshot format
        onChange({
          // Include both formats for compatibility
          tldraw_snapshot: snapshot,
          // Legacy format marker
          elements: [], // Empty - we're using tldraw now
          format: 'tldraw',
        });
      } catch (error) {
        console.error('Error getting snapshot:', error);
      }
    };

    // Listen to store changes
    const unsubscribe = editor.store.listen(handleChange, {
      source: 'user',
      scope: 'document'
    });

    return () => {
      unsubscribe();
    };
  }, [editor, onChange]);

  // Custom UI components can be added here
  const components = {
    // You can customize tldraw UI here
    // TopPanel: null, // Hide top panel
    // SharePanel: null, // Hide share panel
  };

  return (
    <div
      className="w-full h-full"
      style={{
        position: 'relative',
        minHeight: '500px',
      }}
    >
      <Tldraw
        onMount={handleMount}
        // Use dark mode based on app theme
        forceMobile={false}
        // Persist to browser storage with unique key per board
        persistenceKey={boardId ? `board-${boardId}` : undefined}
        // Enable all default tools
        inferDarkMode={false}
        // Override components if needed
        components={components}
        // User info for collaboration
        user={{
          id: currentUser?.id || 'anonymous',
          name: currentUser?.full_name || currentUser?.email || 'Anonymous',
          color: currentUser?.id ? `#${currentUser.id.slice(0, 6)}` : '#3b82f6',
        }}
      />

      {/* Dark mode style override */}
      <style>{`
        .tl-theme__light {
          ${isDarkMode ? `
            --color-background: #0a0a0a;
            --color-panel: #1a1a1a;
            --color-panel-contrast: #252525;
            --color-low: #333333;
            --color-muted-1: #999999;
            --color-muted-2: #666666;
            --color-hint: #444444;
            --color-text: #ffffff;
            --color-text-1: #e0e0e0;
            --color-text-2: #b0b0b0;
            --color-text-3: #808080;
            --color-primary: #3b82f6;
          ` : ''}
        }

        /* Ensure full height */
        .tl-container {
          height: 100% !important;
        }
      `}</style>
    </div>
  );
}

/**
 * Hook to convert legacy excalidraw elements to tldraw format
 * This can be expanded if you need to migrate existing data
 */
export function useLegacyDataConverter(legacyData) {
  // Placeholder for data migration logic
  // tldraw has different shape formats than excalidraw
  // You may need to map:
  // - rectangle -> geo (rectangle)
  // - circle -> geo (ellipse)
  // - diamond -> geo (diamond)
  // - arrow -> arrow
  // - line -> line
  // - path (pencil) -> draw
  // - text -> text

  return null;
}

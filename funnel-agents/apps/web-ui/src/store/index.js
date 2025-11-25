import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

/**
 * Global application store using Zustand
 * Manages user state, notifications, UI preferences, and app state
 */

// Notification Store
export const useNotificationStore = create(
  persist(
    (set, get) => ({
      notifications: [],
      unreadCount: 0,

      addNotification: (notification) => {
        const newNotification = {
          id: Date.now() + Math.random(),
          timestamp: new Date().toISOString(),
          read: false,
          ...notification,
        };

        set((state) => ({
          notifications: [newNotification, ...state.notifications],
          unreadCount: state.unreadCount + 1,
        }));

        return newNotification.id;
      },

      removeNotification: (id) => {
        set((state) => {
          const notification = state.notifications.find(n => n.id === id);
          return {
            notifications: state.notifications.filter((n) => n.id !== id),
            unreadCount: notification && !notification.read
              ? state.unreadCount - 1
              : state.unreadCount,
          };
        });
      },

      markAsRead: (id) => {
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n
          ),
          unreadCount: Math.max(0, state.unreadCount - 1),
        }));
      },

      markAsUnread: (id) => {
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, read: false } : n
          ),
          unreadCount: state.unreadCount + 1,
        }));
      },

      markAllAsRead: () => {
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, read: true })),
          unreadCount: 0,
        }));
      },

      clearAll: () => {
        set({ notifications: [], unreadCount: 0 });
      },

      getUnreadNotifications: () => {
        return get().notifications.filter((n) => !n.read);
      },
    }),
    {
      name: 'notifications-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        notifications: state.notifications.slice(0, 50), // Keep only last 50
      }),
    }
  )
);

// Toast Store
export const useToastStore = create((set) => ({
  toasts: [],

  addToast: (toast) => {
    const id = Date.now() + Math.random();
    const newToast = {
      id,
      type: 'info',
      duration: 5000,
      ...toast,
    };

    set((state) => ({
      toasts: [...state.toasts, newToast],
    }));

    // Auto dismiss if duration is set
    if (newToast.duration > 0) {
      setTimeout(() => {
        set((state) => ({
          toasts: state.toasts.filter((t) => t.id !== id),
        }));
      }, newToast.duration);
    }

    return id;
  },

  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },

  clearToasts: () => {
    set({ toasts: [] });
  },
}));

// UI Preferences Store
export const useUIStore = create(
  persist(
    (set) => ({
      theme: 'dark',
      sidebarCollapsed: false,
      compactMode: false,
      showNotifications: true,
      showBreadcrumbs: true,

      setTheme: (theme) => set({ theme }),
      toggleTheme: () => set((state) => ({
        theme: state.theme === 'dark' ? 'light' : 'dark'
      })),
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
      toggleSidebar: () => set((state) => ({
        sidebarCollapsed: !state.sidebarCollapsed
      })),
      setCompactMode: (compact) => set({ compactMode: compact }),
      toggleCompactMode: () => set((state) => ({
        compactMode: !state.compactMode
      })),
      setShowNotifications: (show) => set({ showNotifications: show }),
      setShowBreadcrumbs: (show) => set({ showBreadcrumbs: show }),
    }),
    {
      name: 'ui-preferences',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

// App State Store
export const useAppStore = create((set) => ({
  breadcrumbs: [],
  activeFilters: {},
  activeView: 'grid',
  searchQuery: '',
  commandPaletteOpen: false,

  setBreadcrumbs: (breadcrumbs) => set({ breadcrumbs }),
  addBreadcrumb: (crumb) => set((state) => ({
    breadcrumbs: [...state.breadcrumbs, crumb],
  })),
  removeBreadcrumb: (index) => set((state) => ({
    breadcrumbs: state.breadcrumbs.filter((_, i) => i !== index),
  })),
  clearBreadcrumbs: () => set({ breadcrumbs: [] }),

  setActiveFilters: (filters) => set({ activeFilters: filters }),
  updateFilter: (key, value) => set((state) => ({
    activeFilters: { ...state.activeFilters, [key]: value },
  })),
  removeFilter: (key) => set((state) => {
    const { [key]: _, ...rest } = state.activeFilters;
    return { activeFilters: rest };
  }),
  clearFilters: () => set({ activeFilters: {} }),

  setActiveView: (view) => set({ activeView: view }),
  setSearchQuery: (query) => set({ searchQuery: query }),

  setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
  toggleCommandPalette: () => set((state) => ({
    commandPaletteOpen: !state.commandPaletteOpen
  })),
}));

// User State Store (syncs with AuthContext)
export const useUserStore = create((set) => ({
  user: null,
  permissions: null,
  preferences: {},

  setUser: (user) => set({ user }),
  setPermissions: (permissions) => set({ permissions }),
  setPreferences: (preferences) => set({ preferences }),
  updatePreference: (key, value) => set((state) => ({
    preferences: { ...state.preferences, [key]: value },
  })),
  clearUser: () => set({ user: null, permissions: null, preferences: {} }),
}));

// Utility hooks for common patterns
export const useUnreadCount = () => useNotificationStore((state) => state.unreadCount);
export const useTheme = () => useUIStore((state) => state.theme);
export const useSidebarCollapsed = () => useUIStore((state) => state.sidebarCollapsed);

// Toast helper for easy usage
export const toast = {
  success: (message, options = {}) =>
    useToastStore.getState().addToast({ type: 'success', message, ...options }),
  error: (message, options = {}) =>
    useToastStore.getState().addToast({ type: 'error', message, ...options }),
  warning: (message, options = {}) =>
    useToastStore.getState().addToast({ type: 'warning', message, ...options }),
  info: (message, options = {}) =>
    useToastStore.getState().addToast({ type: 'info', message, ...options }),
};

// Notification helper
export const notify = {
  info: (title, message, options = {}) =>
    useNotificationStore.getState().addNotification({
      type: 'info',
      title,
      message,
      ...options
    }),
  success: (title, message, options = {}) =>
    useNotificationStore.getState().addNotification({
      type: 'success',
      title,
      message,
      ...options
    }),
  warning: (title, message, options = {}) =>
    useNotificationStore.getState().addNotification({
      type: 'warning',
      title,
      message,
      ...options
    }),
  error: (title, message, options = {}) =>
    useNotificationStore.getState().addNotification({
      type: 'error',
      title,
      message,
      ...options
    }),
};

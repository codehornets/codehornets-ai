/**
 * @fileoverview Zustand Store Tests
 * Tests for global state management stores
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import {
  useNotificationStore,
  useToastStore,
  useUIStore,
  useAppStore,
  useUserStore,
  toast,
  notify,
} from '../index';

describe('Notification Store', () => {
  beforeEach(() => {
    localStorage.clear();
    useNotificationStore.getState().clearAll();
  });

  it('should add notification', () => {
    const { result } = renderHook(() => useNotificationStore());

    act(() => {
      result.current.addNotification({
        type: 'info',
        title: 'Test',
        message: 'Test message',
      });
    });

    expect(result.current.notifications).toHaveLength(1);
    expect(result.current.notifications[0].title).toBe('Test');
    expect(result.current.unreadCount).toBe(1);
  });

  it('should remove notification', () => {
    const { result } = renderHook(() => useNotificationStore());

    let notificationId;
    act(() => {
      notificationId = result.current.addNotification({
        type: 'info',
        title: 'Test',
        message: 'Test message',
      });
    });

    expect(result.current.notifications).toHaveLength(1);

    act(() => {
      result.current.removeNotification(notificationId);
    });

    expect(result.current.notifications).toHaveLength(0);
  });

  it('should mark notification as read', () => {
    const { result } = renderHook(() => useNotificationStore());

    let notificationId;
    act(() => {
      notificationId = result.current.addNotification({
        type: 'info',
        title: 'Test',
        message: 'Test message',
      });
    });

    expect(result.current.unreadCount).toBe(1);

    act(() => {
      result.current.markAsRead(notificationId);
    });

    expect(result.current.unreadCount).toBe(0);
    expect(result.current.notifications[0].read).toBe(true);
  });

  it('should mark notification as unread', () => {
    const { result } = renderHook(() => useNotificationStore());

    let notificationId;
    act(() => {
      notificationId = result.current.addNotification({
        type: 'info',
        title: 'Test',
        message: 'Test message',
      });
      result.current.markAsRead(notificationId);
    });

    expect(result.current.unreadCount).toBe(0);

    act(() => {
      result.current.markAsUnread(notificationId);
    });

    expect(result.current.unreadCount).toBe(1);
    expect(result.current.notifications[0].read).toBe(false);
  });

  it('should mark all as read', () => {
    const { result } = renderHook(() => useNotificationStore());

    act(() => {
      result.current.addNotification({ type: 'info', title: 'Test 1' });
      result.current.addNotification({ type: 'info', title: 'Test 2' });
      result.current.addNotification({ type: 'info', title: 'Test 3' });
    });

    expect(result.current.unreadCount).toBe(3);

    act(() => {
      result.current.markAllAsRead();
    });

    expect(result.current.unreadCount).toBe(0);
    expect(result.current.notifications.every(n => n.read)).toBe(true);
  });

  it('should clear all notifications', () => {
    const { result } = renderHook(() => useNotificationStore());

    act(() => {
      result.current.addNotification({ type: 'info', title: 'Test 1' });
      result.current.addNotification({ type: 'info', title: 'Test 2' });
    });

    expect(result.current.notifications).toHaveLength(2);

    act(() => {
      result.current.clearAll();
    });

    expect(result.current.notifications).toHaveLength(0);
    expect(result.current.unreadCount).toBe(0);
  });

  it('should get unread notifications', () => {
    const { result } = renderHook(() => useNotificationStore());

    act(() => {
      const id1 = result.current.addNotification({ type: 'info', title: 'Test 1' });
      result.current.addNotification({ type: 'info', title: 'Test 2' });
      result.current.markAsRead(id1);
    });

    const unread = result.current.getUnreadNotifications();
    expect(unread).toHaveLength(1);
    expect(unread[0].title).toBe('Test 2');
  });

  it('should persist notifications to localStorage', () => {
    const { result } = renderHook(() => useNotificationStore());

    act(() => {
      result.current.addNotification({ type: 'info', title: 'Test' });
    });

    const stored = JSON.parse(localStorage.getItem('notifications-storage'));
    expect(stored.state.notifications).toHaveLength(1);
  });

  it('should update unread count correctly when removing unread notification', () => {
    const { result } = renderHook(() => useNotificationStore());

    let id;
    act(() => {
      id = result.current.addNotification({ type: 'info', title: 'Test' });
    });

    expect(result.current.unreadCount).toBe(1);

    act(() => {
      result.current.removeNotification(id);
    });

    expect(result.current.unreadCount).toBe(0);
  });
});

describe('Toast Store', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    useToastStore.getState().clearToasts();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should add toast', () => {
    const { result } = renderHook(() => useToastStore());

    act(() => {
      result.current.addToast({
        type: 'success',
        message: 'Success!',
      });
    });

    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0].message).toBe('Success!');
  });

  it('should auto-dismiss toast after duration', () => {
    const { result } = renderHook(() => useToastStore());

    act(() => {
      result.current.addToast({
        message: 'Test',
        duration: 1000,
      });
    });

    expect(result.current.toasts).toHaveLength(1);

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(result.current.toasts).toHaveLength(0);
  });

  it('should not auto-dismiss if duration is 0', () => {
    const { result } = renderHook(() => useToastStore());

    act(() => {
      result.current.addToast({
        message: 'Test',
        duration: 0,
      });
    });

    act(() => {
      vi.advanceTimersByTime(10000);
    });

    expect(result.current.toasts).toHaveLength(1);
  });

  it('should manually remove toast', () => {
    const { result } = renderHook(() => useToastStore());

    let toastId;
    act(() => {
      toastId = result.current.addToast({
        message: 'Test',
        duration: 0,
      });
    });

    expect(result.current.toasts).toHaveLength(1);

    act(() => {
      result.current.removeToast(toastId);
    });

    expect(result.current.toasts).toHaveLength(0);
  });

  it('should clear all toasts', () => {
    const { result } = renderHook(() => useToastStore());

    act(() => {
      result.current.addToast({ message: 'Test 1', duration: 0 });
      result.current.addToast({ message: 'Test 2', duration: 0 });
    });

    expect(result.current.toasts).toHaveLength(2);

    act(() => {
      result.current.clearToasts();
    });

    expect(result.current.toasts).toHaveLength(0);
  });

  it('should use helper functions', () => {
    const { result } = renderHook(() => useToastStore());

    act(() => {
      toast.success('Success!');
      toast.error('Error!');
      toast.warning('Warning!');
      toast.info('Info!');
    });

    expect(result.current.toasts).toHaveLength(4);
    expect(result.current.toasts[0].type).toBe('success');
    expect(result.current.toasts[1].type).toBe('error');
    expect(result.current.toasts[2].type).toBe('warning');
    expect(result.current.toasts[3].type).toBe('info');
  });
});

describe('UI Store', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should initialize with default values', () => {
    const { result } = renderHook(() => useUIStore());

    expect(result.current.theme).toBe('dark');
    expect(result.current.sidebarCollapsed).toBe(false);
    expect(result.current.compactMode).toBe(false);
  });

  it('should set theme', () => {
    const { result } = renderHook(() => useUIStore());

    act(() => {
      result.current.setTheme('light');
    });

    expect(result.current.theme).toBe('light');
  });

  it('should toggle theme', () => {
    const { result } = renderHook(() => useUIStore());

    act(() => {
      result.current.toggleTheme();
    });

    expect(result.current.theme).toBe('light');

    act(() => {
      result.current.toggleTheme();
    });

    expect(result.current.theme).toBe('dark');
  });

  it('should toggle sidebar', () => {
    const { result } = renderHook(() => useUIStore());

    expect(result.current.sidebarCollapsed).toBe(false);

    act(() => {
      result.current.toggleSidebar();
    });

    expect(result.current.sidebarCollapsed).toBe(true);
  });

  it('should set compact mode', () => {
    const { result } = renderHook(() => useUIStore());

    act(() => {
      result.current.setCompactMode(true);
    });

    expect(result.current.compactMode).toBe(true);
  });

  it('should persist preferences to localStorage', () => {
    const { result } = renderHook(() => useUIStore());

    act(() => {
      result.current.setTheme('light');
      result.current.setSidebarCollapsed(true);
    });

    const stored = JSON.parse(localStorage.getItem('ui-preferences'));
    expect(stored.state.theme).toBe('light');
    expect(stored.state.sidebarCollapsed).toBe(true);
  });
});

describe('App Store', () => {
  beforeEach(() => {
    useAppStore.getState().clearBreadcrumbs();
    useAppStore.getState().clearFilters();
  });

  it('should manage breadcrumbs', () => {
    const { result } = renderHook(() => useAppStore());

    act(() => {
      result.current.setBreadcrumbs([
        { label: 'Home', path: '/' },
        { label: 'Dashboard', path: '/dashboard' },
      ]);
    });

    expect(result.current.breadcrumbs).toHaveLength(2);

    act(() => {
      result.current.addBreadcrumb({ label: 'Agents', path: '/agents' });
    });

    expect(result.current.breadcrumbs).toHaveLength(3);

    act(() => {
      result.current.removeBreadcrumb(1);
    });

    expect(result.current.breadcrumbs).toHaveLength(2);

    act(() => {
      result.current.clearBreadcrumbs();
    });

    expect(result.current.breadcrumbs).toHaveLength(0);
  });

  it('should manage filters', () => {
    const { result } = renderHook(() => useAppStore());

    act(() => {
      result.current.updateFilter('status', 'active');
      result.current.updateFilter('priority', 'high');
    });

    expect(result.current.activeFilters).toEqual({
      status: 'active',
      priority: 'high',
    });

    act(() => {
      result.current.removeFilter('status');
    });

    expect(result.current.activeFilters).toEqual({
      priority: 'high',
    });

    act(() => {
      result.current.clearFilters();
    });

    expect(result.current.activeFilters).toEqual({});
  });

  it('should manage active view', () => {
    const { result } = renderHook(() => useAppStore());

    expect(result.current.activeView).toBe('grid');

    act(() => {
      result.current.setActiveView('list');
    });

    expect(result.current.activeView).toBe('list');
  });

  it('should manage search query', () => {
    const { result } = renderHook(() => useAppStore());

    act(() => {
      result.current.setSearchQuery('test search');
    });

    expect(result.current.searchQuery).toBe('test search');
  });

  it('should toggle command palette', () => {
    const { result } = renderHook(() => useAppStore());

    expect(result.current.commandPaletteOpen).toBe(false);

    act(() => {
      result.current.toggleCommandPalette();
    });

    expect(result.current.commandPaletteOpen).toBe(true);

    act(() => {
      result.current.setCommandPaletteOpen(false);
    });

    expect(result.current.commandPaletteOpen).toBe(false);
  });
});

describe('User Store', () => {
  beforeEach(() => {
    useUserStore.getState().clearUser();
  });

  it('should set user', () => {
    const { result } = renderHook(() => useUserStore());

    const user = { id: '1', email: 'test@example.com', name: 'Test' };

    act(() => {
      result.current.setUser(user);
    });

    expect(result.current.user).toEqual(user);
  });

  it('should set permissions', () => {
    const { result } = renderHook(() => useUserStore());

    const permissions = { canEdit: true, canDelete: false };

    act(() => {
      result.current.setPermissions(permissions);
    });

    expect(result.current.permissions).toEqual(permissions);
  });

  it('should manage preferences', () => {
    const { result } = renderHook(() => useUserStore());

    act(() => {
      result.current.setPreferences({
        language: 'en',
        timezone: 'UTC',
      });
    });

    expect(result.current.preferences.language).toBe('en');

    act(() => {
      result.current.updatePreference('theme', 'dark');
    });

    expect(result.current.preferences.theme).toBe('dark');
  });

  it('should clear user', () => {
    const { result } = renderHook(() => useUserStore());

    act(() => {
      result.current.setUser({ id: '1' });
      result.current.setPermissions({ canEdit: true });
      result.current.setPreferences({ theme: 'dark' });
    });

    act(() => {
      result.current.clearUser();
    });

    expect(result.current.user).toBeNull();
    expect(result.current.permissions).toBeNull();
    expect(result.current.preferences).toEqual({});
  });
});

describe('Notify Helper', () => {
  beforeEach(() => {
    useNotificationStore.getState().clearAll();
  });

  it('should create notifications with helper functions', () => {
    const { result } = renderHook(() => useNotificationStore());

    notify.info('Info Title', 'Info message');
    notify.success('Success Title', 'Success message');
    notify.warning('Warning Title', 'Warning message');
    notify.error('Error Title', 'Error message');

    expect(result.current.notifications).toHaveLength(4);
    expect(result.current.notifications[0].type).toBe('error');
    expect(result.current.notifications[1].type).toBe('warning');
    expect(result.current.notifications[2].type).toBe('success');
    expect(result.current.notifications[3].type).toBe('info');
  });
});

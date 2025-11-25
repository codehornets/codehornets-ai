/**
 * @fileoverview useWebSocket Hook Tests
 * Tests for WebSocket connection management and real-time features
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useWebSocket, WS_CHANNELS, WS_EVENTS } from '../useWebSocket';
import { MockWebSocket } from '@/test/test-utils';

// Mock app params
vi.mock('@/lib/app-params', () => ({
  appParams: {
    token: 'test-token',
    serverUrl: 'http://localhost:3000',
  },
}));

describe('useWebSocket Hook', () => {
  let mockWebSocket;

  beforeEach(() => {
    vi.useFakeTimers();
    mockWebSocket = new MockWebSocket('ws://localhost:3000/ws');
    global.WebSocket = vi.fn(() => mockWebSocket);
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  describe('Connection Management', () => {
    it('should initialize with disconnected state', () => {
      const { result } = renderHook(() => useWebSocket());

      expect(result.current.isConnected).toBe(false);
      expect(result.current.connectionState).toBe('disconnected');
    });

    it('should connect on mount', async () => {
      const { result } = renderHook(() => useWebSocket());

      expect(result.current.connectionState).toBe('connecting');

      await act(async () => {
        await vi.runAllTimersAsync();
      });

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });

      expect(result.current.connectionState).toBe('connected');
    });

    it('should disconnect on unmount', async () => {
      const { result, unmount } = renderHook(() => useWebSocket());

      await act(async () => {
        await vi.runAllTimersAsync();
      });

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });

      unmount();

      expect(mockWebSocket.readyState).toBe(MockWebSocket.CLOSED);
    });

    it('should manually disconnect', async () => {
      const { result } = renderHook(() => useWebSocket());

      await act(async () => {
        await vi.runAllTimersAsync();
      });

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });

      act(() => {
        result.current.disconnect();
      });

      expect(result.current.isConnected).toBe(false);
      expect(result.current.connectionState).toBe('disconnected');
    });

    it('should manually connect', async () => {
      const { result } = renderHook(() => useWebSocket());

      act(() => {
        result.current.disconnect();
      });

      expect(result.current.isConnected).toBe(false);

      act(() => {
        result.current.connect();
      });

      await act(async () => {
        await vi.runAllTimersAsync();
      });

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });
    });
  });

  describe('Reconnection Logic', () => {
    it('should attempt to reconnect on disconnect', async () => {
      const { result } = renderHook(() => useWebSocket());

      await act(async () => {
        await vi.runAllTimersAsync();
      });

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });

      // Simulate disconnect
      act(() => {
        mockWebSocket.close();
      });

      expect(result.current.isConnected).toBe(false);

      // Fast forward reconnect interval
      await act(async () => {
        vi.advanceTimersByTime(3000);
        await vi.runAllTimersAsync();
      });

      // Should create new connection
      expect(global.WebSocket).toHaveBeenCalledTimes(2);
    });

    it('should stop reconnecting after max attempts', async () => {
      const { result } = renderHook(() => useWebSocket());

      await act(async () => {
        await vi.runAllTimersAsync();
      });

      // Simulate multiple disconnects
      for (let i = 0; i < 10; i++) {
        act(() => {
          mockWebSocket.close();
        });

        await act(async () => {
          vi.advanceTimersByTime(3000);
          await vi.runAllTimersAsync();
        });

        if (i < 9) {
          mockWebSocket = new MockWebSocket('ws://localhost:3000/ws');
        }
      }

      await waitFor(() => {
        expect(result.current.connectionState).toBe('error');
      });

      expect(result.current.error).toBeTruthy();
    });

    it('should reset reconnect attempts on successful connection', async () => {
      const { result } = renderHook(() => useWebSocket());

      await act(async () => {
        await vi.runAllTimersAsync();
      });

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });

      // Disconnect and reconnect
      act(() => {
        mockWebSocket.close();
      });

      await act(async () => {
        vi.advanceTimersByTime(3000);
        await vi.runAllTimersAsync();
      });

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });

      // Should reset attempts, allowing another 10 attempts
      expect(result.current.error).toBeNull();
    });
  });

  describe('Heartbeat', () => {
    it('should send ping messages periodically', async () => {
      const { result } = renderHook(() => useWebSocket());

      await act(async () => {
        await vi.runAllTimersAsync();
      });

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });

      // Clear any initial messages
      mockWebSocket.sentMessages = [];

      // Fast forward past heartbeat interval
      await act(async () => {
        vi.advanceTimersByTime(30000);
      });

      expect(mockWebSocket.sentMessages.length).toBeGreaterThan(0);
      const lastMessage = JSON.parse(mockWebSocket.sentMessages[mockWebSocket.sentMessages.length - 1]);
      expect(lastMessage.type).toBe('ping');
    });

    it('should stop heartbeat on disconnect', async () => {
      const { result } = renderHook(() => useWebSocket());

      await act(async () => {
        await vi.runAllTimersAsync();
      });

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });

      act(() => {
        result.current.disconnect();
      });

      mockWebSocket.sentMessages = [];

      await act(async () => {
        vi.advanceTimersByTime(30000);
      });

      // Should not send ping after disconnect
      expect(mockWebSocket.sentMessages.length).toBe(0);
    });
  });

  describe('Channel Subscription', () => {
    it('should subscribe to a channel', async () => {
      const { result } = renderHook(() => useWebSocket());

      await act(async () => {
        await vi.runAllTimersAsync();
      });

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });

      mockWebSocket.sentMessages = [];

      act(() => {
        result.current.subscribe(WS_CHANNELS.TASKS);
      });

      expect(mockWebSocket.sentMessages.length).toBe(1);
      const message = JSON.parse(mockWebSocket.sentMessages[0]);
      expect(message.type).toBe('subscribe');
      expect(message.channel).toBe(WS_CHANNELS.TASKS);
    });

    it('should unsubscribe from a channel', async () => {
      const { result } = renderHook(() => useWebSocket());

      await act(async () => {
        await vi.runAllTimersAsync();
      });

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });

      act(() => {
        result.current.subscribe(WS_CHANNELS.AGENTS);
      });

      mockWebSocket.sentMessages = [];

      act(() => {
        result.current.unsubscribe(WS_CHANNELS.AGENTS);
      });

      expect(mockWebSocket.sentMessages.length).toBe(1);
      const message = JSON.parse(mockWebSocket.sentMessages[0]);
      expect(message.type).toBe('unsubscribe');
      expect(message.channel).toBe(WS_CHANNELS.AGENTS);
    });

    it('should resubscribe to channels after reconnection', async () => {
      const { result } = renderHook(() => useWebSocket());

      await act(async () => {
        await vi.runAllTimersAsync();
      });

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });

      act(() => {
        result.current.subscribe(WS_CHANNELS.TASKS);
        result.current.subscribe(WS_CHANNELS.AGENTS);
      });

      // Disconnect
      act(() => {
        mockWebSocket.close();
      });

      mockWebSocket.sentMessages = [];

      // Reconnect
      await act(async () => {
        vi.advanceTimersByTime(3000);
        await vi.runAllTimersAsync();
      });

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });

      // Should resubscribe to both channels
      const subscribeMessages = mockWebSocket.sentMessages
        .map(msg => JSON.parse(msg))
        .filter(msg => msg.type === 'subscribe');

      expect(subscribeMessages.length).toBe(2);
    });
  });

  describe('Event Handlers', () => {
    it('should register and call event handlers', async () => {
      const { result } = renderHook(() => useWebSocket());

      await act(async () => {
        await vi.runAllTimersAsync();
      });

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });

      const handler = vi.fn();

      act(() => {
        result.current.on(WS_EVENTS.TASK_COMPLETED, handler);
      });

      act(() => {
        mockWebSocket.simulateMessage({
          type: WS_EVENTS.TASK_COMPLETED,
          data: { taskId: '123', status: 'completed' },
        });
      });

      expect(handler).toHaveBeenCalledWith({
        type: WS_EVENTS.TASK_COMPLETED,
        data: { taskId: '123', status: 'completed' },
      });
    });

    it('should unregister event handlers', async () => {
      const { result } = renderHook(() => useWebSocket());

      await act(async () => {
        await vi.runAllTimersAsync();
      });

      const handler = vi.fn();
      let unsubscribe;

      act(() => {
        unsubscribe = result.current.on(WS_EVENTS.AGENT_STARTED, handler);
      });

      act(() => {
        unsubscribe();
      });

      act(() => {
        mockWebSocket.simulateMessage({
          type: WS_EVENTS.AGENT_STARTED,
          data: {},
        });
      });

      expect(handler).not.toHaveBeenCalled();
    });

    it('should call wildcard handlers for all events', async () => {
      const { result } = renderHook(() => useWebSocket());

      await act(async () => {
        await vi.runAllTimersAsync();
      });

      const wildcardHandler = vi.fn();

      act(() => {
        result.current.on('*', wildcardHandler);
      });

      act(() => {
        mockWebSocket.simulateMessage({ type: 'custom-event', data: {} });
      });

      expect(wildcardHandler).toHaveBeenCalled();
    });

    it('should handle pong messages without calling handlers', async () => {
      const { result } = renderHook(() => useWebSocket());

      await act(async () => {
        await vi.runAllTimersAsync();
      });

      const handler = vi.fn();

      act(() => {
        result.current.on('pong', handler);
      });

      act(() => {
        mockWebSocket.simulateMessage({ type: 'pong', timestamp: Date.now() });
      });

      // Pong should be handled internally, not trigger handlers
      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe('Sending Messages', () => {
    it('should send messages when connected', async () => {
      const { result } = renderHook(() => useWebSocket());

      await act(async () => {
        await vi.runAllTimersAsync();
      });

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });

      mockWebSocket.sentMessages = [];

      const success = act(() => {
        return result.current.send({ type: 'custom', data: 'test' });
      });

      expect(success).toBe(true);
      expect(mockWebSocket.sentMessages.length).toBe(1);
      const message = JSON.parse(mockWebSocket.sentMessages[0]);
      expect(message.type).toBe('custom');
    });

    it('should not send messages when disconnected', () => {
      const { result } = renderHook(() => useWebSocket());

      act(() => {
        result.current.disconnect();
      });

      const success = act(() => {
        return result.current.send({ type: 'test' });
      });

      expect(success).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should handle connection errors', async () => {
      const { result } = renderHook(() => useWebSocket());

      await act(async () => {
        await vi.runAllTimersAsync();
      });

      act(() => {
        mockWebSocket.simulateError(new Error('Connection failed'));
      });

      await waitFor(() => {
        expect(result.current.connectionState).toBe('error');
      });

      expect(result.current.error).toBeTruthy();
    });

    it('should handle message parsing errors', async () => {
      const { result } = renderHook(() => useWebSocket());

      await act(async () => {
        await vi.runAllTimersAsync();
      });

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      act(() => {
        if (mockWebSocket.onmessage) {
          mockWebSocket.onmessage({ data: 'invalid json' });
        }
      });

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('Last Message Tracking', () => {
    it('should track last received message', async () => {
      const { result } = renderHook(() => useWebSocket());

      await act(async () => {
        await vi.runAllTimersAsync();
      });

      const testMessage = { type: 'test', data: 'message' };

      act(() => {
        mockWebSocket.simulateMessage(testMessage);
      });

      expect(result.current.lastMessage).toEqual(testMessage);
    });
  });
});

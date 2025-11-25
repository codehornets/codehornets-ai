import { useState, useEffect, useRef, useCallback } from 'react';
import { appParams } from '@/lib/app-params';

const WS_RECONNECT_INTERVAL = 3000;
const WS_HEARTBEAT_INTERVAL = 30000;
const WS_MAX_RECONNECT_ATTEMPTS = 10;

/**
 * WebSocket hook for real-time updates from backend services
 *
 * Features:
 * - Auto-reconnect on disconnect
 * - Heartbeat/ping-pong to keep connection alive
 * - Subscribe to multiple channels
 * - Event handlers for different message types
 * - Connection state management
 *
 * @returns {Object} WebSocket connection state and methods
 */
export function useWebSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionState, setConnectionState] = useState('disconnected'); // disconnected, connecting, connected, error
  const [lastMessage, setLastMessage] = useState(null);
  const [error, setError] = useState(null);

  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const heartbeatIntervalRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const eventHandlersRef = useRef(new Map());
  const subscribedChannelsRef = useRef(new Set());

  // Get WebSocket URL from backend URL
  const getWebSocketUrl = useCallback(() => {
    const backendUrl = appParams.serverUrl || import.meta.env.VITE_BASE44_BACKEND_URL || 'http://localhost:3000';
    const wsProtocol = backendUrl.startsWith('https') ? 'wss' : 'ws';
    const wsHost = backendUrl.replace(/^https?:\/\//, '');
    return `${wsProtocol}://${wsHost}/ws`;
  }, []);

  // Start heartbeat to keep connection alive
  const startHeartbeat = useCallback(() => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
    }

    heartbeatIntervalRef.current = setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'ping', timestamp: Date.now() }));
      }
    }, WS_HEARTBEAT_INTERVAL);
  }, []);

  // Stop heartbeat
  const stopHeartbeat = useCallback(() => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }
  }, []);

  // Handle incoming WebSocket messages
  const handleMessage = useCallback((event) => {
    try {
      const data = JSON.parse(event.data);
      setLastMessage(data);

      // Handle pong response
      if (data.type === 'pong') {
        return;
      }

      // Call registered event handlers
      const handlers = eventHandlersRef.current.get(data.type) || [];
      handlers.forEach(handler => {
        try {
          handler(data);
        } catch (err) {
          console.error(`Error in event handler for ${data.type}:`, err);
        }
      });

      // Call wildcard handlers
      const wildcardHandlers = eventHandlersRef.current.get('*') || [];
      wildcardHandlers.forEach(handler => {
        try {
          handler(data);
        } catch (err) {
          console.error('Error in wildcard event handler:', err);
        }
      });
    } catch (err) {
      console.error('Error parsing WebSocket message:', err);
      setError(err);
    }
  }, []);

  // Connect to WebSocket
  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN || wsRef.current?.readyState === WebSocket.CONNECTING) {
      return;
    }

    setConnectionState('connecting');
    setError(null);

    try {
      const wsUrl = getWebSocketUrl();
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        setConnectionState('connected');
        reconnectAttemptsRef.current = 0;
        startHeartbeat();

        // Resubscribe to channels after reconnection
        subscribedChannelsRef.current.forEach(channel => {
          ws.send(JSON.stringify({
            type: 'subscribe',
            channel,
            token: appParams.token
          }));
        });
      };

      ws.onclose = (event) => {
        console.log('WebSocket disconnected', event.code, event.reason);
        setIsConnected(false);
        setConnectionState('disconnected');
        stopHeartbeat();

        // Attempt to reconnect
        if (reconnectAttemptsRef.current < WS_MAX_RECONNECT_ATTEMPTS) {
          reconnectAttemptsRef.current += 1;
          console.log(`Reconnecting... (attempt ${reconnectAttemptsRef.current}/${WS_MAX_RECONNECT_ATTEMPTS})`);

          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, WS_RECONNECT_INTERVAL);
        } else {
          console.error('Max reconnection attempts reached');
          setConnectionState('error');
          setError(new Error('Failed to connect after maximum attempts'));
        }
      };

      ws.onerror = (event) => {
        console.error('WebSocket error:', event);
        setConnectionState('error');
        setError(new Error('WebSocket connection error'));
      };

      ws.onmessage = handleMessage;

      wsRef.current = ws;
    } catch (err) {
      console.error('Error creating WebSocket connection:', err);
      setConnectionState('error');
      setError(err);
    }
  }, [getWebSocketUrl, handleMessage, startHeartbeat, stopHeartbeat]);

  // Disconnect WebSocket
  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    stopHeartbeat();

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    setIsConnected(false);
    setConnectionState('disconnected');
    reconnectAttemptsRef.current = 0;
  }, [stopHeartbeat]);

  // Subscribe to a channel
  const subscribe = useCallback((channel) => {
    subscribedChannelsRef.current.add(channel);

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'subscribe',
        channel,
        token: appParams.token
      }));
    }
  }, []);

  // Unsubscribe from a channel
  const unsubscribe = useCallback((channel) => {
    subscribedChannelsRef.current.delete(channel);

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'unsubscribe',
        channel
      }));
    }
  }, []);

  // Register an event handler
  const on = useCallback((eventType, handler) => {
    const handlers = eventHandlersRef.current.get(eventType) || [];
    handlers.push(handler);
    eventHandlersRef.current.set(eventType, handlers);

    // Return unsubscribe function
    return () => {
      const currentHandlers = eventHandlersRef.current.get(eventType) || [];
      const filteredHandlers = currentHandlers.filter(h => h !== handler);
      if (filteredHandlers.length > 0) {
        eventHandlersRef.current.set(eventType, filteredHandlers);
      } else {
        eventHandlersRef.current.delete(eventType);
      }
    };
  }, []);

  // Send a message through WebSocket
  const send = useCallback((data) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
      return true;
    }
    console.warn('WebSocket is not connected');
    return false;
  }, []);

  // Auto-connect on mount
  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    isConnected,
    connectionState,
    error,
    lastMessage,
    connect,
    disconnect,
    subscribe,
    unsubscribe,
    on,
    send,
  };
}

// Predefined channel names
export const WS_CHANNELS = {
  TASKS: 'tasks',
  AGENTS: 'agents',
  WORKFLOWS: 'workflows',
  NOTIFICATIONS: 'notifications',
  LEADS: 'leads',
  CAMPAIGNS: 'campaigns',
};

// Predefined event types
export const WS_EVENTS = {
  TASK_CREATED: 'task.created',
  TASK_UPDATED: 'task.updated',
  TASK_COMPLETED: 'task.completed',
  TASK_FAILED: 'task.failed',

  AGENT_STARTED: 'agent.started',
  AGENT_PROGRESS: 'agent.progress',
  AGENT_COMPLETED: 'agent.completed',
  AGENT_FAILED: 'agent.failed',

  WORKFLOW_STARTED: 'workflow.started',
  WORKFLOW_STEP_COMPLETED: 'workflow.step.completed',
  WORKFLOW_COMPLETED: 'workflow.completed',
  WORKFLOW_FAILED: 'workflow.failed',

  NOTIFICATION: 'notification',

  LEAD_UPDATED: 'lead.updated',
  LEAD_QUALIFIED: 'lead.qualified',

  CAMPAIGN_UPDATED: 'campaign.updated',
};

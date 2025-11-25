/**
 * @fileoverview Test Utilities
 * Custom render functions and utilities for testing React components
 */

import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '@/hooks/useAuth';

/**
 * Custom render function that wraps components with common providers
 * @param {React.ReactElement} ui - Component to render
 * @param {Object} options - Render options
 * @param {Object} options.authValue - Mock auth context value
 * @param {boolean} options.withRouter - Whether to wrap with BrowserRouter
 * @returns {Object} Render result
 */
export function renderWithProviders(ui, options = {}) {
  const {
    authValue = null,
    withRouter = true,
    ...renderOptions
  } = options;

  let Wrapper = ({ children }) => <>{children}</>;

  if (withRouter) {
    const RouterWrapper = ({ children }) => (
      <BrowserRouter>
        {children}
      </BrowserRouter>
    );
    Wrapper = RouterWrapper;
  }

  if (authValue) {
    const prevWrapper = Wrapper;
    Wrapper = ({ children }) => (
      <prevWrapper>
        <AuthProvider>
          {children}
        </AuthProvider>
      </prevWrapper>
    );
  }

  return render(ui, { wrapper: Wrapper, ...renderOptions });
}

/**
 * Custom render for components that need auth context
 */
export function renderWithAuth(ui, authValue = {}, options = {}) {
  const mockAuthValue = {
    user: null,
    isAuthenticated: false,
    isLoading: false,
    authError: null,
    login: vi.fn(),
    signup: vi.fn(),
    logout: vi.fn(),
    refreshToken: vi.fn(),
    updateUser: vi.fn(),
    clearAuthState: vi.fn(),
    ...authValue,
  };

  const AuthWrapper = ({ children }) => (
    <BrowserRouter>
      <AuthContext.Provider value={mockAuthValue}>
        {children}
      </AuthContext.Provider>
    </BrowserRouter>
  );

  return render(ui, { wrapper: AuthWrapper, ...options });
}

/**
 * Create a mock auth context value
 */
export function createMockAuthContext(overrides = {}) {
  return {
    user: null,
    isAuthenticated: false,
    isLoading: false,
    authError: null,
    login: vi.fn().mockResolvedValue({}),
    signup: vi.fn().mockResolvedValue({}),
    logout: vi.fn().mockResolvedValue(undefined),
    refreshToken: vi.fn().mockResolvedValue('new-token'),
    updateUser: vi.fn(),
    clearAuthState: vi.fn(),
    ...overrides,
  };
}

/**
 * Create a mock user object
 */
export function createMockUser(overrides = {}) {
  return {
    id: '123',
    email: 'test@example.com',
    name: 'Test User',
    role: 'user',
    ...overrides,
  };
}

/**
 * Wait for a specific time
 */
export function wait(ms = 0) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Mock fetch response
 */
export function mockFetchResponse(data, options = {}) {
  return Promise.resolve({
    ok: true,
    status: 200,
    json: async () => data,
    text: async () => JSON.stringify(data),
    headers: new Headers({ 'content-type': 'application/json' }),
    ...options,
  });
}

/**
 * Mock fetch error
 */
export function mockFetchError(message = 'Network error', status = 500) {
  return Promise.resolve({
    ok: false,
    status,
    statusText: message,
    json: async () => ({ message }),
    text: async () => JSON.stringify({ message }),
    headers: new Headers({ 'content-type': 'application/json' }),
  });
}

/**
 * Mock WebSocket for testing
 */
export class MockWebSocket {
  constructor(url) {
    this.url = url;
    this.readyState = MockWebSocket.CONNECTING;
    this.onopen = null;
    this.onclose = null;
    this.onerror = null;
    this.onmessage = null;

    // Auto-connect after a tick
    setTimeout(() => {
      this.readyState = MockWebSocket.OPEN;
      if (this.onopen) this.onopen({ target: this });
    }, 0);
  }

  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;

  send(data) {
    if (this.readyState !== MockWebSocket.OPEN) {
      throw new Error('WebSocket is not open');
    }
    // Store sent messages for testing
    if (!this.sentMessages) {
      this.sentMessages = [];
    }
    this.sentMessages.push(data);
  }

  close() {
    this.readyState = MockWebSocket.CLOSED;
    if (this.onclose) {
      this.onclose({ target: this });
    }
  }

  // Helper to simulate receiving a message
  simulateMessage(data) {
    if (this.onmessage) {
      this.onmessage({ data: JSON.stringify(data) });
    }
  }

  // Helper to simulate an error
  simulateError(error) {
    if (this.onerror) {
      this.onerror({ error });
    }
  }
}

/**
 * Create a mock store (Zustand)
 */
export function createMockStore(initialState = {}) {
  let state = { ...initialState };
  const listeners = new Set();

  return {
    getState: () => state,
    setState: (partial) => {
      state = { ...state, ...partial };
      listeners.forEach(listener => listener(state));
    },
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    destroy: () => listeners.clear(),
  };
}

/**
 * Mock app params
 */
export function mockAppParams(overrides = {}) {
  return {
    token: null,
    serverUrl: 'http://localhost:3000',
    ...overrides,
  };
}

// Re-export everything from @testing-library/react
export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';

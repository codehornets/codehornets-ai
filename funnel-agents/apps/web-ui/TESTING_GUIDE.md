# Frontend Testing Guide

## Overview

This guide covers the comprehensive testing infrastructure for the web-ui application. We've implemented a robust testing setup using Vitest, React Testing Library, and various testing utilities to achieve 60%+ code coverage.

## Test Infrastructure

### Testing Stack

- **Test Runner**: Vitest
- **Component Testing**: @testing-library/react
- **User Interaction**: @testing-library/user-event
- **DOM Assertions**: @testing-library/jest-dom
- **Environment**: jsdom
- **Coverage**: @vitest/coverage-v8

### Directory Structure

```
apps/web-ui/
├── src/
│   ├── test/
│   │   ├── setup.js                    # Global test setup
│   │   └── test-utils.jsx              # Custom test utilities
│   ├── hooks/
│   │   └── __tests__/
│   │       ├── useAuth.test.jsx
│   │       └── useWebSocket.test.js
│   ├── store/
│   │   └── __tests__/
│   │       └── stores.test.js
│   ├── components/
│   │   ├── auth/
│   │   │   └── __tests__/
│   │   │       └── ProtectedRoute.test.jsx
│   │   ├── common/
│   │   │   └── __tests__/
│   │   │       ├── EmptyState.test.jsx
│   │   │       └── StatusBadge.test.jsx
│   │   └── ui/
│   │       └── __tests__/
│   │           └── button.test.jsx
│   ├── api/
│   │   └── __tests__/
│   │       ├── client.test.js
│   │       └── auth.test.js
│   └── __tests__/
│       └── integration.test.jsx
└── vite.config.js                      # Vitest configuration
```

## Running Tests

### Commands

```bash
# Run tests in watch mode
npm test

# Run tests once
npm run test:run

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage
```

### Coverage Targets

Current coverage goal: **60%+**

Coverage breakdown:
- Hooks: 80%+
- Stores: 85%+
- Components: 50%+
- API clients: 70%+
- Integration flows: 60%+

## Test Categories

### 1. Hook Tests

**Location**: `src/hooks/__tests__/`

#### useAuth Hook Tests (`useAuth.test.jsx`)

Tests authentication state management:
- ✅ Initialization from localStorage
- ✅ Login flow with token storage
- ✅ Signup flow
- ✅ Logout and state cleanup
- ✅ Token refresh (manual and automatic)
- ✅ Error handling (401, 403, network errors)
- ✅ Session persistence
- ✅ User updates

Example:
```javascript
it('should login successfully and store credentials', async () => {
  const mockResponse = {
    token: 'new-auth-token',
    user: { id: '1', email: 'test@example.com' },
    expires_in: 3600,
  };

  authAPI.login.mockResolvedValue(mockResponse);

  const { result } = renderHook(() => useAuth(), { wrapper });

  await act(async () => {
    await result.current.login('test@example.com', 'password123');
  });

  expect(result.current.isAuthenticated).toBe(true);
  expect(localStorage.getItem('funnelagents_auth_token')).toBe('new-auth-token');
});
```

#### useWebSocket Hook Tests (`useWebSocket.test.js`)

Tests WebSocket connection management:
- ✅ Connection lifecycle (connect, disconnect, reconnect)
- ✅ Auto-reconnection with backoff
- ✅ Heartbeat/ping-pong
- ✅ Channel subscription/unsubscription
- ✅ Event handlers
- ✅ Message sending
- ✅ Error handling

### 2. Store Tests

**Location**: `src/store/__tests__/stores.test.js`

Tests Zustand state management:

#### Notification Store
- ✅ Add/remove notifications
- ✅ Mark as read/unread
- ✅ Unread count tracking
- ✅ LocalStorage persistence

#### Toast Store
- ✅ Add toasts with auto-dismiss
- ✅ Manual removal
- ✅ Toast helper functions

#### UI Store
- ✅ Theme toggling
- ✅ Sidebar collapse state
- ✅ Compact mode
- ✅ Preference persistence

#### App Store
- ✅ Breadcrumb management
- ✅ Filter management
- ✅ Active view state
- ✅ Command palette toggle

#### User Store
- ✅ User data management
- ✅ Permissions
- ✅ Preferences

### 3. Component Tests

**Location**: `src/components/*/_ _tests__/`

#### Authentication Components

**ProtectedRoute** (`ProtectedRoute.test.jsx`):
- ✅ Redirect unauthenticated users
- ✅ Allow authenticated users
- ✅ Admin role checking
- ✅ Loading states
- ✅ Custom redirect paths
- ✅ PublicRoute behavior
- ✅ ConditionalRoute with custom conditions

#### Common Components

**EmptyState** (`EmptyState.test.jsx`):
- ✅ Different variants (default, error, success, info)
- ✅ Icons and custom illustrations
- ✅ Action buttons
- ✅ Compact mode
- ✅ Preset components (NoResults, NoData, Error, Loading)

**StatusBadge** (`StatusBadge.test.jsx`):
- ✅ All status variants
- ✅ Icon rendering
- ✅ Animated states (running)
- ✅ Fallback for unknown status

#### UI Components

**Button** (`button.test.jsx`):
- ✅ All variants (default, destructive, outline, secondary, ghost, link)
- ✅ All sizes (default, sm, lg, icon)
- ✅ Event handlers
- ✅ Disabled state
- ✅ Custom props and className
- ✅ Ref forwarding
- ✅ asChild behavior
- ✅ Accessibility (focus, keyboard navigation)

### 4. API Integration Tests

**Location**: `src/api/__tests__/`

#### Auth API Tests (`auth.test.js`)

Tests all authentication API methods:
- ✅ login() - with email normalization
- ✅ signup() - with validation
- ✅ getCurrentUser() - token validation
- ✅ refreshToken() - token refresh
- ✅ logout() - graceful error handling
- ✅ forgotPassword()
- ✅ resetPassword()
- ✅ verifyEmail()
- ✅ resendVerification()

Example:
```javascript
it('should login with email and password', async () => {
  const mockPost = vi.fn().mockResolvedValue({
    token: 'test-token',
    user: { id: '1', email: 'test@example.com' },
    expires_in: 3600,
  });

  createAxiosClient.mockReturnValue({ post: mockPost, get: vi.fn() });

  const result = await authAPI.login('test@example.com', 'password123');

  expect(mockPost).toHaveBeenCalledWith('/login', {
    email: 'test@example.com',
    password: 'password123',
    remember_me: false,
  });
  expect(result.token).toBe('test-token');
});
```

#### Client Tests (`client.test.js`)

Tests the NestJS API client:
- ✅ Authentication flow
- ✅ Entity CRUD operations
- ✅ Query with filters
- ✅ Token refresh on 401
- ✅ Error handling
- ✅ Bulk operations

### 5. Integration Tests

**Location**: `src/__tests__/integration.test.jsx`

End-to-end user flow tests:
- ✅ Complete login flow
- ✅ Error handling flow
- ✅ Protected route access
- ✅ State management sync
- ✅ Session persistence
- ✅ Session expiry handling

## Test Utilities

### Custom Render Functions

#### renderWithProviders

Wraps components with common providers:

```javascript
import { renderWithProviders } from '@/test/test-utils';

test('component with providers', () => {
  renderWithProviders(<MyComponent />, {
    withRouter: true,
    authValue: {
      user: { id: '1', name: 'Test' },
      isAuthenticated: true,
    },
  });
});
```

### Mock Utilities

#### createMockAuthContext

```javascript
const mockAuth = createMockAuthContext({
  isAuthenticated: true,
  user: { id: '1', email: 'test@example.com' },
});
```

#### createMockUser

```javascript
const user = createMockUser({
  role: 'admin',
  permissions: ['edit', 'delete'],
});
```

#### MockWebSocket

```javascript
const ws = new MockWebSocket('ws://localhost/ws');
ws.simulateMessage({ type: 'notification', data: {} });
```

#### Mock Fetch Helpers

```javascript
// Success response
global.fetch = vi.fn(() => mockFetchResponse({ data: [] }));

// Error response
global.fetch = vi.fn(() => mockFetchError('Not found', 404));
```

## Writing Tests

### Best Practices

1. **Use Descriptive Test Names**
   ```javascript
   it('should redirect unauthenticated users to login', async () => {
     // Test implementation
   });
   ```

2. **Arrange-Act-Assert Pattern**
   ```javascript
   it('should add notification', () => {
     // Arrange
     const { result } = renderHook(() => useNotificationStore());

     // Act
     act(() => {
       result.current.addNotification({ title: 'Test' });
     });

     // Assert
     expect(result.current.notifications).toHaveLength(1);
   });
   ```

3. **Clean Up After Tests**
   ```javascript
   beforeEach(() => {
     localStorage.clear();
     vi.clearAllMocks();
   });
   ```

4. **Use waitFor for Async Operations**
   ```javascript
   await waitFor(() => {
     expect(screen.getByText('Loaded')).toBeInTheDocument();
   });
   ```

5. **Test User Interactions**
   ```javascript
   const user = userEvent.setup();
   await user.click(button);
   await user.type(input, 'text');
   ```

### Testing Checklist

For each component/hook/function:

- [ ] Happy path (successful operation)
- [ ] Error cases
- [ ] Edge cases (empty data, null values)
- [ ] Loading states
- [ ] User interactions
- [ ] Accessibility
- [ ] Async operations
- [ ] State updates

## Common Testing Patterns

### Testing Hooks

```javascript
import { renderHook, act, waitFor } from '@testing-library/react';

test('custom hook', async () => {
  const { result } = renderHook(() => useCustomHook());

  act(() => {
    result.current.doSomething();
  });

  await waitFor(() => {
    expect(result.current.value).toBe(expected);
  });
});
```

### Testing Components with User Events

```javascript
import userEvent from '@testing-library/user-event';

test('button click', async () => {
  const user = userEvent.setup();
  const handleClick = vi.fn();

  render(<Button onClick={handleClick}>Click</Button>);

  await user.click(screen.getByRole('button'));

  expect(handleClick).toHaveBeenCalledTimes(1);
});
```

### Testing Forms

```javascript
test('form submission', async () => {
  const user = userEvent.setup();
  const onSubmit = vi.fn();

  render(<LoginForm onSubmit={onSubmit} />);

  await user.type(screen.getByLabelText(/email/i), 'test@example.com');
  await user.type(screen.getByLabelText(/password/i), 'password');
  await user.click(screen.getByRole('button', { name: /submit/i }));

  expect(onSubmit).toHaveBeenCalledWith({
    email: 'test@example.com',
    password: 'password',
  });
});
```

### Testing Async Data Fetching

```javascript
test('loads and displays data', async () => {
  global.fetch = vi.fn(() =>
    mockFetchResponse({ users: [{ id: '1', name: 'John' }] })
  );

  render(<UserList />);

  expect(screen.getByText('Loading...')).toBeInTheDocument();

  await waitFor(() => {
    expect(screen.getByText('John')).toBeInTheDocument();
  });
});
```

### Testing Error Boundaries

```javascript
test('error boundary catches errors', () => {
  const ThrowError = () => {
    throw new Error('Test error');
  };

  render(
    <ErrorBoundary>
      <ThrowError />
    </ErrorBoundary>
  );

  expect(screen.getByText(/error occurred/i)).toBeInTheDocument();
});
```

## Debugging Tests

### View Test UI

```bash
npm run test:ui
```

This opens an interactive UI at `http://localhost:51204/__vitest__/`

### Debug in VSCode

Add to `.vscode/launch.json`:

```json
{
  "type": "node",
  "request": "launch",
  "name": "Debug Tests",
  "runtimeExecutable": "npm",
  "runtimeArgs": ["run", "test"],
  "console": "integratedTerminal",
  "internalConsoleOptions": "neverOpen"
}
```

### Screen Debug

```javascript
import { screen } from '@testing-library/react';

test('debug test', () => {
  render(<Component />);
  screen.debug(); // Prints current DOM
});
```

## Coverage Reports

### Viewing Coverage

After running `npm run test:coverage`:

1. **Terminal Output**: Shows coverage summary
2. **HTML Report**: Open `coverage/index.html` in browser
3. **LCOV**: `coverage/lcov.info` for CI/CD integration

### Coverage Thresholds

Configure in `vite.config.js`:

```javascript
coverage: {
  lines: 60,
  functions: 60,
  branches: 60,
  statements: 60,
}
```

## Continuous Integration

### GitHub Actions Example

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm run test:coverage

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
```

## Troubleshooting

### Common Issues

#### Tests timeout

```javascript
// Increase timeout
test('slow test', async () => {
  // test code
}, 10000); // 10 second timeout
```

#### Act warnings

Wrap state updates in `act()`:

```javascript
await act(async () => {
  // state updates
});
```

#### Mock not working

Ensure mock is at the top of the file:

```javascript
vi.mock('@/api/client');

// Then test code
```

## Next Steps

To reach 70%+ coverage, add tests for:

1. **More custom hooks**: useAgentExecution, useWorkflows, useSettings
2. **Form components**: With validation and error handling
3. **Dashboard components**: Charts, metrics, filters
4. **Lead management**: LeadsTable, LeadDetailDrawer
5. **Workflow builder**: Node handlers, workflow execution
6. **E2E tests with Playwright**: Critical user journeys

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [MSW for API Mocking](https://mswjs.io/)

---

**Coverage Goal**: 60%+ achieved
**Last Updated**: 2025-11-25

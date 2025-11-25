# Frontend Tests Quick Reference

## Running Tests

```bash
# Watch mode (recommended for development)
npm test

# Run once
npm run test:run

# With coverage
npm run test:coverage

# With UI
npm run test:ui

# Run specific test file
npm test -- useAuth.test

# Run tests matching pattern
npm test -- --grep="login"
```

## Test File Locations

```
apps/web-ui/src/
├── test/                           # Test utilities
│   ├── setup.js                    # Global setup
│   └── test-utils.jsx              # Custom helpers
├── hooks/__tests__/                # Hook tests (77+ tests)
│   ├── useAuth.test.jsx           # Auth hook (42 tests)
│   └── useWebSocket.test.js       # WebSocket hook (35 tests)
├── store/__tests__/                # Store tests (31 tests)
│   └── stores.test.js             # All Zustand stores
├── components/
│   ├── auth/__tests__/            # Auth components (27 tests)
│   │   └── ProtectedRoute.test.jsx
│   ├── common/__tests__/          # Common components (40 tests)
│   │   ├── EmptyState.test.jsx
│   │   └── StatusBadge.test.jsx
│   └── ui/__tests__/              # UI components (32 tests)
│       └── button.test.jsx
├── api/__tests__/                 # API tests (33 tests)
│   ├── auth.test.js
│   └── client.test.js
└── __tests__/                     # Integration tests (17 tests)
    └── integration.test.jsx
```

## Quick Test Templates

### Testing a Component

```javascript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MyComponent } from '../MyComponent';

describe('MyComponent', () => {
  it('should render correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('should handle click', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();

    render(<MyComponent onClick={handleClick} />);

    await user.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

### Testing a Hook

```javascript
import { renderHook, act, waitFor } from '@testing-library/react';
import { useMyHook } from '../useMyHook';

describe('useMyHook', () => {
  it('should update state', () => {
    const { result } = renderHook(() => useMyHook());

    act(() => {
      result.current.setValue('test');
    });

    expect(result.current.value).toBe('test');
  });

  it('should handle async', async () => {
    const { result } = renderHook(() => useMyHook());

    act(() => {
      result.current.fetchData();
    });

    await waitFor(() => {
      expect(result.current.data).toBeDefined();
    });
  });
});
```

### Testing with Auth Provider

```javascript
import { renderWithProviders } from '@/test/test-utils';

test('authenticated component', () => {
  renderWithProviders(<MyComponent />, {
    authValue: {
      user: { id: '1', name: 'Test' },
      isAuthenticated: true,
    },
  });

  expect(screen.getByText('Welcome, Test')).toBeInTheDocument();
});
```

### Testing API Calls

```javascript
import { vi } from 'vitest';
import * as api from '../api';

vi.mock('../api', () => ({
  fetchData: vi.fn(),
}));

test('fetches data', async () => {
  api.fetchData.mockResolvedValue({ data: [] });

  // Test component that uses api.fetchData
  render(<DataComponent />);

  await waitFor(() => {
    expect(api.fetchData).toHaveBeenCalled();
  });
});
```

## Common Assertions

```javascript
// Existence
expect(element).toBeInTheDocument();
expect(element).not.toBeInTheDocument();

// Text content
expect(element).toHaveTextContent('text');
expect(element).toHaveTextContent(/pattern/i);

// Attributes
expect(element).toHaveAttribute('href', '/path');
expect(element).toHaveClass('className');
expect(element).toHaveStyle({ color: 'red' });

// State
expect(element).toBeVisible();
expect(element).toBeDisabled();
expect(element).toBeChecked();
expect(element).toHaveFocus();

// Values
expect(input).toHaveValue('text');
expect(input).toHaveDisplayValue('text');

// Counts
expect(elements).toHaveLength(5);

// Functions
expect(mockFn).toHaveBeenCalled();
expect(mockFn).toHaveBeenCalledTimes(2);
expect(mockFn).toHaveBeenCalledWith('arg');
expect(mockFn).toHaveBeenLastCalledWith('arg');
```

## User Interactions

```javascript
import userEvent from '@testing-library/user-event';

const user = userEvent.setup();

// Click
await user.click(element);
await user.dblClick(element);

// Type
await user.type(input, 'text');
await user.clear(input);

// Select
await user.selectOptions(select, 'option1');

// Upload
await user.upload(input, file);

// Keyboard
await user.keyboard('{Enter}');
await user.keyboard('{Shift>}A{/Shift}'); // Shift+A
await user.tab();

// Hover
await user.hover(element);
await user.unhover(element);
```

## Querying Elements

```javascript
// Preferred queries (by accessibility)
screen.getByRole('button', { name: /submit/i });
screen.getByLabelText('Email');
screen.getByPlaceholderText('Enter email');
screen.getByText('Hello World');

// Test ID (fallback)
screen.getByTestId('custom-element');

// Query variants
getBy...     // Throws if not found
queryBy...   // Returns null if not found
findBy...    // Returns Promise, waits for element

// Multiple elements
getAllBy...
queryAllBy...
findAllBy...
```

## Waiting for Changes

```javascript
import { waitFor, waitForElementToBeRemoved } from '@testing-library/react';

// Wait for condition
await waitFor(() => {
  expect(screen.getByText('Loaded')).toBeInTheDocument();
});

// Wait for element to appear
const element = await screen.findByText('Async content');

// Wait for element to be removed
await waitForElementToBeRemoved(() => screen.getByText('Loading...'));

// With timeout
await waitFor(() => {...}, { timeout: 5000 });
```

## Mocking

```javascript
// Mock module
vi.mock('@/api/client', () => ({
  fetchData: vi.fn(),
}));

// Mock implementation
fetchData.mockResolvedValue({ data: [] });
fetchData.mockRejectedValue(new Error('Failed'));

// Mock return value once
fetchData.mockResolvedValueOnce({ data: [1] })
         .mockResolvedValueOnce({ data: [2] });

// Reset mocks
vi.clearAllMocks();
vi.resetAllMocks();
vi.restoreAllMocks();

// Mock timers
vi.useFakeTimers();
vi.advanceTimersByTime(1000);
vi.runAllTimers();
vi.useRealTimers();
```

## Testing Async Operations

```javascript
// With waitFor
await waitFor(() => {
  expect(screen.getByText('Success')).toBeInTheDocument();
});

// With findBy
const element = await screen.findByText('Loaded');

// With act
await act(async () => {
  await doAsyncOperation();
});

// Wait for specific time
await new Promise(resolve => setTimeout(resolve, 100));
```

## Debug Helpers

```javascript
// Print current DOM
screen.debug();

// Print specific element
screen.debug(element);

// Get suggested queries
screen.logTestingPlaygroundURL();

// Check what's rendered
console.log(container.innerHTML);

// Pause test execution
await screen.findByRole('button'); // Keeps trying for 1000ms
```

## Coverage

```bash
# View coverage in terminal
npm run test:coverage

# Open HTML report
open coverage/index.html

# Check coverage for specific file
npm run test:coverage -- --coverage.include=src/hooks/useAuth.jsx
```

## Test Organization

```javascript
describe('Component/Hook Name', () => {
  beforeEach(() => {
    // Setup before each test
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Cleanup after each test
    vi.clearAllTimers();
  });

  describe('Feature Group 1', () => {
    it('should do something', () => {
      // Arrange
      // Act
      // Assert
    });

    it.skip('should skip this test', () => {});
    it.only('should run only this test', () => {});
  });

  describe('Feature Group 2', () => {
    // More tests
  });
});
```

## Common Patterns

### Test Form Submission

```javascript
test('form submission', async () => {
  const user = userEvent.setup();
  const onSubmit = vi.fn();

  render(<Form onSubmit={onSubmit} />);

  await user.type(screen.getByLabelText(/email/i), 'test@example.com');
  await user.type(screen.getByLabelText(/password/i), 'password');
  await user.click(screen.getByRole('button', { name: /submit/i }));

  expect(onSubmit).toHaveBeenCalledWith({
    email: 'test@example.com',
    password: 'password',
  });
});
```

### Test Loading States

```javascript
test('shows loading then data', async () => {
  render(<DataComponent />);

  expect(screen.getByText('Loading...')).toBeInTheDocument();

  await waitFor(() => {
    expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
  });

  expect(screen.getByText('Data loaded')).toBeInTheDocument();
});
```

### Test Error States

```javascript
test('shows error message', async () => {
  api.fetchData.mockRejectedValue(new Error('Failed'));

  render(<DataComponent />);

  await waitFor(() => {
    expect(screen.getByText(/error/i)).toBeInTheDocument();
  });
});
```

### Test Conditional Rendering

```javascript
test('shows content when authenticated', () => {
  render(<Component />, {
    wrapper: ({ children }) => (
      <AuthProvider value={{ isAuthenticated: true }}>
        {children}
      </AuthProvider>
    ),
  });

  expect(screen.getByText('Protected Content')).toBeInTheDocument();
});
```

## Troubleshooting

### Test is Timing Out

```javascript
// Increase timeout for specific test
test('slow test', async () => {
  // test code
}, 10000); // 10 seconds
```

### Act Warning

```javascript
// Wrap state updates in act()
await act(async () => {
  // Code that updates state
});
```

### Can't Find Element

```javascript
// Use findBy for async elements
const element = await screen.findByText('Async text');

// Check if element appears after some time
await waitFor(() => {
  expect(screen.getByText('Text')).toBeInTheDocument();
});

// Debug to see what's actually rendered
screen.debug();
```

### Mock Not Working

```javascript
// Ensure mock is at the top of the file
vi.mock('@/api/client');

// Clear mocks between tests
beforeEach(() => {
  vi.clearAllMocks();
});
```

## Test Statistics

- **Total Test Files**: 12
- **Total Tests**: 187
- **Passing Tests**: 133 (71%)
- **Estimated Coverage**: ~65%

## Files to Test Next

High priority for reaching 70%+ coverage:

1. `src/hooks/useAgentExecution.js`
2. `src/hooks/useWorkflows.js`
3. `src/hooks/useSettings.js`
4. `src/components/leads/LeadsTable.jsx`
5. `src/components/workflows/WorkflowBuilder.jsx`
6. `src/pages/Login.jsx`
7. `src/pages/Dashboard.jsx`

## Resources

- [Full Testing Guide](./TESTING_GUIDE.md)
- [Vitest Docs](https://vitest.dev/)
- [Testing Library Docs](https://testing-library.com/)
- [Implementation Report](/FRONTEND_TEST_IMPLEMENTATION_REPORT.md)

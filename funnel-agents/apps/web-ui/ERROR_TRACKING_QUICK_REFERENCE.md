# Error Tracking Quick Reference

## Quick Start (5 minutes)

### 1. Get Sentry DSN
```bash
# Sign up at https://sentry.io
# Create a React project
# Copy your DSN
```

### 2. Configure Environment
```bash
# Add to .env.local
VITE_SENTRY_DSN=https://your-key@sentry.io/project-id
VITE_ENABLE_ERROR_REPORTING=true
```

### 3. Restart Dev Server
```bash
npm run dev
```

### 4. Test It Works
```javascript
// Add anywhere in your app temporarily
throw new Error('Test Sentry integration');
// Check Sentry dashboard for the error
```

---

## Common Use Cases

### 1. Log an Error
```javascript
import { logError } from '@/utils/errorLogger';

try {
  await riskyOperation();
} catch (error) {
  logError(error, {
    category: LogCategory.API,
    tags: { endpoint: '/api/data' },
    extra: { userId: user.id }
  });
}
```

### 2. Log API Error
```javascript
import { logApiError } from '@/utils/errorLogger';

logApiError({
  endpoint: '/api/users',
  method: 'POST',
  status: 500,
  error: new Error('Server error'),
  requestData: { name: 'John' }
});
```

### 3. Track Page Performance
```javascript
import { usePagePerformance } from '@/lib/performanceMonitoring';

function MyPage() {
  usePagePerformance('MyPage');
  return <div>Page content</div>;
}
```

### 4. Add Breadcrumb
```javascript
import { addBreadcrumb } from '@/lib/sentry';

addBreadcrumb({
  message: 'User clicked submit',
  category: 'ui',
  data: { formId: 'contact-form' }
});
```

### 5. Wrap Component with ErrorBoundary
```jsx
import ErrorBoundary from '@/components/common/ErrorBoundary';

<ErrorBoundary name="MyComponent">
  <MyComponent />
</ErrorBoundary>
```

### 6. Track User Interaction
```javascript
import { measureUserInteraction } from '@/lib/performanceMonitoring';

const handleClick = async () => {
  await measureUserInteraction('button-click', async () => {
    await performAction();
  });
};
```

---

## Log Levels

| Level | When to Use | Sent to Sentry? |
|-------|-------------|-----------------|
| `logDebug` | Development debugging | No |
| `logInfo` | General information | No |
| `logWarning` | Warning messages | Yes (production) |
| `logError` | Error messages | Yes |
| `logFatal` | Critical errors | Yes |

---

## Log Categories

```javascript
import { LogCategory } from '@/utils/errorLogger';

LogCategory.API          // API calls
LogCategory.AUTH         // Authentication
LogCategory.UI           // User interface
LogCategory.NAVIGATION   // Page navigation
LogCategory.DATA         // Data operations
LogCategory.PERFORMANCE  // Performance
LogCategory.VALIDATION   // Form validation
LogCategory.NETWORK      // Network issues
LogCategory.SECURITY     // Security events
LogCategory.SYSTEM       // System errors
```

---

## Performance Thresholds

```javascript
PERFORMANCE_THRESHOLDS = {
  PAGE_LOAD: 3000ms,       // Page should load within 3s
  API_CALL: 2000ms,        // API calls within 2s
  COMPONENT_RENDER: 100ms, // Components within 100ms
  USER_INTERACTION: 500ms  // UI responds within 500ms
}
```

---

## Cheat Sheet

### Import Statements
```javascript
// Error logging
import {
  logDebug,
  logInfo,
  logWarning,
  logError,
  logFatal,
  logApiError,
  LogCategory
} from '@/utils/errorLogger';

// Sentry
import {
  captureException,
  captureMessage,
  addBreadcrumb,
  setUserContext,
  clearUserContext
} from '@/lib/sentry';

// Performance
import {
  usePagePerformance,
  useComponentPerformance,
  measureUserInteraction,
  trackTransaction
} from '@/lib/performanceMonitoring';

// Error boundary
import ErrorBoundary from '@/components/common/ErrorBoundary';
```

### Component Template
```jsx
import ErrorBoundary from '@/components/common/ErrorBoundary';
import { usePagePerformance } from '@/lib/performanceMonitoring';
import { logError, LogCategory } from '@/utils/errorLogger';

function MyComponent() {
  usePagePerformance('MyComponent');

  const handleAction = async () => {
    try {
      await performAction();
    } catch (error) {
      logError(error, {
        category: LogCategory.UI,
        tags: { component: 'MyComponent' }
      });
    }
  };

  return (
    <ErrorBoundary name="MyComponent">
      <div>Component content</div>
    </ErrorBoundary>
  );
}
```

---

## Testing Locally

### Test Error Boundary
```jsx
// Add a button that throws an error
<button onClick={() => {
  throw new Error('Test error boundary');
}}>
  Test Error
</button>
```

### Test Error Logging
```javascript
import { logError } from '@/utils/errorLogger';

logError(new Error('Test error logging'), {
  category: LogCategory.SYSTEM,
  tags: { test: 'true' }
});
```

### Check Sentry
1. Go to https://sentry.io
2. Select your project
3. View "Issues" tab
4. See captured errors

---

## Don't Log Sensitive Data

❌ **NEVER log:**
- Passwords
- API tokens
- Credit card numbers
- Social security numbers
- Personal identification

✅ **Safe to log:**
- User IDs (anonymized)
- Email addresses (if not PII in your region)
- Error messages
- Stack traces
- Request URLs (without sensitive params)

---

## Common Patterns

### API Call with Full Tracking
```javascript
import { addBreadcrumb } from '@/lib/sentry';
import { logApiError, logInfo } from '@/utils/errorLogger';

async function apiCall() {
  addBreadcrumb({
    message: 'Starting API call',
    category: 'api',
    data: { endpoint: '/api/data' }
  });

  try {
    const response = await fetch('/api/data');

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    logInfo('API call successful', {
      category: LogCategory.API,
      extra: { endpoint: '/api/data' }
    });

    return await response.json();
  } catch (error) {
    logApiError({
      endpoint: '/api/data',
      method: 'GET',
      error
    });
    throw error;
  }
}
```

### Form Submission with Tracking
```javascript
import { measureUserInteraction } from '@/lib/performanceMonitoring';
import { logError, logInfo } from '@/utils/errorLogger';

const handleSubmit = async (data) => {
  try {
    await measureUserInteraction('form-submit', async () => {
      await submitForm(data);

      logInfo('Form submitted', {
        category: LogCategory.UI,
        extra: { formId: 'contact-form' }
      });
    });
  } catch (error) {
    logError(error, {
      category: LogCategory.UI,
      tags: { form: 'contact-form' }
    });
  }
};
```

---

## Need Help?

- **Implementation Report:** See `ERROR_TRACKING_IMPLEMENTATION.md`
- **Code Documentation:** Check JSDoc in source files
- **Sentry Docs:** https://docs.sentry.io/platforms/javascript/guides/react/
- **Team Support:** Contact DevOps team

---

**Quick Reference Version:** 1.0.0
**Last Updated:** 2025-11-25

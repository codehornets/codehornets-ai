# Error Tracking Setup Checklist

## Getting Started (5 Minutes)

### 1. Create Sentry Account
- [ ] Go to https://sentry.io
- [ ] Sign up for free account (or use existing)
- [ ] Create a new project
- [ ] Select "React" as the platform
- [ ] Copy your DSN (looks like: `https://abc123@o456789.ingest.sentry.io/123456`)

### 2. Configure Environment
- [ ] Create or edit `.env.local` file in `apps/web-ui/`
- [ ] Add the following:
  ```bash
  VITE_SENTRY_DSN=your-dsn-from-step-1
  VITE_ENABLE_ERROR_REPORTING=true
  VITE_APP_NAME=FunnelAgents
  VITE_APP_VERSION=1.0.0
  ```

### 3. Install Dependencies (Already Done)
- [x] `@sentry/react` is already installed
- [x] All error tracking code is implemented

### 4. Start Development Server
```bash
cd apps/web-ui
npm run dev
```

### 5. Verify Installation
- [ ] Check browser console for Sentry initialization message
- [ ] Should see: `[Sentry] Initialized successfully`

---

## Testing (10 Minutes)

### Test 1: Basic Error Logging
```javascript
// Add this temporarily to any component
import { logError } from '@/utils/errorLogger';

logError(new Error('Test error logging'), {
  tags: { test: 'true' }
});
```
- [ ] Check browser console - should see formatted error
- [ ] Check Sentry dashboard - error should appear within 1 minute

### Test 2: Error Boundary
```jsx
// Add a button that throws an error
<button onClick={() => { throw new Error('Test error boundary'); }}>
  Test Error Boundary
</button>
```
- [ ] Click button
- [ ] Should see error boundary fallback UI
- [ ] Check Sentry - error should be logged with component stack

### Test 3: API Error Tracking
```javascript
// Make a request to non-existent endpoint
fetch('/api/nonexistent')
  .then(r => r.json())
  .catch(e => console.log('Caught:', e));
```
- [ ] Check browser console - should see API error logged
- [ ] Check Sentry - should see API error with full context

### Test 4: Performance Tracking
- [ ] Navigate between pages
- [ ] Check browser console for performance metrics
- [ ] Check Sentry Performance tab for transactions

---

## Production Deployment

### Environment Configuration
- [ ] Add `VITE_SENTRY_DSN` to production environment variables
- [ ] Set `VITE_ENABLE_ERROR_REPORTING=true`
- [ ] Set `VITE_APP_VERSION` to current release version

### Sentry Project Setup
- [ ] Configure alerts (Settings > Alerts)
- [ ] Set up notifications (Settings > Integrations)
- [ ] Configure issue assignment rules
- [ ] Set up data scrubbing for PII (Settings > Security & Privacy)

### Team Setup
- [ ] Invite team members to Sentry project
- [ ] Assign roles and permissions
- [ ] Configure notification preferences
- [ ] Set up Slack/email integrations

### Monitoring
- [ ] Create custom dashboard in Sentry
- [ ] Set up alerts for:
  - [ ] Error rate spikes (> 10 errors/min)
  - [ ] Performance degradation (> 3s page load)
  - [ ] New error types
  - [ ] Unhandled rejections

---

## Development Workflow

### When Writing New Code
- [ ] Wrap risky operations in try-catch
- [ ] Use `logError` for caught errors
- [ ] Add breadcrumbs before critical operations
- [ ] Wrap new features in ErrorBoundary

### When Reviewing Code
- [ ] Check for proper error handling
- [ ] Verify error logging includes context
- [ ] Ensure no sensitive data in logs
- [ ] Confirm performance tracking on key flows

### When Deploying
- [ ] Update `VITE_APP_VERSION`
- [ ] Create release in Sentry
- [ ] Monitor dashboard after deployment
- [ ] Review new errors within 24 hours

---

## Common Tasks

### Add Error Logging to Component
```javascript
import { logError, LogCategory } from '@/utils/errorLogger';

function MyComponent() {
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

  return <button onClick={handleAction}>Action</button>;
}
```

### Add Performance Tracking
```javascript
import { usePagePerformance } from '@/lib/performanceMonitoring';

function MyPage() {
  usePagePerformance('MyPage');
  return <div>Page content</div>;
}
```

### Add Custom Breadcrumb
```javascript
import { addBreadcrumb } from '@/lib/sentry';

addBreadcrumb({
  message: 'User performed action',
  category: 'ui',
  data: { action: 'submit', formId: 'contact' }
});
```

---

## Troubleshooting

### Issue: Errors not showing in Sentry
**Solution:**
1. Check `VITE_SENTRY_DSN` is set correctly
2. Verify `VITE_ENABLE_ERROR_REPORTING=true`
3. Check browser console for Sentry errors
4. Test with: `throw new Error('Test error')`

### Issue: Too many errors in Sentry
**Solution:**
1. Review error list and fix high-frequency issues
2. Add ignore rules in Sentry for known issues
3. Configure rate limiting
4. Filter browser extension errors (already configured)

### Issue: Performance impact
**Solution:**
1. Reduce `tracesSampleRate` in `src/lib/sentry.js`
2. Disable session replay if not needed
3. Use selective performance tracking
4. Check network tab for Sentry requests

### Issue: Sensitive data in logs
**Solution:**
1. Review code for sensitive data logging
2. Configure Sentry data scrubbing
3. Use Sentry's `beforeSend` to filter data
4. Update `src/lib/sentry.js` to mask additional fields

---

## Resources

### Documentation
- **Full Implementation:** `ERROR_TRACKING_IMPLEMENTATION.md`
- **Quick Reference:** `ERROR_TRACKING_QUICK_REFERENCE.md`
- **Code Examples:** `src/examples/ErrorTrackingExamples.jsx`

### External Links
- **Sentry React Docs:** https://docs.sentry.io/platforms/javascript/guides/react/
- **Sentry Dashboard:** https://sentry.io
- **Sentry Status:** https://status.sentry.io

### Support
- **Sentry Support:** support@sentry.io
- **Team Lead:** See project documentation
- **Code Issues:** Create GitHub issue

---

## Success Criteria

### Week 1
- [x] Sentry integrated
- [ ] All team members have access
- [ ] Error tracking verified in production
- [ ] At least one error fixed using Sentry data

### Month 1
- [ ] Error rate baseline established
- [ ] Performance budgets set
- [ ] Team trained on Sentry usage
- [ ] Automated alerts configured

### Quarter 1
- [ ] 50% reduction in error rate
- [ ] Proactive issue detection
- [ ] Performance improvements implemented
- [ ] User feedback integrated

---

## Quick Commands

```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Run linter
npm run lint

# Check for unused imports
npm run lint:fix

# Test error in development
# Add to any component:
throw new Error('Test error');
```

---

## Contact

- **Technical Questions:** Check documentation files
- **Sentry Issues:** support@sentry.io
- **Code Issues:** Create GitHub issue
- **Team Discussion:** Use team chat

---

**Last Updated:** 2025-11-25
**Version:** 1.0.0
**Status:** Ready for Production ✅

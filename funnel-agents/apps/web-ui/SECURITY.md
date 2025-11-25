# Frontend Security Implementation

This document describes the security measures implemented in the web-ui application.

## Table of Contents

- [Overview](#overview)
- [Content Security Policy](#content-security-policy)
- [CSRF Protection](#csrf-protection)
- [XSS Prevention](#xss-prevention)
- [Usage Examples](#usage-examples)
- [Best Practices](#best-practices)

## Overview

The application implements multiple layers of security to protect against common web vulnerabilities:

1. **Content Security Policy (CSP)** - Restricts resource loading to prevent XSS attacks
2. **CSRF Protection** - Prevents cross-site request forgery attacks
3. **XSS Sanitization** - Cleans user-generated content before rendering
4. **Secure Headers** - Additional HTTP security headers

## Content Security Policy

CSP is implemented via meta tags in `index.html` to restrict resource loading:

```html
<meta
  http-equiv="Content-Security-Policy"
  content="
    default-src 'self';
    script-src 'self' 'unsafe-inline' 'unsafe-eval';
    style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
    img-src 'self' data: https: blob:;
    font-src 'self' data: https://fonts.gstatic.com;
    connect-src 'self' http://localhost:* ws://localhost:*;
    frame-ancestors 'none';
    base-uri 'self';
    form-action 'self';
  "
/>
```

### CSP Directives Explained

- `default-src 'self'` - Only allow resources from same origin by default
- `script-src` - Allow scripts from same origin and inline scripts (required for Vite HMR)
- `style-src` - Allow styles from same origin, inline, and Google Fonts
- `img-src` - Allow images from any HTTPS source, data URLs, and blobs
- `connect-src` - Allow API connections to same origin and localhost (dev)
- `frame-ancestors 'none'` - Prevent clickjacking by disallowing iframes
- `form-action 'self'` - Only allow form submissions to same origin

### Customizing CSP

To add additional trusted sources, update the CSP meta tag in `index.html`:

```html
<!-- Example: Allow analytics scripts -->
<meta
  http-equiv="Content-Security-Policy"
  content="script-src 'self' 'unsafe-inline' https://analytics.example.com;"
/>
```

## CSRF Protection

Cross-Site Request Forgery protection is implemented using CSRF tokens.

### How It Works

1. On app initialization, a CSRF token is fetched from the backend
2. The token is stored in localStorage and memory
3. All state-changing requests (POST, PUT, PATCH, DELETE) include the token in headers
4. The backend validates the token before processing requests

### Automatic Integration

CSRF protection is automatically integrated into the NestJS client:

```javascript
// App.jsx - CSRF is initialized on startup
useEffect(() => {
  const initSecurity = async () => {
    await nestjsClient.initializeCsrf();
  };
  initSecurity();
}, []);
```

### Manual CSRF Usage

For custom fetch requests outside the NestJS client:

```javascript
import { getCsrfHeaders } from '@/utils/csrf';

// In your API call
const headers = await getCsrfHeaders(baseURL);

fetch('/api/endpoint', {
  method: 'POST',
  headers: {
    ...headers,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(data),
});
```

### CSRF API Reference

```javascript
import {
  initializeCsrf,
  getCsrfToken,
  refreshCsrfToken,
  clearCsrfToken,
  getCsrfHeaders,
  isCsrfInitialized,
} from '@/utils/csrf';

// Initialize CSRF (called automatically in App.jsx)
await initializeCsrf('http://localhost:3000');

// Get current token
const token = await getCsrfToken();

// Refresh token (e.g., after 401 error)
const newToken = await refreshCsrfToken();

// Clear token (on logout)
clearCsrfToken();

// Get headers for fetch request
const headers = await getCsrfHeaders();

// Check if initialized
const isReady = isCsrfInitialized();
```

## XSS Prevention

XSS (Cross-Site Scripting) prevention is implemented through content sanitization.

### Sanitization Utilities

The app provides comprehensive sanitization utilities in `src/utils/sanitize.js`:

```javascript
import {
  sanitizeHtml,        // Sanitize HTML with default allowed tags
  sanitizeHtmlStrict,  // Strict sanitization (minimal tags)
  stripHtml,           // Remove all HTML tags
  sanitizeUrl,         // Validate and clean URLs
  sanitizeText,        // Escape HTML entities
  sanitizeObject,      // Sanitize object properties recursively
  createSafeHtml,      // Create React props object
} from '@/utils/sanitize';

// Examples
const clean = sanitizeHtml('<script>alert("xss")</script><p>Safe</p>');
// Result: '<p>Safe</p>'

const url = sanitizeUrl('javascript:alert("xss")');
// Result: '' (empty, blocked)

const safe = sanitizeUrl('https://example.com');
// Result: 'https://example.com'
```

### React Hooks

Use sanitization hooks in components:

```javascript
import {
  useSanitizeHtml,
  useSanitizeHtmlStrict,
  useStripHtml,
  useSanitizeUrl,
  useSafeHtml,
} from '@/hooks/useSanitize';

function Comment({ content }) {
  const safeContent = useSanitizeHtml(content);

  return <div dangerouslySetInnerHTML={{ __html: safeContent }} />;
}

function Link({ href, children }) {
  const safeUrl = useSanitizeUrl(href);

  return <a href={safeUrl} target="_blank" rel="noopener noreferrer">{children}</a>;
}
```

### Safe Components

Pre-built components for common use cases:

```javascript
import {
  SafeHtml,
  SafeText,
  SafeLink,
  SafeImage,
  SafeUserContent,
  SafeRichText,
} from '@/components/common/SafeContent';

// Render user comment with automatic sanitization
<SafeUserContent
  content={comment.text}
  author={comment.author}
  timestamp={comment.createdAt}
  avatar={comment.authorAvatar}
/>

// Render sanitized HTML
<SafeHtml html={userGeneratedHtml} />

// Render sanitized link
<SafeLink href={userProvidedUrl}>Visit Website</SafeLink>

// Render safe image with fallback
<SafeImage src={userAvatar} alt="User avatar" />
```

## Usage Examples

### Example 1: Displaying User Comments

```javascript
import { SafeUserContent } from '@/components/common/SafeContent';

function CommentList({ comments }) {
  return (
    <div>
      {comments.map((comment) => (
        <SafeUserContent
          key={comment.id}
          content={comment.text}
          author={comment.author}
          timestamp={comment.createdAt}
          avatar={comment.authorAvatar}
        />
      ))}
    </div>
  );
}
```

### Example 2: Rich Text Editor Output

```javascript
import { SafeRichText } from '@/components/common/SafeContent';

function ArticleContent({ article }) {
  return (
    <article>
      <h1>{article.title}</h1>
      <SafeRichText html={article.content} />
    </article>
  );
}
```

### Example 3: User Profile with Links

```javascript
import { SafeLink, SafeImage } from '@/components/common/SafeContent';
import { useSanitizeHtml } from '@/hooks/useSanitize';

function UserProfile({ user }) {
  const safeBio = useSanitizeHtml(user.bio);

  return (
    <div>
      <SafeImage src={user.avatar} alt={user.name} />
      <h2>{user.name}</h2>
      <div dangerouslySetInnerHTML={{ __html: safeBio }} />
      <SafeLink href={user.website}>Visit Website</SafeLink>
    </div>
  );
}
```

### Example 4: Form Submission with CSRF

```javascript
import nestjsClient from '@/api/nestjsClient';

async function submitForm(formData) {
  try {
    // CSRF token is automatically included
    const result = await nestjsClient.post('/api/forms/submit', formData);
    return result;
  } catch (error) {
    console.error('Form submission failed:', error);
    throw error;
  }
}
```

## Best Practices

### Always Sanitize User Input

```javascript
// BAD - Dangerous!
<div dangerouslySetInnerHTML={{ __html: userInput }} />

// GOOD - Safe
import { SafeHtml } from '@/components/common/SafeContent';
<SafeHtml html={userInput} />

// OR
import { useSanitizeHtml } from '@/hooks/useSanitize';
const safe = useSanitizeHtml(userInput);
<div dangerouslySetInnerHTML={{ __html: safe }} />
```

### Validate URLs

```javascript
// BAD - Could be javascript:alert('xss')
<a href={userProvidedUrl}>Link</a>

// GOOD - Validated and sanitized
import { SafeLink } from '@/components/common/SafeContent';
<SafeLink href={userProvidedUrl}>Link</SafeLink>
```

### Use Strict Mode When Possible

```javascript
// For untrusted content with minimal formatting needs
import { useSanitizeHtmlStrict } from '@/hooks/useSanitize';
const safeText = useSanitizeHtmlStrict(userInput);
```

### CSRF Token Lifecycle

```javascript
// On login - CSRF is already initialized
await nestjsClient.auth.login(email, password);

// On logout - clear CSRF token
await nestjsClient.auth.logout();
// CSRF token is automatically cleared by clearTokens()

// On session expiry - refresh CSRF
try {
  await nestjsClient.post('/api/endpoint', data);
} catch (error) {
  if (error.message.includes('CSRF')) {
    await nestjsClient._fetchCsrfToken();
    // Retry request
  }
}
```

### CSP Violation Handling

Monitor CSP violations in production:

```javascript
// Add CSP violation reporting
window.addEventListener('securitypolicyviolation', (e) => {
  console.error('CSP Violation:', {
    blockedURI: e.blockedURI,
    violatedDirective: e.violatedDirective,
    originalPolicy: e.originalPolicy,
  });

  // Send to logging service
  // logService.error('CSP Violation', { ... });
});
```

### Security Checklist

Before deploying to production:

- [ ] CSP is properly configured for your domain
- [ ] CSRF protection is enabled and tested
- [ ] All user-generated content uses SafeContent components or sanitization hooks
- [ ] External links use SafeLink component with `rel="noopener noreferrer"`
- [ ] Image sources are validated with SafeImage or useSanitizeUrl
- [ ] Forms use NestJS client (CSRF automatically included)
- [ ] File uploads validate file types and sanitize filenames
- [ ] URLs are sanitized before use in hrefs or src attributes
- [ ] Environment variables don't contain sensitive data
- [ ] Security headers are enabled on the backend

## Troubleshooting

### CSRF Token Errors

If you encounter CSRF token errors:

1. Check that CSRF is initialized in App.jsx
2. Verify the backend CSRF endpoint is accessible: `/api/security/csrf-token`
3. Check browser console for CSRF-related errors
4. Ensure cookies are enabled (CSRF uses cookies)
5. Clear localStorage and refresh

### CSP Violations

If resources are blocked by CSP:

1. Check browser console for CSP violation messages
2. Update CSP meta tag in index.html to allow the resource
3. Consider if the resource is truly needed and trusted
4. Use nonces or hashes for inline scripts in production

### Sanitization Issues

If content is over-sanitized:

1. Use less strict sanitization: `sanitizeHtml` instead of `sanitizeHtmlStrict`
2. Customize allowed tags: `sanitizeHtml(content, { ALLOWED_TAGS: ['p', 'a', 'strong'] })`
3. Review DOMPurify configuration in `src/utils/sanitize.js`

## Additional Resources

- [OWASP XSS Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html)
- [OWASP CSRF Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html)
- [CSP Guide](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [DOMPurify Documentation](https://github.com/cure53/DOMPurify)

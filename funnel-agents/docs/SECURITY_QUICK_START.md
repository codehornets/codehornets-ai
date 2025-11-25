# Security Quick Start Guide

## For Frontend Developers

### 1. Using Safe Components (Recommended)

```javascript
import { SafeUserContent, SafeLink, SafeImage } from '@/components/common/SafeContent';

// Display user-generated content
<SafeUserContent
  content={comment.text}
  author={comment.author}
  timestamp={comment.createdAt}
/>

// Display external links
<SafeLink href={userProvidedUrl}>Visit Website</SafeLink>

// Display images
<SafeImage src={userAvatar} alt="Avatar" />
```

### 2. Using Sanitization Hooks

```javascript
import { useSanitizeHtml, useSanitizeUrl } from '@/hooks/useSanitize';

function MyComponent({ content, url }) {
  const safeContent = useSanitizeHtml(content);
  const safeUrl = useSanitizeUrl(url);

  return (
    <div>
      <div dangerouslySetInnerHTML={{ __html: safeContent }} />
      <a href={safeUrl}>Link</a>
    </div>
  );
}
```

### 3. Making API Calls with CSRF

```javascript
import nestjsClient from '@/api/nestjsClient';

// CSRF is automatic with nestjsClient
async function saveData(formData) {
  const result = await nestjsClient.post('/api/endpoint', formData);
  return result;
}

// For custom fetch (manual CSRF)
import { getCsrfHeaders } from '@/utils/csrf';

async function customFetch() {
  const headers = await getCsrfHeaders();
  const response = await fetch('/api/endpoint', {
    method: 'POST',
    headers: {
      ...headers,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
}
```

### 4. Quick Rules

**DO:**
- ✔ Always use `SafeContent` components for user-generated content
- ✔ Use sanitization hooks when you need custom rendering
- ✔ Use `nestjsClient` for all API calls (CSRF automatic)
- ✔ Validate URLs before using in `href` or `src`

**DON'T:**
- ✖ Never use `dangerouslySetInnerHTML` without sanitization
- ✖ Never trust user input directly in URLs
- ✖ Don't bypass CSRF protection
- ✖ Don't disable CSP without security review

## For Backend Developers

### 1. CSRF is Automatic

CSRF protection is automatically applied to all POST, PUT, PATCH, DELETE requests.

No action needed unless you want to exempt a route:

```typescript
// Exempting webhooks from CSRF
// Already configured in main.ts for /webhooks routes
```

### 2. Adding New Routes

New routes automatically get:
- ✔ Security headers (Helmet)
- ✔ CSRF validation
- ✔ CORS validation
- ✔ Input validation (ValidationPipe)

Just create your controller as normal:

```typescript
@Controller('my-entity')
export class MyController {
  @Post()
  async create(@Body() dto: CreateDto) {
    // CSRF and headers already applied
    return this.service.create(dto);
  }
}
```

### 3. Customizing CORS

Add allowed origins to `.env`:

```bash
CORS_ORIGINS=https://app.example.com,https://admin.example.com
```

### 4. Security Headers

Already configured in `main.ts`. To customize:

```typescript
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        // Add your custom directives
      },
    },
  })
);
```

## Common Issues & Solutions

### Frontend

**Issue**: "CSRF token missing"
- **Solution**: Ensure `nestjsClient.initializeCsrf()` is called in App.jsx

**Issue**: Content over-sanitized
- **Solution**: Use `sanitizeHtml` instead of `sanitizeHtmlStrict`

**Issue**: CSP blocking resource
- **Solution**: Add trusted source to CSP meta tag in `index.html`

### Backend

**Issue**: CORS blocking requests
- **Solution**: Add origin to `CORS_ORIGINS` environment variable

**Issue**: CSRF validation failing
- **Solution**: Check that cookie-parser is initialized before CSRF middleware

**Issue**: Webhook failing CSRF
- **Solution**: Webhooks are exempt if path contains `/webhooks`

## Testing Your Changes

### Test CSRF Protection

```bash
# Frontend should automatically include CSRF token
# Test by making a POST request without token - should fail
```

### Test Sanitization

```javascript
import { sanitizeHtml } from '@/utils/sanitize';

const malicious = '<script>alert("xss")</script><p>Safe</p>';
console.log(sanitizeHtml(malicious)); // Should output: '<p>Safe</p>'
```

### Test Security Headers

```bash
curl -I http://localhost:3000/api/health
# Should include X-Content-Type-Options, X-Frame-Options, etc.
```

## Need More Help?

- **Frontend Details**: See `apps/web-ui/SECURITY.md`
- **Backend Details**: See `apps/api-gateway/SECURITY.md`
- **Full Report**: See `SECURITY_IMPLEMENTATION_REPORT.md`

## Security Checklist

Before merging your PR:

- [ ] All user-generated content uses `SafeContent` components or hooks
- [ ] External URLs are validated with `sanitizeUrl` or `SafeLink`
- [ ] API calls use `nestjsClient` (or manually include CSRF headers)
- [ ] No `dangerouslySetInnerHTML` without sanitization
- [ ] New API routes have proper validation DTOs
- [ ] Tested with malicious input (XSS attempts)
- [ ] CSRF token included in state-changing requests

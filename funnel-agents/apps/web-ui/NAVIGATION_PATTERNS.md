# Navigation Patterns - Quick Reference

## When to Use Each Pattern

### 1. Internal Page Navigation (Sidebar, Menu Items)
Use `Link` component from react-router-dom with `createPageUrl()`:

```jsx
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

<Link to={createPageUrl('Dashboard')}>
  Dashboard
</Link>
```

### 2. Programmatic Navigation (onClick, After Form Submit)
Use `useNavigate` hook with `createPageUrl()`:

```jsx
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const navigate = useNavigate();

// Simple navigation
navigate(createPageUrl('Agents'));

// With query parameters
navigate(createPageUrl('AgentDetail') + `?id=${agentId}`);

// With hash
navigate(createPageUrl('Settings') + '?tab=billing#payment');
```

### 3. User Dropdown Actions
Use `onClick` with `navigate`:

```jsx
<DropdownMenuItem onClick={() => navigate(createPageUrl('Profile'))}>
  Profile
</DropdownMenuItem>
```

### 4. Logout Action
Always clear tokens and redirect:

```jsx
<DropdownMenuItem
  onClick={async () => {
    try {
      await client.auth.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user_data');
      navigate('/login');
    }
  }}
>
  Logout
</DropdownMenuItem>
```

### 5. Table Row Navigation
Use `onClick` handler with navigate:

```jsx
const handleRowClick = (e) => {
  // Prevent navigation when clicking buttons
  if (e.target.closest('button')) return;
  navigate(createPageUrl('LeadDetail') + `?id=${lead.id}`);
};

<TableRow onClick={handleRowClick} className="cursor-pointer">
  {/* ... */}
</TableRow>
```

### 6. External Links
Use regular `<a>` tag with `target="_blank"`:

```jsx
<a 
  href="https://example.com" 
  target="_blank" 
  rel="noopener noreferrer"
>
  External Link
</a>
```

## Available Page Names

Use these exact names with `createPageUrl()`:

```typescript
// Core
'Dashboard'
'Profile'
'Settings'

// Workspace
'Workspaces'      // Clients
'Projects'        // Campaigns
'Boards'
'ContentLibrary'

// CRM
'Leads'
'LeadDetail'
'Contacts'
'ContactDetail'
'Deals'
'DealDetail'

// AI & Automation
'Agents'
'AgentDetail'
'AgentTemplates'
'AgentPerformanceHub'
'Tasks'
'Workflows'      // Automations
'WorkflowBuilder'

// System
'Analytics'      // Reports
'Integrations'
'AdminPanel'

// Auth (don't use createPageUrl for these)
'/login'
'/signup'
'/forgot-password'
'/reset-password'
```

## Common Patterns

### Navigation with State
```jsx
navigate(createPageUrl('AgentDetail'), { 
  state: { from: 'dashboard' } 
});
```

### Replace History (No Back Button)
```jsx
navigate(createPageUrl('Dashboard'), { replace: true });
```

### Navigate After API Call
```jsx
const createAgent = async (data) => {
  const response = await client.entities.Agent.create(data);
  navigate(createPageUrl('AgentDetail') + `?id=${response.id}`);
};
```

### Conditional Navigation
```jsx
const handleAction = () => {
  if (isCompleted) {
    navigate(createPageUrl('Dashboard'));
  } else {
    navigate(createPageUrl('Tasks'));
  }
};
```

## Mobile Menu Considerations

Always close mobile menu on navigation:

```jsx
<Link
  to={createPageUrl('Dashboard')}
  onClick={() => setMobileMenuOpen(false)}
>
  Dashboard
</Link>
```

## Accessibility

### Icon-Only Buttons
```jsx
<Button
  onClick={() => navigate(createPageUrl('Settings'))}
  aria-label="Open settings"
>
  <Settings className="w-5 h-5" />
</Button>
```

### Keyboard Navigation
```jsx
<div
  role="button"
  tabIndex={0}
  onClick={() => navigate(createPageUrl('Details'))}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      navigate(createPageUrl('Details'));
    }
  }}
>
  Click or press Enter
</div>
```

## Anti-Patterns (Don't Do This)

### ❌ Hardcoded Paths
```jsx
// DON'T
navigate('/agents')
<Link to="/dashboard">Dashboard</Link>
```

### ❌ Placeholder Links
```jsx
// DON'T
<a href="#">Click Here</a>
<Link to="#">Menu Item</Link>
```

### ❌ Full Page Reload
```jsx
// DON'T
window.location.href = '/dashboard'
```

### ❌ Missing Mobile Menu Close
```jsx
// DON'T (on mobile menus)
<Link to={createPageUrl('Dashboard')}>
  {/* Missing onClick to close menu */}
</Link>
```

## Best Practices

1. Always use `createPageUrl()` for internal navigation
2. Use `Link` for static navigation, `navigate` for dynamic
3. Close mobile menus on navigation
4. Prevent default on keyboard events
5. Add aria-labels to icon-only buttons
6. Use semantic HTML (button for actions, a for links)
7. Clear tokens on logout before redirecting
8. Stop event propagation when needed (e.g., dropdowns)

---
Generated with Claude Code - Frontend Developer Agent

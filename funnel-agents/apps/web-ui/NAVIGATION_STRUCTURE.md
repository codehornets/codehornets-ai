# Navigation Structure - FunnelAgents Web UI

## Overview
All navigation links in the Layout component are properly configured using React Router v6 patterns.

## Layout Component Architecture

```
Layout.jsx
├── Sidebar Navigation (Collapsible)
│   ├── Logo Section
│   │   └── FunnelAgents Brand
│   │
│   ├── Navigation Sections (Permission-Filtered)
│   │   │
│   │   ├── WORKSPACE
│   │   │   ├── Dashboard (/Dashboard)
│   │   │   ├── Clients (/Workspaces)
│   │   │   ├── Campaigns (/Projects)
│   │   │   ├── Boards (/Boards)
│   │   │   └── Content Library (/ContentLibrary)
│   │   │
│   │   ├── CRM
│   │   │   ├── Leads (/Leads)
│   │   │   ├── Contacts (/Contacts)
│   │   │   └── Deals (/Deals)
│   │   │
│   │   ├── AI & AUTOMATION
│   │   │   ├── Agents (/Agents)
│   │   │   ├── Performance Hub (/AgentPerformanceHub)
│   │   │   ├── Tasks (/Tasks)
│   │   │   └── Automations (/Workflows)
│   │   │
│   │   ├── INSIGHTS & SYSTEM
│   │   │   ├── Reports (/Analytics)
│   │   │   ├── Integrations (/Integrations)
│   │   │   └── Settings (/Settings)
│   │   │
│   │   └── ADMIN (Role: admin only)
│   │       └── Admin Panel (/AdminPanel)
│   │
│   └── User Section (Bottom)
│       └── User Dropdown Menu
│           ├── Profile (/Profile)
│           ├── Billing (/Settings?tab=billing)
│           └── Logout (→ /login)
│
├── Top Bar
│   ├── Mobile Menu Toggle
│   ├── Search Bar
│   ├── Theme Toggle (Dark/Light)
│   ├── Notification Center
│   └── Collaboration Notifications
│
└── Main Content Area
    └── {children}
```

## Landing Page Footer

```
Landing.jsx
└── Footer
    ├── Brand Logo & Copyright
    └── Links
        ├── Documentation (https://docs.funnelagents.com)
        ├── API (${VITE_API_URL}/api-docs)
        └── Support (mailto:support@funnelagents.com)
```

## Navigation Implementation Patterns

### 1. Sidebar Links (Internal Routes)
```jsx
<Link
  to={createPageUrl('Dashboard')}
  className="flex items-center px-3 py-2 rounded-lg"
>
  <Icon className="w-5 h-5" />
  <span>Dashboard</span>
</Link>
```

### 2. Programmatic Navigation
```jsx
onClick={() => navigate(createPageUrl('Profile'))}
```

### 3. External Links
```jsx
<a
  href="https://docs.funnelagents.com"
  target="_blank"
  rel="noopener noreferrer"
>
  Documentation
</a>
```

## Route Mapping

| Display Name       | Route Path               | Page Component        |
|-------------------|-------------------------|-----------------------|
| Dashboard         | /Dashboard              | Dashboard.jsx         |
| Clients           | /Workspaces             | Workspaces.jsx        |
| Campaigns         | /Projects               | Projects.jsx          |
| Boards            | /Boards                 | Boards.jsx            |
| Content Library   | /ContentLibrary         | ContentLibrary.jsx    |
| Leads             | /Leads                  | Leads.jsx             |
| Contacts          | /Contacts               | Contacts.jsx          |
| Deals             | /Deals                  | Deals.jsx             |
| Agents            | /Agents                 | Agents.jsx            |
| Performance Hub   | /AgentPerformanceHub    | AgentPerformanceHub.jsx|
| Tasks             | /Tasks                  | Tasks.jsx             |
| Automations       | /Workflows              | Workflows.jsx         |
| Reports           | /Analytics              | Analytics.jsx         |
| Integrations      | /Integrations           | Integrations.jsx      |
| Settings          | /Settings               | Settings.jsx          |
| Admin Panel       | /AdminPanel             | AdminPanel.jsx        |
| Profile           | /Profile                | Profile.jsx           |

## Permission System

Navigation items are filtered based on user permissions:

```javascript
const isModuleAllowed = (pageName) => {
  if (user?.role === 'admin') return true;
  if (!userPermissions) return true;
  const moduleName = moduleMapping[pageName] || pageName;
  return userPermissions.allowed_modules?.includes(moduleName) ?? true;
};
```

**Module Mapping:**
- Dashboard → Dashboard
- Clients → Workspaces
- Campaigns → Projects
- Boards → Boards
- Content Library → ContentLibrary
- Leads → Leads
- Contacts → Contacts
- Deals → Deals
- Agents → Agents
- Tasks → Tasks
- Automations → Workflows
- Reports → Analytics
- Integrations → Integrations
- Settings → Settings

## Responsive Behavior

### Desktop (≥1280px)
- Full sidebar visible (collapsible)
- All navigation items visible
- User section at bottom

### Tablet (768px - 1279px)
- Sidebar hidden by default
- Mobile menu overlay when opened
- Full navigation in overlay

### Mobile (<768px)
- Sidebar completely hidden
- Hamburger menu in top bar
- Full-screen navigation overlay
- Touch-optimized spacing

## Active Route Detection

```javascript
const isActive = (href) => {
  const pageName = href.split('?')[0].split('/').pop();
  return currentPageName === pageName;
};
```

Active routes receive:
- Background color highlight
- Accent color text
- Visual indicator

## Theme Support

Both light and dark modes supported:
- CSS custom properties for colors
- Automatic contrast adjustment
- Persistent theme selection
- Toggle in top bar

## Accessibility Features

- Semantic HTML (`<nav>`, `<a>`, `<button>`)
- ARIA labels and roles
- Keyboard navigation support
- Focus states on all interactive elements
- Proper heading hierarchy
- Screen reader friendly

## Security

- External links use `rel="noopener noreferrer"`
- CSRF protection on logout
- Token-based authentication
- Protected routes

## Mobile Menu State Management

```javascript
const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
```

- Opens with hamburger button
- Closes on link click
- Closes on overlay click
- Closes on X button click

## No Layout Pages

Certain pages bypass the Layout component:
- Landing
- Login
- Signup
- Onboarding

These pages render without sidebar/navigation for focused user experience.

## Verification Results

| Check                     | Result | Status |
|---------------------------|--------|--------|
| Placeholder links (#)     | 0      | PASS   |
| React Router imports      | Yes    | PASS   |
| createPageUrl usage       | 17     | PASS   |
| Mobile menu handlers      | Yes    | PASS   |
| Permission filtering      | Yes    | PASS   |
| Theme support            | Yes    | PASS   |
| Accessibility            | Yes    | PASS   |

---

**Last Updated:** 2025-11-25
**Status:** All links verified and functional
**Framework:** React 18 + React Router v6

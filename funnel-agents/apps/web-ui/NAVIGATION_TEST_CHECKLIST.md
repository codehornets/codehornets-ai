# Navigation Testing Checklist

## Pre-Testing Setup
- [ ] Start dev server: `npm run dev`
- [ ] Open browser to http://localhost:5173
- [ ] Login with valid credentials
- [ ] Open browser DevTools Console (check for errors)
- [ ] Have mobile device or DevTools device emulation ready

---

## Sidebar Navigation Tests

### Desktop View
- [ ] All menu items are visible
- [ ] Click "Dashboard" - navigates to /Dashboard
- [ ] Click "Clients" - navigates to /Workspaces
- [ ] Click "Campaigns" - navigates to /Projects
- [ ] Click "Boards" - navigates to /Boards
- [ ] Click "Content Library" - navigates to /ContentLibrary
- [ ] Click "Leads" - navigates to /Leads
- [ ] Click "Contacts" - navigates to /Contacts
- [ ] Click "Deals" - navigates to /Deals
- [ ] Click "Agents" - navigates to /Agents
- [ ] Click "Performance Hub" - navigates to /AgentPerformanceHub
- [ ] Click "Tasks" - navigates to /Tasks
- [ ] Click "Automations" - navigates to /Workflows
- [ ] Click "Reports" - navigates to /Analytics
- [ ] Click "Integrations" - navigates to /Integrations
- [ ] Click "Settings" - navigates to /Settings
- [ ] If admin: Click "Admin Panel" - navigates to /AdminPanel

### Active State Highlighting
- [ ] Currently active page is highlighted in sidebar
- [ ] Only one menu item is highlighted at a time
- [ ] Highlight persists after page reload
- [ ] Highlight updates when navigating

### Sidebar Collapse/Expand
- [ ] Click collapse button - sidebar collapses to icon-only view
- [ ] Menu items still accessible in collapsed state
- [ ] Click expand button - sidebar expands to full view
- [ ] State persists across navigation

---

## Mobile Navigation Tests

### Mobile Menu
- [ ] Resize browser to mobile width (<1280px) or use device emulation
- [ ] Hamburger menu button is visible in header
- [ ] Click hamburger - sidebar slides in from left
- [ ] Dark overlay appears behind sidebar
- [ ] Click overlay - sidebar closes
- [ ] Click close button (X) - sidebar closes
- [ ] Click any menu item - sidebar closes and navigates

### Touch Interactions
- [ ] All buttons have adequate touch targets (44x44px minimum)
- [ ] No accidental clicks on adjacent items
- [ ] Smooth scrolling in menu

---

## User Menu Tests

### Dropdown Functionality
- [ ] User name and email displayed correctly
- [ ] Click user section - dropdown opens
- [ ] Click outside - dropdown closes
- [ ] Dropdown has proper z-index (appears above other content)

### Menu Options
- [ ] Click "Profile" - navigates to /Profile
- [ ] Click "Billing" - navigates to /Settings?tab=billing
- [ ] Click "Logout" - performs logout action:
  - [ ] Clears access_token from localStorage
  - [ ] Clears refresh_token from localStorage
  - [ ] Clears user_data from localStorage
  - [ ] Redirects to /login page
  - [ ] Cannot access protected routes after logout

---

## Theme Toggle Tests
- [ ] Click sun/moon icon in header
- [ ] Theme switches between dark and light
- [ ] Theme persists across navigation
- [ ] All colors update correctly
- [ ] No flash of wrong theme on page load

---

## Query Parameter Tests

### Navigation with Parameters
- [ ] Navigate to /AgentDetail?id=1 - loads correct agent
- [ ] Navigate to /Settings?tab=billing - opens billing tab
- [ ] Navigate to /Tasks?status=completed - filters tasks
- [ ] Navigate to /ClientWorkspace?id=123&tab=projects - loads correct workspace and tab

### Parameter Persistence
- [ ] Navigate to page with params
- [ ] Click sidebar link to different page
- [ ] Use browser back button - parameters preserved
- [ ] Refresh page - parameters preserved

---

## Browser Navigation Tests

### Back/Forward Buttons
- [ ] Navigate through several pages
- [ ] Click browser back button - goes to previous page
- [ ] Active state updates correctly
- [ ] Click browser forward button - goes to next page
- [ ] Active state updates correctly

### Direct URL Access
- [ ] Type /Dashboard in URL bar - loads Dashboard
- [ ] Type /Agents in URL bar - loads Agents page
- [ ] Type /WorkflowBuilder?id=123 in URL bar - loads workflow builder with ID
- [ ] Type invalid URL - shows 404 page

### Refresh Behavior
- [ ] Navigate to any page
- [ ] Press F5 or Ctrl+R to refresh
- [ ] Page loads correctly
- [ ] User stays authenticated
- [ ] Active state is correct

---

## Command Palette Tests (if implemented)
- [ ] Press Cmd+K or Ctrl+K - opens command palette
- [ ] Type page name - shows suggestions
- [ ] Select suggestion - navigates to page
- [ ] Recent items shown
- [ ] Quick actions work

---

## Navigation from Components Tests

### Cards and Buttons
- [ ] Dashboard: Click agent card - navigates to agent detail
- [ ] Dashboard: Click task card - navigates to task detail
- [ ] Agents page: Click "View Details" - navigates to agent detail
- [ ] Workflows page: Click "Edit" - navigates to workflow builder
- [ ] Projects page: Click campaign card - navigates to campaign detail

### Activity Feeds
- [ ] Click activity item - navigates to related page
- [ ] Click "View All" buttons - navigates with filters

### Breadcrumbs (if implemented)
- [ ] Breadcrumb trail shows current location
- [ ] Click breadcrumb link - navigates to parent page

---

## Permission-Based Navigation Tests

### Admin User
- [ ] Login as admin
- [ ] All menu items visible
- [ ] Admin Panel link visible
- [ ] Can access all routes

### Regular User
- [ ] Login as regular user
- [ ] Only allowed modules visible in menu
- [ ] Cannot access restricted routes
- [ ] Appropriate error message if trying to access restricted route

### Guest/Unauthenticated
- [ ] Logout completely
- [ ] Try to access /Dashboard - redirects to /login
- [ ] Try to access /Agents - redirects to /login
- [ ] Can access /login and /signup

---

## Performance Tests

### Navigation Speed
- [ ] Navigation between pages is instant (no page reload)
- [ ] No visible lag when clicking menu items
- [ ] Content loads progressively (skeleton screens if slow)

### Memory Leaks
- [ ] Navigate through multiple pages
- [ ] Check DevTools Memory tab
- [ ] Memory usage should be stable (not continuously increasing)

---

## Accessibility Tests

### Keyboard Navigation
- [ ] Tab through sidebar menu items
- [ ] Enter key activates menu item
- [ ] Tab through user dropdown menu
- [ ] Escape key closes dropdowns
- [ ] Focus visible on all interactive elements

### Screen Reader
- [ ] Menu items announced correctly
- [ ] Active state announced
- [ ] Dropdown state changes announced
- [ ] Page title updates on navigation

---

## Cross-Browser Tests

### Desktop Browsers
- [ ] Chrome/Edge (Chromium)
- [ ] Firefox
- [ ] Safari (if on Mac)

### Mobile Browsers
- [ ] Chrome Mobile
- [ ] Safari iOS
- [ ] Samsung Internet

---

## Error Scenarios

### Network Errors
- [ ] Navigate while offline - shows appropriate error
- [ ] Navigate when API is down - shows error but navigation works

### Invalid Routes
- [ ] Type /invalid-page - shows 404 page
- [ ] 404 page has link to return to dashboard
- [ ] Invalid query params don't break page

---

## Final Verification

### Console Errors
- [ ] No JavaScript errors in console
- [ ] No React warnings in console
- [ ] No 404 errors for routes

### Visual Issues
- [ ] No layout shifts when navigating
- [ ] No flickering or flash of content
- [ ] Smooth transitions (if implemented)
- [ ] All icons and images load correctly

---

## Sign-Off

- [ ] All critical navigation paths tested
- [ ] All issues documented and reported
- [ ] Screenshots/recordings captured for any bugs
- [ ] Ready for production deployment

**Tested by:** _________________
**Date:** _________________
**Browser/Device:** _________________
**Issues Found:** _________________

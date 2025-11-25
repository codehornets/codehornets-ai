import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { createPageUrl } from './utils';
import { 
  LayoutDashboard, Users, CheckSquare, GitBranch, BarChart3, 
  Plug, Settings, Menu, X, Search, Moon, Sun,
  ChevronDown, LogOut, User, CreditCard, Bot, Shield, Presentation
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import client from '@/api/client';
import CollaborationNotifications from '@/components/notifications/CollaborationNotifications';
import NotificationCenter from '@/components/notifications/NotificationCenter';

export default function Layout({ children, currentPageName }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [user, setUser] = useState(null);
  const [userPermissions, setUserPermissions] = useState(null);
  const _location = useLocation();
  const navigate = useNavigate();

  // Hide layout for landing, auth, and onboarding pages
  const noLayoutPages = ['Landing', 'Onboarding', 'Login', 'Signup'];
  const hideLayout = noLayoutPages.includes(currentPageName);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await client.auth.me();
        setUser(currentUser);
        
        // Load user permissions
        if (currentUser.role !== 'admin') {
          try {
            const permissions = await client.entities.UserPermission.filter({ user_email: currentUser.email });
            if (permissions.length > 0) {
              setUserPermissions(permissions[0]);
            }
          } catch (error) {
            console.error('Failed to load permissions:', error);
          }
        }
      } catch (error) {
        console.error('Failed to load user:', error);
      }
    };
    loadUser();
  }, []);

  const moduleMapping = {
    'Dashboard': 'Dashboard',
    'Clients': 'Workspaces',
    'Campaigns': 'Projects',
    'Boards': 'Boards',
    'Content Library': 'ContentLibrary',
    'Leads': 'Leads',
    'Contacts': 'Contacts',
    'Deals': 'Deals',
    'Agents': 'Agents',
    'Tasks': 'Tasks',
    'Automations': 'Workflows',
    'Reports': 'Analytics',
    'Integrations': 'Integrations',
    'Settings': 'Settings',
  };

  const isModuleAllowed = (pageName) => {
    if (user?.role === 'admin') return true;
    if (!userPermissions) return true;
    const moduleName = moduleMapping[pageName] || pageName;
    return userPermissions.allowed_modules?.includes(moduleName) ?? true;
  };

  const navigationSections = [
    {
      label: 'WORKSPACE',
      items: [
        { name: 'Dashboard', href: createPageUrl('Dashboard'), icon: LayoutDashboard },
        { name: 'Clients', href: createPageUrl('Workspaces'), icon: Users },
        { name: 'Campaigns', href: createPageUrl('Projects'), icon: CheckSquare },
        { name: 'Boards', href: createPageUrl('Boards'), icon: Presentation },
        { name: 'Content Library', href: createPageUrl('ContentLibrary'), icon: Menu },
      ].filter(item => isModuleAllowed(item.name))
    },
    {
      label: 'CRM',
      items: [
        { name: 'Leads', href: createPageUrl('Leads'), icon: Users },
        { name: 'Contacts', href: createPageUrl('Contacts'), icon: User },
        { name: 'Deals', href: createPageUrl('Deals'), icon: CreditCard },
      ].filter(item => isModuleAllowed(item.name))
    },
    {
      label: 'AI & AUTOMATION',
      items: [
        { name: 'Agents', href: createPageUrl('Agents'), icon: Bot },
        { name: 'Performance Hub', href: createPageUrl('AgentPerformanceHub'), icon: BarChart3 },
        { name: 'Tasks', href: createPageUrl('Tasks'), icon: CheckSquare },
        { name: 'Automations', href: createPageUrl('Workflows'), icon: GitBranch },
      ].filter(item => isModuleAllowed(item.name))
    },
    {
      label: 'INSIGHTS & SYSTEM',
      items: [
        { name: 'Reports', href: createPageUrl('Analytics'), icon: BarChart3 },
        { name: 'Integrations', href: createPageUrl('Integrations'), icon: Plug },
        { name: 'Settings', href: createPageUrl('Settings'), icon: Settings },
      ].filter(item => isModuleAllowed(item.name))
    },
    ...(user?.role === 'admin' ? [{
      label: 'ADMIN',
      items: [
        { name: 'Admin Panel', href: createPageUrl('AdminPanel'), icon: Shield },
      ]
    }] : [])
  ].filter(section => section.items.length > 0);

  const isActive = (href) => {
    const pageName = href.split('?')[0].split('/').pop();
    return currentPageName === pageName;
  };

  const toggleTheme = () => {
    setDarkMode(!darkMode);
  };

  // If it's a no-layout page, just return children
  if (hideLayout) {
    return <>{children}</>;
  }

  return (
    <div className={darkMode ? 'dark' : 'light'}>
      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 xl:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <style>{`
        * {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        }

        .light {
          --bg-app: #FAFBFC;
          --bg-surface: #FFFFFF;
          --bg-card: #FFFFFF;
          --bg-surface-hover: #F3F4F6;
          --bg-sidebar: #FFFFFF;
          --bg-header: #FFFFFF;
          --text-primary: #111827;
          --text-secondary: #4B5563;
          --text-muted: #9CA3AF;
          --border-subtle: #E5E7EB;
          --border-medium: #D1D5DB;
          --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
          --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          --accent: #2563EB;
        }

        .dark {
          --bg-app: #0F1117;
          --bg-surface: #1A1D29;
          --bg-card: #1F2937;
          --bg-surface-hover: #252A3A;
          --bg-sidebar: #1A1D29;
          --bg-header: #1A1D29;
          --text-primary: #F9FAFB;
          --text-secondary: #D1D5DB;
          --text-muted: #9CA3AF;
          --border-subtle: #374151;
          --border-medium: #4B5563;
          --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.3);
          --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.5);
          --accent: #3B82F6;
        }
      `}</style>

      <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-app)' }}>
        {/* Sidebar */}
        <aside className={`fixed inset-y-0 left-0 z-50 transition-all duration-300 ease-in-out
          ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full xl:translate-x-0'}
          ${sidebarOpen ? 'w-64' : 'w-64 xl:w-20'}`}>
          <div className="h-full flex flex-col" style={{ 
            backgroundColor: 'var(--bg-sidebar)', 
            borderRight: '1px solid var(--border-subtle)'
          }}>
            {/* Logo */}
            <div className="h-16 flex items-center justify-between px-4" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
              {sidebarOpen && (
                <div className="flex items-center space-x-2">
                  <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
                    <span className="text-white font-bold text-sm">F</span>
                  </div>
                  <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>FunnelAgents</span>
                </div>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                style={{ color: 'var(--text-muted)' }}
                className="hover:bg-[var(--bg-surface-hover)] hidden xl:flex"
              >
                <Menu className="w-5 h-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileMenuOpen(false)}
                style={{ color: 'var(--text-muted)' }}
                className="hover:bg-[var(--bg-surface-hover)] xl:hidden"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-3 py-3 overflow-y-auto">
              {navigationSections.map((section, sectionIdx) => (
                <div key={section.label} className={sectionIdx > 0 ? 'mt-4' : ''}>
                  {sidebarOpen && (
                    <div className="px-3 mb-1.5">
                      <span className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                        {section.label}
                      </span>
                    </div>
                  )}
                  <div className="space-y-0.5">
                    {section.items.map((item) => {
                      const Icon = item.icon;
                      const active = isActive(item.href);
                      return (
                        <Link
                          key={item.name}
                          to={item.href}
                          onClick={() => setMobileMenuOpen(false)}
                          className={`flex items-center ${sidebarOpen ? 'px-3' : 'justify-center xl:justify-center'} py-2 rounded-lg transition-all group px-3`}
                          style={{
                            backgroundColor: active ? (darkMode ? 'rgba(255,255,255,0.1)' : '#EFF6FF') : 'transparent',
                            color: active ? 'var(--accent)' : 'var(--text-secondary)'
                          }}
                          onMouseEnter={(e) => !active && (e.currentTarget.style.backgroundColor = 'var(--bg-surface-hover)')}
                          onMouseLeave={(e) => !active && (e.currentTarget.style.backgroundColor = 'transparent')}
                        >
                          <Icon className="w-5 h-5" />
                          {sidebarOpen && (
                            <span className="ml-3 font-medium text-sm">{item.name}</span>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </nav>

            {/* User Section */}
            {sidebarOpen && user && (
              <div className="p-3" style={{ borderTop: '1px solid var(--border-subtle)' }}>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="w-full flex items-center space-x-3 p-2 rounded-lg transition-colors hover:bg-[var(--bg-surface-hover)]">
                      <div className="flex-1 text-left min-w-0">
                        <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{user.full_name}</p>
                        <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{user.email}</p>
                      </div>
                      <ChevronDown className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--text-muted)' }} />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent 
                    align="end" 
                    className="w-56" 
                    style={{ 
                      backgroundColor: 'var(--bg-card)', 
                      border: '1px solid var(--border-medium)',
                      color: 'var(--text-primary)'
                    }}
                  >
                    <DropdownMenuLabel style={{ color: 'var(--text-primary)' }}>My Account</DropdownMenuLabel>
                    <DropdownMenuSeparator style={{ backgroundColor: 'var(--border-subtle)' }} />
                    <DropdownMenuItem 
                      onClick={() => navigate(createPageUrl('Profile'))}
                      className="cursor-pointer"
                      style={{ color: 'var(--text-primary)' }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-surface-hover)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <User className="w-4 h-4 mr-2" />
                      Profile
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => navigate(createPageUrl('Settings') + '?tab=billing')}
                      className="cursor-pointer"
                      style={{ color: 'var(--text-primary)' }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-surface-hover)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <CreditCard className="w-4 h-4 mr-2" />
                      Billing
                    </DropdownMenuItem>
                    <DropdownMenuSeparator style={{ backgroundColor: 'var(--border-subtle)' }} />
                    <DropdownMenuItem
                      onClick={async () => {
                        try {
                          await client.auth.logout();
                        } catch (error) {
                          console.error('Logout error:', error);
                        } finally {
                          // Clear tokens and redirect regardless of API call success
                          localStorage.removeItem('access_token');
                          localStorage.removeItem('refresh_token');
                          localStorage.removeItem('user_data');
                          navigate('/login');
                        }
                      }}
                      className="cursor-pointer"
                      style={{ color: 'var(--text-primary)' }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-surface-hover)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </div>
        </aside>

        {/* Main Content */}
        <div className={`transition-all duration-300 ${sidebarOpen ? 'xl:ml-64' : 'xl:ml-20'}`}>
          {/* Top Bar */}
          <header className="h-16 sticky top-0 z-40" style={{ 
            backgroundColor: 'var(--bg-header)', 
            borderBottom: '1px solid var(--border-subtle)' 
          }}>
            <div className="h-full px-4 md:px-6 flex items-center justify-between gap-2 md:gap-4">
              {/* Mobile Menu Button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileMenuOpen(true)}
                className="xl:hidden flex-shrink-0"
                style={{ color: 'var(--text-muted)' }}
              >
                <Menu className="w-5 h-5" />
              </Button>
              {/* Search */}
              <div className="flex-1 max-w-2xl hidden md:block">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                  <Input
                    placeholder="Search agents, tasks..."
                    className="pl-10"
                    style={{ 
                      backgroundColor: darkMode ? 'rgba(255,255,255,0.05)' : '#F9FAFB',
                      border: '1px solid var(--border-subtle)',
                      color: 'var(--text-primary)'
                    }}
                  />
                </div>
              </div>

              {/* Right Actions */}
              <div className="flex items-center space-x-1 md:space-x-3 flex-shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleTheme}
                  className="hover:bg-[var(--bg-surface-hover)] h-9 w-9 md:h-10 md:w-10"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {darkMode ? <Sun className="w-4 h-4 md:w-5 md:h-5" /> : <Moon className="w-4 h-4 md:w-5 md:h-5" />}
                </Button>
                <NotificationCenter />
                <CollaborationNotifications />
              </div>
            </div>
          </header>

          {/* Page Content */}
          <main className="p-4 md:p-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
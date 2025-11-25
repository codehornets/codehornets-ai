/**
 * Authentication Usage Examples
 *
 * This file demonstrates how to use the authentication system
 * in your components.
 */

import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

/**
 * Example 1: Display current user information
 */
export const UserProfile = () => {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div>Loading user data...</div>;
  }

  if (!isAuthenticated) {
    return <div>Please sign in to view your profile.</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>User Profile</CardTitle>
        <CardDescription>Your account information</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={user?.avatar_url} alt={user?.name} />
            <AvatarFallback>{user?.name?.[0]?.toUpperCase()}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold">{user?.name}</p>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
          </div>
        </div>

        {user?.company_name && (
          <div>
            <p className="text-sm font-medium">Company</p>
            <p className="text-sm text-muted-foreground">{user.company_name}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

/**
 * Example 2: Logout button
 */
export const LogoutButton = () => {
  const { logout, isLoading } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <Button
      variant="outline"
      onClick={handleLogout}
      disabled={isLoading}
    >
      {isLoading ? 'Signing out...' : 'Sign out'}
    </Button>
  );
};

/**
 * Example 3: Protected content that only shows for authenticated users
 */
export const ProtectedContent = () => {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="p-4 bg-primary/10 rounded-lg">
      <h3 className="font-semibold mb-2">Welcome, {user?.name}!</h3>
      <p className="text-sm text-muted-foreground">
        This content is only visible to authenticated users.
      </p>
    </div>
  );
};

/**
 * Example 4: Component that updates user data
 */
export const UpdateProfileForm = () => {
  const { user, updateUser } = useAuth();
  const [name, setName] = useState(user?.name || '');

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // Make API call to update user profile
      const response = await fetch(`${appParams.serverUrl}/api/users/profile`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('funnelagents_auth_token')}`
        },
        body: JSON.stringify({ name })
      });

      if (!response.ok) throw new Error('Update failed');

      const updatedUser = await response.json();

      // Update local user state
      updateUser(updatedUser);

      alert('Profile updated successfully!');
    } catch (error) {
      console.error('Profile update failed:', error);
      alert('Failed to update profile');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="name" className="text-sm font-medium">Name</label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full mt-1 px-3 py-2 border rounded-md"
        />
      </div>
      <Button type="submit">Update Profile</Button>
    </form>
  );
};

/**
 * Example 5: Check authentication in useEffect
 */
export const DataFetcher = () => {
  const { isAuthenticated, user } = useAuth();
  const [data, setData] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) return;

    // Fetch data only when authenticated
    const fetchData = async () => {
      try {
        const response = await fetch(`${appParams.serverUrl}/api/user-data`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('funnelagents_auth_token')}`
          }
        });

        const result = await response.json();
        setData(result);
      } catch (error) {
        console.error('Data fetch failed:', error);
      }
    };

    fetchData();
  }, [isAuthenticated, user?.id]);

  if (!isAuthenticated) {
    return <div>Please sign in to view data.</div>;
  }

  if (!data) {
    return <div>Loading data...</div>;
  }

  return (
    <div>
      <h3>Your Data</h3>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
};

/**
 * Example 6: Conditional rendering based on user role
 */
export const AdminPanel = () => {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated || user?.role !== 'admin') {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Admin Panel</CardTitle>
        <CardDescription>Administrative controls</CardDescription>
      </CardHeader>
      <CardContent>
        <p>Admin-only content and controls go here.</p>
      </CardContent>
    </Card>
  );
};

export default {
  UserProfile,
  LogoutButton,
  ProtectedContent,
  UpdateProfileForm,
  DataFetcher,
  AdminPanel
};

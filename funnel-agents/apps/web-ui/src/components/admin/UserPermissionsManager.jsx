import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import client from '@/api/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Shield, Eye, EyeOff, Save, X, 
  Search, Settings, CheckSquare 
} from 'lucide-react';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function UserPermissionsManager() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const queryClient = useQueryClient();

  const availableModules = [
    { id: 'Dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'Workspaces', label: 'Clients', icon: '👥' },
    { id: 'Projects', label: 'Campaigns', icon: '📋' },
    { id: 'Boards', label: 'Boards', icon: '🎨' },
    { id: 'ContentLibrary', label: 'Content Library', icon: '📚' },
    { id: 'Leads', label: 'Leads', icon: '🎯' },
    { id: 'Contacts', label: 'Contacts', icon: '👤' },
    { id: 'Deals', label: 'Deals', icon: '💰' },
    { id: 'Agents', label: 'Agents', icon: '🤖' },
    { id: 'Tasks', label: 'Tasks', icon: '✅' },
    { id: 'Workflows', label: 'Automations', icon: '⚡' },
    { id: 'Analytics', label: 'Reports', icon: '📈' },
    { id: 'Integrations', label: 'Integrations', icon: '🔌' },
    { id: 'Settings', label: 'Settings', icon: '⚙️' },
  ];

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => client.entities.User.list(),
    initialData: [],
  });

  const { data: permissions = [] } = useQuery({
    queryKey: ['permissions'],
    queryFn: () => client.entities.UserPermission.list(),
    initialData: [],
  });

  const createPermissionMutation = useMutation({
    mutationFn: (data) => client.entities.UserPermission.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['permissions'] });
      toast.success('Permissions updated');
      setEditModalOpen(false);
      setSelectedUser(null);
    },
  });

  const updatePermissionMutation = useMutation({
    mutationFn: ({ id, data }) => client.entities.UserPermission.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['permissions'] });
      toast.success('Permissions updated');
      setEditModalOpen(false);
      setSelectedUser(null);
    },
  });

  const deletePermissionMutation = useMutation({
    mutationFn: (id) => client.entities.UserPermission.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['permissions'] });
      toast.success('Permissions reset to default');
    },
  });

  const getUserPermission = (userEmail) => {
    return permissions.find(p => p.user_email === userEmail);
  };

  const handleEditUser = (user) => {
    const userPerm = getUserPermission(user.email);
    setSelectedUser({
      ...user,
      permission: userPerm || {
        user_email: user.email,
        role: 'user',
        allowed_modules: availableModules.map(m => m.id),
        custom_permissions: {}
      }
    });
    setEditModalOpen(true);
  };

  const handleSavePermissions = () => {
    if (!selectedUser) return;

    const permData = {
      user_email: selectedUser.email,
      role: selectedUser.permission.role,
      allowed_modules: selectedUser.permission.allowed_modules,
      custom_permissions: selectedUser.permission.custom_permissions
    };

    if (selectedUser.permission.id) {
      updatePermissionMutation.mutate({ id: selectedUser.permission.id, data: permData });
    } else {
      createPermissionMutation.mutate(permData);
    }
  };

  const toggleModule = (moduleId) => {
    setSelectedUser(prev => {
      const allowed = prev.permission.allowed_modules || [];
      const newAllowed = allowed.includes(moduleId)
        ? allowed.filter(m => m !== moduleId)
        : [...allowed, moduleId];
      
      return {
        ...prev,
        permission: {
          ...prev.permission,
          allowed_modules: newAllowed
        }
      };
    });
  };

  const togglePermission = (permKey) => {
    setSelectedUser(prev => ({
      ...prev,
      permission: {
        ...prev.permission,
        custom_permissions: {
          ...prev.permission.custom_permissions,
          [permKey]: !prev.permission.custom_permissions?.[permKey]
        }
      }
    }));
  };

  const filteredUsers = users.filter(u => 
    u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const roleColors = {
    admin: 'bg-purple-500/20 text-purple-400',
    manager: 'bg-blue-500/20 text-blue-400',
    user: 'bg-green-500/20 text-green-400',
    viewer: 'bg-slate-500/20 text-slate-400',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
            User Permissions
          </h2>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            Manage user roles and module access
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
        <Input
          placeholder="Search users..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
          style={{ 
            backgroundColor: 'var(--bg-surface)', 
            border: '1px solid var(--border-subtle)',
            color: 'var(--text-primary)'
          }}
        />
      </div>

      {/* Users List */}
      <div className="grid gap-4">
        {filteredUsers.map(user => {
          const userPerm = getUserPermission(user.email);
          const moduleCount = userPerm?.allowed_modules?.length || availableModules.length;
          
          return (
            <Card 
              key={user.id}
              className="p-4"
              style={{ 
                backgroundColor: 'var(--bg-card)', 
                border: '1px solid var(--border-subtle)' 
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4 flex-1">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold">
                    {user.full_name?.charAt(0)?.toUpperCase() || user.email.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
                        {user.full_name || user.email}
                      </p>
                      {user.role === 'admin' && (
                        <Badge className="bg-purple-500/20 text-purple-400 text-xs">
                          <Shield className="w-3 h-3 mr-1" />
                          Admin
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                      {user.email}
                    </p>
                    <div className="flex items-center space-x-2 mt-2">
                      <Badge className={`text-xs ${roleColors[userPerm?.role || 'user']}`}>
                        {userPerm?.role || 'user'}
                      </Badge>
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        {moduleCount}/{availableModules.length} modules
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {userPerm && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deletePermissionMutation.mutate(userPerm.id)}
                      style={{ color: 'var(--text-muted)' }}
                    >
                      Reset
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditUser(user)}
                    style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-primary)' }}
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Manage
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Edit Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="max-w-2xl" style={{ 
          backgroundColor: 'var(--bg-card)', 
          border: '1px solid var(--border-subtle)' 
        }}>
          <DialogHeader>
            <DialogTitle style={{ color: 'var(--text-primary)' }}>
              Manage Permissions
            </DialogTitle>
            <DialogDescription style={{ color: 'var(--text-secondary)' }}>
              {selectedUser?.full_name || selectedUser?.email}
            </DialogDescription>
          </DialogHeader>

          {selectedUser && (
            <div className="space-y-6">
              {/* Role Selection */}
              <div>
                <label className="text-sm font-medium mb-2 block" style={{ color: 'var(--text-primary)' }}>
                  Role
                </label>
                <Select 
                  value={selectedUser.permission.role} 
                  onValueChange={(value) => setSelectedUser(prev => ({
                    ...prev,
                    permission: { ...prev.permission, role: value }
                  }))}
                >
                  <SelectTrigger style={{ 
                    backgroundColor: 'var(--bg-surface)', 
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-primary)'
                  }}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
                    <SelectItem value="admin" style={{ color: 'var(--text-primary)' }}>Admin - Full Access</SelectItem>
                    <SelectItem value="manager" style={{ color: 'var(--text-primary)' }}>Manager - Most Features</SelectItem>
                    <SelectItem value="user" style={{ color: 'var(--text-primary)' }}>User - Standard Access</SelectItem>
                    <SelectItem value="viewer" style={{ color: 'var(--text-primary)' }}>Viewer - Read Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Module Access */}
              <div>
                <label className="text-sm font-medium mb-2 block" style={{ color: 'var(--text-primary)' }}>
                  Module Access
                </label>
                <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto p-2 rounded" style={{ backgroundColor: 'var(--bg-surface)' }}>
                  {availableModules.map(module => {
                    const isAllowed = selectedUser.permission.allowed_modules?.includes(module.id);
                    return (
                      <button
                        key={module.id}
                        onClick={() => toggleModule(module.id)}
                        className={`p-3 rounded-lg border transition-all text-left ${
                          isAllowed ? 'border-blue-500/50 bg-blue-500/10' : 'border-transparent'
                        }`}
                        style={{ 
                          backgroundColor: isAllowed ? undefined : 'var(--bg-card)',
                          borderColor: isAllowed ? undefined : 'var(--border-subtle)'
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <span>{module.icon}</span>
                            <span className="text-sm" style={{ color: 'var(--text-primary)' }}>
                              {module.label}
                            </span>
                          </div>
                          {isAllowed ? (
                            <Eye className="w-4 h-4 text-blue-400" />
                          ) : (
                            <EyeOff className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Custom Permissions */}
              <div>
                <label className="text-sm font-medium mb-2 block" style={{ color: 'var(--text-primary)' }}>
                  Custom Permissions
                </label>
                <div className="space-y-2">
                  {[
                    { key: 'can_create_campaigns', label: 'Create Campaigns' },
                    { key: 'can_delete_tasks', label: 'Delete Tasks' },
                    { key: 'can_manage_agents', label: 'Manage Agents' },
                    { key: 'can_view_analytics', label: 'View Analytics' },
                    { key: 'can_manage_workflows', label: 'Manage Workflows' },
                  ].map(perm => (
                    <button
                      key={perm.key}
                      onClick={() => togglePermission(perm.key)}
                      className="w-full p-3 rounded-lg flex items-center justify-between transition-all"
                      style={{ 
                        backgroundColor: 'var(--bg-surface)',
                        border: '1px solid var(--border-subtle)'
                      }}
                    >
                      <span className="text-sm" style={{ color: 'var(--text-primary)' }}>
                        {perm.label}
                      </span>
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                        selectedUser.permission.custom_permissions?.[perm.key]
                          ? 'bg-blue-500 border-blue-500'
                          : 'border-slate-600'
                      }`}>
                        {selectedUser.permission.custom_permissions?.[perm.key] && (
                          <CheckSquare className="w-3 h-3 text-white" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-2 pt-4" style={{ borderTop: '1px solid var(--border-subtle)' }}>
                <Button
                  variant="outline"
                  onClick={() => setEditModalOpen(false)}
                  style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-secondary)' }}
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
                <Button
                  onClick={handleSavePermissions}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
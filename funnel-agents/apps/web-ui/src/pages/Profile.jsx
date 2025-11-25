import { useState, useEffect } from 'react';
import client from '@/api/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User, Mail, Shield, Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function Profile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
  });

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await client.auth.me();
        setUser(currentUser);
        setFormData({
          full_name: currentUser.full_name || '',
          email: currentUser.email || '',
        });
      } catch (error) {
        toast.error('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };
    loadUser();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await client.auth.updateMe({ full_name: formData.full_name });
      const updatedUser = await client.auth.me();
      setUser(updatedUser);
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Profile</h1>
        <p className="text-slate-400 mt-1">Manage your account settings</p>
      </div>

      {/* Profile Card */}
      <Card className="glassmorphism-light border-slate-800/50 p-6">
        <div className="flex items-center space-x-4 mb-6 pb-6 border-b border-slate-800">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
            <span className="text-white text-2xl font-semibold">
              {formData.full_name?.charAt(0)?.toUpperCase() || 'U'}
            </span>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-white">{formData.full_name}</h2>
            <p className="text-slate-400">{formData.email}</p>
            {user?.role === 'admin' && (
              <div className="flex items-center space-x-2 mt-2">
                <Shield className="w-4 h-4 text-blue-400" />
                <span className="text-xs text-blue-400 font-medium uppercase">Admin</span>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <Label className="text-slate-300">Full Name</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                className="pl-10 bg-slate-800/50 border-slate-700 text-white"
                placeholder="Enter your full name"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-slate-300">Email Address</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                value={formData.email}
                disabled
                className="pl-10 bg-slate-900/50 border-slate-700 text-slate-500 cursor-not-allowed"
              />
            </div>
            <p className="text-xs text-slate-500">Email cannot be changed</p>
          </div>

          <div className="space-y-2">
            <Label className="text-slate-300">Role</Label>
            <div className="relative">
              <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                value={user?.role || 'user'}
                disabled
                className="pl-10 bg-slate-900/50 border-slate-700 text-slate-500 cursor-not-allowed capitalize"
              />
            </div>
          </div>

          <div className="flex items-center justify-end pt-4 border-t border-slate-800">
            <Button
              onClick={handleSave}
              disabled={saving || formData.full_name === user?.full_name}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </div>
      </Card>

      {/* Account Info */}
      <Card className="glassmorphism-light border-slate-800/50 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Account Information</h3>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between py-2 border-b border-slate-800">
            <span className="text-slate-400">Account Created</span>
            <span className="text-white">{new Date(user?.created_date).toLocaleDateString()}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-slate-800">
            <span className="text-slate-400">User ID</span>
            <span className="text-white font-mono text-xs">{user?.id}</span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-slate-400">Account Type</span>
            <span className="text-white capitalize">{user?.role}</span>
          </div>
        </div>
      </Card>
    </div>
  );
}
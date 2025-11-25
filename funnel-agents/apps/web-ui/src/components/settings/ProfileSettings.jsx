import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { User, Shield, Bell, Trash2, Save, Loader2, AlertCircle, Eye, EyeOff, Upload } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  useProfile,
  useUpdateProfile,
  useChangePassword,
  useSetup2FA,
  useVerify2FA,
  useDisable2FA,
  useUpdateNotificationPreferences,
  useDeleteAccount,
} from '@/hooks/useSettings';
import { toast } from 'sonner';

export default function ProfileSettings() {
  // Profile state
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    bio: '',
    avatar: '',
  });
  const [hasProfileChanges, setHasProfileChanges] = useState(false);

  // Password state
  const [passwordData, setPasswordData] = useState({
    current: '',
    new: '',
    confirm: '',
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [passwordError, setPasswordError] = useState('');

  // 2FA state
  const [twoFAModalOpen, setTwoFAModalOpen] = useState(false);
  const [twoFACode, setTwoFACode] = useState('');
  const [twoFAData, setTwoFAData] = useState(null);
  const [disable2FAModalOpen, setDisable2FAModalOpen] = useState(false);
  const [disable2FAPassword, setDisable2FAPassword] = useState('');

  // Notification preferences state
  const [notifications, setNotifications] = useState({
    email: {
      tasks: true,
      mentions: true,
      updates: true,
      marketing: false,
    },
    push: {
      tasks: true,
      mentions: true,
      updates: false,
    },
  });

  // Delete account state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteReason, setDeleteReason] = useState('');

  // Fetch data
  const { data: profileResponse, isLoading, error, refetch } = useProfile();

  // Mutations
  const updateProfileMutation = useUpdateProfile();
  const changePasswordMutation = useChangePassword();
  const setup2FAMutation = useSetup2FA();
  const verify2FAMutation = useVerify2FA();
  const disable2FAMutation = useDisable2FA();
  const updateNotificationsMutation = useUpdateNotificationPreferences();
  const deleteAccountMutation = useDeleteAccount();

  const profile = profileResponse?.profile || {};

  // Load profile data
  useEffect(() => {
    if (profile) {
      setProfileData({
        name: profile.name || '',
        email: profile.email || '',
        bio: profile.bio || '',
        avatar: profile.avatar || '',
      });
      if (profile.notificationPreferences) {
        setNotifications(profile.notificationPreferences);
      }
    }
  }, [profile]);

  // Handle profile update
  const handleProfileUpdate = async () => {
    try {
      await updateProfileMutation.mutateAsync(profileData);
      setHasProfileChanges(false);
    } catch (error) {
      // Error handled by mutation
    }
  };

  // Handle password change
  const handlePasswordChange = async () => {
    setPasswordError('');

    if (!passwordData.current || !passwordData.new || !passwordData.confirm) {
      setPasswordError('All fields are required');
      return;
    }

    if (passwordData.new.length < 8) {
      setPasswordError('New password must be at least 8 characters');
      return;
    }

    if (passwordData.new !== passwordData.confirm) {
      setPasswordError('New passwords do not match');
      return;
    }

    try {
      await changePasswordMutation.mutateAsync({
        currentPassword: passwordData.current,
        newPassword: passwordData.new,
      });
      setPasswordData({ current: '', new: '', confirm: '' });
    } catch (error) {
      // Error handled by mutation
    }
  };

  // Handle 2FA setup
  const handleSetup2FA = async () => {
    try {
      const result = await setup2FAMutation.mutateAsync();
      setTwoFAData(result);
      setTwoFAModalOpen(true);
    } catch (error) {
      // Error handled by mutation
    }
  };

  // Handle 2FA verification
  const handleVerify2FA = async () => {
    if (!twoFACode || twoFACode.length !== 6) {
      toast.error('Please enter a valid 6-digit code');
      return;
    }

    try {
      await verify2FAMutation.mutateAsync(twoFACode);
      setTwoFAModalOpen(false);
      setTwoFACode('');
      setTwoFAData(null);
      refetch();
    } catch (error) {
      // Error handled by mutation
    }
  };

  // Handle 2FA disable
  const handleDisable2FA = async () => {
    if (!disable2FAPassword) {
      toast.error('Password is required');
      return;
    }

    try {
      await disable2FAMutation.mutateAsync(disable2FAPassword);
      setDisable2FAModalOpen(false);
      setDisable2FAPassword('');
      refetch();
    } catch (error) {
      // Error handled by mutation
    }
  };

  // Handle notification preferences update
  const handleNotificationsUpdate = async () => {
    try {
      await updateNotificationsMutation.mutateAsync(notifications);
    } catch (error) {
      // Error handled by mutation
    }
  };

  // Handle account deletion
  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      toast.error('Password is required');
      return;
    }

    try {
      await deleteAccountMutation.mutateAsync({
        password: deletePassword,
        reason: deleteReason,
      });
    } catch (error) {
      // Error handled by mutation
    }
  };

  const getPasswordStrength = (password) => {
    if (!password) return { strength: 0, label: '', color: '' };
    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^a-zA-Z\d]/.test(password)) strength++;

    if (strength <= 2) return { strength: 25, label: 'Weak', color: 'bg-red-500' };
    if (strength === 3) return { strength: 50, label: 'Fair', color: 'bg-yellow-500' };
    if (strength === 4) return { strength: 75, label: 'Good', color: 'bg-blue-500' };
    return { strength: 100, label: 'Strong', color: 'bg-green-500' };
  };

  const passwordStrength = getPasswordStrength(passwordData.new);

  if (error) {
    return (
      <Card className="glassmorphism-light border-slate-800/50">
        <CardContent className="p-6">
          <div className="flex flex-col items-center justify-center space-y-4 py-8">
            <AlertCircle className="w-12 h-12 text-red-400" />
            <div className="text-center">
              <p className="text-lg font-medium text-slate-300">Failed to load profile</p>
              <p className="text-sm text-slate-400 mt-1">{error.message || 'An error occurred'}</p>
            </div>
            <Button onClick={() => refetch()} variant="outline" className="border-slate-700">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="glassmorphism-light border-slate-800/50">
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Profile Information */}
        <Card className="glassmorphism-light border-slate-800/50">
          <CardHeader className="border-b border-slate-800/50">
            <CardTitle className="flex items-center" style={{ color: 'var(--text-primary)' }}>
              <User className="w-5 h-5 mr-2 text-blue-400" />
              Profile Information
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-6">
              {/* Avatar */}
              <div className="space-y-2">
                <Label className="text-slate-300">Profile Picture</Label>
                <div className="flex items-center space-x-4">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                    {profileData.avatar ? (
                      <img src={profileData.avatar} alt="Avatar" className="w-full h-full rounded-full" />
                    ) : (
                      <span className="text-white font-medium text-2xl">
                        {profileData.name?.charAt(0)?.toUpperCase() || 'U'}
                      </span>
                    )}
                  </div>
                  <Button variant="outline" className="border-slate-700">
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Photo
                  </Button>
                </div>
              </div>

              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name" className="text-slate-300">Full Name</Label>
                <Input
                  id="name"
                  value={profileData.name}
                  onChange={(e) => {
                    setProfileData({ ...profileData, name: e.target.value });
                    setHasProfileChanges(true);
                  }}
                  className="bg-slate-800/50 border-slate-700 text-white"
                />
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-300">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={profileData.email}
                  disabled
                  className="bg-slate-800/50 border-slate-700 text-slate-500 cursor-not-allowed"
                />
                <p className="text-xs text-slate-500">
                  <a href="/Support" className="text-blue-500 hover:text-blue-600 transition-colors">
                    Contact support
                  </a> to change your email
                </p>
              </div>

              {/* Bio */}
              <div className="space-y-2">
                <Label htmlFor="bio" className="text-slate-300">Bio</Label>
                <Textarea
                  id="bio"
                  value={profileData.bio}
                  onChange={(e) => {
                    setProfileData({ ...profileData, bio: e.target.value });
                    setHasProfileChanges(true);
                  }}
                  rows={4}
                  className="bg-slate-800/50 border-slate-700 text-white"
                  placeholder="Tell us about yourself..."
                />
              </div>

              {/* Save Button */}
              <div className="flex items-center justify-between pt-4">
                {hasProfileChanges ? (
                  <p className="text-sm text-amber-400">You have unsaved changes</p>
                ) : (
                  <p className="text-sm text-slate-500">All changes saved</p>
                )}
                <Button
                  onClick={handleProfileUpdate}
                  disabled={!hasProfileChanges || updateProfileMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {updateProfileMutation.isPending ? (
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
          </CardContent>
        </Card>

        {/* Security */}
        <Card className="glassmorphism-light border-slate-800/50">
          <CardHeader className="border-b border-slate-800/50">
            <CardTitle className="flex items-center" style={{ color: 'var(--text-primary)' }}>
              <Shield className="w-5 h-5 mr-2 text-blue-400" />
              Security
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-6">
              {/* Change Password */}
              <div className="space-y-4">
                <h3 className="font-medium text-slate-300">Change Password</h3>

                <div className="space-y-2">
                  <Label htmlFor="currentPassword" className="text-slate-300">Current Password</Label>
                  <div className="relative">
                    <Input
                      id="currentPassword"
                      type={showPasswords.current ? 'text' : 'password'}
                      value={passwordData.current}
                      onChange={(e) => setPasswordData({ ...passwordData, current: e.target.value })}
                      className="bg-slate-800/50 border-slate-700 text-white pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                    >
                      {showPasswords.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newPassword" className="text-slate-300">New Password</Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showPasswords.new ? 'text' : 'password'}
                      value={passwordData.new}
                      onChange={(e) => {
                        setPasswordData({ ...passwordData, new: e.target.value });
                        setPasswordError('');
                      }}
                      className="bg-slate-800/50 border-slate-700 text-white pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                    >
                      {showPasswords.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {passwordData.new && (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400">Password strength:</span>
                        <span className={`font-medium ${
                          passwordStrength.label === 'Strong' ? 'text-green-400' :
                          passwordStrength.label === 'Good' ? 'text-blue-400' :
                          passwordStrength.label === 'Fair' ? 'text-yellow-400' :
                          'text-red-400'
                        }`}>{passwordStrength.label}</span>
                      </div>
                      <div className="h-1 w-full bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${passwordStrength.color} transition-all`}
                          style={{ width: `${passwordStrength.strength}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-slate-300">Confirm New Password</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showPasswords.confirm ? 'text' : 'password'}
                      value={passwordData.confirm}
                      onChange={(e) => {
                        setPasswordData({ ...passwordData, confirm: e.target.value });
                        setPasswordError('');
                      }}
                      className="bg-slate-800/50 border-slate-700 text-white pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                    >
                      {showPasswords.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {passwordError && (
                  <p className="text-sm text-red-400">{passwordError}</p>
                )}

                <Button
                  onClick={handlePasswordChange}
                  disabled={changePasswordMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {changePasswordMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Changing...
                    </>
                  ) : (
                    'Change Password'
                  )}
                </Button>
              </div>

              {/* Two-Factor Authentication */}
              <div className="pt-6 border-t border-slate-800/50">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-slate-300">Two-Factor Authentication</h3>
                    <p className="text-sm text-slate-400 mt-1">
                      {profile.has2FAEnabled ? 'Your account is protected with 2FA' : 'Add an extra layer of security'}
                    </p>
                  </div>
                  {profile.has2FAEnabled ? (
                    <Button
                      variant="outline"
                      onClick={() => setDisable2FAModalOpen(true)}
                      className="border-red-700 text-red-400 hover:bg-red-500/10"
                    >
                      Disable 2FA
                    </Button>
                  ) : (
                    <Button
                      onClick={handleSetup2FA}
                      disabled={setup2FAMutation.isPending}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {setup2FAMutation.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Setting up...
                        </>
                      ) : (
                        'Enable 2FA'
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notification Preferences */}
        <Card className="glassmorphism-light border-slate-800/50">
          <CardHeader className="border-b border-slate-800/50">
            <CardTitle className="flex items-center" style={{ color: 'var(--text-primary)' }}>
              <Bell className="w-5 h-5 mr-2 text-blue-400" />
              Notification Preferences
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-6">
              {/* Email Notifications */}
              <div className="space-y-4">
                <h3 className="font-medium text-slate-300">Email Notifications</h3>
                {Object.entries(notifications.email || {}).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-300 capitalize">{key}</p>
                      <p className="text-xs text-slate-500">Receive {key} updates via email</p>
                    </div>
                    <Switch
                      checked={value}
                      onCheckedChange={(checked) => {
                        setNotifications({
                          ...notifications,
                          email: { ...notifications.email, [key]: checked },
                        });
                      }}
                    />
                  </div>
                ))}
              </div>

              {/* Push Notifications */}
              <div className="space-y-4 pt-4 border-t border-slate-800/50">
                <h3 className="font-medium text-slate-300">Push Notifications</h3>
                {Object.entries(notifications.push || {}).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-300 capitalize">{key}</p>
                      <p className="text-xs text-slate-500">Receive {key} push notifications</p>
                    </div>
                    <Switch
                      checked={value}
                      onCheckedChange={(checked) => {
                        setNotifications({
                          ...notifications,
                          push: { ...notifications.push, [key]: checked },
                        });
                      }}
                    />
                  </div>
                ))}
              </div>

              <Button
                onClick={handleNotificationsUpdate}
                disabled={updateNotificationsMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {updateNotificationsMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Preferences'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Delete Account */}
        <Card className="glassmorphism-light border-red-800/30">
          <CardHeader className="border-b border-red-800/30">
            <CardTitle className="flex items-center text-red-400">
              <Trash2 className="w-5 h-5 mr-2" />
              Danger Zone
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-red-400">Delete Account</h3>
                <p className="text-sm text-slate-400 mt-1">
                  Permanently delete your account and all associated data. This action cannot be undone.
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => setDeleteModalOpen(true)}
                className="border-red-700 text-red-400 hover:bg-red-500/10"
              >
                Delete My Account
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 2FA Setup Modal */}
      <Dialog open={twoFAModalOpen} onOpenChange={setTwoFAModalOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Shield className="w-5 h-5 mr-2 text-blue-400" />
              Enable Two-Factor Authentication
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Scan the QR code with your authenticator app and enter the code
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {twoFAData?.qrCode && (
              <div className="flex justify-center p-4 bg-white rounded-lg">
                <img src={twoFAData.qrCode} alt="2FA QR Code" className="w-48 h-48" />
              </div>
            )}

            {twoFAData?.secret && (
              <div className="space-y-2">
                <Label className="text-slate-300">Manual Entry Code</Label>
                <div className="p-3 bg-slate-800/50 rounded-lg font-mono text-sm text-center">
                  {twoFAData.secret}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="twoFACode" className="text-slate-300">Verification Code</Label>
              <Input
                id="twoFACode"
                value={twoFACode}
                onChange={(e) => setTwoFACode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                maxLength={6}
                className="bg-slate-800/50 border-slate-700 text-white text-center text-lg tracking-widest"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setTwoFAModalOpen(false);
                setTwoFACode('');
                setTwoFAData(null);
              }}
              disabled={verify2FAMutation.isPending}
              className="border-slate-700 text-white hover:bg-slate-800"
            >
              Cancel
            </Button>
            <Button
              onClick={handleVerify2FA}
              disabled={twoFACode.length !== 6 || verify2FAMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {verify2FAMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Verifying...
                </>
              ) : (
                'Verify & Enable'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Disable 2FA Modal */}
      <AlertDialog open={disable2FAModalOpen} onOpenChange={setDisable2FAModalOpen}>
        <AlertDialogContent className="bg-slate-900 border-slate-800 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Disable Two-Factor Authentication</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              This will remove an extra layer of security from your account. Enter your password to confirm.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Label htmlFor="disable2FAPassword" className="text-slate-300 mb-2 block">Password</Label>
            <Input
              id="disable2FAPassword"
              type="password"
              value={disable2FAPassword}
              onChange={(e) => setDisable2FAPassword(e.target.value)}
              className="bg-slate-800/50 border-slate-700 text-white"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel
              className="border-slate-700 text-white hover:bg-slate-800"
              disabled={disable2FAMutation.isPending}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDisable2FA}
              disabled={disable2FAMutation.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {disable2FAMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Disabling...
                </>
              ) : (
                'Disable 2FA'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Account Modal */}
      <AlertDialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <AlertDialogContent className="bg-slate-900 border-slate-800 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-400">Delete Account</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              This action is permanent and cannot be undone. All your data will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="deletePassword" className="text-slate-300">Password</Label>
              <Input
                id="deletePassword"
                type="password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                className="bg-slate-800/50 border-slate-700 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="deleteReason" className="text-slate-300">Reason (optional)</Label>
              <Textarea
                id="deleteReason"
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                rows={3}
                className="bg-slate-800/50 border-slate-700 text-white"
                placeholder="Help us improve by telling us why you're leaving..."
              />
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel
              className="border-slate-700 text-white hover:bg-slate-800"
              disabled={deleteAccountMutation.isPending}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAccount}
              disabled={!deletePassword || deleteAccountMutation.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteAccountMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete My Account'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

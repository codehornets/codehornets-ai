import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Building2, Save, Upload, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useOrganization, useUpdateOrganization, useUploadLogo } from '@/hooks/useSettings';

export default function OrganizationSettings() {
  const [formData, setFormData] = useState({
    organizationName: '',
    website: '',
    description: '',
    email: '',
    phone: '',
    address: '',
    logo: '',
  });

  const [hasChanges, setHasChanges] = useState(false);
  const [urlError, setUrlError] = useState('');

  // Fetch organization data
  const { data: orgData, isLoading, error, refetch } = useOrganization();

  // Mutations
  const updateOrgMutation = useUpdateOrganization();
  const uploadLogoMutation = useUploadLogo();

  const organization = orgData?.organization || {};

  // Load organization data
  useEffect(() => {
    if (organization) {
      setFormData({
        organizationName: organization.name || '',
        website: organization.website || '',
        description: organization.description || '',
        email: organization.email || '',
        phone: organization.phone || '',
        address: organization.address || '',
        logo: organization.logo || '',
      });
    }
  }, [organization]);

  const validateUrl = (url) => {
    if (!url) return true; // Empty is okay
    try {
      const urlObj = new URL(url);
      if (urlObj.protocol !== 'https:') {
        setUrlError('URL must start with https://');
        return false;
      }
      setUrlError('');
      return true;
    } catch {
      setUrlError('Invalid URL format');
      return false;
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);

    if (field === 'website') {
      validateUrl(value);
    }
  };

  const handleSave = async () => {
    if (formData.website && !validateUrl(formData.website)) {
      return;
    }

    try {
      await updateOrgMutation.mutateAsync({
        name: formData.organizationName,
        website: formData.website,
        description: formData.description,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
      });
      setHasChanges(false);
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleLogoUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image size must be less than 2MB');
      return;
    }

    try {
      await uploadLogoMutation.mutateAsync(file);
      refetch(); // Refresh organization data to get new logo URL
    } catch (error) {
      // Error handled by mutation
    }
  };

  if (error) {
    return (
      <Card className="glassmorphism-light border-slate-800/50">
        <CardContent className="p-6">
          <div className="flex flex-col items-center justify-center space-y-4 py-8">
            <AlertCircle className="w-12 h-12 text-red-400" />
            <div className="text-center">
              <p className="text-lg font-medium text-slate-300">Failed to load organization settings</p>
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
    <Card style={{
      backgroundColor: 'var(--bg-card)',
      border: '1px solid var(--border-subtle)',
      borderRadius: '12px'
    }}>
      <CardHeader style={{ borderBottom: '1px solid var(--border-subtle)' }}>
        <CardTitle className="flex items-center" style={{ color: 'var(--text-primary)' }}>
          <Building2 className="w-5 h-5 mr-2 text-blue-400" />
          Organization Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="space-y-6">
          {/* Logo Upload */}
          <div className="space-y-2">
            <Label style={{ color: 'var(--text-secondary)' }}>Organization Logo</Label>
            <div className="flex items-center space-x-4">
              <div className="w-20 h-20 rounded-xl bg-white flex items-center justify-center overflow-hidden">
                {formData.logo ? (
                  <img src={formData.logo} alt="Organization Logo" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-black font-bold text-2xl">
                    {formData.organizationName?.charAt(0)?.toUpperCase() || 'O'}
                  </span>
                )}
              </div>
              <div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                  id="logo-upload"
                />
                <label htmlFor="logo-upload">
                  <Button
                    type="button"
                    variant="outline"
                    className="hover:bg-[var(--bg-surface-hover)]"
                    style={{
                      border: '1px solid var(--border-medium)',
                      color: 'var(--text-primary)'
                    }}
                    disabled={uploadLogoMutation.isPending}
                    onClick={() => document.getElementById('logo-upload').click()}
                  >
                    {uploadLogoMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        Upload Logo
                      </>
                    )}
                  </Button>
                </label>
                <p className="text-xs text-slate-500 mt-1">Max 2MB, PNG or JPG</p>
              </div>
            </div>
          </div>

          {/* Organization Name */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="orgName" style={{ color: 'var(--text-secondary)' }}>Organization Name</Label>
              <Input
                id="orgName"
                value={formData.organizationName}
                onChange={(e) => handleChange('organizationName', e.target.value)}
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-primary)'
                }}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="website" style={{ color: 'var(--text-secondary)' }}>Website</Label>
              <Input
                id="website"
                value={formData.website}
                onChange={(e) => handleChange('website', e.target.value)}
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  border: `1px solid ${urlError ? '#ef4444' : 'var(--border-subtle)'}`,
                  color: 'var(--text-primary)'
                }}
                placeholder="https://example.com"
              />
              {urlError ? (
                <p className="text-xs text-red-400">{urlError}</p>
              ) : (
                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Must start with https://</p>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" style={{ color: 'var(--text-secondary)' }}>Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              className="h-24"
              style={{
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-primary)'
              }}
            />
          </div>

          {/* Contact Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="email" style={{ color: 'var(--text-secondary)' }}>Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-primary)'
                }}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" style={{ color: 'var(--text-secondary)' }}>Phone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-primary)'
                }}
              />
            </div>
          </div>

          {/* Address */}
          <div className="space-y-2">
            <Label htmlFor="address" style={{ color: 'var(--text-secondary)' }}>Address</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => handleChange('address', e.target.value)}
              style={{
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-primary)'
              }}
            />
          </div>

          {/* Save Button */}
          <div className="flex justify-between items-center pt-4">
            {hasChanges && (
              <p className="text-sm text-amber-400">You have unsaved changes</p>
            )}
            {!hasChanges && (
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>All changes saved</p>
            )}
            <Button
              onClick={handleSave}
              disabled={!hasChanges || updateOrgMutation.isPending || !!urlError}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
            >
              {updateOrgMutation.isPending ? (
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
  );
}

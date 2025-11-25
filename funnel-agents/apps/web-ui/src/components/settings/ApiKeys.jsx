import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Key, Plus, Copy, Eye, EyeOff, Trash2, Calendar, Shield, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useApiKeys, useCreateApiKey, useRevokeApiKey } from '@/hooks/useSettings';

export default function ApiKeys() {
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newKeyModalOpen, setNewKeyModalOpen] = useState(false);
  const [keyName, setKeyName] = useState('');
  const [keyLabel, setKeyLabel] = useState('');
  const [keyPermissions, setKeyPermissions] = useState('read');
  const [keyExpiresIn, setKeyExpiresIn] = useState('never');
  const [visibleKeys, setVisibleKeys] = useState({});
  const [keyToRevoke, setKeyToRevoke] = useState(null);
  const [newlyCreatedKey, setNewlyCreatedKey] = useState(null);
  const [nameError, setNameError] = useState('');

  // Fetch API keys
  const { data: apiKeysData, isLoading, error, refetch } = useApiKeys();

  // Mutations
  const createApiKeyMutation = useCreateApiKey();
  const revokeApiKeyMutation = useRevokeApiKey();

  const apiKeys = apiKeysData?.keys || [];

  const permissionColors = {
    read: 'bg-blue-500/20 text-blue-400 border-blue-500/20',
    write: 'bg-green-500/20 text-green-400 border-green-500/20',
    admin: 'bg-red-500/20 text-red-400 border-red-500/20',
  };

  const permissionLabels = {
    read: 'Read Only',
    write: 'Read & Write',
    admin: 'Full Access',
  };

  const permissionDescriptions = {
    read: 'View resources only, no modifications',
    write: 'Create, read, and update resources',
    admin: 'Full access including delete operations',
  };

  const expirationOptions = [
    { value: 'never', label: 'Never' },
    { value: '30d', label: '30 days' },
    { value: '90d', label: '90 days' },
    { value: '1y', label: '1 year' },
  ];

  const validateForm = () => {
    if (!keyName.trim()) {
      setNameError('Key name is required');
      return false;
    }
    if (keyName.length < 3) {
      setNameError('Key name must be at least 3 characters');
      return false;
    }
    setNameError('');
    return true;
  };

  const toggleVisibility = (id) => {
    setVisibleKeys(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const copyToClipboard = (key, isFullKey = false) => {
    navigator.clipboard.writeText(key);
    toast.success(isFullKey ? 'Full API key copied to clipboard' : 'API key copied to clipboard');
  };

  const handleCreate = async () => {
    if (!validateForm()) return;

    try {
      const expiresAt = keyExpiresIn === 'never' ? null :
        new Date(Date.now() + getExpirationMs(keyExpiresIn)).toISOString();

      const result = await createApiKeyMutation.mutateAsync({
        name: keyName.trim(),
        label: keyLabel.trim() || undefined,
        permissions: keyPermissions,
        expiresAt,
      });

      // Show the newly created key in a modal (this is the only time the full key is visible)
      setNewlyCreatedKey(result.key);
      setNewKeyModalOpen(true);
      setCreateModalOpen(false);

      // Reset form
      setKeyName('');
      setKeyLabel('');
      setKeyPermissions('read');
      setKeyExpiresIn('never');
      setNameError('');
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleRevoke = async () => {
    if (!keyToRevoke) return;

    try {
      await revokeApiKeyMutation.mutateAsync(keyToRevoke.id);
      setKeyToRevoke(null);
    } catch (error) {
      // Error handled by mutation
    }
  };

  const getExpirationMs = (period) => {
    const msPerDay = 24 * 60 * 60 * 1000;
    switch (period) {
      case '30d': return 30 * msPerDay;
      case '90d': return 90 * msPerDay;
      case '1y': return 365 * msPerDay;
      default: return 0;
    }
  };

  const maskKey = (key) => {
    if (!key) return '';
    const prefix = key.substring(0, 12);
    const suffix = key.substring(key.length - 4);
    return `${prefix}${'•'.repeat(20)}${suffix}`;
  };

  const getExpirationStatus = (expiresAt) => {
    if (!expiresAt) return { text: 'Never expires', color: 'text-slate-400' };

    const expirationDate = new Date(expiresAt);
    const daysUntilExpiration = Math.ceil((expirationDate - new Date()) / (1000 * 60 * 60 * 24));

    if (daysUntilExpiration < 0) {
      return { text: 'Expired', color: 'text-red-400' };
    } else if (daysUntilExpiration <= 7) {
      return { text: `Expires in ${daysUntilExpiration} days`, color: 'text-yellow-400' };
    } else if (daysUntilExpiration <= 30) {
      return { text: `Expires in ${daysUntilExpiration} days`, color: 'text-orange-400' };
    } else {
      return { text: `Expires ${format(expirationDate, 'MMM d, yyyy')}`, color: 'text-slate-400' };
    }
  };

  if (error) {
    return (
      <Card className="glassmorphism-light border-slate-800/50">
        <CardContent className="p-6">
          <div className="flex flex-col items-center justify-center space-y-4 py-8">
            <AlertCircle className="w-12 h-12 text-red-400" />
            <div className="text-center">
              <p className="text-lg font-medium text-slate-300">Failed to load API keys</p>
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

  return (
    <>
      <Card className="glassmorphism-light border-slate-800/50">
        <CardHeader className="border-b border-slate-800/50">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center" style={{ color: 'var(--text-primary)' }}>
                <Key className="w-5 h-5 mr-2 text-blue-400" />
                API Keys
              </CardTitle>
              <p className="text-sm text-slate-400 mt-1">
                Manage API keys for programmatic access
              </p>
            </div>
            <Button
              onClick={() => setCreateModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create API Key
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
            </div>
          ) : apiKeys.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Key className="w-12 h-12 text-slate-600 mb-3" />
              <p className="text-slate-400 mb-4">No API keys created yet</p>
              <Button
                onClick={() => setCreateModalOpen(true)}
                variant="outline"
                className="border-slate-700"
              >
                Create your first API key
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {apiKeys.map((apiKey) => {
                const expirationStatus = getExpirationStatus(apiKey.expiresAt);
                const isExpired = expirationStatus.text === 'Expired';

                return (
                  <div
                    key={apiKey.id}
                    className={`glassmorphism-light border-slate-800/50 rounded-lg p-4 ${isExpired ? 'opacity-60' : ''}`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h4 className="font-medium" style={{ color: 'var(--text-primary)' }}>{apiKey.name}</h4>
                          {apiKey.label && (
                            <span className="px-2 py-0.5 rounded-full text-xs bg-slate-700/50 text-slate-300">
                              {apiKey.label}
                            </span>
                          )}
                          <span className={`px-2 py-0.5 rounded-full text-xs border flex items-center ${permissionColors[apiKey.permissions]}`}>
                            <Shield className="w-3 h-3 mr-1" />
                            {permissionLabels[apiKey.permissions]}
                          </span>
                          {isExpired && (
                            <span className="px-2 py-0.5 rounded-full text-xs bg-red-500/20 text-red-400 border border-red-500/20">
                              Expired
                            </span>
                          )}
                        </div>
                        <div className="flex items-center space-x-4 mt-2 text-xs text-slate-400">
                          <span className="flex items-center">
                            <Calendar className="w-3 h-3 mr-1" />
                            Created: {format(new Date(apiKey.createdAt), 'MMM d, yyyy')}
                          </span>
                          <span className={`flex items-center ${expirationStatus.color}`}>
                            {expirationStatus.text}
                          </span>
                          {apiKey.lastUsedAt && (
                            <span className="flex items-center">
                              Last used: {format(new Date(apiKey.lastUsedAt), 'MMM d, yyyy')}
                            </span>
                          )}
                          {!apiKey.lastUsedAt && (
                            <span className="text-slate-500">Never used</span>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setKeyToRevoke(apiKey)}
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                        disabled={isExpired}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>

                    <div className="flex items-center space-x-2">
                      <div className="flex-1 bg-slate-800/50 rounded-lg px-4 py-2 font-mono text-sm" style={{ color: 'var(--text-secondary)' }}>
                        {visibleKeys[apiKey.id] ? apiKey.key : maskKey(apiKey.key)}
                      </div>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => toggleVisibility(apiKey.id)}
                        className="border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800/50"
                        title={visibleKeys[apiKey.id] ? 'Hide key' : 'Show key'}
                      >
                        {visibleKeys[apiKey.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => copyToClipboard(apiKey.key)}
                        className="border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800/50"
                        title="Copy to clipboard"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>

                    {/* Rate limit info if available */}
                    {apiKey.rateLimit && (
                      <div className="mt-3 pt-3 border-t border-slate-800/50">
                        <p className="text-xs text-slate-400">
                          Rate limit: {apiKey.rateLimit.current}/{apiKey.rateLimit.limit} requests per {apiKey.rateLimit.window}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <div className="mt-6 p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <p className="text-blue-400 text-sm">
              <strong>Security tip:</strong> Keep your API keys secure and never share them publicly.
              Rotate keys regularly and delete unused keys. The full key is only shown once during creation.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Create API Key Modal */}
      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Key className="w-5 h-5 mr-2 text-blue-400" />
              Create New API Key
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Generate a new API key for your application
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="keyName" className="text-slate-300">Key Name *</Label>
              <Input
                id="keyName"
                placeholder="e.g., Production API Key"
                value={keyName}
                onChange={(e) => {
                  setKeyName(e.target.value);
                  setNameError('');
                }}
                className={`bg-slate-800/50 border-slate-700 text-white ${nameError ? 'border-red-500' : ''}`}
              />
              {nameError && (
                <p className="text-xs text-red-400">{nameError}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="keyLabel" className="text-slate-300">Label <span className="text-slate-500">(Optional)</span></Label>
              <Input
                id="keyLabel"
                placeholder="e.g., Zapier, Mobile App, Backend Service"
                value={keyLabel}
                onChange={(e) => setKeyLabel(e.target.value)}
                className="bg-slate-800/50 border-slate-700 text-white"
              />
              <p className="text-xs text-slate-500">
                Identify what service or integration this key is for
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="keyPermissions" className="text-slate-300">Access Permissions</Label>
              <Select value={keyPermissions} onValueChange={setKeyPermissions}>
                <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  {Object.entries(permissionLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value} className="text-slate-300 focus:bg-slate-700 focus:text-white">
                      <div className="flex items-start">
                        <Shield className={`w-4 h-4 mr-2 mt-0.5 ${value === 'read' ? 'text-blue-400' : value === 'write' ? 'text-green-400' : 'text-red-400'}`} />
                        <div>
                          <div className="font-medium">{label}</div>
                          <div className="text-xs text-slate-400">{permissionDescriptions[value]}</div>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="keyExpiration" className="text-slate-300">Expiration</Label>
              <Select value={keyExpiresIn} onValueChange={setKeyExpiresIn}>
                <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  {expirationOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value} className="text-slate-300 focus:bg-slate-700 focus:text-white">
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setCreateModalOpen(false);
                setNameError('');
              }}
              disabled={createApiKeyMutation.isPending}
              className="border-slate-700 text-white hover:bg-slate-800"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={!keyName || createApiKeyMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {createApiKeyMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Key'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Newly Created Key Modal */}
      <Dialog open={newKeyModalOpen} onOpenChange={setNewKeyModalOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center text-green-400">
              <CheckCircle2 className="w-5 h-5 mr-2" />
              API Key Created Successfully
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Save this key now - you won't be able to see it again!
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
              <p className="text-yellow-400 text-sm font-medium">
                Important: Copy this key and store it securely. For security reasons, you won't be able to view the full key again.
              </p>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">Your API Key</Label>
              <div className="flex items-center space-x-2">
                <div className="flex-1 bg-slate-800/50 rounded-lg px-4 py-3 font-mono text-sm break-all" style={{ color: 'var(--text-primary)' }}>
                  {newlyCreatedKey}
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => copyToClipboard(newlyCreatedKey, true)}
                  className="border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800/50 flex-shrink-0"
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              onClick={() => {
                setNewKeyModalOpen(false);
                setNewlyCreatedKey(null);
              }}
              className="bg-blue-600 hover:bg-blue-700 w-full"
            >
              I've Saved My Key
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Revoke API Key Confirmation */}
      <AlertDialog open={!!keyToRevoke} onOpenChange={() => setKeyToRevoke(null)}>
        <AlertDialogContent className="bg-slate-900 border-slate-800 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke API Key</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              Are you sure you want to revoke <strong className="text-white">{keyToRevoke?.name}</strong>?
              Any applications using this key will immediately lose access. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              className="border-slate-700 text-white hover:bg-slate-800"
              disabled={revokeApiKeyMutation.isPending}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRevoke}
              disabled={revokeApiKeyMutation.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {revokeApiKeyMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Revoking...
                </>
              ) : (
                'Revoke Key'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

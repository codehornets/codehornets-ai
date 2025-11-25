import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plug, Search, RefreshCw, Settings, CheckCircle2, XCircle, Loader2, Clock } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';
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
import { Textarea } from '@/components/ui/textarea';
import {
  useAvailableIntegrations,
  useConnectedIntegrations,
  useConnectIntegration,
  useDisconnectIntegration,
  useSyncIntegration,
  useUpdateIntegrationSettings,
} from '@/hooks/useSettings';

export default function Integrations() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIntegration, setSelectedIntegration] = useState(null);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [disconnectModalOpen, setDisconnectModalOpen] = useState(null);
  const [settings, setSettings] = useState({});

  // Fetch data
  const { data: availableData, isLoading: loadingAvailable } = useAvailableIntegrations();
  const { data: connectedData, isLoading: loadingConnected, refetch: refetchConnected } = useConnectedIntegrations();

  // Mutations
  const connectMutation = useConnectIntegration();
  const disconnectMutation = useDisconnectIntegration();
  const syncMutation = useSyncIntegration();
  const updateSettingsMutation = useUpdateIntegrationSettings();

  const availableIntegrations = availableData?.integrations || [];
  const connectedIntegrations = connectedData?.integrations || [];

  const isLoading = loadingAvailable || loadingConnected;

  // Get status badge
  const getStatusBadge = (status) => {
    switch (status) {
      case 'connected':
        return (
          <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400 border border-green-500/20 flex items-center">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Connected
          </span>
        );
      case 'error':
        return (
          <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-500/20 text-red-400 border border-red-500/20 flex items-center">
            <XCircle className="w-3 h-3 mr-1" />
            Error
          </span>
        );
      case 'syncing':
        return (
          <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-400 border border-blue-500/20 flex items-center">
            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
            Syncing
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 rounded-full text-xs font-medium bg-slate-500/20 text-slate-400 border border-slate-500/20">
            Disconnected
          </span>
        );
    }
  };

  const handleConnect = async (integration) => {
    try {
      await connectMutation.mutateAsync({
        integrationId: integration.id,
        config: {},
      });
      refetchConnected();
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleDisconnect = async () => {
    if (!disconnectModalOpen) return;

    try {
      await disconnectMutation.mutateAsync(disconnectModalOpen.id);
      setDisconnectModalOpen(null);
      refetchConnected();
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleSync = async (integration) => {
    try {
      await syncMutation.mutateAsync(integration.id);
      refetchConnected();
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleUpdateSettings = async () => {
    if (!selectedIntegration) return;

    try {
      await updateSettingsMutation.mutateAsync({
        integrationId: selectedIntegration.id,
        settings,
      });
      setSettingsModalOpen(false);
      setSelectedIntegration(null);
      setSettings({});
      refetchConnected();
    } catch (error) {
      // Error handled by mutation
    }
  };

  const openSettings = (integration) => {
    setSelectedIntegration(integration);
    setSettings(integration.settings || {});
    setSettingsModalOpen(true);
  };

  const filteredIntegrations = availableIntegrations.filter(integration =>
    integration.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    integration.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Merge available and connected integrations
  const mergedIntegrations = filteredIntegrations.map(available => {
    const connected = connectedIntegrations.find(c => c.integrationId === available.id);
    return {
      ...available,
      isConnected: !!connected,
      connectionData: connected,
    };
  });

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
      <Card className="glassmorphism-light border-slate-800/50">
        <CardHeader className="border-b border-slate-800/50">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center" style={{ color: 'var(--text-primary)' }}>
                <Plug className="w-5 h-5 mr-2 text-blue-400" />
                Integrations
              </CardTitle>
              <p className="text-sm text-slate-400 mt-1">
                Connect third-party services and tools
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {/* Search Bar */}
          <div className="p-4 border-b border-slate-800/50">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search integrations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-slate-800/50 border-slate-700 text-white"
              />
            </div>
          </div>

          {/* Integrations Grid */}
          {mergedIntegrations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Plug className="w-12 h-12 text-slate-600 mb-3" />
              <p className="text-slate-400">
                {searchQuery ? 'No integrations found matching your search' : 'No integrations available'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
              {mergedIntegrations.map((integration) => (
                <div
                  key={integration.id}
                  className="glassmorphism-light border-slate-800/50 rounded-lg p-4 flex flex-col"
                >
                  {/* Integration Header */}
                  <div className="flex items-start space-x-3 mb-3">
                    <div className="w-12 h-12 rounded-lg bg-slate-800/50 flex items-center justify-center flex-shrink-0">
                      {integration.icon ? (
                        <img src={integration.icon} alt={integration.name} className="w-8 h-8" />
                      ) : (
                        <Plug className="w-6 h-6 text-blue-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                        {integration.name}
                      </h4>
                      <p className="text-xs text-slate-400 line-clamp-2">
                        {integration.description}
                      </p>
                    </div>
                  </div>

                  {/* Status and Last Sync */}
                  {integration.isConnected && integration.connectionData && (
                    <div className="space-y-2 mb-3">
                      <div className="flex items-center justify-between">
                        {getStatusBadge(integration.connectionData.status)}
                        {integration.connectionData.lastSyncAt && (
                          <span className="text-xs text-slate-500 flex items-center">
                            <Clock className="w-3 h-3 mr-1" />
                            {format(new Date(integration.connectionData.lastSyncAt), 'MMM d, HH:mm')}
                          </span>
                        )}
                      </div>
                      {integration.connectionData.error && (
                        <div className="p-2 bg-red-500/10 border border-red-500/20 rounded text-xs text-red-400">
                          {integration.connectionData.error}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="mt-auto pt-3 border-t border-slate-800/50 flex gap-2">
                    {integration.isConnected ? (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSync(integration.connectionData)}
                          disabled={syncMutation.isPending || integration.connectionData?.status === 'syncing'}
                          className="flex-1 border-slate-700 text-sm"
                        >
                          {syncMutation.isPending ? (
                            <>
                              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                              Syncing
                            </>
                          ) : (
                            <>
                              <RefreshCw className="w-3 h-3 mr-1" />
                              Sync
                            </>
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openSettings(integration.connectionData)}
                          className="border-slate-700 text-sm"
                        >
                          <Settings className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setDisconnectModalOpen(integration.connectionData)}
                          disabled={disconnectMutation.isPending}
                          className="border-red-700 text-red-400 hover:bg-red-500/10 text-sm"
                        >
                          Disconnect
                        </Button>
                      </>
                    ) : (
                      <Button
                        onClick={() => handleConnect(integration)}
                        disabled={connectMutation.isPending}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-sm"
                      >
                        {connectMutation.isPending ? (
                          <>
                            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                            Connecting...
                          </>
                        ) : (
                          'Connect'
                        )}
                      </Button>
                    )}
                  </div>

                  {/* Category/Tags */}
                  {integration.category && (
                    <div className="mt-2">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-slate-700/50 text-slate-400">
                        {integration.category}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Settings Modal */}
      <Dialog open={settingsModalOpen} onOpenChange={setSettingsModalOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Settings className="w-5 h-5 mr-2 text-blue-400" />
              Integration Settings
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Configure {selectedIntegration?.name} integration settings
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {selectedIntegration?.settingsSchema?.map((field) => (
              <div key={field.key} className="space-y-2">
                <Label htmlFor={field.key} className="text-slate-300">
                  {field.label}
                  {field.required && <span className="text-red-400 ml-1">*</span>}
                </Label>
                {field.type === 'textarea' ? (
                  <Textarea
                    id={field.key}
                    value={settings[field.key] || ''}
                    onChange={(e) => setSettings({ ...settings, [field.key]: e.target.value })}
                    placeholder={field.placeholder}
                    className="bg-slate-800/50 border-slate-700 text-white"
                  />
                ) : (
                  <Input
                    id={field.key}
                    type={field.type || 'text'}
                    value={settings[field.key] || ''}
                    onChange={(e) => setSettings({ ...settings, [field.key]: e.target.value })}
                    placeholder={field.placeholder}
                    className="bg-slate-800/50 border-slate-700 text-white"
                  />
                )}
                {field.description && (
                  <p className="text-xs text-slate-500">{field.description}</p>
                )}
              </div>
            ))}

            {(!selectedIntegration?.settingsSchema || selectedIntegration.settingsSchema.length === 0) && (
              <p className="text-sm text-slate-400 text-center py-4">
                No configurable settings for this integration
              </p>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setSettingsModalOpen(false);
                setSelectedIntegration(null);
                setSettings({});
              }}
              disabled={updateSettingsMutation.isPending}
              className="border-slate-700 text-white hover:bg-slate-800"
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateSettings}
              disabled={updateSettingsMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {updateSettingsMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Settings'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Disconnect Confirmation */}
      <AlertDialog open={!!disconnectModalOpen} onOpenChange={() => setDisconnectModalOpen(null)}>
        <AlertDialogContent className="bg-slate-900 border-slate-800 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Disconnect Integration</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              Are you sure you want to disconnect <strong className="text-white">{disconnectModalOpen?.name}</strong>?
              This will stop all data synchronization.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              className="border-slate-700 text-white hover:bg-slate-800"
              disabled={disconnectMutation.isPending}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDisconnect}
              disabled={disconnectMutation.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {disconnectMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Disconnecting...
                </>
              ) : (
                'Disconnect'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

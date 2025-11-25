import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, ExternalLink, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function IntegrationConfigModal({ integration, open, onOpenChange, onConnect, onDisconnect }) {
  const [connecting, setConnecting] = useState(false);
  const [apiKey, setApiKey] = useState('');

  if (!open || !integration) return null;

  const handleConnect = async () => {
    setConnecting(true);
    try {
      // Simulate OAuth or API key connection
      await new Promise(resolve => setTimeout(resolve, 1500));
      onConnect(integration);
      toast.success(`${integration.name} connected successfully`);
      onOpenChange(false);
    } catch (error) {
      toast.error(`Failed to connect ${integration.name}`);
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = () => {
    onDisconnect(integration);
    toast.success(`${integration.name} disconnected`);
    onOpenChange(false);
  };

  const getAuthMethod = () => {
    // Determine auth method based on integration
    if (['Stripe', 'Mailchimp', 'GitHub', 'LinkedIn', 'Notion'].includes(integration.name)) {
      return 'api_key';
    }
    return 'oauth';
  };

  const authMethod = getAuthMethod();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-md">
        <DialogHeader>
          <div className="flex items-center space-x-3 mb-2">
            {integration.icon && <integration.icon className="w-6 h-6 text-blue-400" />}
            <DialogTitle className="text-xl">{integration.name}</DialogTitle>
          </div>
          <DialogDescription className="text-slate-400">
            {integration.connected ? 'Manage your connection' : 'Connect to start using this integration'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {integration.connected ? (
            <div className="space-y-4">
              <div className="flex items-center space-x-2 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                <CheckCircle2 className="w-5 h-5 text-green-400" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-white">Connected</p>
                  <p className="text-xs text-slate-400">Integration is active and working</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">Connection Details</Label>
                <div className="p-3 bg-slate-800/50 rounded-lg space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Status:</span>
                    <span className="text-green-400">Active</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Connected:</span>
                    <span className="text-white">2 days ago</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-start space-x-2 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <AlertCircle className="w-5 h-5 text-blue-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-white">
                    {authMethod === 'oauth' ? 'OAuth 2.0 Authentication' : 'API Key Required'}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    {authMethod === 'oauth' 
                      ? `You'll be redirected to ${integration.name} to authorize access`
                      : 'Enter your API key from your account settings'}
                  </p>
                </div>
              </div>

              {authMethod === 'api_key' && (
                <div className="space-y-2">
                  <Label className="text-slate-300">API Key</Label>
                  <Input
                    type="password"
                    placeholder="Enter your API key"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className="bg-slate-800/50 border-slate-700 text-white"
                  />
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="link"
                      size="sm"
                      onClick={() => window.open(integration.url, '_blank')}
                      className="text-blue-400 hover:text-blue-300 p-0 h-auto text-xs"
                    >
                      <ExternalLink className="w-3 h-3 mr-1" />
                      Get API key from {integration.name}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          {integration.connected ? (
            <>
              <Button 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                className="border-slate-700 text-white hover:bg-slate-800"
              >
                Close
              </Button>
              <Button 
                variant="destructive"
                onClick={handleDisconnect}
              >
                Disconnect
              </Button>
            </>
          ) : (
            <>
              <Button 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                className="border-slate-700 text-white hover:bg-slate-800"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleConnect}
                disabled={connecting || (authMethod === 'api_key' && !apiKey)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {connecting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>Connect</>
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
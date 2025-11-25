import { useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from 'sonner';

export default function EditSettingsSheet({ open, onOpenChange, agent, onSave }) {
  const [settings, setSettings] = useState({
    name: agent?.name || '',
    description: agent?.role || '',
    domain: agent?.domain || 'Marketing',
    status: agent?.status || 'active',
    tools_enabled: agent?.tools_enabled || [],
    tone: 'professional',
    audience: 'b2b_saas',
    avoid_competitors: false,
    include_sources: true,
    client_docs: true,
    email_access: false,
    ad_accounts: false,
    require_approval: true,
    max_tasks_per_day: 50,
  });

  const availableTools = [
    { id: 'web_search', name: 'Web Search', description: 'Search the internet for information', category: 'Research' },
    { id: 'generate_image', name: 'Generate Image', description: 'Create AI-generated images', category: 'Content' },
    { id: 'send_email', name: 'Send Email', description: 'Send emails to users or clients', category: 'Communication' },
    { id: 'upload_file', name: 'Upload File', description: 'Upload and manage files', category: 'Files' },
    { id: 'extract_data', name: 'Extract Data', description: 'Extract structured data from documents', category: 'Data' },
    { id: 'invoke_llm', name: 'Invoke LLM', description: 'Call language models for text generation', category: 'AI' },
    { id: 'create_task', name: 'Create Task', description: 'Create tasks in the system', category: 'Workflow' },
    { id: 'update_task', name: 'Update Task', description: 'Update existing tasks', category: 'Workflow' },
    { id: 'read_entities', name: 'Read Entities', description: 'Read data from database entities', category: 'Data' },
  ];

  const toggleTool = (toolId) => {
    setSettings(prev => ({
      ...prev,
      tools_enabled: prev.tools_enabled.includes(toolId)
        ? prev.tools_enabled.filter(id => id !== toolId)
        : [...prev.tools_enabled, toolId]
    }));
  };

  const handleSave = () => {
    onSave(settings);
    toast.success(`${agent?.name} settings updated. Changes apply to new runs immediately.`);
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="bg-slate-900 border-slate-800 text-white overflow-y-auto w-full sm:max-w-2xl">
        <SheetHeader>
          <SheetTitle className="text-white">Edit Agent Settings</SheetTitle>
          <SheetDescription className="text-slate-400">
            Configure how {agent?.name} behaves and what it can access
          </SheetDescription>
        </SheetHeader>

        <Tabs defaultValue="general" className="mt-6">
          <TabsList className="bg-slate-800 border-slate-700 grid grid-cols-5 w-full h-auto p-1 gap-1">
            <TabsTrigger value="general" className="data-[state=active]:bg-slate-700 text-slate-300 data-[state=active]:text-white flex flex-col items-center justify-center py-3 h-auto min-h-[60px]">
              <span className="text-sm">General</span>
            </TabsTrigger>
            <TabsTrigger value="tools" className="data-[state=active]:bg-slate-700 text-slate-300 data-[state=active]:text-white flex flex-col items-center justify-center py-3 h-auto min-h-[60px]">
              <span className="text-sm">Tools</span>
              <span className="text-[10px] text-slate-500 font-normal mt-1">Capabilities</span>
            </TabsTrigger>
            <TabsTrigger value="behavior" className="data-[state=active]:bg-slate-700 text-slate-300 data-[state=active]:text-white flex flex-col items-center justify-center py-3 h-auto min-h-[60px]">
              <span className="text-sm">Behavior</span>
              <span className="text-[10px] text-slate-500 font-normal mt-1">Tone · Audience</span>
            </TabsTrigger>
            <TabsTrigger value="data" className="data-[state=active]:bg-slate-700 text-slate-300 data-[state=active]:text-white flex flex-col items-center justify-center py-3 h-auto min-h-[60px]">
              <span className="text-sm">Data Access</span>
              <span className="text-[10px] text-slate-500 font-normal mt-1">Docs · Emails</span>
            </TabsTrigger>
            <TabsTrigger value="safety" className="data-[state=active]:bg-slate-700 text-slate-300 data-[state=active]:text-white flex flex-col items-center justify-center py-3 h-auto min-h-[60px]">
              <span className="text-sm">Approval</span>
              <span className="text-[10px] text-slate-500 font-normal mt-1">Required</span>
            </TabsTrigger>
          </TabsList>

          {/* General Tab */}
          <TabsContent value="general" className="space-y-4 mt-6">
            <div className="space-y-2">
              <Label>Agent Name</Label>
              <Input
                value={settings.name}
                onChange={(e) => setSettings({ ...settings, name: e.target.value })}
                className="bg-slate-800/50 border-slate-700 text-white"
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-800/30 rounded-lg border border-slate-700">
              <div>
                <Label>Use this agent in automations</Label>
                <p className="text-sm text-slate-400 mt-1">
                  {settings.status === 'active' 
                    ? 'Can run in automations and manually' 
                    : 'Paused – only visible, cannot run'}
                </p>
              </div>
              <Switch
                checked={settings.status === 'active'}
                onCheckedChange={(checked) => setSettings({ ...settings, status: checked ? 'active' : 'inactive' })}
              />
            </div>
            {settings.status === 'inactive' && (
              <p className="text-xs text-amber-400 -mt-2 px-1">
                ⚠️ This will pause this agent in all automations
              </p>
            )}

            <div className="space-y-2">
              <Label>Business Domain</Label>
              <Select value={settings.domain} onValueChange={(v) => setSettings({ ...settings, domain: v })}>
                <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  {['Offer', 'Marketing', 'Sales', 'Fulfillment', 'Feedback Loop', 'Operations', 'Customer Support', 'Leadership', 'Innovation', 'Enablement'].map(d => (
                    <SelectItem key={d} value={d} className="text-slate-300 focus:bg-slate-700 focus:text-white">{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={settings.description}
                onChange={(e) => setSettings({ ...settings, description: e.target.value })}
                className="bg-slate-800/50 border-slate-700 text-white h-24"
              />
            </div>
          </TabsContent>

          {/* Tools Tab */}
          <TabsContent value="tools" className="space-y-4 mt-6">
            <p className="text-sm text-slate-400 mb-4">Select which tools this agent can use during task execution</p>

            {['Research', 'Content', 'Communication', 'Files', 'Data', 'AI', 'Workflow'].map(category => {
              const categoryTools = availableTools.filter(t => t.category === category);
              if (categoryTools.length === 0) return null;

              return (
                <div key={category} className="space-y-2">
                  <h4 className="text-sm font-semibold text-white mb-2">{category}</h4>
                  {categoryTools.map(tool => (
                    <div key={tool.id} className="flex items-center justify-between p-4 bg-slate-800/30 rounded-lg border border-slate-700">
                      <div className="flex-1">
                        <Label className="cursor-pointer">{tool.name}</Label>
                        <p className="text-xs text-slate-500 mt-1">{tool.description}</p>
                      </div>
                      <Switch
                        checked={settings.tools_enabled.includes(tool.id)}
                        onCheckedChange={() => toggleTool(tool.id)}
                      />
                    </div>
                  ))}
                </div>
              );
            })}
          </TabsContent>

          {/* Behavior Tab */}
          <TabsContent value="behavior" className="space-y-4 mt-6">
            <div className="space-y-2">
              <Label>Tone of Voice</Label>
              <Select value={settings.tone} onValueChange={(v) => setSettings({ ...settings, tone: v })}>
                <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="professional" className="text-slate-300 focus:bg-slate-700 focus:text-white">Professional</SelectItem>
                  <SelectItem value="friendly" className="text-slate-300 focus:bg-slate-700 focus:text-white">Friendly</SelectItem>
                  <SelectItem value="bold" className="text-slate-300 focus:bg-slate-700 focus:text-white">Bold</SelectItem>
                  <SelectItem value="conversational" className="text-slate-300 focus:bg-slate-700 focus:text-white">Conversational</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Target Audience</Label>
              <Select value={settings.audience} onValueChange={(v) => setSettings({ ...settings, audience: v })}>
                <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="b2b_saas" className="text-slate-300 focus:bg-slate-700 focus:text-white">B2B SaaS</SelectItem>
                  <SelectItem value="ecommerce" className="text-slate-300 focus:bg-slate-700 focus:text-white">eCommerce</SelectItem>
                  <SelectItem value="creators" className="text-slate-300 focus:bg-slate-700 focus:text-white">Creators</SelectItem>
                  <SelectItem value="agencies" className="text-slate-300 focus:bg-slate-700 focus:text-white">Agencies</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3 mt-6">
              <h4 className="text-sm font-semibold text-white">Content Guidelines</h4>
              
              <div className="flex items-center justify-between p-4 bg-slate-800/30 rounded-lg">
                <div>
                  <Label>Avoid mentioning competitors by name</Label>
                  <p className="text-xs text-slate-500 mt-1">Keep competitive analysis generic</p>
                </div>
                <Switch
                  checked={settings.avoid_competitors}
                  onCheckedChange={(checked) => setSettings({ ...settings, avoid_competitors: checked })}
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-800/30 rounded-lg">
                <div>
                  <Label>Always include sources/links</Label>
                  <p className="text-xs text-slate-500 mt-1">Add references for research and claims</p>
                </div>
                <Switch
                  checked={settings.include_sources}
                  onCheckedChange={(checked) => setSettings({ ...settings, include_sources: checked })}
                />
              </div>
            </div>
          </TabsContent>

          {/* Data Access Tab */}
          <TabsContent value="data" className="space-y-4 mt-6">
            <p className="text-sm text-slate-400 mb-4">Control what this agent can read and access</p>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 bg-slate-800/30 rounded-lg">
                <div>
                  <Label>Client Documents</Label>
                  <div className="flex items-center space-x-2 mt-1">
                    <div className={`w-2 h-2 rounded-full ${settings.client_docs ? 'bg-green-400' : 'bg-slate-600'}`} />
                    <p className="text-xs text-slate-500">{settings.client_docs ? 'Connected' : 'Not connected'}</p>
                  </div>
                </div>
                <Switch
                  checked={settings.client_docs}
                  onCheckedChange={(checked) => setSettings({ ...settings, client_docs: checked })}
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-800/30 rounded-lg">
                <div>
                  <Label>Email Conversations</Label>
                  <div className="flex items-center space-x-2 mt-1">
                    <div className={`w-2 h-2 rounded-full ${settings.email_access ? 'bg-green-400' : 'bg-slate-600'}`} />
                    <p className="text-xs text-slate-500">{settings.email_access ? 'Connected' : 'Not connected'}</p>
                  </div>
                </div>
                <Switch
                  checked={settings.email_access}
                  onCheckedChange={(checked) => setSettings({ ...settings, email_access: checked })}
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-800/30 rounded-lg">
                <div>
                  <Label>Ad Accounts</Label>
                  <div className="flex items-center space-x-2 mt-1">
                    <div className={`w-2 h-2 rounded-full ${settings.ad_accounts ? 'bg-green-400' : 'bg-slate-600'}`} />
                    <p className="text-xs text-slate-500">{settings.ad_accounts ? 'Connected' : 'Not connected'}</p>
                  </div>
                </div>
                <Switch
                  checked={settings.ad_accounts}
                  onCheckedChange={(checked) => setSettings({ ...settings, ad_accounts: checked })}
                />
              </div>
            </div>
          </TabsContent>

          {/* Safety Tab */}
          <TabsContent value="safety" className="space-y-4 mt-6">
            <div className="flex items-center justify-between p-4 bg-slate-800/30 rounded-lg">
              <div>
                <Label>Require human approval</Label>
                <p className="text-xs text-slate-500 mt-1">Review output before sending to clients</p>
              </div>
              <Switch
                checked={settings.require_approval}
                onCheckedChange={(checked) => setSettings({ ...settings, require_approval: checked })}
              />
            </div>

            <div className="space-y-2">
              <Label>Max tasks per day</Label>
              <Input
                type="number"
                value={settings.max_tasks_per_day}
                onChange={(e) => setSettings({ ...settings, max_tasks_per_day: parseInt(e.target.value) })}
                className="bg-slate-800/50 border-slate-700 text-white"
              />
              <p className="text-xs text-slate-500">Limit daily runs to control costs</p>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex items-center justify-end space-x-3 mt-6 pt-6 border-t border-slate-800">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800">
            Cancel
          </Button>
          <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white">
            Save Changes
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
import { useState, useEffect } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import client from '@/api/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import { Info, X } from 'lucide-react';

export default function AddAgentSheet({ open, onOpenChange, template }) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('general');
  
  const [formData, setFormData] = useState({
    enabled: true,
    name: '',
    role: '',
    domain: '',
    description: '',
    skills: [],
    // Tools
    tools_web_research: false,
    tools_client_docs: false,
    tools_crm: false,
    tools_ad_platforms: false,
    tools_email_drafts: false,
    tools_analytics: false,
    // Behavior
    tone: [],
    audience: '',
    keep_concise: false,
    use_bullets: false,
    avoid_jargon: false,
    scope_boundaries: '',
    advanced_instructions: '',
    // Data Access
    client_scope: 'all',
    specific_clients: [],
    allowed_channels: [],
    access_global_kb: false,
    access_client_docs: false,
    access_playbooks: false,
    // Approval
    task_risk_level: 'low',
    approval_emails: false,
    approval_posts: false,
    allow_research: true,
    default_approver: '',
  });

  const [skillInput, setSkillInput] = useState('');

  useEffect(() => {
    if (template) {
      setFormData(prev => ({
        ...prev,
        name: template.name,
        role: template.persona.title,
        domain: template.domain,
        description: template.description,
        // Prefill from template config
        tools_web_research: template.defaultConfig.tools.includes('Web search'),
        tools_client_docs: template.defaultConfig.tools.includes('Notion docs') || template.defaultConfig.tools.includes('Brand guidelines'),
        tools_crm: template.defaultConfig.tools.includes('CRM'),
        audience: template.defaultConfig.audience,
        scope_boundaries: template.overview.join('\n'),
      }));
    }
  }, [template]);

  const createAgentMutation = useMutation({
    mutationFn: (data) => client.entities.Agent.create(data),
    onSuccess: (newAgent) => {
      queryClient.invalidateQueries({ queryKey: ['agents'] });
      toast.success(`Agent created: ${newAgent.name}`);
      onOpenChange(false);
      navigate(createPageUrl('AgentDetail') + `?id=${newAgent.id}`);
    },
    onError: (error) => {
      toast.error('Failed to create agent');
    }
  });

  const handleSubmit = () => {
    if (!formData.name || !formData.domain || !formData.description) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Build tools array from checkboxes
    const tools = [];
    if (formData.tools_web_research) tools.push('Web search');
    if (formData.tools_client_docs) tools.push('Client docs');
    if (formData.tools_crm) tools.push('CRM');
    if (formData.tools_ad_platforms) tools.push('Ad platforms');
    if (formData.tools_email_drafts) tools.push('Email drafts');
    if (formData.tools_analytics) tools.push('Analytics');

    createAgentMutation.mutate({
      name: formData.name,
      domain: formData.domain,
      role: formData.description,
      skills: formData.skills,
      status: formData.enabled ? 'active' : 'inactive',
      tools_enabled: tools,
      tools_config: {
        tone: formData.tone.join(', '),
        audience: formData.audience,
        keep_concise: formData.keep_concise,
        use_bullets: formData.use_bullets,
        avoid_jargon: formData.avoid_jargon,
        scope: formData.scope_boundaries,
        advanced: formData.advanced_instructions,
      },
    });
  };

  const isValid = formData.name && formData.domain && formData.description;

  const toneOptions = ['Professional', 'Friendly', 'Direct', 'Playful', 'Analytical', 'Persuasive'];

  const toggleTone = (tone) => {
    setFormData(prev => ({
      ...prev,
      tone: prev.tone.includes(tone)
        ? prev.tone.filter(t => t !== tone)
        : prev.tone.length < 2 ? [...prev.tone, tone] : prev.tone
    }));
  };

  const handleAddSkill = (e) => {
    e.preventDefault();
    const skill = skillInput.trim();
    if (skill && !formData.skills.includes(skill)) {
      setFormData(prev => ({ ...prev, skills: [...prev.skills, skill] }));
      setSkillInput('');
    }
  };

  const handleRemoveSkill = (skillToRemove) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter(s => s !== skillToRemove)
    }));
  };

  const suggestedSkills = [
    'Market Research', 'Copywriting', 'Data Analysis', 'SEO', 'Social Media',
    'Email Marketing', 'Content Strategy', 'Lead Generation', 'Competitor Analysis',
    'Ad Management', 'Web Analytics', 'CRM Management', 'Sales Outreach',
    'Customer Service', 'Project Management', 'Creative Design', 'Video Production'
  ];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="bg-slate-900 border-slate-800 text-white w-[600px] sm:max-w-[600px] overflow-y-auto">
        <SheetHeader className="space-y-3 pb-4">
          <SheetTitle className="text-white text-xl">Create Agent</SheetTitle>
          {template && (
            <div className="flex items-center space-x-2 p-2 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <Info className="w-4 h-4 text-blue-400 flex-shrink-0" />
              <p className="text-xs text-blue-400">
                Based on template: <strong>{template.name}</strong> (you can change anything)
              </p>
            </div>
          )}
          {!template && (
            <p className="text-slate-400 text-sm">Set up a new AI teammate for your marketing operations</p>
          )}
        </SheetHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
          <TabsList className="bg-slate-800 border-slate-700 w-full justify-start overflow-x-auto flex-nowrap">
            <TabsTrigger value="general" className="data-[state=active]:bg-slate-700 text-slate-300 data-[state=active]:text-white flex-shrink-0">
              General
            </TabsTrigger>
            <TabsTrigger value="tools" className="data-[state=active]:bg-slate-700 text-slate-300 data-[state=active]:text-white flex-shrink-0">
              Tools
            </TabsTrigger>
            <TabsTrigger value="behavior" className="data-[state=active]:bg-slate-700 text-slate-300 data-[state=active]:text-white flex-shrink-0">
              Behavior
            </TabsTrigger>
            <TabsTrigger value="access" className="data-[state=active]:bg-slate-700 text-slate-300 data-[state=active]:text-white flex-shrink-0">
              Data Access
            </TabsTrigger>
            <TabsTrigger value="approval" className="data-[state=active]:bg-slate-700 text-slate-300 data-[state=active]:text-white flex-shrink-0">
              Approval
            </TabsTrigger>
            <TabsTrigger value="output" className="data-[state=active]:bg-slate-700 text-slate-300 data-[state=active]:text-white flex-shrink-0">
              Output
            </TabsTrigger>
          </TabsList>

          {/* General Tab */}
          <TabsContent value="general" className="space-y-6 mt-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg">
                <div className="flex-1">
                  <Label className="text-white font-medium">Use this agent in automations</Label>
                  <p className="text-xs text-slate-400 mt-1">
                    When on, this agent can run in workflows and one-off tasks
                  </p>
                </div>
                <Switch
                  checked={formData.enabled}
                  onCheckedChange={(checked) => setFormData({ ...formData, enabled: checked })}
                />
              </div>

              <div className="space-y-2">
                <Label>Agent Name <span className="text-red-400">*</span></Label>
                <Input
                  placeholder="e.g. Sarah Chen, Market Researcher"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="bg-slate-800/50 border-slate-700 text-white"
                />
                <p className="text-xs text-slate-500">This is how the agent will appear in your account</p>
              </div>

              <div className="space-y-2">
                <Label>Role / Title</Label>
                <Input
                  placeholder="Market Analyst, Content Strategist, SEO Specialist..."
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="bg-slate-800/50 border-slate-700 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label>Business Domain <span className="text-red-400">*</span></Label>
                <Select value={formData.domain} onValueChange={(v) => setFormData({ ...formData, domain: v })}>
                  <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white">
                    <SelectValue placeholder="Select domain" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="Offer" className="text-slate-300 focus:bg-slate-700 focus:text-white">Offer</SelectItem>
                    <SelectItem value="Marketing" className="text-slate-300 focus:bg-slate-700 focus:text-white">Marketing</SelectItem>
                    <SelectItem value="Sales" className="text-slate-300 focus:bg-slate-700 focus:text-white">Sales</SelectItem>
                    <SelectItem value="Fulfillment" className="text-slate-300 focus:bg-slate-700 focus:text-white">Fulfillment</SelectItem>
                    <SelectItem value="Feedback Loop" className="text-slate-300 focus:bg-slate-700 focus:text-white">Feedback Loop</SelectItem>
                    <SelectItem value="Operations" className="text-slate-300 focus:bg-slate-700 focus:text-white">Operations</SelectItem>
                    <SelectItem value="Customer Support" className="text-slate-300 focus:bg-slate-700 focus:text-white">Customer Support</SelectItem>
                    <SelectItem value="Leadership" className="text-slate-300 focus:bg-slate-700 focus:text-white">Leadership</SelectItem>
                    <SelectItem value="Innovation" className="text-slate-300 focus:bg-slate-700 focus:text-white">Innovation</SelectItem>
                    <SelectItem value="Enablement" className="text-slate-300 focus:bg-slate-700 focus:text-white">Enablement</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-slate-500">Used for filtering and reporting</p>
              </div>

              <div className="space-y-2">
                <Label>Description <span className="text-red-400">*</span></Label>
                <Textarea
                  placeholder="What this agent helps with (e.g., market analysis and trend identification)"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="bg-slate-800/50 border-slate-700 text-white h-24"
                />
              </div>

              <div className="space-y-3">
                <Label>Skills & Capabilities</Label>
                <p className="text-xs text-slate-500">Tag this agent with specific skills to help with searching and filtering</p>
                
                {/* Skill Tags */}
                {formData.skills.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.skills.map((skill) => (
                      <Badge
                        key={skill}
                        className="bg-blue-500/20 text-blue-400 border border-blue-500/30 pl-3 pr-2 py-1.5"
                      >
                        {skill}
                        <button
                          onClick={() => handleRemoveSkill(skill)}
                          className="ml-2 hover:text-blue-200"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Add Skill Input */}
                <form onSubmit={handleAddSkill} className="flex gap-2">
                  <Input
                    placeholder="Type a skill and press Enter..."
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    className="bg-slate-800/50 border-slate-700 text-white flex-1"
                  />
                  <Button
                    type="submit"
                    variant="outline"
                    className="border-slate-700 text-white hover:bg-slate-800"
                  >
                    Add
                  </Button>
                </form>

                {/* Suggested Skills */}
                <div className="space-y-2">
                  <p className="text-xs text-slate-500">Suggested skills:</p>
                  <div className="flex flex-wrap gap-2">
                    {suggestedSkills
                      .filter(skill => !formData.skills.includes(skill))
                      .slice(0, 8)
                      .map((skill) => (
                        <button
                          key={skill}
                          onClick={() => setFormData(prev => ({ ...prev, skills: [...prev.skills, skill] }))}
                          className="text-xs px-2 py-1 rounded bg-slate-800/50 text-slate-400 border border-slate-700 hover:border-blue-500/30 hover:text-blue-400 transition-colors"
                        >
                          + {skill}
                        </button>
                      ))}
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Tools Tab */}
          <TabsContent value="tools" className="space-y-6 mt-6">
            <div>
              <h4 className="text-white font-semibold mb-2">Capabilities</h4>
              <p className="text-sm text-slate-400 mb-4">Choose what this agent is allowed to use when working on tasks</p>
              
              <div className="space-y-3">
                <div className="flex items-start space-x-3 p-3 bg-slate-800/30 rounded-lg">
                  <Checkbox
                    id="web-research"
                    checked={formData.tools_web_research}
                    onCheckedChange={(checked) => setFormData({ ...formData, tools_web_research: checked })}
                  />
                  <div className="flex-1">
                    <Label htmlFor="web-research" className="text-white cursor-pointer">Web research & news</Label>
                    <p className="text-xs text-slate-500 mt-0.5">Look up competitors, market stats, and definitions online</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-3 bg-slate-800/30 rounded-lg">
                  <Checkbox
                    id="client-docs"
                    checked={formData.tools_client_docs}
                    onCheckedChange={(checked) => setFormData({ ...formData, tools_client_docs: checked })}
                  />
                  <div className="flex-1">
                    <Label htmlFor="client-docs" className="text-white cursor-pointer">Client docs (Notion / Google Drive)</Label>
                    <p className="text-xs text-slate-500 mt-0.5">Access client documentation and internal knowledge base</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-3 bg-slate-800/30 rounded-lg">
                  <Checkbox
                    id="crm"
                    checked={formData.tools_crm}
                    onCheckedChange={(checked) => setFormData({ ...formData, tools_crm: checked })}
                  />
                  <div className="flex-1">
                    <Label htmlFor="crm" className="text-white cursor-pointer">CRM data</Label>
                    <p className="text-xs text-slate-500 mt-0.5">Access contacts, deals, and pipeline information</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-3 bg-slate-800/30 rounded-lg">
                  <Checkbox
                    id="ad-platforms"
                    checked={formData.tools_ad_platforms}
                    onCheckedChange={(checked) => setFormData({ ...formData, tools_ad_platforms: checked })}
                  />
                  <div className="flex-1">
                    <Label htmlFor="ad-platforms" className="text-white cursor-pointer">Ad platforms (Facebook Ads, Google Ads)</Label>
                    <p className="text-xs text-slate-500 mt-0.5">Create and manage advertising campaigns</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-3 bg-slate-800/30 rounded-lg">
                  <Checkbox
                    id="email-drafts"
                    checked={formData.tools_email_drafts}
                    onCheckedChange={(checked) => setFormData({ ...formData, tools_email_drafts: checked })}
                  />
                  <div className="flex-1">
                    <Label htmlFor="email-drafts" className="text-white cursor-pointer">Email & messaging drafts</Label>
                    <p className="text-xs text-slate-500 mt-0.5">Draft emails and messages (no sending without approval)</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-3 bg-slate-800/30 rounded-lg">
                  <Checkbox
                    id="analytics"
                    checked={formData.tools_analytics}
                    onCheckedChange={(checked) => setFormData({ ...formData, tools_analytics: checked })}
                  />
                  <div className="flex-1">
                    <Label htmlFor="analytics" className="text-white cursor-pointer">Analytics / dashboards</Label>
                    <p className="text-xs text-slate-500 mt-0.5">Access performance data and reporting tools</p>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Behavior Tab */}
          <TabsContent value="behavior" className="space-y-6 mt-6">
            <div className="space-y-6">
              <div className="space-y-3">
                <Label>Tone & Style</Label>
                <p className="text-xs text-slate-500">How should this agent sound in its outputs? (Choose up to 2)</p>
                <div className="flex flex-wrap gap-2">
                  {toneOptions.map(tone => (
                    <button
                      key={tone}
                      onClick={() => toggleTone(tone)}
                      className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                        formData.tone.includes(tone)
                          ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                          : 'bg-slate-800/50 text-slate-400 border border-slate-700 hover:border-slate-600'
                      }`}
                    >
                      {tone}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Audience</Label>
                <Input
                  placeholder="e.g. B2B SaaS founders, e-commerce store owners, HR leaders..."
                  value={formData.audience}
                  onChange={(e) => setFormData({ ...formData, audience: e.target.value })}
                  className="bg-slate-800/50 border-slate-700 text-white"
                />
              </div>

              <div className="space-y-3">
                <Label>Communication Preferences</Label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-3 p-3 bg-slate-800/30 rounded-lg">
                    <Checkbox
                      id="keep-concise"
                      checked={formData.keep_concise}
                      onCheckedChange={(checked) => setFormData({ ...formData, keep_concise: checked })}
                    />
                    <Label htmlFor="keep-concise" className="text-white cursor-pointer text-sm">
                      Keep answers concise by default
                    </Label>
                  </div>
                  <div className="flex items-center space-x-3 p-3 bg-slate-800/30 rounded-lg">
                    <Checkbox
                      id="use-bullets"
                      checked={formData.use_bullets}
                      onCheckedChange={(checked) => setFormData({ ...formData, use_bullets: checked })}
                    />
                    <Label htmlFor="use-bullets" className="text-white cursor-pointer text-sm">
                      Use bullet points where possible
                    </Label>
                  </div>
                  <div className="flex items-center space-x-3 p-3 bg-slate-800/30 rounded-lg">
                    <Checkbox
                      id="avoid-jargon"
                      checked={formData.avoid_jargon}
                      onCheckedChange={(checked) => setFormData({ ...formData, avoid_jargon: checked })}
                    />
                    <Label htmlFor="avoid-jargon" className="text-white cursor-pointer text-sm">
                      Avoid jargon with clients
                    </Label>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Scope & Boundaries</Label>
                <Textarea
                  placeholder="e.g. Focus only on marketing insights. Do not give legal or HR advice."
                  value={formData.scope_boundaries}
                  onChange={(e) => setFormData({ ...formData, scope_boundaries: e.target.value })}
                  className="bg-slate-800/50 border-slate-700 text-white h-20"
                />
                <p className="text-xs text-slate-500">What this agent should and shouldn't do</p>
              </div>
            </div>
          </TabsContent>

          {/* Data Access Tab */}
          <TabsContent value="access" className="space-y-6 mt-6">
            <p className="text-sm text-slate-400">
              Control which clients and data sources this agent can see. It will only use this information when running tasks.
            </p>

            <div className="space-y-4">
              <div className="space-y-3">
                <Label>Client Scope</Label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-3 p-3 bg-slate-800/30 rounded-lg">
                    <input
                      type="radio"
                      id="all-clients"
                      checked={formData.client_scope === 'all'}
                      onChange={() => setFormData({ ...formData, client_scope: 'all' })}
                      className="text-blue-600"
                    />
                    <Label htmlFor="all-clients" className="text-white cursor-pointer">All clients</Label>
                  </div>
                  <div className="flex items-center space-x-3 p-3 bg-slate-800/30 rounded-lg">
                    <input
                      type="radio"
                      id="specific-clients"
                      checked={formData.client_scope === 'specific'}
                      onChange={() => setFormData({ ...formData, client_scope: 'specific' })}
                      className="text-blue-600"
                    />
                    <Label htmlFor="specific-clients" className="text-white cursor-pointer">Specific clients only</Label>
                  </div>
                </div>
                <p className="text-xs text-slate-500">Limit access if this agent is dedicated to certain accounts</p>
              </div>

              <div className="space-y-3">
                <Label>Documents & Knowledge</Label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-3 p-3 bg-slate-800/30 rounded-lg">
                    <Checkbox
                      id="global-kb"
                      checked={formData.access_global_kb}
                      onCheckedChange={(checked) => setFormData({ ...formData, access_global_kb: checked })}
                    />
                    <Label htmlFor="global-kb" className="text-white cursor-pointer text-sm">
                      Global knowledge base
                    </Label>
                  </div>
                  <div className="flex items-center space-x-3 p-3 bg-slate-800/30 rounded-lg">
                    <Checkbox
                      id="client-specific"
                      checked={formData.access_client_docs}
                      onCheckedChange={(checked) => setFormData({ ...formData, access_client_docs: checked })}
                    />
                    <Label htmlFor="client-specific" className="text-white cursor-pointer text-sm">
                      Client-specific docs
                    </Label>
                  </div>
                  <div className="flex items-center space-x-3 p-3 bg-slate-800/30 rounded-lg">
                    <Checkbox
                      id="playbooks"
                      checked={formData.access_playbooks}
                      onCheckedChange={(checked) => setFormData({ ...formData, access_playbooks: checked })}
                    />
                    <Label htmlFor="playbooks" className="text-white cursor-pointer text-sm">
                      Playbooks & SOPs
                    </Label>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Approval Tab */}
          <TabsContent value="approval" className="space-y-6 mt-6">
            <div className="space-y-6">
              <div className="space-y-3">
                <Label>Task Risk Level</Label>
                <div className="space-y-2">
                  <div className="flex items-start space-x-3 p-3 bg-slate-800/30 rounded-lg">
                    <input
                      type="radio"
                      id="low-risk"
                      checked={formData.task_risk_level === 'low'}
                      onChange={() => setFormData({ ...formData, task_risk_level: 'low' })}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <Label htmlFor="low-risk" className="text-white cursor-pointer">Low-impact tasks only</Label>
                      <p className="text-xs text-slate-500 mt-0.5">Research, drafts, internal notes</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3 p-3 bg-slate-800/30 rounded-lg">
                    <input
                      type="radio"
                      id="medium-risk"
                      checked={formData.task_risk_level === 'medium'}
                      onChange={() => setFormData({ ...formData, task_risk_level: 'medium' })}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <Label htmlFor="medium-risk" className="text-white cursor-pointer">Can also propose outbound messages</Label>
                      <p className="text-xs text-slate-500 mt-0.5">Client messages and ad copy</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <Label>Human Approval Requirements</Label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-3 p-3 bg-slate-800/30 rounded-lg">
                    <Checkbox
                      id="approval-emails"
                      checked={formData.approval_emails}
                      onCheckedChange={(checked) => setFormData({ ...formData, approval_emails: checked })}
                    />
                    <Label htmlFor="approval-emails" className="text-white cursor-pointer text-sm">
                      Require approval before sending emails to clients
                    </Label>
                  </div>
                  <div className="flex items-center space-x-3 p-3 bg-slate-800/30 rounded-lg">
                    <Checkbox
                      id="approval-posts"
                      checked={formData.approval_posts}
                      onCheckedChange={(checked) => setFormData({ ...formData, approval_posts: checked })}
                    />
                    <Label htmlFor="approval-posts" className="text-white cursor-pointer text-sm">
                      Require approval before publishing posts or ads
                    </Label>
                  </div>
                  <div className="flex items-center space-x-3 p-3 bg-slate-800/30 rounded-lg">
                    <Checkbox
                      id="allow-research"
                      checked={formData.allow_research}
                      onCheckedChange={(checked) => setFormData({ ...formData, allow_research: checked })}
                    />
                    <Label htmlFor="allow-research" className="text-white cursor-pointer text-sm">
                      Allow research & internal notes without approval
                    </Label>
                  </div>
                </div>
                <p className="text-xs text-slate-500">You can always override approval settings per automation</p>
              </div>
            </div>
          </TabsContent>

          {/* Output & Behavior Tab */}
          <TabsContent value="output" className="space-y-6 mt-6">
            <div className="space-y-6">
              <div className="space-y-3">
                <Label>Creativity Level</Label>
                <p className="text-xs text-slate-500">Controls how creative vs precise the agent should be</p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>Precise</span>
                    <span>Balanced</span>
                    <span>Creative</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    defaultValue="7"
                    className="w-full"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <Label>Output Format</Label>
                <div className="grid grid-cols-2 gap-2">
                  {['Structured', 'Conversational', 'Technical', 'Executive'].map(format => (
                    <button
                      key={format}
                      className="px-3 py-2 rounded-lg text-sm bg-slate-800/50 text-slate-400 border border-slate-700 hover:border-blue-500/30 hover:text-blue-400 transition-colors"
                    >
                      {format}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <Label>Response Length</Label>
                <Select defaultValue="standard">
                  <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="concise" className="text-slate-300">Concise (1-2 paragraphs)</SelectItem>
                    <SelectItem value="standard" className="text-slate-300">Standard (2-4 paragraphs)</SelectItem>
                    <SelectItem value="detailed" className="text-slate-300">Detailed (4-6 paragraphs)</SelectItem>
                    <SelectItem value="comprehensive" className="text-slate-300">Comprehensive (Full analysis)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label>Behavioral Controls</Label>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg">
                    <div>
                      <p className="text-white text-sm">Ask clarifying questions</p>
                      <p className="text-xs text-slate-500">When instructions are ambiguous</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg">
                    <div>
                      <p className="text-white text-sm">Provide proactive suggestions</p>
                      <p className="text-xs text-slate-500">Offer alternatives and improvements</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg">
                    <div>
                      <p className="text-white text-sm">Include sources & references</p>
                      <p className="text-xs text-slate-500">Cite information sources</p>
                    </div>
                    <Switch />
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <Label>Instruction Following</Label>
                <Select defaultValue="balanced">
                  <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="flexible" className="text-slate-300">
                      Flexible - Can deviate if better approach found
                    </SelectItem>
                    <SelectItem value="balanced" className="text-slate-300">
                      Balanced - Follow instructions with minor adaptations
                    </SelectItem>
                    <SelectItem value="strict" className="text-slate-300">
                      Strict - Follow instructions exactly as given
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Footer Actions */}
        <div className="sticky bottom-0 bg-slate-900 pt-6 pb-2 border-t border-slate-800 mt-8 flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-slate-700 text-white hover:bg-slate-800"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!isValid || createAgentMutation.isPending}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {createAgentMutation.isPending ? 'Creating...' : 'Create Agent'}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
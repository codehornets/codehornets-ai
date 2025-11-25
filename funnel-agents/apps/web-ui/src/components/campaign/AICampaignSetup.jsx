import { useState } from 'react';
import apiClient from '@/api/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sparkles, Loader2, Target, TrendingUp, Users, Zap, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

const CAMPAIGN_PRESETS = [
  {
    id: 'lead_gen',
    name: 'Lead Generation',
    icon: Target,
    description: 'Attract and capture qualified leads',
    channels: ['LinkedIn', 'Google Ads', 'Email'],
    defaultTasks: ['Setup landing page', 'Create lead magnet', 'Configure email sequence']
  },
  {
    id: 'brand_awareness',
    name: 'Brand Awareness',
    icon: TrendingUp,
    description: 'Increase visibility and brand recognition',
    channels: ['LinkedIn', 'Facebook', 'Instagram', 'Blog'],
    defaultTasks: ['Develop brand messaging', 'Create social content calendar', 'Launch blog series']
  },
  {
    id: 'product_launch',
    name: 'Product Launch',
    icon: Zap,
    description: 'Introduce new product to market',
    channels: ['Email', 'LinkedIn', 'PR', 'Webinar'],
    defaultTasks: ['Create launch announcement', 'Schedule webinar', 'Prepare press release']
  },
  {
    id: 'nurture',
    name: 'Lead Nurture',
    icon: Users,
    description: 'Engage and convert existing leads',
    channels: ['Email', 'LinkedIn', 'Retargeting'],
    defaultTasks: ['Design email drip campaign', 'Create case studies', 'Setup retargeting ads']
  }
];

export default function AICampaignSetup({ workspaces, onComplete, onCancel }) {
  const [step, setStep] = useState(1); // 1: Choose preset, 2: Select client, 3: AI generation
  const [selectedPreset, setSelectedPreset] = useState(null);
  const [selectedClient, setSelectedClient] = useState('');
  const [industry, setIndustry] = useState('');
  const [loading, setLoading] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    goal: '',
    channels: [],
    tasks: []
  });

  const generateCampaignSuggestion = async () => {
    setLoading(true);
    try {
      const workspace = workspaces.find(w => w.id === selectedClient);

      const prompt = `You are a marketing strategist creating a ${selectedPreset.name} campaign for ${workspace?.name || 'a client'}.

Industry: ${industry || 'General Business'}
Client Description: ${workspace?.description || 'Marketing client'}
Campaign Type: ${selectedPreset.name}
Goal: ${selectedPreset.description}

Generate a comprehensive campaign plan with:
1. Campaign name (creative and specific, 3-5 words)
2. Detailed description (2-3 sentences explaining strategy and approach)
3. Specific goal statement (measurable and time-bound)
4. 5-7 initial tasks (specific action items to launch the campaign)
5. Target audience description
6. Key success metrics to track

Make it actionable and tailored to the industry.`;

      const response = await apiClient.post('/integrations/llm/invoke', {
        prompt,
        model: 'gpt-4',
        response_json_schema: {
          type: 'object',
          properties: {
            campaign_name: { type: 'string' },
            description: { type: 'string' },
            goal: { type: 'string' },
            tasks: {
              type: 'array',
              items: { type: 'string' }
            },
            target_audience: { type: 'string' },
            success_metrics: {
              type: 'array',
              items: { type: 'string' }
            }
          }
        }
      });

      const result = response.data || response;

      setAiSuggestion(result);
      setFormData({
        name: result.campaign_name,
        description: result.description,
        goal: result.goal,
        channels: selectedPreset.channels,
        tasks: result.tasks,
        target_audience: result.target_audience,
        success_metrics: result.success_metrics
      });

      toast.success('Campaign plan generated');
    } catch (error) {
      console.error('Failed to generate campaign:', error);
      toast.error(error.message || 'Failed to generate campaign plan');
    } finally {
      setLoading(false);
    }
  };

  const handlePresetSelect = (preset) => {
    setSelectedPreset(preset);
    setStep(2);
  };

  const handleClientSelect = () => {
    if (!selectedClient) {
      toast.error('Please select a client');
      return;
    }
    setStep(3);
    generateCampaignSuggestion();
  };

  const handleCreate = () => {
    if (!formData.name || !selectedClient) {
      toast.error('Please complete all required fields');
      return;
    }
    
    onComplete({
      ...formData,
      workspace_id: selectedClient,
      status: 'planning',
      priority: 'medium',
      progress: 0
    });
  };

  if (step === 1) {
    return (
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-white mb-2">Choose Campaign Type</h3>
          <p className="text-sm text-slate-400">Select a preset to get AI-powered campaign suggestions</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {CAMPAIGN_PRESETS.map((preset) => {
            const Icon = preset.icon;
            return (
              <motion.div
                key={preset.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Card
                  onClick={() => handlePresetSelect(preset)}
                  className="p-4 cursor-pointer hover:bg-slate-800 transition-all border-slate-700"
                  style={{ backgroundColor: '#1A1D29' }}
                >
                  <div className="flex items-start space-x-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-5 h-5 text-blue-400" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-sm text-white mb-1">{preset.name}</h4>
                      <p className="text-xs text-slate-400 mb-2">{preset.description}</p>
                      <div className="flex flex-wrap gap-1">
                        {preset.channels.slice(0, 3).map(channel => (
                          <Badge key={channel} className="bg-slate-700 text-slate-300 text-xs">
                            {channel}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>

        <div className="pt-4 border-t border-slate-800">
          <Button 
            variant="outline" 
            onClick={onCancel}
            className="border-slate-700 text-white hover:bg-slate-800"
          >
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  if (step === 2) {
    return (
      <div className="space-y-4">
        <div className="flex items-center space-x-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
            <selectedPreset.icon className="w-4 h-4 text-blue-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">{selectedPreset.name}</h3>
            <p className="text-xs text-slate-400">{selectedPreset.description}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Client *</Label>
            <Select value={selectedClient} onValueChange={setSelectedClient}>
              <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white">
                <SelectValue placeholder="Select client" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                {workspaces.map((ws) => (
                  <SelectItem key={ws.id} value={ws.id} className="text-slate-300 focus:bg-slate-700 focus:text-white">
                    {ws.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Industry (Optional)</Label>
            <Input
              placeholder="e.g., SaaS, E-commerce, Healthcare"
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              className="bg-slate-800/50 border-slate-700 text-white"
            />
            <p className="text-xs text-slate-500">Helps AI generate more relevant suggestions</p>
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-slate-800">
          <Button 
            variant="outline" 
            onClick={() => setStep(1)}
            className="border-slate-700 text-white hover:bg-slate-800"
          >
            Back
          </Button>
          <Button 
            onClick={handleClientSelect}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Generate Campaign Plan
          </Button>
        </div>
      </div>
    );
  }

  if (step === 3 && loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-4" />
        <p className="text-slate-400 text-sm">AI is crafting your campaign plan...</p>
      </div>
    );
  }

  if (step === 3 && aiSuggestion) {
    return (
      <div className="space-y-4 max-h-[70vh] overflow-y-auto">
        <div className="flex items-center space-x-2 mb-4">
          <CheckCircle2 className="w-5 h-5 text-green-500" />
          <h3 className="text-lg font-semibold text-white">Campaign Plan Ready</h3>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Campaign Name</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="bg-slate-800/50 border-slate-700 text-white"
            />
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="bg-slate-800/50 border-slate-700 text-white h-20"
            />
          </div>

          <div className="space-y-2">
            <Label>Goal</Label>
            <Textarea
              value={formData.goal}
              onChange={(e) => setFormData(prev => ({ ...prev, goal: e.target.value }))}
              className="bg-slate-800/50 border-slate-700 text-white h-16"
            />
          </div>

          <div className="space-y-2">
            <Label>Channels</Label>
            <div className="flex flex-wrap gap-2">
              {formData.channels.map(channel => (
                <Badge key={channel} className="bg-blue-500/20 text-blue-400">
                  {channel}
                </Badge>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Target Audience</Label>
            <p className="text-sm text-slate-300 p-3 rounded-lg bg-slate-800/50 border border-slate-700">
              {formData.target_audience}
            </p>
          </div>

          <div className="space-y-2">
            <Label>Initial Tasks ({formData.tasks.length})</Label>
            <div className="space-y-1.5">
              {formData.tasks.map((task, idx) => (
                <div key={idx} className="flex items-center space-x-2 text-sm p-2 rounded bg-slate-800/30">
                  <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                  <span className="text-slate-300">{task}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Success Metrics</Label>
            <div className="space-y-1">
              {formData.success_metrics.map((metric, idx) => (
                <div key={idx} className="text-xs text-slate-400 flex items-start space-x-2">
                  <span className="text-blue-400">•</span>
                  <span>{metric}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-slate-800 sticky bottom-0 bg-slate-900">
          <Button 
            variant="outline" 
            onClick={() => {
              setStep(2);
              setAiSuggestion(null);
            }}
            className="border-slate-700 text-white hover:bg-slate-800"
          >
            Back
          </Button>
          <Button 
            onClick={handleCreate}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Create Campaign
          </Button>
        </div>
      </div>
    );
  }

  return null;
}
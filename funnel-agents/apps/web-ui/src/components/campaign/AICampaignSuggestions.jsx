import { useState } from 'react';
import apiClient from '@/api/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Target, Users, TrendingUp, Lightbulb, ArrowRight, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

export default function AICampaignSuggestions({ client, campaigns = [], tasks = [] }) {
  const [suggestions, setSuggestions] = useState(null);
  const [loading, setLoading] = useState(false);

  const generateSuggestions = async () => {
    setLoading(true);
    try {
      const campaignPerformance = campaigns.map(c => ({
        name: c.name,
        status: c.status,
        taskCount: tasks.filter(t => t.campaign_id === c.id).length,
        successRate: tasks.filter(t => t.campaign_id === c.id && t.status === 'completed').length /
                     (tasks.filter(t => t.campaign_id === c.id).length || 1)
      }));

      const prompt = `You are a marketing strategist analyzing a client's campaign history.

Client: ${client?.name || 'New Client'}
Description: ${client?.description || 'No description'}
Past Campaigns: ${campaigns.length} campaigns

Campaign Performance:
${campaignPerformance.map(c => `- ${c.name}: ${Math.round(c.successRate * 100)}% success rate, ${c.taskCount} tasks`).join('\n')}

Based on this data, provide 3 strategic campaign suggestions for this client. For each suggestion, include:
1. Campaign name (creative and specific)
2. Target audience segment
3. Key channels (2-3)
4. Expected outcome
5. Why this will work for this client

Focus on data-driven strategies that build on past successes and address gaps.`;

      const response = await apiClient.post('/integrations/llm/invoke', {
        prompt,
        model: 'gpt-4',
        response_json_schema: {
          type: 'object',
          properties: {
            suggestions: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  campaign_name: { type: 'string' },
                  target_audience: { type: 'string' },
                  channels: { type: 'array', items: { type: 'string' } },
                  expected_outcome: { type: 'string' },
                  reasoning: { type: 'string' }
                }
              }
            }
          }
        }
      });

      const result = response.data || response;
      setSuggestions(result.suggestions);
      toast.success('AI suggestions generated');
    } catch (error) {
      console.error('Failed to generate suggestions:', error);
      toast.error(error.message || 'Failed to generate suggestions');
    } finally {
      setLoading(false);
    }
  };

  if (!suggestions && !loading) {
    return (
      <Card style={{ 
        backgroundColor: 'white',
        border: '1px solid #DBEAFE',
        borderRadius: '12px',
        padding: '24px'
      }}>
        <div className="flex items-start space-x-4">
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              AI Campaign Ideas
            </h3>
            <p className="text-sm text-slate-600 mb-4">
              Get personalized campaign suggestions based on {client?.name || 'this client'}'s history, 
              industry trends, and performance data.
            </p>
            <Button 
              onClick={generateSuggestions}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Generate Suggestions
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card style={{ 
        backgroundColor: 'white',
        border: '1px solid #E5E7EB',
        borderRadius: '12px',
        padding: '24px'
      }}>
        <div className="flex items-center justify-center space-x-3 py-8">
          <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full"></div>
          <p className="text-sm text-slate-600">Analyzing data and generating suggestions...</p>
        </div>
      </Card>
    );
  }

  const iconMap = {
    'LinkedIn': Users,
    'Email': Target,
    'Google Ads': TrendingUp,
    'Facebook': Users,
    'Instagram': Users,
    'Twitter': Users,
    'Content': Lightbulb,
    'Blog': Lightbulb
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Sparkles className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold text-slate-900">AI-Powered Campaign Ideas</h3>
        </div>
        <Button 
          variant="outline" 
          size="sm"
          onClick={generateSuggestions}
          disabled={loading}
          className="border-slate-300 text-slate-700 hover:bg-slate-50"
        >
          <RefreshCw className="w-3.5 h-3.5 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {suggestions?.map((suggestion, idx) => (
          <Card 
            key={idx}
            className="p-5 hover:shadow-md transition-all"
            style={{ 
              backgroundColor: 'white',
              border: '1px solid #E5E7EB',
              borderRadius: '12px'
            }}
          >
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h4 className="font-semibold text-slate-900">{suggestion.campaign_name}</h4>
                    <Badge className="bg-blue-100 text-blue-700 text-xs">
                      AI Suggested
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-600 mb-3">
                    {suggestion.reasoning}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-start space-x-2">
                    <Users className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Target Audience</p>
                      <p className="text-sm text-slate-900">{suggestion.target_audience}</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-2">
                    <Target className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Expected Outcome</p>
                      <p className="text-sm text-slate-900">{suggestion.expected_outcome}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Recommended Channels</p>
                  <div className="flex flex-wrap gap-2">
                    {suggestion.channels?.map((channel, i) => {
                      const Icon = iconMap[channel] || TrendingUp;
                      return (
                        <Badge 
                          key={i}
                          className="bg-slate-100 text-slate-700 border-slate-200 flex items-center space-x-1"
                        >
                          <Icon className="w-3 h-3" />
                          <span>{channel}</span>
                        </Badge>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200">
                <Button 
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700"
                  onClick={() => {
                    toast.success('Campaign template created - customize and launch');
                  }}
                >
                  Use This Idea
                  <ArrowRight className="w-3.5 h-3.5 ml-2" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
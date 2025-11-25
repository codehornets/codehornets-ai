import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Sparkles, FileText, Copy, Check, Plus, Wand2 } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';


import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

export default function AIContentGenerator({ campaign, client, content = [], tasks = [] }) {
  const [suggestions, setSuggestions] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedType, setSelectedType] = useState('blog_post');
  const [generatedContent, setGeneratedContent] = useState(null);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [contentToSave, setContentToSave] = useState(null);

  const generateIdeas = async () => {
    setLoading(true);
    try {
      const completedContent = content.filter(c => c.status === 'published' || c.status === 'approved');
      const successfulTasks = tasks.filter(t => t.status === 'completed');

      const prompt = `You are a content strategist for "${campaign.name}" campaign for ${client?.name || 'the client'}.

Campaign Goal: ${campaign.goal || 'Drive engagement and conversions'}
Campaign Description: ${campaign.description || 'Marketing campaign'}

Past Content Performance:
${completedContent.length > 0 ? completedContent.map(c => `- ${c.title} (${c.type}, ${c.channel})`).join('\n') : 'No previous content'}

Successful Tasks: ${successfulTasks.length}

Generate 5 content ideas optimized for this campaign. For each idea provide:
1. Content type (blog_post, social_post, email, ad_creative, video)
2. Title/Headline (compelling and specific)
3. Channel (linkedin, email, blog, google_ads, facebook, instagram)
4. Brief description
5. Target audience segment
6. Expected engagement metric

Focus on data-driven ideas that align with campaign goals.`;

      const result = await client.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: 'object',
          properties: {
            ideas: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  content_type: { type: 'string' },
                  title: { type: 'string' },
                  channel: { type: 'string' },
                  description: { type: 'string' },
                  target_audience: { type: 'string' },
                  expected_metric: { type: 'string' }
                }
              }
            }
          }
        }
      });

      setSuggestions(result.ideas);
      toast.success('Content ideas generated');
    } catch (error) {
      console.error('Failed to generate ideas:', error);
      toast.error('Failed to generate ideas');
    } finally {
      setLoading(false);
    }
  };

  const generateContent = async (idea) => {
    setLoading(true);
    try {
      const prompt = `Create ${idea.content_type.replace('_', ' ')} content for "${campaign.name}" campaign.

Title: ${idea.title}
Target Audience: ${idea.target_audience}
Channel: ${idea.channel}
Context: ${idea.description}

Generate:
1. 3 headline variations (optimized for ${idea.channel})
2. Full body copy (appropriate length for ${idea.content_type})
3. Call-to-action (compelling and relevant)

Make it engaging, actionable, and aligned with campaign goals.`;

      const result = await client.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: 'object',
          properties: {
            headlines: {
              type: 'array',
              items: { type: 'string' }
            },
            body: { type: 'string' },
            cta: { type: 'string' }
          }
        }
      });

      setGeneratedContent({ ...result, idea });
      toast.success('Content generated');
    } catch (error) {
      console.error('Failed to generate content:', error);
      toast.error('Failed to generate content');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text, index) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
    toast.success('Copied to clipboard');
  };

  const handleSaveContent = async () => {
    try {
      await client.entities.Content.create({
        title: contentToSave.selectedHeadline,
        type: contentToSave.idea.content_type,
        channel: contentToSave.idea.channel,
        body: contentToSave.body,
        brief: contentToSave.idea.description,
        status: 'draft',
        campaign_id: campaign.id,
        client_id: client?.id
      });
      
      toast.success('Content saved to library');
      setSaveModalOpen(false);
      setContentToSave(null);
    } catch (error) {
      console.error('Failed to save content:', error);
      toast.error('Failed to save content');
    }
  };

  if (!suggestions && !generatedContent) {
    return (
      <Card style={{ 
        backgroundColor: 'white',
        border: '1px solid #DBEAFE',
        borderRadius: '12px',
        padding: '24px'
      }}>
        <div className="flex items-start space-x-4">
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              AI Content Generator
            </h3>
            <p className="text-sm text-slate-600 mb-4">
              Generate content ideas, headlines, and full copy optimized for {campaign.name}
            </p>
            <Button 
              onClick={generateIdeas}
              disabled={loading}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              {loading ? 'Generating...' : 'Generate Content Ideas'}
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  if (generatedContent) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-slate-900">Generated Content</h3>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setGeneratedContent(null)}
            className="border-slate-300 text-slate-700"
          >
            Back to Ideas
          </Button>
        </div>

        <Card style={{ 
          backgroundColor: 'white',
          border: '1px solid #E5E7EB',
          borderRadius: '12px',
          padding: '20px'
        }}>
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-slate-900">Headline Variations</h4>
                <Badge className="bg-purple-100 text-purple-700">
                  {generatedContent.idea.channel}
                </Badge>
              </div>
              <div className="space-y-2">
                {generatedContent.headlines.map((headline, idx) => (
                  <div 
                    key={idx}
                    className="flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:border-purple-300 transition-colors"
                  >
                    <p className="text-sm text-slate-900 flex-1">{headline}</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(headline, `headline-${idx}`)}
                      className="ml-2"
                    >
                      {copiedIndex === `headline-${idx}` ? 
                        <Check className="w-4 h-4 text-green-600" /> : 
                        <Copy className="w-4 h-4" />
                      }
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-slate-900">Body Copy</h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(generatedContent.body, 'body')}
                >
                  {copiedIndex === 'body' ? 
                    <Check className="w-4 h-4 text-green-600" /> : 
                    <Copy className="w-4 h-4" />
                  }
                </Button>
              </div>
              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                <p className="text-sm text-slate-700 whitespace-pre-wrap">{generatedContent.body}</p>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-slate-900">Call-to-Action</h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(generatedContent.cta, 'cta')}
                >
                  {copiedIndex === 'cta' ? 
                    <Check className="w-4 h-4 text-green-600" /> : 
                    <Copy className="w-4 h-4" />
                  }
                </Button>
              </div>
              <div className="p-3 rounded-lg border-2 border-purple-200 bg-purple-50">
                <p className="text-sm font-medium text-purple-900">{generatedContent.cta}</p>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200">
              <Button 
                onClick={() => {
                  setContentToSave({
                    selectedHeadline: generatedContent.headlines[0],
                    body: generatedContent.body,
                    cta: generatedContent.cta,
                    idea: generatedContent.idea
                  });
                  setSaveModalOpen(true);
                }}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Save to Content Library
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Sparkles className="w-5 h-5 text-purple-600" />
          <h3 className="font-semibold text-slate-900">AI Content Ideas</h3>
        </div>
        <Button 
          variant="outline" 
          size="sm"
          onClick={generateIdeas}
          disabled={loading}
          className="border-slate-300 text-slate-700"
        >
          <Wand2 className="w-3.5 h-3.5 mr-2" />
          Regenerate
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {suggestions?.map((idea, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
          >
            <Card 
              className="p-4 hover:shadow-md transition-all"
              style={{ 
                backgroundColor: 'white',
                border: '1px solid #E5E7EB',
                borderRadius: '8px'
              }}
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h4 className="font-semibold text-sm text-slate-900">{idea.title}</h4>
                      <Badge className="bg-purple-100 text-purple-700 text-xs">
                        {idea.content_type.replace('_', ' ')}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-600">{idea.description}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-500">Channel:</span>
                    <span className="text-slate-900 font-medium ml-1">{idea.channel}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Audience:</span>
                    <span className="text-slate-900 font-medium ml-1">{idea.target_audience}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200">
                  <Button 
                    size="sm"
                    onClick={() => generateContent(idea)}
                    disabled={loading}
                    className="bg-purple-600 hover:bg-purple-700 h-7 text-xs"
                  >
                    <FileText className="w-3 h-3 mr-1" />
                    Generate Full Copy
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      <Dialog open={saveModalOpen} onOpenChange={setSaveModalOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white">
          <DialogHeader>
            <DialogTitle>Save Content</DialogTitle>
          </DialogHeader>
          {contentToSave && (
            <div className="space-y-4 py-4">
              <div>
                <label className="text-sm text-slate-400 mb-2 block">Headline</label>
                <Input
                  value={contentToSave.selectedHeadline}
                  onChange={(e) => setContentToSave(prev => ({ ...prev, selectedHeadline: e.target.value }))}
                  className="bg-slate-800/50 border-slate-700 text-white"
                />
              </div>
              <div>
                <label className="text-sm text-slate-400 mb-2 block">Body</label>
                <Textarea
                  value={contentToSave.body}
                  onChange={(e) => setContentToSave(prev => ({ ...prev, body: e.target.value }))}
                  className="bg-slate-800/50 border-slate-700 text-white h-32"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSaveModalOpen(false)} className="border-slate-700 text-white hover:bg-slate-800">
              Cancel
            </Button>
            <Button onClick={handleSaveContent} className="bg-purple-600 hover:bg-purple-700">
              Save to Library
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
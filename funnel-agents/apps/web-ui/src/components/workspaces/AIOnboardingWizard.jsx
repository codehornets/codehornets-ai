import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  CheckCircle2, ArrowRight, ArrowLeft, Target, Building2, 
  Sparkles, Lightbulb, AlertTriangle,
  Users, Rocket, Loader2
} from 'lucide-react';
import client from '@/api/client';
import { motion, AnimatePresence } from 'framer-motion';

export default function AIOnboardingWizard({ open, onOpenChange, onComplete }) {
  const [step, setStep] = useState(1);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: 'blue',
    primary_contact: '',
    industry: '',
    goals: [],
    challenges: '',
  });

  const colorOptions = {
    blue: 'from-blue-500 to-cyan-500',
    purple: 'from-purple-500 to-pink-500',
    green: 'from-green-500 to-emerald-500',
    orange: 'from-orange-500 to-red-500',
    yellow: 'from-yellow-500 to-amber-500',
  };

  const industries = [
    { value: 'technology', label: 'Technology / SaaS' },
    { value: 'healthcare', label: 'Healthcare' },
    { value: 'finance', label: 'Finance / Banking' },
    { value: 'retail', label: 'Retail / E-commerce' },
    { value: 'real_estate', label: 'Real Estate' },
    { value: 'education', label: 'Education' },
    { value: 'hospitality', label: 'Hospitality / Travel' },
    { value: 'manufacturing', label: 'Manufacturing' },
    { value: 'professional_services', label: 'Professional Services' },
    { value: 'other', label: 'Other' },
  ];

  const goalOptions = [
    'Generate more leads',
    'Increase brand awareness',
    'Launch new product',
    'Content marketing',
    'Social media growth',
    'SEO improvement',
    'Email marketing',
    'Customer retention',
  ];

  const handleNext = async () => {
    if (step === 3 && !analysis) {
      // Generate AI analysis before showing recommendations
      await generateAnalysis();
    }
    if (step < 4) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const generateAnalysis = async () => {
    setAnalyzing(true);
    try {
      const response = await client.functions.invoke('analyzeClientOnboarding', {
        client_data: formData
      });
      setAnalysis(response.data.analysis);
    } catch (error) {
      console.error('Failed to generate analysis:', error);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleComplete = () => {
    onComplete({ ...formData, analysis });
    resetForm();
  };

  const resetForm = () => {
    setStep(1);
    setAnalysis(null);
    setFormData({
      name: '',
      description: '',
      color: 'blue',
      primary_contact: '',
      industry: '',
      goals: [],
      challenges: '',
    });
  };

  const toggleGoal = (goal) => {
    setFormData(prev => ({
      ...prev,
      goals: prev.goals.includes(goal)
        ? prev.goals.filter(g => g !== goal)
        : [...prev.goals, goal]
    }));
  };

  const canProceed = () => {
    if (step === 1) return formData.name.trim() && formData.industry;
    if (step === 2) return formData.goals.length > 0;
    if (step === 3) return true;
    if (step === 4) return analysis;
    return true;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" style={{ 
        backgroundColor: 'var(--bg-card)', 
        border: '1px solid var(--border-subtle)' 
      }}>
        <DialogHeader>
          <DialogTitle style={{ color: 'var(--text-primary)' }}>
            {step === 1 && '🎯 New Client Onboarding'}
            {step === 2 && '🚀 Goals & Objectives'}
            {step === 3 && '💡 Share Challenges'}
            {step === 4 && '✨ AI Recommendations'}
          </DialogTitle>
          <DialogDescription style={{ color: 'var(--text-secondary)' }}>
            {step === 1 && 'Tell us about your new client'}
            {step === 2 && 'What does this client want to achieve?'}
            {step === 3 && 'Help us understand their current situation'}
            {step === 4 && 'Personalized strategy powered by AI'}
          </DialogDescription>
        </DialogHeader>

        {/* Progress */}
        <div className="flex items-center justify-between mb-6">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className="flex items-center flex-1">
              <div 
                className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all`}
                style={{
                  backgroundColor: s <= step ? 'var(--accent)' : 'var(--bg-surface)',
                  borderColor: s <= step ? 'var(--accent)' : 'var(--border-subtle)',
                  color: s <= step ? '#ffffff' : 'var(--text-muted)'
                }}
              >
                {s < step ? <CheckCircle2 className="w-4 h-4" /> : s}
              </div>
              {s < 4 && (
                <div 
                  className="flex-1 h-1 mx-2 transition-all"
                  style={{ backgroundColor: s < step ? 'var(--accent)' : 'var(--border-subtle)' }}
                />
              )}
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* Step 1: Basic Info */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div className="text-center mb-6">
                <Building2 className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--accent)' }} />
              </div>
              
              <div className="space-y-2">
                <Label style={{ color: 'var(--text-primary)' }}>Client Name *</Label>
                <Input
                  placeholder="e.g., Acme Corp"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  style={{ 
                    backgroundColor: 'var(--bg-surface)', 
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-primary)'
                  }}
                  autoFocus
                />
              </div>

              <div className="space-y-2">
                <Label style={{ color: 'var(--text-primary)' }}>Industry *</Label>
                <Select value={formData.industry} onValueChange={(v) => setFormData(prev => ({ ...prev, industry: v }))}>
                  <SelectTrigger style={{ 
                    backgroundColor: 'var(--bg-surface)', 
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-primary)'
                  }}>
                    <SelectValue placeholder="Select industry" />
                  </SelectTrigger>
                  <SelectContent style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
                    {industries.map((industry) => (
                      <SelectItem key={industry.value} value={industry.value} style={{ color: 'var(--text-primary)' }}>
                        {industry.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label style={{ color: 'var(--text-primary)' }}>Description</Label>
                <Textarea
                  placeholder="Brief description of the client and what they do"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  style={{ 
                    backgroundColor: 'var(--bg-surface)', 
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-primary)'
                  }}
                  className="h-20"
                />
              </div>

              <div className="space-y-2">
                <Label style={{ color: 'var(--text-primary)' }}>Primary Contact</Label>
                <Input
                  placeholder="e.g., Marketing Team or John Doe"
                  value={formData.primary_contact}
                  onChange={(e) => setFormData(prev => ({ ...prev, primary_contact: e.target.value }))}
                  style={{ 
                    backgroundColor: 'var(--bg-surface)', 
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-primary)'
                  }}
                />
              </div>

              <div className="space-y-2">
                <Label style={{ color: 'var(--text-primary)' }}>Workspace Color</Label>
                <div className="flex items-center space-x-2">
                  {Object.keys(colorOptions).map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, color }))}
                      className={`relative w-10 h-10 rounded-lg bg-gradient-to-br ${colorOptions[color]} transition-all ${
                        formData.color === color ? 'ring-2 ring-offset-2 scale-110' : 'hover:scale-105'
                      }`}
                      style={{ ringColor: 'var(--accent)', ringOffsetColor: 'var(--bg-card)' }}
                    >
                      {formData.color === color && (
                        <CheckCircle2 className="w-5 h-5 text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 2: Goals */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div className="text-center mb-6">
                <Target className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--accent)' }} />
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  Select primary goals - this will help us recommend the right strategy
                </p>
              </div>

              <div className="space-y-2">
                <Label style={{ color: 'var(--text-primary)' }}>Primary Goals *</Label>
                <div className="grid grid-cols-2 gap-3 mt-2">
                  {goalOptions.map((goal) => (
                    <Card
                      key={goal}
                      className="p-4 cursor-pointer transition-all hover:scale-[1.02]"
                      style={{
                        backgroundColor: formData.goals.includes(goal) ? 'rgba(59, 130, 246, 0.1)' : 'var(--bg-surface)',
                        border: `2px solid ${formData.goals.includes(goal) ? 'var(--accent)' : 'var(--border-subtle)'}`,
                      }}
                      onClick={() => toggleGoal(goal)}
                    >
                      <div className="flex items-center space-x-2">
                        <div 
                          className="w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0"
                          style={{ 
                            borderColor: formData.goals.includes(goal) ? 'var(--accent)' : 'var(--border-subtle)',
                            backgroundColor: formData.goals.includes(goal) ? 'var(--accent)' : 'transparent'
                          }}
                        >
                          {formData.goals.includes(goal) && <CheckCircle2 className="w-4 h-4 text-white" />}
                        </div>
                        <span className="text-sm" style={{ color: 'var(--text-primary)' }}>{goal}</span>
                      </div>
                    </Card>
                  ))}
                </div>
                <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
                  {formData.goals.length} goal{formData.goals.length !== 1 ? 's' : ''} selected
                </p>
              </div>
            </motion.div>
          )}

          {/* Step 3: Challenges */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div className="text-center mb-6">
                <AlertTriangle className="w-12 h-12 mx-auto mb-3 text-orange-400" />
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  Understanding challenges helps us provide better recommendations
                </p>
              </div>

              <div className="space-y-2">
                <Label style={{ color: 'var(--text-primary)' }}>Current Challenges (Optional)</Label>
                <Textarea
                  placeholder="What are their biggest marketing challenges? What have they tried before? Any specific pain points?"
                  value={formData.challenges}
                  onChange={(e) => setFormData(prev => ({ ...prev, challenges: e.target.value }))}
                  style={{ 
                    backgroundColor: 'var(--bg-surface)', 
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-primary)'
                  }}
                  className="h-32"
                />
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  The more context you provide, the better our AI can tailor recommendations
                </p>
              </div>
            </motion.div>
          )}

          {/* Step 4: AI Recommendations */}
          {step === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              {analyzing ? (
                <div className="text-center py-12">
                  <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin text-purple-400" />
                  <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                    Analyzing Your Client...
                  </h3>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    Our AI is creating a personalized onboarding strategy
                  </p>
                </div>
              ) : analysis ? (
                <div className="space-y-4">
                  <div className="flex items-center space-x-2 mb-4">
                    <Sparkles className="w-5 h-5 text-purple-400" />
                    <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                      Personalized Recommendations
                    </h3>
                  </div>

                  {/* Summary */}
                  {analysis.summary && (
                    <Card className="p-4" style={{ 
                      backgroundColor: 'var(--bg-surface)', 
                      border: '1px solid var(--border-subtle)' 
                    }}>
                      <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                        {analysis.summary}
                      </p>
                    </Card>
                  )}

                  {/* Recommended Agents */}
                  {analysis.recommended_agents?.length > 0 && (
                    <div>
                      <div className="flex items-center space-x-2 mb-2">
                        <Users className="w-4 h-4 text-blue-400" />
                        <h4 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                          Recommended AI Agents ({analysis.recommended_agents.length})
                        </h4>
                      </div>
                      <div className="space-y-2">
                        {analysis.recommended_agents.slice(0, 3).map((agent, idx) => (
                          <Card key={idx} className="p-3" style={{ 
                            backgroundColor: 'var(--bg-card)', 
                            border: '1px solid var(--border-subtle)' 
                          }}>
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-1">
                                  <span className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>
                                    {agent.name}
                                  </span>
                                  <Badge className={`text-xs ${
                                    agent.priority === 'high' ? 'bg-red-500/20 text-red-400' :
                                    agent.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                                    'bg-blue-500/20 text-blue-400'
                                  }`}>
                                    {agent.priority}
                                  </Badge>
                                </div>
                                <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
                                  {agent.domain} • {agent.role}
                                </p>
                                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                                  {agent.rationale}
                                </p>
                              </div>
                            </div>
                          </Card>
                        ))}
                        {analysis.recommended_agents.length > 3 && (
                          <p className="text-xs text-center" style={{ color: 'var(--text-muted)' }}>
                            +{analysis.recommended_agents.length - 3} more agents will be set up
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Quick Wins */}
                  {analysis.quick_wins?.length > 0 && (
                    <div>
                      <div className="flex items-center space-x-2 mb-2">
                        <Rocket className="w-4 h-4 text-green-400" />
                        <h4 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                          Quick Wins (First 30 Days)
                        </h4>
                      </div>
                      <div className="space-y-2">
                        {analysis.quick_wins.map((win, idx) => (
                          <div key={idx} className="flex items-start space-x-2 text-sm">
                            <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                            <div>
                              <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
                                {win.action}
                              </span>
                              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                                {win.impact} • {win.timeline}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Campaign Strategies */}
                  {analysis.campaign_strategies?.length > 0 && (
                    <div>
                      <div className="flex items-center space-x-2 mb-2">
                        <Lightbulb className="w-4 h-4 text-yellow-400" />
                        <h4 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                          Suggested Campaigns
                        </h4>
                      </div>
                      <div className="space-y-2">
                        {analysis.campaign_strategies.slice(0, 2).map((campaign, idx) => (
                          <Card key={idx} className="p-3" style={{ 
                            backgroundColor: 'var(--bg-card)', 
                            border: '1px solid var(--border-subtle)' 
                          }}>
                            <h5 className="font-medium text-sm mb-1" style={{ color: 'var(--text-primary)' }}>
                              {campaign.name}
                            </h5>
                            <p className="text-xs mb-2" style={{ color: 'var(--text-secondary)' }}>
                              {campaign.description}
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {campaign.key_channels?.map((channel, i) => (
                                <Badge key={i} variant="outline" className="text-xs" style={{ 
                                  borderColor: 'var(--border-subtle)', 
                                  color: 'var(--text-muted)' 
                                }}>
                                  {channel}
                                </Badge>
                              ))}
                            </div>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : null}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Actions */}
        <div className="flex items-center justify-between pt-4" style={{ borderTop: '1px solid var(--border-subtle)' }}>
          <Button
            variant="ghost"
            onClick={handleBack}
            disabled={step === 1 || analyzing}
            style={{ color: 'var(--text-secondary)' }}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          {step < 4 ? (
            <Button
              onClick={handleNext}
              disabled={!canProceed() || analyzing}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {step === 3 ? (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Analyze with AI
                </>
              ) : (
                <>
                  Continue
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          ) : (
            <Button
              onClick={handleComplete}
              disabled={!analysis || analyzing}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            >
              <Rocket className="w-4 h-4 mr-2" />
              Complete Setup
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
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
import { CheckCircle2, ArrowRight, ArrowLeft, Target, Building2, Zap } from 'lucide-react';

export default function ClientOnboardingModal({ open, onOpenChange, onComplete }) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: 'blue',
    primary_contact: '',
    industry: '',
    goals: [],
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

  const handleNext = () => {
    if (step < 3) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleComplete = () => {
    onComplete(formData);
    setStep(1);
    setFormData({
      name: '',
      description: '',
      color: 'blue',
      primary_contact: '',
      industry: '',
      goals: [],
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
    if (step === 1) return formData.name.trim();
    if (step === 2) return formData.industry;
    if (step === 3) return formData.goals.length > 0;
    return true;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl" style={{ 
        backgroundColor: 'var(--bg-card)', 
        border: '1px solid var(--border-subtle)' 
      }}>
        <DialogHeader>
          <DialogTitle style={{ color: 'var(--text-primary)' }}>
            {step === 1 && 'Add New Client'}
            {step === 2 && 'Client Details'}
            {step === 3 && 'Set Goals'}
          </DialogTitle>
          <DialogDescription style={{ color: 'var(--text-secondary)' }}>
            {step === 1 && 'Create a client workspace with automated setup'}
            {step === 2 && 'Help us customize the experience'}
            {step === 3 && 'Choose what you want to achieve'}
          </DialogDescription>
        </DialogHeader>

        {/* Progress */}
        <div className="flex items-center justify-between mb-6">
          {[1, 2, 3].map((s) => (
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
              {s < 3 && (
                <div 
                  className="flex-1 h-1 mx-2 transition-all"
                  style={{ backgroundColor: s < step ? 'var(--accent)' : 'var(--border-subtle)' }}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: Basic Info */}
        {step === 1 && (
          <div className="space-y-4">
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
              <Label style={{ color: 'var(--text-primary)' }}>Description</Label>
              <Textarea
                placeholder="Brief description of the client and project scope"
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
          </div>
        )}

        {/* Step 2: Industry */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <Target className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--accent)' }} />
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                This helps us recommend the right agents and templates
              </p>
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
          </div>
        )}

        {/* Step 3: Goals */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <Zap className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--accent)' }} />
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Select goals to auto-configure agents and campaign templates
              </p>
            </div>

            <div className="space-y-2">
              <Label style={{ color: 'var(--text-primary)' }}>Primary Goals *</Label>
              <div className="grid grid-cols-2 gap-3 mt-2">
                {goalOptions.map((goal) => (
                  <Card
                    key={goal}
                    className="p-4 cursor-pointer transition-all"
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
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-4" style={{ borderTop: '1px solid var(--border-subtle)' }}>
          <Button
            variant="ghost"
            onClick={handleBack}
            disabled={step === 1}
            style={{ color: 'var(--text-secondary)' }}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          {step < 3 ? (
            <Button
              onClick={handleNext}
              disabled={!canProceed()}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Continue
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleComplete}
              disabled={!canProceed()}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Create & Setup
              <Zap className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
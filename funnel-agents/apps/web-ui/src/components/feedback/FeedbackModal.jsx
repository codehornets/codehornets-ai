import { useState } from 'react';
import client from '@/api/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { triggerFeedbackWorkflows } from './AutomatedWorkflowTrigger';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Star, ThumbsUp, ThumbsDown, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export default function FeedbackModal({ 
  open, 
  onOpenChange, 
  clientId, 
  feedbackType,
  relatedId,
  title = "Rate this AI output"
}) {
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    rating: 0,
    usefulness_score: 0,
    accuracy_score: 0,
    actionability_score: 0,
    comment: '',
    what_worked: '',
    what_missed: '',
    improvement_suggestions: '',
    acted_upon: false,
    outcome: '',
  });

  const submitMutation = useMutation({
    mutationFn: async (data) => {
      const user = await client.auth.me();
      const feedback = await client.entities.ClientFeedback.create({
        ...data,
        client_id: clientId,
        feedback_type: feedbackType,
        related_id: relatedId,
        submitted_by: user.email,
      });
      
      // Trigger any workflows listening for feedback
      await triggerFeedbackWorkflows(feedback);
      
      return feedback;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-feedback'] });
      toast.success('Thank you for your feedback!');
      onOpenChange(false);
      resetForm();
    },
  });

  const resetForm = () => {
    setStep(1);
    setFormData({
      rating: 0,
      usefulness_score: 0,
      accuracy_score: 0,
      actionability_score: 0,
      comment: '',
      what_worked: '',
      what_missed: '',
      improvement_suggestions: '',
      acted_upon: false,
      outcome: '',
    });
  };

  const handleSubmit = () => {
    if (formData.rating === 0) {
      toast.error('Please provide a rating');
      return;
    }
    submitMutation.mutate(formData);
  };

  const StarRating = ({ value, onChange, label }) => (
    <div className="space-y-2">
      <Label style={{ color: 'var(--text-primary)' }}>{label}</Label>
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className="focus:outline-none transition-transform hover:scale-110"
          >
            <Star 
              className={`w-8 h-8 ${
                star <= value 
                  ? 'fill-yellow-400 text-yellow-400' 
                  : 'text-slate-600'
              }`}
            />
          </button>
        ))}
        <span className="ml-2 text-sm" style={{ color: 'var(--text-muted)' }}>
          {value > 0 ? `${value}/5` : 'Not rated'}
        </span>
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl" style={{ 
        backgroundColor: 'var(--bg-card)', 
        border: '1px solid var(--border-subtle)' 
      }}>
        <DialogHeader>
          <DialogTitle style={{ color: 'var(--text-primary)' }}>
            {title}
          </DialogTitle>
          <DialogDescription style={{ color: 'var(--text-secondary)' }}>
            Your feedback helps us improve AI recommendations
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {step === 1 && (
            <>
              {/* Overall Rating */}
              <StarRating
                label="Overall Rating *"
                value={formData.rating}
                onChange={(val) => setFormData(prev => ({ ...prev, rating: val }))}
              />

              {/* Detailed Scores */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StarRating
                  label="Usefulness"
                  value={formData.usefulness_score}
                  onChange={(val) => setFormData(prev => ({ ...prev, usefulness_score: val }))}
                />
                <StarRating
                  label="Accuracy"
                  value={formData.accuracy_score}
                  onChange={(val) => setFormData(prev => ({ ...prev, accuracy_score: val }))}
                />
                <StarRating
                  label="Actionability"
                  value={formData.actionability_score}
                  onChange={(val) => setFormData(prev => ({ ...prev, actionability_score: val }))}
                />
              </div>

              {/* Quick Comment */}
              <div className="space-y-2">
                <Label style={{ color: 'var(--text-primary)' }}>Quick Comment (Optional)</Label>
                <Textarea
                  placeholder="Share your thoughts..."
                  value={formData.comment}
                  onChange={(e) => setFormData(prev => ({ ...prev, comment: e.target.value }))}
                  style={{ 
                    backgroundColor: 'var(--bg-surface)', 
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-primary)'
                  }}
                  className="h-20"
                />
              </div>
            </>
          )}

          {step === 2 && (
            <>
              {/* Detailed Feedback */}
              <div className="space-y-2">
                <Label style={{ color: 'var(--text-primary)' }}>What worked well?</Label>
                <Textarea
                  placeholder="What aspects were helpful or accurate?"
                  value={formData.what_worked}
                  onChange={(e) => setFormData(prev => ({ ...prev, what_worked: e.target.value }))}
                  style={{ 
                    backgroundColor: 'var(--bg-surface)', 
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-primary)'
                  }}
                  className="h-24"
                />
              </div>

              <div className="space-y-2">
                <Label style={{ color: 'var(--text-primary)' }}>What was missing or incorrect?</Label>
                <Textarea
                  placeholder="What could have been better?"
                  value={formData.what_missed}
                  onChange={(e) => setFormData(prev => ({ ...prev, what_missed: e.target.value }))}
                  style={{ 
                    backgroundColor: 'var(--bg-surface)', 
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-primary)'
                  }}
                  className="h-24"
                />
              </div>

              <div className="space-y-2">
                <Label style={{ color: 'var(--text-primary)' }}>Suggestions for improvement</Label>
                <Textarea
                  placeholder="How can we make this better?"
                  value={formData.improvement_suggestions}
                  onChange={(e) => setFormData(prev => ({ ...prev, improvement_suggestions: e.target.value }))}
                  style={{ 
                    backgroundColor: 'var(--bg-surface)', 
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-primary)'
                  }}
                  className="h-24"
                />
              </div>

              {/* Action Taken */}
              <div className="space-y-2">
                <Label style={{ color: 'var(--text-primary)' }}>Did you act on these recommendations?</Label>
                <div className="flex items-center space-x-4">
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, acted_upon: true }))}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg border-2 transition-all ${
                      formData.acted_upon
                        ? 'border-green-500 bg-green-500/10'
                        : 'border-slate-700 hover:border-slate-600'
                    }`}
                  >
                    <ThumbsUp className={`w-5 h-5 ${formData.acted_upon ? 'text-green-400' : 'text-slate-500'}`} />
                    <span style={{ color: formData.acted_upon ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                      Yes
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, acted_upon: false, outcome: '' }))}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg border-2 transition-all ${
                      !formData.acted_upon
                        ? 'border-red-500 bg-red-500/10'
                        : 'border-slate-700 hover:border-slate-600'
                    }`}
                  >
                    <ThumbsDown className={`w-5 h-5 ${!formData.acted_upon ? 'text-red-400' : 'text-slate-500'}`} />
                    <span style={{ color: !formData.acted_upon ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                      No
                    </span>
                  </button>
                </div>
              </div>

              {formData.acted_upon && (
                <div className="space-y-2">
                  <Label style={{ color: 'var(--text-primary)' }}>What was the outcome?</Label>
                  <Textarea
                    placeholder="What results did you see?"
                    value={formData.outcome}
                    onChange={(e) => setFormData(prev => ({ ...prev, outcome: e.target.value }))}
                    style={{ 
                      backgroundColor: 'var(--bg-surface)', 
                      border: '1px solid var(--border-subtle)',
                      color: 'var(--text-primary)'
                    }}
                    className="h-20"
                  />
                </div>
              )}
            </>
          )}
        </div>

        <DialogFooter>
          {step === 2 && (
            <Button 
              variant="outline" 
              onClick={() => setStep(1)}
            >
              Back
            </Button>
          )}
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          {step === 1 ? (
            <Button 
              onClick={() => setStep(2)}
              disabled={formData.rating === 0}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Continue
            </Button>
          ) : (
            <Button 
              onClick={handleSubmit}
              disabled={submitMutation.isLoading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Submit Feedback
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
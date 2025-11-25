import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ThumbsUp, ThumbsDown, Star } from 'lucide-react';

export default function AgentFeedbackModal({ open, onOpenChange, agent, task, onSubmitFeedback }) {
  const [feedbackType, setFeedbackType] = useState(null);
  const [rating, setRating] = useState(0);
  const [aspects, setAspects] = useState({
    accuracy: 0,
    completeness: 0,
    relevance: 0,
    format: 0,
    timeliness: 0
  });
  const [comments, setComments] = useState('');
  const [selectedImprovements, setSelectedImprovements] = useState([]);

  const improvementOptions = [
    'More detailed explanations',
    'Better formatting',
    'Include more sources',
    'Be more concise',
    'Add examples',
    'Better follow instructions',
    'Ask clarifying questions',
    'Provide alternatives'
  ];

  const handleSubmit = () => {
    if (!feedbackType || rating === 0) return;

    onSubmitFeedback({
      agent_id: agent.id,
      task_id: task.id,
      feedback_type: feedbackType,
      rating,
      aspects,
      comments,
      suggested_improvements: selectedImprovements
    });

    // Reset form
    setFeedbackType(null);
    setRating(0);
    setAspects({ accuracy: 0, completeness: 0, relevance: 0, format: 0, timeliness: 0 });
    setComments('');
    setSelectedImprovements([]);
    onOpenChange(false);
  };

  const toggleImprovement = (improvement) => {
    setSelectedImprovements(prev =>
      prev.includes(improvement)
        ? prev.filter(i => i !== improvement)
        : [...prev, improvement]
    );
  };

  const aspectLabels = {
    accuracy: 'Accuracy',
    completeness: 'Completeness',
    relevance: 'Relevance',
    format: 'Format & Style',
    timeliness: 'Speed'
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-2xl">
        <DialogHeader>
          <DialogTitle>Provide Feedback for {agent.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Overall Rating */}
          <div className="space-y-3">
            <Label>Overall Performance</Label>
            <div className="flex items-center justify-between p-4 bg-slate-800/30 rounded-lg">
              <button
                onClick={() => setFeedbackType('negative')}
                className={`p-3 rounded-lg transition-all ${
                  feedbackType === 'negative'
                    ? 'bg-red-500/20 text-red-400 border-2 border-red-500/50'
                    : 'bg-slate-700/50 text-slate-400 hover:bg-slate-700'
                }`}
              >
                <ThumbsDown className="w-6 h-6" />
              </button>
              
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => {
                      setRating(star);
                      setFeedbackType(star >= 4 ? 'positive' : star <= 2 ? 'negative' : 'neutral');
                    }}
                    className="transition-transform hover:scale-110"
                  >
                    <Star
                      className={`w-8 h-8 ${
                        star <= rating
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-slate-600'
                      }`}
                    />
                  </button>
                ))}
              </div>

              <button
                onClick={() => setFeedbackType('positive')}
                className={`p-3 rounded-lg transition-all ${
                  feedbackType === 'positive'
                    ? 'bg-green-500/20 text-green-400 border-2 border-green-500/50'
                    : 'bg-slate-700/50 text-slate-400 hover:bg-slate-700'
                }`}
              >
                <ThumbsUp className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Detailed Aspects */}
          <div className="space-y-3">
            <Label>Detailed Ratings</Label>
            <div className="space-y-3">
              {Object.entries(aspects).map(([key, value]) => (
                <div key={key} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-400">{aspectLabels[key]}</span>
                    <span className="text-sm text-white">{value}/5</span>
                  </div>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((score) => (
                      <button
                        key={score}
                        onClick={() => setAspects(prev => ({ ...prev, [key]: score }))}
                        className={`flex-1 h-2 rounded transition-colors ${
                          score <= value ? 'bg-blue-500' : 'bg-slate-700'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Suggested Improvements */}
          <div className="space-y-3">
            <Label>What could be improved?</Label>
            <div className="flex flex-wrap gap-2">
              {improvementOptions.map((improvement) => (
                <button
                  key={improvement}
                  onClick={() => toggleImprovement(improvement)}
                  className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                    selectedImprovements.includes(improvement)
                      ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                      : 'bg-slate-800/50 text-slate-400 border border-slate-700 hover:border-slate-600'
                  }`}
                >
                  {improvement}
                </button>
              ))}
            </div>
          </div>

          {/* Comments */}
          <div className="space-y-2">
            <Label>Additional Comments (Optional)</Label>
            <Textarea
              placeholder="Share specific details about what worked well or needs improvement..."
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              className="bg-slate-800/50 border-slate-700 text-white h-24"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-slate-700 text-white hover:bg-slate-800"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!feedbackType || rating === 0}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Submit Feedback
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
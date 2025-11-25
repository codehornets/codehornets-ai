import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, X, CheckSquare } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function CreateTemplateModal({ open, onOpenChange, onSave, editingTemplate = null }) {
  const [formData, setFormData] = useState(editingTemplate || {
    name: '',
    description: '',
    category: 'custom',
    timeline_weeks: 4,
    difficulty_level: 'intermediate',
    tasks_blueprint: [],
    milestones: [],
    agents_suggested: [],
  });

  const [newTask, setNewTask] = useState({ title: '', phase: 'planning' });
  const [newMilestone, setNewMilestone] = useState({ name: '', week: 1 });

  const handleAddTask = () => {
    if (!newTask.title) return;
    setFormData(prev => ({
      ...prev,
      tasks_blueprint: [...prev.tasks_blueprint, { ...newTask }]
    }));
    setNewTask({ title: '', phase: 'planning' });
  };

  const handleRemoveTask = (idx) => {
    setFormData(prev => ({
      ...prev,
      tasks_blueprint: prev.tasks_blueprint.filter((_, i) => i !== idx)
    }));
  };

  const handleAddMilestone = () => {
    if (!newMilestone.name) return;
    setFormData(prev => ({
      ...prev,
      milestones: [...prev.milestones, { ...newMilestone }]
    }));
    setNewMilestone({ name: '', week: 1 });
  };

  const handleRemoveMilestone = (idx) => {
    setFormData(prev => ({
      ...prev,
      milestones: prev.milestones.filter((_, i) => i !== idx)
    }));
  };

  const handleSubmit = () => {
    if (!formData.name) return;
    onSave(formData);
    setFormData({
      name: '',
      description: '',
      category: 'custom',
      timeline_weeks: 4,
      difficulty_level: 'intermediate',
      tasks_blueprint: [],
      milestones: [],
      agents_suggested: [],
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingTemplate ? 'Edit Template' : 'Create Custom Template'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Basic Info */}
          <div className="space-y-2">
            <Label>Template Name</Label>
            <Input
              placeholder="e.g., Product Launch Template"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="bg-slate-800/50 border-slate-700 text-white"
            />
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              placeholder="What is this template for?"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="bg-slate-800/50 border-slate-700 text-white h-20"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="product_launch">Product Launch</SelectItem>
                  <SelectItem value="content_marketing">Content Marketing</SelectItem>
                  <SelectItem value="lead_generation">Lead Generation</SelectItem>
                  <SelectItem value="brand_awareness">Brand Awareness</SelectItem>
                  <SelectItem value="seo_optimization">SEO Optimization</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Duration (weeks)</Label>
              <Input
                type="number"
                value={formData.timeline_weeks}
                onChange={(e) => setFormData({ ...formData, timeline_weeks: parseInt(e.target.value) || 0 })}
                className="bg-slate-800/50 border-slate-700 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label>Difficulty</Label>
              <Select value={formData.difficulty_level} onValueChange={(v) => setFormData({ ...formData, difficulty_level: v })}>
                <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Tasks */}
          <div className="space-y-3 pt-4 border-t border-slate-700">
            <Label className="flex items-center space-x-2">
              <CheckSquare className="w-4 h-4" />
              <span>Tasks Blueprint</span>
            </Label>
            
            <div className="flex gap-2">
              <Input
                placeholder="Task title..."
                value={newTask.title}
                onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                onKeyPress={(e) => e.key === 'Enter' && handleAddTask()}
                className="flex-1 bg-slate-800/50 border-slate-700 text-white"
              />
              <Select value={newTask.phase} onValueChange={(v) => setNewTask({ ...newTask, phase: v })}>
                <SelectTrigger className="w-32 bg-slate-800/50 border-slate-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="planning">Planning</SelectItem>
                  <SelectItem value="execution">Execution</SelectItem>
                  <SelectItem value="review">Review</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handleAddTask} size="icon" className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            {formData.tasks_blueprint.length > 0 && (
              <div className="space-y-2">
                {formData.tasks_blueprint.map((task, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-slate-800/30 p-2 rounded">
                    <div className="flex items-center space-x-2 flex-1">
                      <CheckSquare className="w-3 h-3 text-slate-500" />
                      <span className="text-sm text-white">{task.title}</span>
                      <Badge className="text-xs bg-slate-700">{task.phase}</Badge>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveTask(idx)}
                      className="h-6 w-6 text-slate-500 hover:text-red-400"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Milestones */}
          <div className="space-y-3 pt-4 border-t border-slate-700">
            <Label>Milestones</Label>
            
            <div className="flex gap-2">
              <Input
                placeholder="Milestone name..."
                value={newMilestone.name}
                onChange={(e) => setNewMilestone({ ...newMilestone, name: e.target.value })}
                onKeyPress={(e) => e.key === 'Enter' && handleAddMilestone()}
                className="flex-1 bg-slate-800/50 border-slate-700 text-white"
              />
              <Input
                type="number"
                placeholder="Week"
                value={newMilestone.week}
                onChange={(e) => setNewMilestone({ ...newMilestone, week: parseInt(e.target.value) || 1 })}
                className="w-24 bg-slate-800/50 border-slate-700 text-white"
              />
              <Button onClick={handleAddMilestone} size="icon" className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            {formData.milestones.length > 0 && (
              <div className="space-y-2">
                {formData.milestones.map((milestone, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-slate-800/30 p-2 rounded">
                    <div className="flex items-center space-x-2 flex-1">
                      <span className="text-xs font-medium text-blue-400">W{milestone.week}</span>
                      <span className="text-sm text-white">{milestone.name}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveMilestone(idx)}
                      className="h-6 w-6 text-slate-500 hover:text-red-400"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
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
            disabled={!formData.name}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {editingTemplate ? 'Update Template' : 'Create Template'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
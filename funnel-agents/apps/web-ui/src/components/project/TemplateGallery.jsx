import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Rocket, TrendingUp, Users, Target, Search, Clock, 
  CheckSquare, FileText, Star, Zap, Calendar, ArrowRight
} from 'lucide-react';
import { motion } from 'framer-motion';

const categoryIcons = {
  product_launch: Rocket,
  content_marketing: FileText,
  lead_generation: Users,
  brand_awareness: Star,
  seo_optimization: TrendingUp,
  social_media: Zap,
  email_marketing: Target,
  event_promotion: Calendar,
  custom: CheckSquare,
};

const categoryColors = {
  product_launch: 'from-purple-500 to-pink-500',
  content_marketing: 'from-blue-500 to-cyan-500',
  lead_generation: 'from-green-500 to-emerald-500',
  brand_awareness: 'from-yellow-500 to-orange-500',
  seo_optimization: 'from-indigo-500 to-purple-500',
  social_media: 'from-pink-500 to-rose-500',
  email_marketing: 'from-red-500 to-orange-500',
  event_promotion: 'from-teal-500 to-cyan-500',
  custom: 'from-slate-500 to-slate-600',
};

export default function TemplateGallery({ templates = [], onSelectTemplate, onCreateCustom }) {
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const filteredTemplates = templates.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         t.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || t.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const categories = [...new Set(templates.map(t => t.category))];

  return (
    <>
      <div className="space-y-4">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <Input
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-slate-800/50 border-slate-700 text-white"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full sm:w-48 bg-slate-800/50 border-slate-700 text-white">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700">
              <SelectItem value="all" className="text-slate-300 focus:bg-slate-700 focus:text-white">
                All Categories
              </SelectItem>
              {categories.map(cat => (
                <SelectItem key={cat} value={cat} className="text-slate-300 focus:bg-slate-700 focus:text-white">
                  {cat.replace('_', ' ')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Template Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTemplates.map((template, idx) => {
            const Icon = categoryIcons[template.category] || CheckSquare;
            const gradient = categoryColors[template.category] || categoryColors.custom;
            
            return (
              <motion.div
                key={template.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <Card 
                  className="p-5 cursor-pointer hover:border-blue-500/50 transition-all group h-full flex flex-col"
                  onClick={() => setSelectedTemplate(template)}
                  style={{ 
                    backgroundColor: 'var(--bg-card)', 
                    border: '1px solid var(--border-subtle)' 
                  }}
                >
                  {/* Header with Icon */}
                  <div className="flex items-start justify-between mb-3">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    {template.is_built_in && (
                      <Badge className="bg-blue-500/20 text-blue-400 text-xs">Built-in</Badge>
                    )}
                  </div>

                  {/* Title & Description */}
                  <h4 className="font-semibold text-white mb-2 group-hover:text-blue-400 transition-colors">
                    {template.name}
                  </h4>
                  <p className="text-sm text-slate-400 mb-4 line-clamp-2 flex-1">
                    {template.description}
                  </p>

                  {/* Meta Info */}
                  <div className="space-y-2 pt-3 border-t border-slate-800">
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span className="flex items-center">
                        <CheckSquare className="w-3 h-3 mr-1" />
                        {template.tasks_blueprint?.length || 0} tasks
                      </span>
                      <span className="flex items-center">
                        <Clock className="w-3 h-3 mr-1" />
                        {template.timeline_weeks}w
                      </span>
                    </div>
                    {template.difficulty_level && (
                      <Badge className={`text-xs ${
                        template.difficulty_level === 'beginner' ? 'bg-green-500/20 text-green-400' :
                        template.difficulty_level === 'intermediate' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-red-500/20 text-red-400'
                      }`}>
                        {template.difficulty_level}
                      </Badge>
                    )}
                  </div>
                </Card>
              </motion.div>
            );
          })}

          {/* Create Custom Template Card */}
          <Card 
            className="p-5 cursor-pointer hover:border-purple-500/50 transition-all group border-dashed h-full flex flex-col items-center justify-center min-h-[200px]"
            onClick={onCreateCustom}
            style={{ 
              backgroundColor: 'var(--bg-card)', 
              border: '2px dashed var(--border-subtle)' 
            }}
          >
            <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center mb-3">
              <CheckSquare className="w-6 h-6 text-purple-400" />
            </div>
            <h4 className="font-semibold text-white mb-1">Create Custom Template</h4>
            <p className="text-sm text-slate-400 text-center">Build your own reusable template</p>
          </Card>
        </div>
      </div>

      {/* Template Detail Modal */}
      <Dialog open={!!selectedTemplate} onOpenChange={() => setSelectedTemplate(null)}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-3xl max-h-[80vh] overflow-y-auto">
          {selectedTemplate && (
            <>
              <DialogHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <DialogTitle className="text-2xl mb-2">{selectedTemplate.name}</DialogTitle>
                    <DialogDescription className="text-slate-400">
                      {selectedTemplate.description}
                    </DialogDescription>
                  </div>
                  {selectedTemplate.is_built_in && (
                    <Badge className="bg-blue-500/20 text-blue-400">Built-in</Badge>
                  )}
                </div>
              </DialogHeader>

              <div className="space-y-6 mt-4">
                {/* Quick Stats */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-slate-800/50 rounded-lg p-3">
                    <p className="text-xs text-slate-500 mb-1">Duration</p>
                    <p className="font-semibold text-white">{selectedTemplate.timeline_weeks} weeks</p>
                  </div>
                  <div className="bg-slate-800/50 rounded-lg p-3">
                    <p className="text-xs text-slate-500 mb-1">Tasks</p>
                    <p className="font-semibold text-white">{selectedTemplate.tasks_blueprint?.length || 0}</p>
                  </div>
                  <div className="bg-slate-800/50 rounded-lg p-3">
                    <p className="text-xs text-slate-500 mb-1">Level</p>
                    <p className="font-semibold text-white capitalize">{selectedTemplate.difficulty_level}</p>
                  </div>
                </div>

                {/* Tasks */}
                {selectedTemplate.tasks_blueprint && selectedTemplate.tasks_blueprint.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-3 flex items-center">
                      <CheckSquare className="w-4 h-4 mr-2 text-blue-400" />
                      Tasks ({selectedTemplate.tasks_blueprint.length})
                    </h4>
                    <div className="space-y-2">
                      {selectedTemplate.tasks_blueprint.slice(0, 5).map((task, idx) => (
                        <div key={idx} className="bg-slate-800/30 rounded-lg p-3 text-sm">
                          <div className="flex items-start justify-between">
                            <span className="text-white font-medium">{task.title}</span>
                            <Badge className="text-xs bg-slate-700 text-slate-300">{task.phase}</Badge>
                          </div>
                          {task.description && (
                            <p className="text-xs text-slate-500 mt-1">{task.description}</p>
                          )}
                        </div>
                      ))}
                      {selectedTemplate.tasks_blueprint.length > 5 && (
                        <p className="text-xs text-slate-500 text-center">+{selectedTemplate.tasks_blueprint.length - 5} more tasks</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Milestones */}
                {selectedTemplate.milestones && selectedTemplate.milestones.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-3 flex items-center">
                      <Target className="w-4 h-4 mr-2 text-green-400" />
                      Milestones
                    </h4>
                    <div className="space-y-2">
                      {selectedTemplate.milestones.map((milestone, idx) => (
                        <div key={idx} className="flex items-start space-x-3 text-sm">
                          <span className="text-xs font-medium text-blue-400 mt-0.5">Week {milestone.week}</span>
                          <div>
                            <p className="text-white font-medium">{milestone.name}</p>
                            <p className="text-xs text-slate-500">{milestone.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Suggested Agents */}
                {selectedTemplate.agents_suggested && selectedTemplate.agents_suggested.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-3 flex items-center">
                      <Users className="w-4 h-4 mr-2 text-purple-400" />
                      Suggested Agents
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedTemplate.agents_suggested.map((agent, idx) => (
                        <Badge key={idx} className="bg-purple-500/20 text-purple-400">
                          {agent.role || agent.domain}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Button */}
                <div className="flex justify-end gap-2 pt-4 border-t border-slate-800">
                  <Button
                    variant="outline"
                    onClick={() => setSelectedTemplate(null)}
                    className="border-slate-700 text-white hover:bg-slate-800"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => {
                      onSelectTemplate(selectedTemplate);
                      setSelectedTemplate(null);
                    }}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Use This Template
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
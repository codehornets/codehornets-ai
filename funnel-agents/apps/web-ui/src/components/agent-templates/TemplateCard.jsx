import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, Zap, Star } from 'lucide-react';
import { motion } from 'framer-motion';

const domainGradients = {
  'Offer': 'from-slate-600 to-slate-700',
  'Marketing': 'from-indigo-600 to-indigo-700',
  'Sales': 'from-emerald-600 to-emerald-700',
  'Fulfillment': 'from-amber-600 to-amber-700',
  'Feedback Loop': 'from-orange-600 to-orange-700',
  'Operations': 'from-blue-600 to-blue-700',
  'Customer Support': 'from-cyan-600 to-cyan-700',
  'Leadership': 'from-purple-600 to-purple-700',
  'Innovation': 'from-violet-600 to-violet-700',
  'Enablement': 'from-teal-600 to-teal-700',
};

const domainColors = {
  'Offer': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  'Marketing': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  'Sales': 'bg-green-500/20 text-green-400 border-green-500/30',
  'Fulfillment': 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  'Feedback Loop': 'bg-pink-500/20 text-pink-400 border-pink-500/30',
  'Operations': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  'Customer Support': 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  'Leadership': 'bg-red-500/20 text-red-400 border-red-500/30',
  'Innovation': 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
  'Enablement': 'bg-teal-500/20 text-teal-400 border-teal-500/30',
};

export default function TemplateCard({ template, onPreview, onUse }) {
  const gradient = domainGradients[template.domain] || 'from-slate-600 to-slate-700';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="glassmorphism-light border-slate-800/50 p-6 hover:border-blue-500/30 transition-all group h-full flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center`}>
            <span className="text-white font-semibold text-lg">{template.persona.initials}</span>
          </div>
          {template.popularityLabel && (
            <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-xs">
              <Star className="w-3 h-3 mr-1" />
              {template.popularityLabel}
            </Badge>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 space-y-3">
          <div>
            <h3 className="text-white font-semibold text-lg mb-1">{template.name}</h3>
            <p className="text-slate-500 text-xs">{template.persona.title}</p>
          </div>

          <p className="text-slate-400 text-sm line-clamp-2">{template.description}</p>

          <div className="flex items-center space-x-2">
            <Badge className={domainColors[template.domain] || 'bg-slate-500/20 text-slate-400'}>
              {template.domain}
            </Badge>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {template.useCase.slice(0, 3).map((tag, idx) => (
              <span key={idx} className="text-xs px-2 py-1 rounded-full bg-slate-800/50 text-slate-400">
                {tag}
              </span>
            ))}
          </div>

          <div className="pt-2 border-t border-slate-800/50">
            <p className="text-xs text-slate-500 mb-1">Examples:</p>
            <p className="text-xs text-slate-400 line-clamp-2">
              {template.typicalTasks.join(', ')}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-2 mt-4 pt-4 border-t border-slate-800/50">
          <Button
            onClick={onPreview}
            variant="outline"
            size="sm"
            className="flex-1 border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800"
          >
            <Eye className="w-4 h-4 mr-2" />
            Preview
          </Button>
          <Button
            onClick={onUse}
            size="sm"
            className="flex-1 bg-blue-600 hover:bg-blue-700"
          >
            <Zap className="w-4 h-4 mr-2" />
            Use Template
          </Button>
        </div>
      </Card>
    </motion.div>
  );
}
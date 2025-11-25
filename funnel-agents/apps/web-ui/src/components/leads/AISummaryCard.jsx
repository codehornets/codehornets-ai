import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bot, Building2, Code, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AISummaryCard({ lead, onQualify }) {
  if (lead.qualification_status === 'processing') {
    return (
      <Card className="bg-black/40 border-slate-800/50 p-6">
        <div className="flex items-center space-x-3 mb-4">
          <Bot className="w-5 h-5 text-blue-400" />
          <h3 className="text-white font-semibold">AI Research Summary</h3>
        </div>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
          <span className="ml-3 text-slate-400">AI is analyzing this lead...</span>
        </div>
      </Card>
    );
  }

  if (!lead.ai_summary && lead.qualification_status === 'pending') {
    return (
      <Card className="bg-black/40 border-slate-800/50 p-6">
        <div className="flex items-center space-x-3 mb-4">
          <Bot className="w-5 h-5 text-blue-400" />
          <h3 className="text-white font-semibold">AI Research Summary</h3>
        </div>
        <div className="text-center py-8">
          <AlertCircle className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400 mb-4">No AI summary yet</p>
          <Button onClick={onQualify} className="bg-blue-600 hover:bg-blue-700">
            <Bot className="w-4 h-4 mr-2" />
            Qualify with AI
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="bg-black/40 border-slate-800/50 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <Bot className="w-5 h-5 text-blue-400" />
          <h3 className="text-white font-semibold">AI Research Summary</h3>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onQualify}
          className="bg-slate-800/50 border-slate-700 text-slate-300 hover:bg-slate-800"
        >
          Re-qualify
        </Button>
      </div>

      {lead.ai_summary && (
        <div className="space-y-4">
          <div>
            <h4 className="text-slate-400 text-sm mb-2">Company Overview</h4>
            <p className="text-white text-sm">{lead.ai_summary}</p>
          </div>

          {lead.company_size && (
            <div className="flex items-center space-x-2">
              <Building2 className="w-4 h-4 text-slate-500" />
              <span className="text-slate-300 text-sm">{lead.company_size}</span>
              {lead.industry && (
                <>
                  <span className="text-slate-600">•</span>
                  <span className="text-slate-300 text-sm">{lead.industry}</span>
                </>
              )}
            </div>
          )}

          {lead.tech_stack && lead.tech_stack.length > 0 && (
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <Code className="w-4 h-4 text-slate-500" />
                <h4 className="text-slate-400 text-sm">Tech Stack</h4>
              </div>
              <div className="flex flex-wrap gap-2">
                {lead.tech_stack.map((tech, index) => (
                  <Badge key={index} variant="outline" className="bg-slate-800/50 border-slate-700 text-slate-300">
                    {tech}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {lead.pain_points && lead.pain_points.length > 0 && (
            <div>
              <h4 className="text-slate-400 text-sm mb-2">Key Pain Points</h4>
              <ul className="space-y-1">
                {lead.pain_points.map((point, index) => (
                  <li key={index} className="text-white text-sm flex items-start space-x-2">
                    <span className="text-blue-400 mt-1">•</span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {lead.estimated_budget && (
            <div>
              <h4 className="text-slate-400 text-sm mb-1">Estimated Budget</h4>
              <p className="text-white text-sm">{lead.estimated_budget}</p>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
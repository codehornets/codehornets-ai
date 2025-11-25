import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Zap, Users } from 'lucide-react';

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

export default function TemplateDetailSheet({ open, onOpenChange, template, onUse }) {
  if (!template) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="bg-slate-900 border-slate-800 text-white w-[500px] overflow-y-auto">
        <SheetHeader className="space-y-4">
          <div className="flex items-start space-x-4">
            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-indigo-600 to-indigo-700 flex items-center justify-center">
              <span className="text-white font-semibold text-xl">{template.persona.initials}</span>
            </div>
            <div className="flex-1">
              <SheetTitle className="text-white text-xl mb-1">{template.name}</SheetTitle>
              <p className="text-slate-400 text-sm">{template.persona.title}</p>
              <div className="flex items-center space-x-2 mt-2">
                <Badge className={domainColors[template.domain] || 'bg-slate-500/20 text-slate-400'}>
                  {template.domain}
                </Badge>
              </div>
            </div>
          </div>
          <SheetDescription className="text-slate-300 text-base">
            Best for: {template.description}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          {/* Overview */}
          <div>
            <h4 className="text-white font-semibold mb-3">What this agent does</h4>
            <ul className="space-y-2">
              {template.overview.map((item, idx) => (
                <li key={idx} className="flex items-start space-x-2 text-sm text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Example Tasks */}
          <div>
            <h4 className="text-white font-semibold mb-3">Example tasks</h4>
            <div className="space-y-2">
              {template.exampleTasks.map((task, idx) => (
                <div key={idx} className="p-3 bg-slate-800/30 rounded-lg border border-slate-700">
                  <p className="text-sm text-slate-300">{task}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Default Configuration */}
          <div>
            <h4 className="text-white font-semibold mb-3">Default configuration</h4>
            <div className="space-y-4 p-4 bg-slate-800/30 rounded-lg border border-slate-700">
              <div>
                <p className="text-xs text-slate-500 mb-2">Tools</p>
                <div className="flex flex-wrap gap-2">
                  {template.defaultConfig.tools.map((tool, idx) => (
                    <span key={idx} className="text-xs px-2 py-1 rounded-full bg-blue-500/20 text-blue-400">
                      {tool}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs text-slate-500 mb-1">Behavior</p>
                <p className="text-sm text-slate-300">
                  Tone: <span className="text-white">{template.defaultConfig.tone}</span>
                </p>
                <p className="text-sm text-slate-300 mt-1">
                  Audience: <span className="text-white">{template.defaultConfig.audience}</span>
                </p>
              </div>

              <div>
                <p className="text-xs text-slate-500 mb-2">Data access</p>
                <div className="flex flex-wrap gap-2">
                  {template.defaultConfig.dataAccess.map((access, idx) => (
                    <span key={idx} className="text-xs px-2 py-1 rounded-full bg-slate-700 text-slate-300">
                      {access}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs text-slate-500 mb-1">Approval</p>
                <p className="text-sm text-slate-300">
                  Requires human approval before sending to clients:{' '}
                  <span className={template.defaultConfig.requiresApproval ? 'text-amber-400' : 'text-green-400'}>
                    {template.defaultConfig.requiresApproval ? 'Yes' : 'No'}
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* Commonly Used With */}
          {template.commonlyUsedWith && (
            <div>
              <h4 className="text-white font-semibold mb-3 flex items-center">
                <Users className="w-4 h-4 mr-2" />
                Commonly used with
              </h4>
              <div className="flex flex-wrap gap-2">
                {template.commonlyUsedWith.map((agent, idx) => (
                  <span key={idx} className="text-sm px-3 py-1.5 rounded-lg bg-slate-800/50 text-slate-300 border border-slate-700">
                    {agent}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* CTA */}
          <div className="sticky bottom-0 bg-slate-900 pt-4 pb-2 border-t border-slate-800">
            <Button onClick={() => onUse(template)} className="w-full bg-blue-600 hover:bg-blue-700 h-12">
              <Zap className="w-5 h-5 mr-2" />
              Create Agent from Template
            </Button>
            <p className="text-xs text-slate-500 text-center mt-2">
              You can rename and adjust settings before saving
            </p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
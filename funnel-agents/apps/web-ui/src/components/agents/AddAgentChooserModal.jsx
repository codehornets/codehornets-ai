import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Zap, Pencil, ArrowRight } from 'lucide-react';

export default function AddAgentChooserModal({ open, onOpenChange, onStartFromTemplate, onCreateFromScratch }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-3xl">
        <DialogHeader>
          <DialogTitle className="text-2xl">Create a New Agent</DialogTitle>
          <DialogDescription className="text-slate-400 text-base">
            Start from a proven template or define an agent from scratch
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-6">
          {/* Start from Template */}
          <Card className="glassmorphism-light border-blue-500/30 p-6 hover:border-blue-500/50 transition-all cursor-pointer group relative overflow-hidden"
                onClick={onStartFromTemplate}>
            <div className="absolute top-3 right-3">
              <span className="text-xs px-2 py-1 rounded-full bg-blue-500/20 text-blue-400 font-medium">
                Recommended
              </span>
            </div>
            
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center mb-4 group-hover:bg-blue-500/20 transition-colors">
              <Zap className="w-6 h-6 text-blue-400" />
            </div>

            <h3 className="text-white font-semibold text-lg mb-2">Start from Template</h3>
            <p className="text-slate-400 text-sm mb-6 min-h-[60px]">
              Browse ready-made agents for research, content, ads, and more. You can rename and tweak settings later.
            </p>

            <Button 
              className="w-full bg-blue-600 hover:bg-blue-700 group-hover:bg-blue-700"
              onClick={(e) => {
                e.stopPropagation();
                onStartFromTemplate();
              }}
            >
              Browse Templates
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Card>

          {/* Create from Scratch */}
          <Card className="glassmorphism-light border-slate-700 p-6 hover:border-slate-600 transition-all cursor-pointer group"
                onClick={onCreateFromScratch}>
            <div className="w-12 h-12 rounded-xl bg-slate-700/50 flex items-center justify-center mb-4 group-hover:bg-slate-700 transition-colors">
              <Pencil className="w-6 h-6 text-slate-400" />
            </div>

            <h3 className="text-white font-semibold text-lg mb-2">Create from Scratch</h3>
            <p className="text-slate-400 text-sm mb-6 min-h-[60px]">
              Define this agent's role, behavior, and access manually.
            </p>

            <Button 
              variant="outline"
              className="w-full border-slate-700 text-white hover:bg-slate-800"
              onClick={(e) => {
                e.stopPropagation();
                onCreateFromScratch();
              }}
            >
              Create from Scratch
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
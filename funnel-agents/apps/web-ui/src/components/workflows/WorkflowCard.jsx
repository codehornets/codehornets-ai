import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { GitBranch, Play, MoreVertical, Clock, CheckCircle2, HelpCircle } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatDistanceToNow } from 'date-fns';

export default function WorkflowCard({ workflow, onEdit, onToggleStatus, onDelete, onRun, onDuplicate }) {
  const successRate = workflow.runs_count > 0
    ? Math.round((workflow.success_count / workflow.runs_count) * 100)
    : 0;

  return (
    <Card className="glassmorphism-light border-slate-800/50 p-6 hover:border-blue-500/30 transition-all group">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start space-x-3 flex-1">
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
            <GitBranch className="w-6 h-6 text-blue-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-1">
              <h3 className="text-white font-semibold text-lg truncate">{workflow.name}</h3>
              <Badge className={
                workflow.status === 'active' ? 'bg-green-500/20 text-green-400' :
                workflow.status === 'paused' ? 'bg-amber-500/20 text-amber-400' :
                'bg-slate-500/20 text-slate-400'
              }>
                {workflow.status}
              </Badge>
            </div>
            <p className="text-slate-400 text-sm">{workflow.description || 'No description'}</p>
            <p className="text-slate-500 text-xs mt-1">
              Scope: {workflow.workspace_id ? 'Client-specific' : 'All clients'} • 
              Trigger: {workflow.trigger_type || 'Manual'}
            </p>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-slate-800 border-slate-700">
            <DropdownMenuItem onClick={onEdit} className="text-slate-300 focus:bg-slate-700 focus:text-white">
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onDuplicate} className="text-slate-300 focus:bg-slate-700 focus:text-white">
              Duplicate
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onDelete} className="text-red-400 focus:bg-slate-700 focus:text-red-400">
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <TooltipProvider>
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div>
            <div className="flex items-center space-x-1 mb-1">
              <p className="text-xs text-slate-500">Nodes</p>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="w-3 h-3 text-slate-600 cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="bg-slate-800 border-slate-700 text-slate-200">
                  Number of steps in this workflow
                </TooltipContent>
              </Tooltip>
            </div>
            <p className="text-white font-semibold">{workflow.nodes?.length || 0}</p>
          </div>
          <div>
            <div className="flex items-center space-x-1 mb-1">
              <p className="text-xs text-slate-500">Total Runs</p>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="w-3 h-3 text-slate-600 cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="bg-slate-800 border-slate-700 text-slate-200">
                  How many times this automation has been executed
                </TooltipContent>
              </Tooltip>
            </div>
            <p className="text-white font-semibold">{workflow.runs_count || 0}</p>
          </div>
          <div>
            <div className="flex items-center space-x-1 mb-1">
              <p className="text-xs text-slate-500">Success Rate</p>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="w-3 h-3 text-slate-600 cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="bg-slate-800 border-slate-700 text-slate-200">
                  % of runs completed without errors
                </TooltipContent>
              </Tooltip>
            </div>
            <div className="flex items-center space-x-1">
              <p className="text-white font-semibold">{successRate}%</p>
              {successRate >= 90 && <CheckCircle2 className="w-4 h-4 text-green-400" />}
            </div>
          </div>
        </div>
      </TooltipProvider>

      {workflow.last_run_at && (
        <div className="flex items-center space-x-2 text-xs text-slate-500 mb-4">
          <Clock className="w-3 h-3" />
          <span>Last run {formatDistanceToNow(new Date(workflow.last_run_at), { addSuffix: true })}</span>
        </div>
      )}

      <div className="flex items-center space-x-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex-1">
                <Button
                  onClick={onRun}
                  disabled={workflow.status === 'draft' || workflow.status === 'paused'}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Play className="w-4 h-4 mr-2" />
                  Run Now
                </Button>
              </div>
            </TooltipTrigger>
            {workflow.status === 'draft' && (
              <TooltipContent className="bg-slate-800 border-slate-700 text-slate-200">
                This workflow isn't active yet. Switch to Active to run it.
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
        <Button
          onClick={onEdit}
          variant="outline"
          className="border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800"
        >
          Edit
        </Button>
      </div>
    </Card>
  );
}
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { 
  CheckCircle2, XCircle, Clock, Loader2, 
  Calendar, User, Zap, FileText 
} from 'lucide-react';

export default function TaskDetailModal({ open, onOpenChange, task, agent, workspace }) {
  if (!task) return null;

  const getStatusIcon = () => {
    if (task.status === 'completed') return <CheckCircle2 className="w-5 h-5 text-green-400" />;
    if (task.status === 'failed') return <XCircle className="w-5 h-5 text-red-400" />;
    if (task.status === 'running') return <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />;
    return <Clock className="w-5 h-5 text-slate-400" />;
  };

  const getStatusColor = () => {
    if (task.status === 'completed') return 'bg-green-500/20 text-green-400';
    if (task.status === 'failed') return 'bg-red-500/20 text-red-400';
    if (task.status === 'running') return 'bg-blue-500/20 text-blue-400';
    return 'bg-slate-500/20 text-slate-400';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-3xl">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <DialogTitle className="text-2xl text-white mb-2">{task.title}</DialogTitle>
              <div className="flex items-center space-x-3">
                <Badge className={getStatusColor()}>
                  {task.status === 'pending' ? 'Needs review' : task.status}
                </Badge>
                {task.priority && (
                  <Badge className="bg-purple-500/20 text-purple-400">
                    {task.priority} priority
                  </Badge>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {getStatusIcon()}
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Meta Info */}
          <div className="grid grid-cols-2 gap-4">
            <Card className="bg-slate-800/30 border-slate-700 p-4">
              <div className="flex items-center space-x-2 text-slate-400 mb-1">
                <User className="w-4 h-4" />
                <span className="text-xs font-medium">Agent</span>
              </div>
              <p className="text-white font-medium">{agent?.name || task.agent_name}</p>
            </Card>

            <Card className="bg-slate-800/30 border-slate-700 p-4">
              <div className="flex items-center space-x-2 text-slate-400 mb-1">
                <Calendar className="w-4 h-4" />
                <span className="text-xs font-medium">Created</span>
              </div>
              <p className="text-white font-medium">
                {new Date(task.created_date).toLocaleDateString()} at{' '}
                {new Date(task.created_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </Card>

            {task.duration && (
              <Card className="bg-slate-800/30 border-slate-700 p-4">
                <div className="flex items-center space-x-2 text-slate-400 mb-1">
                  <Clock className="w-4 h-4" />
                  <span className="text-xs font-medium">Duration</span>
                </div>
                <p className="text-white font-medium">
                  {Math.round(task.duration / 60)} minutes
                </p>
              </Card>
            )}

            {workspace && (
              <Card className="bg-slate-800/30 border-slate-700 p-4">
                <div className="flex items-center space-x-2 text-slate-400 mb-1">
                  <Zap className="w-4 h-4" />
                  <span className="text-xs font-medium">Client</span>
                </div>
                <p className="text-white font-medium">{workspace.name}</p>
              </Card>
            )}
          </div>

          {/* Description */}
          {task.description && (
            <Card className="bg-slate-800/30 border-slate-700 p-4">
              <div className="flex items-center space-x-2 text-slate-400 mb-2">
                <FileText className="w-4 h-4" />
                <span className="text-xs font-medium">Description</span>
              </div>
              <p className="text-white">{task.description}</p>
            </Card>
          )}

          {/* Input Data */}
          {task.input_data && Object.keys(task.input_data).length > 0 && (
            <Card className="bg-slate-800/30 border-slate-700 p-4">
              <div className="flex items-center space-x-2 text-slate-400 mb-2">
                <FileText className="w-4 h-4" />
                <span className="text-xs font-medium">Input Data</span>
              </div>
              <pre className="text-xs text-slate-300 bg-slate-900/50 p-3 rounded overflow-auto max-h-40">
                {JSON.stringify(task.input_data, null, 2)}
              </pre>
            </Card>
          )}

          {/* Output Data */}
          {task.output_data && Object.keys(task.output_data).length > 0 && (
            <Card className="bg-slate-800/30 border-slate-700 p-4">
              <div className="flex items-center space-x-2 text-slate-400 mb-2">
                <FileText className="w-4 h-4" />
                <span className="text-xs font-medium">Output Data</span>
              </div>
              <pre className="text-xs text-slate-300 bg-slate-900/50 p-3 rounded overflow-auto max-h-40">
                {JSON.stringify(task.output_data, null, 2)}
              </pre>
            </Card>
          )}

          {/* Error Message */}
          {task.error_message && (
            <Card className="bg-red-500/10 border-red-500/30 p-4">
              <div className="flex items-center space-x-2 text-red-400 mb-2">
                <XCircle className="w-4 h-4" />
                <span className="text-xs font-medium">Error</span>
              </div>
              <p className="text-red-300 text-sm">{task.error_message}</p>
            </Card>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end space-x-2 pt-4 border-t border-slate-700">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="border-slate-700 text-white">
              Close
            </Button>
            {task.status === 'failed' && (
              <Button className="bg-blue-600 hover:bg-blue-700">
                Retry Task
              </Button>
            )}
            {task.status === 'pending' && (
              <>
                <Button variant="outline" className="border-red-500/30 text-red-400 hover:bg-red-500/10">
                  Reject
                </Button>
                <Button className="bg-green-600 hover:bg-green-700">
                  Approve
                </Button>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
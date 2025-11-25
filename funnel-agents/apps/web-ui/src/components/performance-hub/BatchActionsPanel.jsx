import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlayCircle, PauseCircle, X, UserPlus } from 'lucide-react';

export default function BatchActionsPanel({ selectedCount, onBatchAction, onClearSelection }) {
  return (
    <Card 
      className="p-4 border-blue-500/30 bg-blue-500/10"
      style={{ border: '1px solid rgba(59, 130, 246, 0.3)' }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            <span className="font-medium text-blue-400">
              {selectedCount} agent{selectedCount !== 1 ? 's' : ''} selected
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onBatchAction('activate')}
            className="border-green-500/30 text-green-400 hover:bg-green-500/10"
          >
            <PlayCircle className="w-4 h-4 mr-2" />
            Activate
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => onBatchAction('deactivate')}
            className="border-orange-500/30 text-orange-400 hover:bg-orange-500/10"
          >
            <PauseCircle className="w-4 h-4 mr-2" />
            Deactivate
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => onBatchAction('assign')}
            className="border-blue-500/30 text-blue-400 hover:bg-blue-500/10"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Assign to Client
          </Button>

          <Button
            size="sm"
            variant="ghost"
            onClick={onClearSelection}
            className="text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4 mr-2" />
            Clear
          </Button>
        </div>
      </div>
    </Card>
  );
}
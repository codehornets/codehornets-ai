import React, { useState } from 'react';
import { Users, Zap, GitMerge, Clock, Database, Mail, Webhook, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

import { MessageSquare, CheckCircle } from 'lucide-react';

const nodeIcons = {
  agent: Users,
  trigger: Zap,
  condition: GitMerge,
  delay: Clock,
  database: Database,
  email: Mail,
  webhook: Webhook,
  communication: MessageSquare,
  task: CheckCircle,
};

const nodeColors = {
  agent: 'bg-blue-500/20 border-blue-500/50 text-blue-400',
  trigger: 'bg-purple-500/20 border-purple-500/50 text-purple-400',
  condition: 'bg-amber-500/20 border-amber-500/50 text-amber-400',
  delay: 'bg-slate-500/20 border-slate-500/50 text-slate-400',
  database: 'bg-green-500/20 border-green-500/50 text-green-400',
  email: 'bg-pink-500/20 border-pink-500/50 text-pink-400',
  webhook: 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400',
  communication: 'bg-purple-500/20 border-purple-500/50 text-purple-400',
  task: 'bg-green-500/20 border-green-500/50 text-green-400',
};

export default function WorkflowNode({
  node,
  selected,
  connecting,
  onSelect,
  onDelete,
  onDragStart,
  onDrag,
  onDragEnd,
  onStartConnection,
  onEndConnection,
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const Icon = nodeIcons[node.type] || Users;
  const colorClass = nodeColors[node.type] || nodeColors.agent;

  const handleMouseDown = (e) => {
    if (e.target.closest('.node-action') || e.target.closest('.connection-point')) return;
    setIsDragging(true);
    const rect = e.currentTarget.getBoundingClientRect();
    const canvasRect = e.currentTarget.closest('.workflow-canvas-container')?.getBoundingClientRect();
    if (canvasRect) {
      setDragOffset({
        x: e.clientX - node.position.x - canvasRect.left,
        y: e.clientY - node.position.y - canvasRect.top,
      });
    } else {
      setDragOffset({
        x: e.clientX - node.position.x,
        y: e.clientY - node.position.y,
      });
    }
    onDragStart();
    onSelect();
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    const canvas = document.querySelector('.workflow-canvas-container');
    if (canvas) {
      const rect = canvas.getBoundingClientRect();
      onDrag({
        x: Math.max(0, Math.min(e.clientX - rect.left - dragOffset.x, rect.width - 192)),
        y: Math.max(0, Math.min(e.clientY - rect.top - dragOffset.y, rect.height - 100)),
      });
    }
  };

  const handleMouseUp = () => {
    if (isDragging) {
      setIsDragging(false);
      onDragEnd();
    }
  };

  React.useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging]);

  return (
    <div
      className={`relative w-48 rounded-lg border-2 p-4 cursor-move transition-all ${colorClass} ${
        selected ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-slate-900' : ''
      } ${connecting ? 'ring-2 ring-purple-500 animate-pulse' : ''} ${
        isDragging ? 'opacity-70' : 'hover:shadow-lg'
      }`}
      onClick={onSelect}
      onMouseDown={handleMouseDown}
    >
      {/* Connection Points */}
      <div
        className="connection-point node-action absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-slate-700 border-2 border-slate-500 hover:bg-green-500 hover:border-green-400 hover:scale-125 cursor-pointer z-10 transition-all"
        onClick={(e) => {
          e.stopPropagation();
          onEndConnection();
        }}
        title="Input connection point"
      />
      <div
        className="connection-point node-action absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-slate-700 border-2 border-slate-500 hover:bg-blue-500 hover:border-blue-400 hover:scale-125 cursor-pointer z-10 transition-all"
        onClick={(e) => {
          e.stopPropagation();
          onStartConnection(e);
        }}
        title="Output connection point - click to start connection"
      />

      {/* Node Content */}
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-white truncate">
            {node.config?.name || node.type}
          </p>
          <p className="text-xs opacity-70 mt-1 truncate">
            {node.config?.description || `${node.type} node`}
          </p>
        </div>
      </div>

      {/* Actions */}
      {selected && (
        <div className="node-action absolute -top-3 -right-3 flex space-x-1">
          <Button
            size="icon"
            variant="destructive"
            className="h-6 w-6 rounded-full"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      )}
    </div>
  );
}
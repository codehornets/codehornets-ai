import { Button } from '@/components/ui/button';
import { Bot, Mail, Zap, Phone } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function LeadQuickActions({ lead, onAction }) {
  return (
    <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
      <Button
        size="sm"
        variant="ghost"
        onClick={(e) => {
          e.stopPropagation();
          onAction('qualify', lead);
        }}
        className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
      >
        <Bot className="w-4 h-4 mr-1" />
        Qualify
      </Button>
      <Button
        size="sm"
        variant="ghost"
        onClick={(e) => {
          e.stopPropagation();
          onAction('outreach', lead);
        }}
        className="text-purple-400 hover:text-purple-300 hover:bg-purple-500/10"
      >
        <Mail className="w-4 h-4 mr-1" />
        Outreach
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
          <Button
            size="sm"
            variant="ghost"
            className="text-slate-400 hover:text-slate-300 hover:bg-slate-700"
          >
            <Zap className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="bg-slate-800 border-slate-700">
          <DropdownMenuItem 
            onClick={(e) => {
              e.stopPropagation();
              onAction('call', lead);
            }}
            className="text-slate-300 focus:bg-slate-700 focus:text-white"
          >
            <Phone className="w-4 h-4 mr-2" />
            Log Call
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={(e) => {
              e.stopPropagation();
              onAction('task', lead);
            }}
            className="text-slate-300 focus:bg-slate-700 focus:text-white"
          >
            <Zap className="w-4 h-4 mr-2" />
            Create Task
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
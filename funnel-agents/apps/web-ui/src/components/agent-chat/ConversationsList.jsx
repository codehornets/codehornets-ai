import { Button } from '@/components/ui/button';
import { Plus, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ConversationsList({ conversations, activeConversation, onSelect, onCreate }) {
  return (
    <div className="w-80 border-r border-slate-800 flex flex-col h-full">
      <div className="p-4 border-b border-slate-800">
        <Button onClick={onCreate} className="w-full bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          New Conversation
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {conversations.length === 0 ? (
          <div className="p-6 text-center">
            <MessageSquare className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400 text-sm">No conversations yet</p>
          </div>
        ) : (
          <div className="p-2">
            {conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => onSelect(conv)}
                className={cn(
                  "w-full text-left p-3 rounded-lg mb-2 transition-all",
                  activeConversation?.id === conv.id
                    ? "bg-blue-500/20 border border-blue-500/30"
                    : "hover:bg-slate-800/50 border border-transparent"
                )}
              >
                <div className="flex items-start justify-between mb-1">
                  <span className="text-white font-medium text-sm truncate">
                    {conv.metadata?.name || 'Conversation'}
                  </span>
                  <span className="text-xs text-slate-500">
                    {new Date(conv.created_date).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-xs text-slate-400 truncate">
                  {conv.messages?.[conv.messages.length - 1]?.content || 'Start chatting...'}
                </p>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
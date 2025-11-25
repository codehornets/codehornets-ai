import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Loader2 } from 'lucide-react';
import client from '@/api/client';
import { toast } from 'sonner';
import AgentMessageBubble from './AgentMessageBubble';

export default function AgentChatInterface({ agent, conversation, onConversationCreate }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!conversation) return;

    // Load initial messages
    setMessages(conversation.messages || []);

    // Subscribe to real-time updates
    const unsubscribe = client.agents.subscribeToConversation(conversation.id, (data) => {
      setMessages(data.messages);
    });

    return () => {
      unsubscribe();
    };
  }, [conversation]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || sending) return;

    try {
      setSending(true);
      
      if (!conversation) {
        // Create new conversation
        const newConv = await client.agents.createConversation({
          agent_name: agent.name,
          metadata: {
            name: `Chat with ${agent.name}`,
            description: 'Interactive agent conversation',
          }
        });
        onConversationCreate(newConv);
        
        // Send message
        await client.agents.addMessage(newConv, {
          role: 'user',
          content: input,
        });
      } else {
        await client.agents.addMessage(conversation, {
          role: 'user',
          content: input,
        });
      }

      setInput('');
    } catch (error) {
      console.error('Send error:', error);
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">💬</span>
            </div>
            <h3 className="text-white font-medium mb-2">Start a conversation with {agent.name}</h3>
            <p className="text-slate-400 text-sm">Ask questions, give instructions, or request tasks</p>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <AgentMessageBubble key={idx} message={msg} />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-slate-800 p-4">
        <div className="flex items-end space-x-2">
          <div className="flex-1">
            <Input
              placeholder={`Message ${agent.name}...`}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              className="bg-slate-800/50 border-slate-700 text-white"
              disabled={sending}
            />
          </div>
          <Button
            onClick={handleSend}
            disabled={!input.trim() || sending}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {sending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
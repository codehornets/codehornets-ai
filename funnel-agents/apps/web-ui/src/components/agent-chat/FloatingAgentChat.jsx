import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Send, X, Minimize2, Maximize2, GripVertical, Loader2, Settings, FileText, Mail, Briefcase } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import client from '@/api/client';
import { toast } from 'sonner';
import AgentMessageBubble from './AgentMessageBubble';
import { cn } from '@/lib/utils';

export default function FloatingAgentChat({ agent, onClose, onOpenSettings }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [conversation, setConversation] = useState(null);
  const [selectedClient, setSelectedClient] = useState('all');
  const [selectedCampaign, setSelectedCampaign] = useState('all');
  const [position, setPosition] = useState({ x: window.innerWidth - 420, y: 100 });
  const [size, setSize] = useState({ width: 400, height: 600 });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeDirection, setResizeDirection] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const messagesEndRef = useRef(null);
  const chatRef = useRef(null);

  const domainGradients = {
    'Offer': 'from-slate-600 to-slate-700',
    'Marketing': 'from-indigo-600 to-indigo-700',
    'Sales': 'from-emerald-600 to-emerald-700',
    'Fulfillment': 'from-amber-600 to-amber-700',
    'Feedback Loop': 'from-orange-600 to-orange-700',
    'Operations': 'from-blue-600 to-blue-700',
    'Customer Support': 'from-cyan-600 to-cyan-700',
    'Leadership': 'from-purple-600 to-purple-700',
    'Innovation': 'from-violet-600 to-violet-700',
    'Enablement': 'from-teal-600 to-teal-700',
  };

  const getAgentPersona = (name) => {
    const personas = {
      'Market Researcher': { firstName: 'Sarah', lastName: 'Chen', title: 'Market Analyst', initials: 'SC' },
      'Content Creator': { firstName: 'Marcus', lastName: 'Rivera', title: 'Content Strategist', initials: 'MR' },
      'SEO Specialist': { firstName: 'Emily', lastName: 'Foster', title: 'SEO Expert', initials: 'EF' },
      'Lead Qualifier': { firstName: 'David', lastName: 'Kim', title: 'Lead Specialist', initials: 'DK' },
      'Email Marketer': { firstName: 'Jessica', lastName: 'Wells', title: 'Email Strategist', initials: 'JW' },
      'Social Media Manager': { firstName: 'Alex', lastName: 'Turner', title: 'Social Media Lead', initials: 'AT' },
      'Competitor Analyst': { firstName: 'Michael', lastName: 'Brooks', title: 'Competitive Intel', initials: 'MB' },
      'Value Proposition Creator': { firstName: 'Sophia', lastName: 'Martinez', title: 'Value Architect', initials: 'SM' },
      'Service Designer': { firstName: 'Oliver', lastName: 'Hayes', title: 'Service Designer', initials: 'OH' },
      'Pricing Strategist': { firstName: 'Rachel', lastName: 'Park', title: 'Pricing Analyst', initials: 'RP' },
      'Proposal Writer': { firstName: 'James', lastName: 'Anderson', title: 'Proposal Lead', initials: 'JA' },
      'Brand Designer': { firstName: 'Nina', lastName: 'Patel', title: 'Brand Specialist', initials: 'NP' },
      'Ads Manager': { firstName: 'Chris', lastName: 'Morgan', title: 'Ads Manager', initials: 'CM' },
    };
    
    return personas[name] || { firstName: 'Agent', lastName: 'AI', title: 'Specialist', initials: name?.substring(0, 2).toUpperCase() || 'AI' };
  };

  const persona = getAgentPersona(agent.name);
  const gradient = domainGradients[agent.domain] || 'from-slate-600 to-slate-700';

  useEffect(() => {
    if (!conversation) return;

    setMessages(conversation.messages || []);

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

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isDragging) {
        setPosition({
          x: e.clientX - dragOffset.x,
          y: e.clientY - dragOffset.y
        });
      } else if (isResizing) {
        const deltaX = e.clientX - resizeStart.x;
        const deltaY = e.clientY - resizeStart.y;
        
        let newWidth = resizeStart.width;
        let newHeight = resizeStart.height;
        let newX = position.x;
        let newY = position.y;

        if (resizeDirection.includes('e')) {
          newWidth = Math.max(320, Math.min(800, resizeStart.width + deltaX));
        }
        if (resizeDirection.includes('w')) {
          const widthChange = resizeStart.width - deltaX;
          if (widthChange >= 320 && widthChange <= 800) {
            newWidth = widthChange;
            newX = position.x + deltaX;
          }
        }
        if (resizeDirection.includes('s')) {
          newHeight = Math.max(400, Math.min(900, resizeStart.height + deltaY));
        }
        if (resizeDirection.includes('n')) {
          const heightChange = resizeStart.height - deltaY;
          if (heightChange >= 400 && heightChange <= 900) {
            newHeight = heightChange;
            newY = position.y + deltaY;
          }
        }

        setSize({ width: newWidth, height: newHeight });
        if (newX !== position.x || newY !== position.y) {
          setPosition({ x: newX, y: newY });
        }
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
      setResizeDirection(null);
    };

    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, dragOffset, resizeDirection, resizeStart, position]);

  const handleMouseDown = (e) => {
    if (e.target.closest('.drag-handle')) {
      const rect = chatRef.current.getBoundingClientRect();
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
      setIsDragging(true);
    }
  };

  const handleResizeStart = (e, direction) => {
    e.stopPropagation();
    setResizeDirection(direction);
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      width: size.width,
      height: size.height
    });
    setIsResizing(true);
  };

  const handleSend = async () => {
    if (!input.trim() || sending) return;

    try {
      setSending(true);
      
      if (!conversation) {
        const newConv = await client.agents.createConversation({
          agent_name: agent.name,
          metadata: {
            name: `Chat with ${agent.name}`,
            description: 'Interactive agent conversation',
          }
        });
        setConversation(newConv);
        
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
    <div
      ref={chatRef}
      style={{
        position: 'fixed',
        left: `${position.x}px`,
        top: `${position.y}px`,
        zIndex: 9999,
        width: minimized ? '320px' : `${size.width}px`,
        height: minimized ? 'auto' : `${size.height}px`,
      }}
      onMouseDown={handleMouseDown}
      className={cn("select-none", isDragging && "cursor-grabbing")}
    >
      {/* Resize Handles */}
      {!minimized && (
        <>
          <div onMouseDown={(e) => handleResizeStart(e, 'n')} className="absolute top-0 left-0 right-0 h-1 cursor-ns-resize hover:bg-blue-500/20" style={{ zIndex: 10000 }} />
          <div onMouseDown={(e) => handleResizeStart(e, 's')} className="absolute bottom-0 left-0 right-0 h-1 cursor-ns-resize hover:bg-blue-500/20" style={{ zIndex: 10000 }} />
          <div onMouseDown={(e) => handleResizeStart(e, 'w')} className="absolute top-0 bottom-0 left-0 w-1 cursor-ew-resize hover:bg-blue-500/20" style={{ zIndex: 10000 }} />
          <div onMouseDown={(e) => handleResizeStart(e, 'e')} className="absolute top-0 bottom-0 right-0 w-1 cursor-ew-resize hover:bg-blue-500/20" style={{ zIndex: 10000 }} />
          <div onMouseDown={(e) => handleResizeStart(e, 'nw')} className="absolute top-0 left-0 w-3 h-3 cursor-nw-resize hover:bg-blue-500/30" style={{ zIndex: 10001 }} />
          <div onMouseDown={(e) => handleResizeStart(e, 'ne')} className="absolute top-0 right-0 w-3 h-3 cursor-ne-resize hover:bg-blue-500/30" style={{ zIndex: 10001 }} />
          <div onMouseDown={(e) => handleResizeStart(e, 'sw')} className="absolute bottom-0 left-0 w-3 h-3 cursor-sw-resize hover:bg-blue-500/30" style={{ zIndex: 10001 }} />
          <div onMouseDown={(e) => handleResizeStart(e, 'se')} className="absolute bottom-0 right-0 w-3 h-3 cursor-se-resize hover:bg-blue-500/30" style={{ zIndex: 10001 }} />
        </>
      )}
      
      <Card className="glassmorphism-light border-slate-700 overflow-hidden flex flex-col h-full shadow-2xl">
        {/* Header */}
        <div className="drag-handle cursor-grab active:cursor-grabbing bg-slate-900/90 border-b border-slate-700 p-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <GripVertical className="w-4 h-4 text-slate-500" />
            <div className="relative">
              <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center`}>
                <span className="text-white font-semibold text-sm">{persona.initials}</span>
              </div>
              {agent.status === 'active' && (
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-500 border-2 border-slate-900"></div>
              )}
            </div>
            <div>
              <h3 className="text-white font-semibold text-sm">{persona.firstName} {persona.lastName}</h3>
              <p className="text-xs text-slate-500">{persona.title}</p>
            </div>
          </div>
          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                onClose();
                onOpenSettings();
              }}
              className="text-slate-400 hover:text-white h-8 w-8"
            >
              <Settings className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMinimized(!minimized)}
              className="text-slate-400 hover:text-white h-8 w-8"
            >
              {minimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-slate-400 hover:text-white h-8 w-8"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {!minimized && (
          <>
            {/* Context Bar */}
            <div className="border-b border-slate-700 p-3 bg-slate-900/70 space-y-2">
              <div className="flex items-center space-x-2">
                <Select value={selectedClient} onValueChange={setSelectedClient}>
                  <SelectTrigger className="flex-1 bg-slate-800/50 border-slate-700 text-white h-8 text-xs">
                    <SelectValue placeholder="Select client" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="all" className="text-slate-300 focus:bg-slate-700 focus:text-white text-xs">All Clients</SelectItem>
                    <SelectItem value="marketing-team" className="text-slate-300 focus:bg-slate-700 focus:text-white text-xs">Marketing Team</SelectItem>
                    <SelectItem value="sales-dept" className="text-slate-300 focus:bg-slate-700 focus:text-white text-xs">Sales Department</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={selectedCampaign} onValueChange={setSelectedCampaign}>
                  <SelectTrigger className="flex-1 bg-slate-800/50 border-slate-700 text-white h-8 text-xs">
                    <SelectValue placeholder="Select campaign" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="all" className="text-slate-300 focus:bg-slate-700 focus:text-white text-xs">All Campaigns</SelectItem>
                    <SelectItem value="q1-launch" className="text-slate-300 focus:bg-slate-700 focus:text-white text-xs">Q1 Product Launch</SelectItem>
                    <SelectItem value="test-campaign" className="text-slate-300 focus:bg-slate-700 focus:text-white text-xs">Test Campaign</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-900/50">
              {messages.length === 0 ? (
                <div className="text-center py-6">
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center mx-auto mb-3`}>
                    <span className="text-white font-semibold text-xl">{persona.initials}</span>
                  </div>
                  <p className="text-white text-sm font-medium mb-3">Chat with {persona.firstName} {persona.lastName}</p>
                  <div className="space-y-2 px-4">
                    <button 
                      onClick={() => setInput('Summarize competitor landscape for Marketing Team')}
                      className="w-full text-xs p-2 rounded-lg bg-slate-800/50 text-slate-300 hover:bg-slate-800 hover:text-white transition-colors text-left"
                    >
                      Summarize competitor landscape
                    </button>
                    <button 
                      onClick={() => setInput('Suggest 5 content angles for our campaign')}
                      className="w-full text-xs p-2 rounded-lg bg-slate-800/50 text-slate-300 hover:bg-slate-800 hover:text-white transition-colors text-left"
                    >
                      Suggest 5 content angles
                    </button>
                    <button 
                      onClick={() => setInput('List top 10 questions prospects ask')}
                      className="w-full text-xs p-2 rounded-lg bg-slate-800/50 text-slate-300 hover:bg-slate-800 hover:text-white transition-colors text-left"
                    >
                      Top prospect questions
                    </button>
                  </div>
                </div>
              ) : (
                messages.map((msg, idx) => (
                  <div key={idx}>
                    <AgentMessageBubble message={msg} />
                    {msg.role === 'assistant' && (
                      <div className="flex items-center space-x-2 mt-2 ml-2">
                        <Button size="sm" variant="ghost" className="h-7 text-xs text-slate-400 hover:text-white hover:bg-slate-800">
                          <FileText className="w-3 h-3 mr-1" />
                          Create Task
                        </Button>
                        <Button size="sm" variant="ghost" className="h-7 text-xs text-slate-400 hover:text-white hover:bg-slate-800">
                          <Briefcase className="w-3 h-3 mr-1" />
                          Attach to Campaign
                        </Button>
                        <Button size="sm" variant="ghost" className="h-7 text-xs text-slate-400 hover:text-white hover:bg-slate-800">
                          <Mail className="w-3 h-3 mr-1" />
                          Draft Email
                        </Button>
                      </div>
                    )}
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="border-t border-slate-700 p-3 bg-slate-900/90">
              <div className="flex items-center space-x-2">
                <Input
                  placeholder="Type a message..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  className="bg-slate-800/50 border-slate-700 text-white text-sm"
                  disabled={sending}
                />
                <Button
                  onClick={handleSend}
                  disabled={!input.trim() || sending}
                  size="icon"
                  className="bg-blue-600 hover:bg-blue-700 h-9 w-9"
                >
                  {sending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
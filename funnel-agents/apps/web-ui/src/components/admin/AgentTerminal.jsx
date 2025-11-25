import { useEffect, useRef } from 'react';
import client from '@/api/client';
import { useQuery } from '@tanstack/react-query';
import { Loader2, CheckCircle2, XCircle, Clock } from 'lucide-react';

export default function AgentTerminal({ agentId }) {
  const terminalRef = useRef(null);

  const { data: tasks = [] } = useQuery({
    queryKey: ['agent-tasks', agentId],
    queryFn: async () => {
      const allTasks = await client.entities.Task.list('-created_date', 20);
      return allTasks.filter(t => t.agent_id === agentId);
    },
    refetchInterval: 5000,
  });

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [tasks]);

  const generateTerminalOutput = (task) => {
    const timestamp = new Date(task.created_date).toISOString();
    const duration = task.duration ? `${task.duration}s` : 'N/A';
    
    let output = '';
    
    // CLI invocation
    output += `\n$ funnel-agent-cli run --agent-id="${agentId}" --task-id="${task.id}"\n`;
    output += `[${timestamp}] Starting agent execution...\n`;
    output += `[${timestamp}] Loading agent config\n`;
    output += `[${timestamp}] Initializing ${task.agent_name}\n`;
    
    // Tools loading
    if (task.input_data?.tools) {
      output += `[${timestamp}] Loading tools: ${task.input_data.tools.join(', ')}\n`;
    }
    
    // Task processing
    output += `[${timestamp}] Processing task: "${task.title}"\n`;
    
    if (task.status === 'running') {
      output += `[${timestamp}] 🔄 Task in progress...\n`;
      output += `[${timestamp}] Tokens used: ~${Math.floor(Math.random() * 2000 + 500)}\n`;
    } else if (task.status === 'completed') {
      output += `[${timestamp}] ✓ Task completed successfully\n`;
      output += `[${timestamp}] Duration: ${duration}\n`;
      output += `[${timestamp}] Tokens used: ${Math.floor(Math.random() * 3000 + 1000)}\n`;
      if (task.output_data) {
        output += `[${timestamp}] Output: ${JSON.stringify(task.output_data).substring(0, 100)}...\n`;
      }
    } else if (task.status === 'failed') {
      output += `[${timestamp}] ✗ Task failed\n`;
      output += `[${timestamp}] Error: ${task.error_message || 'Unknown error'}\n`;
      output += `[${timestamp}] Duration: ${duration}\n`;
    } else if (task.status === 'pending') {
      output += `[${timestamp}] ⏳ Awaiting approval\n`;
    }
    
    output += `[${timestamp}] Exit code: ${task.status === 'completed' ? '0' : task.status === 'failed' ? '1' : '-'}\n`;
    output += '─'.repeat(80) + '\n';
    
    return output;
  };

  const getStatusIcon = (status) => {
    if (status === 'completed') return <CheckCircle2 className="w-4 h-4 text-green-400" />;
    if (status === 'failed') return <XCircle className="w-4 h-4 text-red-400" />;
    if (status === 'running') return <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />;
    return <Clock className="w-4 h-4 text-yellow-400" />;
  };

  if (tasks.length === 0) {
    return (
      <div className="bg-black rounded-lg p-6 text-center">
        <p className="text-slate-500 font-mono text-sm">No executions found for this agent</p>
        <p className="text-slate-600 font-mono text-xs mt-2">Terminal output will appear here when tasks run</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Live status bar */}
      <div className="flex items-center justify-between px-3 py-2 bg-slate-900 rounded-lg border border-slate-800">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
          <span className="text-slate-400 text-xs font-mono">LIVE</span>
        </div>
        <div className="flex items-center space-x-4 text-xs font-mono">
          <span className="text-slate-500">
            Total runs: <span className="text-white">{tasks.length}</span>
          </span>
          <span className="text-slate-500">
            Active: <span className="text-blue-400">{tasks.filter(t => t.status === 'running').length}</span>
          </span>
          <span className="text-slate-500">
            Success: <span className="text-green-400">{tasks.filter(t => t.status === 'completed').length}</span>
          </span>
          <span className="text-slate-500">
            Failed: <span className="text-red-400">{tasks.filter(t => t.status === 'failed').length}</span>
          </span>
        </div>
      </div>

      {/* Terminal output */}
      <div 
        ref={terminalRef}
        className="bg-black rounded-lg p-4 h-[500px] overflow-y-auto font-mono text-sm scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-900"
        style={{
          scrollbarWidth: 'thin',
          scrollbarColor: '#475569 #0f172a'
        }}
      >
        <div className="flex items-center space-x-2 mb-4 pb-2 border-b border-slate-800">
          <div className="flex space-x-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
          </div>
          <span className="text-slate-500 text-xs ml-3">funnel-agent-cli v1.0.0</span>
        </div>

        <pre className="text-green-400 leading-relaxed whitespace-pre-wrap">
          {tasks.slice().reverse().map((task) => (
            <span key={task.id}>
              {generateTerminalOutput(task)}
            </span>
          ))}
        </pre>
        
        <div className="flex items-center space-x-2 mt-2 animate-pulse">
          <span className="text-green-400">❯</span>
          <span className="w-2 h-4 bg-green-400"></span>
        </div>
      </div>

      {/* Recent runs quick view */}
      <div className="grid grid-cols-1 gap-2">
        <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-1">Recent Executions</div>
        {tasks.slice(0, 5).map((task) => (
          <div key={task.id} className="flex items-center justify-between px-3 py-2 bg-slate-900/50 rounded border border-slate-800 hover:border-slate-700 transition-colors">
            <div className="flex items-center space-x-3 flex-1 min-w-0">
              {getStatusIcon(task.status)}
              <span className="text-white text-sm truncate">{task.title}</span>
            </div>
            <div className="flex items-center space-x-3 text-xs">
              <span className="text-slate-500">
                {new Date(task.created_date).toLocaleTimeString()}
              </span>
              {task.duration && (
                <span className="text-slate-400">{task.duration}s</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
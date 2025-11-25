import { useState } from 'react';
import client from '@/api/client';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Terminal, Copy, Search, RefreshCw, Shield, Box } from 'lucide-react';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import AgentTerminal from '../components/admin/AgentTerminal';
import UserPermissionsManager from '../components/admin/UserPermissionsManager';

export default function AdminPanel() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDomain, setSelectedDomain] = useState('all');

  const { data: agents = [] } = useQuery({
    queryKey: ['agents'],
    queryFn: () => client.entities.Agent.list(),
    initialData: [],
  });

  const domains = ['Offer', 'Marketing', 'Sales', 'Fulfillment', 'Feedback Loop', 'Operations', 'Customer Support', 'Leadership', 'Innovation', 'Enablement'];

  const filteredAgents = agents.filter(agent => {
    const matchesSearch = agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         agent.role.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDomain = selectedDomain === 'all' || agent.domain === selectedDomain;
    return matchesSearch && matchesDomain;
  });

  const generateAgentSpec = (agent) => ({
    id: agent.id,
    name: agent.name,
    role: agent.role,
    domain: agent.domain,
    status: agent.status,
    model: agent.model || 'gpt-4',
    temperature: agent.temperature || 0.7,
    tools: agent.tools_enabled || [],
    tools_config: agent.tools_config || {},
    max_tokens: 4000,
    timeout: 300,
  });

  const generateCLICommand = (agent) => {
    const spec = generateAgentSpec(agent);
    return `funnel-agent-cli run \\
  --agent-id="${agent.id}" \\
  --agent-name="${agent.name}" \\
  --domain="${agent.domain}" \\
  --model="${spec.model}" \\
  --temperature=${spec.temperature} \\
  --context=context.json`;
  };

  const generateDockerCommand = (agent) => {
    return `docker run -d \\
  --name funnel-agent-${agent.id} \\
  -e AGENT_ID="${agent.id}" \\
  -e AGENT_NAME="${agent.name}" \\
  -e DOMAIN="${agent.domain}" \\
  -v ./agent-configs:/configs \\
  funnelagents/cli:latest`;
  };

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-3">
            <Shield className="w-8 h-8 text-red-400" />
            <div>
              <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>Admin Panel</h1>
              <p className="mt-1" style={{ color: 'var(--text-secondary)' }}>CLI configurations and agent runtime specs</p>
            </div>
          </div>
        </div>
        <Button variant="outline" className="border-slate-700 text-white hover:bg-slate-800/50">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      <Tabs defaultValue="agents" className="w-full">
        <TabsList style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
          <TabsTrigger value="agents" style={{ color: 'var(--text-secondary)' }} className="data-[state=active]:bg-[var(--bg-card)] data-[state=active]:text-[var(--text-primary)]">
            <Box className="w-4 h-4 mr-2" />
            Agents
          </TabsTrigger>
          <TabsTrigger value="permissions" style={{ color: 'var(--text-secondary)' }} className="data-[state=active]:bg-[var(--bg-card)] data-[state=active]:text-[var(--text-primary)]">
            <Shield className="w-4 h-4 mr-2" />
            User Permissions
          </TabsTrigger>
          <TabsTrigger value="terminal" style={{ color: 'var(--text-secondary)' }} className="data-[state=active]:bg-[var(--bg-card)] data-[state=active]:text-[var(--text-primary)]">
            <Terminal className="w-4 h-4 mr-2" />
            Terminal
          </TabsTrigger>
        </TabsList>

        <TabsContent value="agents" className="space-y-4 mt-6">
          {/* Filters */}
          <Card className="p-4" style={{ 
            backgroundColor: 'var(--bg-card)', 
            border: '1px solid var(--border-subtle)',
            borderRadius: '12px'
          }}>
            <div className="flex items-center space-x-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                <Input
                  placeholder="Search agents..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  style={{ 
                    backgroundColor: 'var(--bg-surface)', 
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-primary)'
                  }}
                />
              </div>
              <Select value={selectedDomain} onValueChange={setSelectedDomain}>
                <SelectTrigger className="w-48" style={{ 
                  backgroundColor: 'var(--bg-surface)', 
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-primary)'
                }}>
                  <SelectValue placeholder="All domains" />
                </SelectTrigger>
                <SelectContent style={{ 
                  backgroundColor: 'var(--bg-surface)', 
                  border: '1px solid var(--border-medium)'
                }}>
                  <SelectItem value="all" className="focus:bg-[var(--bg-surface-hover)]" style={{ color: 'var(--text-secondary)' }}>
                    All Domains
                  </SelectItem>
                  {domains.map(domain => (
                    <SelectItem key={domain} value={domain} className="focus:bg-[var(--bg-surface-hover)]" style={{ color: 'var(--text-secondary)' }}>
                      {domain}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </Card>

          {/* Agents List */}
          <div className="space-y-4">
            {filteredAgents.map((agent) => (
              <Card key={agent.id} className="glassmorphism-light border-slate-800/50 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center space-x-3">
                      <h3 className="text-xl font-semibold text-white">{agent.name}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        agent.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-slate-500/20 text-slate-400'
                      }`}>
                        {agent.status}
                      </span>
                    </div>
                    <p className="text-slate-400 text-sm mt-1">
                      {agent.domain} • {agent.role}
                    </p>
                  </div>
                </div>

                <Tabs defaultValue="spec" className="w-full">
                  <TabsList className="glassmorphism-light border-slate-800/50">
                    <TabsTrigger value="spec">Agent Spec</TabsTrigger>
                    <TabsTrigger value="cli">CLI Command</TabsTrigger>
                    <TabsTrigger value="docker">Docker</TabsTrigger>
                    <TabsTrigger value="terminal">Terminal Output</TabsTrigger>
                  </TabsList>

                  <TabsContent value="spec" className="mt-4">
                    <div className="relative">
                      <pre className="bg-slate-900/50 rounded-lg p-4 text-sm text-slate-300 overflow-x-auto">
                        {JSON.stringify(generateAgentSpec(agent), null, 2)}
                      </pre>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(JSON.stringify(generateAgentSpec(agent), null, 2), 'Spec')}
                        className="absolute top-2 right-2 text-slate-400 hover:text-white"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </TabsContent>

                  <TabsContent value="cli" className="mt-4">
                    <div className="relative">
                      <pre className="bg-slate-900/50 rounded-lg p-4 text-sm text-green-400 overflow-x-auto font-mono">
                        {generateCLICommand(agent)}
                      </pre>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(generateCLICommand(agent), 'CLI command')}
                        className="absolute top-2 right-2 text-slate-400 hover:text-white"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="mt-4 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                      <p className="text-blue-400 text-xs">
                        <strong>Usage:</strong> Create context.json with task details and run this command to execute the agent.
                      </p>
                    </div>
                  </TabsContent>

                  <TabsContent value="docker" className="mt-4">
                    <div className="relative">
                      <pre className="bg-slate-900/50 rounded-lg p-4 text-sm text-cyan-400 overflow-x-auto font-mono">
                        {generateDockerCommand(agent)}
                      </pre>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(generateDockerCommand(agent), 'Docker command')}
                        className="absolute top-2 right-2 text-slate-400 hover:text-white"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="mt-4 p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
                      <p className="text-purple-400 text-xs">
                        <strong>Note:</strong> Mount config files and set environment variables for tools/integrations.
                      </p>
                    </div>
                  </TabsContent>

                  <TabsContent value="terminal" className="mt-4">
                    <AgentTerminal agentId={agent.id} />
                  </TabsContent>
                </Tabs>
              </Card>
            ))}
          </div>

          {filteredAgents.length === 0 && (
            <Card className="glassmorphism-light border-slate-800/50 p-12 text-center">
              <Terminal className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No agents found</h3>
              <p className="text-slate-400">Try adjusting your filters</p>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="permissions" className="space-y-4 mt-6">
          <UserPermissionsManager />
        </TabsContent>

        <TabsContent value="terminal" className="space-y-4 mt-6">
          <AgentTerminal />
        </TabsContent>
      </Tabs>
    </div>
  );
}
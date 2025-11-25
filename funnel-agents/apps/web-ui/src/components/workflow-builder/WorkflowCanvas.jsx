import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trash2, Bot, Clock,
  Bell, Webhook, GitBranch, Zap, AlertTriangle, TrendingUp, Flame
} from 'lucide-react';

export default function WorkflowCanvas({ workflow, onUpdateWorkflow, agents = [], performanceData = null }) {
  const [selectedNode, setSelectedNode] = useState(null);
  const [draggedNode, setDraggedNode] = useState(null);

  const nodeTypes = [
    { type: 'agent', icon: Bot, label: 'Agent', color: 'blue' },
    { type: 'condition', icon: GitBranch, label: 'Condition', color: 'yellow' },
    { type: 'delay', icon: Clock, label: 'Delay', color: 'purple' },
    { type: 'notification', icon: Bell, label: 'Notification', color: 'green' },
    { type: 'webhook', icon: Webhook, label: 'Webhook', color: 'orange' }
  ];

  const handleAddNode = (type) => {
    const newNode = {
      id: `node_${Date.now()}`,
      type,
      position: { x: 100, y: 100 },
      config: {}
    };

    if (type === 'agent' && agents.length > 0) {
      newNode.agent_id = agents[0].id;
      newNode.agent_name = agents[0].name;
    }

    const updatedNodes = [...(workflow.nodes || []), newNode];
    onUpdateWorkflow({ nodes: updatedNodes });
    setSelectedNode(newNode);
  };

  const handleDeleteNode = (nodeId) => {
    const updatedNodes = workflow.nodes.filter(n => n.id !== nodeId);
    const updatedEdges = workflow.edges?.filter(e => e.source !== nodeId && e.target !== nodeId) || [];
    
    onUpdateWorkflow({ 
      nodes: updatedNodes,
      edges: updatedEdges
    });
    setSelectedNode(null);
  };

  const handleConnectNodes = (sourceId, targetId) => {
    const newEdge = {
      id: `edge_${Date.now()}`,
      source: sourceId,
      target: targetId
    };

    const updatedEdges = [...(workflow.edges || []), newEdge];
    onUpdateWorkflow({ edges: updatedEdges });
  };

  const handleUpdateNodeConfig = (nodeId, config) => {
    const updatedNodes = workflow.nodes.map(n => 
      n.id === nodeId ? { ...n, config: { ...n.config, ...config } } : n
    );
    onUpdateWorkflow({ nodes: updatedNodes });
  };

  const getNodeColor = (type) => {
    const typeConfig = nodeTypes.find(t => t.type === type);
    return typeConfig?.color || 'gray';
  };

  const getNodeIcon = (type) => {
    const typeConfig = nodeTypes.find(t => t.type === type);
    return typeConfig?.icon || Bot;
  };

  const getNodePerformance = (nodeId) => {
    if (!performanceData?.analysis) return null;
    
    // Check if this node is a bottleneck
    const bottleneck = performanceData.analysis.bottlenecks?.find(b => b.node_id === nodeId);
    
    // Check if there are optimizations for this node
    const optimizations = performanceData.analysis.optimizations?.filter(
      opt => opt.target === nodeId || opt.type === 'node_optimization'
    );

    // Check for parallelization opportunities (nodes that could run in parallel)
    const canParallelize = performanceData.analysis.optimizations?.some(
      opt => opt.type === 'structure' && opt.description?.includes('parallel') && opt.target === nodeId
    );

    return { bottleneck, optimizations, canParallelize };
  };

  const getNodeBorderColor = (nodeId) => {
    const perf = getNodePerformance(nodeId);
    if (!perf) return 'var(--border-subtle)';
    
    if (perf.bottleneck?.severity === 'high') return '#ef4444'; // red
    if (perf.bottleneck?.severity === 'medium') return '#f59e0b'; // orange
    if (perf.canParallelize) return '#10b981'; // green
    return 'var(--border-subtle)';
  };

  const getNodeGlowEffect = (nodeId) => {
    const perf = getNodePerformance(nodeId);
    if (!perf) return '';
    
    if (perf.bottleneck?.severity === 'high') return '0 0 20px rgba(239, 68, 68, 0.5)';
    if (perf.bottleneck?.severity === 'medium') return '0 0 20px rgba(245, 158, 11, 0.5)';
    if (perf.canParallelize) return '0 0 20px rgba(16, 185, 129, 0.5)';
    return '';
  };

  return (
    <div className="flex h-[600px]">
      {/* Node Palette */}
      <div className="w-48 p-4 space-y-2" style={{ 
        backgroundColor: 'var(--bg-surface)', 
        borderRight: '1px solid var(--border-subtle)' 
      }}>
        <p className="text-xs font-medium mb-3" style={{ color: 'var(--text-muted)' }}>
          DRAG TO ADD
        </p>
        {nodeTypes.map((nodeType) => {
          const Icon = nodeType.icon;
          return (
            <div
              key={nodeType.type}
              className="p-3 rounded-lg cursor-move hover:opacity-80 transition-opacity"
              style={{ 
                backgroundColor: `var(--bg-${nodeType.color})`,
                border: '1px solid var(--border-subtle)'
              }}
              onClick={() => handleAddNode(nodeType.type)}
            >
              <div className="flex items-center space-x-2">
                <Icon className="w-4 h-4" style={{ color: 'var(--text-primary)' }} />
                <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                  {nodeType.label}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Canvas */}
      <div className="flex-1 relative" style={{ backgroundColor: 'var(--bg-app)' }}>
        {/* Grid pattern */}
        <div 
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: 'radial-gradient(circle, var(--text-muted) 1px, transparent 1px)',
            backgroundSize: '20px 20px'
          }}
        />

        {/* Nodes */}
        <div className="absolute inset-0 p-8">
          {workflow.nodes?.map((node) => {
            const Icon = getNodeIcon(node.type);
            const color = getNodeColor(node.type);
            const nodePerf = getNodePerformance(node.id);
            const borderColor = getNodeBorderColor(node.id);
            const glowEffect = getNodeGlowEffect(node.id);
            
            return (
              <div
                key={node.id}
                className="absolute"
                style={{
                  left: node.position?.x || 100,
                  top: node.position?.y || 100
                }}
              >
                <Card 
                  className={`p-4 w-48 cursor-pointer transition-all ${
                    selectedNode?.id === node.id ? 'ring-2 ring-blue-500' : ''
                  }`}
                  onClick={() => setSelectedNode(node)}
                  style={{ 
                    backgroundColor: 'var(--bg-card)', 
                    borderWidth: nodePerf ? '2px' : '1px',
                    borderColor: borderColor,
                    borderStyle: 'solid',
                    boxShadow: glowEffect
                  }}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <Icon className="w-4 h-4 text-blue-400" />
                      <Badge className={`text-xs bg-${color}-500/20 text-${color}-400`}>
                        {node.type}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-1">
                      {nodePerf?.bottleneck && (
                        <div className="relative group">
                          <AlertTriangle className={`w-4 h-4 ${
                            nodePerf.bottleneck.severity === 'high' ? 'text-red-400' :
                            nodePerf.bottleneck.severity === 'medium' ? 'text-orange-400' :
                            'text-yellow-400'
                          }`} />
                          <div className="absolute right-0 top-6 w-48 p-2 rounded text-xs bg-slate-900 border border-slate-700 opacity-0 group-hover:opacity-100 pointer-events-none z-50">
                            {nodePerf.bottleneck.issue}
                          </div>
                        </div>
                      )}
                      {nodePerf?.canParallelize && (
                        <div className="relative group">
                          <TrendingUp className="w-4 h-4 text-green-400" />
                          <div className="absolute right-0 top-6 w-48 p-2 rounded text-xs bg-slate-900 border border-slate-700 opacity-0 group-hover:opacity-100 pointer-events-none z-50">
                            Can be parallelized
                          </div>
                        </div>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 -mt-1 -mr-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteNode(node.id);
                        }}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                  
                  <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
                    {node.type === 'agent' ? node.agent_name || 'Select Agent' : node.type}
                  </p>
                  
                  {node.config?.instructions && (
                    <p className="text-xs line-clamp-2" style={{ color: 'var(--text-muted)' }}>
                      {node.config.instructions}
                    </p>
                  )}

                  {/* Performance indicator badge */}
                  {nodePerf?.optimizations?.length > 0 && (
                    <div className="mt-2 flex items-center space-x-1 text-xs">
                      <Flame className="w-3 h-3 text-purple-400" />
                      <span className="text-purple-400">{nodePerf.optimizations.length} optimization{nodePerf.optimizations.length > 1 ? 's' : ''}</span>
                    </div>
                  )}

                  {/* Connection points */}
                  <div className="absolute -right-2 top-1/2 -translate-y-1/2">
                    <div className="w-4 h-4 rounded-full bg-blue-500 border-2 border-white" />
                  </div>
                  <div className="absolute -left-2 top-1/2 -translate-y-1/2">
                    <div className="w-4 h-4 rounded-full bg-blue-500 border-2 border-white" />
                  </div>
                </Card>
              </div>
            );
          })}

          {/* Edges (connections) */}
          <svg className="absolute inset-0 pointer-events-none">
            {workflow.edges?.map((edge) => {
              const sourceNode = workflow.nodes?.find(n => n.id === edge.source);
              const targetNode = workflow.nodes?.find(n => n.id === edge.target);
              
              if (!sourceNode || !targetNode) return null;

              const x1 = (sourceNode.position?.x || 100) + 192; // 48 * 4 (w-48)
              const y1 = (sourceNode.position?.y || 100) + 40;
              const x2 = (targetNode.position?.x || 100);
              const y2 = (targetNode.position?.y || 100) + 40;

              // Check if edge is part of a bottleneck path
              const sourcePerf = getNodePerformance(edge.source);
              const targetPerf = getNodePerformance(edge.target);
              const isBottleneckPath = sourcePerf?.bottleneck || targetPerf?.bottleneck;
              const edgeColor = isBottleneckPath ? '#f59e0b' : 'var(--border-subtle)';
              const edgeWidth = isBottleneckPath ? '3' : '2';

              return (
                <g key={edge.id}>
                  <line
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke={edgeColor}
                    strokeWidth={edgeWidth}
                    markerEnd={isBottleneckPath ? "url(#arrowhead-warning)" : "url(#arrowhead)"}
                    strokeDasharray={isBottleneckPath ? "5,5" : "none"}
                  />
                </g>
              );
            })}
            <defs>
              <marker
                id="arrowhead"
                markerWidth="10"
                markerHeight="10"
                refX="9"
                refY="3"
                orient="auto"
              >
                <polygon
                  points="0 0, 10 3, 0 6"
                  fill="var(--border-subtle)"
                />
              </marker>
              <marker
                id="arrowhead-warning"
                markerWidth="10"
                markerHeight="10"
                refX="9"
                refY="3"
                orient="auto"
              >
                <polygon
                  points="0 0, 10 3, 0 6"
                  fill="#f59e0b"
                />
              </marker>
            </defs>
          </svg>

          {/* Performance Legend */}
          {performanceData && (
            <div className="absolute bottom-4 right-4 p-3 rounded-lg border" style={{ 
              backgroundColor: 'var(--bg-card)', 
              borderColor: 'var(--border-subtle)' 
            }}>
              <p className="text-xs font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                Performance Indicators
              </p>
              <div className="space-y-1.5 text-xs">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="w-3 h-3 text-red-400" />
                  <span style={{ color: 'var(--text-secondary)' }}>High severity bottleneck</span>
                </div>
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="w-3 h-3 text-orange-400" />
                  <span style={{ color: 'var(--text-secondary)' }}>Medium severity bottleneck</span>
                </div>
                <div className="flex items-center space-x-2">
                  <TrendingUp className="w-3 h-3 text-green-400" />
                  <span style={{ color: 'var(--text-secondary)' }}>Parallelization opportunity</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Flame className="w-3 h-3 text-purple-400" />
                  <span style={{ color: 'var(--text-secondary)' }}>Has optimizations</span>
                </div>
              </div>
            </div>
          )}

          {/* Empty state */}
          {(!workflow.nodes || workflow.nodes.length === 0) && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <Zap className="w-12 h-12 mx-auto mb-4 text-slate-600" />
                <p className="text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>
                  Start building your workflow
                </p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  Click on a node type to add it to the canvas
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Node Config Panel */}
      {selectedNode && (
        <div className="w-80 p-4 space-y-4 overflow-y-auto" style={{ 
          backgroundColor: 'var(--bg-surface)', 
          borderLeft: '1px solid var(--border-subtle)' 
        }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
              Node Settings
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedNode(null)}
            >
              Close
            </Button>
          </div>

          {selectedNode.type === 'agent' && (
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium mb-2 block" style={{ color: 'var(--text-secondary)' }}>
                  Select Agent
                </label>
                <select
                  value={selectedNode.agent_id || ''}
                  onChange={(e) => {
                    const agent = agents.find(a => a.id === e.target.value);
                    const updatedNodes = workflow.nodes.map(n => 
                      n.id === selectedNode.id 
                        ? { ...n, agent_id: agent.id, agent_name: agent.name }
                        : n
                    );
                    onUpdateWorkflow({ nodes: updatedNodes });
                    setSelectedNode({ ...selectedNode, agent_id: agent.id, agent_name: agent.name });
                  }}
                  className="w-full p-2 rounded border text-sm"
                  style={{ 
                    backgroundColor: 'var(--bg-card)', 
                    borderColor: 'var(--border-subtle)',
                    color: 'var(--text-primary)'
                  }}
                >
                  {agents.map(agent => (
                    <option key={agent.id} value={agent.id}>
                      {agent.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium mb-2 block" style={{ color: 'var(--text-secondary)' }}>
                  Instructions
                </label>
                <textarea
                  value={selectedNode.config?.instructions || ''}
                  onChange={(e) => handleUpdateNodeConfig(selectedNode.id, { instructions: e.target.value })}
                  className="w-full p-2 rounded border text-sm h-24"
                  style={{ 
                    backgroundColor: 'var(--bg-card)', 
                    borderColor: 'var(--border-subtle)',
                    color: 'var(--text-primary)'
                  }}
                  placeholder="What should this agent do?"
                />
              </div>
            </div>
          )}

          {selectedNode.type === 'condition' && (
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium mb-2 block" style={{ color: 'var(--text-secondary)' }}>
                  Field
                </label>
                <input
                  type="text"
                  value={selectedNode.config?.field || ''}
                  onChange={(e) => handleUpdateNodeConfig(selectedNode.id, { field: e.target.value })}
                  className="w-full p-2 rounded border text-sm"
                  style={{ 
                    backgroundColor: 'var(--bg-card)', 
                    borderColor: 'var(--border-subtle)',
                    color: 'var(--text-primary)'
                  }}
                  placeholder="e.g., rating"
                />
              </div>

              <div>
                <label className="text-xs font-medium mb-2 block" style={{ color: 'var(--text-secondary)' }}>
                  Operator
                </label>
                <select
                  value={selectedNode.config?.operator || 'equals'}
                  onChange={(e) => handleUpdateNodeConfig(selectedNode.id, { operator: e.target.value })}
                  className="w-full p-2 rounded border text-sm"
                  style={{ 
                    backgroundColor: 'var(--bg-card)', 
                    borderColor: 'var(--border-subtle)',
                    color: 'var(--text-primary)'
                  }}
                >
                  <option value="equals">Equals</option>
                  <option value="not_equals">Not Equals</option>
                  <option value="greater_than">Greater Than</option>
                  <option value="less_than">Less Than</option>
                  <option value="contains">Contains</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-medium mb-2 block" style={{ color: 'var(--text-secondary)' }}>
                  Value
                </label>
                <input
                  type="text"
                  value={selectedNode.config?.value || ''}
                  onChange={(e) => handleUpdateNodeConfig(selectedNode.id, { value: e.target.value })}
                  className="w-full p-2 rounded border text-sm"
                  style={{ 
                    backgroundColor: 'var(--bg-card)', 
                    borderColor: 'var(--border-subtle)',
                    color: 'var(--text-primary)'
                  }}
                  placeholder="e.g., 3"
                />
              </div>
            </div>
          )}

          {selectedNode.type === 'delay' && (
            <div>
              <label className="text-xs font-medium mb-2 block" style={{ color: 'var(--text-secondary)' }}>
                Delay (seconds)
              </label>
              <input
                type="number"
                value={selectedNode.config?.delay_seconds || 60}
                onChange={(e) => handleUpdateNodeConfig(selectedNode.id, { delay_seconds: parseInt(e.target.value) })}
                className="w-full p-2 rounded border text-sm"
                style={{ 
                  backgroundColor: 'var(--bg-card)', 
                  borderColor: 'var(--border-subtle)',
                  color: 'var(--text-primary)'
                }}
              />
            </div>
          )}

          {selectedNode.type === 'notification' && (
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium mb-2 block" style={{ color: 'var(--text-secondary)' }}>
                  Subject
                </label>
                <input
                  type="text"
                  value={selectedNode.config?.subject || ''}
                  onChange={(e) => handleUpdateNodeConfig(selectedNode.id, { subject: e.target.value })}
                  className="w-full p-2 rounded border text-sm"
                  style={{ 
                    backgroundColor: 'var(--bg-card)', 
                    borderColor: 'var(--border-subtle)',
                    color: 'var(--text-primary)'
                  }}
                />
              </div>

              <div>
                <label className="text-xs font-medium mb-2 block" style={{ color: 'var(--text-secondary)' }}>
                  Body
                </label>
                <textarea
                  value={selectedNode.config?.body || ''}
                  onChange={(e) => handleUpdateNodeConfig(selectedNode.id, { body: e.target.value })}
                  className="w-full p-2 rounded border text-sm h-24"
                  style={{ 
                    backgroundColor: 'var(--bg-card)', 
                    borderColor: 'var(--border-subtle)',
                    color: 'var(--text-primary)'
                  }}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
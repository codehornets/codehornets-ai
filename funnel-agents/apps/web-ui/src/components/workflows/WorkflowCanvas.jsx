import { useState, useCallback } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import WorkflowNode from './WorkflowNode';
import NodeConnectionLine from './NodeConnectionLine';
import EnhancedAddNodePanel from './EnhancedAddNodePanel';

export default function WorkflowCanvas({ workflow, onUpdateWorkflow }) {
  const [nodes, setNodes] = useState(workflow?.nodes || []);
  const [connections, setConnections] = useState(workflow?.connections || []);
  const [selectedNode, setSelectedNode] = useState(null);
  const [showAddPanel, setShowAddPanel] = useState(false);
  const [draggedNode, setDraggedNode] = useState(null);
  const [connectingFrom, setConnectingFrom] = useState(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  const handleAddNode = useCallback((nodeType, config) => {
    const newNode = {
      id: `node-${Date.now()}`,
      type: nodeType,
      config,
      position: { x: 100 + nodes.length * 50, y: 100 + nodes.length * 50 },
    };
    const updatedNodes = [...nodes, newNode];
    setNodes(updatedNodes);
    onUpdateWorkflow({ ...workflow, nodes: updatedNodes });
    setShowAddPanel(false);
  }, [nodes, workflow, onUpdateWorkflow]);

  const handleDeleteNode = useCallback((nodeId) => {
    const updatedNodes = nodes.filter(n => n.id !== nodeId);
    const updatedConnections = connections.filter(c => c.from !== nodeId && c.to !== nodeId);
    setNodes(updatedNodes);
    setConnections(updatedConnections);
    onUpdateWorkflow({ ...workflow, nodes: updatedNodes, connections: updatedConnections });
    setSelectedNode(null);
  }, [nodes, connections, workflow, onUpdateWorkflow]);

  const handleNodeDragStart = (nodeId) => {
    setDraggedNode(nodeId);
  };

  const handleNodeDrag = (nodeId, position) => {
    const updatedNodes = nodes.map(n => n.id === nodeId ? { ...n, position } : n);
    setNodes(updatedNodes);
  };

  const handleNodeDragEnd = () => {
    setDraggedNode(null);
    onUpdateWorkflow({ ...workflow, nodes });
  };

  const handleStartConnection = (nodeId, event) => {
    if (connectingFrom === nodeId) {
      setConnectingFrom(null); // Cancel if clicking same node
    } else {
      setConnectingFrom(nodeId);
      if (event) {
        const canvas = document.querySelector('.workflow-canvas-container');
        const rect = canvas?.getBoundingClientRect();
        if (rect) {
          setMousePosition({
            x: event.clientX - rect.left,
            y: event.clientY - rect.top,
          });
        }
      }
    }
  };

  const handleEndConnection = (nodeId) => {
    if (connectingFrom && connectingFrom !== nodeId) {
      // Check if connection already exists
      const exists = connections.some(c => c.from === connectingFrom && c.to === nodeId);
      if (!exists) {
        const newConnection = {
          id: `conn-${Date.now()}`,
          from: connectingFrom,
          to: nodeId,
        };
        const updatedConnections = [...connections, newConnection];
        setConnections(updatedConnections);
        onUpdateWorkflow({ ...workflow, connections: updatedConnections });
      }
    }
    setConnectingFrom(null);
  };

  const handleDeleteConnection = (connId) => {
    const updatedConnections = connections.filter(c => c.id !== connId);
    setConnections(updatedConnections);
    onUpdateWorkflow({ ...workflow, connections: updatedConnections });
  };

  const handleCanvasMouseMove = (e) => {
    if (connectingFrom) {
      const canvas = e.currentTarget;
      const rect = canvas.getBoundingClientRect();
      setMousePosition({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    }
  };

  const handleCanvasClick = () => {
    if (connectingFrom) {
      setConnectingFrom(null); // Cancel connection on canvas click
    }
  };

  return (
    <div 
      className="workflow-canvas-container relative w-full h-[600px] bg-slate-900/50 rounded-lg border border-slate-800/50 overflow-hidden"
      onMouseMove={handleCanvasMouseMove}
      onClick={handleCanvasClick}
    >
      {/* Toolbar */}
      <div className="absolute top-4 left-4 z-20 flex items-center space-x-2">
        <Button
          size="sm"
          onClick={() => setShowAddPanel(true)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Node
        </Button>
        {connectingFrom && (
          <div className="px-3 py-1.5 rounded-lg bg-purple-500/20 border border-purple-500/50 text-purple-300 text-sm animate-pulse">
            Click on a target node to connect
          </div>
        )}
      </div>

      {/* Canvas */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        <defs>
          <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <circle cx="1" cy="1" r="1" fill="rgba(148, 163, 184, 0.1)" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
        
        {/* Connection Lines */}
        {connections.map(conn => {
          const fromNode = nodes.find(n => n.id === conn.from);
          const toNode = nodes.find(n => n.id === conn.to);
          if (!fromNode || !toNode) return null;
          return (
            <NodeConnectionLine
              key={conn.id}
              from={fromNode.position}
              to={toNode.position}
              onDelete={() => handleDeleteConnection(conn.id)}
            />
          );
        })}
        
        {/* Active Connection Line (while dragging) */}
        {connectingFrom && (
          <g className="pointer-events-none">
            <path
              d={`M ${nodes.find(n => n.id === connectingFrom).position.x + 96} ${nodes.find(n => n.id === connectingFrom).position.y + 80} L ${mousePosition.x} ${mousePosition.y}`}
              fill="none"
              stroke="rgba(168, 85, 247, 0.8)"
              strokeWidth="2"
              strokeDasharray="5,5"
              className="animate-pulse"
            />
            <circle
              cx={mousePosition.x}
              cy={mousePosition.y}
              r="6"
              fill="rgba(168, 85, 247, 0.8)"
              className="animate-pulse"
            />
          </g>
        )}
      </svg>

      {/* Nodes */}
      <div className="absolute inset-0 pointer-events-none">
        {nodes.map(node => (
          <div
            key={node.id}
            className="pointer-events-auto"
            style={{
              position: 'absolute',
              left: node.position.x,
              top: node.position.y,
            }}
          >
            <WorkflowNode
              node={node}
              selected={selectedNode === node.id}
              connecting={connectingFrom === node.id}
              onSelect={() => setSelectedNode(node.id)}
              onDelete={() => handleDeleteNode(node.id)}
              onDragStart={() => handleNodeDragStart(node.id)}
              onDrag={(pos) => handleNodeDrag(node.id, pos)}
              onDragEnd={handleNodeDragEnd}
              onStartConnection={(e) => handleStartConnection(node.id, e)}
              onEndConnection={() => handleEndConnection(node.id)}
            />
          </div>
        ))}
      </div>

      {/* Empty State */}
      {nodes.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <Plus className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h3 className="text-white font-semibold mb-2">Start Building Your Workflow</h3>
            <p className="text-slate-400 text-sm mb-4">Add nodes and connect them to create automation</p>
            <Button onClick={() => setShowAddPanel(true)} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Add First Node
            </Button>
          </div>
        </div>
      )}

      {/* Add Node Panel */}
      {showAddPanel && (
        <EnhancedAddNodePanel
          onAddNode={handleAddNode}
          onClose={() => setShowAddPanel(false)}
          workflow={workflow}
        />
      )}
    </div>
  );
}
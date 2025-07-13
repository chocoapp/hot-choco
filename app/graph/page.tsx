'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import ReactFlow, {
  ReactFlowProvider,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  NodeMouseHandler,
} from 'reactflow';
import 'reactflow/dist/style.css';
import SimpleFlowNode from '../../components/SimpleFlowNode';
import NodeDetailsPanel from '../../components/NodeDetailsPanel';
import { FlowData, FlowNode as FlowNodeType, FlowEdge, FlowNodeData } from '../../types/flow';
import { getLayoutedElements } from '../../utils/layoutUtils';

// Define custom node types outside component to prevent re-creation
const nodeTypes = {
  circularNode: SimpleFlowNode,
};

/**
 * Graph page component for visualizing user flows
 * Displays interactive flow diagrams using React Flow
 */
const GraphPage: React.FC = () => {
  const [flowData, setFlowData] = useState<FlowData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<FlowNodeData | null>(null);
  
  // Debug selectedNode changes
  useEffect(() => {
    console.log('Selected node changed:', selectedNode);
  }, [selectedNode]);

  // Load flow data from JSON file
  useEffect(() => {
    const loadFlowData = async () => {
      try {
        const response = await fetch('/flow.json');
        if (!response.ok) {
          throw new Error('Failed to load flow data');
        }
        const data: FlowData = await response.json();
        setFlowData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    loadFlowData();
  }, []);

  // Convert flow data to React Flow format with automatic layout
  const { initialNodes, initialEdges } = useMemo(() => {
    if (!flowData) return { initialNodes: [], initialEdges: [] };
    
    const nodes: Node[] = flowData.nodes.map((node: FlowNodeType) => ({
      id: node.id,
      type: 'circularNode',
      position: { x: 0, y: 0 }, // Will be overridden by layout
      data: node.data,
    }));

    const edges: Edge[] = flowData.edges.map((edge: FlowEdge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      type: edge.type,
      animated: edge.animated,
      label: edge.label,
      style: edge.style,
    }));

    // Apply automatic layout
    const layouted = getLayoutedElements(nodes, edges);
    
    return {
      initialNodes: layouted.nodes,
      initialEdges: layouted.edges,
    };
  }, [flowData]);

  // React Flow state management
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Update nodes and edges when flow data changes
  useEffect(() => {
    if (initialNodes.length > 0) {
      setNodes(initialNodes);
    }
    if (initialEdges.length > 0) {
      setEdges(initialEdges);
    }
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  // Handle node selection with improved stability
  const onNodeClick: NodeMouseHandler = useCallback((event, node) => {
    event.stopPropagation();
    console.log('Node clicked:', node.data);
    setSelectedNode(node.data as FlowNodeData);
  }, []);

  // Handle panel close
  const onClosePanel = useCallback(() => {
    setSelectedNode(null);
  }, []);

  // Handle background click to close panel
  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
  }, []);

  // Handle new connections (for interactive editing)
  const onConnect = useCallback((params: Connection) => {
    setEdges((eds) => addEdge(params, eds));
  }, [setEdges]);

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Loading flow data...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">⚠️</div>
          <p className="text-red-600">Error loading flow data: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full">
      {/* Header */}
      <div className="bg-white shadow-sm border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">User Flow Visualization</h1>
            <p className="text-sm text-gray-600 mt-1">
              Interactive graph showing the buyer order flow on web.spezi.app
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-blue-200 rounded-full"></div>
              <span className="text-sm text-gray-600">Buyer Role</span>
            </div>
            <div className="text-sm text-gray-500">
              {nodes.length} screens • {edges.length} transitions
            </div>
          </div>
        </div>
      </div>

      {/* React Flow Graph */}
      <div className="h-full relative">
        <ReactFlowProvider>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            onPaneClick={onPaneClick}
            nodeTypes={nodeTypes}
            fitView
            fitViewOptions={{
              padding: 0.3,
              includeHiddenNodes: false,
            }}
            defaultEdgeOptions={{
              animated: true,
              style: { strokeWidth: 2 },
            }}
            className="bg-gray-50"
            nodesDraggable={false}
            nodesConnectable={false}
            elementsSelectable={false}
            selectNodesOnDrag={false}
            panOnDrag={true}
            zoomOnScroll={true}
            proOptions={{ hideAttribution: true }}
          >
            {/* Background pattern */}
            <Background 
              color="#e5e7eb" 
              gap={20} 
              size={1}
              variant="dots"
            />
            
            {/* Navigation controls */}
            <Controls 
              position="bottom-left"
              className="bg-white shadow-lg border border-gray-200"
              showInteractive={false}
            />
            
            {/* Mini map */}
            <MiniMap 
              position="bottom-right"
              className="bg-white shadow-lg border border-gray-200"
              nodeColor={(node) => {
                const role = node.data.role;
                switch (role) {
                  case 'buyer': return '#3b82f6';
                  case 'distributor': return '#10b981';
                  case 'admin': return '#8b5cf6';
                  default: return '#6b7280';
                }
              }}
            />
          </ReactFlow>
        </ReactFlowProvider>

        {/* Details Panel */}
        <NodeDetailsPanel 
          nodeData={selectedNode}
          onClose={onClosePanel}
        />
      </div>
    </div>
  );
};

export default GraphPage;
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
import ProductFilter, { FilterOptions } from '../../components/ProductFilter';
import RiskOverview from '../../components/RiskOverview';
import { FlowData, FlowNode as FlowNodeType, FlowEdge, FlowNodeData } from '../../types/flow';
import { getLayoutedElements } from '../../utils/layoutUtils';
import { getRiskLevelNodeColor } from '../../services/qualityService';
import { supabaseService } from '../../lib/supabase';
import { allureService } from '../../lib/services';
import { BugReport } from '../../services/supabaseService';

// Define custom node types outside component to prevent re-creation
const nodeTypes = {
  circularNode: SimpleFlowNode,
};

// Helper functions for risk calculation with complexity factor
const calculateRiskScore = (openBugs: BugReport[], testCount: number, screenCount: number = 1): number => {
  // Bug Risk Score (60% weight - reduced from 70%)
  const bugVolumeScore = Math.min(openBugs.length * 3, 30);
  
  // Severity-weighted score
  const severityScore = openBugs.reduce((score, bug) => {
    switch (bug.severity) {
      case 'critical': return score + 20;
      case 'high': return score + 12;
      case 'medium': return score + 6;
      case 'low': return score + 2;
      default: return score + 6; // Default to medium
    }
  }, 0);

  const bugRiskScore = bugVolumeScore + severityScore;

  // Test Coverage Risk (25% weight - reduced from 30%)
  let testCoverageRisk = 0;
  if (testCount === 0) {
    testCoverageRisk = 30;
  } else if (testCount <= 5) {
    testCoverageRisk = 20;
  } else if (testCount <= 10) {
    testCoverageRisk = 10;
  } else {
    testCoverageRisk = 0;
  }

  // Feature Complexity Risk (15% weight - new factor)
  let complexityRisk = 0;
  if (screenCount === 1) {
    complexityRisk = 0;    // Single screen = no complexity penalty
  } else if (screenCount <= 2) {
    complexityRisk = 5;    // 2 screens = low complexity
  } else if (screenCount <= 4) {
    complexityRisk = 10;   // 3-4 screens = medium complexity
  } else {
    complexityRisk = 15;   // 5+ screens = high complexity
  }

  // Combined risk score: Bug Risk (50%) + Test Coverage Risk (40%) + Complexity Risk (10%)
  return (bugRiskScore * 0.50) + (testCoverageRisk * 0.40) + (complexityRisk * 0.10);
};

const getRiskLevel = (riskScore: number): 'low' | 'medium' | 'high' => {
  if (riskScore <= 20) return 'low';
  if (riskScore <= 40) return 'medium';
  return 'high';
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
  const [filters, setFilters] = useState<FilterOptions>({ products: [], sections: [], riskLevels: [] });
  const [showFilters, setShowFilters] = useState(false);
  const [showRiskOverview, setShowRiskOverview] = useState(false);
  
  // Initialize quality service (removed unused variable)
  // const qualityService = useMemo(() => {
  //   const supabaseService = new SupabaseServiceImpl();
  //   const allureService = new AllureServiceImpl();
  //   return new QualityServiceImpl(supabaseService, allureService);
  // }, []);
  
  // Debug selectedNode changes
  useEffect(() => {
    console.log('Selected node changed:', selectedNode);
  }, [selectedNode]);

  // Calculate dynamic risk levels for nodes using the same logic as RiskOverview
  const calculateDynamicRiskLevels = useCallback(async (nodes: FlowNodeType[]) => {
    const updatedNodes = await Promise.all(nodes.map(async (node) => {
      if (node.data.qualityMetrics && node.data.product && node.data.section && node.data.feature) {
        try {
          // Get real bug reports (not just count) from Supabase
          const openBugs = await supabaseService.getBugReportsByStatus(
            node.data.product, 
            'open', 
            node.data.section, 
            node.data.feature
          );
          
          // Get real test count from Allure TestOps
          const testStats = await allureService.getTestStats(
            node.data.product, 
            node.data.section, 
            node.data.feature
          );
          const testCount = testStats?.total || 0;
          
          // For individual screens, complexity is always 1 (since this is per-screen calculation)
          const screenCount = 1;
          const riskScore = calculateRiskScore(openBugs, testCount, screenCount);
          const calculatedRiskLevel = getRiskLevel(riskScore);
          
          console.log(`Risk calculation for ${node.data.label}:`, {
            openBugs: openBugs.length,
            testCount,
            screenCount,
            riskScore,
            calculatedRiskLevel,
            originalRiskLevel: node.data.qualityMetrics.riskLevel
          });
          
          return {
            ...node,
            data: {
              ...node.data,
              qualityMetrics: {
                bugCount: openBugs.length,
                testCount: testCount,
                riskLevel: calculatedRiskLevel,
                lastUpdated: new Date().toISOString()
              }
            }
          };
        } catch (error) {
          console.error(`Error calculating risk for ${node.data.label}:`, error);
          // Fall back to original risk level from JSON if API calls fail
          return node;
        }
      }
      return node;
    }));
    return updatedNodes;
  }, []);

  // Load flow data from JSON file
  useEffect(() => {
    const loadFlowData = async () => {
      try {
        const response = await fetch('/flow.json');
        if (!response.ok) {
          throw new Error('Failed to load flow data');
        }
        const data: FlowData = await response.json();
        
        // Calculate dynamic risk levels for all nodes
        const nodesWithDynamicRisk = await calculateDynamicRiskLevels(data.nodes);
        
        setFlowData({
          ...data,
          nodes: nodesWithDynamicRisk
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    loadFlowData();
  }, [calculateDynamicRiskLevels]);

  // Filter nodes based on selected filters
  const filteredNodes = useMemo(() => {
    if (!flowData) return [];
    
    return flowData.nodes.filter((node: FlowNodeType) => {
      const { products, sections, riskLevels } = filters;
      
      // If no filters are active, show all nodes
      if (products.length === 0 && sections.length === 0 && riskLevels.length === 0) {
        return true;
      }
      
      // Check product filter
      if (products.length > 0 && (!node.data.product || !products.includes(node.data.product))) {
        return false;
      }
      
      // Check section filter
      if (sections.length > 0 && (!node.data.section || !sections.includes(node.data.section))) {
        return false;
      }
      
      // Check risk level filter
      if (riskLevels.length > 0) {
        const riskLevel = node.data.qualityMetrics?.riskLevel;
        if (!riskLevel || !riskLevels.includes(riskLevel)) {
          return false;
        }
      }
      
      return true;
    });
  }, [flowData, filters]);

  // Convert flow data to React Flow format with automatic layout
  const { initialNodes, initialEdges } = useMemo(() => {
    if (!flowData) return { initialNodes: [], initialEdges: [] };
    
    const nodes: Node[] = filteredNodes.map((node: FlowNodeType) => ({
      id: node.id,
      type: 'circularNode',
      position: { x: 0, y: 0 }, // Will be overridden by layout
      data: node.data,
    }));

    // Filter edges to only include those connecting visible nodes
    const visibleNodeIds = new Set(nodes.map(n => n.id));
    const edges: Edge[] = flowData.edges
      .filter((edge: FlowEdge) => visibleNodeIds.has(edge.source) && visibleNodeIds.has(edge.target))
      .map((edge: FlowEdge) => ({
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
  }, [flowData, filteredNodes]);

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

  // Handle filter changes
  const handleFilterChange = useCallback((newFilters: FilterOptions) => {
    setFilters(newFilters);
  }, []);

  // Get all node data for filter component
  const allNodeData = useMemo(() => {
    return flowData?.nodes.map(node => node.data) || [];
  }, [flowData]);

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
    <div className="h-screen w-full flex flex-col">
      {/* Header - Fixed position */}
      <div className="bg-white shadow-sm border-b px-6 py-4 flex-shrink-0 relative z-50">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">User Flow Visualization</h1>
            <p className="text-sm text-gray-600 mt-1">
              Interactive graph showing the buyer order flow on web.spezi.app
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-3 py-1 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            >
              {showFilters ? 'Hide Filters' : 'Show Filters'}
            </button>
            <button
              onClick={() => setShowRiskOverview(!showRiskOverview)}
              className="px-3 py-1 text-sm font-medium text-gray-700 bg-red-100 hover:bg-red-200 rounded-md transition-colors"
            >
              {showRiskOverview ? 'Hide Risk Overview' : 'Risk Overview'}
            </button>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-600">Low Risk</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <span className="text-sm text-gray-600">Medium Risk</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span className="text-sm text-gray-600">High Risk</span>
              </div>
            </div>
            <div className="text-sm text-gray-500">
              {nodes.length} screens • {edges.length} transitions
            </div>
          </div>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="px-6 pb-4 flex-shrink-0 bg-white border-b">
          <ProductFilter 
            nodes={allNodeData}
            onFilterChange={handleFilterChange}
          />
        </div>
      )}

      {/* Risk Overview Panel */}
      {showRiskOverview && (
        <div className="px-6 pb-4 flex-shrink-0 bg-white border-b">
          <RiskOverview nodes={allNodeData} />
        </div>
      )}

      {/* React Flow Graph - Takes remaining space */}
      <div className="flex-1 relative">
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
                // Use risk level color if available, otherwise fall back to role color
                const riskLevel = node.data.qualityMetrics?.riskLevel;
                if (riskLevel) {
                  return getRiskLevelNodeColor(riskLevel);
                }
                
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
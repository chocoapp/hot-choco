import dagre from 'dagre';
import { Node, Edge, Position } from 'reactflow';

const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));

const nodeWidth = 96; // Width of circular nodes (24 * 4 = 96px)
const nodeHeight = 96; // Height of circular nodes

/**
 * Creates an automatic layout for React Flow nodes using dagre
 * Positions nodes in a left-to-right flow with proper spacing
 */
export const getLayoutedElements = (nodes: Node[], edges: Edge[], direction = 'LR') => {
  const isHorizontal = direction === 'LR';
  
  dagreGraph.setGraph({ 
    rankdir: direction,
    nodesep: 100, // Horizontal spacing between nodes
    ranksep: 150, // Vertical spacing between ranks
    marginx: 50,
    marginy: 50
  });

  // Add nodes to dagre graph
  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });

  // Add edges to dagre graph
  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  // Calculate layout
  dagre.layout(dagreGraph);

  // Apply positions to nodes
  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    
    return {
      ...node,
      targetPosition: isHorizontal ? Position.Left : Position.Top,
      sourcePosition: isHorizontal ? Position.Right : Position.Bottom,
      position: {
        x: nodeWithPosition.x - nodeWidth / 2,
        y: nodeWithPosition.y - nodeHeight / 2,
      },
    };
  });

  return { nodes: layoutedNodes, edges };
};

/**
 * Calculates bounds for fitting the view
 */
export const calculateGraphBounds = (nodes: Node[]) => {
  if (nodes.length === 0) return { width: 0, height: 0 };

  const xs = nodes.map(n => n.position.x);
  const ys = nodes.map(n => n.position.y);
  
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);

  return {
    width: maxX - minX + nodeWidth,
    height: maxY - minY + nodeHeight,
    minX,
    minY
  };
};
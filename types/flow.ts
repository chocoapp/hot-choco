/**
 * Types for the user flow visualization system
 */

export interface QualityMetrics {
  /** Test coverage percentage (0-100) */
  testCoverage?: number;
  /** Number of open bugs */
  bugCount?: number;
  /** Risk level based on bugs and test coverage */
  riskLevel?: 'low' | 'medium' | 'high';
  /** Last time quality metrics were updated */
  lastUpdated?: string;
  /** Allure TestOps test results */
  testResults?: {
    passed: number;
    failed: number;
    skipped: number;
    total: number;
  };
}

export interface FlowNodeData {
  /** Display name for the node */
  label: string;
  /** URL of the screen this node represents */
  url: string;
  /** User role for this screen (buyer/distributor/admin) */
  role: 'buyer' | 'distributor' | 'admin';
  /** Description of what this screen does */
  description: string;
  /** Available actions/buttons on this screen */
  actions: string[];
  /** Prerequisites that must be met before this screen is usable */
  prerequisites?: string[];
  /** Screenshot filename for this screen */
  screenshot: string;
  
  // Product hierarchy mapping
  /** Product this screen belongs to (e.g., "ordering-system", "authentication") */
  product?: string;
  /** Section within the product (e.g., "login", "checkout", "user-management") */
  section?: string;
  /** Specific feature (e.g., "phone-login", "email-verification", "payment-processing") */
  feature?: string;
  
  // Quality and risk metrics
  /** Quality metrics for this screen */
  qualityMetrics?: QualityMetrics;
}

export interface FlowNode {
  /** Unique identifier for the node */
  id: string;
  /** Type of node (default, input, output, etc.) */
  type: string;
  /** Position of the node in the graph */
  position: { x: number; y: number };
  /** Data associated with the node */
  data: FlowNodeData;
}

export interface FlowEdge {
  /** Unique identifier for the edge */
  id: string;
  /** Source node ID */
  source: string;
  /** Target node ID */
  target: string;
  /** Type of edge (smoothstep, straight, etc.) */
  type: string;
  /** Whether the edge should be animated */
  animated: boolean;
  /** Label to display on the edge */
  label: string;
  /** Custom styling for the edge */
  style?: {
    strokeDasharray?: string;
    stroke?: string;
  };
}

export interface FlowData {
  /** Array of nodes in the flow */
  nodes: FlowNode[];
  /** Array of edges connecting the nodes */
  edges: FlowEdge[];
}
import React, { memo, useCallback } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { FlowNodeData } from '../types/flow';

interface CircularFlowNodeProps extends NodeProps {
  data: FlowNodeData;
  isConnectable: boolean;
  selected?: boolean;
}

/**
 * Simplified circular node component for flow overview
 * Shows only screen name in a colored circle
 * Memoized for performance and stability
 */
const CircularFlowNode: React.FC<CircularFlowNodeProps> = memo(({ 
  data, 
  isConnectable, 
  selected = false,
  id
}) => {
  // Role-based styling
  const getRoleColor = useCallback((role: string) => {
    switch (role) {
      case 'buyer':
        return selected 
          ? 'bg-blue-600 border-blue-700 shadow-lg shadow-blue-200' 
          : 'bg-blue-500 border-blue-600 hover:bg-blue-600';
      case 'distributor':
        return selected 
          ? 'bg-green-600 border-green-700 shadow-lg shadow-green-200' 
          : 'bg-green-500 border-green-600 hover:bg-green-600';
      case 'admin':
        return selected 
          ? 'bg-purple-600 border-purple-700 shadow-lg shadow-purple-200' 
          : 'bg-purple-500 border-purple-600 hover:bg-purple-600';
      default:
        return selected 
          ? 'bg-gray-600 border-gray-700 shadow-lg shadow-gray-200' 
          : 'bg-gray-500 border-gray-600 hover:bg-gray-600';
    }
  }, [selected]);

  const handleNodeClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    // The parent ReactFlow component will handle the click event
  }, []);

  return (
    <div className="relative nodrag" onClick={handleNodeClick}>
      {/* Input handle */}
      <Handle
        type="target"
        position={Position.Left}
        isConnectable={isConnectable}
        className="w-2 h-2 bg-white border-2 border-gray-400 opacity-0 hover:opacity-100 transition-opacity"
      />
      
      {/* Circular node */}
      <div 
        className={`
          w-24 h-24 rounded-full flex items-center justify-center
          border-2 text-white font-medium text-sm text-center
          cursor-pointer transition-all duration-200
          ${getRoleColor(data.role)}
          ${selected ? 'scale-110' : 'hover:scale-105'}
        `}
        data-node-id={id}
      >
        <span className="leading-tight px-2 pointer-events-none">
          {data.label}
        </span>
      </div>

      {/* Output handle */}
      <Handle
        type="source"
        position={Position.Right}
        isConnectable={isConnectable}
        className="w-2 h-2 bg-white border-2 border-gray-400 opacity-0 hover:opacity-100 transition-opacity"
      />
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison for memo
  return (
    prevProps.data === nextProps.data &&
    prevProps.selected === nextProps.selected &&
    prevProps.isConnectable === nextProps.isConnectable &&
    prevProps.id === nextProps.id
  );
});

CircularFlowNode.displayName = 'CircularFlowNode';

export default CircularFlowNode;
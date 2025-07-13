import React from 'react';
import { Handle, Position } from 'reactflow';
import { FlowNodeData } from '../types/flow';

interface SimpleFlowNodeProps {
  data: FlowNodeData;
  isConnectable: boolean;
}

/**
 * Simple circular node component for flow overview
 * Basic implementation without complex optimization
 */
const SimpleFlowNode: React.FC<SimpleFlowNodeProps> = ({ 
  data, 
  isConnectable
}) => {
  // Role-based styling
  const getRoleColor = (role: string) => {
    switch (role) {
      case 'buyer':
        return 'bg-blue-500 border-blue-600 hover:bg-blue-600';
      case 'distributor':
        return 'bg-green-500 border-green-600 hover:bg-green-600';
      case 'admin':
        return 'bg-purple-500 border-purple-600 hover:bg-purple-600';
      default:
        return 'bg-gray-500 border-gray-600 hover:bg-gray-600';
    }
  };

  return (
    <div className="relative">
      {/* Input handle */}
      <Handle
        type="target"
        position={Position.Left}
        isConnectable={isConnectable}
        className="w-2 h-2 bg-white border-2 border-gray-400"
      />
      
      {/* Circular node */}
      <div 
        className={`
          w-24 h-24 rounded-full flex items-center justify-center
          border-2 text-white font-medium text-sm text-center
          cursor-pointer transition-all duration-200 hover:scale-105
          ${getRoleColor(data.role)}
        `}
      >
        <span className="leading-tight px-2">
          {data.label}
        </span>
      </div>

      {/* Output handle */}
      <Handle
        type="source"
        position={Position.Right}
        isConnectable={isConnectable}
        className="w-2 h-2 bg-white border-2 border-gray-400"
      />
    </div>
  );
};

export default SimpleFlowNode;
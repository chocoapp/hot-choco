import React from 'react';
import { Handle, Position } from 'reactflow';
import { FlowNodeData } from '../types/flow';

interface FlowNodeProps {
  data: FlowNodeData;
  isConnectable: boolean;
}

/**
 * Custom React Flow node component for user flow visualization
 * Displays screen information with role-based styling
 */
const FlowNode: React.FC<FlowNodeProps> = ({ data, isConnectable }) => {
  // Role-based styling
  const getRoleColor = (role: string) => {
    switch (role) {
      case 'buyer':
        return 'bg-blue-50 border-blue-200 text-blue-900';
      case 'distributor':
        return 'bg-green-50 border-green-200 text-green-900';
      case 'admin':
        return 'bg-purple-50 border-purple-200 text-purple-900';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-900';
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'buyer':
        return 'bg-blue-100 text-blue-800';
      case 'distributor':
        return 'bg-green-100 text-green-800';
      case 'admin':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const hasPrerequisites = data.prerequisites && data.prerequisites.length > 0;

  return (
    <div className={`
      relative w-72 p-4 rounded-lg border-2 shadow-lg
      ${getRoleColor(data.role)}
      transition-all duration-200 hover:shadow-xl
    `}>
      {/* Input handle */}
      <Handle
        type="target"
        position={Position.Left}
        isConnectable={isConnectable}
        className="w-3 h-3 bg-gray-400 border-2 border-white"
      />
      
      {/* Role badge */}
      <div className={`
        absolute -top-2 -right-2 px-2 py-1 text-xs font-medium rounded-full
        ${getRoleBadgeColor(data.role)}
      `}>
        {data.role}
      </div>

      {/* Node header */}
      <div className="mb-3">
        <h3 className="text-lg font-semibold mb-1">{data.label}</h3>
        <p className="text-sm opacity-75">{data.description}</p>
      </div>

      {/* Prerequisites section */}
      {hasPrerequisites && (
        <div className="mb-3">
          <h4 className="text-xs font-medium mb-1 text-orange-600">Prerequisites:</h4>
          <ul className="text-xs space-y-1">
            {data.prerequisites!.map((prereq, index) => (
              <li key={index} className="flex items-start">
                <span className="text-orange-500 mr-1">•</span>
                {prereq}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Actions section */}
      <div className="mb-3">
        <h4 className="text-xs font-medium mb-1">Actions:</h4>
        <ul className="text-xs space-y-1">
          {data.actions.map((action, index) => (
            <li key={index} className="flex items-start">
              <span className="text-blue-500 mr-1">•</span>
              {action}
            </li>
          ))}
        </ul>
      </div>

      {/* Screenshot info */}
      <div className="text-xs opacity-60">
        📸 {data.screenshot}
      </div>

      {/* Output handle */}
      <Handle
        type="source"
        position={Position.Right}
        isConnectable={isConnectable}
        className="w-3 h-3 bg-gray-400 border-2 border-white"
      />
    </div>
  );
};

export default FlowNode;
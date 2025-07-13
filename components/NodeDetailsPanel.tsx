import React from 'react';
import { FlowNodeData } from '../types/flow';

interface NodeDetailsPanelProps {
  nodeData: FlowNodeData | null;
  onClose: () => void;
}

/**
 * Side panel component showing detailed information about a selected node
 * Includes screenshot, description, actions, and prerequisites
 */
const NodeDetailsPanel: React.FC<NodeDetailsPanelProps> = ({ nodeData, onClose }) => {
  if (!nodeData) return null;

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

  const hasPrerequisites = nodeData.prerequisites && nodeData.prerequisites.length > 0;

  return (
    <div className="fixed right-0 top-0 h-full w-96 bg-white shadow-xl border-l border-gray-200 z-50 overflow-y-auto">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Screen Details</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-6">
        {/* Screen title and role */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-xl font-semibold text-gray-900">{nodeData.label}</h3>
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRoleBadgeColor(nodeData.role)}`}>
              {nodeData.role}
            </span>
          </div>
          <p className="text-gray-600">{nodeData.description}</p>
        </div>

        {/* Screenshot */}
        <div className="bg-gray-100 rounded-lg border border-gray-200 overflow-hidden">
          <img 
            src={`/userScreens/${nodeData.screenshot}.png`}
            alt={`Screenshot of ${nodeData.label}`}
            className="w-full h-auto object-cover"
            onError={(e) => {
              // Fallback to placeholder if image fails to load
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              target.nextElementSibling?.classList.remove('hidden');
            }}
          />
          <div className="hidden p-4 text-center">
            <svg className="w-12 h-12 mx-auto text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-sm text-gray-500 font-medium">Screenshot not available</p>
            <p className="text-xs text-gray-400 mt-1">{nodeData.screenshot}</p>
          </div>
        </div>

        {/* URL */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-2">URL</h4>
          <div className="bg-gray-50 rounded-md p-3 border">
            <code className="text-xs text-gray-600 break-all">
              {nodeData.url}
            </code>
          </div>
        </div>

        {/* Prerequisites */}
        {hasPrerequisites && (
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center">
              <svg className="w-4 h-4 mr-1 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              Prerequisites
            </h4>
            <ul className="space-y-1">
              {nodeData.prerequisites!.map((prereq, index) => (
                <li key={index} className="flex items-start text-sm text-gray-600">
                  <span className="text-orange-500 mr-2 mt-1">•</span>
                  {prereq}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Actions */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center">
            <svg className="w-4 h-4 mr-1 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Available Actions
          </h4>
          <ul className="space-y-1">
            {nodeData.actions.map((action, index) => (
              <li key={index} className="flex items-start text-sm text-gray-600">
                <span className="text-blue-500 mr-2 mt-1">•</span>
                {action}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default NodeDetailsPanel;
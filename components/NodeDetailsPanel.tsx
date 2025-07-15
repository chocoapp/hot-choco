import React from 'react';
import { FlowNodeData } from '../types/flow';
import { getRiskLevelColor } from '../services/qualityService';

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

        {/* Product Hierarchy */}
        {(nodeData.product || nodeData.section || nodeData.feature) && (
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center">
              <svg className="w-4 h-4 mr-1 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              Product Hierarchy
            </h4>
            <div className="bg-gray-50 rounded-md p-3 space-y-2">
              {nodeData.product && (
                <div className="flex items-center text-sm">
                  <span className="font-medium text-gray-700 w-16">Product:</span>
                  <span className="text-gray-600">{nodeData.product}</span>
                </div>
              )}
              {nodeData.section && (
                <div className="flex items-center text-sm">
                  <span className="font-medium text-gray-700 w-16">Section:</span>
                  <span className="text-gray-600">{nodeData.section}</span>
                </div>
              )}
              {nodeData.feature && (
                <div className="flex items-center text-sm">
                  <span className="font-medium text-gray-700 w-16">Feature:</span>
                  <span className="text-gray-600">{nodeData.feature}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Quality Metrics */}
        {nodeData.qualityMetrics && (
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center">
              <svg className="w-4 h-4 mr-1 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Quality Metrics
            </h4>
            <div className="space-y-3">
              {/* Risk Level */}
              {nodeData.qualityMetrics.riskLevel && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Risk Level:</span>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRiskLevelColor(nodeData.qualityMetrics.riskLevel).background} ${getRiskLevelColor(nodeData.qualityMetrics.riskLevel).text}`}>
                    {nodeData.qualityMetrics.riskLevel.toUpperCase()}
                  </span>
                </div>
              )}
              
              {/* Test Coverage */}
              {nodeData.qualityMetrics.testCoverage !== undefined && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-600">Test Coverage:</span>
                    <span className="text-sm font-medium">{nodeData.qualityMetrics.testCoverage}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${nodeData.qualityMetrics.testCoverage}%` }}
                    />
                  </div>
                </div>
              )}
              
              {/* Bug Count */}
              {nodeData.qualityMetrics.bugCount !== undefined && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Open Bugs:</span>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    nodeData.qualityMetrics.bugCount === 0 
                      ? 'bg-green-100 text-green-800' 
                      : nodeData.qualityMetrics.bugCount <= 2 
                        ? 'bg-yellow-100 text-yellow-800' 
                        : 'bg-red-100 text-red-800'
                  }`}>
                    {nodeData.qualityMetrics.bugCount}
                  </span>
                </div>
              )}
              
              {/* Test Results */}
              {nodeData.qualityMetrics.testResults && (
                <div>
                  <span className="text-sm text-gray-600 mb-2 block">Test Results:</span>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
                      <span>Passed: {nodeData.qualityMetrics.testResults.passed}</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-red-500 rounded-full mr-1"></div>
                      <span>Failed: {nodeData.qualityMetrics.testResults.failed}</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full mr-1"></div>
                      <span>Skipped: {nodeData.qualityMetrics.testResults.skipped}</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-gray-500 rounded-full mr-1"></div>
                      <span>Total: {nodeData.qualityMetrics.testResults.total}</span>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Last Updated */}
              {nodeData.qualityMetrics.lastUpdated && (
                <div className="text-xs text-gray-500">
                  Last updated: {new Date(nodeData.qualityMetrics.lastUpdated).toLocaleString()}
                </div>
              )}
            </div>
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
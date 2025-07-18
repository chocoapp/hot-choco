import React, { useState } from 'react';
import { FlowNodeData } from '../types/flow';
import { getRiskLevelColor } from '../services/qualityService';
import UnifiedDetailsModal from './UnifiedDetailsModal';
import { supabaseService } from '../lib/supabase';
import { BugReport } from '../services/supabaseService';

interface NodeDetailsPanelProps {
  nodeData: FlowNodeData | null;
  onClose: () => void;
}

/**
 * Side panel component showing detailed information about a selected node
 * Includes screenshot, description, actions, and prerequisites
 */
const NodeDetailsPanel: React.FC<NodeDetailsPanelProps> = ({ nodeData, onClose }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showBugDetails, setShowBugDetails] = useState(false);
  const [openBugs, setOpenBugs] = useState<BugReport[]>([]);
  const [closedBugs, setClosedBugs] = useState<BugReport[]>([]);
  const [loadingBugs, setLoadingBugs] = useState(false);
  
  if (!nodeData) return null;

  const loadBugDetails = async () => {
    if (!nodeData.feature) return;
    
    console.log('Loading bug details for:', {
      product: nodeData.product,
      section: nodeData.section,
      feature: nodeData.feature
    });
    
    setLoadingBugs(true);
    try {
      const [openBugsData, closedBugsData] = await Promise.all([
        supabaseService.getBugReportsByStatus(nodeData.product!, 'open', nodeData.section, nodeData.feature),
        supabaseService.getBugReportsByStatus(nodeData.product!, 'closed', nodeData.section, nodeData.feature)
      ]);
      
      console.log('Bug results:', {
        openBugs: openBugsData.length,
        closedBugs: closedBugsData.length,
        openBugsData,
        closedBugsData
      });
      
      setOpenBugs(openBugsData);
      setClosedBugs(closedBugsData);
    } catch (error) {
      console.error('Error loading bug details:', error);
    } finally {
      setLoadingBugs(false);
    }
  };


  const handleBugCountClick = () => {
    if (!showBugDetails) {
      loadBugDetails();
    }
    setShowBugDetails(!showBugDetails);
  };


  const getBugUrl = (source: string) => {
    if (source && source.includes('-')) {
      return `https://choco.atlassian.net/browse/${source}`;
    }
    return null;
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
              
              
              {/* Bug Count */}
              {nodeData.qualityMetrics.bugCount !== undefined && (
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Open Bugs:</span>
                    <button
                      onClick={handleBugCountClick}
                      className={`px-2 py-1 text-xs font-medium rounded-full hover:opacity-80 transition-opacity ${
                        nodeData.qualityMetrics.bugCount === 0 
                          ? 'bg-green-100 text-green-800' 
                          : nodeData.qualityMetrics.bugCount <= 2 
                            ? 'bg-yellow-100 text-yellow-800' 
                            : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {nodeData.qualityMetrics.bugCount} {showBugDetails ? '▼' : '▶'}
                    </button>
                  </div>
                  
                  {/* Bug Details */}
                  {showBugDetails && (
                    <div className="mt-3 space-y-2">
                      {loadingBugs ? (
                        <div className="flex items-center justify-center py-4">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {/* Open Bugs */}
                          {openBugs.length > 0 && (
                            <div>
                              <h5 className="text-xs font-medium text-gray-700 mb-1">Open Bugs ({openBugs.length})</h5>
                              <div className="space-y-1">
                                {openBugs.map(bug => (
                                  <div key={bug.id} className="flex items-start justify-between text-xs bg-red-50 p-2 rounded">
                                    <div className="flex-1">
                                      {getBugUrl(bug.source || '') ? (
                                        <a 
                                          href={getBugUrl(bug.source || '')!} 
                                          target="_blank" 
                                          rel="noopener noreferrer"
                                          className="text-blue-600 hover:text-blue-800 font-medium"
                                        >
                                          {bug.source}
                                        </a>
                                      ) : (
                                        <span className="font-medium">{bug.source || 'Unknown'}</span>
                                      )}
                                      <div className="text-gray-600 mt-1">{bug.issueType}</div>
                                    </div>
                                    <span className="ml-2 px-1 py-0.5 bg-red-100 text-red-800 rounded text-xs">
                                      {bug.status}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {/* Closed Bugs */}
                          {closedBugs.length > 0 && (
                            <div>
                              <h5 className="text-xs font-medium text-gray-700 mb-1">Closed Bugs ({closedBugs.length})</h5>
                              <div className="space-y-1">
                                {closedBugs.map(bug => (
                                  <div key={bug.id} className="flex items-start justify-between text-xs bg-green-50 p-2 rounded">
                                    <div className="flex-1">
                                      {getBugUrl(bug.source || '') ? (
                                        <a 
                                          href={getBugUrl(bug.source || '')!} 
                                          target="_blank" 
                                          rel="noopener noreferrer"
                                          className="text-blue-600 hover:text-blue-800 font-medium"
                                        >
                                          {bug.source}
                                        </a>
                                      ) : (
                                        <span className="font-medium">{bug.source || 'Unknown'}</span>
                                      )}
                                      <div className="text-gray-600 mt-1">{bug.issueType}</div>
                                    </div>
                                    <span className="ml-2 px-1 py-0.5 bg-green-100 text-green-800 rounded text-xs">
                                      {bug.status}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {openBugs.length === 0 && closedBugs.length === 0 && (
                            <div className="text-xs text-gray-500 text-center py-2">
                              No bugs found for this feature
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
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

        {/* View Details Button */}
        <div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            View Detailed Analysis
          </button>
        </div>

      </div>

      {/* Detailed View Modal */}
      <UnifiedDetailsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        nodeData={nodeData}
      />
    </div>
  );
};

export default NodeDetailsPanel;
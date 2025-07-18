import React, { useState, useEffect } from 'react';
import { FlowNodeData } from '../types/flow';
import { getRiskLevelColor } from '../services/qualityService';
import { supabaseService } from '../lib/supabase';
import { allureService } from '../lib/services';
import { BugReport } from '../services/supabaseService';

interface RiskOverviewProps {
  nodes: FlowNodeData[];
}

interface FeatureRiskData {
  featureId: string;
  featureName: string;
  product: string;
  section: string;
  screens: FlowNodeData[];
  riskScore: number;
  openBugs: BugReport[];
  closedBugs: BugReport[];
  testCount: number;
}

interface FeatureDetailModalProps {
  feature: FeatureRiskData | null;
  onClose: () => void;
}

/**
 * Feature Detail Modal component
 */
const FeatureDetailModal: React.FC<FeatureDetailModalProps> = ({ feature, onClose }) => {
  if (!feature) return null;

  const riskLevel = getRiskLevel(feature.riskScore);
  const riskColors = getRiskLevelColor(riskLevel);

  const getBugUrl = (source: string) => {
    if (source && source.includes('-')) {
      return `https://choco.atlassian.net/browse/${source}`;
    }
    return null;
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto m-4">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{feature.featureName}</h2>
              <p className="text-sm text-gray-600">{feature.product} → {feature.section}</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-3xl font-bold text-gray-900">{Math.round(feature.riskScore)}</div>
                <div className="text-sm text-gray-500">Risk Score</div>
              </div>
              <span className={`px-3 py-1 text-sm font-medium rounded-full ${riskColors.background} ${riskColors.text}`}>
                {riskLevel.toUpperCase()}
              </span>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Open Bugs */}
            <div className="border rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-3 text-red-600">Open Bugs ({feature.openBugs.length})</h3>
              {feature.openBugs.length > 0 ? (
                <div className="space-y-2">
                  {feature.openBugs.map(bug => (
                    <div key={bug.id} className="flex items-start justify-between p-2 bg-red-50 rounded">
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
                        <p className="text-sm text-gray-600 mt-1">{bug.description}</p>
                      </div>
                      <span className={`ml-2 px-2 py-1 rounded text-xs ${getSeverityColor(bug.severity)}`}>
                        {bug.severity}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No open bugs</p>
              )}
            </div>

            {/* Test Cases */}
            <div className="border rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-3 text-blue-600">Test Cases ({feature.testCount})</h3>
              <div className="text-sm text-gray-600">
                {feature.testCount === 0 ? 'No tests found' : 
                 feature.testCount <= 5 ? 'Low test coverage' : 
                 feature.testCount <= 10 ? 'Medium test coverage' : 'Good test coverage'}
              </div>
            </div>
          </div>

          {/* Screens */}
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-3">Screens in this feature ({feature.screens.length})</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {feature.screens.map(screen => (
                <div key={screen.label} className="p-3 bg-gray-50 rounded">
                  <div className="font-medium">{screen.label}</div>
                  <div className="text-sm text-gray-600">{screen.description}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Closed Bugs */}
          {feature.closedBugs.length > 0 && (
            <div className="mt-6 border rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-3 text-green-600">Recently Closed Bugs ({feature.closedBugs.length})</h3>
              <div className="space-y-2">
                {feature.closedBugs.slice(0, 5).map(bug => (
                  <div key={bug.id} className="flex items-start justify-between p-2 bg-green-50 rounded">
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
                      <p className="text-sm text-gray-600 mt-1">{bug.description}</p>
                    </div>
                    <span className={`ml-2 px-2 py-1 rounded text-xs ${getSeverityColor(bug.severity)}`}>
                      {bug.severity}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const getRiskLevel = (riskScore: number): 'low' | 'medium' | 'high' => {
  if (riskScore <= 20) return 'low';
  if (riskScore <= 40) return 'medium';
  return 'high';
};

/**
 * Risk Overview component showing all features with summary numbers
 * Based on real bug data and test count from Allure TestOps
 */
const RiskOverview: React.FC<RiskOverviewProps> = ({ nodes }) => {
  const [featureRiskData, setFeatureRiskData] = useState<FeatureRiskData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFeature, setSelectedFeature] = useState<FeatureRiskData | null>(null);

  useEffect(() => {
    calculateFeatureRiskData();
  }, [nodes]); // eslint-disable-line react-hooks/exhaustive-deps

  const calculateFeatureRiskData = async () => {
    try {
      setLoading(true);
      
      // Group nodes by feature
      const featureMap = new Map<string, FlowNodeData[]>();
      nodes.forEach(node => {
        if (!node.feature || !node.product) return;
        const key = `${node.product}:${node.section}:${node.feature}`;
        if (!featureMap.has(key)) {
          featureMap.set(key, []);
        }
        featureMap.get(key)!.push(node);
      });

      const featureRiskData: FeatureRiskData[] = [];

      // Calculate risk for each unique feature
      for (const [key, screens] of featureMap.entries()) {
        const firstScreen = screens[0];
        
        // Get bug data
        const [openBugs, closedBugs] = await Promise.all([
          supabaseService.getBugReportsByStatus(firstScreen.product!, 'open', firstScreen.section, firstScreen.feature),
          supabaseService.getBugReportsByStatus(firstScreen.product!, 'closed', firstScreen.section, firstScreen.feature)
        ]);

        // Get test count
        const testStats = await allureService.getTestStats(firstScreen.product!, firstScreen.section, firstScreen.feature);
        const testCount = testStats?.total || 0;

        // Calculate risk score
        const riskScore = calculateRiskScore(openBugs, testCount);

        featureRiskData.push({
          featureId: key,
          featureName: firstScreen.feature || 'Unknown Feature',
          product: firstScreen.product || 'Unknown Product',
          section: firstScreen.section || 'Unknown Section',
          screens,
          riskScore,
          openBugs,
          closedBugs,
          testCount
        });
      }

      // Sort by risk score (highest first)
      const sortedFeatures = featureRiskData.sort((a, b) => b.riskScore - a.riskScore);
      setFeatureRiskData(sortedFeatures);
    } catch (err) {
      console.error('Error calculating feature risk data:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const calculateRiskScore = (openBugs: BugReport[], testCount: number): number => {
    // Bug Risk Score (70% weight)
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

    // Test Coverage Risk (30% weight)
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

    // Combined risk score
    return (bugRiskScore * 0.7) + (testCoverageRisk * 0.3);
  };


  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="text-center text-red-600">
          <p>Error loading risk data: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Risk Overview</h2>
        <div className="text-sm text-gray-500">
          All Features ({featureRiskData.length})
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 font-medium text-gray-900">Feature</th>
              <th className="text-center py-3 px-4 font-medium text-gray-900">Risk Score</th>
              <th className="text-center py-3 px-4 font-medium text-gray-900">Open Bugs</th>
              <th className="text-center py-3 px-4 font-medium text-gray-900">Closed Bugs</th>
              <th className="text-center py-3 px-4 font-medium text-gray-900">Test Cases</th>
              <th className="text-center py-3 px-4 font-medium text-gray-900">Screens</th>
              <th className="text-center py-3 px-4 font-medium text-gray-900">Actions</th>
            </tr>
          </thead>
          <tbody>
            {featureRiskData.map((item) => {
              const riskLevel = getRiskLevel(item.riskScore);
              const riskColors = getRiskLevelColor(riskLevel);
              
              return (
                <tr key={item.featureId} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${riskColors.background} ${riskColors.text}`}>
                        {riskLevel.toUpperCase()}
                      </span>
                      <div>
                        <div className="font-medium text-gray-900">{item.featureName}</div>
                        <div className="text-xs text-gray-500">{item.product} → {item.section}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <div className="text-lg font-bold text-gray-900">{Math.round(item.riskScore)}</div>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className={`text-lg font-semibold ${
                      item.openBugs.length === 0 ? 'text-green-600' : 
                      item.openBugs.length <= 2 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {item.openBugs.length}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="text-lg font-semibold text-gray-600">{item.closedBugs.length}</span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className={`text-lg font-semibold ${
                      item.testCount === 0 ? 'text-red-600' : 
                      item.testCount <= 5 ? 'text-yellow-600' : 'text-green-600'
                    }`}>
                      {item.testCount}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="text-lg font-semibold text-gray-600">{item.screens.length}</span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => setSelectedFeature(item)}
                      className="px-3 py-1 text-xs font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        
        {featureRiskData.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <p>No risk data available</p>
          </div>
        )}
      </div>
      
      {/* Feature Detail Modal */}
      <FeatureDetailModal 
        feature={selectedFeature} 
        onClose={() => setSelectedFeature(null)} 
      />
    </div>
  );
};

export default RiskOverview;
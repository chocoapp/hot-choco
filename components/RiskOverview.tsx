import React, { useState, useEffect } from 'react';
import { FlowNodeData } from '../types/flow';
import { getRiskLevelColor } from '../services/qualityService';
import { supabaseService } from '../lib/supabase';
import { allureService } from '../lib/services';
import { BugReport } from '../services/supabaseService';
import UnifiedDetailsModal from './UnifiedDetailsModal';

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

        // Calculate risk score with feature complexity (screen count)
        const screenCount = screens.length;
        const riskScore = calculateRiskScore(openBugs, testCount, screenCount);

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
      <UnifiedDetailsModal 
        isOpen={Boolean(selectedFeature)}
        onClose={() => setSelectedFeature(null)}
        featureData={selectedFeature ? {
          featureName: selectedFeature.featureName,
          product: selectedFeature.product,
          section: selectedFeature.section,
          feature: selectedFeature.featureName,
          screens: selectedFeature.screens,
          riskScore: selectedFeature.riskScore,
          openBugs: selectedFeature.openBugs,
          closedBugs: selectedFeature.closedBugs,
          testCount: selectedFeature.testCount
        } : null}
      />
    </div>
  );
};

export default RiskOverview;
import { useState, useEffect, useCallback, useMemo } from 'react';
import { FlowNodeData } from '../types/flow';
import { supabaseService } from '../lib/supabase';
import { allureService } from '../lib/services';
import { ProductDocumentation, BugReport } from '../services/supabaseService';
import { TestCoverage, TestStats, TestCase } from '../services/allureService';
import { getRiskLevelColor } from '../services/qualityService';

interface UnifiedDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  nodeData?: FlowNodeData | null;
  featureData?: {
    featureName: string;
    product: string;
    section: string;
    feature: string;
    screens: FlowNodeData[];
    riskScore: number;
    openBugs: BugReport[];
    closedBugs: BugReport[];
    testCount: number;
  } | null;
}

export default function UnifiedDetailsModal({ 
  isOpen, 
  onClose, 
  nodeData, 
  featureData 
}: UnifiedDetailsModalProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'bugs' | 'tests' | 'docs'>('overview');
  const [loading, setLoading] = useState(false);
  const [bugs, setBugs] = useState<BugReport[]>([]);
  const [docs, setDocs] = useState<ProductDocumentation[]>([]);
  const [testCoverage, setTestCoverage] = useState<TestCoverage | null>(null);
  const [testStats, setTestStats] = useState<TestStats | null>(null);
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [hasErrors, setHasErrors] = useState(false);

  // Determine if we're showing screen-level or feature-level data
  const isScreenMode = Boolean(nodeData);
  const isFeatureMode = Boolean(featureData);

  // Get common data for both modes
  const getCommonData = () => {
    if (isScreenMode && nodeData) {
      return {
        title: nodeData.label,
        subtitle: `${nodeData.product} → ${nodeData.section} → ${nodeData.feature}`,
        product: nodeData.product || '',
        section: nodeData.section || '',
        feature: nodeData.feature || '',
        description: nodeData.description || '',
        url: nodeData.url || '',
        role: nodeData.role || '',
        actions: nodeData.actions || [],
        prerequisites: nodeData.prerequisites || [],
        screenshot: nodeData.screenshot || '',
        qualityMetrics: nodeData.qualityMetrics
      };
    } else if (isFeatureMode && featureData) {
      return {
        title: featureData.featureName,
        subtitle: `${featureData.product} → ${featureData.section}`,
        product: featureData.product,
        section: featureData.section,
        feature: featureData.feature,
        description: `Feature with ${featureData.screens.length} screens`,
        url: '',
        role: '',
        actions: [],
        prerequisites: [],
        screenshot: '',
        qualityMetrics: {
          bugCount: featureData.openBugs.length,
          testCount: featureData.testCount,
          riskLevel: getRiskLevel(featureData.riskScore),
          lastUpdated: new Date().toISOString()
        }
      };
    }
    return null;
  };

  const getRiskLevel = (riskScore: number): 'low' | 'medium' | 'high' => {
    if (riskScore <= 20) return 'low';
    if (riskScore <= 40) return 'medium';
    return 'high';
  };

  // Helper functions for risk calculation breakdown
  const calculateBugRisk = (openBugs: BugReport[]): number => {
    const bugVolumeScore = Math.min(openBugs.length * 3, 30);
    const severityScore = openBugs.reduce((score, bug) => {
      switch (bug.severity) {
        case 'critical': return score + 20;
        case 'high': return score + 12;
        case 'medium': return score + 6;
        case 'low': return score + 2;
        default: return score + 6;
      }
    }, 0);
    return bugVolumeScore + severityScore;
  };

  const calculateTestCoverageRisk = (testCount: number): number => {
    if (testCount === 0) return 30;
    if (testCount <= 5) return 20;
    if (testCount <= 10) return 10;
    return 0;
  };

  const calculateComplexityRisk = (screenCount: number): number => {
    if (screenCount === 1) return 0;
    if (screenCount <= 2) return 5;
    if (screenCount <= 4) return 10;
    return 15;
  };

  const commonData = useMemo(() => getCommonData(), [isScreenMode, isFeatureMode, nodeData, featureData]);

  const loadDetailedData = useCallback(async () => {
    if (!commonData) return;
    
    setLoading(true);
    setHasErrors(false);
    
    try {
      console.log('Loading detailed data for:', {
        product: commonData.product,
        section: commonData.section,
        feature: commonData.feature,
        mode: isFeatureMode ? 'feature' : 'screen'
      });

      // Handle bug data loading
      if (isFeatureMode && featureData) {
        // For feature mode, use the existing bug data
        setBugs([...featureData.openBugs, ...featureData.closedBugs]);
      } else {
        // For screen mode, load bug data
        try {
          const bugsData = await supabaseService.getBugReports(
            commonData.product, 
            commonData.section, 
            commonData.feature
          );
          setBugs(bugsData);
        } catch (error) {
          console.error('Error loading bug data:', error);
          setBugs([]);
        }
      }

      // Load documentation
      try {
        const docsData = await supabaseService.getProductDocs(
          commonData.product, 
          commonData.section, 
          commonData.feature
        );
        setDocs(docsData);
      } catch (error) {
        console.error('Error loading documentation:', error);
        setDocs([]);
      }

      // Load test data with individual error handling
      // Only load test data if we don't already have it or if we're in screen mode
      if (!isFeatureMode || !featureData || featureData.testCount === 0) {
        try {
          const coverageData = await allureService.getTestCoverage(
            commonData.product, 
            commonData.section, 
            commonData.feature
          );
          setTestCoverage(coverageData);
        } catch (error) {
          console.error('Error loading test coverage:', error);
          setTestCoverage(null);
        }

        try {
          const statsData = await allureService.getTestStats(
            commonData.product, 
            commonData.section, 
            commonData.feature
          );
          setTestStats(statsData);
        } catch (error) {
          console.error('Error loading test stats:', error);
          setTestStats(null);
        }

        try {
          const testCasesData = await allureService.getTestCases(
            commonData.product, 
            commonData.section, 
            commonData.feature
          );
          setTestCases(testCasesData);
        } catch (error) {
          console.error('Error loading test cases:', error);
          setTestCases([]);
        }
      } else {
        // For feature mode with existing test data, create a mock stats object
        setTestStats({
          total: featureData.testCount,
          passed: 0,
          failed: 0,
          skipped: 0
        });
        setTestCoverage(null);
        setTestCases([]);
      }

      console.log('Loaded detailed data successfully');
    } catch (error) {
      console.error('Error in loadDetailedData:', error);
      setHasErrors(true);
    } finally {
      setLoading(false);
    }
  }, [commonData, isFeatureMode, featureData]);

  useEffect(() => {
    if (isOpen && commonData) {
      // Reset state when opening
      setBugs([]);
      setDocs([]);
      setTestCoverage(null);
      setTestStats(null);
      setTestCases([]);
      setHasErrors(false);
      
      loadDetailedData();
    }
  }, [isOpen, commonData, loadDetailedData]);

  if (!isOpen || !commonData) return null;

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-red-100 text-red-800';
      case 'in-progress': return 'bg-yellow-100 text-yellow-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTestStatusColor = (status: string) => {
    switch (status) {
      case 'passed': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'skipped': return 'bg-yellow-100 text-yellow-800';
      case 'broken': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getBugUrl = (source: string) => {
    if (source && source.includes('-')) {
      return `https://choco.atlassian.net/browse/${source}`;
    }
    return null;
  };

  const openBugs = bugs.filter(bug => bug.status === 'open');
  const closedBugs = bugs.filter(bug => bug.status === 'closed');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-6xl h-5/6 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{commonData.title}</h2>
            <p className="text-gray-700 mt-1 font-medium">
              {commonData.subtitle}
            </p>
            {isScreenMode && (
              <p className="text-gray-600 mt-1 text-sm">
                {commonData.description}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b bg-gray-50">
          {[
            { id: 'overview', label: 'Overview', count: '' },
            { id: 'bugs', label: 'Bugs', count: `(${bugs.length})` },
            { id: 'tests', label: 'Tests', count: testStats ? `(${testStats.total})` : '' },
            { id: 'docs', label: 'Documentation', count: `(${docs.length})` }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as 'overview' | 'bugs' | 'tests' | 'docs')}
              className={`px-6 py-3 font-medium text-sm border-b-2 ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600 bg-white'
                  : 'border-transparent text-gray-600 hover:text-gray-800 hover:bg-gray-100'
              }`}
            >
              {tab.label} {tab.count}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <>
              {hasErrors && (
                <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center">
                    <div className="text-yellow-600 text-sm">⚠️</div>
                    <p className="text-yellow-800 text-sm ml-2">Some data failed to load, but available information is shown below.</p>
                  </div>
                </div>
              )}
            </>
          )}
          
          {!loading && (
            <>
              {/* Overview Tab */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Quality Metrics */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="font-semibold text-gray-900 mb-2">Quality Metrics</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-700">Test Cases:</span>
                          <span className="font-medium text-gray-900">{commonData.qualityMetrics?.testCount || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-700">Open Bugs:</span>
                          <span className="font-medium text-gray-900">{openBugs.length}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-700">Closed Bugs:</span>
                          <span className="font-medium text-gray-900">{closedBugs.length}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-700">Risk Level:</span>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            getRiskLevelColor(commonData.qualityMetrics?.riskLevel || 'low').background
                          } ${getRiskLevelColor(commonData.qualityMetrics?.riskLevel || 'low').text}`}>
                            {commonData.qualityMetrics?.riskLevel?.toUpperCase() || 'UNKNOWN'}
                          </span>
                        </div>
                        {isFeatureMode && featureData && (
                          <div className="flex justify-between">
                            <span className="text-gray-700">Risk Score:</span>
                            <span className="font-medium text-gray-900">{Math.round(featureData.riskScore)}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Screen/Feature Info */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="font-semibold text-gray-900 mb-2">
                        {isScreenMode ? 'Screen Info' : 'Feature Info'}
                      </h3>
                      <div className="space-y-2 text-sm">
                        {isScreenMode && (
                          <>
                            <div><span className="font-medium text-gray-700">URL:</span> <span className="text-gray-800">{commonData.url}</span></div>
                            <div><span className="font-medium text-gray-700">Role:</span> <span className="text-gray-800">{commonData.role}</span></div>
                          </>
                        )}
                        {isFeatureMode && featureData && (
                          <div><span className="font-medium text-gray-700">Screens:</span> <span className="text-gray-800">{featureData.screens.length}</span></div>
                        )}
                        <div><span className="font-medium text-gray-700">Description:</span> <span className="text-gray-800">{commonData.description}</span></div>
                      </div>
                    </div>

                    {/* Actions or Screens */}
                    {isScreenMode && commonData.actions.length > 0 && (
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h3 className="font-semibold text-gray-900 mb-2">Actions</h3>
                        <ul className="space-y-1 text-sm">
                          {commonData.actions.map((action, index) => (
                            <li key={index} className="flex items-start">
                              <span className="text-blue-500 mr-2">•</span>
                              <span className="text-gray-800">{action}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {isFeatureMode && featureData && (
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h3 className="font-semibold text-gray-900 mb-2">Screens ({featureData.screens.length})</h3>
                        <div className="space-y-2 text-sm max-h-32 overflow-y-auto">
                          {featureData.screens.map((screen, index) => (
                            <div key={index} className="flex items-center">
                              <span className="text-blue-500 mr-2">•</span>
                              <span className="text-gray-800">{screen.label}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Prerequisites for screen mode */}
                  {isScreenMode && commonData.prerequisites.length > 0 && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="font-semibold text-gray-900 mb-2">Prerequisites</h3>
                      <ul className="space-y-1 text-sm">
                        {commonData.prerequisites.map((prereq, index) => (
                          <li key={index} className="flex items-start">
                            <span className="text-orange-500 mr-2">•</span>
                            <span className="text-gray-800">{prereq}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Screenshot for screen mode */}
                  {isScreenMode && commonData.screenshot && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="font-semibold text-gray-900 mb-2">Screenshot</h3>
                      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                        <img 
                          src={`/userScreens/${commonData.screenshot}.png`}
                          alt={`Screenshot of ${commonData.title}`}
                          className="w-full h-auto object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            target.nextElementSibling?.classList.remove('hidden');
                          }}
                        />
                        <div className="hidden p-4 text-center">
                          <p className="text-sm text-gray-500 font-medium">Screenshot not available</p>
                          <p className="text-xs text-gray-400 mt-1">{commonData.screenshot}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Risk Calculation Breakdown */}
                  {isFeatureMode && featureData && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="font-semibold text-gray-900 mb-4">Risk Calculation Breakdown</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-700">Bug Risk (50%)</span>
                          <div className="text-right">
                            <span className="text-sm font-medium text-gray-900">
                              {Math.round(calculateBugRisk(featureData.openBugs) * 0.5)}
                            </span>
                            <span className="text-xs text-gray-500 ml-1">
                              / {Math.round(calculateBugRisk(featureData.openBugs))}
                            </span>
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-700">Test Coverage Risk (40%)</span>
                          <div className="text-right">
                            <span className="text-sm font-medium text-gray-900">
                              {Math.round(calculateTestCoverageRisk(featureData.testCount) * 0.4)}
                            </span>
                            <span className="text-xs text-gray-500 ml-1">
                              / {calculateTestCoverageRisk(featureData.testCount)}
                            </span>
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-700">Complexity Risk (10%)</span>
                          <div className="text-right">
                            <span className="text-sm font-medium text-gray-900">
                              {Math.round(calculateComplexityRisk(featureData.screens.length) * 0.1)}
                            </span>
                            <span className="text-xs text-gray-500 ml-1">
                              / {calculateComplexityRisk(featureData.screens.length)}
                            </span>
                          </div>
                        </div>
                        <div className="border-t pt-3 mt-3">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-semibold text-gray-900">Total Risk Score</span>
                            <span className="text-lg font-bold text-gray-900">
                              {Math.round(featureData.riskScore)}
                            </span>
                          </div>
                          <div className="mt-2 text-xs text-gray-600">
                            {featureData.openBugs.length} bugs • {featureData.testCount} tests • {featureData.screens.length} screens
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Bugs Tab */}
              {activeTab === 'bugs' && (
                <div className="space-y-4">
                  {bugs.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      No bugs found for this {isScreenMode ? 'screen' : 'feature'}
                    </div>
                  ) : (
                    <>
                      {/* Open Bugs */}
                      {openBugs.length > 0 && (
                        <div>
                          <h3 className="text-lg font-semibold mb-3 text-red-600">Open Bugs ({openBugs.length})</h3>
                          <div className="space-y-3">
                            {openBugs.map(bug => (
                              <div key={bug.id} className="border rounded-lg p-4 hover:bg-gray-50 bg-red-50">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                      {getBugUrl(bug.source || '') ? (
                                        <a 
                                          href={getBugUrl(bug.source || '')!} 
                                          target="_blank" 
                                          rel="noopener noreferrer"
                                          className="font-semibold text-blue-600 hover:text-blue-800"
                                        >
                                          {bug.source}
                                        </a>
                                      ) : (
                                        <h3 className="font-semibold text-gray-900">{bug.source || 'Unknown'}</h3>
                                      )}
                                      <span className={`px-2 py-1 rounded text-xs font-medium border ${getSeverityColor(bug.severity)}`}>
                                        {bug.severity}
                                      </span>
                                      <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(bug.status)}`}>
                                        {bug.status}
                                      </span>
                                    </div>
                                    <p className="text-gray-800 text-sm mb-2">{bug.description}</p>
                                    <div className="flex items-center gap-4 text-xs text-gray-600">
                                      <span>Created: {new Date(bug.createdAt).toLocaleDateString()}</span>
                                      <span>Updated: {new Date(bug.updatedAt).toLocaleDateString()}</span>
                                      {bug.assignee && <span>Assignee: {bug.assignee}</span>}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Closed Bugs */}
                      {closedBugs.length > 0 && (
                        <div>
                          <h3 className="text-lg font-semibold mb-3 text-green-600">Recently Closed Bugs ({closedBugs.length})</h3>
                          <div className="space-y-3">
                            {closedBugs.slice(0, 10).map(bug => (
                              <div key={bug.id} className="border rounded-lg p-4 hover:bg-gray-50 bg-green-50">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                      {getBugUrl(bug.source || '') ? (
                                        <a 
                                          href={getBugUrl(bug.source || '')!} 
                                          target="_blank" 
                                          rel="noopener noreferrer"
                                          className="font-semibold text-blue-600 hover:text-blue-800"
                                        >
                                          {bug.source}
                                        </a>
                                      ) : (
                                        <h3 className="font-semibold text-gray-900">{bug.source || 'Unknown'}</h3>
                                      )}
                                      <span className={`px-2 py-1 rounded text-xs font-medium border ${getSeverityColor(bug.severity)}`}>
                                        {bug.severity}
                                      </span>
                                      <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(bug.status)}`}>
                                        {bug.status}
                                      </span>
                                    </div>
                                    <p className="text-gray-800 text-sm mb-2">{bug.description}</p>
                                    <div className="flex items-center gap-4 text-xs text-gray-600">
                                      <span>Created: {new Date(bug.createdAt).toLocaleDateString()}</span>
                                      <span>Updated: {new Date(bug.updatedAt).toLocaleDateString()}</span>
                                      {bug.assignee && <span>Assignee: {bug.assignee}</span>}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* Tests Tab */}
              {activeTab === 'tests' && (
                <div className="space-y-6">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-gray-900 mb-4">Test Information</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-700">Total Test Cases:</span>
                        <span className="font-medium text-gray-900">{commonData.qualityMetrics?.testCount || 0}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-700">Test Coverage Assessment:</span>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          (commonData.qualityMetrics?.testCount || 0) === 0 ? 'bg-red-100 text-red-800' :
                          (commonData.qualityMetrics?.testCount || 0) <= 5 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {(commonData.qualityMetrics?.testCount || 0) === 0 ? 'No Coverage' :
                           (commonData.qualityMetrics?.testCount || 0) <= 5 ? 'Low Coverage' :
                           'Good Coverage'}
                        </span>
                      </div>
                      <div className="mt-4 text-sm text-gray-600">
                        Test data is integrated from Allure TestOps and used in risk calculations.
                      </div>
                    </div>
                  </div>

                  {/* Test Cases */}
                  {testCases.length > 0 ? (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="font-semibold text-gray-900 mb-4">Test Cases ({testCases.length})</h3>
                      <div className="space-y-2">
                        {testCases.map(testCase => (
                          <div key={testCase.id} className="flex items-start justify-between text-sm bg-white p-3 rounded">
                            <div className="flex-1">
                              <a 
                                href={`https://choco.testops.cloud/project/1/test-cases/${testCase.id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-medium text-blue-600 hover:text-blue-800 hover:underline"
                                title="View test case in Allure TestOps"
                              >
                                {testCase.name}
                              </a>
                              <div className="text-gray-600 mt-1">{testCase.featureName}</div>
                              {testCase.lastExecuted && (
                                <div className="text-gray-500 text-xs mt-1">
                                  Last run: {new Date(testCase.lastExecuted).toLocaleDateString()}
                                </div>
                              )}
                            </div>
                            <span className={`ml-2 px-2 py-1 rounded text-xs ${getTestStatusColor(testCase.status || 'skipped')}`}>
                              {testCase.status || 'skipped'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      No detailed test cases available for this {isScreenMode ? 'screen' : 'feature'}
                    </div>
                  )}
                </div>
              )}

              {/* Documentation Tab */}
              {activeTab === 'docs' && (
                <div className="space-y-4">
                  {docs.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      No documentation found for this {isScreenMode ? 'screen' : 'feature'}
                    </div>
                  ) : (
                    docs.map(doc => (
                      <div key={doc.id} className="border rounded-lg p-4 hover:bg-gray-50">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 mb-2">{doc.title}</h3>
                            <p className="text-gray-700 text-sm mb-3">{doc.description}</p>
                            
                            {/* Show documentation content */}
                            {doc.documentation && (
                              <div className="bg-gray-50 p-3 rounded text-sm text-gray-800 mb-3 whitespace-pre-wrap">
                                {doc.documentation}
                              </div>
                            )}
                            
                            <div className="flex items-center gap-4 text-xs text-gray-600 mb-3">
                              <span>Updated: {new Date(doc.lastUpdated).toLocaleDateString()}</span>
                              {doc.team && <span>Team: {doc.team}</span>}
                            </div>
                            
                            {doc.tags && doc.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {doc.tags.map(tag => (
                                  <span key={tag} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
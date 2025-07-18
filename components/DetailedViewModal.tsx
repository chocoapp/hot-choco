import { useState, useEffect, useCallback } from 'react';
import { FlowNodeData } from '../types/flow';
import { supabaseService } from '../lib/supabase';
import { allureService } from '../lib/services';
import { ProductDocumentation, BugReport } from '../services/supabaseService';
import { TestCoverage, TestStats, TestCase } from '../services/allureService';

interface DetailedViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  nodeData: FlowNodeData;
}

export default function DetailedViewModal({ isOpen, onClose, nodeData }: DetailedViewModalProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'bugs' | 'tests' | 'docs'>('overview');
  const [loading, setLoading] = useState(false);
  const [bugs, setBugs] = useState<BugReport[]>([]);
  const [docs, setDocs] = useState<ProductDocumentation[]>([]);
  const [testCoverage, setTestCoverage] = useState<TestCoverage | null>(null);
  const [testStats, setTestStats] = useState<TestStats | null>(null);
  const [testCases, setTestCases] = useState<TestCase[]>([]);

  const loadDetailedData = useCallback(async () => {
    setLoading(true);
    try {
      console.log('Querying for:', {
        product: nodeData.product,
        section: nodeData.section,
        feature: nodeData.feature
      });

      // Try querying at different levels of specificity
      let bugsData = await supabaseService.getBugReports(nodeData.product || '', nodeData.section, nodeData.feature);
      let docsData = await supabaseService.getProductDocs(nodeData.product || '', nodeData.section, nodeData.feature);
      
      // If no data found at feature level, try section level
      if (bugsData.length === 0 && docsData.length === 0) {
        console.log('No data at feature level, trying section level...');
        bugsData = await supabaseService.getBugReports(nodeData.product || '', nodeData.section);
        docsData = await supabaseService.getProductDocs(nodeData.product || '', nodeData.section);
      }
      
      // If still no data, try product level
      if (bugsData.length === 0 && docsData.length === 0) {
        console.log('No data at section level, trying product level...');
        bugsData = await supabaseService.getBugReports(nodeData.product || '');
        docsData = await supabaseService.getProductDocs(nodeData.product || '');
      }

      const [coverageData, statsData, testCasesData] = await Promise.all([
        allureService.getTestCoverage(nodeData.product || '', nodeData.section, nodeData.feature),
        allureService.getTestStats(nodeData.product || '', nodeData.section, nodeData.feature),
        allureService.getTestCases(nodeData.product || '', nodeData.section, nodeData.feature)
      ]);

      console.log('Results:', {
        bugs: bugsData.length,
        docs: docsData.length,
        coverage: coverageData,
        stats: statsData,
        testCases: testCasesData.length
      });

      setBugs(bugsData);
      setDocs(docsData);
      setTestCoverage(coverageData);
      setTestStats(statsData);
      setTestCases(testCasesData);
    } catch (error) {
      console.error('Error loading detailed data:', error);
    } finally {
      setLoading(false);
    }
  }, [nodeData.product, nodeData.section, nodeData.feature]);

  useEffect(() => {
    if (isOpen && nodeData) {
      loadDetailedData();
    }
  }, [isOpen, nodeData, loadDetailedData]);

  if (!isOpen) return null;

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
      case 'passed':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'skipped':
        return 'bg-yellow-100 text-yellow-800';
      case 'broken':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-6xl h-5/6 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{nodeData.label}</h2>
            <p className="text-gray-600 mt-1">
              {nodeData.product} → {nodeData.section} → {nodeData.feature}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b">
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
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
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
              {/* Overview Tab */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="font-semibold text-gray-900 mb-2">Quality Metrics</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>Test Cases:</span>
                          <span className="font-medium">{nodeData.qualityMetrics?.testCount || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Bug Count:</span>
                          <span className="font-medium">{nodeData.qualityMetrics?.bugCount || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Risk Level:</span>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            nodeData.qualityMetrics?.riskLevel === 'low' ? 'bg-green-100 text-green-800' :
                            nodeData.qualityMetrics?.riskLevel === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {nodeData.qualityMetrics?.riskLevel || 'Unknown'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="font-semibold text-gray-900 mb-2">Screen Info</h3>
                      <div className="space-y-2 text-sm">
                        <div><span className="font-medium">URL:</span> {nodeData.url}</div>
                        <div><span className="font-medium">Role:</span> {nodeData.role}</div>
                        <div><span className="font-medium">Description:</span> {nodeData.description}</div>
                      </div>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="font-semibold text-gray-900 mb-2">Actions</h3>
                      <ul className="space-y-1 text-sm">
                        {nodeData.actions?.map((action, index) => (
                          <li key={index} className="flex items-start">
                            <span className="text-blue-500 mr-2">•</span>
                            {action}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {testStats && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="font-semibold text-gray-900 mb-4">Test Results Summary</h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">{testStats.passed}</div>
                          <div className="text-sm text-gray-600">Passed</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-red-600">{testStats.failed}</div>
                          <div className="text-sm text-gray-600">Failed</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-yellow-600">{testStats.skipped}</div>
                          <div className="text-sm text-gray-600">Skipped</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-gray-600">{testStats.total}</div>
                          <div className="text-sm text-gray-600">Total</div>
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
                    <div className="text-center py-8 text-gray-700">
                      No bugs found for this feature
                    </div>
                  ) : (
                    bugs.map(bug => (
                      <div key={bug.id} className="border rounded-lg p-4 hover:bg-gray-50">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold text-gray-900">{bug.title}</h3>
                              <span className={`px-2 py-1 rounded text-xs font-medium border ${getSeverityColor(bug.severity)}`}>
                                {bug.severity}
                              </span>
                              <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(bug.status)}`}>
                                {bug.status}
                              </span>
                            </div>
                            <p className="text-gray-800 text-sm mb-2">{bug.description}</p>
                            <div className="flex items-center gap-4 text-xs text-gray-800">
                              <span>Created: {new Date(bug.createdAt).toLocaleDateString()}</span>
                              <span>Updated: {new Date(bug.updatedAt).toLocaleDateString()}</span>
                              {bug.assignee && <span>Assignee: {bug.assignee}</span>}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Tests Tab */}
              {activeTab === 'tests' && (
                <div className="space-y-6">
                  {testCoverage && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="font-semibold text-gray-900 mb-4">Test Coverage Details</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>Overall Coverage:</span>
                          <span className="font-medium">{testCoverage.coveragePercentage}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${testCoverage.coveragePercentage}%` }}
                          ></div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
                          <div>Lines Covered: {testCoverage.linesCovered}</div>
                          <div>Total Lines: {testCoverage.totalLines}</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {testStats && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="font-semibold text-gray-900 mb-4">Test Execution Results</h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center p-3 bg-white rounded">
                          <div className="text-xl font-bold text-green-600">{testStats.passed}</div>
                          <div className="text-sm text-gray-600">Passed</div>
                        </div>
                        <div className="text-center p-3 bg-white rounded">
                          <div className="text-xl font-bold text-red-600">{testStats.failed}</div>
                          <div className="text-sm text-gray-600">Failed</div>
                        </div>
                        <div className="text-center p-3 bg-white rounded">
                          <div className="text-xl font-bold text-yellow-600">{testStats.skipped}</div>
                          <div className="text-sm text-gray-600">Skipped</div>
                        </div>
                        <div className="text-center p-3 bg-white rounded">
                          <div className="text-xl font-bold text-gray-600">{testStats.total}</div>
                          <div className="text-sm text-gray-600">Total</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Test Cases */}
                  {testCases.length > 0 && (
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
                  )}
                </div>
              )}

              {/* Documentation Tab */}
              {activeTab === 'docs' && (
                <div className="space-y-4">
                  {docs.length === 0 ? (
                    <div className="text-center py-8 text-gray-700">
                      No documentation found for this feature
                    </div>
                  ) : (
                    docs.map(doc => (
                      <div key={doc.id} className="border rounded-lg p-4 hover:bg-gray-50">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 mb-2">{doc.title}</h3>
                            <p className="text-gray-600 text-sm mb-2">{doc.description}</p>
                            <div className="flex items-center gap-4 text-xs text-gray-800 mb-3">
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
/**
 * Allure TestOps integration service for test data and coverage metrics
 */

// Feature mapping between flow features and Allure TestOps features
const FEATURE_MAPPING: Record<string, string> = {
  'feature_order_guide': 'Order Guide',
  'feature_user_login': 'Login',
  'feature_checkout': 'Checkout & order submission',
  'feature_catalog_browsing': 'Catalog',
  'feature_chat': 'Chat screen',
  'feature_order_details': 'Order Details',
  'feature_supplier_management': 'Supplier details',
  'feature_invoice_management': 'Invoices',
  'feature_team_management': 'Admin roles and permissions',
  'feature_notifications': 'Notifications',
  'feature_delivery_check': 'Delivery Check'
};

// Load test features from static data
const loadTestFeatures = async (): Promise<any[]> => {
  try {
    // Use absolute URL to avoid potential issues with relative paths
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/allureTestOps/test-features.json`);
    if (!response.ok) {
      console.error('Failed to load test features:', response.status, response.statusText);
      throw new Error(`Failed to load test features: ${response.status} ${response.statusText}`);
    }
    const data = await response.json();
    return data.content || [];
  } catch (error) {
    console.error('Error loading test features:', error);
    // Return empty array instead of throwing to prevent blocking
    return [];
  }
};

// Find Allure TestOps feature ID by name matching
const getAllureFeatureId = async (featureName: string): Promise<number | null> => {
  const testFeatures = await loadTestFeatures();
  const mappedName = FEATURE_MAPPING[featureName];
  
  if (!mappedName) {
    console.warn(`No mapping found for feature: ${featureName}`);
    return null;
  }
  
  // Try exact match first
  let feature = testFeatures.find(f => f.name === mappedName);
  
  // If no exact match, try case-insensitive match
  if (!feature) {
    feature = testFeatures.find(f => f.name.toLowerCase() === mappedName.toLowerCase());
  }
  
  if (feature) {
    console.log(`Found feature ID ${feature.id} for ${featureName} -> ${mappedName}`);
    return feature.id;
  }
  
  console.warn(`No Allure TestOps feature found for: ${featureName} (mapped to: ${mappedName})`);
  return null;
};

export interface TestResult {
  id: string;
  product: string;
  section: string;
  feature: string;
  testName: string;
  testSuite: string;
  status: 'passed' | 'failed' | 'skipped' | 'broken';
  duration: number;
  executedAt: string;
  errorMessage?: string;
  attachments?: string[];
}

export interface TestCase {
  id: number;
  name: string;
  status?: 'passed' | 'failed' | 'skipped' | 'broken';
  featureId: number;
  featureName: string;
  lastExecuted?: string;
  duration?: number;
  errorMessage?: string;
}

export interface TestCoverage {
  featureId: number;
  featureName: string;
  totalTests: number;
  coveragePercentage: number;
  linesCovered: number;
  totalLines: number;
  lastUpdated: string;
}

export interface TestStats {
  total: number;
  passed: number;
  failed: number;
  skipped: number;
}

export interface TestCoverageData {
  product: string;
  section: string;
  feature: string;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  skippedTests: number;
  coveragePercentage: number;
  lastExecuted: string;
}

export interface AllureService {
  /**
   * Get test results for a specific product/section/feature
   */
  getTestResults(product: string, section?: string, feature?: string): Promise<TestResult[]>;
  
  /**
   * Get test coverage data for a specific product/section/feature
   */
  getTestCoverage(product: string, section?: string, feature?: string): Promise<TestCoverage | null>;
  
  /**
   * Get test execution statistics
   */
  getTestStats(product: string, section?: string, feature?: string): Promise<TestStats | null>;
  
  /**
   * Get test cases for a specific feature
   */
  getTestCases(product: string, section?: string, feature?: string): Promise<TestCase[]>;
  
  /**
   * Get recent test executions
   */
  getRecentExecutions(product: string, section?: string, feature?: string, limit?: number): Promise<TestResult[]>;
  
  /**
   * Upload test results to Allure TestOps
   */
  uploadTestResults(results: Omit<TestResult, 'id' | 'executedAt'>[]): Promise<TestResult[]>;
}

// Real Allure TestOps implementation
export class RealAllureService implements AllureService {
  private baseUrl: string;
  private projectId = 1;
  private apiKey: string;
  
  constructor() {
    this.baseUrl = `${process.env.NEXT_PUBLIC_ALLURE_TESTOPS_URL || 'https://choco.testops.cloud'}/api`;
    this.apiKey = process.env.NEXT_PUBLIC_ALLURE_TESTOPS_API_KEY || '';
    
    console.log('Allure TestOps Configuration:', {
      baseUrl: this.baseUrl,
      hasApiKey: !!this.apiKey,
      apiKeyPrefix: this.apiKey ? this.apiKey.substring(0, 8) + '...' : 'none'
    });
    
    if (!this.apiKey) {
      console.warn('NEXT_PUBLIC_ALLURE_TESTOPS_API_KEY not found in environment variables');
    }
  }
  
  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    };
    
    if (this.apiKey) {
      headers['Authorization'] = `Api-Token ${this.apiKey}`;
    }
    
    return headers;
  }
  
  private getMockTestCases(feature: string): TestCase[] {
    // Mock test cases based on the feature
    const mockTestCases: Record<string, TestCase[]> = {
      'feature_order_guide': [
        {
          id: 1001,
          name: 'should_display_order_guide_correctly',
          status: 'passed',
          featureId: 6003,
          featureName: 'Order Guide',
          lastExecuted: '2025-07-17T10:00:00Z',
          duration: 2500
        },
        {
          id: 1002,
          name: 'should_filter_products_by_category',
          status: 'passed',
          featureId: 6003,
          featureName: 'Order Guide',
          lastExecuted: '2025-07-17T10:01:00Z',
          duration: 3200
        },
        {
          id: 1003,
          name: 'should_handle_empty_order_guide',
          status: 'failed',
          featureId: 6003,
          featureName: 'Order Guide',
          lastExecuted: '2025-07-17T10:02:00Z',
          duration: 1800,
          errorMessage: 'Empty state not displayed correctly'
        },
        {
          id: 1004,
          name: 'should_add_products_to_cart',
          status: 'passed',
          featureId: 6003,
          featureName: 'Order Guide',
          lastExecuted: '2025-07-17T10:03:00Z',
          duration: 4100
        }
      ],
      'feature_user_login': [
        {
          id: 2001,
          name: 'should_login_with_valid_credentials',
          status: 'passed',
          featureId: 1,
          featureName: 'Login',
          lastExecuted: '2025-07-17T09:30:00Z',
          duration: 1200
        },
        {
          id: 2002,
          name: 'should_reject_invalid_credentials',
          status: 'passed',
          featureId: 1,
          featureName: 'Login',
          lastExecuted: '2025-07-17T09:31:00Z',
          duration: 800
        }
      ]
    };
    
    return mockTestCases[feature] || [];
  }
  
  async getTestCases(product: string, section?: string, feature?: string): Promise<TestCase[]> {
    if (!feature) {
      return [];
    }
    
    try {
      const featureId = await getAllureFeatureId(feature);
      if (!featureId) {
        return [];
      }
      
      const url = `${this.baseUrl}/testcase/__search?projectId=${this.projectId}&rql=cfv%3D${featureId}&deleted=false&page=0&size=100&sort=id%2CDESC`;
      const headers = this.getHeaders();
      
      console.log('Fetching test cases from Allure TestOps:', {
        url,
        featureId,
        hasAuth: !!(headers as any).Authorization
      });
      
      const response = await fetch(url, {
        method: 'GET',
        headers,
      });
      
      if (!response.ok) {
        console.error('Allure TestOps API Error:', {
          status: response.status,
          statusText: response.statusText,
          url: response.url,
          headers: Object.fromEntries(response.headers.entries())
        });
        throw new Error(`Failed to fetch test cases: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      const testFeatures = await loadTestFeatures();
      const featureData = testFeatures.find(f => f.id === featureId);
      
      return (data.content || []).map((testCase: any) => ({
        id: testCase.id,
        name: testCase.name,
        status: this.mapTestStatus(testCase.status),
        featureId: featureId,
        featureName: featureData?.name || 'Unknown',
        lastExecuted: testCase.lastExecuted,
        duration: testCase.duration,
        errorMessage: testCase.errorMessage
      }));
    } catch (error) {
      console.error('Error fetching test cases:', error);
      return [];
    }
  }
  
  private mapTestStatus(status: any): 'passed' | 'failed' | 'skipped' | 'broken' {
    const statusStr = status?.toString?.()?.toLowerCase() || '';
    switch (statusStr) {
      case 'passed':
      case 'success':
        return 'passed';
      case 'failed':
      case 'failure':
        return 'failed';
      case 'skipped':
        return 'skipped';
      case 'broken':
        return 'broken';
      default:
        return 'skipped';
    }
  }
  
  async getTestCoverage(product: string, section?: string, feature?: string): Promise<TestCoverage | null> {
    const testCases = await this.getTestCases(product, section, feature);
    if (testCases.length === 0) {
      return null;
    }
    
    const featureId = await getAllureFeatureId(feature || '');
    if (!featureId) {
      return null;
    }
    
    const stats = await this.getTestStats(product, section, feature);
    if (!stats) {
      return null;
    }
    
    return {
      featureId,
      featureName: testCases[0].featureName,
      totalTests: stats.total,
      coveragePercentage: stats.total > 0 ? (stats.passed / stats.total) * 100 : 0,
      linesCovered: stats.passed,
      totalLines: stats.total,
      lastUpdated: new Date().toISOString()
    };
  }
  
  async getTestStats(product: string, section?: string, feature?: string): Promise<TestStats | null> {
    const testCases = await this.getTestCases(product, section, feature);
    if (testCases.length === 0) {
      return null;
    }
    
    return {
      total: testCases.length,
      passed: testCases.filter(t => t.status === 'passed').length,
      failed: testCases.filter(t => t.status === 'failed').length,
      skipped: testCases.filter(t => t.status === 'skipped').length
    };
  }
  
  async getTestResults(product: string, section?: string, feature?: string): Promise<TestResult[]> {
    // For now, convert test cases to test results format
    const testCases = await this.getTestCases(product, section, feature);
    return testCases.map(testCase => ({
      id: testCase.id.toString(),
      product,
      section: section || '',
      feature: feature || '',
      testName: testCase.name,
      testSuite: testCase.featureName,
      status: testCase.status || 'skipped',
      duration: testCase.duration || 0,
      executedAt: testCase.lastExecuted || new Date().toISOString(),
      errorMessage: testCase.errorMessage
    }));
  }
  
  async getRecentExecutions(product: string, section?: string, feature?: string, limit = 10): Promise<TestResult[]> {
    const results = await this.getTestResults(product, section, feature);
    return results
      .sort((a, b) => new Date(b.executedAt).getTime() - new Date(a.executedAt).getTime())
      .slice(0, limit);
  }
  
  async uploadTestResults(results: Omit<TestResult, 'id' | 'executedAt'>[]): Promise<TestResult[]> {
    // Implementation for uploading test results to Allure TestOps
    throw new Error('Upload functionality not implemented yet');
  }
}

// Mock implementation for development
export class MockAllureService implements AllureService {
  private mockResults: TestResult[] = [
    {
      id: '1',
      product: 'authentication',
      section: 'login',
      feature: 'phone-login',
      testName: 'should_validate_phone_number_format',
      testSuite: 'PhoneLoginTests',
      status: 'passed',
      duration: 1500,
      executedAt: '2025-07-15T10:00:00Z'
    },
    {
      id: '2',
      product: 'authentication',
      section: 'login',
      feature: 'phone-login',
      testName: 'should_handle_invalid_country_code',
      testSuite: 'PhoneLoginTests',
      status: 'failed',
      duration: 2000,
      executedAt: '2025-07-15T10:01:00Z',
      errorMessage: 'Expected validation error not thrown'
    },
    {
      id: '3',
      product: 'ordering-system',
      section: 'catalog',
      feature: 'product-browsing',
      testName: 'should_load_product_images',
      testSuite: 'ProductCatalogTests',
      status: 'failed',
      duration: 5000,
      executedAt: '2025-07-15T10:02:00Z',
      errorMessage: 'Images failed to load within timeout'
    }
  ];

  async getTestResults(product: string, section?: string, feature?: string): Promise<TestResult[]> {
    return this.mockResults.filter(result => 
      result.product === product &&
      (!section || result.section === section) &&
      (!feature || result.feature === feature)
    );
  }

  async getTestCoverage(product: string, section?: string, feature?: string): Promise<TestCoverage | null> {
    const stats = await this.getTestStats(product, section, feature);
    if (!stats) {
      return null;
    }
    
    return {
      featureId: 1,
      featureName: feature || 'Mock Feature',
      totalTests: stats.total,
      coveragePercentage: stats.total > 0 ? (stats.passed / stats.total) * 100 : 0,
      linesCovered: stats.passed,
      totalLines: stats.total,
      lastUpdated: new Date().toISOString()
    };
  }
  
  async getTestCases(product: string, section?: string, feature?: string): Promise<TestCase[]> {
    const results = await this.getTestResults(product, section, feature);
    return results.map(result => ({
      id: parseInt(result.id),
      name: result.testName,
      status: result.status,
      featureId: 1,
      featureName: feature || 'Mock Feature',
      lastExecuted: result.executedAt,
      duration: result.duration,
      errorMessage: result.errorMessage
    }));
  }

  async getTestStats(product: string, section?: string, feature?: string): Promise<TestStats | null> {
    const results = await this.getTestResults(product, section, feature);
    
    return {
      total: results.length,
      passed: results.filter(r => r.status === 'passed').length,
      failed: results.filter(r => r.status === 'failed').length,
      skipped: results.filter(r => r.status === 'skipped').length
    };
  }

  async getRecentExecutions(product: string, section?: string, feature?: string, limit = 10): Promise<TestResult[]> {
    const results = await this.getTestResults(product, section, feature);
    return results
      .sort((a, b) => new Date(b.executedAt).getTime() - new Date(a.executedAt).getTime())
      .slice(0, limit);
  }

  async uploadTestResults(results: Omit<TestResult, 'id' | 'executedAt'>[]): Promise<TestResult[]> {
    const newResults: TestResult[] = results.map(result => ({
      ...result,
      id: Math.random().toString(36).substr(2, 9),
      executedAt: new Date().toISOString()
    }));
    
    this.mockResults.push(...newResults);
    return newResults;
  }
}
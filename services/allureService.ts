/**
 * Allure TestOps integration service for test data and coverage metrics
 */

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
  getTestCoverage(product: string, section?: string, feature?: string): Promise<TestCoverageData>;
  
  /**
   * Get test execution statistics
   */
  getTestStats(product: string, section?: string, feature?: string): Promise<{
    total: number;
    passed: number;
    failed: number;
    skipped: number;
  }>;
  
  /**
   * Get recent test executions
   */
  getRecentExecutions(product: string, section?: string, feature?: string, limit?: number): Promise<TestResult[]>;
  
  /**
   * Upload test results to Allure TestOps
   */
  uploadTestResults(results: Omit<TestResult, 'id' | 'executedAt'>[]): Promise<TestResult[]>;
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

  async getTestCoverage(product: string, section?: string, feature?: string): Promise<TestCoverageData> {
    const results = await this.getTestResults(product, section, feature);
    const stats = await this.getTestStats(product, section, feature);
    
    return {
      product,
      section: section || 'all',
      feature: feature || 'all',
      totalTests: stats.total,
      passedTests: stats.passed,
      failedTests: stats.failed,
      skippedTests: stats.skipped,
      coveragePercentage: stats.total > 0 ? (stats.passed / stats.total) * 100 : 0,
      lastExecuted: results.length > 0 ? results[0].executedAt : new Date().toISOString()
    };
  }

  async getTestStats(product: string, section?: string, feature?: string): Promise<{
    total: number;
    passed: number;
    failed: number;
    skipped: number;
  }> {
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
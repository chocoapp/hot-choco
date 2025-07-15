/**
 * Quality metrics service that aggregates data from Supabase and Allure TestOps
 * to calculate risk levels and quality scores
 */

import { SupabaseService } from './supabaseService';
import { AllureService } from './allureService';
import { QualityMetrics } from '../types/flow';

export interface QualityService {
  /**
   * Get aggregated quality metrics for a product/section/feature
   */
  getQualityMetrics(product: string, section?: string, feature?: string): Promise<QualityMetrics>;
  
  /**
   * Calculate risk level based on test coverage and bug count
   */
  calculateRiskLevel(testCoverage: number, bugCount: number): 'low' | 'medium' | 'high';
  
  /**
   * Get quality metrics for multiple features
   */
  getBulkQualityMetrics(features: Array<{product: string, section?: string, feature?: string}>): Promise<QualityMetrics[]>;
  
  /**
   * Update quality metrics for a feature
   */
  updateQualityMetrics(product: string, section: string, feature: string): Promise<QualityMetrics>;
}

export class QualityServiceImpl implements QualityService {
  constructor(
    private supabaseService: SupabaseService,
    private allureService: AllureService
  ) {}

  async getQualityMetrics(product: string, section?: string, feature?: string): Promise<QualityMetrics> {
    // Get test coverage data
    const testCoverage = await this.allureService.getTestCoverage(product, section, feature);
    const testStats = await this.allureService.getTestStats(product, section, feature);
    
    // Get bug count
    const bugCount = await this.supabaseService.getBugCount(product, section, feature);
    
    // Calculate risk level
    const riskLevel = this.calculateRiskLevel(testCoverage.coveragePercentage, bugCount);
    
    return {
      testCoverage: testCoverage.coveragePercentage,
      bugCount,
      riskLevel,
      lastUpdated: new Date().toISOString(),
      testResults: {
        passed: testStats.passed,
        failed: testStats.failed,
        skipped: testStats.skipped,
        total: testStats.total
      }
    };
  }

  calculateRiskLevel(testCoverage: number, bugCount: number): 'low' | 'medium' | 'high' {
    // Risk calculation algorithm
    let riskScore = 0;
    
    // Test coverage contribution (40% of risk)
    if (testCoverage < 60) {
      riskScore += 40;
    } else if (testCoverage < 80) {
      riskScore += 20;
    } else {
      riskScore += 0;
    }
    
    // Bug count contribution (60% of risk)
    if (bugCount === 0) {
      riskScore += 0;
    } else if (bugCount <= 2) {
      riskScore += 20;
    } else if (bugCount <= 5) {
      riskScore += 40;
    } else {
      riskScore += 60;
    }
    
    // Classify risk level
    if (riskScore <= 20) {
      return 'low';
    } else if (riskScore <= 50) {
      return 'medium';
    } else {
      return 'high';
    }
  }

  async getBulkQualityMetrics(features: Array<{product: string, section?: string, feature?: string}>): Promise<QualityMetrics[]> {
    const promises = features.map(f => this.getQualityMetrics(f.product, f.section, f.feature));
    return Promise.all(promises);
  }

  async updateQualityMetrics(product: string, section: string, feature: string): Promise<QualityMetrics> {
    return this.getQualityMetrics(product, section, feature);
  }
}

// Helper function to get risk level color for UI
export function getRiskLevelColor(riskLevel: 'low' | 'medium' | 'high'): {
  background: string;
  border: string;
  text: string;
} {
  switch (riskLevel) {
    case 'low':
      return {
        background: 'bg-green-50',
        border: 'border-green-200',
        text: 'text-green-800'
      };
    case 'medium':
      return {
        background: 'bg-yellow-50',
        border: 'border-yellow-200',
        text: 'text-yellow-800'
      };
    case 'high':
      return {
        background: 'bg-red-50',
        border: 'border-red-200',
        text: 'text-red-800'
      };
  }
}

// Helper function to get risk level for node visualization
export function getRiskLevelNodeColor(riskLevel: 'low' | 'medium' | 'high'): string {
  switch (riskLevel) {
    case 'low':
      return '#10b981'; // green
    case 'medium':
      return '#f59e0b'; // yellow
    case 'high':
      return '#ef4444'; // red
  }
}
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
   * Calculate risk level based on bug count and test count
   */
  calculateRiskLevel(bugCount: number, testCount: number): 'low' | 'medium' | 'high';
  
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
    // Get test count from Allure TestOps
    const testStats = await this.allureService.getTestStats(product, section, feature);
    const testCount = testStats?.total || 0;
    
    // Get bug count from Supabase
    const bugCount = await this.supabaseService.getBugCount(product, section, feature);
    
    // Calculate risk level based on bugs and test count
    const riskLevel = this.calculateRiskLevel(bugCount, testCount);
    
    return {
      bugCount,
      testCount,
      riskLevel,
      lastUpdated: new Date().toISOString()
    };
  }

  calculateRiskLevel(bugCount: number, testCount: number): 'low' | 'medium' | 'high' {
    // Enhanced risk calculation: Bug Risk (70%) + Test Coverage Risk (30%)
    let riskScore = 0;
    
    // Bug Risk Score (70% weight)
    // Bug volume: min(bugCount * 3, 30) - capped at 30 points
    const bugVolumeScore = Math.min(bugCount * 3, 30);
    
    // Severity-weighted score (will be enhanced when bug severity data is available)
    // For now, assume medium severity: 6 points per bug
    const severityScore = bugCount * 6;
    
    const bugRiskScore = bugVolumeScore + severityScore;
    
    // Test Coverage Risk (30% weight)
    // Fewer tests = higher risk
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
    
    // Combine scores
    riskScore = (bugRiskScore * 0.7) + (testCoverageRisk * 0.3);
    
    // Classify risk level
    if (riskScore <= 20) {
      return 'low';
    } else if (riskScore <= 40) {
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
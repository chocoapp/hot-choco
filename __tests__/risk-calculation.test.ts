import { BugReport } from '../services/supabaseService';

// Risk calculation functions (copied from components for testing)
const calculateRiskScore = (openBugs: BugReport[], testCount: number, screenCount: number = 1): number => {
  // Bug Risk Score (50% weight)
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

  // Test Coverage Risk (40% weight)
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

  // Feature Complexity Risk (10% weight)
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

const getRiskLevel = (riskScore: number): 'low' | 'medium' | 'high' => {
  if (riskScore <= 20) return 'low';
  if (riskScore <= 40) return 'medium';
  return 'high';
};

// Mock bug data based on what we see in the app
const createMockBug = (severity: 'low' | 'medium' | 'high' | 'critical', id: string): BugReport => ({
  id,
  product: 'test',
  section: 'test',
  feature: 'test',
  title: `Test Bug ${id}`,
  description: 'Test description',
  severity,
  status: 'open',
  assignee: 'test',
  createdAt: '2023-01-01T00:00:00Z',
  updatedAt: '2023-01-01T00:00:00Z',
  tags: [],
  source: `BUG-${id}`,
  team: 'test',
  issueType: 'bug',
  statusCategory: 'open'
});

describe('Risk Calculation Tests', () => {
  describe('Basic Risk Score Calculation', () => {
    test('should calculate correct score for no bugs, no tests, single screen', () => {
      const bugs: BugReport[] = [];
      const testCount = 0;
      const screenCount = 1;
      
      const score = calculateRiskScore(bugs, testCount, screenCount);
      
      // Expected: bugRisk=0, testCoverageRisk=30, complexityRisk=0
      // Score = (0 * 0.5) + (30 * 0.4) + (0 * 0.1) = 12
      expect(score).toBe(12);
      expect(getRiskLevel(score)).toBe('low');
    });

    test('should calculate correct score for Login feature (6 low-severity bugs, 1 test, 4 screens)', () => {
      const bugs: BugReport[] = [
        createMockBug('low', '1'),
        createMockBug('low', '2'),
        createMockBug('low', '3'),
        createMockBug('low', '4'),
        createMockBug('low', '5'),
        createMockBug('low', '6'),
      ];
      const testCount = 1;
      const screenCount = 4;
      
      const score = calculateRiskScore(bugs, testCount, screenCount);
      
      // Expected calculation:
      // bugVolumeScore = min(6 * 3, 30) = 18
      // severityScore = 6 * 2 = 12
      // bugRiskScore = 18 + 12 = 30
      // testCoverageRisk = 20 (for 1 test)
      // complexityRisk = 10 (for 4 screens)
      // score = (30 * 0.5) + (20 * 0.4) + (10 * 0.1) = 15 + 8 + 1 = 24
      
      console.log('Login calculation:', {
        bugs: bugs.length,
        testCount,
        screenCount,
        bugVolumeScore: Math.min(bugs.length * 3, 30),
        severityScore: bugs.reduce((s, b) => s + 2, 0),
        bugRiskScore: Math.min(bugs.length * 3, 30) + bugs.reduce((s, b) => s + 2, 0),
        testCoverageRisk: 20,
        complexityRisk: 10,
        finalScore: score
      });
      
      expect(score).toBe(24);
      expect(getRiskLevel(score)).toBe('medium');
    });

    test('should calculate correct score for Checkout feature (5 mixed-severity bugs, 3 tests, 3 screens)', () => {
      const bugs: BugReport[] = [
        createMockBug('medium', '1'),
        createMockBug('medium', '2'),
        createMockBug('high', '3'),
        createMockBug('low', '4'),
        createMockBug('medium', '5'),
      ];
      const testCount = 3;
      const screenCount = 3;
      
      const score = calculateRiskScore(bugs, testCount, screenCount);
      
      // Expected calculation:
      // bugVolumeScore = min(5 * 3, 30) = 15
      // severityScore = 3*6 + 1*12 + 1*2 = 18 + 12 + 2 = 32
      // bugRiskScore = 15 + 32 = 47
      // testCoverageRisk = 20 (for 3 tests)
      // complexityRisk = 10 (for 3 screens)
      // score = (47 * 0.5) + (20 * 0.4) + (10 * 0.1) = 23.5 + 8 + 1 = 32.5
      
      console.log('Checkout calculation:', {
        bugs: bugs.length,
        testCount,
        screenCount,
        bugVolumeScore: Math.min(bugs.length * 3, 30),
        severityScore: bugs.reduce((s, b) => s + (b.severity === 'medium' ? 6 : b.severity === 'high' ? 12 : 2), 0),
        bugRiskScore: Math.min(bugs.length * 3, 30) + bugs.reduce((s, b) => s + (b.severity === 'medium' ? 6 : b.severity === 'high' ? 12 : 2), 0),
        testCoverageRisk: 20,
        complexityRisk: 10,
        finalScore: score
      });
      
      expect(score).toBe(32.5);
      expect(getRiskLevel(score)).toBe('medium');
    });
  });

  describe('Component Risk Factor Tests', () => {
    test('should calculate bug risk correctly for different severities', () => {
      const lowBugs = [createMockBug('low', '1'), createMockBug('low', '2')];
      const mediumBugs = [createMockBug('medium', '1'), createMockBug('medium', '2')];
      const highBugs = [createMockBug('high', '1'), createMockBug('high', '2')];
      
      const lowScore = calculateRiskScore(lowBugs, 10, 1); // Good test coverage, simple
      const mediumScore = calculateRiskScore(mediumBugs, 10, 1);
      const highScore = calculateRiskScore(highBugs, 10, 1);
      
      expect(highScore).toBeGreaterThan(mediumScore);
      expect(mediumScore).toBeGreaterThan(lowScore);
    });

    test('should calculate test coverage risk correctly', () => {
      const bugs = [createMockBug('low', '1')];
      
      const noTests = calculateRiskScore(bugs, 0, 1);
      const fewTests = calculateRiskScore(bugs, 3, 1);
      const manyTests = calculateRiskScore(bugs, 15, 1);
      
      expect(noTests).toBeGreaterThan(fewTests);
      expect(fewTests).toBeGreaterThan(manyTests);
    });

    test('should calculate complexity risk correctly', () => {
      const bugs = [createMockBug('low', '1')];
      
      const singleScreen = calculateRiskScore(bugs, 10, 1);
      const fewScreens = calculateRiskScore(bugs, 10, 3);
      const manyScreens = calculateRiskScore(bugs, 10, 6);
      
      expect(manyScreens).toBeGreaterThan(fewScreens);
      expect(fewScreens).toBeGreaterThan(singleScreen);
    });
  });

  describe('Risk Level Classification', () => {
    test('should classify risk levels correctly', () => {
      expect(getRiskLevel(10)).toBe('low');
      expect(getRiskLevel(20)).toBe('low');
      expect(getRiskLevel(21)).toBe('medium');
      expect(getRiskLevel(40)).toBe('medium');
      expect(getRiskLevel(41)).toBe('high');
      expect(getRiskLevel(100)).toBe('high');
    });
  });

  describe('Real-world Scenario Tests', () => {
    test('Login should have lower risk than Checkout when test coverage is significantly worse', () => {
      const loginBugs = Array(6).fill(null).map((_, i) => createMockBug('low', `login-${i}`));
      const checkoutBugs = [
        createMockBug('medium', 'checkout-1'),
        createMockBug('medium', 'checkout-2'),
        createMockBug('high', 'checkout-3'),
        createMockBug('low', 'checkout-4'),
        createMockBug('medium', 'checkout-5'),
      ];
      
      const loginScore = calculateRiskScore(loginBugs, 1, 4);   // Poor test coverage
      const checkoutScore = calculateRiskScore(checkoutBugs, 3, 3); // Better test coverage
      
      console.log('Comparison:', {
        loginScore,
        checkoutScore,
        loginShouldBeLower: loginScore < checkoutScore
      });
      
      // This test documents the current behavior - if we want Login to be higher risk,
      // we need to adjust the formula
      expect(loginScore).toBeLessThan(checkoutScore);
    });
  });
});
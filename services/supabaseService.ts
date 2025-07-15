/**
 * Supabase integration service for product documentation and bug reports
 */

export interface ProductDocumentation {
  id: string;
  product: string;
  section: string;
  feature: string;
  title: string;
  description: string;
  documentation: string;
  lastUpdated: string;
  tags: string[];
}

export interface BugReport {
  id: string;
  product: string;
  section: string;
  feature: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'in-progress' | 'resolved' | 'closed';
  assignee?: string;
  createdAt: string;
  updatedAt: string;
  tags: string[];
}

export interface SupabaseService {
  /**
   * Search for product documentation using vector similarity
   */
  searchProductDocs(query: string, product?: string, section?: string, feature?: string): Promise<ProductDocumentation[]>;
  
  /**
   * Get product documentation by hierarchy
   */
  getProductDocs(product: string, section?: string, feature?: string): Promise<ProductDocumentation[]>;
  
  /**
   * Search for bug reports using vector similarity
   */
  searchBugReports(query: string, product?: string, section?: string, feature?: string): Promise<BugReport[]>;
  
  /**
   * Get bug reports by hierarchy
   */
  getBugReports(product: string, section?: string, feature?: string): Promise<BugReport[]>;
  
  /**
   * Get bug count for a specific feature/section/product
   */
  getBugCount(product: string, section?: string, feature?: string): Promise<number>;
  
  /**
   * Add or update product documentation
   */
  upsertProductDoc(doc: Omit<ProductDocumentation, 'id' | 'lastUpdated'>): Promise<ProductDocumentation>;
  
  /**
   * Add or update bug report
   */
  upsertBugReport(bug: Omit<BugReport, 'id' | 'createdAt' | 'updatedAt'>): Promise<BugReport>;
}

// Mock implementation for development
export class MockSupabaseService implements SupabaseService {
  private mockDocs: ProductDocumentation[] = [
    {
      id: '1',
      product: 'authentication',
      section: 'login',
      feature: 'phone-login',
      title: 'Phone Login Implementation',
      description: 'Phone-based authentication flow',
      documentation: 'Detailed implementation guide for phone login...',
      lastUpdated: '2025-07-15T10:30:00Z',
      tags: ['authentication', 'mobile', 'security']
    }
  ];

  private mockBugs: BugReport[] = [
    {
      id: '1',
      product: 'ordering-system',
      section: 'catalog',
      feature: 'product-browsing',
      title: 'Product images not loading',
      description: 'Product images fail to load on slow connections',
      severity: 'medium',
      status: 'open',
      assignee: 'dev-team',
      createdAt: '2025-07-10T09:00:00Z',
      updatedAt: '2025-07-10T09:00:00Z',
      tags: ['ui', 'performance']
    }
  ];

  async searchProductDocs(query: string, product?: string, section?: string, feature?: string): Promise<ProductDocumentation[]> {
    return this.mockDocs.filter(doc => 
      (!product || doc.product === product) &&
      (!section || doc.section === section) &&
      (!feature || doc.feature === feature)
    );
  }

  async getProductDocs(product: string, section?: string, feature?: string): Promise<ProductDocumentation[]> {
    return this.mockDocs.filter(doc => 
      doc.product === product &&
      (!section || doc.section === section) &&
      (!feature || doc.feature === feature)
    );
  }

  async searchBugReports(query: string, product?: string, section?: string, feature?: string): Promise<BugReport[]> {
    return this.mockBugs.filter(bug => 
      (!product || bug.product === product) &&
      (!section || bug.section === section) &&
      (!feature || bug.feature === feature)
    );
  }

  async getBugReports(product: string, section?: string, feature?: string): Promise<BugReport[]> {
    return this.mockBugs.filter(bug => 
      bug.product === product &&
      (!section || bug.section === section) &&
      (!feature || bug.feature === feature)
    );
  }

  async getBugCount(product: string, section?: string, feature?: string): Promise<number> {
    const bugs = await this.getBugReports(product, section, feature);
    return bugs.filter(bug => bug.status === 'open' || bug.status === 'in-progress').length;
  }

  async upsertProductDoc(doc: Omit<ProductDocumentation, 'id' | 'lastUpdated'>): Promise<ProductDocumentation> {
    const newDoc: ProductDocumentation = {
      ...doc,
      id: Math.random().toString(36).substr(2, 9),
      lastUpdated: new Date().toISOString()
    };
    this.mockDocs.push(newDoc);
    return newDoc;
  }

  async upsertBugReport(bug: Omit<BugReport, 'id' | 'createdAt' | 'updatedAt'>): Promise<BugReport> {
    const newBug: BugReport = {
      ...bug,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.mockBugs.push(newBug);
    return newBug;
  }
}
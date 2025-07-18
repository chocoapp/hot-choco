/**
 * Supabase integration service for product documentation and bug reports
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Your Supabase table metadata structure
export interface SupabaseMetadata {
  loc?: {
    lines: {
      to: number;
      from: number;
    };
  };
  date?: string;
  team?: string;
  source?: string;
  status?: string;
  feature?: string;
  product?: string;
  section?: string;
  blobType?: string;
  issueType?: string;
  sourceType: 'docs' | 'bug';
  statusCategory?: string;
}

// Your Supabase table row structure
export interface SupabaseRow {
  id: string;
  content: string;
  embedding: number[];
  metadata: SupabaseMetadata;
  created_at?: string;
  updated_at?: string;
}

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
  source?: string;
  team?: string;
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
  source?: string;
  team?: string;
  issueType?: string;
  statusCategory?: string;
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
   * Get bug reports by hierarchy and status category
   */
  getBugReportsByStatus(product: string, statusCategory: 'open' | 'closed', section?: string, feature?: string): Promise<BugReport[]>;
  
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

// Real Supabase implementation
export class RealSupabaseService implements SupabaseService {
  private supabase: SupabaseClient;
  private tableName: string;

  constructor(supabaseUrl: string, supabaseKey: string, tableName: string = 'documents') {
    this.supabase = createClient(supabaseUrl, supabaseKey);
    this.tableName = tableName;
  }

  private convertRowToProductDoc(row: SupabaseRow): ProductDocumentation {
    const metadata = row.metadata;
    return {
      id: row.id,
      product: metadata.product || 'unknown',
      section: metadata.section || 'unknown',
      feature: metadata.feature || 'unknown',
      title: metadata.source || 'Untitled Document',
      description: row.content.substring(0, 200) + '...',
      documentation: row.content,
      lastUpdated: metadata.date || row.updated_at || row.created_at || new Date().toISOString(),
      tags: [metadata.team, metadata.blobType].filter(Boolean) as string[],
      source: metadata.source,
      team: metadata.team
    };
  }

  private convertRowToBugReport(row: SupabaseRow): BugReport {
    const metadata = row.metadata;
    return {
      id: row.id,
      product: metadata.product || 'unknown',
      section: metadata.section || 'unknown',
      feature: metadata.feature || 'unknown',
      title: metadata.source || 'Untitled Bug',
      description: row.content,
      severity: this.mapIssueTypeToSeverity(metadata.issueType),
      status: this.mapStatusToStandardStatus(metadata.status),
      createdAt: metadata.date || row.created_at || new Date().toISOString(),
      updatedAt: row.updated_at || row.created_at || new Date().toISOString(),
      tags: [metadata.team, metadata.issueType].filter(Boolean) as string[],
      source: metadata.source,
      team: metadata.team,
      issueType: metadata.issueType,
      statusCategory: metadata.statusCategory
    };
  }

  private mapIssueTypeToSeverity(issueType?: string): 'low' | 'medium' | 'high' | 'critical' {
    switch (issueType?.toLowerCase()) {
      case 'security':
      case 'critical':
        return 'critical';
      case 'bug':
      case 'high':
        return 'high';
      case 'medium':
        return 'medium';
      default:
        return 'low';
    }
  }

  private mapStatusToStandardStatus(status?: string): 'open' | 'in-progress' | 'resolved' | 'closed' {
    switch (status?.toLowerCase()) {
      case 'open':
      case 'new':
        return 'open';
      case 'in progress':
      case 'in-progress':
      case 'working':
        return 'in-progress';
      case 'resolved':
      case 'fixed':
        return 'resolved';
      case 'closed':
      case 'not a bug':
      case 'done':
        return 'closed';
      default:
        return 'open';
    }
  }

  async searchProductDocs(query: string, product?: string, section?: string, feature?: string): Promise<ProductDocumentation[]> {
    try {
      let queryBuilder = this.supabase
        .from(this.tableName)
        .select('*')
        .eq('metadata->>sourceType', 'docs');

      if (product) {
        queryBuilder = queryBuilder.eq('metadata->>product', product);
      }
      if (section) {
        queryBuilder = queryBuilder.eq('metadata->>section', section);
      }
      if (feature) {
        queryBuilder = queryBuilder.eq('metadata->>feature', feature);
      }

      // Add text search on content
      if (query) {
        queryBuilder = queryBuilder.textSearch('content', query);
      }

      const { data, error } = await queryBuilder;

      if (error) {
        console.error('Error searching product docs:', error);
        return [];
      }

      return (data as SupabaseRow[]).map(row => this.convertRowToProductDoc(row));
    } catch (error) {
      console.error('Error in searchProductDocs:', error);
      return [];
    }
  }

  async getProductDocs(product: string, section?: string, feature?: string): Promise<ProductDocumentation[]> {
    try {
      console.log('getProductDocs called with:', { product, section, feature });
      console.log('Using table:', this.tableName);
      
      let queryBuilder = this.supabase
        .from(this.tableName)
        .select('*')
        .eq('metadata->>sourceType', 'docs')
        .eq('metadata->>product', product);

      if (section) {
        queryBuilder = queryBuilder.eq('metadata->>section', section);
      }
      if (feature) {
        queryBuilder = queryBuilder.eq('metadata->>feature', feature);
      }

      const { data, error } = await queryBuilder;
      
      console.log('getProductDocs query result:', { 
        product, 
        section, 
        feature, 
        resultCount: data?.length || 0,
        error: error?.message,
        sampleData: data?.slice(0, 1)
      });

      if (error) {
        console.error('Error getting product docs:', error);
        return [];
      }

      const results = (data as SupabaseRow[]).map(row => this.convertRowToProductDoc(row));
      console.log('getProductDocs converted results:', results.length);
      return results;
    } catch (error) {
      console.error('Error in getProductDocs:', error);
      return [];
    }
  }

  async searchBugReports(query: string, product?: string, section?: string, feature?: string): Promise<BugReport[]> {
    try {
      let queryBuilder = this.supabase
        .from(this.tableName)
        .select('*')
        .eq('metadata->>sourceType', 'bug');

      if (product) {
        queryBuilder = queryBuilder.eq('metadata->>product', product);
      }
      if (section) {
        queryBuilder = queryBuilder.eq('metadata->>section', section);
      }
      if (feature) {
        queryBuilder = queryBuilder.eq('metadata->>feature', feature);
      }

      // Add text search on content
      if (query) {
        queryBuilder = queryBuilder.textSearch('content', query);
      }

      const { data, error } = await queryBuilder;

      if (error) {
        console.error('Error searching bug reports:', error);
        return [];
      }

      return (data as SupabaseRow[]).map(row => this.convertRowToBugReport(row));
    } catch (error) {
      console.error('Error in searchBugReports:', error);
      return [];
    }
  }

  async getBugReports(product: string, section?: string, feature?: string): Promise<BugReport[]> {
    try {
      console.log('getBugReports called with:', { product, section, feature });
      console.log('Using table:', this.tableName);
      console.log('Service instance:', this.constructor.name);
      
      let queryBuilder = this.supabase
        .from(this.tableName)
        .select('*')
        .eq('metadata->>sourceType', 'bug')
        .eq('metadata->>product', product);

      if (section) {
        queryBuilder = queryBuilder.eq('metadata->>section', section);
      }
      if (feature) {
        queryBuilder = queryBuilder.eq('metadata->>feature', feature);
      }

      const { data, error } = await queryBuilder;
      
      console.log('getBugReports query result:', { 
        product, 
        section, 
        feature, 
        resultCount: data?.length || 0,
        error: error?.message,
        sampleData: data?.slice(0, 1)
      });

      if (error) {
        console.error('Error getting bug reports:', error);
        return [];
      }

      const results = (data as SupabaseRow[]).map(row => this.convertRowToBugReport(row));
      console.log('getBugReports converted results:', results.length);
      return results;
    } catch (error) {
      console.error('Error in getBugReports:', error);
      return [];
    }
  }

  async getBugReportsByStatus(product: string, statusCategory: 'open' | 'closed', section?: string, feature?: string): Promise<BugReport[]> {
    try {
      console.log('getBugReportsByStatus called with:', { product, statusCategory, section, feature });
      console.log('Using table:', this.tableName);
      
      // Simple query: just filter by statusCategory and feature (feature should be unique enough)
      let queryBuilder = this.supabase
        .from(this.tableName)
        .select('*')
        .eq('metadata->>sourceType', 'bug')
        .eq('metadata->>statusCategory', statusCategory);

      if (feature) {
        queryBuilder = queryBuilder.eq('metadata->>feature', feature);
        console.log('Filtering by feature:', feature);
      }

      console.log('About to execute simplified query...');
      const { data, error } = await queryBuilder;
      
      console.log('getBugReportsByStatus query result:', { 
        statusCategory,
        feature,
        resultCount: data?.length || 0,
        error: error?.message,
        sampleData: data?.slice(0, 3)
      });

      if (error) {
        console.error('Error getting bug reports by status:', error);
        return [];
      }

      const results = (data as SupabaseRow[]).map(row => this.convertRowToBugReport(row));
      console.log('getBugReportsByStatus final results:', results.length, results);
      return results;
    } catch (error) {
      console.error('Error in getBugReportsByStatus:', error);
      return [];
    }
  }

  async getBugCount(product: string, section?: string, feature?: string): Promise<number> {
    try {
      let queryBuilder = this.supabase
        .from(this.tableName)
        .select('id', { count: 'exact' })
        .eq('metadata->>sourceType', 'bug')
        .eq('metadata->>product', product)
        .in('metadata->>statusCategory', ['open', 'new']); // Only count open bugs

      if (section) {
        queryBuilder = queryBuilder.eq('metadata->>section', section);
      }
      if (feature) {
        queryBuilder = queryBuilder.eq('metadata->>feature', feature);
      }

      const { count, error } = await queryBuilder;

      if (error) {
        console.error('Error getting bug count:', error);
        return 0;
      }

      return count || 0;
    } catch (error) {
      console.error('Error in getBugCount:', error);
      return 0;
    }
  }

  async upsertProductDoc(doc: Omit<ProductDocumentation, 'id' | 'lastUpdated'>): Promise<ProductDocumentation> {
    try {
      const row: Partial<SupabaseRow> = {
        content: doc.documentation,
        metadata: {
          sourceType: 'docs',
          product: doc.product,
          section: doc.section,
          feature: doc.feature,
          source: doc.title,
          team: doc.team,
          date: new Date().toISOString()
        }
      };

      const { data, error } = await this.supabase
        .from(this.tableName)
        .upsert(row)
        .select()
        .single();

      if (error) {
        console.error('Error upserting product doc:', error);
        throw error;
      }

      return this.convertRowToProductDoc(data as SupabaseRow);
    } catch (error) {
      console.error('Error in upsertProductDoc:', error);
      throw error;
    }
  }

  async upsertBugReport(bug: Omit<BugReport, 'id' | 'createdAt' | 'updatedAt'>): Promise<BugReport> {
    try {
      const row: Partial<SupabaseRow> = {
        content: bug.description,
        metadata: {
          sourceType: 'bug',
          product: bug.product,
          section: bug.section,
          feature: bug.feature,
          source: bug.title,
          team: bug.team,
          status: bug.status,
          issueType: bug.issueType,
          statusCategory: bug.statusCategory,
          date: new Date().toISOString()
        }
      };

      const { data, error } = await this.supabase
        .from(this.tableName)
        .upsert(row)
        .select()
        .single();

      if (error) {
        console.error('Error upserting bug report:', error);
        throw error;
      }

      return this.convertRowToBugReport(data as SupabaseRow);
    } catch (error) {
      console.error('Error in upsertBugReport:', error);
      throw error;
    }
  }

  // Vector similarity search using embeddings
  async searchSimilarContent(query: string, embedding: number[], sourceType: 'docs' | 'bug', limit: number = 10): Promise<SupabaseRow[]> {
    try {
      const { data, error } = await this.supabase.rpc('match_documents', {
        query_embedding: embedding,
        match_threshold: 0.7,
        match_count: limit,
        source_type: sourceType
      });

      if (error) {
        console.error('Error in vector similarity search:', error);
        return [];
      }

      return data as SupabaseRow[];
    } catch (error) {
      console.error('Error in searchSimilarContent:', error);
      return [];
    }
  }
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
      product: 'product_ecommerce',
      section: 'section_account_team_management',
      feature: 'feature_user_login',
      title: 'BYR-1628',
      description: 'Login timeout issue on slow connections',
      severity: 'medium',
      status: 'open',
      assignee: 'dev-team',
      createdAt: '2025-07-10T09:00:00Z',
      updatedAt: '2025-07-10T09:00:00Z',
      tags: ['ui', 'performance'],
      source: 'BYR-1628',
      team: 'BUYER',
      issueType: 'functionality',
      statusCategory: 'open'
    },
    {
      id: '2',
      product: 'product_ecommerce',
      section: 'section_order_guide_management',
      feature: 'feature_order_guide',
      title: 'BYR-1629',
      description: 'Order guide filters not working correctly',
      severity: 'high',
      status: 'in-progress',
      assignee: 'dev-team',
      createdAt: '2025-07-08T14:00:00Z',
      updatedAt: '2025-07-15T10:00:00Z',
      tags: ['bug', 'critical'],
      source: 'BYR-1629',
      team: 'BUYER',
      issueType: 'bug',
      statusCategory: 'open'
    },
    {
      id: '3',
      product: 'product_ecommerce',
      section: 'section_order_guide_management',
      feature: 'feature_order_guide',
      title: 'BYR-1630',
      description: 'Fixed pagination in order guide',
      severity: 'medium',
      status: 'closed',
      assignee: 'dev-team',
      createdAt: '2025-07-05T10:00:00Z',
      updatedAt: '2025-07-12T16:00:00Z',
      tags: ['bug', 'fixed'],
      source: 'BYR-1630',
      team: 'BUYER',
      issueType: 'bug',
      statusCategory: 'closed'
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

  async getBugReportsByStatus(product: string, statusCategory: 'open' | 'closed', section?: string, feature?: string): Promise<BugReport[]> {
    return this.mockBugs.filter(bug => 
      bug.product === product &&
      (!section || bug.section === section) &&
      (!feature || bug.feature === feature) &&
      bug.statusCategory === statusCategory
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

// Default implementation - use RealSupabaseService for production
export class SupabaseServiceImpl extends RealSupabaseService {
  constructor() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://default-url.supabase.co';
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    super(supabaseUrl, supabaseKey);
  }
}
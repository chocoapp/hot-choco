/**
 * Supabase client configuration and service factory
 */

import { RealSupabaseService, MockSupabaseService, SupabaseService } from '../services/supabaseService';

// Factory function to create the appropriate Supabase service
export function createSupabaseService(): SupabaseService {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const tableName = process.env.SUPABASE_TABLE_NAME || 'documents';

  // Use real service if environment variables are configured
  if (supabaseUrl && supabaseKey) {
    console.log('Using real Supabase service');
    return new RealSupabaseService(supabaseUrl, supabaseKey, tableName);
  }

  // Fall back to mock service for development
  console.log('Using mock Supabase service');
  return new MockSupabaseService();
}

// Export singleton instance
export const supabaseService = createSupabaseService();
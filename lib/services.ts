/**
 * Service factory for creating all application services
 */

import { supabaseService } from './supabase';
import { RealAllureService } from '../services/allureService';
import { QualityServiceImpl } from '../services/qualityService';

// Factory function to create the appropriate Allure service
function createAllureService() {
  // Use real service if we have access to the TestOps API
  // For now, we'll use the real service by default
  return new RealAllureService();
}

// Create service instances
const allureService = createAllureService();
const qualityService = new QualityServiceImpl(supabaseService, allureService);

// Export all services
export { supabaseService, allureService, qualityService };
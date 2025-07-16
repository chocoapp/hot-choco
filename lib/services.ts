/**
 * Service factory for creating all application services
 */

import { supabaseService } from './supabase';
import { MockAllureService } from '../services/allureService';
import { QualityServiceImpl } from '../services/qualityService';

// Create service instances
const allureService = new MockAllureService();
const qualityService = new QualityServiceImpl(supabaseService, allureService);

// Export all services
export { supabaseService, allureService, qualityService };
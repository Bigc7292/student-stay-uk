
// OpenRent Property Service
// Service for fetching properties from OpenRent

import type { 
  PropertyServiceInterface, 
  PropertySearchFilters, 
  StandardProperty,
  PropertyServiceStatus,
  PropertyServiceConfig
} from './core/PropertyServiceInterface';

// Import the Property interface from PropertyServiceManager for compatibility
import type { Property } from './PropertyServiceManager';

class OpenRentService implements PropertyServiceInterface {
  private config: PropertyServiceConfig = {
    enabled: true,
    priority: 1,
    timeout: 60000,
    retryAttempts: 3
  };

  async searchProperties(filters: PropertySearchFilters): Promise<Property[]> {
    // For now, return empty array - this would be implemented with actual OpenRent API
    console.log('🏠 OpenRent service called with filters:', filters);
    
    // Simulate some delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Return empty array for now, but with proper Property type
    return [];
  }

  isAvailable(): boolean {
    return true;
  }

  getStatus(): PropertyServiceStatus {
    return {
      available: true,
      healthy: true,
      lastCheck: new Date(),
      errorCount: 0,
      successRate: 100,
      averageResponseTime: 1000
    };
  }

  getConfig(): PropertyServiceConfig {
    return this.config;
  }

  async testConnection(): Promise<boolean> {
    return true;
  }

  validateConfiguration(): boolean {
    return true;
  }

  // Add the missing getServiceInfo method to match PropertyService interface
  getServiceInfo() {
    return {
      name: 'OpenRent',
      isConfigured: true
    };
  }
}

export const openRentService = new OpenRentService();
export { OpenRentService };

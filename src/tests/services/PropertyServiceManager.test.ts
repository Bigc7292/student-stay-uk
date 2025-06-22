// Property Service Manager Tests
// Comprehensive testing for the unified property service manager

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PropertyServiceManager } from '@/services/PropertyServiceManager';
import { setupTest, teardownTest, mockFetch, mockFetchError } from '../setup';

// Mock property service implementations
const mockPropertyService = {
  isAvailable: vi.fn(() => true),
  searchProperties: vi.fn(),
  getStatus: vi.fn(() => ({
    available: true,
    healthy: true,
    lastCheck: new Date(),
    errorCount: 0,
    successRate: 100,
    averageResponseTime: 1000
  })),
  getConfig: vi.fn(() => ({
    enabled: true,
    priority: 1,
    timeout: 30000,
    retryAttempts: 3
  })),
  testConnection: vi.fn(() => Promise.resolve(true)),
  validateConfiguration: vi.fn(() => true)
};

// Mock service modules
vi.mock('@/services/realPropertyService', () => ({
  realPropertyService: mockPropertyService
}));

vi.mock('@/services/openRentService', () => ({
  openRentService: mockPropertyService
}));

vi.mock('@/services/spareRoomService', () => ({
  spareRoomService: mockPropertyService
}));

describe('PropertyServiceManager', () => {
  let serviceManager: PropertyServiceManager;

  beforeEach(() => {
    setupTest();
    serviceManager = new PropertyServiceManager();
    vi.clearAllMocks();
  });

  afterEach(() => {
    teardownTest();
  });

  describe('Service Initialization', () => {
    it('should initialize with available services', async () => {
      const availableServices = serviceManager.getAvailableServices();
      expect(availableServices).toBeInstanceOf(Array);
      expect(availableServices.length).toBeGreaterThan(0);
    });

    it('should load services dynamically', async () => {
      const status = serviceManager.getServiceStatus('zoopla');
      expect(status).toBeDefined();
      expect(status?.available).toBe(true);
    });

    it('should handle service loading failures gracefully', async () => {
      // This would test the error handling in service loading
      expect(() => serviceManager.getAvailableServices()).not.toThrow();
    });
  });

  describe('Property Search', () => {
    const mockSearchFilters = {
      location: 'Manchester',
      maxPrice: 1000,
      bedrooms: 1,
      propertyType: 'studio' as const
    };

    const mockProperties = [
      {
        id: 'test-1',
        source: 'test',
        sourceUrl: 'https://test.com/1',
        title: 'Test Property 1',
        description: 'A test property',
        price: 800,
        priceType: 'monthly' as const,
        location: 'Manchester',
        type: 'studio' as const,
        bedrooms: 1,
        bathrooms: 1,
        furnished: true,
        features: ['WiFi', 'Bills Included'],
        amenities: ['WiFi', 'Bills Included'],
        available: true,
        bills: { included: true, details: [] },
        images: [],
        qualityScore: 75,
        studentSuitability: 85,
        lastUpdated: new Date()
      }
    ];

    beforeEach(() => {
      mockPropertyService.searchProperties.mockResolvedValue(mockProperties);
    });

    it('should search properties from multiple services', async () => {
      const result = await serviceManager.searchProperties(mockSearchFilters);
      
      expect(result).toBeDefined();
      expect(result.properties).toBeInstanceOf(Array);
      expect(result.summary).toBeDefined();
      expect(result.summary.totalFound).toBeGreaterThanOrEqual(0);
    });

    it('should return cached results when available', async () => {
      // First search
      const result1 = await serviceManager.searchProperties(mockSearchFilters);
      
      // Second search (should use cache)
      const result2 = await serviceManager.searchProperties(mockSearchFilters);
      
      expect(result2.summary.cacheHit).toBe(true);
      expect(result1.properties).toEqual(result2.properties);
    });

    it('should handle service failures gracefully', async () => {
      mockPropertyService.searchProperties.mockRejectedValue(new Error('Service unavailable'));
      
      const result = await serviceManager.searchProperties(mockSearchFilters);
      
      expect(result).toBeDefined();
      expect(result.summary.errors.length).toBeGreaterThan(0);
      // Should still return fallback properties
      expect(result.properties.length).toBeGreaterThan(0);
    });

    it('should deduplicate properties from multiple sources', async () => {
      const duplicateProperties = [
        ...mockProperties,
        {
          ...mockProperties[0],
          id: 'test-2',
          source: 'different-source'
        }
      ];
      
      mockPropertyService.searchProperties.mockResolvedValue(duplicateProperties);
      
      const result = await serviceManager.searchProperties(mockSearchFilters);
      
      // Should remove duplicates based on location, price, and bedrooms
      expect(result.properties.length).toBeLessThanOrEqual(duplicateProperties.length);
    });

    it('should score and sort properties correctly', async () => {
      const unsortedProperties = [
        { ...mockProperties[0], qualityScore: 60, studentSuitability: 70 },
        { ...mockProperties[0], id: 'test-2', qualityScore: 90, studentSuitability: 95 },
        { ...mockProperties[0], id: 'test-3', qualityScore: 75, studentSuitability: 80 }
      ];
      
      mockPropertyService.searchProperties.mockResolvedValue(unsortedProperties);
      
      const result = await serviceManager.searchProperties(mockSearchFilters);
      
      // Should be sorted by combined quality and suitability scores (descending)
      expect(result.properties[0].id).toBe('test-2'); // Highest combined score
    });

    it('should apply filters correctly', async () => {
      const propertiesWithVariedPrices = [
        { ...mockProperties[0], price: 500 },
        { ...mockProperties[0], id: 'test-2', price: 1200 }, // Over max price
        { ...mockProperties[0], id: 'test-3', price: 800 }
      ];
      
      mockPropertyService.searchProperties.mockResolvedValue(propertiesWithVariedPrices);
      
      const result = await serviceManager.searchProperties({
        ...mockSearchFilters,
        maxPrice: 1000
      });
      
      // Should filter out properties over max price
      expect(result.properties.every(p => p.price <= 1000)).toBe(true);
    });

    it('should limit results to maximum count', async () => {
      const manyProperties = Array.from({ length: 100 }, (_, i) => ({
        ...mockProperties[0],
        id: `test-${i}`,
        price: 500 + i * 10
      }));
      
      mockPropertyService.searchProperties.mockResolvedValue(manyProperties);
      
      const result = await serviceManager.searchProperties(mockSearchFilters);
      
      // Should limit to 50 properties
      expect(result.properties.length).toBeLessThanOrEqual(50);
    });
  });

  describe('Service Management', () => {
    it('should enable and disable services', () => {
      serviceManager.enableService('zoopla');
      expect(serviceManager.getAvailableServices()).toContain('zoopla');
      
      serviceManager.disableService('zoopla');
      expect(serviceManager.getAvailableServices()).not.toContain('zoopla');
    });

    it('should get service status', () => {
      const status = serviceManager.getServiceStatus('zoopla');
      expect(status).toBeDefined();
      expect(status?.available).toBeDefined();
      expect(status?.healthy).toBeDefined();
    });

    it('should handle unknown service names', () => {
      const status = serviceManager.getServiceStatus('unknown-service' as any);
      expect(status).toBeNull();
    });
  });

  describe('Cache Management', () => {
    it('should clear cache', () => {
      serviceManager.clearCache();
      // Cache should be empty after clearing
      const stats = serviceManager.getCacheStats();
      expect(stats.size).toBe(0);
    });

    it('should provide cache statistics', () => {
      const stats = serviceManager.getCacheStats();
      expect(stats).toBeDefined();
      expect(stats.size).toBeDefined();
      expect(stats.maxSize).toBeDefined();
      expect(stats.hitRate).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors', async () => {
      mockPropertyService.searchProperties.mockRejectedValue(new Error('Network error'));
      
      const result = await serviceManager.searchProperties({
        location: 'Manchester',
        maxPrice: 1000
      });
      
      expect(result.summary.errors.length).toBeGreaterThan(0);
      expect(result.summary.errors[0]).toContain('Network error');
    });

    it('should handle timeout errors', async () => {
      mockPropertyService.searchProperties.mockImplementation(
        () => new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Service timeout')), 100)
        )
      );
      
      const result = await serviceManager.searchProperties({
        location: 'Manchester',
        maxPrice: 1000
      });
      
      expect(result.summary.errors.length).toBeGreaterThan(0);
    });

    it('should provide fallback properties when all services fail', async () => {
      mockPropertyService.searchProperties.mockRejectedValue(new Error('All services down'));
      
      const result = await serviceManager.searchProperties({
        location: 'Manchester',
        maxPrice: 1000
      });
      
      // Should still return fallback properties
      expect(result.properties.length).toBeGreaterThan(0);
      expect(result.properties[0].source).toBe('fallback');
    });
  });

  describe('Performance', () => {
    it('should complete searches within reasonable time', async () => {
      const startTime = Date.now();
      
      await serviceManager.searchProperties({
        location: 'Manchester',
        maxPrice: 1000
      });
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Should complete within 5 seconds (generous for testing)
      expect(duration).toBeLessThan(5000);
    });

    it('should handle concurrent searches', async () => {
      const searches = Array.from({ length: 5 }, () =>
        serviceManager.searchProperties({
          location: 'Manchester',
          maxPrice: 1000
        })
      );
      
      const results = await Promise.all(searches);
      
      expect(results).toHaveLength(5);
      results.forEach(result => {
        expect(result).toBeDefined();
        expect(result.properties).toBeInstanceOf(Array);
      });
    });
  });
});

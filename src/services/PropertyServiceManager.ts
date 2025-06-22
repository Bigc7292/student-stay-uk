// Unified Property Service Manager
// Clean, efficient management of all property data sources

import type {
  PropertySearchFilters,
  StandardProperty,
  PropertyServiceInterface,
  PropertyServiceStatus
} from './core/PropertyServiceInterface';

interface ServiceInstance {
  service: PropertyServiceInterface;
  config: {
    enabled: boolean;
    priority: number;
    timeout: number;
    retryAttempts: number;
    lastUsed?: Date;
    errorCount: number;
    successCount: number;
  };
}

class PropertyServiceManager {
  private services = new Map<string, ServiceInstance>();
  private cache = new Map<string, { data: StandardProperty[]; timestamp: number; ttl: number }>();
  private readonly defaultTimeout = 30000; // 30 seconds
  private readonly cacheDefaultTTL = 5 * 60 * 1000; // 5 minutes

  constructor() {
    this.initializeServices();
  }

  // Initialize all available services
  private async initializeServices(): Promise<void> {
    const serviceConfigs = [
      { name: 'zoopla', priority: 1, timeout: 15000 },
      { name: 'openrent', priority: 1, timeout: 60000 },
      { name: 'spareroom', priority: 2, timeout: 30000 },
      { name: 'rightmove', priority: 2, timeout: 30000 },
      { name: 'gumtree', priority: 3, timeout: 45000 },
      { name: 'onthemarket', priority: 3, timeout: 30000 },
      { name: 'zooplacheerio', priority: 4, timeout: 45000 }
    ];

    for (const config of serviceConfigs) {
      try {
        await this.loadService(config.name, config.priority, config.timeout);
      } catch (error) {
        console.warn(`⚠️ Failed to load ${config.name} service:`, error);
      }
    }

    console.log(`🏠 Loaded ${this.services.size} property services`);
  }

  // Dynamically load a service
  private async loadService(name: string, priority: number, timeout: number): Promise<void> {
    try {
      let service: PropertyServiceInterface | null = null;

      switch (name) {
        case 'zoopla':
          const { realPropertyService } = await import('./realPropertyService');
          service = realPropertyService;
          break;
        case 'openrent':
          const { openRentService } = await import('./openRentService');
          service = openRentService;
          break;
        case 'spareroom':
          const { spareRoomService } = await import('./spareRoomService');
          service = spareRoomService;
          break;
        case 'rightmove':
          const { rightmoveService } = await import('./rightmoveService');
          service = rightmoveService;
          break;
        case 'gumtree':
          const { gumtreeService } = await import('./gumtreeService');
          service = gumtreeService;
          break;
        case 'onthemarket':
          const { onTheMarketService } = await import('./onTheMarketService');
          service = onTheMarketService;
          break;
        case 'zooplacheerio':
          const { zooplaCheerioService } = await import('./zooplaCheerioService');
          service = zooplaCheerioService;
          break;
      }

      if (service && typeof service.isAvailable === 'function') {
        this.services.set(name, {
          service,
          config: {
            enabled: service.isAvailable(),
            priority,
            timeout,
            retryAttempts: 3,
            errorCount: 0,
            successCount: 0
          }
        });
      }
    } catch (error) {
      console.warn(`Failed to load ${name} service:`, error);
    }
  }

  // Main search method with intelligent service selection
  async searchProperties(filters: PropertySearchFilters): Promise<{
    properties: StandardProperty[];
    summary: {
      totalFound: number;
      sourceBreakdown: Record<string, number>;
      searchTime: number;
      errors: string[];
      cacheHit: boolean;
    };
  }> {
    const startTime = performance.now();
    const cacheKey = this.generateCacheKey(filters);

    // Check cache first
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      return {
        properties: cached,
        summary: {
          totalFound: cached.length,
          sourceBreakdown: { cache: cached.length },
          searchTime: performance.now() - startTime,
          errors: [],
          cacheHit: true
        }
      };
    }

    // Get available services sorted by priority and health
    const availableServices = this.getHealthyServices();
    
    if (availableServices.length === 0) {
      return {
        properties: this.getFallbackProperties(filters),
        summary: {
          totalFound: 3,
          sourceBreakdown: { fallback: 3 },
          searchTime: performance.now() - startTime,
          errors: ['No services available'],
          cacheHit: false
        }
      };
    }

    const results: StandardProperty[] = [];
    const sourceBreakdown: Record<string, number> = {};
    const errors: string[] = [];

    // Search services in priority order with parallel execution within priority groups
    const priorityGroups = this.groupServicesByPriority(availableServices);
    
    for (const group of priorityGroups) {
      const groupResults = await Promise.allSettled(
        group.map(([name, instance]) => this.searchSingleService(name, instance, filters))
      );

      groupResults.forEach((result, index) => {
        const [serviceName] = group[index];
        
        if (result.status === 'fulfilled') {
          const properties = result.value;
          results.push(...properties);
          sourceBreakdown[serviceName] = properties.length;
          this.updateServiceMetrics(serviceName, true);
        } else {
          errors.push(`${serviceName}: ${result.reason.message}`);
          sourceBreakdown[serviceName] = 0;
          this.updateServiceMetrics(serviceName, false);
        }
      });

      // Stop if we have enough results from higher priority services
      if (results.length >= 30) break;
    }

    // Process and optimize results
    const processedProperties = this.processResults(results, filters);
    
    // Cache the results
    this.setCache(cacheKey, processedProperties);

    const searchTime = performance.now() - startTime;

    return {
      properties: processedProperties,
      summary: {
        totalFound: processedProperties.length,
        sourceBreakdown,
        searchTime,
        errors,
        cacheHit: false
      }
    };
  }

  // Search a single service with timeout and error handling
  private async searchSingleService(
    name: string,
    instance: ServiceInstance,
    filters: PropertySearchFilters
  ): Promise<StandardProperty[]> {
    const { service, config } = instance;
    
    try {
      const searchPromise = service.searchProperties(filters);
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Service timeout')), config.timeout)
      );

      const result = await Promise.race([searchPromise, timeoutPromise]);
      config.lastUsed = new Date();
      
      return Array.isArray(result) ? result : [];
    } catch (error) {
      throw new Error(`${name} service failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Get healthy services sorted by priority and success rate
  private getHealthyServices(): [string, ServiceInstance][] {
    return Array.from(this.services.entries())
      .filter(([_, instance]) => instance.config.enabled && instance.service.isAvailable())
      .sort(([nameA, instanceA], [nameB, instanceB]) => {
        // Sort by priority first
        const priorityDiff = instanceA.config.priority - instanceB.config.priority;
        if (priorityDiff !== 0) return priorityDiff;
        
        // Then by success rate
        const successRateA = this.calculateSuccessRate(instanceA);
        const successRateB = this.calculateSuccessRate(instanceB);
        return successRateB - successRateA;
      });
  }

  // Group services by priority for batch processing
  private groupServicesByPriority(services: [string, ServiceInstance][]): [string, ServiceInstance][][] {
    const groups: Record<number, [string, ServiceInstance][]> = {};
    
    services.forEach(([name, instance]) => {
      const priority = instance.config.priority;
      if (!groups[priority]) groups[priority] = [];
      groups[priority].push([name, instance]);
    });

    return Object.keys(groups)
      .sort((a, b) => parseInt(a) - parseInt(b))
      .map(priority => groups[parseInt(priority)]);
  }

  // Process and optimize search results
  private processResults(properties: StandardProperty[], filters: PropertySearchFilters): StandardProperty[] {
    // Remove duplicates
    const deduplicated = this.deduplicateProperties(properties);
    
    // Score properties
    const scored = this.scoreProperties(deduplicated, filters);
    
    // Sort by quality and relevance
    const sorted = scored.sort((a, b) => {
      const scoreA = a.qualityScore + a.studentSuitability;
      const scoreB = b.qualityScore + b.studentSuitability;
      return scoreB - scoreA;
    });

    // Apply filters and limit results
    return this.applyFilters(sorted, filters).slice(0, 50);
  }

  // Remove duplicate properties
  private deduplicateProperties(properties: StandardProperty[]): StandardProperty[] {
    const seen = new Set<string>();
    return properties.filter(property => {
      const key = `${property.location.toLowerCase()}-${property.price}-${property.bedrooms}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  // Score properties for quality and student suitability
  private scoreProperties(properties: StandardProperty[], filters: PropertySearchFilters): StandardProperty[] {
    return properties.map(property => {
      property.qualityScore = this.calculateQualityScore(property);
      property.studentSuitability = this.calculateStudentSuitability(property, filters);
      return property;
    });
  }

  // Calculate quality score (0-100)
  private calculateQualityScore(property: StandardProperty): number {
    let score = 50;
    
    if (property.images.length > 0) score += 10;
    if (property.images.length > 3) score += 10;
    if (property.description && property.description.length > 100) score += 10;
    if (property.contact?.verified) score += 15;
    score += Math.min(15, (property.features.length + property.amenities.length) * 2);
    
    return Math.min(100, Math.max(0, score));
  }

  // Calculate student suitability score (0-100)
  private calculateStudentSuitability(property: StandardProperty, filters: PropertySearchFilters): number {
    let score = 50;
    
    if (property.price <= 600) score += 20;
    else if (property.price <= 800) score += 10;
    else if (property.price <= 1000) score += 5;
    
    if (property.bills.included) score += 15;
    if (property.furnished) score += 10;
    
    const studentKeywords = ['university', 'student', 'transport', 'bus', 'train'];
    const hasStudentFeatures = [...property.features, ...property.amenities, property.description]
      .some(text => studentKeywords.some(keyword => text.toLowerCase().includes(keyword)));
    
    if (hasStudentFeatures) score += 15;
    
    return Math.min(100, Math.max(0, score));
  }

  // Apply additional filters
  private applyFilters(properties: StandardProperty[], filters: PropertySearchFilters): StandardProperty[] {
    return properties.filter(property => {
      if (filters.maxPrice && property.price > filters.maxPrice) return false;
      if (filters.minPrice && property.price < filters.minPrice) return false;
      if (filters.bedrooms && property.bedrooms < filters.bedrooms) return false;
      if (filters.furnished !== undefined && property.furnished !== filters.furnished) return false;
      if (filters.billsIncluded !== undefined && property.bills.included !== filters.billsIncluded) return false;
      return true;
    });
  }

  // Cache management
  private generateCacheKey(filters: PropertySearchFilters): string {
    return btoa(JSON.stringify(filters)).replace(/[^a-zA-Z0-9]/g, '');
  }

  private getFromCache(key: string): StandardProperty[] | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      return cached.data;
    }
    this.cache.delete(key);
    return null;
  }

  private setCache(key: string, data: StandardProperty[], ttl: number = this.cacheDefaultTTL): void {
    this.cache.set(key, { data, timestamp: Date.now(), ttl });
    
    // Clean old cache entries
    if (this.cache.size > 50) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }
  }

  // Service management
  private updateServiceMetrics(serviceName: string, success: boolean): void {
    const instance = this.services.get(serviceName);
    if (!instance) return;

    if (success) {
      instance.config.successCount++;
      instance.config.errorCount = Math.max(0, instance.config.errorCount - 1);
    } else {
      instance.config.errorCount++;
    }
  }

  private calculateSuccessRate(instance: ServiceInstance): number {
    const total = instance.config.successCount + instance.config.errorCount;
    return total > 0 ? instance.config.successCount / total : 0.5;
  }

  // Fallback properties for when all services fail
  private getFallbackProperties(filters: PropertySearchFilters): StandardProperty[] {
    const location = filters.location || 'Manchester';
    const maxPrice = filters.maxPrice || 1000;
    
    return [
      {
        id: 'fallback-1',
        source: 'fallback',
        sourceUrl: '#',
        title: `Student Studio in ${location}`,
        description: `Modern studio apartment perfect for students in ${location} city centre.`,
        price: Math.min(650, maxPrice - 50),
        priceType: 'monthly' as const,
        location: `${location} City Centre`,
        postcode: 'M1 1AA',
        type: 'studio' as const,
        bedrooms: 1,
        bathrooms: 1,
        furnished: true,
        features: ['WiFi', 'Bills Included', 'Near University'],
        amenities: ['WiFi', 'Bills Included', 'Near University'],
        available: true,
        bills: { included: true, details: ['All bills included'] },
        images: ['/api/placeholder/400/300'],
        qualityScore: 75,
        studentSuitability: 85,
        lastUpdated: new Date()
      }
    ];
  }

  // Public interface methods
  getAvailableServices(): string[] {
    return Array.from(this.services.keys()).filter(name => 
      this.services.get(name)?.config.enabled
    );
  }

  getServiceStatus(serviceName: string): PropertyServiceStatus | null {
    const instance = this.services.get(serviceName);
    if (!instance) return null;

    return instance.service.getStatus();
  }

  enableService(serviceName: string): void {
    const instance = this.services.get(serviceName);
    if (instance) {
      instance.config.enabled = true;
    }
  }

  disableService(serviceName: string): void {
    const instance = this.services.get(serviceName);
    if (instance) {
      instance.config.enabled = false;
    }
  }

  clearCache(): void {
    this.cache.clear();
  }

  getCacheStats(): { size: number; maxSize: number; hitRate: number } {
    return {
      size: this.cache.size,
      maxSize: 50,
      hitRate: 0 // Would need to track hits vs misses
    };
  }
}

// Export singleton instance
export const propertyServiceManager = new PropertyServiceManager();
export { PropertyServiceManager };

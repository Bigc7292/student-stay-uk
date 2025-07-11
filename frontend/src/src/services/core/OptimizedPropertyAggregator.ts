// Optimized Property Aggregator Service
// Clean, efficient, and maintainable property data aggregation

import type {
    PropertyAggregatorInterface,
    PropertySearchFilters,
    PropertyServiceInterface,
    PropertyServiceMetrics,
    PropertyServiceStatus,
    StandardProperty
} from './PropertyServiceInterface';

interface ServiceRegistry {
  [key: string]: {
    service: PropertyServiceInterface;
    priority: number;
    enabled: boolean;
    metrics: PropertyServiceMetrics;
  };
}

class OptimizedPropertyAggregator implements PropertyAggregatorInterface {
  private services: ServiceRegistry = {};
  private cache = new Map<string, { data: StandardProperty[]; timestamp: number }>();
  private readonly cacheTimeout = 5 * 60 * 1000; // 5 minutes

  constructor() {
    this.initializeServices();
  }

  // Initialize all available services
  private async initializeServices(): Promise<void> {
    try {
      // Service configuration with priorities
      const serviceConfigs = [
        { name: 'zoopla', module: '../realPropertyService', export: 'realPropertyService', priority: 1 },
        { name: 'openrent', module: '../openRentService', export: 'openRentService', priority: 1 },
        { name: 'spareroom', module: '../spareRoomService', export: 'spareRoomService', priority: 2 },
        { name: 'rightmove', module: '../rightmoveService', export: 'rightmoveService', priority: 2 },
        { name: 'gumtree', module: '../gumtreeService', export: 'gumtreeService', priority: 3 },
        { name: 'onthemarket', module: '../onTheMarketService', export: 'onTheMarketService', priority: 3 },
        { name: 'zooplacheerio', module: '../zooplaCheerioService', export: 'zooplaCheerioService', priority: 4 }
      ];

      // Load services dynamically
      for (const config of serviceConfigs) {
        try {
          const module = await import(config.module);
          const service = module[config.export];
          if (service && typeof service.isAvailable === 'function') {
            this.registerService(config.name, service, config.priority);
          }
        } catch (error) {
          console.warn(`⚠️ Failed to load ${config.name} service:`, error);
        }
      }

      console.log(`🏠 Initialized ${Object.keys(this.services).length} property services`);
    } catch (error) {
      console.error('❌ Failed to initialize property services:', error);
    }
  }

  // Register a property service
  private registerService(name: string, service: PropertyServiceInterface, priority: number): void {
    this.services[name] = {
      service,
      priority,
      enabled: service.isAvailable(),
      metrics: {
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        averageResponseTime: 0,
        errorRate: 0
      }
    };
  }

  // Main search method - optimized for performance
  async searchAllSources(filters: PropertySearchFilters): Promise<{
    properties: StandardProperty[];
    summary: {
      totalFound: number;
      sourceBreakdown: Record<string, number>;
      searchTime: number;
      errors: string[];
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
          errors: []
        }
      };
    }

    const results: StandardProperty[] = [];
    const sourceBreakdown: Record<string, number> = {};
    const errors: string[] = [];

    // Get enabled services sorted by priority
    const enabledServices = Object.entries(this.services)
      .filter(([_, config]) => config.enabled && config.service.isAvailable())
      .sort(([_, a], [__, b]) => a.priority - b.priority);

    // Search services in parallel batches by priority
    const priorityGroups = this.groupByPriority(enabledServices);
    
    for (const group of priorityGroups) {
      const batchResults = await Promise.allSettled(
        group.map(([name, config]) => this.searchSingleService(name, config.service, filters))
      );

      batchResults.forEach((result, index) => {
        const [serviceName] = group[index];
        
        if (result.status === 'fulfilled') {
          const properties = result.value;
          results.push(...properties);
          sourceBreakdown[serviceName] = properties.length;
          this.updateMetrics(serviceName, true, 0);
        } else {
          errors.push(`${serviceName}: ${result.reason.message}`);
          sourceBreakdown[serviceName] = 0;
          this.updateMetrics(serviceName, false, 0);
        }
      });

      // If we have enough results from higher priority services, skip lower priority ones
      if (results.length >= 50) break;
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
        errors
      }
    };
  }

  // Search a single service with error handling
  private async searchSingleService(
    name: string,
    service: PropertyServiceInterface,
    filters: PropertySearchFilters
  ): Promise<StandardProperty[]> {
    const startTime = performance.now();
    
    try {
      const properties = await Promise.race([
        service.searchProperties(filters),
        this.createTimeout(30000) // 30 second timeout
      ]);

      const responseTime = performance.now() - startTime;
      this.updateMetrics(name, true, responseTime);
      
      return Array.isArray(properties) ? properties : [];
    } catch (error) {
      const responseTime = performance.now() - startTime;
      this.updateMetrics(name, false, responseTime);
      throw error;
    }
  }

  // Group services by priority for batch processing
  private groupByPriority(services: [string, any][]): [string, any][][] {
    const groups: Record<number, [string, any][]> = {};
    
    services.forEach(([name, config]) => {
      if (!groups[config.priority]) {
        groups[config.priority] = [];
      }
      groups[config.priority].push([name, config]);
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
    
    // Sort by quality score and student suitability
    const sorted = scored.sort((a, b) => {
      const scoreA = a.qualityScore + a.studentSuitability;
      const scoreB = b.qualityScore + b.studentSuitability;
      return scoreB - scoreA;
    });

    // Apply filters
    return this.applyFilters(sorted, filters);
  }

  // Remove duplicate properties based on location and price
  deduplicateProperties(properties: StandardProperty[]): StandardProperty[] {
    const seen = new Set<string>();
    return properties.filter(property => {
      const key = `${property.location.toLowerCase()}-${property.price}-${property.bedrooms}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  // Score properties for quality and student suitability
  scoreProperties(properties: StandardProperty[], filters: PropertySearchFilters): StandardProperty[] {
    return properties.map(property => {
      property.qualityScore = this.calculateQualityScore(property);
      property.studentSuitability = this.calculateStudentSuitability(property, filters);
      return property;
    });
  }

  // Calculate quality score (0-100)
  private calculateQualityScore(property: StandardProperty): number {
    let score = 50; // Base score

    // Image quality
    if (property.images.length > 0) score += 10;
    if (property.images.length > 3) score += 10;

    // Description quality
    if (property.description && property.description.length > 100) score += 10;

    // Contact verification
    if (property.contact?.verified) score += 15;

    // Features and amenities
    score += Math.min(15, (property.features.length + property.amenities.length) * 2);

    return Math.min(100, Math.max(0, score));
  }

  // Calculate student suitability score (0-100)
  private calculateStudentSuitability(property: StandardProperty, filters: PropertySearchFilters): number {
    let score = 50; // Base score

    // Price suitability
    if (property.price <= 600) score += 20;
    else if (property.price <= 800) score += 10;
    else if (property.price <= 1000) score += 5;

    // Student-friendly features
    if (property.bills.included) score += 15;
    if (property.furnished) score += 10;

    // Location and transport
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
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }
    this.cache.delete(key);
    return null;
  }

  private setCache(key: string, data: StandardProperty[]): void {
    this.cache.set(key, { data, timestamp: Date.now() });
    
    // Clean old cache entries
    if (this.cache.size > 100) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }
  }

  // Utility methods
  private createTimeout(ms: number): Promise<never> {
    return new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Service timeout')), ms)
    );
  }

  private updateMetrics(serviceName: string, success: boolean, responseTime: number): void {
    const service = this.services[serviceName];
    if (!service) return;

    service.metrics.totalRequests++;
    if (success) {
      service.metrics.successfulRequests++;
    } else {
      service.metrics.failedRequests++;
    }

    // Update average response time
    const total = service.metrics.totalRequests;
    service.metrics.averageResponseTime = 
      (service.metrics.averageResponseTime * (total - 1) + responseTime) / total;

    // Update error rate
    service.metrics.errorRate = service.metrics.failedRequests / service.metrics.totalRequests;
  }

  // Interface implementation
  getAvailableSources(): string[] {
    return Object.keys(this.services).filter(name => this.services[name].enabled);
  }

  getSourceStatus(source: string): PropertyServiceStatus {
    const service = this.services[source];
    if (!service) {
      throw new Error(`Service ${source} not found`);
    }

    return service.service.getStatus();
  }

  enableSource(source: string): void {
    if (this.services[source]) {
      this.services[source].enabled = true;
    }
  }

  disableSource(source: string): void {
    if (this.services[source]) {
      this.services[source].enabled = false;
    }
  }

  clearCache(): void {
    this.cache.clear();
  }

  getCacheStats(): any {
    return {
      size: this.cache.size,
      maxSize: 100,
      hitRate: 0 // Would need to track hits vs misses
    };
  }
}

// Export singleton instance
export const optimizedPropertyAggregator = new OptimizedPropertyAggregator();
export { OptimizedPropertyAggregator };


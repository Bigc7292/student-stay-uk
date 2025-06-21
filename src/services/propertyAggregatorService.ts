// Property Aggregator Service - Master service combining all property data sources
// Aggregates data from all available scrapers and APIs for comprehensive coverage

import { spareRoomService } from './spareRoomService';
import { rightmoveService } from './rightmoveService';
import { openRentService } from './openRentService';
import { gumtreeService } from './gumtreeService';
import { onTheMarketService } from './onTheMarketService';
import { zooplaCheerioService } from './zooplaCheerioService';
import { brightDataService } from './brightDataService';

interface UniversalProperty {
  id: string;
  source: string;
  title: string;
  price: number;
  location: string;
  postcode?: string;
  bedrooms: number;
  bathrooms: number;
  description: string;
  images: string[];
  available: boolean;
  availableFrom?: string;
  propertyType: string;
  furnished: boolean;
  billsIncluded: boolean;
  features: string[];
  contact?: {
    name: string;
    phone?: string;
    verified: boolean;
  };
  url: string;
  postedDate?: string;
  additionalData?: Record<string, any>;
  qualityScore: number;
  studentSuitability: number;
}

interface AggregatedSearchFilters {
  location: string;
  maxPrice?: number;
  minPrice?: number;
  bedrooms?: number;
  propertyType?: string;
  furnished?: boolean;
  billsIncluded?: boolean;
  availableFrom?: string;
  radius?: number;
  sources?: string[]; // Specify which sources to use
  maxResults?: number;
  sortBy?: 'price' | 'date' | 'quality' | 'suitability';
}

interface AggregationResult {
  properties: UniversalProperty[];
  summary: {
    totalFound: number;
    sourceBreakdown: Record<string, number>;
    averagePrice: number;
    priceRange: { min: number; max: number };
    executionTime: number;
    errors: string[];
  };
}

class PropertyAggregatorService {
  private enabledSources: Record<string, boolean>;
  private sourceServices: Record<string, any>;

  constructor() {
    this.enabledSources = {
      spareroom: true,
      rightmove: true,
      openrent: true,
      gumtree: true,
      onthemarket: true,
      zooplacheerio: true
    };

    this.sourceServices = {
      spareroom: spareRoomService,
      rightmove: rightmoveService,
      openrent: openRentService,
      gumtree: gumtreeService,
      onthemarket: onTheMarketService,
      zooplacheerio: zooplaCheerioService
    };

    console.log('🏠 Property Aggregator Service initialized with 6 data sources');
  }

  // Main aggregation method - searches all enabled sources
  async searchAllSources(filters: AggregatedSearchFilters): Promise<AggregationResult> {
    const startTime = Date.now();
    const errors: string[] = [];
    const sourceResults: Record<string, UniversalProperty[]> = {};

    console.log(`🔍 Starting aggregated property search for: ${filters.location}`);

    // Determine which sources to use
    const sourcesToUse = filters.sources || Object.keys(this.enabledSources).filter(
      source => this.enabledSources[source]
    );

    // Search each source in parallel
    const searchPromises = sourcesToUse.map(async (source) => {
      try {
        console.log(`🚀 Searching ${source}...`);
        const results = await this.searchSingleSource(source, filters);
        sourceResults[source] = results;
        console.log(`✅ ${source}: Found ${results.length} properties`);
      } catch (error) {
        const errorMsg = `${source}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        errors.push(errorMsg);
        console.error(`❌ ${errorMsg}`);
        sourceResults[source] = [];
      }
    });

    // Wait for all searches to complete
    await Promise.allSettled(searchPromises);

    // Combine and process results
    const allProperties = this.combineResults(sourceResults);
    const deduplicatedProperties = this.deduplicateProperties(allProperties);
    const scoredProperties = this.scoreProperties(deduplicatedProperties, filters);
    const sortedProperties = this.sortProperties(scoredProperties, filters.sortBy || 'quality');
    const limitedProperties = filters.maxResults 
      ? sortedProperties.slice(0, filters.maxResults)
      : sortedProperties;

    const executionTime = Date.now() - startTime;

    // Generate summary
    const summary = this.generateSummary(sourceResults, limitedProperties, executionTime, errors);

    console.log(`🎉 Aggregation complete: ${limitedProperties.length} properties from ${sourcesToUse.length} sources in ${executionTime}ms`);

    return {
      properties: limitedProperties,
      summary
    };
  }

  // Search a single source
  private async searchSingleSource(source: string, filters: AggregatedSearchFilters): Promise<UniversalProperty[]> {
    const service = this.sourceServices[source];
    if (!service || !service.isAvailable()) {
      throw new Error(`Service not available`);
    }

    // Convert universal filters to source-specific filters
    const sourceFilters = this.convertFilters(filters, source);
    
    // Call the service
    const results = await service.searchProperties(sourceFilters);
    
    // Convert to universal format
    return results.map((property: any) => this.convertToUniversalFormat(property, source));
  }

  // Convert universal filters to source-specific format
  private convertFilters(filters: AggregatedSearchFilters, source: string): any {
    const baseFilters = {
      location: filters.location,
      maxPrice: filters.maxPrice,
      minPrice: filters.minPrice,
      bedrooms: filters.bedrooms,
      furnished: filters.furnished,
      billsIncluded: filters.billsIncluded,
      availableFrom: filters.availableFrom,
      radius: filters.radius
    };

    // Source-specific property type mapping
    if (filters.propertyType) {
      switch (source) {
        case 'rightmove':
        case 'onthemarket':
          baseFilters.propertyType = filters.propertyType;
          break;
        case 'zooplacheerio':
          baseFilters.propertyType = filters.propertyType === 'flat' ? 'flats' : 'houses';
          break;
        default:
          baseFilters.propertyType = filters.propertyType;
      }
    }

    return baseFilters;
  }

  // Convert property to universal format
  private convertToUniversalFormat(property: any, source: string): UniversalProperty {
    return {
      id: property.id,
      source,
      title: property.title,
      price: property.price,
      location: property.location,
      postcode: property.postcode,
      bedrooms: property.bedrooms,
      bathrooms: property.bathrooms,
      description: property.description,
      images: property.images || [],
      available: property.available,
      availableFrom: property.availableFrom,
      propertyType: property.propertyType,
      furnished: property.furnished,
      billsIncluded: property.billsIncluded,
      features: property.features || [],
      contact: property.agent || property.landlord || property.seller,
      url: property.url,
      postedDate: property.postedDate,
      additionalData: this.extractAdditionalData(property, source),
      qualityScore: 0, // Will be calculated
      studentSuitability: 0 // Will be calculated
    };
  }

  // Extract source-specific additional data
  private extractAdditionalData(property: any, source: string): Record<string, any> {
    const additional: Record<string, any> = {};

    switch (source) {
      case 'rightmove':
      case 'onthemarket':
        if (property.propertySize) additional.propertySize = property.propertySize;
        if (property.councilTaxBand) additional.councilTaxBand = property.councilTaxBand;
        if (property.epcRating) additional.epcRating = property.epcRating;
        break;
      case 'zooplacheerio':
        if (property.rentalYield) additional.rentalYield = property.rentalYield;
        if (property.priceHistory) additional.priceHistory = property.priceHistory;
        break;
      case 'gumtree':
        if (property.category) additional.category = property.category;
        break;
    }

    return additional;
  }

  // Combine results from all sources
  private combineResults(sourceResults: Record<string, UniversalProperty[]>): UniversalProperty[] {
    const combined: UniversalProperty[] = [];
    
    Object.values(sourceResults).forEach(properties => {
      combined.push(...properties);
    });

    return combined;
  }

  // Remove duplicate properties
  private deduplicateProperties(properties: UniversalProperty[]): UniversalProperty[] {
    const seen = new Set<string>();
    const deduplicated: UniversalProperty[] = [];

    properties.forEach(property => {
      // Create a deduplication key based on address and price
      const key = `${property.location.toLowerCase()}-${property.price}-${property.bedrooms}`;
      
      if (!seen.has(key)) {
        seen.add(key);
        deduplicated.push(property);
      }
    });

    console.log(`🔄 Deduplicated: ${properties.length} → ${deduplicated.length} properties`);
    return deduplicated;
  }

  // Score properties for quality and student suitability
  private scoreProperties(properties: UniversalProperty[], filters: AggregatedSearchFilters): UniversalProperty[] {
    return properties.map(property => {
      property.qualityScore = this.calculateQualityScore(property);
      property.studentSuitability = this.calculateStudentSuitability(property, filters);
      return property;
    });
  }

  // Calculate quality score (0-100)
  private calculateQualityScore(property: UniversalProperty): number {
    let score = 50; // Base score

    // Image quality
    if (property.images.length > 0) score += 10;
    if (property.images.length > 3) score += 10;

    // Description quality
    if (property.description && property.description.length > 100) score += 10;

    // Contact information
    if (property.contact?.verified) score += 10;
    if (property.contact?.phone) score += 5;

    // Features
    if (property.features.length > 0) score += 5;
    if (property.features.length > 3) score += 5;

    // Source reliability
    const sourceReliability = {
      rightmove: 10,
      onthemarket: 8,
      spareroom: 8,
      zooplacheerio: 6,
      openrent: 6,
      gumtree: 4
    };
    score += sourceReliability[property.source] || 0;

    return Math.min(100, Math.max(0, score));
  }

  // Calculate student suitability score (0-100)
  private calculateStudentSuitability(property: UniversalProperty, filters: AggregatedSearchFilters): number {
    let score = 50; // Base score

    // Price suitability for students
    if (property.price <= 600) score += 20;
    else if (property.price <= 800) score += 10;
    else if (property.price <= 1000) score += 5;

    // Bills included (important for students)
    if (property.billsIncluded) score += 15;

    // Furnished (important for students)
    if (property.furnished) score += 10;

    // Student-friendly features
    const studentFeatures = ['wifi', 'internet', 'student', 'university', 'transport'];
    const hasStudentFeatures = property.features.some(feature => 
      studentFeatures.some(sf => feature.toLowerCase().includes(sf))
    );
    if (hasStudentFeatures) score += 10;

    // Property type preference
    if (property.propertyType === 'room' || property.propertyType === 'studio') score += 5;

    return Math.min(100, Math.max(0, score));
  }

  // Sort properties
  private sortProperties(properties: UniversalProperty[], sortBy: string): UniversalProperty[] {
    return properties.sort((a, b) => {
      switch (sortBy) {
        case 'price':
          return a.price - b.price;
        case 'date':
          return new Date(b.postedDate || 0).getTime() - new Date(a.postedDate || 0).getTime();
        case 'suitability':
          return b.studentSuitability - a.studentSuitability;
        case 'quality':
        default:
          return b.qualityScore - a.qualityScore;
      }
    });
  }

  // Generate summary statistics
  private generateSummary(
    sourceResults: Record<string, UniversalProperty[]>,
    finalProperties: UniversalProperty[],
    executionTime: number,
    errors: string[]
  ) {
    const sourceBreakdown: Record<string, number> = {};
    let totalFound = 0;

    Object.entries(sourceResults).forEach(([source, properties]) => {
      sourceBreakdown[source] = properties.length;
      totalFound += properties.length;
    });

    const prices = finalProperties.map(p => p.price).filter(p => p > 0);
    const averagePrice = prices.length > 0 ? prices.reduce((a, b) => a + b, 0) / prices.length : 0;
    const priceRange = {
      min: prices.length > 0 ? Math.min(...prices) : 0,
      max: prices.length > 0 ? Math.max(...prices) : 0
    };

    return {
      totalFound,
      sourceBreakdown,
      averagePrice: Math.round(averagePrice),
      priceRange,
      executionTime,
      errors
    };
  }

  // Get service status
  getStatus(): Record<string, any> {
    const status: Record<string, any> = {};
    
    Object.entries(this.sourceServices).forEach(([source, service]) => {
      status[source] = service.getStatus ? service.getStatus() : { available: false };
    });

    return {
      aggregator: {
        available: true,
        enabledSources: Object.keys(this.enabledSources).filter(s => this.enabledSources[s]),
        totalSources: Object.keys(this.sourceServices).length
      },
      sources: status
    };
  }

  // Enable/disable specific sources
  toggleSource(source: string, enabled: boolean): void {
    if (source in this.enabledSources) {
      this.enabledSources[source] = enabled;
      console.log(`🔄 ${source} ${enabled ? 'enabled' : 'disabled'}`);
    }
  }
}

// Export singleton instance
export const propertyAggregatorService = new PropertyAggregatorService();
export type { UniversalProperty, AggregatedSearchFilters, AggregationResult };

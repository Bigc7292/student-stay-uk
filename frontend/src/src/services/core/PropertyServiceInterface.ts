// Unified Property Service Interface
// Clean, standardized interface for all property data sources

export interface PropertySearchFilters {
  location: string;
  maxPrice?: number;
  minPrice?: number;
  bedrooms?: number;
  bathrooms?: number;
  propertyType?: 'flat' | 'house' | 'studio' | 'shared' | 'room';
  furnished?: boolean;
  billsIncluded?: boolean;
  availableFrom?: string;
  radius?: number;
  studentFriendly?: boolean;
}

export interface StandardProperty {
  // Core identifiers
  id: string;
  source: string;
  sourceUrl: string;
  
  // Basic information
  title: string;
  description: string;
  price: number;
  priceType: 'weekly' | 'monthly';
  
  // Location data
  location: string;
  postcode?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  
  // Property details
  type: PropertySearchFilters['propertyType'];
  bedrooms: number;
  bathrooms: number;
  furnished: boolean;
  
  // Amenities and features
  features: string[];
  amenities: string[];
  
  // Availability
  available: boolean;
  availableFrom?: string;
  
  // Bills and costs
  bills: {
    included: boolean;
    details: string[];
    estimatedMonthly?: number;
  };
  
  // Media
  images: string[];
  virtualTour?: string;
  
  // Contact information
  contact?: {
    name: string;
    phone?: string;
    email?: string;
    verified: boolean;
    rating?: number;
  };
  
  // Quality metrics
  qualityScore: number;
  studentSuitability: number;
  
  // Metadata
  lastUpdated: Date;
  viewCount?: number;
  savedCount?: number;
}

export interface PropertyServiceConfig {
  enabled: boolean;
  priority: number;
  timeout: number;
  retryAttempts: number;
  rateLimit?: {
    requests: number;
    window: number; // milliseconds
  };
}

export interface PropertyServiceStatus {
  available: boolean;
  healthy: boolean;
  lastCheck: Date;
  errorCount: number;
  successRate: number;
  averageResponseTime: number;
}

export interface PropertySearchResult {
  properties: StandardProperty[];
  metadata: {
    source: string;
    totalFound: number;
    searchTime: number;
    hasMore: boolean;
    nextPage?: string;
  };
}

export interface PropertyServiceInterface {
  // Core methods
  searchProperties(filters: PropertySearchFilters): Promise<StandardProperty[]>;
  getPropertyDetails?(id: string): Promise<StandardProperty | null>;
  
  // Service management
  isAvailable(): boolean;
  getStatus(): PropertyServiceStatus;
  getConfig(): PropertyServiceConfig;
  
  // Health checks
  testConnection(): Promise<boolean>;
  validateConfiguration(): boolean;
  
  // Optional advanced features
  getSimilarProperties?(propertyId: string): Promise<StandardProperty[]>;
  getPropertyHistory?(propertyId: string): Promise<any[]>;
  reportProperty?(propertyId: string, reason: string): Promise<boolean>;
}

export interface PropertyAggregatorInterface {
  // Main search functionality
  searchAllSources(filters: PropertySearchFilters): Promise<{
    properties: StandardProperty[];
    summary: {
      totalFound: number;
      sourceBreakdown: Record<string, number>;
      searchTime: number;
      errors: string[];
    };
  }>;
  
  // Service management
  getAvailableSources(): string[];
  getSourceStatus(source: string): PropertyServiceStatus;
  enableSource(source: string): void;
  disableSource(source: string): void;
  
  // Data quality
  deduplicateProperties(properties: StandardProperty[]): StandardProperty[];
  scoreProperties(properties: StandardProperty[], filters: PropertySearchFilters): StandardProperty[];
  
  // Caching
  clearCache(): void;
  getCacheStats(): any;
}

// Utility types for service implementations
export type PropertyServiceError = {
  code: string;
  message: string;
  source: string;
  timestamp: Date;
  retryable: boolean;
};

export type PropertyServiceMetrics = {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  lastRequestTime?: Date;
  errorRate: number;
};

// Configuration constants
export const PROPERTY_SERVICE_DEFAULTS = {
  TIMEOUT: 30000, // 30 seconds
  RETRY_ATTEMPTS: 3,
  RATE_LIMIT_REQUESTS: 100,
  RATE_LIMIT_WINDOW: 3600000, // 1 hour
  CACHE_TTL: 300000, // 5 minutes
  MAX_RESULTS_PER_SOURCE: 50,
  QUALITY_SCORE_THRESHOLD: 60,
  STUDENT_SUITABILITY_THRESHOLD: 70
} as const;

// Service priority levels
export const SERVICE_PRIORITIES = {
  PRIMARY: 1,
  SECONDARY: 2,
  BACKUP: 3,
  FALLBACK: 4
} as const;

export type ServicePriority = typeof SERVICE_PRIORITIES[keyof typeof SERVICE_PRIORITIES];

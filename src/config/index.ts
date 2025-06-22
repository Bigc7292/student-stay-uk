// Centralized Configuration Management
// Clean, type-safe configuration for the entire application

interface APIConfiguration {
  key?: string;
  host?: string;
  timeout: number;
  retryAttempts: number;
  enabled: boolean;
  rateLimit?: {
    requests: number;
    window: number; // milliseconds
  };
}

interface ServiceConfiguration {
  enabled: boolean;
  priority: number;
  timeout: number;
  retryAttempts: number;
  maxResults?: number;
}

interface AppConfig {
  // Environment
  environment: 'development' | 'production' | 'test';
  debug: boolean;
  version: string;
  
  // Application Settings
  app: {
    name: string;
    defaultLocation: string;
    maxSearchResults: number;
    cacheTimeout: number;
    enableAnalytics: boolean;
    enablePWA: boolean;
    enableServiceWorker: boolean;
  };
  
  // API Configurations
  apis: {
    googleMaps: APIConfiguration;
    zoopla: APIConfiguration;
    openai: APIConfiguration;
    apify: APIConfiguration;
    rapidapi: APIConfiguration;
    sentry: APIConfiguration;
    brightData: APIConfiguration;
  };
  
  // Property Service Configurations
  propertyServices: {
    zoopla: ServiceConfiguration;
    openrent: ServiceConfiguration;
    spareroom: ServiceConfiguration;
    rightmove: ServiceConfiguration;
    gumtree: ServiceConfiguration;
    onthemarket: ServiceConfiguration;
    zooplacheerio: ServiceConfiguration;
  };
  
  // UI/UX Settings
  ui: {
    theme: 'light' | 'dark' | 'auto';
    language: string;
    currency: string;
    dateFormat: string;
    enableAnimations: boolean;
    compactMode: boolean;
  };
  
  // Performance Settings
  performance: {
    enableCodeSplitting: boolean;
    enableImageOptimization: boolean;
    enableBundleAnalysis: boolean;
    maxBundleSize: number;
    enablePreloading: boolean;
  };
  
  // Security Settings
  security: {
    enableCSP: boolean;
    enableSRI: boolean;
    enableHTTPS: boolean;
    apiKeyRotation: boolean;
  };
}

class ConfigurationManager {
  private config: AppConfig;
  private readonly storageKey = 'studenthome-config';

  constructor() {
    this.config = this.initializeConfig();
    this.validateConfig();
  }

  private initializeConfig(): AppConfig {
    const baseConfig: AppConfig = {
      environment: (import.meta.env.MODE as any) || 'development',
      debug: import.meta.env.DEV || false,
      version: import.meta.env.VITE_APP_VERSION || '1.0.0',
      
      app: {
        name: 'StudentHome',
        defaultLocation: 'Manchester',
        maxSearchResults: 50,
        cacheTimeout: 5 * 60 * 1000, // 5 minutes
        enableAnalytics: !!import.meta.env.VITE_GA_MEASUREMENT_ID,
        enablePWA: true,
        enableServiceWorker: true
      },
      
      apis: {
        googleMaps: {
          key: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
          timeout: 10000,
          retryAttempts: 3,
          enabled: !!import.meta.env.VITE_GOOGLE_MAPS_API_KEY
        },
        zoopla: {
          key: import.meta.env.VITE_RAPIDAPI_KEY,
          host: import.meta.env.VITE_RAPIDAPI_HOST,
          timeout: 15000,
          retryAttempts: 3,
          enabled: !!import.meta.env.VITE_RAPIDAPI_KEY,
          rateLimit: { requests: 100, window: 3600000 }
        },
        openai: {
          key: import.meta.env.VITE_OPENAI_API_KEY,
          timeout: 30000,
          retryAttempts: 2,
          enabled: !!import.meta.env.VITE_OPENAI_API_KEY,
          rateLimit: { requests: 50, window: 3600000 }
        },
        apify: {
          key: import.meta.env.VITE_APIFY_TOKEN,
          timeout: 60000,
          retryAttempts: 2,
          enabled: !!import.meta.env.VITE_APIFY_TOKEN,
          rateLimit: { requests: 200, window: 3600000 }
        },
        rapidapi: {
          key: import.meta.env.VITE_RAPIDAPI_KEY,
          timeout: 15000,
          retryAttempts: 3,
          enabled: !!import.meta.env.VITE_RAPIDAPI_KEY,
          rateLimit: { requests: 100, window: 3600000 }
        },
        sentry: {
          key: import.meta.env.VITE_SENTRY_DSN,
          timeout: 5000,
          retryAttempts: 1,
          enabled: !!import.meta.env.VITE_SENTRY_DSN
        },
        brightData: {
          key: import.meta.env.BRIGHT_DATA_API_TOKEN,
          timeout: 30000,
          retryAttempts: 2,
          enabled: !!import.meta.env.BRIGHT_DATA_API_TOKEN,
          rateLimit: { requests: 100, window: 3600000 }
        }
      },
      
      propertyServices: {
        zoopla: { enabled: true, priority: 1, timeout: 15000, retryAttempts: 3, maxResults: 20 },
        openrent: { enabled: true, priority: 1, timeout: 60000, retryAttempts: 2, maxResults: 20 },
        spareroom: { enabled: true, priority: 2, timeout: 30000, retryAttempts: 3, maxResults: 15 },
        rightmove: { enabled: true, priority: 2, timeout: 30000, retryAttempts: 3, maxResults: 15 },
        gumtree: { enabled: true, priority: 3, timeout: 45000, retryAttempts: 2, maxResults: 10 },
        onthemarket: { enabled: true, priority: 3, timeout: 30000, retryAttempts: 2, maxResults: 10 },
        zooplacheerio: { enabled: true, priority: 4, timeout: 45000, retryAttempts: 2, maxResults: 10 }
      },
      
      ui: {
        theme: 'auto',
        language: 'en-GB',
        currency: 'GBP',
        dateFormat: 'DD/MM/YYYY',
        enableAnimations: true,
        compactMode: false
      },
      
      performance: {
        enableCodeSplitting: true,
        enableImageOptimization: true,
        enableBundleAnalysis: false,
        maxBundleSize: 500000, // 500KB
        enablePreloading: true
      },
      
      security: {
        enableCSP: true,
        enableSRI: false, // Disabled for development
        enableHTTPS: import.meta.env.PROD,
        apiKeyRotation: false
      }
    };

    // Load user preferences from localStorage
    const userPrefs = this.loadUserPreferences();
    if (userPrefs) {
      this.mergeConfigs(baseConfig, userPrefs);
    }

    return baseConfig;
  }

  private validateConfig(): void {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate required configurations for production
    if (this.config.environment === 'production') {
      if (!this.config.apis.googleMaps.key) {
        warnings.push('Google Maps API key not configured - maps will not work');
      }
      if (!this.config.apis.openai.key) {
        warnings.push('OpenAI API key not configured - AI features will not work');
      }
      if (!this.config.apis.sentry.key) {
        warnings.push('Sentry DSN not configured - error tracking disabled');
      }
    }

    // Validate service priorities
    const priorities = Object.values(this.config.propertyServices).map(s => s.priority);
    const uniquePriorities = new Set(priorities);
    if (uniquePriorities.size !== priorities.length) {
      warnings.push('Duplicate service priorities detected - may affect load balancing');
    }

    // Validate timeouts
    Object.entries(this.config.apis).forEach(([name, api]) => {
      if (api.timeout < 1000) {
        warnings.push(`${name} API timeout is very low (${api.timeout}ms)`);
      }
      if (api.timeout > 60000) {
        warnings.push(`${name} API timeout is very high (${api.timeout}ms)`);
      }
    });

    // Log validation results
    if (errors.length > 0) {
      console.error('❌ Configuration errors:', errors);
    }
    if (warnings.length > 0 && this.config.debug) {
      console.warn('⚠️ Configuration warnings:', warnings);
    }
    if (errors.length === 0 && warnings.length === 0) {
      console.log('✅ Configuration validated successfully');
    }
  }

  private loadUserPreferences(): Partial<AppConfig> | null {
    try {
      const stored = localStorage.getItem(this.storageKey);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.warn('Failed to load user preferences:', error);
      return null;
    }
  }

  private saveUserPreferences(): void {
    try {
      const userPrefs = {
        ui: this.config.ui,
        propertyServices: Object.fromEntries(
          Object.entries(this.config.propertyServices).map(([key, value]) => [
            key,
            { enabled: value.enabled, priority: value.priority }
          ])
        ),
        performance: this.config.performance
      };
      localStorage.setItem(this.storageKey, JSON.stringify(userPrefs));
    } catch (error) {
      console.warn('Failed to save user preferences:', error);
    }
  }

  private mergeConfigs(target: any, source: any): void {
    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        if (!target[key]) target[key] = {};
        this.mergeConfigs(target[key], source[key]);
      } else {
        target[key] = source[key];
      }
    }
  }

  // Public API
  get(): AppConfig {
    return { ...this.config };
  }

  getAPI(name: keyof AppConfig['apis']): APIConfiguration {
    return { ...this.config.apis[name] };
  }

  getService(name: keyof AppConfig['propertyServices']): ServiceConfiguration {
    return { ...this.config.propertyServices[name] };
  }

  getApp(): AppConfig['app'] {
    return { ...this.config.app };
  }

  getUI(): AppConfig['ui'] {
    return { ...this.config.ui };
  }

  getPerformance(): AppConfig['performance'] {
    return { ...this.config.performance };
  }

  getSecurity(): AppConfig['security'] {
    return { ...this.config.security };
  }

  // Update methods
  updateAPI(name: keyof AppConfig['apis'], updates: Partial<APIConfiguration>): void {
    this.config.apis[name] = { ...this.config.apis[name], ...updates };
    this.saveUserPreferences();
  }

  updateService(name: keyof AppConfig['propertyServices'], updates: Partial<ServiceConfiguration>): void {
    this.config.propertyServices[name] = { ...this.config.propertyServices[name], ...updates };
    this.saveUserPreferences();
  }

  updateUI(updates: Partial<AppConfig['ui']>): void {
    this.config.ui = { ...this.config.ui, ...updates };
    this.saveUserPreferences();
  }

  updatePerformance(updates: Partial<AppConfig['performance']>): void {
    this.config.performance = { ...this.config.performance, ...updates };
    this.saveUserPreferences();
  }

  // Utility methods
  isProduction(): boolean {
    return this.config.environment === 'production';
  }

  isDevelopment(): boolean {
    return this.config.environment === 'development';
  }

  isDebugEnabled(): boolean {
    return this.config.debug;
  }

  isAPIEnabled(name: keyof AppConfig['apis']): boolean {
    return this.config.apis[name].enabled && !!this.config.apis[name].key;
  }

  isServiceEnabled(name: keyof AppConfig['propertyServices']): boolean {
    return this.config.propertyServices[name].enabled;
  }

  getEnabledServices(): Array<{ name: string; config: ServiceConfiguration }> {
    return Object.entries(this.config.propertyServices)
      .filter(([_, config]) => config.enabled)
      .sort(([_, a], [__, b]) => a.priority - b.priority)
      .map(([name, config]) => ({ name, config }));
  }

  getConfigSummary(): {
    environment: string;
    enabledAPIs: number;
    enabledServices: number;
    totalAPIs: number;
    totalServices: number;
  } {
    const enabledAPIs = Object.values(this.config.apis).filter(api => api.enabled).length;
    const enabledServices = Object.values(this.config.propertyServices).filter(service => service.enabled).length;

    return {
      environment: this.config.environment,
      enabledAPIs,
      enabledServices,
      totalAPIs: Object.keys(this.config.apis).length,
      totalServices: Object.keys(this.config.propertyServices).length
    };
  }

  reset(): void {
    localStorage.removeItem(this.storageKey);
    this.config = this.initializeConfig();
    this.validateConfig();
  }
}

// Export singleton instance
export const config = new ConfigurationManager();
export type { AppConfig, APIConfiguration, ServiceConfiguration };
export { ConfigurationManager };

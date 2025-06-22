// Centralized Application Configuration
// Clean, type-safe configuration management

interface APIConfig {
  key?: string;
  host?: string;
  timeout: number;
  retryAttempts: number;
  enabled: boolean;
}

interface ServiceConfig {
  enabled: boolean;
  priority: number;
  timeout: number;
  retryAttempts: number;
  rateLimit?: {
    requests: number;
    window: number;
  };
}

interface AppConfiguration {
  // Environment
  environment: 'development' | 'production' | 'test';
  debug: boolean;
  
  // API Keys and External Services
  apis: {
    googleMaps: APIConfig;
    zoopla: APIConfig;
    openai: APIConfig;
    apify: APIConfig;
    rapidapi: APIConfig;
    sentry: APIConfig;
  };
  
  // Property Services Configuration
  propertyServices: {
    zoopla: ServiceConfig;
    openrent: ServiceConfig;
    spareroom: ServiceConfig;
    rightmove: ServiceConfig;
    gumtree: ServiceConfig;
    onthemarket: ServiceConfig;
    zooplacheerio: ServiceConfig;
  };
  
  // Application Settings
  app: {
    name: string;
    version: string;
    defaultLocation: string;
    maxSearchResults: number;
    cacheTimeout: number;
    enableAnalytics: boolean;
    enablePWA: boolean;
  };
  
  // UI/UX Settings
  ui: {
    theme: 'light' | 'dark' | 'auto';
    language: string;
    currency: string;
    dateFormat: string;
    enableAnimations: boolean;
  };
  
  // Performance Settings
  performance: {
    enableServiceWorker: boolean;
    enableCodeSplitting: boolean;
    enableImageOptimization: boolean;
    bundleAnalysis: boolean;
  };
}

class ConfigManager {
  private config: AppConfiguration;
  private readonly defaults: AppConfiguration = {
    environment: 'development',
    debug: true,
    
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
        enabled: !!import.meta.env.VITE_RAPIDAPI_KEY
      },
      openai: {
        key: import.meta.env.VITE_OPENAI_API_KEY,
        timeout: 30000,
        retryAttempts: 2,
        enabled: !!import.meta.env.VITE_OPENAI_API_KEY
      },
      apify: {
        key: import.meta.env.VITE_APIFY_TOKEN,
        timeout: 60000,
        retryAttempts: 2,
        enabled: !!import.meta.env.VITE_APIFY_TOKEN
      },
      rapidapi: {
        key: import.meta.env.VITE_RAPIDAPI_KEY,
        timeout: 15000,
        retryAttempts: 3,
        enabled: !!import.meta.env.VITE_RAPIDAPI_KEY
      },
      sentry: {
        key: import.meta.env.VITE_SENTRY_DSN,
        timeout: 5000,
        retryAttempts: 1,
        enabled: !!import.meta.env.VITE_SENTRY_DSN
      }
    },
    
    propertyServices: {
      zoopla: { enabled: true, priority: 1, timeout: 15000, retryAttempts: 3 },
      openrent: { enabled: true, priority: 1, timeout: 60000, retryAttempts: 2 },
      spareroom: { enabled: true, priority: 2, timeout: 30000, retryAttempts: 3 },
      rightmove: { enabled: true, priority: 2, timeout: 30000, retryAttempts: 3 },
      gumtree: { enabled: true, priority: 3, timeout: 45000, retryAttempts: 2 },
      onthemarket: { enabled: true, priority: 3, timeout: 30000, retryAttempts: 2 },
      zooplacheerio: { enabled: true, priority: 4, timeout: 45000, retryAttempts: 2 }
    },
    
    app: {
      name: 'StudentHome',
      version: '1.0.0',
      defaultLocation: 'Manchester',
      maxSearchResults: 50,
      cacheTimeout: 300000, // 5 minutes
      enableAnalytics: false,
      enablePWA: true
    },
    
    ui: {
      theme: 'auto',
      language: 'en-GB',
      currency: 'GBP',
      dateFormat: 'DD/MM/YYYY',
      enableAnimations: true
    },
    
    performance: {
      enableServiceWorker: true,
      enableCodeSplitting: true,
      enableImageOptimization: true,
      bundleAnalysis: false
    }
  };

  constructor() {
    this.config = this.loadConfiguration();
    this.validateConfiguration();
  }

  // Load configuration from environment and defaults
  private loadConfiguration(): AppConfiguration {
    const config = { ...this.defaults };
    
    // Override with environment-specific settings
    if (import.meta.env.PROD) {
      config.environment = 'production';
      config.debug = false;
      config.performance.bundleAnalysis = false;
    }
    
    // Load user preferences from localStorage
    try {
      const userPrefs = localStorage.getItem('studenthome-config');
      if (userPrefs) {
        const parsed = JSON.parse(userPrefs);
        this.mergeConfig(config, parsed);
      }
    } catch (error) {
      console.warn('Failed to load user preferences:', error);
    }
    
    return config;
  }

  // Validate configuration
  private validateConfiguration(): void {
    const errors: string[] = [];
    
    // Check required API keys for production
    if (this.config.environment === 'production') {
      if (!this.config.apis.googleMaps.key) {
        errors.push('Google Maps API key is required for production');
      }
      if (!this.config.apis.openai.key) {
        errors.push('OpenAI API key is required for production');
      }
    }
    
    // Validate service priorities
    const priorities = Object.values(this.config.propertyServices).map(s => s.priority);
    if (new Set(priorities).size !== priorities.length) {
      console.warn('Duplicate service priorities detected');
    }
    
    if (errors.length > 0) {
      console.error('Configuration validation errors:', errors);
    }
  }

  // Merge configuration objects
  private mergeConfig(target: any, source: any): void {
    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        if (!target[key]) target[key] = {};
        this.mergeConfig(target[key], source[key]);
      } else {
        target[key] = source[key];
      }
    }
  }

  // Get configuration
  get(): AppConfiguration {
    return { ...this.config };
  }

  // Get specific configuration section
  getAPI(name: keyof AppConfiguration['apis']): APIConfig {
    return { ...this.config.apis[name] };
  }

  getService(name: keyof AppConfiguration['propertyServices']): ServiceConfig {
    return { ...this.config.propertyServices[name] };
  }

  getApp(): AppConfiguration['app'] {
    return { ...this.config.app };
  }

  getUI(): AppConfiguration['ui'] {
    return { ...this.config.ui };
  }

  getPerformance(): AppConfiguration['performance'] {
    return { ...this.config.performance };
  }

  // Update configuration
  updateAPI(name: keyof AppConfiguration['apis'], updates: Partial<APIConfig>): void {
    this.config.apis[name] = { ...this.config.apis[name], ...updates };
    this.saveUserPreferences();
  }

  updateService(name: keyof AppConfiguration['propertyServices'], updates: Partial<ServiceConfig>): void {
    this.config.propertyServices[name] = { ...this.config.propertyServices[name], ...updates };
    this.saveUserPreferences();
  }

  updateUI(updates: Partial<AppConfiguration['ui']>): void {
    this.config.ui = { ...this.config.ui, ...updates };
    this.saveUserPreferences();
  }

  // Save user preferences to localStorage
  private saveUserPreferences(): void {
    try {
      const userPrefs = {
        ui: this.config.ui,
        propertyServices: Object.fromEntries(
          Object.entries(this.config.propertyServices).map(([key, value]) => [
            key,
            { enabled: value.enabled, priority: value.priority }
          ])
        )
      };
      localStorage.setItem('studenthome-config', JSON.stringify(userPrefs));
    } catch (error) {
      console.warn('Failed to save user preferences:', error);
    }
  }

  // Check if service is enabled and configured
  isServiceEnabled(name: keyof AppConfiguration['propertyServices']): boolean {
    const service = this.config.propertyServices[name];
    return service.enabled;
  }

  isAPIConfigured(name: keyof AppConfiguration['apis']): boolean {
    const api = this.config.apis[name];
    return api.enabled && !!api.key;
  }

  // Get enabled services sorted by priority
  getEnabledServices(): Array<{ name: string; config: ServiceConfig }> {
    return Object.entries(this.config.propertyServices)
      .filter(([_, config]) => config.enabled)
      .sort(([_, a], [__, b]) => a.priority - b.priority)
      .map(([name, config]) => ({ name, config }));
  }

  // Development helpers
  isDevelopment(): boolean {
    return this.config.environment === 'development';
  }

  isProduction(): boolean {
    return this.config.environment === 'production';
  }

  isDebugEnabled(): boolean {
    return this.config.debug;
  }

  // Reset to defaults
  reset(): void {
    this.config = { ...this.defaults };
    localStorage.removeItem('studenthome-config');
  }
}

// Export singleton instance
export const appConfig = new ConfigManager();
export type { AppConfiguration, APIConfig, ServiceConfig };
export { ConfigManager };

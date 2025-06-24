// Optimized API configuration for StudentHome
export const API_CONFIG = {
  // Supabase
  supabase: {
    url: import.meta.env.VITE_SUPABASE_URL,
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
    serviceRoleKey: import.meta.env.SUPABASE_SERVICE_ROLE_KEY
  },
  
  // External APIs
  googleMaps: {
    apiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    enabled: !!import.meta.env.VITE_GOOGLE_MAPS_API_KEY
  },
  
  openai: {
    apiKey: import.meta.env.VITE_OPENAI_API_KEY,
    enabled: !!import.meta.env.VITE_OPENAI_API_KEY
  },
  
  apify: {
    token: import.meta.env.VITE_APIFY_TOKEN,
    enabled: !!import.meta.env.VITE_APIFY_TOKEN
  },
  
  // Application settings
  app: {
    name: import.meta.env.VITE_APP_NAME || 'StudentHome',
    version: import.meta.env.VITE_APP_VERSION || '1.0.0',
    environment: import.meta.env.VITE_APP_ENVIRONMENT || 'development',
    enableAnalytics: import.meta.env.VITE_ENABLE_ANALYTICS === 'true',
    enablePWA: import.meta.env.VITE_ENABLE_PWA === 'true',
    enableRealData: import.meta.env.VITE_ENABLE_REAL_DATA === 'true'
  },
  
  // Search settings
  search: {
    defaultLimit: 50,
    maxResults: 200,
    cacheTimeout: 300000, // 5 minutes
    enableFilters: true
  }
};

// Validation
export const validateConfig = () => {
  const required = [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY'
  ];
  
  const missing = required.filter(key => !import.meta.env[key]);
  
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:', missing);
    return false;
  }
  
  return true;
};

// Security utility to check for exposed API keys
export const securityCheck = {
  // Check if we're accidentally using placeholder keys
  validateApiKeys: () => {
    const warnings: string[] = [];
    
    const googleMapsKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    const openaiKey = import.meta.env.VITE_OPENAI_API_KEY;
    
    // Check for placeholder values
    if (googleMapsKey === 'your_google_maps_api_key_here' || 
        googleMapsKey === 'AIzaSyExample') {
      warnings.push('Google Maps API key appears to be a placeholder');
    }
    
    if (openaiKey === 'your_openai_api_key_here' || 
        openaiKey === 'sk-example') {
      warnings.push('OpenAI API key appears to be a placeholder');
    }
    
    // Check for development keys in production
    if (import.meta.env.PROD) {
      if (googleMapsKey?.includes('dev') || googleMapsKey?.includes('test')) {
        warnings.push('Development Google Maps key detected in production');
      }
      
      if (openaiKey?.includes('dev') || openaiKey?.includes('test')) {
        warnings.push('Development OpenAI key detected in production');
      }
    }
    
    return warnings;
  },
  
  // Log security status
  logSecurityStatus: () => {
    const warnings = securityCheck.validateApiKeys();
    
    if (warnings.length === 0) {
      console.log('🔐 Security check passed - API keys appear to be properly configured');
    } else {
      console.warn('⚠️ Security warnings:', warnings);
    }
    
    // Log environment info (safe info only)
    console.log('🛡️ Security info:', {
      environment: import.meta.env.MODE,
      hasGoogleMapsKey: !!import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
      hasOpenAIKey: !!import.meta.env.VITE_OPENAI_API_KEY,
      isProduction: import.meta.env.PROD
    });
  }
};

// Run security check on app start (development only)
if (import.meta.env.DEV) {
  securityCheck.logSecurityStatus();
}

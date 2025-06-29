import React, { useState, useEffect } from 'react';
import { Key, Eye, EyeOff, Save, AlertTriangle, CheckCircle, ExternalLink, Copy } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';

interface APIKey {
  id: string;
  name: string;
  description: string;
  required: boolean;
  cost: string;
  setupUrl: string;
  placeholder: string;
  value: string;
  isValid: boolean;
  instructions: string[];
}

const APIKeyManager: React.FC = () => {
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [apiKeys, setApiKeys] = useState<APIKey[]>([
    {
      id: 'VITE_GOOGLE_MAPS_API_KEY',
      name: 'Google Maps API Key',
      description: 'Required for interactive maps, geocoding, places search, and directions',
      required: true,
      cost: 'FREE (28,000 requests/month)',
      setupUrl: 'https://console.cloud.google.com/apis/credentials',
      placeholder: 'AIzaSyBvOkBwGyVVVlviss9JSw...',
      value: '',
      isValid: false,
      instructions: [
        'Go to Google Cloud Console',
        'Create new project or select existing',
        'Enable: Maps JavaScript API, Geocoding API, Places API, Directions API',
        'Create credentials → API Key',
        'Restrict key to your domain for security'
      ]
    },
    {
      id: 'VITE_ANALYTICS_ID',
      name: 'Google Analytics 4 Measurement ID',
      description: 'Optional: User behavior tracking and analytics',
      required: false,
      cost: 'FREE',
      setupUrl: 'https://analytics.google.com/',
      placeholder: 'G-XXXXXXXXXX',
      value: '',
      isValid: false,
      instructions: [
        'Go to Google Analytics',
        'Create account and property',
        'Get Measurement ID (starts with G-)',
        'Copy the full ID including G- prefix'
      ]
    },
    {
      id: 'VITE_TFL_API_KEY',
      name: 'Transport for London API Key',
      description: 'Optional: London transport data (buses, tubes, trains)',
      required: false,
      cost: 'FREE',
      setupUrl: 'https://api.tfl.gov.uk/',
      placeholder: 'your-tfl-api-key-here',
      value: '',
      isValid: false,
      instructions: [
        'Go to TfL API Portal',
        'Register for free account',
        'Get API key from dashboard',
        'No restrictions needed'
      ]
    },
    {
      id: 'VITE_NATIONAL_RAIL_API_KEY',
      name: 'National Rail API Key',
      description: 'Optional: UK rail data and train times',
      required: false,
      cost: 'FREE (registration required)',
      setupUrl: 'https://www.nationalrail.co.uk/developers',
      placeholder: 'your-national-rail-key',
      value: '',
      isValid: false,
      instructions: [
        'Go to National Rail Developers',
        'Register for developer access',
        'Get API credentials',
        'May take 24-48 hours for approval'
      ]
    },
    {
      id: 'VITE_VAPID_PUBLIC_KEY',
      name: 'VAPID Public Key',
      description: 'Optional: PWA push notifications (public key)',
      required: false,
      cost: 'FREE',
      setupUrl: 'https://vapidkeys.com/',
      placeholder: 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U',
      value: '',
      isValid: false,
      instructions: [
        'Go to VAPID Key Generator',
        'Click "Generate VAPID Keys"',
        'Copy the PUBLIC key',
        'Keep the private key secure'
      ]
    },
    {
      id: 'VITE_VAPID_PRIVATE_KEY',
      name: 'VAPID Private Key',
      description: 'Optional: PWA push notifications (private key - keep secure!)',
      required: false,
      cost: 'FREE',
      setupUrl: 'https://vapidkeys.com/',
      placeholder: 'VCxaZ7TmmZQCjPiNkRzekLiLAAO_c1rOMSMphkP6FWo',
      value: '',
      isValid: false,
      instructions: [
        'Use same generator as public key',
        'Copy the PRIVATE key',
        'NEVER share this key publicly',
        'Store securely in environment variables only'
      ]
    },
    {
      id: 'VITE_SENTRY_DSN',
      name: 'Sentry DSN',
      description: 'Optional: Error tracking and monitoring',
      required: false,
      cost: 'FREE tier available',
      setupUrl: 'https://sentry.io/',
      placeholder: 'https://your-dsn@sentry.io/project-id',
      value: '',
      isValid: false,
      instructions: [
        'Go to Sentry.io',
        'Create account and project',
        'Go to Project Settings → Client Keys (DSN)',
        'Copy the DSN URL'
      ]
    },
    {
      id: 'VITE_OPENAI_API_KEY',
      name: 'OpenAI API Key',
      description: 'Optional: Advanced AI chatbot with GPT-4',
      required: false,
      cost: 'Pay-per-use (very affordable)',
      setupUrl: 'https://platform.openai.com/api-keys',
      placeholder: 'sk-proj-...',
      value: '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',
      isValid: true,
      instructions: [
        'Go to OpenAI Platform',
        'Create account and add payment method',
        'Go to API Keys section',
        'Create new secret key',
        'Copy the key (starts with sk-)'
      ]
    },
    {
      id: 'VITE_COMPANIES_HOUSE_API_KEY',
      name: 'Companies House API Key',
      description: 'Important: Verify landlord company information',
      required: false,
      cost: 'FREE',
      setupUrl: 'https://developer.company-information.service.gov.uk/',
      placeholder: 'your-companies-house-api-key',
      value: '',
      isValid: false,
      instructions: [
        'Go to Companies House Developer Hub',
        'Register for free account',
        'Create new application',
        'Get API key for company data access'
      ]
    },
    {
      id: 'VITE_STRIPE_PUBLISHABLE_KEY',
      name: 'Stripe Publishable Key',
      description: 'Optional: Secure payment processing for rent',
      required: false,
      cost: '1.4% + 20p per transaction',
      setupUrl: 'https://dashboard.stripe.com/apikeys',
      placeholder: 'pk_test_...',
      value: '',
      isValid: false,
      instructions: [
        'Go to Stripe Dashboard',
        'Create account and verify business',
        'Go to Developers → API Keys',
        'Copy Publishable key (starts with pk_)'
      ]
    },
    {
      id: 'VITE_DID_API_KEY',
      name: 'D-ID API Key',
      description: 'Optional: AI video avatars for property tours',
      required: false,
      cost: 'FREE tier (20 credits)',
      setupUrl: 'https://studio.d-id.com/',
      placeholder: 'your-did-api-key',
      value: '',
      isValid: false,
      instructions: [
        'Go to D-ID Studio',
        'Create account',
        'Go to API section',
        'Generate API key for video avatars'
      ]
    },
    {
      id: 'VITE_RAPIDAPI_KEY',
      name: 'RapidAPI Key (Zoopla)',
      description: 'Important: Real UK property data via RapidAPI',
      required: false,
      cost: 'FREE tier (100 requests/hour)',
      setupUrl: 'https://rapidapi.com/',
      placeholder: '185071a5bfmsh670e0fb96e945b9p17c4aajsncc978fb964b2',
      value: '',
      isValid: false,
      instructions: [
        'Go to RapidAPI.com',
        'Create account: toploadzleadzai@gmail.com',
        'Subscribe to UK Properties API',
        'Copy your RapidAPI key'
      ]
    },
    {
      id: 'VITE_APIFY_TOKEN',
      name: 'Apify Token (OpenRent)',
      description: 'Important: Real rental property scraping via Apify',
      required: false,
      cost: 'Pay-per-use scraping',
      setupUrl: 'https://apify.com/',
      placeholder: 'your-apify-token',
      value: '',
      isValid: false,
      instructions: [
        'Go to Apify.com',
        'Create account: toploadzleadzai@gmail.com',
        'Go to Settings → Integrations',
        'Copy your API token',
        'Subscribe to vivid-softwares/openrent-scraper'
      ]
    }
  ]);

  // Load saved API keys from localStorage
  useEffect(() => {
    const savedKeys = localStorage.getItem('api-keys-config');
    if (savedKeys) {
      try {
        const parsed = JSON.parse(savedKeys);
        setApiKeys(prev => prev.map(key => ({
          ...key,
          value: parsed[key.id] || '',
          isValid: validateKey(key.id, parsed[key.id] || '')
        })));
      } catch (error) {
        console.warn('Failed to load saved API keys:', error);
      }
    }
  }, []);

  const validateKey = (keyId: string, value: string): boolean => {
    if (!value.trim()) return false;

    switch (keyId) {
      case 'VITE_GOOGLE_MAPS_API_KEY':
        return value.startsWith('AIza') && value.length > 30;
      case 'VITE_ANALYTICS_ID':
        return value.startsWith('G-') && value.length > 5;
      case 'VITE_SENTRY_DSN':
        return value.startsWith('https://') && value.includes('@sentry.io');
      case 'VITE_VAPID_PUBLIC_KEY':
      case 'VITE_VAPID_PRIVATE_KEY':
        return value.length > 40;
      case 'VITE_OPENAI_API_KEY':
        return value.startsWith('sk-') && value.length > 20;
      case 'VITE_STRIPE_PUBLISHABLE_KEY':
        return value.startsWith('pk_') && value.length > 20;
      case 'VITE_STRIPE_SECRET_KEY':
        return value.startsWith('sk_') && value.length > 20;
      case 'VITE_COMPANIES_HOUSE_API_KEY':
      case 'VITE_DID_API_KEY':
      case 'VITE_HUGGINGFACE_API_KEY':
        return value.length > 10;
      case 'VITE_RAPIDAPI_KEY':
        return value.length > 30 && value.includes('msh');
      case 'VITE_APIFY_TOKEN':
        return value.length > 20;
      default:
        return value.length > 5;
    }
  };

  const handleKeyChange = (keyId: string, value: string) => {
    setApiKeys(prev => prev.map(key => 
      key.id === keyId 
        ? { ...key, value, isValid: validateKey(keyId, value) }
        : key
    ));
  };

  const toggleShowKey = (keyId: string) => {
    setShowKeys(prev => ({ ...prev, [keyId]: !prev[keyId] }));
  };

  const saveKeys = () => {
    const keyValues = apiKeys.reduce((acc, key) => {
      if (key.value.trim()) {
        acc[key.id] = key.value.trim();
      }
      return acc;
    }, {} as Record<string, string>);

    localStorage.setItem('api-keys-config', JSON.stringify(keyValues));
    
    // Generate .env.local content
    generateEnvFile(keyValues);
    
    alert('API keys saved! Check the generated .env.local content below.');
  };

  const generateEnvFile = (keyValues: Record<string, string>) => {
    const envContent = Object.entries(keyValues)
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');
    
    const envElement = document.getElementById('env-output');
    if (envElement) {
      envElement.textContent = envContent;
    }
  };

  const copyEnvContent = () => {
    const envElement = document.getElementById('env-output');
    if (envElement && envElement.textContent) {
      navigator.clipboard.writeText(envElement.textContent);
      alert('Environment variables copied to clipboard!');
    }
  };

  const clearAllKeys = () => {
    if (confirm('Are you sure you want to clear all API keys?')) {
      setApiKeys(prev => prev.map(key => ({ ...key, value: '', isValid: false })));
      localStorage.removeItem('api-keys-config');
    }
  };

  const requiredKeys = apiKeys.filter(key => key.required);
  const optionalKeys = apiKeys.filter(key => !key.required);
  const validRequiredKeys = requiredKeys.filter(key => key.isValid).length;
  const totalValidKeys = apiKeys.filter(key => key.isValid).length;

  return (
    <div className="space-y-6" role="main" aria-labelledby="api-keys-title">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 id="api-keys-title" className="text-3xl font-bold flex items-center space-x-2">
            <Key className="w-8 h-8 text-blue-600" />
            <span>API Keys Configuration</span>
          </h1>
          <p className="text-gray-600 mt-2">
            Configure API keys to unlock additional features. The app works without any keys!
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Badge variant={validRequiredKeys === requiredKeys.length ? 'default' : 'secondary'}>
            {totalValidKeys}/{apiKeys.length} Configured
          </Badge>
          <Button onClick={saveKeys} className="flex items-center space-x-2">
            <Save className="w-4 h-4" />
            <span>Save Keys</span>
          </Button>
        </div>
      </div>

      {/* Status Overview */}
      <Card className="border-l-4 border-l-blue-500">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span>Configuration Status</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {validRequiredKeys}/{requiredKeys.length}
              </div>
              <div className="text-sm text-green-800">Required Keys</div>
            </div>
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {optionalKeys.filter(k => k.isValid).length}/{optionalKeys.length}
              </div>
              <div className="text-sm text-blue-800">Optional Keys</div>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {Math.round((totalValidKeys / apiKeys.length) * 100)}%
              </div>
              <div className="text-sm text-purple-800">Complete</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Required API Keys */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-orange-600" />
            <span>Required API Keys</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {requiredKeys.map((apiKey) => (
            <div key={apiKey.id} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-semibold flex items-center space-x-2">
                    <span>{apiKey.name}</span>
                    {apiKey.isValid && <CheckCircle className="w-4 h-4 text-green-600" />}
                  </h3>
                  <p className="text-sm text-gray-600">{apiKey.description}</p>
                  <div className="flex items-center space-x-4 mt-1">
                    <Badge variant="outline">{apiKey.cost}</Badge>
                    <a 
                      href={apiKey.setupUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 text-sm flex items-center space-x-1"
                    >
                      <span>Get API Key</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="relative">
                  <Input
                    type={showKeys[apiKey.id] ? 'text' : 'password'}
                    placeholder={apiKey.placeholder}
                    value={apiKey.value}
                    onChange={(e) => handleKeyChange(apiKey.id, e.target.value)}
                    className={`pr-10 ${apiKey.isValid ? 'border-green-500' : apiKey.value ? 'border-red-500' : ''}`}
                  />
                  <button
                    type="button"
                    onClick={() => toggleShowKey(apiKey.id)}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showKeys[apiKey.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                
                <details className="text-sm">
                  <summary className="cursor-pointer text-blue-600 hover:text-blue-800">
                    Setup Instructions
                  </summary>
                  <ol className="list-decimal list-inside mt-2 space-y-1 text-gray-600">
                    {apiKey.instructions.map((instruction, index) => (
                      <li key={index}>{instruction}</li>
                    ))}
                  </ol>
                </details>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Optional API Keys */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Key className="w-5 h-5 text-blue-600" />
            <span>Optional API Keys</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {optionalKeys.map((apiKey) => (
            <div key={apiKey.id} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-semibold flex items-center space-x-2">
                    <span>{apiKey.name}</span>
                    {apiKey.isValid && <CheckCircle className="w-4 h-4 text-green-600" />}
                  </h3>
                  <p className="text-sm text-gray-600">{apiKey.description}</p>
                  <div className="flex items-center space-x-4 mt-1">
                    <Badge variant="outline">{apiKey.cost}</Badge>
                    <a 
                      href={apiKey.setupUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 text-sm flex items-center space-x-1"
                    >
                      <span>Get API Key</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="relative">
                  <Input
                    type={showKeys[apiKey.id] ? 'text' : 'password'}
                    placeholder={apiKey.placeholder}
                    value={apiKey.value}
                    onChange={(e) => handleKeyChange(apiKey.id, e.target.value)}
                    className={`pr-10 ${apiKey.isValid ? 'border-green-500' : apiKey.value ? 'border-red-500' : ''}`}
                  />
                  <button
                    type="button"
                    onClick={() => toggleShowKey(apiKey.id)}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showKeys[apiKey.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                
                <details className="text-sm">
                  <summary className="cursor-pointer text-blue-600 hover:text-blue-800">
                    Setup Instructions
                  </summary>
                  <ol className="list-decimal list-inside mt-2 space-y-1 text-gray-600">
                    {apiKey.instructions.map((instruction, index) => (
                      <li key={index}>{instruction}</li>
                    ))}
                  </ol>
                </details>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Generated Environment File */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Generated .env.local File</span>
            <Button variant="outline" onClick={copyEnvContent} className="flex items-center space-x-2">
              <Copy className="w-4 h-4" />
              <span>Copy</span>
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm">
            <pre id="env-output" className="whitespace-pre-wrap">
              {apiKeys.filter(key => key.value.trim()).length === 0 
                ? '# No API keys configured yet\n# Add your API keys above and click "Save Keys"'
                : apiKeys
                    .filter(key => key.value.trim())
                    .map(key => `${key.id}=${key.value}`)
                    .join('\n')
              }
            </pre>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            Copy this content to your <code>.env.local</code> file in the project root.
          </p>
        </CardContent>
      </Card>

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button onClick={saveKeys} className="flex items-center space-x-2">
              <Save className="w-4 h-4" />
              <span>Save All Keys</span>
            </Button>
            
            <Button variant="outline" onClick={clearAllKeys} className="flex items-center space-x-2 text-red-600 hover:text-red-700">
              <AlertTriangle className="w-4 h-4" />
              <span>Clear All Keys</span>
            </Button>
          </div>
          
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-800 mb-2">💡 Pro Tips</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• The app works perfectly without any API keys using mock data</li>
              <li>• Google Maps API is the most valuable - enables real maps functionality</li>
              <li>• All APIs have generous free tiers</li>
              <li>• Keys are stored locally and never sent to any server</li>
              <li>• You can add keys later and the app will automatically use them</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default APIKeyManager;

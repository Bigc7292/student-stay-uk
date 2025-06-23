import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { accessibilityService } from '@/services/accessibilityService';
import { analyticsService } from '@/services/analyticsService';
import { authService, User as UserType } from '@/services/authService';
import { performanceService } from '@/services/performanceService';
import '@/styles/accessibility.css';
import { BarChart3, Bot, ChevronDown, FileText, HelpCircle, Home, Key, LogIn, MapPin, Menu, Navigation, PoundSterling, Search, Settings, Star, TestTube, User, Users, X, Zap } from 'lucide-react';
import { lazy, Suspense, useEffect, useState } from 'react';

// Lazy load components for better performance
const AuthDialog = lazy(() => import('@/components/AuthDialog'));
const UserProfile = lazy(() => import('@/components/UserProfile'));
// Import SearchForm directly for better reliability
import SearchForm from '@/components/SearchForm';
// Create a safe lazy loader for InteractiveMaps with fallback
const InteractiveMaps = lazy(async () => {
  try {
    return await import('@/components/InteractiveMaps');
  } catch (error) {
    console.warn('Failed to load InteractiveMaps, falling back to simple version:', error);
    try {
      return await import('@/components/InteractiveMapsSimple');
    } catch (fallbackError) {
      console.error('Failed to load fallback maps component:', fallbackError);
      return {
        default: () => (
          <div className="p-8 text-center">
            <h3 className="text-lg font-semibold text-red-600 mb-2">Maps Component Error</h3>
            <p className="text-gray-600">Unable to load Interactive Maps. Please refresh the page.</p>
          </div>
        )
      };
    }
  }
});
// Import AIChatbot directly to avoid dynamic import issues
import AIChatbot from '@/components/AIChatbot';
const ApplicationAssistant = lazy(() => import('@/components/ApplicationAssistant'));
const MaintenanceManager = lazy(() => import('@/components/MaintenanceManager'));
const BillSplitter = lazy(() => import('@/components/BillSplitter'));
const LegalGuidance = lazy(() => import('@/components/LegalGuidance'));
const ReviewAnalysis = lazy(() => import('@/components/ReviewAnalysis'));
const CommunityForum = lazy(() => import('@/components/CommunityForum'));
const DepositProtection = lazy(() => import('@/components/DepositProtection'));
const PWAInstallPrompt = lazy(() => import('@/components/PWAInstallPrompt'));
const AccessibilitySettings = lazy(() => import('@/components/AccessibilitySettings'));
const MonitoringDashboard = lazy(() => import('@/components/MonitoringDashboard'));
const APIKeyManager = lazy(() => import('@/components/APIKeyManager'));
const APIKeyTester = lazy(() => import('@/components/APIKeyTester'));
// Import RoutePlanner directly to avoid dynamic import issues
import RoutePlanner from '@/components/RoutePlanner';
// Import APITester directly for better reliability
import APITester from '@/components/APITester';
// Import GoogleMapsAPITester for testing the new API key
const GoogleMapsAPITester = lazy(() => import('@/components/GoogleMapsAPITester'));
// Import DebugAPIKey for debugging API key issues
const DebugAPIKey = lazy(() => import('@/components/DebugAPIKey'));
// Import SimpleMapsTest for basic maps testing
const SimpleMapsTest = lazy(() => import('@/components/SimpleMapsTest'));
// Import WorkingMaps for reliable maps implementation
const WorkingMaps = lazy(() => import('@/components/WorkingMaps'));
// Import DirectMaps for direct DOM manipulation approach
const DirectMaps = lazy(() => import('@/components/DirectMaps'));
// Import BrightDataTester for testing Web Unlocker

// Loading component for Suspense fallback
const LoadingSpinner = () => (
  <div className="flex items-center justify-center py-8">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    <span className="ml-2 text-gray-600">Loading...</span>
  </div>
);

const Index = () => {
  const [activeTab, setActiveTab] = useState('home');
  const [searchResults, setSearchResults] = useState([]);
  const [user, setUser] = useState<UserType | null>(null);
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showToolsDropdown, setShowToolsDropdown] = useState(false);

  // Real property data (no static images)
  const [realProperties, setRealProperties] = useState([]);

  useEffect(() => {
    // Load real property data using optimized service manager
    const loadRealProperties = async () => {
      try {
        const { propertyServiceManager } = await import('@/services/PropertyServiceManager');
        const result = await propertyServiceManager.searchProperties({
          location: 'Manchester',
          maxPrice: 1000,
          propertyType: 'studio'
        });

        if (result.properties.length > 0) {
          // Transform properties to match UI expectations
          const transformedProperties = result.properties.slice(0, 6).map(property => ({
            id: property.id,
            title: property.title,
            price: property.price,
            location: property.location,
            amenities: [...property.features, ...property.amenities].slice(0, 3),
            rating: (property.qualityScore + property.studentSuitability) / 20, // Convert to 5-star scale
            available: property.available,
            image: property.images[0] || null
          }));

          setRealProperties(transformedProperties);
          setSearchResults(transformedProperties);

          console.log(`✅ Loaded ${transformedProperties.length} properties from ${Object.keys(result.summary.sourceBreakdown).length} sources`);
        } else {
          // Use optimized fallback
          const fallbackData = [
            {
              id: 1,
              title: "Student Studio - City Centre",
              price: 650,
              location: "Manchester City Centre",
              amenities: ["WiFi", "Bills Included", "Near University"],
              rating: 4.5,
              available: true
            },
            {
              id: 2,
              title: "Shared House - University Quarter",
              price: 450,
              location: "University Quarter",
              amenities: ["WiFi", "Garden", "Student Friendly"],
              rating: 4.2,
              available: true
            }
          ];
          setRealProperties(fallbackData);
          setSearchResults(fallbackData);
        }
      } catch (error) {
        console.error('Failed to load properties:', error);
        // Minimal fallback
        const fallbackData = [
          {
            id: 1,
            title: "Student Accommodation Available",
            price: 500,
            location: "Manchester",
            amenities: ["WiFi", "Utilities Included"],
            rating: 4.0,
            available: true
          }
        ];
        setRealProperties(fallbackData);
        setSearchResults(fallbackData);
      }
    };

    loadRealProperties();
  }, []);

  // Auth state management
  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    setUser(currentUser);

    const unsubscribe = authService.onAuthStateChange((user) => {
      setUser(user);
    });

    return unsubscribe;
  }, []);

  // Performance monitoring
  useEffect(() => {
    // Mark app start
    performanceService.markEvent('app-start');

    // Mark when main content is loaded
    const timer = setTimeout(() => {
      performanceService.markEvent('content-loaded');
      performanceService.measureBetween('app-load-time', 'app-start', 'content-loaded');
    }, 100);

    return () => {
      clearTimeout(timer);
      // Clean up performance observers on unmount
      performanceService.disconnect();
    };
  }, []);

  // Accessibility initialization
  useEffect(() => {
    // Announce page load to screen readers
    accessibilityService.announceToScreenReader('StudentHome application loaded');

    // Set up keyboard shortcuts
    const handleKeyDown = (event: KeyboardEvent) => {
      // Alt + 1: Skip to main content
      if (event.altKey && event.key === '1') {
        event.preventDefault();
        accessibilityService.skipToMainContent();
      }
      // Alt + 2: Focus search
      if (event.altKey && event.key === '2') {
        event.preventDefault();
        setActiveTab('search');
        accessibilityService.announceToScreenReader('Navigated to search');
      }
      // Alt + 3: Focus maps
      if (event.altKey && event.key === '3') {
        event.preventDefault();
        setActiveTab('maps');
        accessibilityService.announceToScreenReader('Navigated to maps');
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Analytics initialization
  useEffect(() => {
    // Track initial page view
    analyticsService.trackPageView('home', 'StudentHome - AI-Powered Student Accommodation');

    // Set user properties if authenticated
    if (user) {
      analyticsService.setUserId(user.id);
      analyticsService.setUserProperties({
        userId: user.id,
        university: user.preferences.university,
        userType: 'student',
        preferences: user.preferences
      });
    }

    // Track app initialization
    analyticsService.trackEvent('app_initialized', {
      timestamp: new Date().toISOString(),
      user_agent: navigator.userAgent,
      screen_resolution: `${screen.width}x${screen.height}`
    });
  }, [user]);

  // Navigation event handling
  useEffect(() => {
    const handleNavigateToTab = (event: CustomEvent) => {
      const tabId = event.detail;
      if (tabId && typeof tabId === 'string') {
        setActiveTab(tabId);
        analyticsService.trackInteraction('navigation', 'custom_event', { tab: tabId });
      }
    };

    window.addEventListener('navigate-to-tab', handleNavigateToTab as EventListener);

    return () => {
      window.removeEventListener('navigate-to-tab', handleNavigateToTab as EventListener);
    };
  }, []);

  // Expose navigation function globally for debugging
  useEffect(() => {
    (window as Window & { navigateToTab?: (tabId: string) => void }).navigateToTab = (tabId: string) => {
      console.log(`🔄 Direct navigation to: ${tabId}`);
      setActiveTab(tabId);
    };
    return () => {
      delete (window as Window & { navigateToTab?: (tabId: string) => void }).navigateToTab;
    };
  }, []);

  // Primary navigation items (always visible)
  const primaryNavItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'search', label: 'Search', icon: Search },
    { id: 'maps', label: 'Maps', icon: MapPin },
    { id: 'ai-chat', label: 'AI Assistant', icon: Bot }
  ];

  // Secondary navigation items grouped by category
  const secondaryNavItems = {
    'Student Services': [
      { id: 'routes', label: 'Route Planner', icon: Navigation },
      { id: 'reviews', label: 'Reviews', icon: Star },
      { id: 'application', label: 'Apply', icon: FileText },
      { id: 'forum', label: 'Community', icon: Users }
    ],
    'Property Management': [
      { id: 'maintenance', label: 'Maintenance', icon: Home },
      { id: 'bills', label: 'Bills', icon: PoundSterling },
      { id: 'legal', label: 'Legal Help', icon: HelpCircle },
      { id: 'deposit', label: 'Deposit', icon: FileText }
    ],
    'Developer Tools': [
      { id: 'property-test', label: 'Property APIs', icon: Home },
      { id: 'api-test', label: 'Test APIs', icon: TestTube },
      { id: 'maps-test', label: 'Maps API Test', icon: MapPin },
      { id: 'bright-data-test', label: 'Bright Data Test', icon: Zap },
      { id: 'api-keys', label: 'API Keys', icon: Key },
      { id: 'monitoring', label: 'Monitoring', icon: BarChart3 }
    ],
    'Settings': [
      { id: 'accessibility', label: 'Accessibility', icon: Settings }
    ]
  };

  // All navigation items combined for mobile menu
  const allNavItems = [
    ...primaryNavItems,
    ...Object.values(secondaryNavItems).flat()
  ];

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showToolsDropdown) {
        setShowToolsDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showToolsDropdown]);

  // Handle navigation clicks more robustly
  const handleNavigation = (tabId: string, label: string) => {
    console.log(`🔄 Navigation clicked: ${label} (${tabId})`);
    try {
      setActiveTab(tabId);
      setShowToolsDropdown(false);
      setShowMobileMenu(false);
      accessibilityService.announceToScreenReader(`Navigated to ${label}`);
      analyticsService.trackPageView(tabId, `StudentHome - ${label}`);
      analyticsService.trackInteraction('navigation', 'dropdown_click', { tab: tabId, label: label });
    } catch (error) {
      console.error('Navigation error:', error);
    }
  };

  const renderContent = () => {
    console.log(`🎯 Current active tab: ${activeTab}`);
    const getComponent = () => {
      switch (activeTab) {
        case 'search':
          return <SearchForm searchResults={searchResults} />;
        case 'maps':
          return <InteractiveMaps />;
        case 'reviews':
          return <ReviewAnalysis />;
        case 'application':
          return <ApplicationAssistant />;
        case 'maintenance':
          return <MaintenanceManager />;
        case 'bills':
          return <BillSplitter />;
        case 'legal':
          return <LegalGuidance />;
        case 'forum':
          return <CommunityForum />;
        case 'deposit':
          return <DepositProtection />;
        case 'ai-chat':
          return <AIChatbot />;
        case 'accessibility':
          return <AccessibilitySettings />;
        case 'monitoring':
          return <MonitoringDashboard />;
        case 'api-keys':
          return <APIKeyManager />;
        case 'api-test':
          return <APIKeyTester />;
        case 'maps-test':
          return <GoogleMapsAPITester />;
        case 'debug-api':
          return <DebugAPIKey />;
        case 'simple-maps':
          return <SimpleMapsTest />;
        case 'working-maps':
          return <WorkingMaps />;
        case 'direct-maps':
          return <DirectMaps />;
        case 'routes':
          return <RoutePlanner />;
        case 'property-test':
          console.log('🔄 Loading Property APIs tab');
          return <APITester />;
        default:
          return (
            <div className="space-y-8">
            {/* Quick Navigation for Testing */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-3 text-yellow-800">🧪 Quick Access for Testing</h3>
              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={() => {
                    console.log('🧪 Property APIs clicked');
                    setActiveTab('property-test');
                  }}
                  variant="outline"
                  size="sm"
                >
                  Property APIs
                </Button>
                <Button
                  onClick={() => {
                    console.log('🧪 API Keys clicked');
                    setActiveTab('api-keys');
                  }}
                  variant="outline"
                  size="sm"
                >
                  API Keys
                </Button>
                <Button
                  onClick={() => {
                    console.log('🧪 Route Planner clicked');
                    setActiveTab('routes');
                  }}
                  variant="outline"
                  size="sm"
                >
                  Route Planner
                </Button>
                <Button
                  onClick={() => {
                    console.log('🧪 AI Chat clicked');
                    setActiveTab('ai-chat');
                  }}
                  variant="outline"
                  size="sm"
                >
                  AI Assistant
                </Button>
                <Button
                  onClick={() => {
                    console.log('🧪 Maps API Test clicked');
                    setActiveTab('maps-test');
                  }}
                  variant="outline"
                  size="sm"
                  className="bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
                >
                  🗺️ Test New Maps API
                </Button>
                <Button
                  onClick={() => {
                    console.log('🔍 Debug API clicked');
                    setActiveTab('debug-api');
                  }}
                  variant="outline"
                  size="sm"
                  className="bg-yellow-50 border-yellow-200 text-yellow-700 hover:bg-yellow-100"
                >
                  🔍 Debug API Key
                </Button>
                <Button
                  onClick={() => {
                    console.log('🗺️ Simple Maps Test clicked');
                    setActiveTab('simple-maps');
                  }}
                  variant="outline"
                  size="sm"
                  className="bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100"
                >
                  🗺️ Simple Maps Test
                </Button>
                <Button
                  onClick={() => {
                    console.log('🗺️ Working Maps clicked');
                    setActiveTab('working-maps');
                  }}
                  variant="outline"
                  size="sm"
                  className="bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
                >
                  ✅ Working Maps
                </Button>
                <Button
                  onClick={() => {
                    console.log('🗺️ Direct Maps clicked');
                    setActiveTab('direct-maps');
                  }}
                  variant="outline"
                  size="sm"
                  className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
                >
                  🎯 Direct Maps
                </Button>
              </div>
            </div>

            {/* Hero Section */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-xl p-8 text-center">
              <h1 className="text-4xl font-bold mb-4">Find Your Perfect Student Home</h1>
              <p className="text-xl mb-6">AI-powered accommodation search for UK university students</p>
              <div className="flex flex-wrap justify-center gap-3">
                <Button 
                  onClick={() => setActiveTab('search')} 
                  className="bg-white text-blue-600 hover:bg-gray-100 px-6 py-3 text-lg"
                >
                  Start Searching
                </Button>
                <Button 
                  onClick={() => setActiveTab('maps')} 
                  className="bg-white text-blue-600 hover:bg-gray-100 px-6 py-3 text-lg"
                >
                  Explore Maps
                </Button>
                <Button
                  onClick={() => setActiveTab('ai-chat')}
                  className="bg-white text-blue-600 hover:bg-gray-100 px-6 py-3 text-lg"
                >
                  Ask AI Assistant
                </Button>
                <Button
                  onClick={() => {
                    console.log('🧪 Direct API Test button clicked');
                    setActiveTab('property-test');
                  }}
                  className="bg-white text-blue-600 hover:bg-gray-100 px-6 py-3 text-lg"
                >
                  Test Property APIs
                </Button>
              </div>
            </div>

            {/* Key Features */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader className="text-center">
                  <Search className="w-8 h-8 mx-auto text-blue-600 mb-2" />
                  <CardTitle className="text-lg">AI Search</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">Smart recommendations based on your preferences and budget</p>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader className="text-center">
                  <MapPin className="w-8 h-8 mx-auto text-green-600 mb-2" />
                  <CardTitle className="text-lg">Interactive Maps</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">Explore universities and accommodations with Street View and amenity mapping</p>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader className="text-center">
                  <Star className="w-8 h-8 mx-auto text-yellow-600 mb-2" />
                  <CardTitle className="text-lg">Review Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">AI-powered sentiment analysis of accommodation reviews</p>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader className="text-center">
                  <Bot className="w-8 h-8 mx-auto text-purple-600 mb-2" />
                  <CardTitle className="text-lg">AI Assistant</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">24/7 support for all your student housing questions and guidance</p>
                </CardContent>
              </Card>
            </div>

            {/* Featured Accommodations */}
            <div>
              <h2 className="text-2xl font-bold mb-6">Featured Accommodations</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {realProperties.map((accommodation) => (
                  <Card key={accommodation.id} className="hover:shadow-lg transition-shadow">
                    <div className="relative">
                      {accommodation.image ? (
                        <img
                          src={accommodation.image}
                          alt={accommodation.title}
                          className="w-full h-48 object-cover rounded-t-lg"
                        />
                      ) : (
                        <div className="w-full h-48 bg-gradient-to-br from-blue-100 to-blue-200 rounded-t-lg flex items-center justify-center">
                          <Home className="w-16 h-16 text-blue-400" />
                        </div>
                      )}
                      <Badge
                        className={`absolute top-2 right-2 ${accommodation.available ? 'bg-green-500' : 'bg-red-500'}`}
                      >
                        {accommodation.available ? 'Available' : 'Full'}
                      </Badge>
                    </div>
                    <CardHeader>
                      <CardTitle className="text-lg">{accommodation.title}</CardTitle>
                      <CardDescription>{accommodation.location}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-2xl font-bold text-blue-600">£{accommodation.price}/week</span>
                        <div className="flex items-center">
                          <Star className="w-4 h-4 text-yellow-400 fill-current" />
                          <span className="ml-1 text-sm">{accommodation.rating}</span>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1 mb-3">
                        {accommodation.amenities.map((amenity) => (
                          <Badge key={amenity} variant="secondary" className="text-xs">
                            {amenity}
                          </Badge
                          >
                        ))}
                      </div>
                      <Button className="w-full" disabled={!accommodation.available}>
                        {accommodation.available ? 'View Details' : 'Join Waitlist'}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Pain Points Addressed */}
            <div className="bg-gray-50 rounded-xl p-6">
              <h2 className="text-2xl font-bold mb-6 text-center">How We Solve Student Housing Problems</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-red-500 rounded-full mt-2"></div>
                    <div>
                      <h4 className="font-semibold text-red-600">Problem: High Costs</h4>
                      <p className="text-sm text-gray-600">Average £3,100/month for shared housing</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-red-500 rounded-full mt-2"></div>
                    <div>
                      <h4 className="font-semibold text-red-600">Problem: Limited Availability</h4>
                      <p className="text-sm text-gray-600">Scarcity of university hall spaces</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-red-500 rounded-full mt-2"></div>
                    <div>
                      <h4 className="font-semibold text-red-600">Problem: Complex Documentation</h4>
                      <p className="text-sm text-gray-600">Overwhelming application requirements</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                    <div>
                      <h4 className="font-semibold text-green-600">Solution: Price Alerts & Budgeting</h4>
                      <p className="text-sm text-gray-600">AI-powered price predictions and bill splitting</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                    <div>
                      <h4 className="font-semibold text-green-600">Solution: Smart Search & Waitlists</h4>
                      <p className="text-sm text-gray-600">Real-time availability tracking and notifications</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                    <div>
                      <h4 className="font-semibold text-green-600">Solution: Application Assistant</h4>
                      <p className="text-sm text-gray-600">Step-by-step guidance and document help</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      }
    };

    // Components that need Suspense (still lazy-loaded)
    const suspenseComponents = ['maps', 'reviews', 'application', 'maintenance', 'bills', 'legal', 'forum', 'deposit', 'accessibility', 'monitoring', 'api-keys', 'api-test', 'maps-test', 'debug-api', 'simple-maps', 'working-maps', 'direct-maps'];

    if (suspenseComponents.includes(activeTab)) {
      return (
        <Suspense fallback={<LoadingSpinner />}>
          {getComponent()}
        </Suspense>
      );
    }

    return getComponent();
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Skip to main content link */}
      <a
        href="#main-content"
        className="skip-link sr-only-focusable"
        onClick={(e) => {
          e.preventDefault();
          accessibilityService.skipToMainContent();
        }}
      >
        Skip to main content
      </a>

      {/* Navigation */}
      <nav className="bg-white border-b sticky top-0 z-50" role="navigation" aria-label="Main navigation">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center space-x-2">
              <Home className="w-8 h-8 text-blue-600" aria-hidden="true" />
              <span className="text-xl font-bold text-gray-900">StudentHome</span>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center space-x-4">
              {/* Primary Navigation */}
              <div className="flex space-x-1">
                {primaryNavItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id);
                        accessibilityService.announceToScreenReader(`Navigated to ${item.label}`);
                        analyticsService.trackPageView(item.id, `StudentHome - ${item.label}`);
                        analyticsService.trackInteraction('navigation', 'tab_click', { tab: item.id, label: item.label });
                      }}
                      className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        activeTab === item.id
                          ? 'bg-blue-100 text-blue-700'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                      }`}
                      aria-current={activeTab === item.id ? 'page' : undefined}
                      aria-label={`Navigate to ${item.label}`}
                    >
                      <Icon className="w-4 h-4" aria-hidden="true" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Tools Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowToolsDropdown(!showToolsDropdown)}
                  className="flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                  aria-expanded={!!showToolsDropdown}
                  aria-haspopup="true"
                >
                  <Settings className="w-4 h-4" />
                  <span>More Tools</span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${showToolsDropdown ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Menu */}
                {showToolsDropdown && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-md shadow-lg border border-gray-200 z-50">
                    {Object.entries(secondaryNavItems).map(([category, items]) => (
                      <div key={category} className="py-2">
                        <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100">
                          {category}
                        </div>
                        {items.map((item) => {
                          const Icon = item.icon;
                          return (
                            <button
                              type="button"
                              key={item.id}
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleNavigation(item.id, item.label);
                              }}
                              data-tab={item.id}
                              className={`w-full flex items-center space-x-2 px-4 py-2 text-sm hover:bg-gray-50 transition-colors ${
                                activeTab === item.id ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                              }`}
                            >
                              <Icon className="w-4 h-4" />
                              <span>{item.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* User Authentication */}
            <div className="flex items-center space-x-2">
              {user ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowUserProfile(true)}
                  className="flex items-center space-x-2"
                >
                  <User className="w-4 h-4" />
                  <span className="hidden sm:inline">{user.name}</span>
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAuthDialog(true)}
                  className="flex items-center space-x-2"
                >
                  <LogIn className="w-4 h-4" />
                  <span className="hidden sm:inline">Sign In</span>
                </Button>
              )}

              {/* Mobile Menu Button */}
              <div className="lg:hidden">
                <button
                  type="button"
                  onClick={() => setShowMobileMenu(!showMobileMenu)}
                  className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                  aria-expanded={!!showMobileMenu}
                  aria-label="Toggle mobile menu"
                >
                  {showMobileMenu ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {showMobileMenu && (
          <div className="lg:hidden border-t border-gray-200 bg-white">
            <div className="px-4 py-2 space-y-1 max-h-96 overflow-y-auto">
              {/* Primary Items */}
              <div className="space-y-1">
                {primaryNavItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      type="button"
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id);
                        setShowMobileMenu(false);
                        accessibilityService.announceToScreenReader(`Navigated to ${item.label}`);
                        analyticsService.trackPageView(item.id, `StudentHome - ${item.label}`);
                        analyticsService.trackInteraction('navigation', 'mobile_click', { tab: item.id, label: item.label });
                      }}
                      className={`w-full flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        activeTab === item.id
                          ? 'bg-blue-100 text-blue-700'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Secondary Items by Category */}
              {Object.entries(secondaryNavItems).map(([category, items]) => (
                <div key={category} className="pt-4">
                  <div className="px-3 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {category}
                  </div>
                  <div className="space-y-1">
                    {items.map((item) => {
                      const Icon = item.icon;
                      return (
                        <button
                          key={item.id}
                          onClick={() => {
                            setActiveTab(item.id);
                            setShowMobileMenu(false);
                            accessibilityService.announceToScreenReader(`Navigated to ${item.label}`);
                            analyticsService.trackPageView(item.id, `StudentHome - ${item.label}`);
                            analyticsService.trackInteraction('navigation', 'mobile_click', { tab: item.id, label: item.label });
                          }}
                          className={`w-full flex items-center space-x-2 px-3 py-2 rounded-md text-sm transition-colors ${
                            activeTab === item.id
                              ? 'bg-blue-100 text-blue-700'
                              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                          <span>{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main
        id="main-content"
        className="max-w-7xl mx-auto px-4 py-6"
        role="main"
        aria-label="Main content"
        tabIndex={-1}
      >
        {renderContent()}
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-6">
            <div>
              <h3 className="font-bold mb-3">StudentHome</h3>
              <p className="text-sm text-gray-400">Making student accommodation search simple and smart.</p>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Features</h4>
              <ul className="space-y-1 text-sm text-gray-400">
                <li>AI Search</li>
                <li>Review Analysis</li>
                <li>Bill Management</li>
                <li>Legal Guidance</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Support</h4>
              <ul className="space-y-1 text-sm text-gray-400">
                <li>Help Center</li>
                <li>Contact Us</li>
                <li>Community Forum</li>
                <li>Legal Resources</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3">For Students</h4>
              <ul className="space-y-1 text-sm text-gray-400">
                <li>International Students</li>
                <li>First Year Guide</li>
                <li>Tenancy Rights</li>
                <li>Deposit Protection</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-6 pt-6 text-center text-sm text-gray-400">
            <p>&copy; 2024 StudentHome. Built to solve real student accommodation problems.</p>
          </div>
        </div>
      </footer>

      {/* Auth Dialogs */}
      <Suspense fallback={null}>
        <AuthDialog
          open={showAuthDialog}
          onOpenChange={setShowAuthDialog}
          onSuccess={() => {
            // Optional: Show welcome message or redirect
            console.log('User authenticated successfully');
          }}
        />

        <UserProfile
          open={showUserProfile}
          onOpenChange={setShowUserProfile}
        />

        {/* PWA Install Prompt */}
        <PWAInstallPrompt />
      </Suspense>
    </div>
  );
};

export default Index;

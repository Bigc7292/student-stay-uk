import React, { useState, useEffect, lazy, Suspense } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Home, Search, MapPin, Star, Bot, Navigation, FileText, Users, 
  PoundSterling, HelpCircle, Settings, Key, BarChart3, TestTube,
  Menu, X, ChevronDown, User, LogOut, Bell, MessageSquare
} from 'lucide-react';
import { authService } from '@/services/authService';
import { analyticsService } from '@/services/analyticsService';
import { performanceService } from '@/services/performanceService';
import { accessibilityService } from '@/services/accessibilityService';
import type { User as UserType } from '@/types/auth';

// Lazy load components for better performance
const SearchForm = lazy(() => import('@/components/SearchForm'));
const InteractiveMaps = lazy(() => import('@/components/InteractiveMaps'));
const ReviewAnalysis = lazy(() => import('@/components/ReviewAnalysis'));
const ApplicationAssistant = lazy(() => import('@/components/ApplicationAssistant'));
const MaintenanceManager = lazy(() => import('@/components/MaintenanceManager'));
const BillSplitter = lazy(() => import('@/components/BillSplitter'));
const LegalGuidance = lazy(() => import('@/components/LegalGuidance'));
const AIChatbot = lazy(() => import('@/components/AIChatbot'));
const CommunityForum = lazy(() => import('@/components/CommunityForum'));
const DepositProtection = lazy(() => import('@/components/DepositProtection'));
const PWAInstallPrompt = lazy(() => import('@/components/PWAInstallPrompt'));
const AccessibilitySettings = lazy(() => import('@/components/AccessibilitySettings'));
const MonitoringDashboard = lazy(() => import('@/components/MonitoringDashboard'));
const APIKeyManager = lazy(() => import('@/components/APIKeyManager'));
const APIKeyTester = lazy(() => import('@/components/APIKeyTester'));
const RoutePlanner = lazy(() => import('@/components/RoutePlanner'));
const APITester = lazy(() => import('@/components/APITester'));
const ComprehensiveTestSuite = lazy(() => import('@/components/ComprehensiveTestSuite'));

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

  // Mock accommodation data
  const mockAccommodations = [
    {
      id: 1,
      title: "Modern Student Studio - City Centre",
      price: 180,
      location: "Manchester City Centre",
      image: "https://images.unsplash.com/photo-1721322800607-8c38375eef04?w=400&h=300&fit=crop",
      amenities: ["Wi-Fi", "Laundry", "24/7 Security"],
      rating: 4.5,
      available: true
    },
    {
      id: 2,
      title: "Shared House - Near Campus",
      price: 120,
      location: "University Quarter",
      image: "https://images.unsplash.com/photo-1487958449943-2429e8be8625?w=400&h=300&fit=crop",
      amenities: ["Wi-Fi", "Parking", "Garden"],
      rating: 4.2,
      available: true
    },
    {
      id: 3,
      title: "Purpose-Built Student Accommodation",
      price: 200,
      location: "Student Village",
      image: "https://images.unsplash.com/photo-1524230572899-a752b3835840?w=400&h=300&fit=crop",
      amenities: ["Wi-Fi", "Gym", "Study Rooms"],
      rating: 4.7,
      available: false
    }
  ];

  useEffect(() => {
    setSearchResults(mockAccommodations);
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
    (window as any).navigateToTab = (tabId: string) => {
      console.log(`🔄 Direct navigation to: ${tabId}`);
      setActiveTab(tabId);
    };
    return () => {
      delete (window as any).navigateToTab;
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
      { id: 'api-keys', label: 'API Keys', icon: Key },
      { id: 'monitoring', label: 'Monitoring', icon: BarChart3 },
      { id: 'comprehensive-test', label: 'Full Test Suite', icon: TestTube }
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
        case 'routes':
          return <RoutePlanner />;
        case 'property-test':
          console.log('🔄 Loading Property APIs tab');
          return <APITester />;
        case 'comprehensive-test':
          console.log('🔄 Loading Comprehensive Test Suite');
          return <ComprehensiveTestSuite />;
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
                    console.log('🧪 Comprehensive Test Suite clicked');
                    setActiveTab('comprehensive-test');
                  }}
                  variant="outline"
                  size="sm"
                >
                  Full Test Suite
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
              </div>
            </div>
            {/* Rest of home content would continue here... */}
            </div>
          );
      }
    };

    return (
      <Suspense fallback={<LoadingSpinner />}>
        {getComponent()}
      </Suspense>
    );
  };

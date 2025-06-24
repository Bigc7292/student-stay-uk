
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Accessibility,
  AlertTriangle,
  Bot,
  Calculator,
  Camera,
  ChevronDown,
  CreditCard,
  Eye,
  FileText,
  Home,
  Key,
  MapPin,
  Menu,
  MessageCircle,
  Monitor,
  Navigation,
  Satellite,
  Search,
  Settings,
  Shield,
  TestTube,
  TrendingUp,
  X
} from 'lucide-react';
import { Suspense, lazy, useState } from 'react';

// Lazy load components for better performance
const PropertyCarousel = lazy(() => import('@/components/PropertyCarousel'));
const PropertySearch = lazy(() => import('@/components/CleanPropertySearch'));
// Import AIChatbot directly to fix dynamic import issue
import AIChatbot from '@/components/AIChatbot';
const InteractiveMaps = lazy(() => import('@/components/InteractiveMaps'));

const ApplicationAssistant = lazy(() => import('@/components/CleanApplicationAssistant'));
const MaintenanceManager = lazy(() => import('@/components/MaintenanceManager'));
const BillSplitter = lazy(() => import('@/components/BillSplitter'));
const LegalGuidance = lazy(() => import('@/components/LegalGuidance'));
const CommunityForum = lazy(() => import('@/components/CommunityForum'));
const DepositProtection = lazy(() => import('@/components/DepositProtection'));
const AccessibilitySettings = lazy(() => import('@/components/AccessibilitySettings'));
const MonitoringDashboard = lazy(() => import('@/components/MonitoringDashboard'));
const APIKeyManager = lazy(() => import('@/components/APIKeyManager'));
const APITester = lazy(() => import('@/components/APITester'));
const GoogleMapsAPITester = lazy(() => import('@/components/GoogleMapsAPITester'));
const DebugAPIKey = lazy(() => import('@/components/DebugAPIKey'));
const SimpleMapsTest = lazy(() => import('@/components/SimpleMapsTest'));
const WorkingMaps = lazy(() => import('@/components/WorkingMaps'));
const DirectMaps = lazy(() => import('@/components/DirectMaps'));

// Loading component for Suspense fallback
const LoadingSpinner = () => (
  <div className="flex items-center justify-center h-64">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
  </div>
);

const Index = () => {
  const [activeTab, setActiveTab] = useState('home');
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showToolsDropdown, setShowToolsDropdown] = useState(false);
  const [showAIAssistant, setShowAIAssistant] = useState(false);

  // Navigation items
  const primaryNavItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'search', label: 'Search Properties', icon: Search },
    { id: 'maps', label: 'Interactive Maps', icon: MapPin },
    { id: 'application', label: 'Application Assistant', icon: FileText },
  ];

  const toolsNavItems = [
    { id: 'maintenance', label: 'Maintenance', icon: Settings },
    { id: 'bills', label: 'Bill Splitter', icon: Calculator },
    { id: 'legal', label: 'Legal Guidance', icon: Shield },
    { id: 'forum', label: 'Community Forum', icon: MessageCircle },
    { id: 'deposit', label: 'Deposit Protection', icon: CreditCard },
  ];

  const adminNavItems = [
    { id: 'accessibility', label: 'Accessibility', icon: Accessibility },
    { id: 'monitoring', label: 'Performance', icon: Monitor },
    { id: 'api-keys', label: 'API Keys', icon: Key },
    { id: 'api-test', label: 'API Testing', icon: TestTube },
    { id: 'maps-test', label: 'Maps Testing', icon: Navigation },
    { id: 'debug-api', label: 'Debug API', icon: AlertTriangle },
    { id: 'simple-maps', label: 'Simple Maps', icon: Eye },
    { id: 'working-maps', label: 'Working Maps', icon: Satellite },
    { id: 'direct-maps', label: 'Direct Maps', icon: Camera },
  ];

  const renderContent = () => {
    // Components that need Suspense (still lazy-loaded)
    const suspenseComponents = ['maps', 'application', 'maintenance', 'bills', 'legal', 'forum', 'deposit', 'accessibility', 'monitoring', 'api-keys', 'api-test', 'maps-test', 'debug-api', 'simple-maps', 'working-maps', 'direct-maps'];

    if (suspenseComponents.includes(activeTab)) {
      return (
        <Suspense fallback={<LoadingSpinner />}>
          {(() => {
            switch (activeTab) {
              case 'maps':
                return <InteractiveMaps />;
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
              case 'accessibility':
                return <AccessibilitySettings />;
              case 'monitoring':
                return <MonitoringDashboard />;
              case 'api-keys':
                return <APIKeyManager />;
              case 'api-test':
                return <APITester />;
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
              default:
                return <div>Component not found</div>;
            }
          })()}
        </Suspense>
      );
    }

    switch (activeTab) {
      case 'home':
        return (
          <div className="space-y-8">
            {/* Hero Section */}
            <section className="py-12 px-4">
              <div className="max-w-4xl mx-auto text-center">
                <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                  Find Your Perfect
                  <span className="text-blue-600"> Student Home</span>
                </h1>
                <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
                  AI-powered platform for UK students to find, compare, and secure accommodation near universities.
                </p>

                {/* Feature Badges */}
                <div className="flex flex-wrap justify-center gap-3 mb-8">
                  <Badge variant="outline" className="flex items-center space-x-1">
                    <Bot className="w-3 h-3" />
                    <span>AI Assistant</span>
                  </Badge>
                  <Badge variant="outline" className="flex items-center space-x-1">
                    <TrendingUp className="w-3 h-3" />
                    <span>Live Data</span>
                  </Badge>
                  <Badge variant="outline" className="flex items-center space-x-1">
                    <Shield className="w-3 h-3" />
                    <span>Safety Info</span>
                  </Badge>
                  <Badge variant="outline" className="flex items-center space-x-1">
                    <MapPin className="w-3 h-3" />
                    <span>Interactive Maps</span>
                  </Badge>
                </div>

                {/* Quick Action Buttons */}
                <div className="flex flex-wrap justify-center gap-4 mb-8">
                  <Button
                    onClick={() => setActiveTab('search')}
                    size="lg"
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Search className="w-4 h-4 mr-2" />
                    Start Searching
                  </Button>
                  <Button
                    onClick={() => setShowAIAssistant(true)}
                    size="lg"
                    variant="outline"
                  >
                    <Bot className="w-4 h-4 mr-2" />
                    Ask AI Assistant
                  </Button>
                </div>
              </div>
            </section>

            {/* Live Properties Carousel */}
            <section className="py-8 px-4">
              <Suspense fallback={<LoadingSpinner />}>
                <PropertyCarousel maxProperties={8} />
              </Suspense>
            </section>
          </div>
        );

      case 'search':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Search Student Properties
              </h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Use our advanced AI-powered search to find the perfect accommodation with real-time data and personalized recommendations.
              </p>
            </div>
            <Suspense fallback={<LoadingSpinner />}>
              <PropertySearch />
            </Suspense>
          </div>
        );

      default:
        return (
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Page Not Found</h2>
            <p className="text-gray-600 mb-6">The requested page could not be found.</p>
            <Button onClick={() => setActiveTab('home')}>
              <Home className="w-4 h-4 mr-2" />
              Go Home
            </Button>
          </div>
        );
    }
  };
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header with Navigation */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Home className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">StudentHomes</h1>
                <p className="text-xs text-gray-500">AI-Powered Student Platform</p>
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center space-x-1">
              {/* Primary Navigation */}
              <div className="flex items-center space-x-1">
                {primaryNavItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id);
                        console.log(`🎯 Current active tab: ${item.id}`);
                      }}
                      className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
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

              {/* Tools Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowToolsDropdown(!showToolsDropdown)}
                  className="flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                  aria-expanded={showToolsDropdown}
                >
                  <Settings className="w-4 h-4" />
                  <span>Tools</span>
                  <ChevronDown className="w-3 h-3" />
                </button>

                {showToolsDropdown && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-50">
                    <div className="py-1">
                      <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Student Tools
                      </div>
                      {toolsNavItems.map((item) => {
                        const Icon = item.icon;
                        return (
                          <button
                            key={item.id}
                            onClick={() => {
                              setActiveTab(item.id);
                              setShowToolsDropdown(false);
                              console.log(`🎯 Current active tab: ${item.id}`);
                            }}
                            className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          >
                            <Icon className="w-4 h-4 mr-3" />
                            {item.label}
                          </button>
                        );
                      })}

                      <div className="border-t border-gray-100 mt-1 pt-1">
                        <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Admin & Testing
                        </div>
                        {adminNavItems.map((item) => {
                          const Icon = item.icon;
                          return (
                            <button
                              key={item.id}
                              onClick={() => {
                                setActiveTab(item.id);
                                setShowToolsDropdown(false);
                                console.log(`🎯 Current active tab: ${item.id}`);
                              }}
                              className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            >
                              <Icon className="w-4 h-4 mr-3" />
                              {item.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </nav>

            {/* Right Side Actions */}
            <div className="flex items-center space-x-4">
              <Badge variant="outline" className="text-xs hidden sm:flex">
                🔴 Live Data
              </Badge>

              {/* AI Assistant Button */}
              <Button
                onClick={() => setShowAIAssistant(true)}
                variant="outline"
                size="sm"
                className="hidden sm:flex items-center space-x-2"
              >
                <Bot className="w-4 h-4" />
                <span>AI Assistant</span>
              </Button>

              {/* Mobile Menu Button */}
              <div className="lg:hidden">
                <button
                  type="button"
                  onClick={() => setShowMobileMenu(!showMobileMenu)}
                  className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                  aria-expanded={showMobileMenu}
                >
                  {showMobileMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </div>

          {/* Mobile Navigation */}
          {showMobileMenu && (
            <div className="lg:hidden border-t border-gray-200 py-4">
              <div className="space-y-1">
                {primaryNavItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id);
                        setShowMobileMenu(false);
                        console.log(`🎯 Current active tab: ${item.id}`);
                      }}
                      className={`flex items-center w-full space-x-3 px-3 py-2 rounded-md text-sm font-medium ${
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

                <div className="border-t border-gray-200 mt-4 pt-4">
                  <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Tools
                  </div>
                  {[...toolsNavItems, ...adminNavItems].map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          setActiveTab(item.id);
                          setShowMobileMenu(false);
                          console.log(`🎯 Current active tab: ${item.id}`);
                        }}
                        className="flex items-center w-full space-x-3 px-3 py-2 rounded-md text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                      >
                        <Icon className="w-4 h-4" />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {renderContent()}
        </div>
      </main>

      {/* AI Assistant Modal */}
      {showAIAssistant && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl h-full max-h-[90vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b bg-white">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">AI Assistant</h2>
                  <p className="text-sm text-gray-500">Get help with accommodation search</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAIAssistant(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex-1 overflow-hidden">
              <AIChatbot />
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 px-4 mt-auto">
        <div className="max-w-6xl mx-auto">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Home className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold">StudentHomes</span>
            </div>
            <p className="text-gray-400 text-sm mb-4">
              AI-Powered Student Accommodation Platform • Real-time data for students
            </p>
            <div className="flex justify-center space-x-6 text-sm text-gray-400">
              <button className="hover:text-white">Privacy Policy</button>
              <button className="hover:text-white">Terms of Service</button>
              <button className="hover:text-white">Contact</button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;

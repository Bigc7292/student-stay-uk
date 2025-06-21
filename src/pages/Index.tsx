import React, { useState, useEffect } from 'react';
import { Search, Home, MessageSquare, Users, FileText, PoundSterling, HelpCircle, Star, MapPin, Bot } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import SearchForm from '@/components/SearchForm';
import ReviewAnalysis from '@/components/ReviewAnalysis';
import ApplicationAssistant from '@/components/ApplicationAssistant';
import MaintenanceManager from '@/components/MaintenanceManager';
import BillSplitter from '@/components/BillSplitter';
import LegalGuidance from '@/components/LegalGuidance';
import CommunityForum from '@/components/CommunityForum';
import DepositProtection from '@/components/DepositProtection';
import InteractiveMaps from '@/components/InteractiveMaps';
import AIChatbot from '@/components/AIChatbot';
import AvatarAssistant from '@/components/AvatarAssistant';

const Index = () => {
  const [activeTab, setActiveTab] = useState('home');
  const [searchResults, setSearchResults] = useState([]);
  const [showAvatar, setShowAvatar] = useState(false);

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

  const navigationItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'search', label: 'Search', icon: Search },
    { id: 'maps', label: 'Maps', icon: MapPin },
    { id: 'reviews', label: 'Reviews', icon: Star },
    { id: 'application', label: 'Apply', icon: FileText },
    { id: 'maintenance', label: 'Maintenance', icon: Home },
    { id: 'bills', label: 'Bills', icon: PoundSterling },
    { id: 'legal', label: 'Legal Help', icon: HelpCircle },
    { id: 'forum', label: 'Community', icon: Users },
    { id: 'deposit', label: 'Deposit', icon: FileText },
    { id: 'ai-chat', label: 'AI Assistant', icon: Bot }
  ];

  const renderContent = () => {
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
      default:
        return (
          <div className="space-y-8">
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
                  onClick={() => setShowAvatar(!showAvatar)} 
                  className="bg-white text-blue-600 hover:bg-gray-100 px-6 py-3 text-lg"
                >
                  Talk to AI Avatar
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
                {mockAccommodations.map((accommodation) => (
                  <Card key={accommodation.id} className="hover:shadow-lg transition-shadow">
                    <div className="relative">
                      <img 
                        src={accommodation.image} 
                        alt={accommodation.title}
                        className="w-full h-48 object-cover rounded-t-lg"
                      />
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
                          </Badge>
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

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="bg-white border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-2">
              <Home className="w-8 h-8 text-blue-600" />
              <span className="text-xl font-bold text-gray-900">StudentHome</span>
            </div>
            <div className="hidden md:flex space-x-1">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
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
            <Button
              onClick={() => setShowAvatar(!showAvatar)}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Bot className="w-4 h-4 mr-2" />
              AI Avatar
            </Button>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation */}
      <div className="md:hidden bg-white border-b">
        <div className="flex overflow-x-auto px-4 py-2 space-x-2">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex flex-col items-center min-w-0 px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                  activeTab === item.id
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Icon className="w-5 h-5 mb-1" />
                <span className="whitespace-nowrap">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {renderContent()}
      </main>

      {/* Floating AI Avatar Assistant */}
      {showAvatar && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-xl font-bold">AI Avatar Assistant</h2>
              <Button
                variant="ghost"
                onClick={() => setShowAvatar(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </Button>
            </div>
            <div className="p-4 max-h-[80vh] overflow-y-auto">
              <AvatarAssistant />
            </div>
          </div>
        </div>
      )}

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
    </div>
  );
};

export default Index;

// Test utilities
import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';

// Mock data for testing
export const mockUser = {
  id: 'test-user-1',
  name: 'Test User',
  email: 'test@example.com',
  preferences: {
    university: 'University of Manchester',
    budget: 200,
    location: 'Manchester',
    roomType: 'studio',
    amenities: ['Wi-Fi', 'Laundry']
  },
  savedSearches: [],
  favoriteAccommodations: [],
  createdAt: new Date(),
  lastLogin: new Date()
};

export const mockAccommodations = [
  {
    id: '1',
    title: 'Modern Student Studio',
    price: 180,
    location: 'Manchester City Centre',
    lat: 53.4808,
    lng: -2.2426,
    type: 'studio' as const,
    amenities: ['Wi-Fi', 'Laundry', 'Kitchen'],
    rating: 4.5,
    reviews: 23,
    available: true,
    university: 'University of Manchester',
    images: ['test-image-1.jpg'],
    description: 'A modern studio apartment perfect for students'
  },
  {
    id: '2',
    title: 'Shared House Near Campus',
    price: 120,
    location: 'University Quarter',
    lat: 53.4670,
    lng: -2.2340,
    type: 'shared' as const,
    amenities: ['Wi-Fi', 'Garden', 'Parking'],
    rating: 4.2,
    reviews: 15,
    available: true,
    university: 'University of Manchester',
    images: ['test-image-2.jpg'],
    description: 'Friendly shared house with great transport links'
  }
];

export const mockSearchResults = mockAccommodations;

export const mockMapData = {
  center: { lat: 53.4808, lng: -2.2426 },
  zoom: 12,
  markers: mockAccommodations.map(acc => ({
    id: acc.id,
    position: { lat: acc.lat, lng: acc.lng },
    title: acc.title,
    price: acc.price
  }))
};

export const mockTransitInfo = {
  nearbyStops: [
    {
      id: 'stop-1',
      name: 'City Centre Bus Stop',
      type: 'bus' as const,
      distance: 150,
      lines: ['1', '42', '147'],
      coordinates: { lat: 53.4808, lng: -2.2426 }
    }
  ],
  routes: [
    {
      from: 'Current Location',
      to: 'University',
      duration: '15 mins',
      cost: 2.50,
      changes: 0,
      accessibility: true
    }
  ],
  accessibility: {
    wheelchairAccessible: true,
    stepFreeAccess: true,
    audioAnnouncements: true
  }
};

export const mockSafetyData = {
  overallScore: 7.5,
  crimeRate: 35,
  categories: {
    violentCrime: 8,
    theft: 15,
    antisocialBehaviour: 12,
    drugOffences: 10
  },
  trends: [
    { month: 'Jan', incidents: 45 },
    { month: 'Feb', incidents: 42 },
    { month: 'Mar', incidents: 38 }
  ],
  nearbyPoliceStations: [
    {
      name: 'City Centre Police Station',
      distance: 800,
      coordinates: { lat: 53.4808, lng: -2.2426 }
    }
  ],
  safetyTips: [
    'Well-lit streets with good CCTV coverage',
    'Regular police patrols in the area'
  ]
};

export const mockCostOfLivingData = {
  overallIndex: 90,
  categories: {
    housing: 108,
    food: 85,
    transport: 99,
    entertainment: 95,
    utilities: 90
  },
  averageCosts: {
    groceriesWeekly: 32,
    mealOut: 11,
    busTicket: 2.3,
    gymMembership: 23,
    utilities: 72
  },
  studentDiscounts: {
    available: true,
    percentage: 15,
    venues: ['Restaurants', 'Cinemas', 'Gyms', 'Transport']
  }
};

export const mockPerformanceMetrics = {
  fcp: 1200,
  lcp: 2100,
  fid: 50,
  cls: 0.05,
  ttfb: 300,
  domContentLoaded: 800,
  loadComplete: 1500,
  jsSize: 850000,
  cssSize: 120000,
  imageSize: 450000,
  totalSize: 1420000,
  pageLoadTime: 2800,
  interactionDelay: 80,
  memoryUsage: 25000000
};

// Custom render function with providers
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  initialEntries?: string[];
}

const AllTheProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <BrowserRouter>
      {children}
    </BrowserRouter>
  );
};

export const customRender = (
  ui: ReactElement,
  options?: CustomRenderOptions
) => {
  return render(ui, { wrapper: AllTheProviders, ...options });
};

// Mock service functions
export const mockAuthService = {
  getCurrentUser: vi.fn().mockReturnValue(null),
  login: vi.fn().mockResolvedValue(mockUser),
  register: vi.fn().mockResolvedValue(mockUser),
  logout: vi.fn().mockResolvedValue(undefined),
  onAuthStateChange: vi.fn().mockReturnValue(() => {}),
  updateProfile: vi.fn().mockResolvedValue(mockUser),
  saveSearch: vi.fn().mockResolvedValue(undefined),
  getFavorites: vi.fn().mockResolvedValue([]),
  addToFavorites: vi.fn().mockResolvedValue(undefined),
  removeFromFavorites: vi.fn().mockResolvedValue(undefined)
};

export const mockMapsService = {
  isLoaded: vi.fn().mockReturnValue(true),
  loadGoogleMaps: vi.fn().mockResolvedValue(undefined),
  setApiKey: vi.fn(),
  geocodeAddress: vi.fn().mockResolvedValue({ lat: 53.4808, lng: -2.2426 }),
  reverseGeocode: vi.fn().mockResolvedValue('Manchester, UK'),
  searchNearby: vi.fn().mockResolvedValue([]),
  calculateRoute: vi.fn().mockResolvedValue({
    distance: '2.5 km',
    duration: '15 mins',
    steps: []
  })
};

export const mockAIService = {
  generateResponse: vi.fn().mockResolvedValue('This is a mock AI response'),
  analyzeReviews: vi.fn().mockResolvedValue({
    sentiment: 'positive',
    score: 0.8,
    summary: 'Generally positive reviews',
    themes: ['location', 'cleanliness', 'value']
  }),
  getRecommendations: vi.fn().mockResolvedValue(mockAccommodations),
  chatWithAI: vi.fn().mockResolvedValue('Mock chat response')
};

export const mockDataService = {
  getAccommodationListings: vi.fn().mockResolvedValue(mockAccommodations),
  getMarketData: vi.fn().mockResolvedValue({
    averagePrice: 150,
    priceChange: -2.5,
    availability: 68,
    demandLevel: 'medium',
    bestTimeToBook: '3-4 weeks ahead'
  })
};

export const mockLocationService = {
  getTransitInfo: vi.fn().mockResolvedValue(mockTransitInfo),
  getSafetyData: vi.fn().mockResolvedValue(mockSafetyData),
  getCostOfLivingData: vi.fn().mockResolvedValue(mockCostOfLivingData),
  getAreaInsights: vi.fn().mockResolvedValue({
    demographics: { studentPopulation: 25, averageAge: 28, diversity: 85 },
    amenities: { supermarkets: 8, restaurants: 25, pubs: 12, gyms: 6, libraries: 3 },
    transport: { walkScore: 85, bikeScore: 70, transitScore: 90 },
    lifestyle: { nightlife: 80, culture: 85, greenSpace: 60, shopping: 90 }
  })
};

export const mockPerformanceService = {
  getMetrics: vi.fn().mockReturnValue(mockPerformanceMetrics),
  getPerformanceScore: vi.fn().mockReturnValue(85),
  getRecommendations: vi.fn().mockReturnValue(['Great job! Your app performance is excellent.']),
  markEvent: vi.fn(),
  measureBetween: vi.fn().mockReturnValue(100),
  disconnect: vi.fn(),
  getConnectionInfo: vi.fn().mockReturnValue({
    effectiveType: '4g',
    downlink: 10,
    rtt: 50,
    saveData: false
  }),
  isPWA: vi.fn().mockReturnValue(false)
};

export const mockPWAService = {
  installApp: vi.fn().mockResolvedValue(true),
  updateServiceWorker: vi.fn().mockResolvedValue(undefined),
  requestNotificationPermission: vi.fn().mockResolvedValue(true),
  subscribeToPushNotifications: vi.fn().mockResolvedValue({}),
  showNotification: vi.fn().mockResolvedValue(undefined),
  getCapabilities: vi.fn().mockReturnValue({
    isInstallable: true,
    isInstalled: false,
    isOnline: true,
    hasNotificationPermission: false,
    supportsPushNotifications: true,
    supportsBackgroundSync: true
  }),
  on: vi.fn(),
  off: vi.fn()
};

// Helper functions for testing
export const waitForLoadingToFinish = () => {
  return new Promise(resolve => setTimeout(resolve, 0));
};

export const createMockEvent = (type: string, properties: any = {}) => {
  const event = new Event(type, { bubbles: true });
  Object.assign(event, properties);
  return event;
};

export const mockIntersectionObserver = () => {
  const mockIntersectionObserver = vi.fn();
  mockIntersectionObserver.mockReturnValue({
    observe: () => null,
    unobserve: () => null,
    disconnect: () => null
  });
  window.IntersectionObserver = mockIntersectionObserver;
};

// Re-export everything from testing library
export * from '@testing-library/react';
export { customRender as render };

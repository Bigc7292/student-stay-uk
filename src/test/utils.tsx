
// Test utilities
import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { vi } from 'vitest';
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
  getTransitInfo: vi.fn().mockResolvedValue({}),
  getSafetyData: vi.fn().mockResolvedValue({}),
  getCostOfLivingData: vi.fn().mockResolvedValue({}),
  getAreaInsights: vi.fn().mockResolvedValue({})
};

// Re-export everything from testing library
export * from '@testing-library/react';
export { customRender as render };

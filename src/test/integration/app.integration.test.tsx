import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render, mockAccommodations, mockAuthService, mockDataService } from '../utils';
import Index from '../../pages/Index';

// Mock all services
vi.mock('@/services/authService', () => ({
  authService: mockAuthService
}));

vi.mock('@/services/dataService', () => ({
  dataService: mockDataService
}));

vi.mock('@/services/mapsService', () => ({
  mapsService: {
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
  }
}));

vi.mock('@/services/locationService', () => ({
  locationService: {
    getTransitInfo: vi.fn().mockResolvedValue({
      nearbyStops: [],
      routes: [],
      accessibility: { wheelchairAccessible: true, stepFreeAccess: true, audioAnnouncements: true }
    }),
    getSafetyData: vi.fn().mockResolvedValue({
      overallScore: 7.5,
      crimeRate: 35,
      categories: { violentCrime: 8, theft: 15, antisocialBehaviour: 12, drugOffences: 10 },
      trends: [],
      nearbyPoliceStations: [],
      safetyTips: []
    }),
    getCostOfLivingData: vi.fn().mockResolvedValue({
      overallIndex: 90,
      categories: { housing: 108, food: 85, transport: 99, entertainment: 95, utilities: 90 },
      averageCosts: { groceriesWeekly: 32, mealOut: 11, busTicket: 2.3, gymMembership: 23, utilities: 72 },
      studentDiscounts: { available: true, percentage: 15, venues: [] }
    }),
    getAreaInsights: vi.fn().mockResolvedValue({
      demographics: { studentPopulation: 25, averageAge: 28, diversity: 85 },
      amenities: { supermarkets: 8, restaurants: 25, pubs: 12, gyms: 6, libraries: 3 },
      transport: { walkScore: 85, bikeScore: 70, transitScore: 90 },
      lifestyle: { nightlife: 80, culture: 85, greenSpace: 60, shopping: 90 }
    })
  }
}));

vi.mock('@/services/performanceService', () => ({
  performanceService: {
    markEvent: vi.fn(),
    measureBetween: vi.fn().mockReturnValue(100),
    disconnect: vi.fn(),
    getMetrics: vi.fn().mockReturnValue({}),
    getPerformanceScore: vi.fn().mockReturnValue(85),
    getRecommendations: vi.fn().mockReturnValue(['Great performance!']),
    getConnectionInfo: vi.fn().mockReturnValue(null),
    isPWA: vi.fn().mockReturnValue(false)
  }
}));

describe('App Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthService.getCurrentUser.mockReturnValue(null);
  });

  describe('Navigation and Routing', () => {
    it('should render home page by default', () => {
      render(<Index />);
      
      expect(screen.getByText(/find your perfect student home/i)).toBeInTheDocument();
      expect(screen.getByText(/ai-powered accommodation search/i)).toBeInTheDocument();
    });

    it('should navigate to search page', async () => {
      const user = userEvent.setup();
      render(<Index />);
      
      const searchTab = screen.getByRole('button', { name: /search/i });
      await user.click(searchTab);
      
      await waitFor(() => {
        expect(screen.getByPlaceholderText(/enter city or university/i)).toBeInTheDocument();
      });
    });

    it('should navigate to maps page', async () => {
      const user = userEvent.setup();
      render(<Index />);
      
      const mapsTab = screen.getByRole('button', { name: /maps/i });
      await user.click(mapsTab);
      
      await waitFor(() => {
        expect(screen.getByText(/interactive maps/i)).toBeInTheDocument();
      });
    });

    it('should navigate to AI chat', async () => {
      const user = userEvent.setup();
      render(<Index />);
      
      const aiTab = screen.getByRole('button', { name: /ai assistant/i });
      await user.click(aiTab);
      
      await waitFor(() => {
        expect(screen.getByText(/ai housing assistant/i)).toBeInTheDocument();
      });
    });
  });

  describe('User Authentication Flow', () => {
    it('should show login button when not authenticated', () => {
      render(<Index />);
      
      expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
    });

    it('should open auth dialog when login clicked', async () => {
      const user = userEvent.setup();
      render(<Index />);
      
      const loginButton = screen.getByRole('button', { name: /login/i });
      await user.click(loginButton);
      
      await waitFor(() => {
        expect(screen.getByText(/welcome to studenthome/i)).toBeInTheDocument();
      });
    });

    it('should show user profile when authenticated', () => {
      mockAuthService.getCurrentUser.mockReturnValue({
        id: 'test-user',
        name: 'Test User',
        email: 'test@example.com',
        preferences: {},
        savedSearches: [],
        favoriteAccommodations: [],
        createdAt: new Date(),
        lastLogin: new Date()
      });

      render(<Index />);
      
      expect(screen.getByText('Test User')).toBeInTheDocument();
    });
  });

  describe('Search Functionality Integration', () => {
    it('should perform end-to-end search', async () => {
      const user = userEvent.setup();
      render(<Index />);
      
      // Navigate to search
      const searchTab = screen.getByRole('button', { name: /search/i });
      await user.click(searchTab);
      
      await waitFor(() => {
        expect(screen.getByPlaceholderText(/enter city or university/i)).toBeInTheDocument();
      });
      
      // Enter search criteria
      const locationInput = screen.getByPlaceholderText(/enter city or university/i);
      await user.type(locationInput, 'Manchester');
      
      // Perform search
      const searchButton = screen.getByRole('button', { name: /search with ai/i });
      await user.click(searchButton);
      
      // Verify results
      await waitFor(() => {
        expect(mockDataService.getAccommodationListings).toHaveBeenCalledWith(
          'Manchester',
          expect.any(Number),
          undefined
        );
      });
    });

    it('should show search results with real-time data', async () => {
      const user = userEvent.setup();
      mockDataService.getAccommodationListings.mockResolvedValueOnce(mockAccommodations);
      
      render(<Index />);
      
      // Navigate to search and perform search
      const searchTab = screen.getByRole('button', { name: /search/i });
      await user.click(searchTab);
      
      await waitFor(() => {
        const searchButton = screen.getByRole('button', { name: /search with ai/i });
        user.click(searchButton);
      });
      
      // Verify results are displayed
      await waitFor(() => {
        expect(screen.getByText('Modern Student Studio')).toBeInTheDocument();
        expect(screen.getByText('Shared House Near Campus')).toBeInTheDocument();
      });
    });
  });

  describe('Maps Integration', () => {
    it('should load maps with accommodations', async () => {
      const user = userEvent.setup();
      render(<Index />);
      
      // Navigate to maps
      const mapsTab = screen.getByRole('button', { name: /maps/i });
      await user.click(mapsTab);
      
      await waitFor(() => {
        expect(screen.getByText(/interactive maps/i)).toBeInTheDocument();
        expect(screen.getByText('Modern Student Studio')).toBeInTheDocument();
      });
    });

    it('should show location insights when accommodation selected', async () => {
      const user = userEvent.setup();
      render(<Index />);
      
      // Navigate to maps
      const mapsTab = screen.getByRole('button', { name: /maps/i });
      await user.click(mapsTab);
      
      await waitFor(() => {
        const accommodationCard = screen.getByText('Modern Student Studio').closest('div');
        user.click(accommodationCard!);
      });
      
      // Should load location insights
      await waitFor(() => {
        expect(screen.getByText(/show area insights/i)).toBeInTheDocument();
      });
    });
  });

  describe('Cross-Component Data Flow', () => {
    it('should maintain user preferences across components', async () => {
      const user = userEvent.setup();
      const mockUser = {
        id: 'test-user',
        name: 'Test User',
        email: 'test@example.com',
        preferences: {
          university: 'University of Manchester',
          budget: 200,
          location: 'Manchester'
        },
        savedSearches: [],
        favoriteAccommodations: [],
        createdAt: new Date(),
        lastLogin: new Date()
      };
      
      mockAuthService.getCurrentUser.mockReturnValue(mockUser);
      
      render(<Index />);
      
      // Navigate to search
      const searchTab = screen.getByRole('button', { name: /search/i });
      await user.click(searchTab);
      
      await waitFor(() => {
        // User preferences should be pre-filled
        const locationInput = screen.getByPlaceholderText(/enter city or university/i);
        expect(locationInput).toHaveValue('Manchester');
      });
    });

    it('should save search results to user profile', async () => {
      const user = userEvent.setup();
      const mockUser = {
        id: 'test-user',
        name: 'Test User',
        email: 'test@example.com',
        preferences: {},
        savedSearches: [],
        favoriteAccommodations: [],
        createdAt: new Date(),
        lastLogin: new Date()
      };
      
      mockAuthService.getCurrentUser.mockReturnValue(mockUser);
      
      render(<Index />);
      
      // Navigate to search and perform search
      const searchTab = screen.getByRole('button', { name: /search/i });
      await user.click(searchTab);
      
      await waitFor(() => {
        const searchButton = screen.getByRole('button', { name: /search with ai/i });
        user.click(searchButton);
      });
      
      // Verify search is saved
      await waitFor(() => {
        expect(mockAuthService.saveSearch).toHaveBeenCalled();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle service failures gracefully', async () => {
      const user = userEvent.setup();
      mockDataService.getAccommodationListings.mockRejectedValueOnce(new Error('Service unavailable'));
      
      render(<Index />);
      
      // Navigate to search and perform search
      const searchTab = screen.getByRole('button', { name: /search/i });
      await user.click(searchTab);
      
      await waitFor(() => {
        const searchButton = screen.getByRole('button', { name: /search with ai/i });
        user.click(searchButton);
      });
      
      // Should fall back gracefully
      await waitFor(() => {
        expect(screen.getByText('Modern Student Studio')).toBeInTheDocument();
      });
    });

    it('should handle authentication errors', async () => {
      const user = userEvent.setup();
      mockAuthService.login.mockRejectedValueOnce(new Error('Invalid credentials'));
      
      render(<Index />);
      
      // Open auth dialog
      const loginButton = screen.getByRole('button', { name: /login/i });
      await user.click(loginButton);
      
      await waitFor(() => {
        const emailInput = screen.getByPlaceholderText(/email/i);
        const passwordInput = screen.getByPlaceholderText(/password/i);
        const submitButton = screen.getByRole('button', { name: /sign in/i });
        
        user.type(emailInput, 'test@example.com');
        user.type(passwordInput, 'wrongpassword');
        user.click(submitButton);
      });
      
      // Should show error message
      await waitFor(() => {
        expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
      });
    });
  });

  describe('Performance and Loading States', () => {
    it('should show loading states during async operations', async () => {
      const user = userEvent.setup();
      
      // Mock slow data service
      mockDataService.getAccommodationListings.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve(mockAccommodations), 100))
      );
      
      render(<Index />);
      
      // Navigate to search and perform search
      const searchTab = screen.getByRole('button', { name: /search/i });
      await user.click(searchTab);
      
      await waitFor(() => {
        const searchButton = screen.getByRole('button', { name: /search with ai/i });
        user.click(searchButton);
      });
      
      // Should show loading state
      expect(screen.getByText(/fetching real-time data/i)).toBeInTheDocument();
      
      // Should eventually show results
      await waitFor(() => {
        expect(screen.getByText('Modern Student Studio')).toBeInTheDocument();
      }, { timeout: 2000 });
    });

    it('should track performance metrics', () => {
      render(<Index />);
      
      // Performance service should be initialized
      expect(vi.mocked(require('@/services/performanceService').performanceService.markEvent))
        .toHaveBeenCalledWith('app-start');
    });
  });

  describe('Responsive Design', () => {
    it('should show mobile navigation on small screens', () => {
      // Mock small screen
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 500,
      });
      
      render(<Index />);
      
      // Mobile navigation should be visible
      const mobileNav = screen.getByRole('button', { name: /search/i });
      expect(mobileNav).toBeInTheDocument();
    });
  });
});

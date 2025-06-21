import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render, mockAccommodations, mockUser, mockAuthService, mockDataService } from '@/test/utils';
import SearchForm from '../SearchForm';

// Mock the services
vi.mock('@/services/authService', () => ({
  authService: mockAuthService
}));

vi.mock('@/services/dataService', () => ({
  dataService: mockDataService
}));

vi.mock('@/services/commuteService', () => ({
  commuteService: {
    geocodeAddress: vi.fn().mockResolvedValue({ lat: 53.4808, lng: -2.2426 }),
    calculateCommute: vi.fn().mockResolvedValue({
      duration: '15 mins',
      distance: '2.5 km',
      mode: 'walking',
      cost: 0
    })
  }
}));

describe('SearchForm', () => {
  const defaultProps = {
    searchResults: mockAccommodations
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthService.getCurrentUser.mockReturnValue(mockUser);
  });

  it('renders search form with all basic elements', () => {
    render(<SearchForm {...defaultProps} />);
    
    expect(screen.getByPlaceholderText(/enter city or university/i)).toBeInTheDocument();
    expect(screen.getByText(/budget range/i)).toBeInTheDocument();
    expect(screen.getByText(/room type/i)).toBeInTheDocument();
    expect(screen.getByText(/amenities/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /search with ai/i })).toBeInTheDocument();
  });

  it('allows user to enter location', async () => {
    const user = userEvent.setup();
    render(<SearchForm {...defaultProps} />);
    
    const locationInput = screen.getByPlaceholderText(/enter city or university/i);
    await user.type(locationInput, 'Manchester');
    
    expect(locationInput).toHaveValue('Manchester');
  });

  it('allows user to adjust budget slider', async () => {
    const user = userEvent.setup();
    render(<SearchForm {...defaultProps} />);
    
    const budgetSlider = screen.getByRole('slider');
    await user.click(budgetSlider);
    
    // Budget slider should be interactive
    expect(budgetSlider).toBeInTheDocument();
  });

  it('allows user to select room type', async () => {
    const user = userEvent.setup();
    render(<SearchForm {...defaultProps} />);
    
    // Click on the room type select trigger
    const roomTypeSelect = screen.getByRole('combobox');
    await user.click(roomTypeSelect);
    
    // Should show options
    await waitFor(() => {
      expect(screen.getByText('Studio')).toBeInTheDocument();
    });
  });

  it('allows user to select amenities', async () => {
    const user = userEvent.setup();
    render(<SearchForm {...defaultProps} />);
    
    const wifiCheckbox = screen.getByLabelText('Wi-Fi');
    await user.click(wifiCheckbox);
    
    expect(wifiCheckbox).toBeChecked();
  });

  it('shows advanced filters when toggle is clicked', async () => {
    const user = userEvent.setup();
    render(<SearchForm {...defaultProps} />);
    
    const advancedFiltersButton = screen.getByText(/show advanced filters/i);
    await user.click(advancedFiltersButton);
    
    await waitFor(() => {
      expect(screen.getByText(/max commute time/i)).toBeInTheDocument();
      expect(screen.getByText(/commute mode/i)).toBeInTheDocument();
      expect(screen.getByText(/minimum rating/i)).toBeInTheDocument();
    });
  });

  it('performs search when search button is clicked', async () => {
    const user = userEvent.setup();
    render(<SearchForm {...defaultProps} />);
    
    const searchButton = screen.getByRole('button', { name: /search with ai/i });
    await user.click(searchButton);
    
    // Should show loading state
    await waitFor(() => {
      expect(screen.getByText(/fetching real-time data/i)).toBeInTheDocument();
    });
    
    // Should call data service
    expect(mockDataService.getAccommodationListings).toHaveBeenCalled();
  });

  it('displays search results after search', async () => {
    const user = userEvent.setup();
    render(<SearchForm {...defaultProps} />);
    
    const searchButton = screen.getByRole('button', { name: /search with ai/i });
    await user.click(searchButton);
    
    await waitFor(() => {
      expect(screen.getByText('Modern Student Studio')).toBeInTheDocument();
      expect(screen.getByText('Shared House Near Campus')).toBeInTheDocument();
    });
  });

  it('shows AI insights with market data', async () => {
    const user = userEvent.setup();
    render(<SearchForm {...defaultProps} />);
    
    const searchButton = screen.getByRole('button', { name: /search with ai/i });
    await user.click(searchButton);
    
    await waitFor(() => {
      expect(screen.getByText(/ai insights/i)).toBeInTheDocument();
      expect(screen.getByText(/market trend/i)).toBeInTheDocument();
      expect(screen.getByText(/best time to book/i)).toBeInTheDocument();
    });
  });

  it('displays accommodation cards with correct information', async () => {
    const user = userEvent.setup();
    render(<SearchForm {...defaultProps} />);
    
    const searchButton = screen.getByRole('button', { name: /search with ai/i });
    await user.click(searchButton);
    
    await waitFor(() => {
      // Check first accommodation
      expect(screen.getByText('Modern Student Studio')).toBeInTheDocument();
      expect(screen.getByText('£180/week')).toBeInTheDocument();
      expect(screen.getByText('4.5')).toBeInTheDocument();
      
      // Check amenities
      expect(screen.getByText('Wi-Fi')).toBeInTheDocument();
      expect(screen.getByText('Laundry')).toBeInTheDocument();
    });
  });

  it('shows AI recommended badge for top results', async () => {
    const user = userEvent.setup();
    render(<SearchForm {...defaultProps} />);
    
    const searchButton = screen.getByRole('button', { name: /search with ai/i });
    await user.click(searchButton);
    
    await waitFor(() => {
      const aiRecommendedBadges = screen.getAllByText('AI Recommended');
      expect(aiRecommendedBadges.length).toBeGreaterThan(0);
    });
  });

  it('handles commute calculation when user has university preference', async () => {
    const user = userEvent.setup();
    render(<SearchForm {...defaultProps} />);
    
    // Show advanced filters
    const advancedFiltersButton = screen.getByText(/show advanced filters/i);
    await user.click(advancedFiltersButton);
    
    // Set max commute time
    await waitFor(() => {
      const commuteSlider = screen.getByDisplayValue('30');
      expect(commuteSlider).toBeInTheDocument();
    });
    
    const searchButton = screen.getByRole('button', { name: /search with ai/i });
    await user.click(searchButton);
    
    await waitFor(() => {
      // Should show commute information in results
      expect(screen.getByText(/to university/i)).toBeInTheDocument();
    });
  });

  it('filters results based on user preferences', async () => {
    const user = userEvent.setup();
    render(<SearchForm {...defaultProps} />);
    
    // Set location
    const locationInput = screen.getByPlaceholderText(/enter city or university/i);
    await user.type(locationInput, 'Manchester');
    
    // Select amenities
    const wifiCheckbox = screen.getByLabelText('Wi-Fi');
    await user.click(wifiCheckbox);
    
    const searchButton = screen.getByRole('button', { name: /search with ai/i });
    await user.click(searchButton);
    
    await waitFor(() => {
      // Results should be filtered
      const results = screen.getAllByText(/£\d+\/week/);
      expect(results.length).toBeGreaterThan(0);
    });
  });

  it('shows error state when search fails', async () => {
    const user = userEvent.setup();
    mockDataService.getAccommodationListings.mockRejectedValueOnce(new Error('Search failed'));
    
    render(<SearchForm {...defaultProps} />);
    
    const searchButton = screen.getByRole('button', { name: /search with ai/i });
    await user.click(searchButton);
    
    await waitFor(() => {
      // Should fall back to existing search results
      expect(screen.getByText('Modern Student Studio')).toBeInTheDocument();
    });
  });

  it('saves search when user is authenticated', async () => {
    const user = userEvent.setup();
    render(<SearchForm {...defaultProps} />);
    
    const locationInput = screen.getByPlaceholderText(/enter city or university/i);
    await user.type(locationInput, 'Manchester');
    
    const searchButton = screen.getByRole('button', { name: /search with ai/i });
    await user.click(searchButton);
    
    await waitFor(() => {
      expect(mockAuthService.saveSearch).toHaveBeenCalledWith(
        expect.objectContaining({
          location: 'Manchester'
        })
      );
    });
  });

  it('shows real-time data badge when available', async () => {
    const user = userEvent.setup();
    const mockRealTimeData = [
      {
        ...mockAccommodations[0],
        source: 'rightmove',
        lastUpdated: new Date()
      }
    ];
    
    mockDataService.getAccommodationListings.mockResolvedValueOnce(mockRealTimeData);
    
    render(<SearchForm {...defaultProps} />);
    
    const searchButton = screen.getByRole('button', { name: /search with ai/i });
    await user.click(searchButton);
    
    await waitFor(() => {
      expect(screen.getByText('Real-time Data')).toBeInTheDocument();
    });
  });

  it('handles empty search results gracefully', async () => {
    const user = userEvent.setup();
    mockDataService.getAccommodationListings.mockResolvedValueOnce([]);
    
    render(<SearchForm searchResults={[]} />);
    
    const searchButton = screen.getByRole('button', { name: /search with ai/i });
    await user.click(searchButton);
    
    await waitFor(() => {
      expect(screen.getByText(/no accommodations found/i)).toBeInTheDocument();
    });
  });
});

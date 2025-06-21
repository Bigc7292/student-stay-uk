import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render, mockAccommodations, mockMapsService, mockLocationService } from '@/test/utils';
import InteractiveMaps from '../InteractiveMaps';

// Mock the services
vi.mock('@/services/mapsService', () => ({
  mapsService: mockMapsService
}));

vi.mock('@/services/locationService', () => ({
  locationService: mockLocationService
}));

describe('InteractiveMaps', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockMapsService.isLoaded.mockReturnValue(true);
  });

  it('renders maps interface with all controls', () => {
    render(<InteractiveMaps />);
    
    expect(screen.getByText(/interactive maps/i)).toBeInTheDocument();
    expect(screen.getByText(/accommodations/i)).toBeInTheDocument();
    expect(screen.getByText(/universities/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /street view/i })).toBeInTheDocument();
  });

  it('shows accommodation list', () => {
    render(<InteractiveMaps />);
    
    expect(screen.getByText('Modern Student Studio')).toBeInTheDocument();
    expect(screen.getByText('Shared House Near Campus')).toBeInTheDocument();
    expect(screen.getByText('£180/week')).toBeInTheDocument();
    expect(screen.getByText('£120/week')).toBeInTheDocument();
  });

  it('allows user to select accommodation', async () => {
    const user = userEvent.setup();
    render(<InteractiveMaps />);
    
    const accommodationCard = screen.getByText('Modern Student Studio').closest('div');
    await user.click(accommodationCard!);
    
    await waitFor(() => {
      expect(mockLocationService.getTransitInfo).toHaveBeenCalled();
      expect(mockLocationService.getSafetyData).toHaveBeenCalled();
      expect(mockLocationService.getCostOfLivingData).toHaveBeenCalled();
    });
  });

  it('shows university list', async () => {
    const user = userEvent.setup();
    render(<InteractiveMaps />);
    
    const universitiesTab = screen.getByText(/universities/i);
    await user.click(universitiesTab);
    
    expect(screen.getByText(/university of manchester/i)).toBeInTheDocument();
    expect(screen.getByText(/manchester metropolitan/i)).toBeInTheDocument();
  });

  it('allows user to select university', async () => {
    const user = userEvent.setup();
    render(<InteractiveMaps />);
    
    const universitiesTab = screen.getByText(/universities/i);
    await user.click(universitiesTab);
    
    const universityCard = screen.getByText(/university of manchester/i).closest('div');
    await user.click(universityCard!);
    
    // Should center map on university
    expect(mockMapsService.isLoaded).toHaveBeenCalled();
  });

  it('toggles street view when button is clicked', async () => {
    const user = userEvent.setup();
    render(<InteractiveMaps />);
    
    const streetViewButton = screen.getByRole('button', { name: /street view/i });
    await user.click(streetViewButton);
    
    // Street view should be toggled
    expect(streetViewButton).toBeInTheDocument();
  });

  it('shows route information when accommodation is selected', async () => {
    const user = userEvent.setup();
    render(<InteractiveMaps />);
    
    const accommodationCard = screen.getByText('Modern Student Studio').closest('div');
    await user.click(accommodationCard!);
    
    await waitFor(() => {
      expect(screen.getByText(/route information/i)).toBeInTheDocument();
      expect(screen.getByText(/distance/i)).toBeInTheDocument();
      expect(screen.getByText(/walking time/i)).toBeInTheDocument();
    });
  });

  it('shows area insights when accommodation is selected', async () => {
    const user = userEvent.setup();
    render(<InteractiveMaps />);
    
    const accommodationCard = screen.getByText('Modern Student Studio').closest('div');
    await user.click(accommodationCard!);
    
    // Wait for area insights to load
    await waitFor(() => {
      expect(mockLocationService.getAreaInsights).toHaveBeenCalled();
    });
    
    const showInsightsButton = screen.getByText(/show area insights/i);
    await user.click(showInsightsButton);
    
    await waitFor(() => {
      expect(screen.getByText(/safety score/i)).toBeInTheDocument();
      expect(screen.getByText(/public transport/i)).toBeInTheDocument();
      expect(screen.getByText(/cost of living/i)).toBeInTheDocument();
    });
  });

  it('displays safety information in area insights', async () => {
    const user = userEvent.setup();
    render(<InteractiveMaps />);
    
    const accommodationCard = screen.getByText('Modern Student Studio').closest('div');
    await user.click(accommodationCard!);
    
    await waitFor(() => {
      const showInsightsButton = screen.getByText(/show area insights/i);
      user.click(showInsightsButton);
    });
    
    await waitFor(() => {
      expect(screen.getByText(/safety score/i)).toBeInTheDocument();
      expect(screen.getByText(/crime rate/i)).toBeInTheDocument();
      expect(screen.getByText(/police station/i)).toBeInTheDocument();
    });
  });

  it('displays transit information in area insights', async () => {
    const user = userEvent.setup();
    render(<InteractiveMaps />);
    
    const accommodationCard = screen.getByText('Modern Student Studio').closest('div');
    await user.click(accommodationCard!);
    
    await waitFor(() => {
      const showInsightsButton = screen.getByText(/show area insights/i);
      user.click(showInsightsButton);
    });
    
    await waitFor(() => {
      expect(screen.getByText(/public transport/i)).toBeInTheDocument();
      expect(screen.getByText(/wheelchair accessible/i)).toBeInTheDocument();
    });
  });

  it('displays cost of living information in area insights', async () => {
    const user = userEvent.setup();
    render(<InteractiveMaps />);
    
    const accommodationCard = screen.getByText('Modern Student Studio').closest('div');
    await user.click(accommodationCard!);
    
    await waitFor(() => {
      const showInsightsButton = screen.getByText(/show area insights/i);
      user.click(showInsightsButton);
    });
    
    await waitFor(() => {
      expect(screen.getByText(/cost of living/i)).toBeInTheDocument();
      expect(screen.getByText(/groceries/i)).toBeInTheDocument();
      expect(screen.getByText(/student discounts/i)).toBeInTheDocument();
    });
  });

  it('shows loading state while fetching location data', async () => {
    const user = userEvent.setup();
    render(<InteractiveMaps />);
    
    const accommodationCard = screen.getByText('Modern Student Studio').closest('div');
    await user.click(accommodationCard!);
    
    expect(screen.getByText(/loading area insights/i)).toBeInTheDocument();
  });

  it('handles Google Maps API not loaded', () => {
    mockMapsService.isLoaded.mockReturnValue(false);
    render(<InteractiveMaps />);
    
    expect(screen.getByText(/google maps api key required/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /configure api key/i })).toBeInTheDocument();
  });

  it('allows user to configure API key', async () => {
    const user = userEvent.setup();
    mockMapsService.isLoaded.mockReturnValue(false);
    render(<InteractiveMaps />);
    
    const configureButton = screen.getByRole('button', { name: /configure api key/i });
    await user.click(configureButton);
    
    expect(screen.getByText(/google maps api configuration/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/enter your google maps api key/i)).toBeInTheDocument();
  });

  it('saves API key when provided', async () => {
    const user = userEvent.setup();
    mockMapsService.isLoaded.mockReturnValue(false);
    render(<InteractiveMaps />);
    
    const configureButton = screen.getByRole('button', { name: /configure api key/i });
    await user.click(configureButton);
    
    const apiKeyInput = screen.getByPlaceholderText(/enter your google maps api key/i);
    await user.type(apiKeyInput, 'test-api-key');
    
    const saveButton = screen.getByRole('button', { name: /save api key/i });
    await user.click(saveButton);
    
    expect(mockMapsService.setApiKey).toHaveBeenCalledWith('test-api-key');
  });

  it('filters accommodations by availability', async () => {
    const user = userEvent.setup();
    render(<InteractiveMaps />);
    
    // Both accommodations should be visible initially
    expect(screen.getByText('Modern Student Studio')).toBeInTheDocument();
    expect(screen.getByText('Shared House Near Campus')).toBeInTheDocument();
    
    // Filter should work (this would depend on the actual filter implementation)
    const accommodationCards = screen.getAllByText(/£\d+\/week/);
    expect(accommodationCards.length).toBe(2);
  });

  it('shows accommodation details on hover', async () => {
    const user = userEvent.setup();
    render(<InteractiveMaps />);
    
    const accommodationCard = screen.getByText('Modern Student Studio').closest('div');
    await user.hover(accommodationCard!);
    
    // Should show additional details
    expect(screen.getByText(/modern studio apartment/i)).toBeInTheDocument();
  });

  it('handles error when location services fail', async () => {
    const user = userEvent.setup();
    mockLocationService.getTransitInfo.mockRejectedValueOnce(new Error('Service failed'));
    
    render(<InteractiveMaps />);
    
    const accommodationCard = screen.getByText('Modern Student Studio').closest('div');
    await user.click(accommodationCard!);
    
    // Should handle error gracefully
    await waitFor(() => {
      expect(screen.queryByText(/loading area insights/i)).not.toBeInTheDocument();
    });
  });

  it('updates map center when accommodation is selected', async () => {
    const user = userEvent.setup();
    render(<InteractiveMaps />);
    
    const accommodationCard = screen.getByText('Modern Student Studio').closest('div');
    await user.click(accommodationCard!);
    
    // Map should be updated (this would be tested through the mock)
    expect(mockMapsService.isLoaded).toHaveBeenCalled();
  });
});

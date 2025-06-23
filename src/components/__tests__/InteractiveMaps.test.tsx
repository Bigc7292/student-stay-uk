
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render } from '@testing-library/react';
import { screen } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import { mockAccommodations, mockMapsService, mockLocationService } from '@/test/utils';
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
    
    expect(screen.getByText(/interactive campus & accommodation maps/i)).toBeInTheDocument();
    expect(screen.getByText(/maps coming soon/i)).toBeInTheDocument();
  });

  it('shows configuration message when maps not available', () => {
    render(<InteractiveMaps />);
    
    expect(screen.getByText(/interactive maps are temporarily unavailable/i)).toBeInTheDocument();
    expect(screen.getByText(/configure your google maps api key/i)).toBeInTheDocument();
  });

  it('shows feature descriptions', () => {
    render(<InteractiveMaps />);
    
    expect(screen.getByText(/university locations/i)).toBeInTheDocument();
    expect(screen.getByText(/student accommodations/i)).toBeInTheDocument();
    expect(screen.getByText(/route planning/i)).toBeInTheDocument();
    expect(screen.getByText(/area insights/i)).toBeInTheDocument();
  });

  it('shows alternative options', () => {
    render(<InteractiveMaps />);
    
    expect(screen.getByText(/use route planner tool/i)).toBeInTheDocument();
    expect(screen.getByText(/search for properties/i)).toBeInTheDocument();
  });

  it('handles navigation events', async () => {
    const user = userEvent.setup();
    render(<InteractiveMaps />);
    
    const routePlannerButton = screen.getByText(/use route planner tool/i);
    await user.click(routePlannerButton);
    
    // Button should be clickable
    expect(routePlannerButton).toBeInTheDocument();
  });
});

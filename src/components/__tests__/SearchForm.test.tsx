
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render } from '@testing-library/react';
import { screen } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import { mockAccommodations, mockUser, mockAuthService, mockDataService } from '@/test/utils';
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

  it('renders search form with basic elements', () => {
    render(<SearchForm {...defaultProps} />);
    
    // Should show search interface
    expect(screen.getByText(/search/i)).toBeInTheDocument();
  });

  it('handles search interactions', async () => {
    const user = userEvent.setup();
    render(<SearchForm {...defaultProps} />);
    
    // Should be interactive
    const searchElements = screen.getAllByRole('button');
    expect(searchElements.length).toBeGreaterThan(0);
  });
});

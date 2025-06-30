
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PropertyServiceManager } from '../../services/PropertyServiceManager';

// Mock all services
vi.mock('../../services/spareRoomService', () => ({
  spareRoomService: {
    searchProperties: vi.fn().mockResolvedValue([]),
    getServiceInfo: vi.fn(() => ({ name: 'SpareRoom', isConfigured: true }))
  }
}));

vi.mock('../../services/rightmoveService', () => ({
  rightmoveService: {
    searchProperties: vi.fn().mockResolvedValue([]),
    getServiceInfo: vi.fn(() => ({ name: 'Rightmove', isConfigured: true }))
  }
}));

describe('PropertyServiceManager', () => {
  let manager: PropertyServiceManager;

  beforeEach(() => {
    vi.clearAllMocks();
    manager = new PropertyServiceManager();
  });

  it('initializes with default services', () => {
    expect(manager.getAvailableServices()).toHaveLength(7);
  });

  it('can search across all services', async () => {
    const params = {
      location: 'London',
      maxPrice: 1000,
      minPrice: 500,
      bedrooms: 2,
      furnished: true,
      billsIncluded: false,
      availableFrom: '2024-01-01',
      radius: 5
    };

    const results = await manager.searchAllServices(params);
    expect(Array.isArray(results)).toBe(true);
  });

  it('handles service errors gracefully', async () => {
    const params = {
      location: 'London',
      maxPrice: 1000,
      minPrice: 500,
      bedrooms: 2,
      furnished: true,
      billsIncluded: false,
      availableFrom: '2024-01-01',
      radius: 5
    };

    // This should not throw even if services fail
    const results = await manager.searchAllServices(params);
    expect(Array.isArray(results)).toBe(true);
  });
});

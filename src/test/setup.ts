
// Test setup file
import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
  root: null,
  rootMargin: '',
  thresholds: [],
  takeRecords: vi.fn().mockReturnValue([])
})) as any;

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn()
})) as any;

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock localStorage with proper Storage interface
const createStorageMock = () => ({
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn()
});

global.localStorage = createStorageMock() as any;
global.sessionStorage = createStorageMock() as any;

// Mock fetch
global.fetch = vi.fn();

// Mock Google Maps API
global.google = {
  maps: {
    Map: vi.fn().mockImplementation(() => ({
      setCenter: vi.fn(),
      setZoom: vi.fn(),
      addListener: vi.fn(),
    })),
    Marker: vi.fn().mockImplementation(() => ({
      setMap: vi.fn(),
      setPosition: vi.fn(),
      addListener: vi.fn(),
    })),
    InfoWindow: vi.fn().mockImplementation(() => ({
      setContent: vi.fn(),
      open: vi.fn(),
      close: vi.fn(),
    })),
    DirectionsService: vi.fn().mockImplementation(() => ({
      route: vi.fn(),
    })),
    DirectionsRenderer: vi.fn().mockImplementation(() => ({
      setMap: vi.fn(),
      setDirections: vi.fn(),
    })),
    StreetViewPanorama: vi.fn().mockImplementation(() => ({
      setPosition: vi.fn(),
      setVisible: vi.fn(),
    })),
    places: {
      PlacesService: vi.fn().mockImplementation(() => ({
        nearbySearch: vi.fn(),
        getDetails: vi.fn(),
      })),
    },
    geometry: {
      spherical: {
        computeDistanceBetween: vi.fn().mockReturnValue(1000),
      },
    },
    LatLng: vi.fn().mockImplementation((lat, lng) => ({ lat: () => lat, lng: () => lng })),
  },
} as any;

// Mock PerformanceObserver
global.PerformanceObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  disconnect: vi.fn()
})) as any;

// Add supportedEntryTypes to PerformanceObserver
Object.defineProperty(global.PerformanceObserver, 'supportedEntryTypes', {
  value: ['navigation', 'resource', 'measure', 'mark'],
  writable: false
});

// Mock Notification API
global.Notification = vi.fn().mockImplementation(() => ({
  close: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
})) as any;

Object.defineProperty(Notification, 'permission', {
  value: 'granted',
  writable: true
});

// Mock navigator.serviceWorker
Object.defineProperty(navigator, 'serviceWorker', {
  value: {
    register: vi.fn().mockResolvedValue({
      installing: null,
      waiting: null,
      active: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      scope: '',
      unregister: vi.fn(),
      update: vi.fn(),
      pushManager: { subscribe: vi.fn() },
      sync: { register: vi.fn() },
      showNotification: vi.fn()
    } as any),
    ready: Promise.resolve({
      installing: null,
      waiting: null,
      active: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      scope: '',
      unregister: vi.fn(),
      update: vi.fn(),
      pushManager: { subscribe: vi.fn() },
      sync: { register: vi.fn() },
      showNotification: vi.fn()
    } as any),
  },
  writable: true,
});

// Mock IndexedDB
const mockIDBRequest = {
  result: null,
  error: null,
  onsuccess: null,
  onerror: null,
};

global.indexedDB = {
  open: vi.fn().mockReturnValue(mockIDBRequest),
  deleteDatabase: vi.fn(),
  databases: vi.fn(),
  cmp: vi.fn()
} as any;

// Mock crypto for UUID generation
global.crypto = {
  ...global.crypto,
  randomUUID: vi.fn().mockReturnValue('mock-uuid-1234'),
  getRandomValues: vi.fn().mockImplementation((arr) => {
    for (let i = 0; i < arr.length; i++) {
      arr[i] = Math.floor(Math.random() * 256);
    }
    return arr;
  }),
} as any;

// Mock URL.createObjectURL
global.URL.createObjectURL = vi.fn().mockReturnValue('mock-object-url');
global.URL.revokeObjectURL = vi.fn();

// Clean up after each test
afterEach(() => {
  vi.clearAllMocks();
});

// Test Setup and Configuration
// Comprehensive testing environment setup for StudentHome platform

import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock environment variables
Object.defineProperty(import.meta, 'env', {
  value: {
    VITE_GOOGLE_MAPS_API_KEY: 'test-google-maps-key',
    VITE_OPENAI_API_KEY: 'test-openai-key',
    VITE_RAPIDAPI_KEY: 'test-rapidapi-key',
    VITE_APIFY_TOKEN: 'test-apify-token',
    VITE_SENTRY_DSN: 'test-sentry-dsn',
    BRIGHT_DATA_API_TOKEN: 'test-bright-data-token',
    MODE: 'test',
    DEV: false,
    PROD: false
  },
  writable: true
});

// Mock global objects
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock PerformanceObserver
global.PerformanceObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Mock sessionStorage
const sessionStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock
});

// Mock fetch
global.fetch = vi.fn();

// Mock console methods for cleaner test output
const originalConsole = { ...console };
global.console = {
  ...console,
  log: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
  debug: vi.fn(),
};

// Mock Google Maps API
global.google = {
  maps: {
    Map: vi.fn().mockImplementation(() => ({
      setCenter: vi.fn(),
      setZoom: vi.fn(),
      addListener: vi.fn(),
    })),
    Marker: vi.fn().mockImplementation(() => ({
      setPosition: vi.fn(),
      setMap: vi.fn(),
      addListener: vi.fn(),
    })),
    InfoWindow: vi.fn().mockImplementation(() => ({
      setContent: vi.fn(),
      open: vi.fn(),
      close: vi.fn(),
    })),
    LatLng: vi.fn().mockImplementation((lat, lng) => ({ lat, lng })),
    places: {
      PlacesService: vi.fn().mockImplementation(() => ({
        nearbySearch: vi.fn(),
        getDetails: vi.fn(),
      })),
    },
  },
} as any;

// Mock Sentry
global.Sentry = {
  init: vi.fn(),
  captureException: vi.fn(),
  captureMessage: vi.fn(),
  withScope: vi.fn((callback) => callback({
    setTag: vi.fn(),
    setContext: vi.fn(),
    setLevel: vi.fn(),
  })),
} as any;

// Mock gtag (Google Analytics)
global.gtag = vi.fn();

// Mock service worker
Object.defineProperty(navigator, 'serviceWorker', {
  value: {
    register: vi.fn().mockResolvedValue({
      installing: null,
      waiting: null,
      active: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }),
    ready: Promise.resolve({
      installing: null,
      waiting: null,
      active: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }),
  },
  writable: true,
});

// Mock notifications
Object.defineProperty(Notification, 'permission', {
  value: 'granted',
  writable: true,
});

global.Notification = vi.fn().mockImplementation(() => ({
  close: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
})) as any;

// Mock crypto for UUID generation
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: vi.fn(() => 'test-uuid-1234-5678-9012'),
    getRandomValues: vi.fn((arr) => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * 256);
      }
      return arr;
    }),
  },
});

// Mock URL.createObjectURL
global.URL.createObjectURL = vi.fn(() => 'blob:test-url');
global.URL.revokeObjectURL = vi.fn();

// Mock canvas for image processing
HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue({
  fillRect: vi.fn(),
  clearRect: vi.fn(),
  getImageData: vi.fn(() => ({ data: new Array(4) })),
  putImageData: vi.fn(),
  createImageData: vi.fn(() => ({ data: new Array(4) })),
  setTransform: vi.fn(),
  drawImage: vi.fn(),
  save: vi.fn(),
  fillText: vi.fn(),
  restore: vi.fn(),
  beginPath: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  closePath: vi.fn(),
  stroke: vi.fn(),
  translate: vi.fn(),
  scale: vi.fn(),
  rotate: vi.fn(),
  arc: vi.fn(),
  fill: vi.fn(),
  measureText: vi.fn(() => ({ width: 0 })),
  transform: vi.fn(),
  rect: vi.fn(),
  clip: vi.fn(),
});

// Mock HTMLCanvasElement.toDataURL
HTMLCanvasElement.prototype.toDataURL = vi.fn(() => 'data:image/png;base64,test');

// Mock Image constructor
global.Image = vi.fn().mockImplementation(() => ({
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  src: '',
  onload: null,
  onerror: null,
})) as any;

// Test utilities
export const mockFetch = (response: any, ok = true) => {
  (global.fetch as any).mockResolvedValueOnce({
    ok,
    status: ok ? 200 : 400,
    json: async () => response,
    text: async () => JSON.stringify(response),
  });
};

export const mockFetchError = (error: Error) => {
  (global.fetch as any).mockRejectedValueOnce(error);
};

export const mockLocalStorage = (data: Record<string, string> = {}) => {
  localStorageMock.getItem.mockImplementation((key) => data[key] || null);
  localStorageMock.setItem.mockImplementation((key, value) => {
    data[key] = value;
  });
  localStorageMock.removeItem.mockImplementation((key) => {
    delete data[key];
  });
  localStorageMock.clear.mockImplementation(() => {
    Object.keys(data).forEach(key => delete data[key]);
  });
};

export const mockGeolocation = (coords = { latitude: 53.4808, longitude: -2.2426 }) => {
  Object.defineProperty(navigator, 'geolocation', {
    value: {
      getCurrentPosition: vi.fn().mockImplementation((success) => {
        success({
          coords: {
            ...coords,
            accuracy: 10,
            altitude: null,
            altitudeAccuracy: null,
            heading: null,
            speed: null,
          },
          timestamp: Date.now(),
        });
      }),
      watchPosition: vi.fn(),
      clearWatch: vi.fn(),
    },
    writable: true,
  });
};

export const mockPerformance = () => {
  Object.defineProperty(global, 'performance', {
    value: {
      now: vi.fn(() => Date.now()),
      mark: vi.fn(),
      measure: vi.fn(),
      getEntriesByType: vi.fn(() => []),
      getEntriesByName: vi.fn(() => []),
    },
    writable: true,
  });
};

// Cleanup function for tests
export const cleanup = () => {
  vi.clearAllMocks();
  localStorageMock.clear();
  sessionStorageMock.clear();
};

// Setup function to run before each test
export const setupTest = () => {
  cleanup();
  mockLocalStorage();
  mockGeolocation();
  mockPerformance();
};

// Teardown function to run after each test
export const teardownTest = () => {
  cleanup();
};

// Export mocks for use in tests
export {
  localStorageMock,
  sessionStorageMock,
  originalConsole,
};

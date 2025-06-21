// Test setup file
import '@testing-library/jest-dom';

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};

// Mock matchMedia
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

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
global.localStorage = localStorageMock;

// Mock sessionStorage
const sessionStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
global.sessionStorage = sessionStorageMock;

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
};

// Mock performance API
global.performance = {
  ...global.performance,
  mark: vi.fn(),
  measure: vi.fn(),
  getEntriesByName: vi.fn().mockReturnValue([]),
  getEntriesByType: vi.fn().mockReturnValue([]),
  now: vi.fn().mockReturnValue(Date.now()),
};

// Mock PerformanceObserver
global.PerformanceObserver = class PerformanceObserver {
  constructor() {}
  observe() {}
  disconnect() {}
};

// Mock Notification API
global.Notification = {
  permission: 'default',
  requestPermission: vi.fn().mockResolvedValue('granted'),
} as any;

// Mock Service Worker
global.navigator = {
  ...global.navigator,
  serviceWorker: {
    register: vi.fn().mockResolvedValue({
      installing: null,
      waiting: null,
      active: null,
      addEventListener: vi.fn(),
      update: vi.fn(),
    }),
    ready: Promise.resolve({
      showNotification: vi.fn(),
      sync: {
        register: vi.fn(),
      },
      pushManager: {
        subscribe: vi.fn(),
      },
    }),
  },
  onLine: true,
};

// Mock IndexedDB
const mockIDBRequest = {
  result: null,
  error: null,
  onsuccess: null,
  onerror: null,
};

const mockIDBDatabase = {
  transaction: vi.fn().mockReturnValue({
    objectStore: vi.fn().mockReturnValue({
      get: vi.fn().mockReturnValue(mockIDBRequest),
      put: vi.fn().mockReturnValue(mockIDBRequest),
      delete: vi.fn().mockReturnValue(mockIDBRequest),
    }),
  }),
  createObjectStore: vi.fn(),
  objectStoreNames: {
    contains: vi.fn().mockReturnValue(false),
  },
};

global.indexedDB = {
  open: vi.fn().mockReturnValue({
    ...mockIDBRequest,
    result: mockIDBDatabase,
    onupgradeneeded: null,
  }),
  deleteDatabase: vi.fn(),
};

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
};

// Mock URL.createObjectURL
global.URL.createObjectURL = vi.fn().mockReturnValue('mock-object-url');
global.URL.revokeObjectURL = vi.fn();

// Mock canvas for image processing
HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue({
  fillRect: vi.fn(),
  clearRect: vi.fn(),
  getImageData: vi.fn().mockReturnValue({
    data: new Uint8ClampedArray(4),
  }),
  putImageData: vi.fn(),
  createImageData: vi.fn().mockReturnValue({}),
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
  measureText: vi.fn().mockReturnValue({ width: 0 }),
  transform: vi.fn(),
  rect: vi.fn(),
  clip: vi.fn(),
});

// Mock HTMLMediaElement
Object.defineProperty(HTMLMediaElement.prototype, 'muted', {
  writable: true,
  value: false,
});

Object.defineProperty(HTMLMediaElement.prototype, 'play', {
  writable: true,
  value: vi.fn().mockResolvedValue(undefined),
});

Object.defineProperty(HTMLMediaElement.prototype, 'pause', {
  writable: true,
  value: vi.fn(),
});

// Mock scrollIntoView
Element.prototype.scrollIntoView = vi.fn();

// Mock getBoundingClientRect
Element.prototype.getBoundingClientRect = vi.fn().mockReturnValue({
  width: 100,
  height: 100,
  top: 0,
  left: 0,
  bottom: 100,
  right: 100,
  x: 0,
  y: 0,
  toJSON: vi.fn(),
});

// Clean up after each test
afterEach(() => {
  vi.clearAllMocks();
  localStorageMock.clear();
  sessionStorageMock.clear();
});

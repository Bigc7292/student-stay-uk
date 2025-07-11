
// Test setup file
import '@testing-library/jest-dom';
import { vi, afterEach } from 'vitest';

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

// Mock PerformanceObserver
const mockPerformanceObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  disconnect: vi.fn()
}));

Object.defineProperty(mockPerformanceObserver, 'supportedEntryTypes', {
  value: ['navigation', 'resource', 'measure', 'mark'],
  writable: false
});

global.PerformanceObserver = mockPerformanceObserver as any;

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


import { describe, it, expect, beforeEach, vi } from 'vitest';
import { performanceService } from '../performanceService';

describe('PerformanceService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe('Performance Metrics Collection', () => {
    it('should initialize with default metrics', () => {
      const metrics = performanceService.getMetrics();
      expect(metrics).toBeDefined();
      expect(typeof metrics.score).toBe('number');
    });

    it('should mark custom events', () => {
      performanceService.markEvent('test-event');
      expect(global.performance.mark).toHaveBeenCalledWith('test-event');
    });

    it('should measure between marks', () => {
      const duration = performanceService.measureBetween('test-measure', 'start', 'end');
      expect(global.performance.measure).toHaveBeenCalledWith('test-measure', 'start', 'end');
      expect(typeof duration).toBe('number');
    });

    it('should handle measurement errors gracefully', () => {
      global.performance.measure = vi.fn().mockImplementation(() => {
        throw new Error('Measurement failed');
      });

      const duration = performanceService.measureBetween('test-measure', 'start', 'end');
      expect(duration).toBe(0);
    });
  });

  describe('Performance Score Calculation', () => {
    it('should return a valid score', () => {
      const score = performanceService.getPerformanceScore();
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });
  });

  describe('Performance Recommendations', () => {
    it('should provide recommendations', () => {
      const recommendations = performanceService.getRecommendations();
      expect(Array.isArray(recommendations)).toBe(true);
      expect(recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('PWA Detection', () => {
    it('should detect standalone mode', () => {
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation(query => ({
          matches: query === '(display-mode: standalone)',
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      });

      const isPWA = performanceService.isPWA();
      expect(isPWA).toBe(true);
    });

    it('should detect non-PWA mode', () => {
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

      const isPWA = performanceService.isPWA();
      expect(isPWA).toBe(false);
    });
  });

  describe('Connection Information', () => {
    it('should return connection info when available', () => {
      const mockConnection = {
        effectiveType: '4g',
        downlink: 10,
        rtt: 50,
        saveData: false
      };

      Object.defineProperty(navigator, 'connection', {
        writable: true,
        value: mockConnection
      });

      const connectionInfo = performanceService.getConnectionInfo();
      expect(connectionInfo).toEqual(mockConnection);
    });

    it('should return null when connection API not available', () => {
      Object.defineProperty(navigator, 'connection', {
        writable: true,
        value: undefined
      });

      const connectionInfo = performanceService.getConnectionInfo();
      expect(connectionInfo).toBeNull();
    });
  });

  describe('Resource Timing', () => {
    it('should get resource timings', () => {
      const mockResourceTimings = [
        {
          name: 'https://example.com/script.js',
          startTime: 100,
          duration: 200,
          transferSize: 50000
        }
      ];

      global.performance.getEntriesByType = vi.fn().mockReturnValue(mockResourceTimings);

      const timings = performanceService.getResourceTimings();
      expect(timings).toEqual(mockResourceTimings);
      expect(global.performance.getEntriesByType).toHaveBeenCalledWith('resource');
    });

    it('should get navigation timing', () => {
      const mockNavigationTiming = {
        name: 'https://example.com',
        startTime: 0,
        duration: 1000,
        loadEventEnd: 1000,
        fetchStart: 0
      };

      global.performance.getEntriesByType = vi.fn().mockReturnValue([mockNavigationTiming]);

      const timing = performanceService.getNavigationTiming();
      expect(timing).toEqual(mockNavigationTiming);
      expect(global.performance.getEntriesByType).toHaveBeenCalledWith('navigation');
    });

    it('should return null when no navigation timing available', () => {
      global.performance.getEntriesByType = vi.fn().mockReturnValue([]);

      const timing = performanceService.getNavigationTiming();
      expect(timing).toBeNull();
    });
  });

  describe('Performance History', () => {
    it('should store performance metrics in localStorage', () => {
      const mockMetrics = [{
        fcp: 1000,
        lcp: 1500,
        score: 95,
        timestamp: Date.now()
      }];

      localStorage.setItem('performance-metrics', JSON.stringify(mockMetrics));

      const history = performanceService.getPerformanceHistory();
      expect(history).toHaveLength(1);
      expect(history[0]).toEqual(mockMetrics[0]);
    });

    it('should return empty array when no history available', () => {
      const history = performanceService.getPerformanceHistory();
      expect(history).toEqual([]);
    });

    it('should handle corrupted localStorage data', () => {
      localStorage.setItem('performance-metrics', 'invalid-json');

      const history = performanceService.getPerformanceHistory();
      expect(history).toEqual([]);
    });
  });

  describe('Cleanup', () => {
    it('should disconnect observers', () => {
      performanceService.disconnect();
      // Test passes if no errors are thrown
      expect(true).toBe(true);
    });
  });
});

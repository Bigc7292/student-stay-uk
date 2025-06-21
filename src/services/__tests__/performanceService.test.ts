import { describe, it, expect, beforeEach, vi } from 'vitest';
import { performanceService } from '../performanceService';

describe('PerformanceService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe('Performance Metrics Collection', () => {
    it('should initialize with empty metrics', () => {
      const metrics = performanceService.getMetrics();
      expect(metrics).toBeDefined();
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
    it('should return perfect score for excellent metrics', () => {
      // Mock excellent metrics
      const mockMetrics = {
        fcp: 1000,
        lcp: 1500,
        fid: 50,
        cls: 0.05,
        jsSize: 500000,
        totalSize: 1500000,
        pageLoadTime: 2000
      };

      vi.spyOn(performanceService, 'getMetrics').mockReturnValue(mockMetrics);

      const score = performanceService.getPerformanceScore();
      expect(score).toBe(100);
    });

    it('should deduct points for poor FCP', () => {
      const mockMetrics = {
        fcp: 2500, // Poor FCP
        lcp: 1500,
        fid: 50,
        cls: 0.05,
        jsSize: 500000,
        totalSize: 1500000,
        pageLoadTime: 2000
      };

      vi.spyOn(performanceService, 'getMetrics').mockReturnValue(mockMetrics);

      const score = performanceService.getPerformanceScore();
      expect(score).toBe(90); // 100 - 10 for poor FCP
    });

    it('should deduct points for poor LCP', () => {
      const mockMetrics = {
        fcp: 1000,
        lcp: 3000, // Poor LCP
        fid: 50,
        cls: 0.05,
        jsSize: 500000,
        totalSize: 1500000,
        pageLoadTime: 2000
      };

      vi.spyOn(performanceService, 'getMetrics').mockReturnValue(mockMetrics);

      const score = performanceService.getPerformanceScore();
      expect(score).toBe(85); // 100 - 15 for poor LCP
    });

    it('should deduct points for poor FID', () => {
      const mockMetrics = {
        fcp: 1000,
        lcp: 1500,
        fid: 150, // Poor FID
        cls: 0.05,
        jsSize: 500000,
        totalSize: 1500000,
        pageLoadTime: 2000
      };

      vi.spyOn(performanceService, 'getMetrics').mockReturnValue(mockMetrics);

      const score = performanceService.getPerformanceScore();
      expect(score).toBe(90); // 100 - 10 for poor FID
    });

    it('should deduct points for poor CLS', () => {
      const mockMetrics = {
        fcp: 1000,
        lcp: 1500,
        fid: 50,
        cls: 0.15, // Poor CLS
        jsSize: 500000,
        totalSize: 1500000,
        pageLoadTime: 2000
      };

      vi.spyOn(performanceService, 'getMetrics').mockReturnValue(mockMetrics);

      const score = performanceService.getPerformanceScore();
      expect(score).toBe(90); // 100 - 10 for poor CLS
    });

    it('should deduct points for large JavaScript bundle', () => {
      const mockMetrics = {
        fcp: 1000,
        lcp: 1500,
        fid: 50,
        cls: 0.05,
        jsSize: 1500000, // Large JS bundle
        totalSize: 2000000,
        pageLoadTime: 2000
      };

      vi.spyOn(performanceService, 'getMetrics').mockReturnValue(mockMetrics);

      const score = performanceService.getPerformanceScore();
      expect(score).toBe(90); // 100 - 10 for large JS
    });

    it('should never return negative score', () => {
      const mockMetrics = {
        fcp: 5000,
        lcp: 5000,
        fid: 500,
        cls: 0.5,
        jsSize: 5000000,
        totalSize: 10000000,
        pageLoadTime: 10000
      };

      vi.spyOn(performanceService, 'getMetrics').mockReturnValue(mockMetrics);

      const score = performanceService.getPerformanceScore();
      expect(score).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Performance Recommendations', () => {
    it('should provide recommendations for poor FCP', () => {
      const mockMetrics = {
        fcp: 2500,
        lcp: 1500,
        fid: 50,
        cls: 0.05,
        jsSize: 500000,
        totalSize: 1500000,
        pageLoadTime: 2000
      };

      vi.spyOn(performanceService, 'getMetrics').mockReturnValue(mockMetrics);

      const recommendations = performanceService.getRecommendations();
      expect(recommendations).toContain('Optimize First Contentful Paint by reducing render-blocking resources');
    });

    it('should provide recommendations for poor LCP', () => {
      const mockMetrics = {
        fcp: 1000,
        lcp: 3000,
        fid: 50,
        cls: 0.05,
        jsSize: 500000,
        totalSize: 1500000,
        pageLoadTime: 2000
      };

      vi.spyOn(performanceService, 'getMetrics').mockReturnValue(mockMetrics);

      const recommendations = performanceService.getRecommendations();
      expect(recommendations).toContain('Improve Largest Contentful Paint by optimizing images and critical resources');
    });

    it('should provide recommendations for large bundles', () => {
      const mockMetrics = {
        fcp: 1000,
        lcp: 1500,
        fid: 50,
        cls: 0.05,
        jsSize: 1500000,
        totalSize: 2000000,
        pageLoadTime: 2000
      };

      vi.spyOn(performanceService, 'getMetrics').mockReturnValue(mockMetrics);

      const recommendations = performanceService.getRecommendations();
      expect(recommendations).toContain('Reduce JavaScript bundle size through code splitting and tree shaking');
    });

    it('should congratulate on excellent performance', () => {
      const mockMetrics = {
        fcp: 1000,
        lcp: 1500,
        fid: 50,
        cls: 0.05,
        jsSize: 500000,
        totalSize: 1500000,
        pageLoadTime: 2000
      };

      vi.spyOn(performanceService, 'getMetrics').mockReturnValue(mockMetrics);

      const recommendations = performanceService.getRecommendations();
      expect(recommendations).toContain('Great job! Your app performance is excellent.');
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
      const mockMetrics = {
        fcp: 1000,
        lcp: 1500,
        score: 95,
        timestamp: Date.now()
      };

      localStorage.setItem('performance-metrics', JSON.stringify(mockMetrics));

      const history = performanceService.getPerformanceHistory();
      expect(history).toHaveLength(1);
      expect(history[0]).toEqual(mockMetrics);
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
    it('should disconnect all observers', () => {
      const mockObserver = {
        disconnect: vi.fn()
      };

      // Mock the observers array
      (performanceService as any).observers = [mockObserver];

      performanceService.disconnect();

      expect(mockObserver.disconnect).toHaveBeenCalled();
    });
  });
});

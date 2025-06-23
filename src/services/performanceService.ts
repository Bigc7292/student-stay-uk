
import * as Sentry from '@sentry/react';

// Performance monitoring and optimization service
export interface PerformanceMetrics {
  memoryUsage: number;
  jsSize: number;
  cssSize: number;
  imageSize: number;
  totalSize: number;
  ttfb: number;
  domContentLoaded: number;
  loadComplete: number;
  pageLoadTime: number;
  fcp: number;
  lcp: number;
  fid: number;
  cls: number;
  score: number;
  timestamp: number;
  userAgent: string;
  connection: string;
}

export interface PerformanceEntry {
  name: string;
  startTime: number;
  duration: number;
  entryType: string;
  type?: string;
}

class PerformanceService {
  private metrics: PerformanceMetrics[] = [];
  private observer: PerformanceObserver | null = null;
  private isMonitoring: boolean = false;
  private currentMetrics: PerformanceMetrics;

  constructor() {
    this.currentMetrics = this.getDefaultMetrics();
    this.initializePerformanceMonitoring();
  }

  private getDefaultMetrics(): PerformanceMetrics {
    return {
      memoryUsage: 0,
      jsSize: 0,
      cssSize: 0,
      imageSize: 0,
      totalSize: 0,
      ttfb: 0,
      domContentLoaded: 0,
      loadComplete: 0,
      pageLoadTime: 0,
      fcp: 0,
      lcp: 0,
      fid: 0,
      cls: 0,
      score: 100,
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      connection: this.getConnectionType()
    };
  }

  private initializePerformanceMonitoring(): void {
    if (typeof window === 'undefined') return;

    try {
      // Initialize Performance Observer
      if ('PerformanceObserver' in window) {
        this.observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry) => {
            this.processPerformanceEntry(entry);
          });
        });

        this.observer.observe({ 
          entryTypes: ['navigation', 'resource', 'paint', 'largest-contentful-paint'] 
        });
        this.isMonitoring = true;
      }
    } catch (error) {
      console.warn('Performance monitoring initialization failed:', error);
    }
  }

  private processPerformanceEntry(entry: PerformanceEntry): void {
    try {
      if (entry.entryType === 'navigation') {
        this.handleNavigationTiming(entry as any);
      } else if (entry.entryType === 'paint') {
        this.handlePaintTiming(entry);
      } else if (entry.entryType === 'largest-contentful-paint') {
        this.handleLCPTiming(entry);
      }
    } catch (error) {
      console.warn('Error processing performance entry:', error);
    }
  }

  private handleNavigationTiming(entry: PerformanceNavigationTiming): void {
    const navigationStart = entry.fetchStart || 0;
    const metrics: PerformanceMetrics = {
      memoryUsage: this.getMemoryUsage(),
      jsSize: 0,
      cssSize: 0,
      imageSize: 0,
      totalSize: this.calculateResourceSizes(),
      ttfb: entry.responseStart - entry.requestStart,
      domContentLoaded: entry.domContentLoadedEventEnd - navigationStart,
      loadComplete: entry.loadEventEnd - navigationStart,
      pageLoadTime: entry.loadEventEnd - entry.fetchStart,
      fcp: 0,
      lcp: 0,
      fid: 0,
      cls: 0,
      score: this.calculatePerformanceScore(entry),
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      connection: this.getConnectionType()
    };

    this.currentMetrics = metrics;
    this.metrics.push(metrics);
    this.logMetrics(metrics);
  }

  private handlePaintTiming(entry: PerformanceEntry): void {
    if (entry.name === 'first-contentful-paint') {
      this.currentMetrics.fcp = entry.startTime;
    }
  }

  private handleLCPTiming(entry: PerformanceEntry): void {
    this.currentMetrics.lcp = entry.startTime;
  }

  private calculateResourceSizes(): number {
    try {
      const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
      return resources.reduce((total, resource) => {
        return total + (resource.transferSize || 0);
      }, 0);
    } catch (error) {
      return 0;
    }
  }

  private getMemoryUsage(): number {
    try {
      if ('memory' in performance) {
        return (performance as any).memory.usedJSHeapSize || 0;
      }
      return 0;
    } catch (error) {
      return 0;
    }
  }

  private calculatePerformanceScore(entry: PerformanceNavigationTiming): number {
    const loadTime = entry.loadEventEnd - entry.fetchStart;
    if (loadTime < 1000) return 95;
    if (loadTime < 2000) return 85;
    if (loadTime < 3000) return 75;
    if (loadTime < 4000) return 65;
    return 50;
  }

  private getConnectionType(): string {
    try {
      const connection = (navigator as any).connection;
      return connection?.effectiveType || 'unknown';
    } catch (error) {
      return 'unknown';
    }
  }

  private logMetrics(metrics: PerformanceMetrics): void {
    console.info('Performance Metrics:', metrics);
    
    // Send to Sentry if available
    try {
      Sentry.addBreadcrumb({
        category: 'performance',
        message: 'Performance metrics collected',
        data: {
          pageLoadTime: metrics.pageLoadTime,
          score: metrics.score
        },
        level: 'info'
      });
    } catch (error) {
      // Sentry not available, continue
    }
  }

  // Public API methods
  public getMetrics(): PerformanceMetrics {
    return this.currentMetrics;
  }

  public getLatestMetrics(): PerformanceMetrics | null {
    return this.metrics.length > 0 ? this.metrics[this.metrics.length - 1] : null;
  }

  public getPerformanceScore(): number {
    const metrics = this.currentMetrics;
    let score = 100;

    // Apply penalties based on metric values
    if (metrics.fcp > 2500) score -= 10;
    if (metrics.lcp > 2500) score -= 15;
    if (metrics.fid > 100) score -= 10;
    if (metrics.cls > 0.1) score -= 10;
    if (metrics.jsSize > 1000000) score -= 10;
    if (metrics.pageLoadTime > 3000) score -= 15;

    return Math.max(0, Math.min(100, score));
  }

  public getRecommendations(): string[] {
    const metrics = this.currentMetrics;
    const recommendations: string[] = [];

    if (metrics.fcp > 2500) {
      recommendations.push('Optimize First Contentful Paint by reducing render-blocking resources');
    }

    if (metrics.lcp > 2500) {
      recommendations.push('Improve Largest Contentful Paint by optimizing images and critical resources');
    }

    if (metrics.fid > 100) {
      recommendations.push('Reduce First Input Delay by optimizing JavaScript execution');
    }

    if (metrics.cls > 0.1) {
      recommendations.push('Fix Cumulative Layout Shift by stabilizing layout elements');
    }

    if (metrics.jsSize > 1000000) {
      recommendations.push('Reduce JavaScript bundle size through code splitting and tree shaking');
    }

    if (metrics.pageLoadTime > 3000) {
      recommendations.push('Improve page load time by optimizing critical resources');
    }

    if (recommendations.length === 0) {
      recommendations.push('Great job! Your app performance is excellent.');
    }

    return recommendations;
  }

  public getConnectionInfo(): { effectiveType: string; downlink: number; rtt: number; saveData: boolean } | null {
    try {
      const connection = (navigator as any).connection;
      if (connection) {
        return {
          effectiveType: connection.effectiveType || '4g',
          downlink: connection.downlink || 10,
          rtt: connection.rtt || 50,
          saveData: connection.saveData || false
        };
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  public isPWA(): boolean {
    try {
      return window.matchMedia('(display-mode: standalone)').matches;
    } catch (error) {
      return false;
    }
  }

  public markEvent(name: string): void {
    try {
      performance.mark(name);
    } catch (error) {
      console.warn(`Failed to mark event: ${name}`, error);
    }
  }

  public measureBetween(measureName: string, startMark: string, endMark: string): number {
    try {
      performance.measure(measureName, startMark, endMark);
      const measure = performance.getEntriesByName(measureName, 'measure')[0];
      return measure ? measure.duration : 0;
    } catch (error) {
      console.warn(`Failed to measure between ${startMark} and ${endMark}:`, error);
      return 0;
    }
  }

  public disconnect(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.isMonitoring = false;
    }
  }

  public clearMetrics(): void {
    this.metrics = [];
    this.currentMetrics = this.getDefaultMetrics();
  }

  public startMonitoring(): void {
    if (!this.isMonitoring) {
      this.initializePerformanceMonitoring();
    }
  }

  public stopMonitoring(): void {
    this.disconnect();
  }

  public measureCustomMetric(name: string, fn: () => void): number {
    const start = performance.now();
    fn();
    const end = performance.now();
    const duration = end - start;
    
    console.info(`Custom metric "${name}": ${duration.toFixed(2)}ms`);
    return duration;
  }

  public markCustomEvent(name: string): void {
    this.markEvent(name);
  }

  public getResourceTimings(): PerformanceResourceTiming[] {
    try {
      return performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    } catch (error) {
      return [];
    }
  }

  public getNavigationTiming(): PerformanceNavigationTiming | null {
    try {
      const entries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
      return entries.length > 0 ? entries[0] : null;
    } catch (error) {
      return null;
    }
  }

  public getPerformanceHistory(): PerformanceMetrics[] {
    try {
      const stored = localStorage.getItem('performance-metrics');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      return [];
    }
  }
}

export const performanceService = new PerformanceService();


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

  constructor() {
    this.initializePerformanceMonitoring();
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
      score: this.calculatePerformanceScore(entry),
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      connection: this.getConnectionType()
    };

    this.metrics.push(metrics);
    this.logMetrics(metrics);
  }

  private handlePaintTiming(entry: PerformanceEntry): void {
    if (entry.name === 'first-contentful-paint') {
      const latestMetrics = this.metrics[this.metrics.length - 1];
      if (latestMetrics) {
        latestMetrics.fcp = entry.startTime;
      }
    }
  }

  private handleLCPTiming(entry: PerformanceEntry): void {
    const latestMetrics = this.metrics[this.metrics.length - 1];
    if (latestMetrics) {
      latestMetrics.lcp = entry.startTime;
    }
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

  public getMetrics(): PerformanceMetrics[] {
    return [...this.metrics];
  }

  public getLatestMetrics(): PerformanceMetrics | null {
    return this.metrics.length > 0 ? this.metrics[this.metrics.length - 1] : null;
  }

  public clearMetrics(): void {
    this.metrics = [];
  }

  public startMonitoring(): void {
    if (!this.isMonitoring) {
      this.initializePerformanceMonitoring();
    }
  }

  public stopMonitoring(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.isMonitoring = false;
    }
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
    try {
      performance.mark(name);
    } catch (error) {
      console.warn(`Failed to mark custom event: ${name}`, error);
    }
  }

  // Convert PerformanceEntryList to array
  private convertEntryList(entryList: PerformanceEntryList): PerformanceEntry[] {
    const entries: PerformanceEntry[] = [];
    for (let i = 0; i < entryList.length; i++) {
      const entry = entryList[i];
      entries.push({
        name: entry.name,
        startTime: entry.startTime,
        duration: entry.duration,
        entryType: entry.entryType,
        type: (entry as any).type || entry.entryType
      });
    }
    return entries;
  }
}

export const performanceService = new PerformanceService();

// Performance Monitoring Service
export interface PerformanceMetrics {
  // Core Web Vitals
  fcp: number; // First Contentful Paint
  lcp: number; // Largest Contentful Paint
  fid: number; // First Input Delay
  cls: number; // Cumulative Layout Shift
  
  // Custom metrics
  ttfb: number; // Time to First Byte
  domContentLoaded: number;
  loadComplete: number;
  
  // Resource metrics
  jsSize: number;
  cssSize: number;
  imageSize: number;
  totalSize: number;
  
  // User experience
  pageLoadTime: number;
  interactionDelay: number;
  memoryUsage: number;
}

export interface PerformanceEntry {
  name: string;
  startTime: number;
  duration: number;
  type: string;
}

class PerformanceService {
  private metrics: Partial<PerformanceMetrics> = {};
  private observers: PerformanceObserver[] = [];
  private startTime: number = performance.now();

  constructor() {
    this.initializePerformanceMonitoring();
  }

  // Initialize performance monitoring
  private initializePerformanceMonitoring() {
    // Monitor Core Web Vitals
    this.observeWebVitals();
    
    // Monitor resource loading
    this.observeResourceTiming();
    
    // Monitor navigation timing
    this.observeNavigationTiming();
    
    // Monitor memory usage
    this.observeMemoryUsage();
    
    // Monitor user interactions
    this.observeUserInteractions();

    // Report metrics when page is about to unload
    window.addEventListener('beforeunload', () => {
      this.reportMetrics();
    });

    // Report metrics when page becomes hidden
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        this.reportMetrics();
      }
    });
  }

  // Observe Core Web Vitals
  private observeWebVitals() {
    // First Contentful Paint
    this.createObserver('paint', (entries) => {
      entries.forEach((entry) => {
        if (entry.name === 'first-contentful-paint') {
          this.metrics.fcp = entry.startTime;
        }
      });
    });

    // Largest Contentful Paint
    this.createObserver('largest-contentful-paint', (entries) => {
      const lastEntry = entries[entries.length - 1];
      this.metrics.lcp = lastEntry.startTime;
    });

    // First Input Delay
    this.createObserver('first-input', (entries) => {
      const firstInput = entries[0];
      this.metrics.fid = firstInput.processingStart - firstInput.startTime;
    });

    // Cumulative Layout Shift
    let clsValue = 0;
    this.createObserver('layout-shift', (entries) => {
      entries.forEach((entry) => {
        if (!(entry as any).hadRecentInput) {
          clsValue += (entry as any).value;
        }
      });
      this.metrics.cls = clsValue;
    });
  }

  // Observe resource timing
  private observeResourceTiming() {
    this.createObserver('resource', (entries) => {
      let jsSize = 0;
      let cssSize = 0;
      let imageSize = 0;
      let totalSize = 0;

      entries.forEach((entry: any) => {
        const size = entry.transferSize || entry.encodedBodySize || 0;
        totalSize += size;

        if (entry.name.includes('.js')) {
          jsSize += size;
        } else if (entry.name.includes('.css')) {
          cssSize += size;
        } else if (entry.name.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)) {
          imageSize += size;
        }
      });

      this.metrics.jsSize = jsSize;
      this.metrics.cssSize = cssSize;
      this.metrics.imageSize = imageSize;
      this.metrics.totalSize = totalSize;
    });
  }

  // Observe navigation timing
  private observeNavigationTiming() {
    this.createObserver('navigation', (entries) => {
      const navigation = entries[0] as any;
      
      this.metrics.ttfb = navigation.responseStart - navigation.requestStart;
      this.metrics.domContentLoaded = navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart;
      this.metrics.loadComplete = navigation.loadEventEnd - navigation.loadEventStart;
      this.metrics.pageLoadTime = navigation.loadEventEnd - navigation.fetchStart;
    });
  }

  // Observe memory usage
  private observeMemoryUsage() {
    if ('memory' in performance) {
      const updateMemory = () => {
        const memory = (performance as any).memory;
        this.metrics.memoryUsage = memory.usedJSHeapSize;
      };

      updateMemory();
      setInterval(updateMemory, 5000); // Update every 5 seconds
    }
  }

  // Observe user interactions
  private observeUserInteractions() {
    let interactionStart = 0;

    const measureInteraction = (event: Event) => {
      if (interactionStart === 0) {
        interactionStart = performance.now();
      }
    };

    const endInteraction = () => {
      if (interactionStart > 0) {
        const delay = performance.now() - interactionStart;
        this.metrics.interactionDelay = delay;
        interactionStart = 0;
      }
    };

    // Listen for user interactions
    ['click', 'keydown', 'touchstart'].forEach(eventType => {
      document.addEventListener(eventType, measureInteraction, { passive: true });
    });

    // End interaction measurement after a delay
    ['click', 'keyup', 'touchend'].forEach(eventType => {
      document.addEventListener(eventType, () => {
        setTimeout(endInteraction, 100);
      }, { passive: true });
    });
  }

  // Create performance observer
  private createObserver(type: string, callback: (entries: PerformanceEntry[]) => void) {
    try {
      const observer = new PerformanceObserver((list) => {
        callback(list.getEntries());
      });
      
      observer.observe({ type, buffered: true });
      this.observers.push(observer);
    } catch (error) {
      console.warn(`Performance observer for ${type} not supported:`, error);
    }
  }

  // Get current metrics
  getMetrics(): Partial<PerformanceMetrics> {
    return { ...this.metrics };
  }

  // Get performance score (0-100)
  getPerformanceScore(): number {
    const metrics = this.getMetrics();
    let score = 100;

    // Deduct points based on Core Web Vitals
    if (metrics.fcp && metrics.fcp > 1800) score -= 10;
    if (metrics.lcp && metrics.lcp > 2500) score -= 15;
    if (metrics.fid && metrics.fid > 100) score -= 10;
    if (metrics.cls && metrics.cls > 0.1) score -= 10;

    // Deduct points for large resources
    if (metrics.jsSize && metrics.jsSize > 1000000) score -= 10; // 1MB
    if (metrics.totalSize && metrics.totalSize > 3000000) score -= 10; // 3MB

    // Deduct points for slow loading
    if (metrics.pageLoadTime && metrics.pageLoadTime > 3000) score -= 15;

    return Math.max(0, score);
  }

  // Get performance recommendations
  getRecommendations(): string[] {
    const metrics = this.getMetrics();
    const recommendations: string[] = [];

    if (metrics.fcp && metrics.fcp > 1800) {
      recommendations.push('Optimize First Contentful Paint by reducing render-blocking resources');
    }

    if (metrics.lcp && metrics.lcp > 2500) {
      recommendations.push('Improve Largest Contentful Paint by optimizing images and critical resources');
    }

    if (metrics.fid && metrics.fid > 100) {
      recommendations.push('Reduce First Input Delay by minimizing JavaScript execution time');
    }

    if (metrics.cls && metrics.cls > 0.1) {
      recommendations.push('Fix Cumulative Layout Shift by setting dimensions for images and ads');
    }

    if (metrics.jsSize && metrics.jsSize > 1000000) {
      recommendations.push('Reduce JavaScript bundle size through code splitting and tree shaking');
    }

    if (metrics.imageSize && metrics.imageSize > 2000000) {
      recommendations.push('Optimize images by using modern formats and appropriate sizing');
    }

    if (metrics.pageLoadTime && metrics.pageLoadTime > 3000) {
      recommendations.push('Improve overall page load time by optimizing critical rendering path');
    }

    if (recommendations.length === 0) {
      recommendations.push('Great job! Your app performance is excellent.');
    }

    return recommendations;
  }

  // Mark custom performance events
  markEvent(name: string): void {
    performance.mark(name);
  }

  // Measure time between two marks
  measureBetween(name: string, startMark: string, endMark: string): number {
    try {
      performance.measure(name, startMark, endMark);
      const measure = performance.getEntriesByName(name, 'measure')[0];
      return measure.duration;
    } catch (error) {
      console.warn('Failed to measure performance:', error);
      return 0;
    }
  }

  // Report metrics to analytics (mock implementation)
  private reportMetrics(): void {
    const metrics = this.getMetrics();
    const score = this.getPerformanceScore();

    // In a real app, you would send this to your analytics service
    console.log('Performance Metrics:', {
      ...metrics,
      score,
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      connection: (navigator as any).connection?.effectiveType || 'unknown'
    });

    // Store in localStorage for debugging
    try {
      localStorage.setItem('performance-metrics', JSON.stringify({
        ...metrics,
        score,
        timestamp: Date.now()
      }));
    } catch (error) {
      console.warn('Failed to store performance metrics:', error);
    }
  }

  // Get stored performance history
  getPerformanceHistory(): any[] {
    try {
      const stored = localStorage.getItem('performance-metrics');
      return stored ? [JSON.parse(stored)] : [];
    } catch (error) {
      return [];
    }
  }

  // Clean up observers
  disconnect(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }

  // Get resource timing details
  getResourceTimings(): PerformanceResourceTiming[] {
    return performance.getEntriesByType('resource') as PerformanceResourceTiming[];
  }

  // Get navigation timing details
  getNavigationTiming(): PerformanceNavigationTiming | null {
    const entries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
    return entries.length > 0 ? entries[0] : null;
  }

  // Check if app is running in PWA mode
  isPWA(): boolean {
    return window.matchMedia('(display-mode: standalone)').matches ||
           (window.navigator as any).standalone === true;
  }

  // Get connection information
  getConnectionInfo(): any {
    const connection = (navigator as any).connection;
    if (!connection) return null;

    return {
      effectiveType: connection.effectiveType,
      downlink: connection.downlink,
      rtt: connection.rtt,
      saveData: connection.saveData
    };
  }
}

export const performanceService = new PerformanceService();

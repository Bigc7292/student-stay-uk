// Performance Optimization Utilities
// Clean, efficient performance monitoring and optimization

interface PerformanceMetrics {
  fcp: number; // First Contentful Paint
  lcp: number; // Largest Contentful Paint
  fid: number; // First Input Delay
  cls: number; // Cumulative Layout Shift
  ttfb: number; // Time to First Byte
  domContentLoaded: number;
  loadComplete: number;
}

interface ResourceMetrics {
  totalSize: number;
  jsSize: number;
  cssSize: number;
  imageSize: number;
  fontSize: number;
  resourceCount: number;
}

class PerformanceOptimizer {
  private metrics: Partial<PerformanceMetrics> = {};
  private resourceMetrics: Partial<ResourceMetrics> = {};
  private observers: PerformanceObserver[] = [];

  constructor() {
    this.initializeObservers();
    this.measureInitialMetrics();
  }

  // Initialize performance observers
  private initializeObservers(): void {
    // Core Web Vitals observer
    if ('PerformanceObserver' in window) {
      try {
        // LCP Observer
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1] as any;
          this.metrics.lcp = lastEntry.startTime;
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
        this.observers.push(lcpObserver);

        // FID Observer
        const fidObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry: any) => {
            this.metrics.fid = entry.processingStart - entry.startTime;
          });
        });
        fidObserver.observe({ entryTypes: ['first-input'] });
        this.observers.push(fidObserver);

        // CLS Observer
        const clsObserver = new PerformanceObserver((list) => {
          let clsValue = 0;
          const entries = list.getEntries();
          entries.forEach((entry: any) => {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
            }
          });
          this.metrics.cls = clsValue;
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });
        this.observers.push(clsObserver);

        // Resource observer
        const resourceObserver = new PerformanceObserver((list) => {
          this.analyzeResources(list.getEntries());
        });
        resourceObserver.observe({ entryTypes: ['resource'] });
        this.observers.push(resourceObserver);

      } catch (error) {
        console.warn('Performance observers not fully supported:', error);
      }
    }
  }

  // Measure initial performance metrics
  private measureInitialMetrics(): void {
    // Wait for page load
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.captureInitialMetrics());
      window.addEventListener('load', () => this.captureLoadMetrics());
    } else {
      this.captureInitialMetrics();
      this.captureLoadMetrics();
    }
  }

  private captureInitialMetrics(): void {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    
    if (navigation) {
      this.metrics.ttfb = navigation.responseStart - navigation.requestStart;
      this.metrics.domContentLoaded = navigation.domContentLoadedEventEnd - navigation.navigationStart;
    }

    // FCP
    const fcpEntry = performance.getEntriesByName('first-contentful-paint')[0];
    if (fcpEntry) {
      this.metrics.fcp = fcpEntry.startTime;
    }
  }

  private captureLoadMetrics(): void {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    
    if (navigation) {
      this.metrics.loadComplete = navigation.loadEventEnd - navigation.navigationStart;
    }
  }

  // Analyze resource performance
  private analyzeResources(entries: PerformanceEntry[]): void {
    let totalSize = 0;
    let jsSize = 0;
    let cssSize = 0;
    let imageSize = 0;
    let fontSize = 0;

    entries.forEach((entry: any) => {
      const size = entry.transferSize || entry.encodedBodySize || 0;
      totalSize += size;

      const url = entry.name;
      if (url.includes('.js') || entry.initiatorType === 'script') {
        jsSize += size;
      } else if (url.includes('.css') || entry.initiatorType === 'css') {
        cssSize += size;
      } else if (entry.initiatorType === 'img' || /\.(jpg|jpeg|png|gif|webp|svg)/.test(url)) {
        imageSize += size;
      } else if (/\.(woff|woff2|ttf|otf)/.test(url)) {
        fontSize += size;
      }
    });

    this.resourceMetrics = {
      totalSize,
      jsSize,
      cssSize,
      imageSize,
      fontSize,
      resourceCount: entries.length
    };
  }

  // Get current performance metrics
  getMetrics(): PerformanceMetrics & ResourceMetrics {
    return {
      ...this.metrics,
      ...this.resourceMetrics
    } as PerformanceMetrics & ResourceMetrics;
  }

  // Get performance score (0-100)
  getPerformanceScore(): number {
    const metrics = this.getMetrics();
    let score = 100;

    // FCP scoring (0-1800ms = 100, 1800-3000ms = 50-100, >3000ms = 0-50)
    if (metrics.fcp) {
      if (metrics.fcp > 3000) score -= 30;
      else if (metrics.fcp > 1800) score -= 15;
    }

    // LCP scoring (0-2500ms = 100, 2500-4000ms = 50-100, >4000ms = 0-50)
    if (metrics.lcp) {
      if (metrics.lcp > 4000) score -= 30;
      else if (metrics.lcp > 2500) score -= 15;
    }

    // FID scoring (0-100ms = 100, 100-300ms = 50-100, >300ms = 0-50)
    if (metrics.fid) {
      if (metrics.fid > 300) score -= 20;
      else if (metrics.fid > 100) score -= 10;
    }

    // CLS scoring (0-0.1 = 100, 0.1-0.25 = 50-100, >0.25 = 0-50)
    if (metrics.cls) {
      if (metrics.cls > 0.25) score -= 20;
      else if (metrics.cls > 0.1) score -= 10;
    }

    return Math.max(0, Math.min(100, score));
  }

  // Get optimization recommendations
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

    if (metrics.jsSize && metrics.jsSize > 500000) { // 500KB
      recommendations.push('Reduce JavaScript bundle size through code splitting and tree shaking');
    }

    if (metrics.imageSize && metrics.imageSize > 1000000) { // 1MB
      recommendations.push('Optimize images using modern formats (WebP, AVIF) and compression');
    }

    if (metrics.resourceCount && metrics.resourceCount > 100) {
      recommendations.push('Reduce the number of HTTP requests by bundling resources');
    }

    return recommendations;
  }

  // Optimize images on the fly
  optimizeImages(): void {
    const images = document.querySelectorAll('img[data-src], img[src]');
    
    images.forEach((img: HTMLImageElement) => {
      // Lazy loading
      if ('loading' in HTMLImageElement.prototype) {
        img.loading = 'lazy';
      }

      // WebP support detection
      if (this.supportsWebP() && !img.src.includes('.webp')) {
        const webpSrc = img.src.replace(/\.(jpg|jpeg|png)$/, '.webp');
        img.src = webpSrc;
      }

      // Responsive images
      if (!img.sizes && img.width) {
        img.sizes = `(max-width: 768px) 100vw, ${img.width}px`;
      }
    });
  }

  // Check WebP support
  private supportsWebP(): boolean {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
  }

  // Preload critical resources
  preloadCriticalResources(): void {
    const criticalResources = [
      { href: '/fonts/inter-var.woff2', as: 'font', type: 'font/woff2' },
      { href: '/api/properties/featured', as: 'fetch' }
    ];

    criticalResources.forEach(resource => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = resource.href;
      link.as = resource.as;
      if (resource.type) link.type = resource.type;
      if (resource.as === 'font') link.crossOrigin = 'anonymous';
      document.head.appendChild(link);
    });
  }

  // Clean up observers
  cleanup(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }

  // Report performance data
  reportPerformance(): void {
    const metrics = this.getMetrics();
    const score = this.getPerformanceScore();
    
    // Send to analytics (if configured)
    if (window.gtag) {
      window.gtag('event', 'performance_metrics', {
        fcp: metrics.fcp,
        lcp: metrics.lcp,
        fid: metrics.fid,
        cls: metrics.cls,
        score: score
      });
    }

    // Log for development
    if (process.env.NODE_ENV === 'development') {
      console.group('🚀 Performance Metrics');
      console.log('Score:', score);
      console.log('Metrics:', metrics);
      console.log('Recommendations:', this.getRecommendations());
      console.groupEnd();
    }
  }
}

// Utility functions for performance optimization
export const performanceUtils = {
  // Debounce function calls
  debounce<T extends (...args: any[]) => any>(func: T, wait: number): T {
    let timeout: NodeJS.Timeout;
    return ((...args: any[]) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    }) as T;
  },

  // Throttle function calls
  throttle<T extends (...args: any[]) => any>(func: T, limit: number): T {
    let inThrottle: boolean;
    return ((...args: any[]) => {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    }) as T;
  },

  // Measure function execution time
  measureTime<T>(name: string, fn: () => T): T {
    const start = performance.now();
    const result = fn();
    const end = performance.now();
    console.log(`⏱️ ${name}: ${(end - start).toFixed(2)}ms`);
    return result;
  },

  // Check if element is in viewport
  isInViewport(element: Element): boolean {
    const rect = element.getBoundingClientRect();
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
  }
};

// Export singleton instance
export const performanceOptimizer = new PerformanceOptimizer();
export { PerformanceOptimizer };

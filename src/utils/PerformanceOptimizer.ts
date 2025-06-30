import { useEffect, useState } from 'react';

interface PerformanceMetrics {
  fcp: number;
  lcp: number;
  fid: number;
  cls: number;
  ttfb: number;
  domContentLoaded: number;
  loadComplete: number;
  jsSize: number;
  cssSize: number;
  imageSize: number;
  totalSize: number;
  pageLoadTime: number;
  interactionDelay: number;
  memoryUsage: number;
}

interface ConnectionInfo {
  effectiveType: string;
  downlink: number;
  rtt: number;
  saveData: boolean;
}

interface PerformanceOptimizerConfig {
  sampleRate?: number;
  timeToInteractiveThreshold?: number;
  goodConnectionThreshold?: number;
  maxCLS?: number;
  maxFID?: number;
  maxLCP?: number;
}

interface PerformanceEntry {
  name: string;
  entryType: string;
  startTime: number;
  duration: number;
}

class PerformanceOptimizer {
  private sampleRate: number;
  private timeToInteractiveThreshold: number;
  private goodConnectionThreshold: number;
  private maxCLS: number;
  private maxFID: number;
  private maxLCP: number;
  private observer: PerformanceObserver | null = null;

  constructor(config: PerformanceOptimizerConfig = {}) {
    this.sampleRate = config.sampleRate || 0.1;
    this.timeToInteractiveThreshold = config.timeToInteractiveThreshold || 3000;
    this.goodConnectionThreshold = config.goodConnectionThreshold || 10;
    this.maxCLS = config.maxCLS || 0.1;
    this.maxFID = config.maxFID || 100;
    this.maxLCP = config.maxLCP || 2500;
  }

  public start(): void {
    if (Math.random() > this.sampleRate) {
      console.log('Performance sampling skipped.');
      return;
    }

    if (!('PerformanceObserver' in window)) {
      console.warn('PerformanceObserver API not supported.');
      return;
    }

    this.observer = new PerformanceObserver((list) => {
      const entries = list.getEntries() as PerformanceEntry[];
      this.analyzePerformance(entries);
    });

    this.observer.observe({ entryTypes: ['navigation', 'resource', 'paint', 'first-input', 'layout-shift', 'largest-contentful-paint'] });
  }

  public stop(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
  }

  private analyzePerformance(entries: PerformanceEntry[]): void {
    const metrics: PerformanceMetrics = {
      fcp: this.calculateFCP(),
      lcp: this.calculateLCP(),
      fid: this.calculateFID(),
      cls: this.calculateCLS(),
      ttfb: this.calculateTTFB(),
      domContentLoaded: performance.timing.domContentLoadedEventEnd - performance.timing.navigationStart,
      loadComplete: performance.timing.loadEventEnd - performance.timing.navigationStart,
      jsSize: this.calculateResourceSize('script'),
      cssSize: this.calculateResourceSize('css'),
      imageSize: this.calculateResourceSize('img'),
      totalSize: this.calculateTotalSize(),
      pageLoadTime: this.calculateLoadTime(),
      interactionDelay: 0,
      memoryUsage: (performance as any).memory ? (performance as any).memory.usedJSHeapSize : 0,
    };

    console.log('Performance Metrics:', metrics);
    this.getRecommendations(metrics);
  }

  private calculateFCP(): number {
    try {
      const fcpEntry = performance.getEntriesByName('first-contentful-paint')[0];
      return fcpEntry ? fcpEntry.startTime : 0;
    } catch (error) {
      console.warn('Failed to calculate FCP:', error);
      return 0;
    }
  }

  private calculateLCP(): number {
    try {
      const lcpEntry = performance.getEntriesByType('largest-contentful-paint')[0];
      return lcpEntry ? lcpEntry.startTime : 0;
    } catch (error) {
      console.warn('Failed to calculate LCP:', error);
      return 0;
    }
  }

  private calculateFID(): number {
    try {
      const fidEntry = performance.getEntriesByType('first-input')[0] as PerformanceEntry;
      return fidEntry ? fidEntry.duration : 0;
    } catch (error) {
      console.warn('Failed to calculate FID:', error);
      return 0;
    }
  }

  private calculateCLS(): number {
    try {
      const clsEntry = performance.getEntriesByType('layout-shift').reduce((total, shift) => total + (shift as any).value, 0);
      return clsEntry || 0;
    } catch (error) {
      console.warn('Failed to calculate CLS:', error);
      return 0;
    }
  }

  private calculateLoadTime(): number {
    try {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (navigation && navigation.loadEventEnd && navigation.fetchStart) {
        return navigation.loadEventEnd - navigation.fetchStart;
      }
    } catch (error) {
      console.warn('Failed to calculate load time:', error);
    }
    return 0;
  }

  private calculateTTFB(): number {
    try {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (navigation && navigation.responseStart && navigation.fetchStart) {
        return navigation.responseStart - navigation.fetchStart;
      }
    } catch (error) {
      console.warn('Failed to calculate TTFB:', error);
    }
    return 0;
  }

  private calculateResourceSize(type: string): number {
    try {
      return performance.getEntriesByType('resource')
        .filter(entry => entry.name.endsWith(type))
        .reduce((total, entry) => total + (entry as any).decodedBodySize, 0);
    } catch (error) {
      console.warn(`Failed to calculate ${type} size:`, error);
      return 0;
    }
  }

  private calculateTotalSize(): number {
    try {
      return performance.getEntriesByType('resource')
        .reduce((total, entry) => total + (entry as any).decodedBodySize, 0);
    } catch (error) {
      console.warn('Failed to calculate total size:', error);
      return 0;
    }
  }

  public getRecommendations(metrics: PerformanceMetrics): string[] {
    const recommendations: string[] = [];

    if (metrics.fcp > 2500) {
      recommendations.push('Optimize initial JavaScript and CSS delivery to improve First Contentful Paint.');
    }

    if (metrics.lcp > this.maxLCP) {
      recommendations.push('Optimize large content elements (images, videos) to improve Largest Contentful Paint.');
    }

    if (metrics.fid > this.maxFID) {
      recommendations.push('Reduce JavaScript execution time to improve First Input Delay.');
    }

    if (metrics.cls > this.maxCLS) {
      recommendations.push('Fix layout instability issues to reduce Cumulative Layout Shift.');
    }

    if (metrics.ttfb > 800) {
      recommendations.push('Reduce server response time (TTFB) by optimizing server-side code or using a CDN.');
    }

    if (metrics.pageLoadTime > this.timeToInteractiveThreshold) {
      recommendations.push('Optimize overall page load time by reducing resource sizes and optimizing rendering.');
    }

    if (metrics.jsSize > 500000) {
      recommendations.push('Reduce JavaScript bundle size by using code splitting and tree shaking.');
    }

    if (metrics.cssSize > 200000) {
      recommendations.push('Minify and compress CSS files to reduce their size.');
    }

    if (metrics.imageSize > 1000000) {
      recommendations.push('Optimize images by compressing them and using appropriate formats (WebP).');
    }

    if (metrics.memoryUsage > 500000000) {
      recommendations.push('Reduce memory usage by optimizing JavaScript code and avoiding memory leaks.');
    }

    return recommendations;
  }

  public getPerformanceScore(metrics: PerformanceMetrics): number {
    let score = 100;

    // Apply penalties based on metric values
    if (metrics.fcp > 2500) score -= 10;
    if (metrics.lcp > this.maxLCP) score -= 15;
    if (metrics.fid > this.maxFID) score -= 15;
    if (metrics.cls > this.maxCLS) score -= 10;
    if (metrics.ttfb > 800) score -= 10;
    if (metrics.pageLoadTime > this.timeToInteractiveThreshold) score -= 20;

    // Ensure score is within 0-100 range
    return Math.max(0, Math.min(100, score));
  }

  public getConnectionInfo(): ConnectionInfo {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      return {
        effectiveType: connection.effectiveType || '4g',
        downlink: connection.downlink || 10,
        rtt: connection.rtt || 50,
        saveData: connection.saveData || false,
      };
    } else {
      return {
        effectiveType: '4g',
        downlink: 10,
        rtt: 50,
        saveData: false,
      };
    }
  }

  public isGoodConnection(): boolean {
    const connection = this.getConnectionInfo();
    return connection.downlink >= this.goodConnectionThreshold;
  }

  public markEvent(name: string): void {
    performance.mark(name);
  }

  public measureBetween(startMark: string, endMark: string, measureName: string): number {
    performance.measure(measureName, startMark, endMark);
    const measure = performance.getEntriesByName(measureName, 'measure')[0];
    return measure ? measure.duration : 0;
  }
}

export const usePerformanceOptimizer = (config: PerformanceOptimizerConfig = {}): {
  start: () => void;
  stop: () => void;
  getRecommendations: (metrics: PerformanceMetrics) => string[];
  getPerformanceScore: (metrics: PerformanceMetrics) => number;
  getConnectionInfo: () => ConnectionInfo;
  isGoodConnection: () => boolean;
  markEvent: (name: string) => void;
  measureBetween: (startMark: string, endMark: string, measureName: string) => number;
} => {
  const optimizer = new PerformanceOptimizer(config);

  useEffect(() => {
    optimizer.start();
    return () => optimizer.stop();
  }, []);

  return {
    start: () => optimizer.start(),
    stop: () => optimizer.stop(),
    getRecommendations: (metrics: PerformanceMetrics) => optimizer.getRecommendations(metrics),
    getPerformanceScore: (metrics: PerformanceMetrics) => optimizer.getPerformanceScore(metrics),
    getConnectionInfo: () => optimizer.getConnectionInfo(),
    isGoodConnection: () => optimizer.isGoodConnection(),
    markEvent: (name: string) => optimizer.markEvent(name),
    measureBetween: (startMark: string, endMark: string, measureName: string) => optimizer.measureBetween(startMark, endMark, measureName),
  };
};

export default PerformanceOptimizer;

// Analytics Service for user behavior tracking and monitoring
export interface AnalyticsEvent {
  name: string;
  properties?: Record<string, any>;
  timestamp: Date;
  userId?: string;
  sessionId: string;
}

export interface UserProperties {
  userId?: string;
  university?: string;
  userType: 'student' | 'anonymous';
  preferences?: Record<string, any>;
}

export interface PageView {
  page: string;
  title: string;
  url: string;
  referrer?: string;
  timestamp: Date;
  sessionId: string;
}

class AnalyticsService {
  private sessionId: string;
  private userId?: string;
  private isEnabled: boolean;
  private queue: AnalyticsEvent[] = [];
  private pageViews: PageView[] = [];

  constructor() {
    this.sessionId = this.generateSessionId();
    this.isEnabled = this.checkAnalyticsConsent();
    this.initializeAnalytics();
  }

  // Initialize analytics services
  private initializeAnalytics() {
    // Initialize Google Analytics 4 if available
    if (typeof window !== 'undefined' && import.meta.env.VITE_ANALYTICS_ID) {
      this.initializeGA4();
    }

    // Initialize performance monitoring
    this.initializePerformanceMonitoring();

    // Initialize error tracking
    this.initializeErrorTracking();

    // Start session tracking
    this.startSession();
  }

  // Initialize Google Analytics 4
  private initializeGA4() {
    const analyticsId = import.meta.env.VITE_ANALYTICS_ID;
    if (!analyticsId || !this.isEnabled || analyticsId === 'G-XXXXXXXXXX') {
      console.log('📊 Google Analytics not configured (optional)');
      return;
    }

    try {
      // Load GA4 script with error handling
      const script = document.createElement('script');
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${analyticsId}`;
      script.onerror = () => {
        console.warn('📊 Failed to load Google Analytics script (blocked by service worker or network)');
      };
      document.head.appendChild(script);

      // Initialize gtag
      (window as any).dataLayer = (window as any).dataLayer || [];
      const gtag = (...args: any[]) => {
        (window as any).dataLayer.push(args);
      };
      (window as any).gtag = gtag;

      gtag('js', new Date());
      gtag('config', analyticsId, {
        anonymize_ip: true,
        allow_google_signals: false,
        allow_ad_personalization_signals: false,
        cookie_flags: 'SameSite=Strict;Secure'
      });

      console.log('📊 Google Analytics 4 initialized');
    } catch (error) {
      console.warn('📊 Failed to initialize Google Analytics:', error);
    }
  }

  // Initialize performance monitoring
  private initializePerformanceMonitoring() {
    if (typeof window === 'undefined') return;

    // Monitor Core Web Vitals
    this.observeWebVitals();

    // Monitor custom performance metrics
    this.observeCustomMetrics();
  }

  // Observe Core Web Vitals
  private observeWebVitals() {
    // First Contentful Paint
    this.observePerformanceEntry('paint', (entries) => {
      entries.forEach((entry) => {
        if (entry.name === 'first-contentful-paint') {
          this.trackEvent('performance_metric', {
            metric: 'fcp',
            value: entry.startTime,
            rating: this.getPerformanceRating('fcp', entry.startTime)
          });
        }
      });
    });

    // Largest Contentful Paint
    this.observePerformanceEntry('largest-contentful-paint', (entries) => {
      const lastEntry = entries[entries.length - 1];
      this.trackEvent('performance_metric', {
        metric: 'lcp',
        value: lastEntry.startTime,
        rating: this.getPerformanceRating('lcp', lastEntry.startTime)
      });
    });

    // First Input Delay
    this.observePerformanceEntry('first-input', (entries) => {
      const firstInput = entries[0];
      const fid = (firstInput as any).processingStart - firstInput.startTime;
      this.trackEvent('performance_metric', {
        metric: 'fid',
        value: fid,
        rating: this.getPerformanceRating('fid', fid)
      });
    });

    // Cumulative Layout Shift
    let clsValue = 0;
    this.observePerformanceEntry('layout-shift', (entries) => {
      entries.forEach((entry) => {
        if (!(entry as any).hadRecentInput) {
          clsValue += (entry as any).value;
        }
      });
      
      this.trackEvent('performance_metric', {
        metric: 'cls',
        value: clsValue,
        rating: this.getPerformanceRating('cls', clsValue)
      });
    });
  }

  // Observe custom performance metrics
  private observeCustomMetrics() {
    // Time to Interactive
    window.addEventListener('load', () => {
      setTimeout(() => {
        const tti = performance.now();
        this.trackEvent('performance_metric', {
          metric: 'tti',
          value: tti,
          rating: this.getPerformanceRating('tti', tti)
        });
      }, 0);
    });

    // Navigation timing
    window.addEventListener('load', () => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (navigation) {
        this.trackEvent('navigation_timing', {
          dns_lookup: navigation.domainLookupEnd - navigation.domainLookupStart,
          tcp_connect: navigation.connectEnd - navigation.connectStart,
          request_response: navigation.responseEnd - navigation.requestStart,
          dom_processing: navigation.domContentLoadedEventEnd - navigation.responseEnd,
          load_complete: navigation.loadEventEnd - navigation.loadEventStart
        });
      }
    });
  }

  // Observe performance entries
  private observePerformanceEntry(type: string, callback: (entries: PerformanceEntry[]) => void) {
    try {
      const observer = new PerformanceObserver((list) => {
        callback(list.getEntries());
      });
      observer.observe({ type, buffered: true });
    } catch (error) {
      console.warn(`Performance observer for ${type} not supported:`, error);
    }
  }

  // Get performance rating
  private getPerformanceRating(metric: string, value: number): 'good' | 'needs-improvement' | 'poor' {
    const thresholds = {
      fcp: { good: 1800, poor: 3000 },
      lcp: { good: 2500, poor: 4000 },
      fid: { good: 100, poor: 300 },
      cls: { good: 0.1, poor: 0.25 },
      tti: { good: 3800, poor: 7300 }
    };

    const threshold = thresholds[metric as keyof typeof thresholds];
    if (!threshold) return 'good';

    if (value <= threshold.good) return 'good';
    if (value <= threshold.poor) return 'needs-improvement';
    return 'poor';
  }

  // Initialize error tracking
  private initializeErrorTracking() {
    if (typeof window === 'undefined') return;

    // Global error handler
    window.addEventListener('error', (event) => {
      this.trackError({
        type: 'javascript_error',
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack
      });
    });

    // Unhandled promise rejection handler
    window.addEventListener('unhandledrejection', (event) => {
      this.trackError({
        type: 'unhandled_promise_rejection',
        message: event.reason?.message || 'Unhandled promise rejection',
        stack: event.reason?.stack
      });
    });

    // React error boundary integration
    (window as any).__ANALYTICS_ERROR_HANDLER__ = (error: Error, errorInfo: any) => {
      this.trackError({
        type: 'react_error',
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack
      });
    };
  }

  // Start session tracking
  private startSession() {
    this.trackEvent('session_start', {
      user_agent: navigator.userAgent,
      screen_resolution: `${screen.width}x${screen.height}`,
      viewport_size: `${window.innerWidth}x${window.innerHeight}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: navigator.language
    });

    // Track session end on page unload
    window.addEventListener('beforeunload', () => {
      this.trackEvent('session_end', {
        session_duration: Date.now() - this.getSessionStartTime()
      });
      this.flush();
    });

    // Track page visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        this.trackEvent('page_hidden');
        this.flush();
      } else {
        this.trackEvent('page_visible');
      }
    });
  }

  // Generate session ID
  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Check analytics consent
  private checkAnalyticsConsent(): boolean {
    // Check for consent in localStorage
    const consent = localStorage.getItem('analytics-consent');
    if (consent === 'true') return true;
    if (consent === 'false') return false;

    // Default to enabled for anonymous analytics
    return true;
  }

  // Set user ID
  setUserId(userId: string) {
    this.userId = userId;
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('config', import.meta.env.VITE_ANALYTICS_ID, {
        user_id: userId
      });
    }
  }

  // Set user properties
  setUserProperties(properties: UserProperties) {
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('set', {
        user_properties: properties
      });
    }

    // Store locally for custom analytics
    localStorage.setItem('user-properties', JSON.stringify(properties));
  }

  // Track page view
  trackPageView(page: string, title: string, url?: string) {
    if (!this.isEnabled) return;

    const pageView: PageView = {
      page,
      title,
      url: url || window.location.href,
      referrer: document.referrer,
      timestamp: new Date(),
      sessionId: this.sessionId
    };

    this.pageViews.push(pageView);

    // Send to GA4
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'page_view', {
        page_title: title,
        page_location: pageView.url,
        page_referrer: pageView.referrer
      });
    }

    // Track custom page view event
    this.trackEvent('page_view', {
      page,
      title,
      url: pageView.url,
      referrer: pageView.referrer
    });
  }

  // Track custom event
  trackEvent(name: string, properties?: Record<string, any>) {
    if (!this.isEnabled) return;

    const event: AnalyticsEvent = {
      name,
      properties,
      timestamp: new Date(),
      userId: this.userId,
      sessionId: this.sessionId
    };

    this.queue.push(event);

    // Send to GA4
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', name, properties);
    }

    // Auto-flush if queue is getting large
    if (this.queue.length >= 10) {
      this.flush();
    }
  }

  // Track error
  trackError(error: {
    type: string;
    message: string;
    filename?: string;
    lineno?: number;
    colno?: number;
    stack?: string;
    componentStack?: string;
  }) {
    this.trackEvent('error', {
      error_type: error.type,
      error_message: error.message,
      error_filename: error.filename,
      error_line: error.lineno,
      error_column: error.colno,
      error_stack: error.stack,
      error_component_stack: error.componentStack
    });
  }

  // Track user interaction
  trackInteraction(element: string, action: string, properties?: Record<string, any>) {
    this.trackEvent('user_interaction', {
      element,
      action,
      ...properties
    });
  }

  // Track search
  trackSearch(query: string, filters?: Record<string, any>, results?: number) {
    this.trackEvent('search', {
      search_query: query,
      search_filters: filters,
      search_results: results
    });
  }

  // Track accommodation view
  trackAccommodationView(accommodationId: string, properties?: Record<string, any>) {
    this.trackEvent('accommodation_view', {
      accommodation_id: accommodationId,
      ...properties
    });
  }

  // Track feature usage
  trackFeatureUsage(feature: string, properties?: Record<string, any>) {
    this.trackEvent('feature_usage', {
      feature,
      ...properties
    });
  }

  // Enable/disable analytics
  setAnalyticsEnabled(enabled: boolean) {
    this.isEnabled = enabled;
    localStorage.setItem('analytics-consent', enabled.toString());

    if (enabled) {
      this.trackEvent('analytics_enabled');
    } else {
      this.trackEvent('analytics_disabled');
      this.flush();
    }
  }

  // Get analytics status
  isAnalyticsEnabled(): boolean {
    return this.isEnabled;
  }

  // Flush queued events
  flush() {
    if (this.queue.length === 0) return;

    // Send to custom analytics endpoint if available
    if (import.meta.env.VITE_ANALYTICS_ENDPOINT) {
      this.sendToCustomEndpoint();
    }

    // Store locally for debugging
    this.storeLocally();

    // Clear queue
    this.queue = [];
  }

  // Send to custom analytics endpoint
  private async sendToCustomEndpoint() {
    try {
      await fetch(import.meta.env.VITE_ANALYTICS_ENDPOINT!, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          events: this.queue,
          session_id: this.sessionId,
          user_id: this.userId,
          timestamp: new Date().toISOString()
        })
      });
    } catch (error) {
      console.warn('Failed to send analytics data:', error);
    }
  }

  // Store analytics data locally
  private storeLocally() {
    try {
      const stored = JSON.parse(localStorage.getItem('analytics-data') || '[]');
      stored.push(...this.queue);
      
      // Keep only last 100 events
      const recent = stored.slice(-100);
      localStorage.setItem('analytics-data', JSON.stringify(recent));
    } catch (error) {
      console.warn('Failed to store analytics data locally:', error);
    }
  }

  // Get session start time
  private getSessionStartTime(): number {
    const stored = sessionStorage.getItem('session-start-time');
    if (stored) return parseInt(stored);
    
    const startTime = Date.now();
    sessionStorage.setItem('session-start-time', startTime.toString());
    return startTime;
  }

  // Get analytics summary
  getAnalyticsSummary() {
    return {
      session_id: this.sessionId,
      user_id: this.userId,
      events_queued: this.queue.length,
      page_views: this.pageViews.length,
      is_enabled: this.isEnabled,
      session_duration: Date.now() - this.getSessionStartTime()
    };
  }

  // Export analytics data
  exportData() {
    const data = {
      events: JSON.parse(localStorage.getItem('analytics-data') || '[]'),
      page_views: this.pageViews,
      session_summary: this.getAnalyticsSummary(),
      user_properties: JSON.parse(localStorage.getItem('user-properties') || '{}')
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-data-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // Clear all analytics data
  clearData() {
    localStorage.removeItem('analytics-data');
    localStorage.removeItem('user-properties');
    sessionStorage.removeItem('session-start-time');
    this.queue = [];
    this.pageViews = [];
  }
}

export const analyticsService = new AnalyticsService();

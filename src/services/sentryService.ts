
import * as Sentry from '@sentry/react';
import { BrowserTracing } from '@sentry/tracing';

interface SentryConfig {
  dsn: string;
  environment: string;
  sampleRate: number;
  tracesSampleRate: number;
  debug: boolean;
}

class SentryService {
  private isInitialized: boolean = false;
  private config: SentryConfig;

  constructor() {
    this.config = {
      dsn: import.meta.env.VITE_SENTRY_DSN || '',
      environment: import.meta.env.MODE || 'development',
      sampleRate: 1.0,
      tracesSampleRate: 0.1,
      debug: import.meta.env.MODE === 'development'
    };

    this.initialize();
  }

  private initialize(): void {
    if (this.isInitialized || !this.config.dsn) {
      return;
    }

    try {
      Sentry.init({
        dsn: this.config.dsn,
        environment: this.config.environment,
        sampleRate: this.config.sampleRate,
        tracesSampleRate: this.config.tracesSampleRate,
        debug: this.config.debug,
        integrations: [
          new BrowserTracing({
            tracePropagationTargets: ["localhost", /^https:\/\/yourserver\.io\/api/],
          }),
        ],
        beforeSend(event) {
          // Filter out development errors
          if (event.environment === 'development') {
            return null;
          }
          return event;
        },
      });

      this.isInitialized = true;
      console.info('🐛 Sentry initialized successfully');
    } catch (error) {
      console.warn('Failed to initialize Sentry:', error);
    }
  }

  public captureException(error: Error, context?: any): void {
    if (!this.isInitialized) return;

    try {
      Sentry.withScope((scope) => {
        if (context) {
          scope.setContext('error_context', context);
        }
        Sentry.captureException(error);
      });
    } catch (err) {
      console.warn('Failed to capture exception:', err);
    }
  }

  public captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info'): void {
    if (!this.isInitialized) return;

    try {
      Sentry.captureMessage(message, level);
    } catch (error) {
      console.warn('Failed to capture message:', error);
    }
  }

  public addBreadcrumb(breadcrumb: {
    message: string;
    category?: string;
    level?: string;
    data?: any;
  }): void {
    if (!this.isInitialized) return;

    try {
      Sentry.addBreadcrumb({
        message: breadcrumb.message,
        category: breadcrumb.category || 'default',
        level: breadcrumb.level as any || 'info',
        data: breadcrumb.data
      });
    } catch (error) {
      console.warn('Failed to add breadcrumb:', error);
    }
  }

  public setUser(user: { id: string; email?: string; username?: string }): void {
    if (!this.isInitialized) return;

    try {
      Sentry.setUser(user);
    } catch (error) {
      console.warn('Failed to set user:', error);
    }
  }

  public setTag(key: string, value: string): void {
    if (!this.isInitialized) return;

    try {
      Sentry.setTag(key, value);
    } catch (error) {
      console.warn('Failed to set tag:', error);
    }
  }

  public setContext(key: string, context: any): void {
    if (!this.isInitialized) return;

    try {
      Sentry.setContext(key, context);
    } catch (error) {
      console.warn('Failed to set context:', error);
    }
  }

  public startSpan(operation: string, description?: string): any {
    if (!this.isInitialized) return null;

    try {
      return Sentry.startSpan({
        op: operation,
        description: description || operation
      }, (span) => {
        return span;
      });
    } catch (error) {
      console.warn('Failed to start span:', error);
      return null;
    }
  }

  public isEnabled(): boolean {
    return this.isInitialized;
  }

  public getConfig(): SentryConfig {
    return { ...this.config };
  }
}

export const sentryService = new SentryService();

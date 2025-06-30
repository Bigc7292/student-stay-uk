
// Global type declarations for window properties

declare global {
  interface Window {
    google?: {
      maps: any;
    };
    Sentry?: {
      withScope: (callback: (scope: any) => void) => void;
      captureException: (error: Error) => void;
      showReportDialog: (options: { eventId: string }) => void;
      addBreadcrumb: (breadcrumb: any) => void;
    };
    gtag?: (command: string, action: string, parameters?: any) => void;
    React?: {
      version: string;
    };
    navigateToTab?: (tabId: string) => void;
  }
}

export {};

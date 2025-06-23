// PWA Service
// Handles PWA installation, service worker updates, and push notifications

class PWAService {
  private deferredInstallPrompt: any = null;
  private installCallback: ((isInstalled: boolean) => void) | null = null;
  private updateCallback: (() => void) | null = null;
  private pushSubscriptionCallback: ((subscription: PushSubscription | null) => void) | null = null;
  private capabilities: {
    isInstallable: boolean;
    isInstalled: boolean;
    isOnline: boolean;
    hasNotificationPermission: boolean;
    supportsPushNotifications: boolean;
    supportsBackgroundSync: boolean;
  } = {
    isInstallable: false,
    isInstalled: false,
    isOnline: navigator.onLine,
    hasNotificationPermission: Notification.permission === 'granted',
    supportsPushNotifications: 'PushManager' in window,
    supportsBackgroundSync: 'SyncManager' in window
  };

  constructor() {
    window.addEventListener('beforeinstallprompt', (event: any) => {
      event.preventDefault();
      this.deferredInstallPrompt = event;
      this.capabilities.isInstallable = true;
      this.updateInstallStatus();
    });

    window.addEventListener('appinstalled', () => {
      this.deferredInstallPrompt = null;
      this.capabilities.isInstalled = true;
      this.capabilities.isInstallable = false;
      this.updateInstallStatus();
    });

    window.addEventListener('online', () => {
      this.capabilities.isOnline = true;
      this.updateCapabilities();
    });

    window.addEventListener('offline', () => {
      this.capabilities.isOnline = false;
      this.updateCapabilities();
    });

    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data === 'content-updated') {
        if (this.updateCallback) {
          this.updateCallback();
        }
      }
    });

    this.updateCapabilities();
  }

  on(event: 'install' | 'update' | 'pushSubscription', callback: (data: any) => void): void {
    if (event === 'install') {
      this.installCallback = callback;
    } else if (event === 'update') {
      this.updateCallback = callback;
    } else if (event === 'pushSubscription') {
      this.pushSubscriptionCallback = callback;
    }
  }

  off(event: 'install' | 'update' | 'pushSubscription'): void {
    if (event === 'install') {
      this.installCallback = null;
    } else if (event === 'update') {
      this.updateCallback = null;
    } else if (event === 'pushSubscription') {
      this.pushSubscriptionCallback = null;
    }
  }

  async installApp(): Promise<boolean> {
    if (this.deferredInstallPrompt) {
      this.deferredInstallPrompt.prompt();
      const choiceResult = await this.deferredInstallPrompt.userChoice;

      if (choiceResult.outcome === 'accepted') {
        this.capabilities.isInstalled = true;
        this.capabilities.isInstallable = false;
        this.updateInstallStatus();
        this.deferredInstallPrompt = null;
        return true;
      } else {
        return false;
      }
    }
    return false;
  }

  async updateServiceWorker(): Promise<void> {
    try {
      const registration = await navigator.serviceWorker.register('/service-worker.js');
      await registration.update();
    } catch (error) {
      console.error('Failed to update service worker:', error);
    }
  }

  async requestNotificationPermission(): Promise<boolean> {
    if (!('Notification' in window)) return false;

    const permission = await Notification.requestPermission();
    this.capabilities.hasNotificationPermission = permission === 'granted';
    this.updateCapabilities();
    return this.capabilities.hasNotificationPermission;
  }

  async subscribeToPushNotifications(): Promise<PushSubscription | null> {
    if (!('serviceWorker' in navigator)) return null;

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(
          import.meta.env.VITE_WEB_PUSH_PUBLIC_KEY
        ),
      });

      if (this.pushSubscriptionCallback) {
        this.pushSubscriptionCallback(subscription);
      }

      return subscription;
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error);
      return null;
    }
  }

  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  async showNotification(title: string, body: string, options: any = {}): Promise<void> {
    if (!('Notification' in window)) return;

    if (Notification.permission === 'granted') {
      // Remove unsupported properties
      const { vibrate, ...supportedOptions } = options;
      
      new Notification(title, {
        body,
        icon: '/favicon.ico',
        ...supportedOptions
      });
    }
  }

  getCapabilities() {
    return this.capabilities;
  }

  private updateInstallStatus() {
    if (this.installCallback) {
      this.installCallback(this.capabilities.isInstalled);
    }
    this.updateCapabilities();
  }

  private updateCapabilities() {
    this.capabilities = {
      ...this.capabilities,
      isOnline: navigator.onLine,
      hasNotificationPermission: Notification.permission === 'granted',
    };
  }

  async enableBackgroundSync(): Promise<void> {
    try {
      const registration = await navigator.serviceWorker.ready;
      
      // Check if background sync is supported
      if ('sync' in registration) {
        await (registration as any).sync.register('background-sync');
        await (registration as any).sync.register('data-sync');
      }
    } catch (error) {
      console.warn('Background sync not supported:', error);
    }
  }
}

export const pwaService = new PWAService();

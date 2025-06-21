// PWA Service for managing service worker and app installation
export interface PWAInstallPrompt {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export interface PWACapabilities {
  isInstallable: boolean;
  isInstalled: boolean;
  isOnline: boolean;
  hasNotificationPermission: boolean;
  supportsPushNotifications: boolean;
  supportsBackgroundSync: boolean;
}

class PWAService {
  private installPrompt: PWAInstallPrompt | null = null;
  private registration: ServiceWorkerRegistration | null = null;
  private listeners: Map<string, Function[]> = new Map();

  constructor() {
    this.initializePWA();
  }

  // Initialize PWA functionality
  private async initializePWA() {
    // Register service worker
    if ('serviceWorker' in navigator) {
      try {
        this.registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/'
        });
        
        console.log('Service Worker registered successfully');
        
        // Listen for updates
        this.registration.addEventListener('updatefound', () => {
          this.handleServiceWorkerUpdate();
        });

        // Check for existing service worker
        if (this.registration.active) {
          console.log('Service Worker is active');
        }

      } catch (error) {
        console.error('Service Worker registration failed:', error);
      }
    }

    // Listen for install prompt
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.installPrompt = e as any;
      this.emit('installable', true);
    });

    // Listen for app installed
    window.addEventListener('appinstalled', () => {
      console.log('PWA was installed');
      this.installPrompt = null;
      this.emit('installed', true);
    });

    // Listen for online/offline status
    window.addEventListener('online', () => {
      this.emit('online', true);
      this.syncOfflineData();
    });

    window.addEventListener('offline', () => {
      this.emit('online', false);
    });

    // Request notification permission on first visit
    this.requestNotificationPermission();
  }

  // Handle service worker updates
  private handleServiceWorkerUpdate() {
    if (!this.registration) return;

    const newWorker = this.registration.installing;
    if (!newWorker) return;

    newWorker.addEventListener('statechange', () => {
      if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
        // New service worker is available
        this.emit('updateAvailable', true);
      }
    });
  }

  // Install the PWA
  async installApp(): Promise<boolean> {
    if (!this.installPrompt) {
      console.log('Install prompt not available');
      return false;
    }

    try {
      await this.installPrompt.prompt();
      const choiceResult = await this.installPrompt.userChoice;
      
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the install prompt');
        this.installPrompt = null;
        return true;
      } else {
        console.log('User dismissed the install prompt');
        return false;
      }
    } catch (error) {
      console.error('Error during app installation:', error);
      return false;
    }
  }

  // Update the service worker
  async updateServiceWorker(): Promise<void> {
    if (!this.registration) return;

    try {
      await this.registration.update();
      
      if (this.registration.waiting) {
        // Tell the waiting service worker to skip waiting
        this.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        
        // Reload the page to activate the new service worker
        window.location.reload();
      }
    } catch (error) {
      console.error('Error updating service worker:', error);
    }
  }

  // Request notification permission
  async requestNotificationPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.log('This browser does not support notifications');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission === 'denied') {
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }

  // Subscribe to push notifications
  async subscribeToPushNotifications(): Promise<PushSubscription | null> {
    if (!this.registration) {
      console.log('Service worker not registered');
      return null;
    }

    if (!('PushManager' in window)) {
      console.log('Push messaging is not supported');
      return null;
    }

    try {
      const subscription = await this.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(
          process.env.REACT_APP_VAPID_PUBLIC_KEY || ''
        )
      });

      console.log('Push subscription successful');
      return subscription;
    } catch (error) {
      console.error('Error subscribing to push notifications:', error);
      return null;
    }
  }

  // Show local notification
  async showNotification(title: string, options: NotificationOptions = {}): Promise<void> {
    if (!('Notification' in window)) {
      console.log('Notifications not supported');
      return;
    }

    if (Notification.permission !== 'granted') {
      const granted = await this.requestNotificationPermission();
      if (!granted) return;
    }

    const defaultOptions: NotificationOptions = {
      icon: '/icon-192x192.png',
      badge: '/badge-72x72.png',
      vibrate: [100, 50, 100],
      ...options
    };

    if (this.registration) {
      // Use service worker to show notification
      await this.registration.showNotification(title, defaultOptions);
    } else {
      // Fallback to regular notification
      new Notification(title, defaultOptions);
    }
  }

  // Cache important data for offline use
  async cacheOfflineData(key: string, data: any): Promise<void> {
    try {
      const cache = await caches.open('studenthome-offline-data');
      const response = new Response(JSON.stringify(data), {
        headers: { 'Content-Type': 'application/json' }
      });
      await cache.put(key, response);
    } catch (error) {
      console.error('Error caching offline data:', error);
    }
  }

  // Retrieve cached offline data
  async getOfflineData(key: string): Promise<any> {
    try {
      const cache = await caches.open('studenthome-offline-data');
      const response = await cache.match(key);
      
      if (response) {
        return await response.json();
      }
      
      return null;
    } catch (error) {
      console.error('Error retrieving offline data:', error);
      return null;
    }
  }

  // Sync offline data when back online
  private async syncOfflineData(): Promise<void> {
    if (!this.registration) return;

    try {
      // Trigger background sync
      await this.registration.sync.register('background-sync-search');
      await this.registration.sync.register('background-sync-user-data');
    } catch (error) {
      console.error('Error registering background sync:', error);
    }
  }

  // Get PWA capabilities
  getCapabilities(): PWACapabilities {
    return {
      isInstallable: !!this.installPrompt,
      isInstalled: window.matchMedia('(display-mode: standalone)').matches ||
                   (window.navigator as any).standalone === true,
      isOnline: navigator.onLine,
      hasNotificationPermission: Notification.permission === 'granted',
      supportsPushNotifications: 'PushManager' in window,
      supportsBackgroundSync: 'serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype
    };
  }

  // Event system
  on(event: string, callback: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  off(event: string, callback: Function): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  private emit(event: string, data: any): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback => callback(data));
    }
  }

  // Helper function to convert VAPID key
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

  // Check if app needs update
  async checkForUpdates(): Promise<boolean> {
    if (!this.registration) return false;

    try {
      await this.registration.update();
      return !!this.registration.waiting;
    } catch (error) {
      console.error('Error checking for updates:', error);
      return false;
    }
  }

  // Get app version from service worker
  async getAppVersion(): Promise<string> {
    try {
      const response = await fetch('/sw.js');
      const swContent = await response.text();
      const versionMatch = swContent.match(/CACHE_NAME = ['"]studenthome-v(.+?)['"];/);
      return versionMatch ? versionMatch[1] : 'unknown';
    } catch (error) {
      console.error('Error getting app version:', error);
      return 'unknown';
    }
  }
}

export const pwaService = new PWAService();

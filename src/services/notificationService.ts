
// Web Push Notification Service
export interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: any;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
  requireInteraction?: boolean;
}

class NotificationService {
  private vapidPublicKey: string | null = null;
  private registration: ServiceWorkerRegistration | null = null;
  private subscription: PushSubscription | null = null;

  constructor() {
    this.vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY || null;
    this.initializeServiceWorker();
  }

  // Initialize service worker
  private async initializeServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        this.registration = await navigator.serviceWorker.register('/sw.js');
        console.log('✅ Service Worker registered');
      } catch (error) {
        console.error('❌ Service Worker registration failed:', error);
      }
    }
  }

  // Request notification permission
  async requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications');
      return 'denied';
    }

    if (Notification.permission === 'granted') {
      return 'granted';
    }

    const permission = await Notification.requestPermission();
    return permission;
  }

  // Check if notifications are supported and permitted
  isSupported(): boolean {
    return 'Notification' in window && 'serviceWorker' in navigator;
  }

  isPermissionGranted(): boolean {
    return Notification.permission === 'granted';
  }

  // Subscribe to push notifications
  async subscribeToPush(): Promise<PushSubscription | null> {
    if (!this.registration || !this.vapidPublicKey) {
      console.warn('Service Worker not registered or VAPID key missing');
      return null;
    }

    try {
      const subscription = await this.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(this.vapidPublicKey)
      });

      this.subscription = subscription;
      console.log('✅ Push subscription successful');
      return subscription;
    } catch (error) {
      console.error('❌ Push subscription failed:', error);
      return null;
    }
  }

  // Convert VAPID key
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

  // Show local notification
  async showNotification(payload: NotificationPayload): Promise<void> {
    if (!this.isPermissionGranted()) {
      const permission = await this.requestPermission();
      if (permission !== 'granted') {
        throw new Error('Notification permission denied');
      }
    }

    // Clean the payload to only include valid NotificationOptions properties
    const options: NotificationOptions = {
      body: payload.body,
      icon: payload.icon || '/favicon.ico',
      badge: payload.badge,
      tag: payload.tag,
      data: payload.data,
      requireInteraction: payload.requireInteraction || false
    };

    // Add actions if supported
    if (payload.actions && 'actions' in Notification.prototype) {
      options.actions = payload.actions;
    }

    if (this.registration) {
      await this.registration.showNotification(payload.title, options);
    } else {
      new Notification(payload.title, options);
    }
  }

  // Send notification to server for push delivery
  async sendPushNotification(payload: NotificationPayload): Promise<boolean> {
    if (!this.subscription) {
      console.warn('No push subscription available');
      return false;
    }

    try {
      const response = await fetch('/api/notifications/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscription: this.subscription,
          payload: payload
        })
      });

      return response.ok;
    } catch (error) {
      console.error('Failed to send push notification:', error);
      return false;
    }
  }

  // Property-specific notifications
  async notifyNewProperty(property: { title: string; price: number; location: string }): Promise<void> {
    const payload: NotificationPayload = {
      title: '🏠 New Property Available!',
      body: `${property.title} - £${property.price}/month in ${property.location}`,
      icon: '/favicon.ico',
      tag: 'new-property',
      data: {
        type: 'new-property',
        property: property
      },
      actions: [
        { action: 'view', title: 'View Property' },
        { action: 'save', title: 'Save for Later' }
      ]
    };

    await this.showNotification(payload);
  }

  async notifyPriceChange(property: { title: string; oldPrice: number; newPrice: number }): Promise<void> {
    const payload: NotificationPayload = {
      title: '💰 Price Alert!',
      body: `${property.title} - Price changed from £${property.oldPrice} to £${property.newPrice}`,
      icon: '/favicon.ico',
      tag: 'price-change',
      data: {
        type: 'price-change',
        property: property
      },
      requireInteraction: true
    };

    await this.showNotification(payload);
  }

  async notifyApplicationStatus(status: string, property: string): Promise<void> {
    const payload: NotificationPayload = {
      title: '📄 Application Update',
      body: `Your application for ${property} is ${status}`,
      icon: '/favicon.ico',
      tag: 'application-status',
      data: {
        type: 'application-status',
        status: status,
        property: property
      }
    };

    await this.showNotification(payload);
  }

  async notifyMaintenanceReminder(task: string, dueDate: string): Promise<void> {
    const payload: NotificationPayload = {
      title: '🔧 Maintenance Reminder',
      body: `${task} is due on ${dueDate}`,
      icon: '/favicon.ico',
      tag: 'maintenance',
      data: {
        type: 'maintenance',
        task: task,
        dueDate: dueDate
      }
    };

    await this.showNotification(payload);
  }

  // Notification settings
  async getNotificationSettings(): Promise<{
    enabled: boolean;
    newProperties: boolean;
    priceAlerts: boolean;
    applications: boolean;
    maintenance: boolean;
  }> {
    const settings = localStorage.getItem('notification-settings');
    if (settings) {
      return JSON.parse(settings);
    }

    return {
      enabled: false,
      newProperties: true,
      priceAlerts: true,
      applications: true,
      maintenance: true
    };
  }

  async updateNotificationSettings(settings: {
    enabled: boolean;
    newProperties: boolean;
    priceAlerts: boolean;
    applications: boolean;
    maintenance: boolean;
  }): Promise<void> {
    localStorage.setItem('notification-settings', JSON.stringify(settings));
    
    if (settings.enabled && !this.subscription) {
      await this.subscribeToPush();
    }
  }

  // Clear all notifications
  async clearAllNotifications(): Promise<void> {
    if (this.registration) {
      const notifications = await this.registration.getNotifications();
      notifications.forEach(notification => notification.close());
    }
  }

  // Get active notifications
  async getActiveNotifications(): Promise<Notification[]> {
    if (this.registration) {
      return await this.registration.getNotifications();
    }
    return [];
  }
}

export const notificationService = new NotificationService();

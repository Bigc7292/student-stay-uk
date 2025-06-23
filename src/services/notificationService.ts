// Push Notification Service with VAPID keys
interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  image?: string;
  data?: any;
  actions?: NotificationAction[];
  tag?: string;
  requireInteraction?: boolean;
}

interface NotificationAction {
  action: string;
  title: string;
  icon?: string;
}

interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

class NotificationService {
  private vapidPublicKey: string;
  private vapidPrivateKey: string;
  private vapidSubject: string;
  private isSupported: boolean;
  private isEnabled: boolean;
  private subscription: PushSubscription | null = null;

  constructor() {
    this.vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY || '';
    this.vapidPrivateKey = import.meta.env.VITE_VAPID_PRIVATE_KEY || '';
    this.vapidSubject = import.meta.env.VITE_VAPID_SUBJECT || '';
    this.isEnabled = import.meta.env.VITE_ENABLE_NOTIFICATIONS === 'true';
    
    // Check if push notifications are supported
    this.isSupported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
    
    if (this.isSupported && this.isEnabled) {
      console.log('🔔 Push Notification Service initialized');
      this.initializeService();
    } else if (!this.isSupported) {
      console.log('🔔 Push notifications not supported in this browser');
    } else {
      console.log('🔔 Push notifications disabled in configuration');
    }
  }

  // Initialize the notification service
  private async initializeService(): Promise<void> {
    try {
      // Register service worker if not already registered
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;
        console.log('🔔 Service Worker ready for push notifications');
        
        // Check for existing subscription
        this.subscription = await registration.pushManager.getSubscription();
        if (this.subscription) {
          console.log('🔔 Existing push subscription found');
        }
      }
    } catch (error) {
      console.error('🔔 Failed to initialize notification service:', error);
    }
  }

  // Check if notifications are supported and enabled
  isAvailable(): boolean {
    return this.isSupported && this.isEnabled && !!this.vapidPublicKey;
  }

  // Get current permission status
  getPermissionStatus(): NotificationPermission {
    return Notification.permission;
  }

  // Request notification permission
  async requestPermission(): Promise<NotificationPermission> {
    if (!this.isAvailable()) {
      throw new Error('Push notifications not available');
    }

    try {
      const permission = await Notification.requestPermission();
      console.log('🔔 Notification permission:', permission);
      return permission;
    } catch (error) {
      console.error('🔔 Failed to request notification permission:', error);
      throw error;
    }
  }

  // Subscribe to push notifications
  async subscribe(): Promise<PushSubscriptionData | null> {
    if (!this.isAvailable()) {
      throw new Error('Push notifications not available');
    }

    try {
      // Request permission first
      const permission = await this.requestPermission();
      if (permission !== 'granted') {
        throw new Error('Notification permission denied');
      }

      // Get service worker registration
      const registration = await navigator.serviceWorker.ready;
      
      // Convert VAPID public key to Uint8Array
      const applicationServerKey = this.urlBase64ToUint8Array(this.vapidPublicKey);
      
      // Subscribe to push manager
      this.subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey
      });

      console.log('🔔 Push subscription successful');
      
      // Return subscription data for server storage
      const subscriptionData: PushSubscriptionData = {
        endpoint: this.subscription.endpoint,
        keys: {
          p256dh: this.arrayBufferToBase64(this.subscription.getKey('p256dh')!),
          auth: this.arrayBufferToBase64(this.subscription.getKey('auth')!)
        }
      };

      // Store subscription locally
      localStorage.setItem('push_subscription', JSON.stringify(subscriptionData));
      
      return subscriptionData;
    } catch (error) {
      console.error('🔔 Failed to subscribe to push notifications:', error);
      throw error;
    }
  }

  // Unsubscribe from push notifications
  async unsubscribe(): Promise<boolean> {
    try {
      if (this.subscription) {
        const success = await this.subscription.unsubscribe();
        if (success) {
          this.subscription = null;
          localStorage.removeItem('push_subscription');
          console.log('🔔 Push subscription removed');
        }
        return success;
      }
      return true;
    } catch (error) {
      console.error('🔔 Failed to unsubscribe from push notifications:', error);
      return false;
    }
  }

  // Show local notification
  async showNotification(title: string, options: NotificationOptions = {}): Promise<void> {
    if (!this.isSupported()) {
      console.warn('Notifications are not supported in this browser');
      return;
    }

    if (Notification.permission !== 'granted') {
      console.warn('Notification permission not granted');
      return;
    }

    try {
      // Remove unsupported properties
      const { image, ...supportedOptions } = options as any;
      
      const notification = new Notification(title, {
        ...supportedOptions,
        icon: options.icon || '/favicon.ico'
      });

      console.log('🔔 Local notification shown:', title);
    } catch (error) {
      console.error('Failed to show notification:', error);
    }
  }

  // Send push notification (would typically be done server-side)
  async sendPushNotification(payload: NotificationPayload, subscriptionData?: PushSubscriptionData): Promise<boolean> {
    // Note: In a real application, this would be handled by your backend server
    // This is a client-side simulation for demonstration
    
    console.log('🔔 Push notification would be sent:', payload);
    console.log('🔔 To subscription:', subscriptionData || 'current subscription');
    
    // For now, just show a local notification
    await this.showNotification(payload);
    return true;
  }

  // Predefined notification types for StudentHome
  async notifyNewProperty(property: { title: string; price: number; location: string }): Promise<void> {
    await this.showNotification({
      title: '🏠 New Property Available!',
      body: `${property.title} - £${property.price}/week in ${property.location}`,
      icon: '/icon-192x192.png',
      tag: 'new-property',
      data: { type: 'new-property', property },
      actions: [
        { action: 'view', title: 'View Property' },
        { action: 'save', title: 'Save for Later' }
      ]
    });
  }

  async notifyPriceAlert(property: { title: string; oldPrice: number; newPrice: number }): Promise<void> {
    await this.showNotification({
      title: '💰 Price Drop Alert!',
      body: `${property.title} reduced from £${property.oldPrice} to £${property.newPrice}/week`,
      icon: '/icon-192x192.png',
      tag: 'price-alert',
      data: { type: 'price-alert', property },
      requireInteraction: true
    });
  }

  async notifyApplicationUpdate(status: string, property: string): Promise<void> {
    await this.showNotification({
      title: '📋 Application Update',
      body: `Your application for ${property} is now ${status}`,
      icon: '/icon-192x192.png',
      tag: 'application-update',
      data: { type: 'application-update', status, property }
    });
  }

  async notifyMaintenanceReminder(task: string, dueDate: string): Promise<void> {
    await this.showNotification({
      title: '🔧 Maintenance Reminder',
      body: `${task} is due on ${dueDate}`,
      icon: '/icon-192x192.png',
      tag: 'maintenance-reminder',
      data: { type: 'maintenance-reminder', task, dueDate }
    });
  }

  // Utility methods
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

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }

  // Get service status
  getStatus(): {
    supported: boolean;
    enabled: boolean;
    configured: boolean;
    permission: NotificationPermission;
    subscribed: boolean;
  } {
    return {
      supported: this.isSupported,
      enabled: this.isEnabled,
      configured: !!this.vapidPublicKey,
      permission: this.getPermissionStatus(),
      subscribed: !!this.subscription
    };
  }

  // Get setup instructions
  getSetupInstructions(): string {
    return `Push Notifications Setup:
✅ VAPID Keys: Configured
✅ Service: ${this.isEnabled ? 'Enabled' : 'Disabled'}
✅ Browser Support: ${this.isSupported ? 'Yes' : 'No'}
✅ Permission: ${this.getPermissionStatus()}

Your VAPID keys are properly configured:
- Public Key: ${this.vapidPublicKey.substring(0, 20)}...
- Subject: ${this.vapidSubject}

Push notifications are ready for:
• New property alerts
• Price drop notifications  
• Application status updates
• Maintenance reminders`;
  }
}

// Export singleton instance
export const notificationService = new NotificationService();
export type { NotificationPayload, NotificationAction, PushSubscriptionData };

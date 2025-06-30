import React, { useState, useEffect } from 'react';
import { Bell, BellOff, Settings, Check, X, AlertCircle, Smartphone } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { notificationService } from '@/services/notificationService';
import { pwaService } from '@/services/pwaService';

const NotificationSettings = () => {
  const [notificationStatus, setNotificationStatus] = useState(notificationService.getStatus());
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [subscriptionData, setSubscriptionData] = useState<any>(null);
  const [notificationPreferences, setNotificationPreferences] = useState({
    newProperties: true,
    priceAlerts: true,
    applicationUpdates: true,
    maintenanceReminders: true,
    marketingEmails: false
  });

  useEffect(() => {
    // Load saved preferences
    const savedPrefs = localStorage.getItem('notification_preferences');
    if (savedPrefs) {
      setNotificationPreferences(JSON.parse(savedPrefs));
    }

    // Load subscription data
    const savedSubscription = localStorage.getItem('push_subscription');
    if (savedSubscription) {
      setSubscriptionData(JSON.parse(savedSubscription));
    }

    // Update status
    setNotificationStatus(notificationService.getStatus());
  }, []);

  const handleSubscribe = async () => {
    setIsSubscribing(true);
    try {
      const subscription = await notificationService.subscribe();
      if (subscription) {
        setSubscriptionData(subscription);
        setNotificationStatus(notificationService.getStatus());
        
        // Show welcome notification
        await notificationService.showNotification({
          title: '🎉 Notifications Enabled!',
          body: 'You\'ll now receive updates about properties, applications, and more.',
          icon: '/icon-192x192.png',
          tag: 'welcome'
        });
      }
    } catch (error) {
      console.error('Failed to subscribe to notifications:', error);
      alert('Failed to enable notifications. Please check your browser settings.');
    } finally {
      setIsSubscribing(false);
    }
  };

  const handleUnsubscribe = async () => {
    try {
      const success = await notificationService.unsubscribe();
      if (success) {
        setSubscriptionData(null);
        setNotificationStatus(notificationService.getStatus());
      }
    } catch (error) {
      console.error('Failed to unsubscribe from notifications:', error);
    }
  };

  const handlePreferenceChange = (key: string, value: boolean) => {
    const newPrefs = { ...notificationPreferences, [key]: value };
    setNotificationPreferences(newPrefs);
    localStorage.setItem('notification_preferences', JSON.stringify(newPrefs));
  };

  const testNotification = async (type: string) => {
    switch (type) {
      case 'property':
        await notificationService.notifyNewProperty({
          title: 'Modern Student Studio',
          price: 180,
          location: 'Manchester City Centre'
        });
        break;
      case 'price':
        await notificationService.notifyPriceAlert({
          title: 'Campus View Apartments',
          oldPrice: 220,
          newPrice: 195
        });
        break;
      case 'application':
        await notificationService.notifyApplicationUpdate('approved', 'City Centre Studio');
        break;
      case 'maintenance':
        await notificationService.notifyMaintenanceReminder('Boiler inspection', '2024-02-15');
        break;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'granted': return 'bg-green-500';
      case 'denied': return 'bg-red-500';
      case 'default': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'granted': return 'Enabled';
      case 'denied': return 'Blocked';
      case 'default': return 'Not Set';
      default: return 'Unknown';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Bell className="w-6 h-6 text-blue-600" />
            <span>Push Notification Settings</span>
            <Badge 
              className={`ml-2 ${notificationStatus.configured ? 'bg-green-500' : 'bg-yellow-500'}`}
            >
              {notificationStatus.configured ? 'Configured' : 'Setup Required'}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Status Overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-600">Browser Support</div>
              <div className={`font-semibold ${notificationStatus.supported ? 'text-green-600' : 'text-red-600'}`}>
                {notificationStatus.supported ? 'Yes' : 'No'}
              </div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-600">Service Status</div>
              <div className={`font-semibold ${notificationStatus.enabled ? 'text-green-600' : 'text-yellow-600'}`}>
                {notificationStatus.enabled ? 'Enabled' : 'Disabled'}
              </div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-600">Permission</div>
              <div className={`font-semibold flex items-center justify-center space-x-1`}>
                <div className={`w-2 h-2 rounded-full ${getStatusColor(notificationStatus.permission)}`}></div>
                <span>{getStatusText(notificationStatus.permission)}</span>
              </div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-600">Subscription</div>
              <div className={`font-semibold ${notificationStatus.subscribed ? 'text-green-600' : 'text-gray-600'}`}>
                {notificationStatus.subscribed ? 'Active' : 'Inactive'}
              </div>
            </div>
          </div>

          {/* Setup Instructions */}
          {!notificationStatus.configured && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                VAPID keys are configured! Push notifications are ready to use.
              </AlertDescription>
            </Alert>
          )}

          {/* Main Controls */}
          <div className="flex flex-col space-y-4">
            {!notificationStatus.subscribed ? (
              <Button 
                onClick={handleSubscribe}
                disabled={!notificationStatus.supported || !notificationStatus.enabled || isSubscribing}
                className="flex items-center space-x-2"
              >
                <Bell className="w-4 h-4" />
                <span>{isSubscribing ? 'Enabling...' : 'Enable Push Notifications'}</span>
              </Button>
            ) : (
              <div className="flex space-x-2">
                <Button 
                  onClick={handleUnsubscribe}
                  variant="outline"
                  className="flex items-center space-x-2"
                >
                  <BellOff className="w-4 h-4" />
                  <span>Disable Notifications</span>
                </Button>
                <Button 
                  onClick={() => testNotification('property')}
                  variant="outline"
                  className="flex items-center space-x-2"
                >
                  <Smartphone className="w-4 h-4" />
                  <span>Test Notification</span>
                </Button>
              </div>
            )}
          </div>

          {/* Notification Preferences */}
          {notificationStatus.subscribed && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Notification Preferences</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium">New Properties</div>
                    <div className="text-sm text-gray-600">Get notified when new properties match your criteria</div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={notificationPreferences.newProperties}
                      onCheckedChange={(checked) => handlePreferenceChange('newProperties', checked)}
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => testNotification('property')}
                    >
                      Test
                    </Button>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium">Price Alerts</div>
                    <div className="text-sm text-gray-600">Get notified when property prices drop</div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={notificationPreferences.priceAlerts}
                      onCheckedChange={(checked) => handlePreferenceChange('priceAlerts', checked)}
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => testNotification('price')}
                    >
                      Test
                    </Button>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium">Application Updates</div>
                    <div className="text-sm text-gray-600">Get notified about application status changes</div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={notificationPreferences.applicationUpdates}
                      onCheckedChange={(checked) => handlePreferenceChange('applicationUpdates', checked)}
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => testNotification('application')}
                    >
                      Test
                    </Button>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium">Maintenance Reminders</div>
                    <div className="text-sm text-gray-600">Get notified about upcoming maintenance tasks</div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={notificationPreferences.maintenanceReminders}
                      onCheckedChange={(checked) => handlePreferenceChange('maintenanceReminders', checked)}
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => testNotification('maintenance')}
                    >
                      Test
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Technical Details */}
          {subscriptionData && (
            <details className="mt-6">
              <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800">
                Technical Details
              </summary>
              <div className="mt-2 p-3 bg-gray-50 rounded text-xs">
                <div><strong>Endpoint:</strong> {subscriptionData.endpoint.substring(0, 50)}...</div>
                <div><strong>P256DH Key:</strong> {subscriptionData.keys.p256dh.substring(0, 20)}...</div>
                <div><strong>Auth Key:</strong> {subscriptionData.keys.auth.substring(0, 20)}...</div>
              </div>
            </details>
          )}

          {/* Setup Instructions */}
          <div className="text-sm text-gray-600 bg-blue-50 p-4 rounded-lg">
            <h4 className="font-semibold mb-2">How Push Notifications Work:</h4>
            <ul className="space-y-1">
              <li>• Notifications work even when the app is closed</li>
              <li>• You can customize which types of notifications you receive</li>
              <li>• All notifications are sent securely using VAPID keys</li>
              <li>• You can disable notifications at any time</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NotificationSettings;

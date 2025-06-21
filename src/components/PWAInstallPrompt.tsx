import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone, Monitor, Wifi, Bell, Zap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { pwaService } from '@/services/pwaService';

const PWAInstallPrompt: React.FC = () => {
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [capabilities, setCapabilities] = useState(pwaService.getCapabilities());

  useEffect(() => {
    // Listen for PWA events
    const handleInstallable = () => {
      setShowPrompt(true);
      setCapabilities(pwaService.getCapabilities());
    };

    const handleInstalled = () => {
      setShowPrompt(false);
      setCapabilities(pwaService.getCapabilities());
    };

    const handleOnlineChange = () => {
      setCapabilities(pwaService.getCapabilities());
    };

    pwaService.on('installable', handleInstallable);
    pwaService.on('installed', handleInstalled);
    pwaService.on('online', handleOnlineChange);

    // Check initial state
    if (capabilities.isInstallable && !capabilities.isInstalled) {
      setShowPrompt(true);
    }

    return () => {
      pwaService.off('installable', handleInstallable);
      pwaService.off('installed', handleInstalled);
      pwaService.off('online', handleOnlineChange);
    };
  }, [capabilities.isInstallable, capabilities.isInstalled]);

  const handleInstall = async () => {
    setIsInstalling(true);
    try {
      const success = await pwaService.installApp();
      if (success) {
        setShowPrompt(false);
      }
    } catch (error) {
      console.error('Installation failed:', error);
    } finally {
      setIsInstalling(false);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    // Don't show again for this session
    sessionStorage.setItem('pwa-prompt-dismissed', 'true');
  };

  // Don't show if already dismissed this session
  if (sessionStorage.getItem('pwa-prompt-dismissed')) {
    return null;
  }

  // Don't show if already installed or not installable
  if (!showPrompt || capabilities.isInstalled || !capabilities.isInstallable) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:w-96">
      <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0 shadow-lg">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-bold flex items-center">
              <Download className="w-5 h-5 mr-2" />
              Install StudentHome
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
              className="text-white hover:bg-white/20 h-8 w-8 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-blue-100">
            Get the full StudentHome experience with our app!
          </p>

          {/* Features */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="flex items-center space-x-2">
              <Wifi className="w-4 h-4 text-green-300" />
              <span>Works Offline</span>
            </div>
            <div className="flex items-center space-x-2">
              <Bell className="w-4 h-4 text-yellow-300" />
              <span>Push Notifications</span>
            </div>
            <div className="flex items-center space-x-2">
              <Zap className="w-4 h-4 text-orange-300" />
              <span>Faster Loading</span>
            </div>
            <div className="flex items-center space-x-2">
              <Smartphone className="w-4 h-4 text-pink-300" />
              <span>Native Feel</span>
            </div>
          </div>

          {/* Device-specific benefits */}
          <div className="bg-white/10 rounded-lg p-3">
            <div className="flex items-center space-x-2 mb-2">
              {window.innerWidth < 768 ? (
                <Smartphone className="w-4 h-4" />
              ) : (
                <Monitor className="w-4 h-4" />
              )}
              <span className="text-sm font-medium">
                {window.innerWidth < 768 ? 'Mobile Benefits' : 'Desktop Benefits'}
              </span>
            </div>
            <ul className="text-xs space-y-1 text-blue-100">
              {window.innerWidth < 768 ? (
                <>
                  <li>• Add to home screen</li>
                  <li>• Full-screen experience</li>
                  <li>• Quick access from anywhere</li>
                </>
              ) : (
                <>
                  <li>• Desktop shortcut</li>
                  <li>• Runs in its own window</li>
                  <li>• System notifications</li>
                </>
              )}
            </ul>
          </div>

          {/* Install button */}
          <div className="flex space-x-2">
            <Button
              onClick={handleInstall}
              disabled={isInstalling}
              className="flex-1 bg-white text-blue-600 hover:bg-blue-50 font-medium"
            >
              {isInstalling ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                  Installing...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Install App
                </>
              )}
            </Button>
            <Button
              variant="ghost"
              onClick={handleDismiss}
              className="text-white hover:bg-white/20"
            >
              Later
            </Button>
          </div>

          {/* Capabilities badges */}
          <div className="flex flex-wrap gap-1">
            {capabilities.isOnline && (
              <Badge variant="secondary" className="bg-green-500/20 text-green-200 text-xs">
                Online
              </Badge>
            )}
            {capabilities.supportsPushNotifications && (
              <Badge variant="secondary" className="bg-blue-500/20 text-blue-200 text-xs">
                Push Support
              </Badge>
            )}
            {capabilities.supportsBackgroundSync && (
              <Badge variant="secondary" className="bg-purple-500/20 text-purple-200 text-xs">
                Background Sync
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PWAInstallPrompt;

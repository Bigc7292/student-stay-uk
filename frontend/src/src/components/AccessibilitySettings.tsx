import React, { useState, useEffect } from 'react';
import { Settings, Eye, Type, Zap, Volume2, Keyboard, Palette, Shield } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { accessibilityService, AccessibilitySettings as AccessibilitySettingsType, AccessibilityAudit } from '@/services/accessibilityService';

const AccessibilitySettings: React.FC = () => {
  const [settings, setSettings] = useState<AccessibilitySettingsType>(accessibilityService.getSettings());
  const [audit, setAudit] = useState<AccessibilityAudit | null>(null);
  const [isAuditing, setIsAuditing] = useState(false);
  const [announcements, setAnnouncements] = useState<string[]>([]);

  useEffect(() => {
    // Load recent announcements
    setAnnouncements(accessibilityService.getRecentAnnouncements());
  }, []);

  const handleSettingChange = (key: keyof AccessibilitySettingsType, value: boolean) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    accessibilityService.updateSettings({ [key]: value });
    
    // Announce the change
    const settingName = key.replace(/([A-Z])/g, ' $1').toLowerCase();
    accessibilityService.announceToScreenReader(
      `${settingName} ${value ? 'enabled' : 'disabled'}`
    );
  };

  const runAccessibilityAudit = async () => {
    setIsAuditing(true);
    accessibilityService.announceToScreenReader('Running accessibility audit');
    
    // Simulate audit delay
    setTimeout(() => {
      const auditResult = accessibilityService.performAudit();
      setAudit(auditResult);
      setIsAuditing(false);
      
      accessibilityService.announceToScreenReader(
        `Accessibility audit complete. Score: ${auditResult.score} out of 100. WCAG level: ${auditResult.wcagLevel}`
      );
    }, 1000);
  };

  const getScoreColor = (score: number): string => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getWcagBadgeColor = (level: string): string => {
    switch (level) {
      case 'AAA': return 'bg-green-500';
      case 'AA': return 'bg-blue-500';
      case 'A': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-6" role="main" aria-labelledby="accessibility-settings-title">
      {/* Skip to main content link */}
      <a 
        href="#accessibility-settings-content" 
        className="skip-link sr-only-focusable"
        onClick={(e) => {
          e.preventDefault();
          accessibilityService.skipToMainContent();
        }}
      >
        Skip to accessibility settings
      </a>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 id="accessibility-settings-title" className="text-3xl font-bold">
            Accessibility Settings
          </h1>
          <p className="text-gray-600 mt-2">
            Customize your experience for better accessibility and usability
          </p>
        </div>
        <Button
          onClick={runAccessibilityAudit}
          disabled={isAuditing}
          className="flex items-center space-x-2"
          aria-describedby="audit-description"
        >
          <Shield className="w-4 h-4" />
          <span>{isAuditing ? 'Running Audit...' : 'Run Accessibility Audit'}</span>
        </Button>
        <div id="audit-description" className="sr-only">
          Performs an accessibility audit of the current page to identify potential issues
        </div>
      </div>

      <div id="accessibility-settings-content">
        {/* Accessibility Audit Results */}
        {audit && (
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="w-5 h-5 text-blue-600" />
                <span>Accessibility Audit Results</span>
                <Badge className={getWcagBadgeColor(audit.wcagLevel)}>
                  WCAG {audit.wcagLevel}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">Accessibility Score</span>
                    <span className={`text-2xl font-bold ${getScoreColor(audit.score)}`}>
                      {audit.score}/100
                    </span>
                  </div>
                  <Progress value={audit.score} className="h-3" />
                </div>

                {audit.issues.length > 0 && (
                  <div>
                    <h3 className="font-medium mb-2">Issues Found ({audit.issues.length})</h3>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {audit.issues.map((issue, index) => (
                        <div 
                          key={index} 
                          className="p-3 bg-gray-50 rounded-lg"
                          role="alert"
                          aria-labelledby={`issue-${index}-title`}
                        >
                          <div className="flex items-start space-x-2">
                            <Badge 
                              variant={issue.type === 'error' ? 'destructive' : 'secondary'}
                              className="mt-0.5"
                            >
                              {issue.type}
                            </Badge>
                            <div className="flex-1">
                              <div id={`issue-${index}-title`} className="font-medium text-sm">
                                {issue.description}
                              </div>
                              <div className="text-xs text-gray-600 mt-1">
                                WCAG: {issue.wcagCriterion} • Impact: {issue.impact}
                              </div>
                              <div className="text-xs text-blue-600 mt-1">
                                Solution: {issue.solution}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <h3 className="font-medium mb-2">Recommendations</h3>
                  <ul className="space-y-1">
                    {audit.recommendations.map((rec, index) => (
                      <li key={index} className="text-sm text-gray-700 flex items-start space-x-2">
                        <span className="text-green-600 mt-0.5">✓</span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Visual Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Eye className="w-5 h-5 text-purple-600" />
              <span>Visual Settings</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label htmlFor="high-contrast" className="font-medium">
                  High Contrast Mode
                </label>
                <p className="text-sm text-gray-600">
                  Increases contrast for better visibility
                </p>
              </div>
              <Switch
                id="high-contrast"
                checked={settings.highContrast}
                onCheckedChange={(checked) => handleSettingChange('highContrast', checked)}
                aria-describedby="high-contrast-desc"
              />
            </div>
            <div id="high-contrast-desc" className="sr-only">
              Toggle high contrast mode for improved visibility
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label htmlFor="large-text" className="font-medium">
                  Large Text
                </label>
                <p className="text-sm text-gray-600">
                  Increases text size for better readability
                </p>
              </div>
              <Switch
                id="large-text"
                checked={settings.largeText}
                onCheckedChange={(checked) => handleSettingChange('largeText', checked)}
                aria-describedby="large-text-desc"
              />
            </div>
            <div id="large-text-desc" className="sr-only">
              Toggle large text mode for improved readability
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label htmlFor="color-blind-friendly" className="font-medium">
                  Color Blind Friendly
                </label>
                <p className="text-sm text-gray-600">
                  Uses patterns and symbols in addition to color
                </p>
              </div>
              <Switch
                id="color-blind-friendly"
                checked={settings.colorBlindFriendly}
                onCheckedChange={(checked) => handleSettingChange('colorBlindFriendly', checked)}
                aria-describedby="color-blind-desc"
              />
            </div>
            <div id="color-blind-desc" className="sr-only">
              Toggle color blind friendly mode with patterns and symbols
            </div>
          </CardContent>
        </Card>

        {/* Motion Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Zap className="w-5 h-5 text-orange-600" />
              <span>Motion Settings</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label htmlFor="reduced-motion" className="font-medium">
                  Reduced Motion
                </label>
                <p className="text-sm text-gray-600">
                  Minimizes animations and transitions
                </p>
              </div>
              <Switch
                id="reduced-motion"
                checked={settings.reducedMotion}
                onCheckedChange={(checked) => handleSettingChange('reducedMotion', checked)}
                aria-describedby="reduced-motion-desc"
              />
            </div>
            <div id="reduced-motion-desc" className="sr-only">
              Toggle reduced motion to minimize animations and transitions
            </div>
          </CardContent>
        </Card>

        {/* Navigation Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Keyboard className="w-5 h-5 text-blue-600" />
              <span>Navigation Settings</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label htmlFor="keyboard-navigation" className="font-medium">
                  Enhanced Keyboard Navigation
                </label>
                <p className="text-sm text-gray-600">
                  Improves keyboard navigation with better focus management
                </p>
              </div>
              <Switch
                id="keyboard-navigation"
                checked={settings.keyboardNavigation}
                onCheckedChange={(checked) => handleSettingChange('keyboardNavigation', checked)}
                aria-describedby="keyboard-nav-desc"
              />
            </div>
            <div id="keyboard-nav-desc" className="sr-only">
              Toggle enhanced keyboard navigation with improved focus management
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label htmlFor="focus-indicators" className="font-medium">
                  Enhanced Focus Indicators
                </label>
                <p className="text-sm text-gray-600">
                  Makes focus indicators more visible
                </p>
              </div>
              <Switch
                id="focus-indicators"
                checked={settings.focusIndicators}
                onCheckedChange={(checked) => handleSettingChange('focusIndicators', checked)}
                aria-describedby="focus-indicators-desc"
              />
            </div>
            <div id="focus-indicators-desc" className="sr-only">
              Toggle enhanced focus indicators for better visibility
            </div>
          </CardContent>
        </Card>

        {/* Screen Reader Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Volume2 className="w-5 h-5 text-green-600" />
              <span>Screen Reader Settings</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label htmlFor="screen-reader-optimized" className="font-medium">
                  Screen Reader Optimized
                </label>
                <p className="text-sm text-gray-600">
                  Optimizes content structure for screen readers
                </p>
              </div>
              <Switch
                id="screen-reader-optimized"
                checked={settings.screenReaderOptimized}
                onCheckedChange={(checked) => handleSettingChange('screenReaderOptimized', checked)}
                aria-describedby="screen-reader-desc"
              />
            </div>
            <div id="screen-reader-desc" className="sr-only">
              Toggle screen reader optimization for better content structure
            </div>

            {announcements.length > 0 && (
              <div>
                <h3 className="font-medium mb-2">Recent Announcements</h3>
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {announcements.slice(-5).map((announcement, index) => (
                    <div key={index} className="text-sm text-gray-600 p-2 bg-gray-50 rounded">
                      {announcement}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Settings className="w-5 h-5 text-gray-600" />
              <span>Quick Actions</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Button
                variant="outline"
                onClick={() => accessibilityService.toggleHighContrast()}
                className="flex flex-col items-center space-y-1 h-auto py-3"
              >
                <Palette className="w-4 h-4" />
                <span className="text-xs">Toggle Contrast</span>
              </Button>
              
              <Button
                variant="outline"
                onClick={() => accessibilityService.toggleLargeText()}
                className="flex flex-col items-center space-y-1 h-auto py-3"
              >
                <Type className="w-4 h-4" />
                <span className="text-xs">Toggle Text Size</span>
              </Button>
              
              <Button
                variant="outline"
                onClick={() => accessibilityService.toggleReducedMotion()}
                className="flex flex-col items-center space-y-1 h-auto py-3"
              >
                <Zap className="w-4 h-4" />
                <span className="text-xs">Toggle Motion</span>
              </Button>
              
              <Button
                variant="outline"
                onClick={() => accessibilityService.skipToMainContent()}
                className="flex flex-col items-center space-y-1 h-auto py-3"
              >
                <Eye className="w-4 h-4" />
                <span className="text-xs">Skip to Main</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AccessibilitySettings;

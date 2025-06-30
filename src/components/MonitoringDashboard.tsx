import React, { useState, useEffect } from 'react';
import { BarChart3, Activity, Users, Eye, Download, Settings, AlertTriangle, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { analyticsService } from '@/services/analyticsService';
import { performanceService } from '@/services/performanceService';

const MonitoringDashboard: React.FC = () => {
  const [analyticsSummary, setAnalyticsSummary] = useState(analyticsService.getAnalyticsSummary());
  const [performanceMetrics, setPerformanceMetrics] = useState(performanceService.getMetrics());
  const [performanceScore, setPerformanceScore] = useState(performanceService.getPerformanceScore());
  const [isAnalyticsEnabled, setIsAnalyticsEnabled] = useState(analyticsService.isAnalyticsEnabled());

  useEffect(() => {
    const updateData = () => {
      setAnalyticsSummary(analyticsService.getAnalyticsSummary());
      setPerformanceMetrics(performanceService.getMetrics());
      setPerformanceScore(performanceService.getPerformanceScore());
    };

    // Update data every 5 seconds
    const interval = setInterval(updateData, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleToggleAnalytics = () => {
    const newState = !isAnalyticsEnabled;
    analyticsService.setAnalyticsEnabled(newState);
    setIsAnalyticsEnabled(newState);
  };

  const handleExportAnalytics = () => {
    analyticsService.exportData();
    analyticsService.trackInteraction('monitoring', 'export_analytics');
  };

  const handleExportPerformance = () => {
    const metrics = performanceService.getMetrics();
    const blob = new Blob([JSON.stringify(metrics, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `performance-metrics-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    analyticsService.trackInteraction('monitoring', 'export_performance');
  };

  const formatDuration = (ms: number): string => {
    if (ms < 1000) return `${Math.round(ms)}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${Math.round(ms / 60000)}m`;
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getScoreColor = (score: number): string => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreIcon = (score: number) => {
    if (score >= 90) return <CheckCircle className="w-5 h-5 text-green-600" />;
    if (score >= 70) return <Activity className="w-5 h-5 text-yellow-600" />;
    return <AlertTriangle className="w-5 h-5 text-red-600" />;
  };

  return (
    <div className="space-y-6" role="main" aria-labelledby="monitoring-title">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 id="monitoring-title" className="text-3xl font-bold">
            Monitoring Dashboard
          </h1>
          <p className="text-gray-600 mt-2">
            Real-time analytics and performance monitoring
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            onClick={handleToggleAnalytics}
            className={`${isAnalyticsEnabled ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}
          >
            <Settings className="w-4 h-4 mr-2" />
            Analytics {isAnalyticsEnabled ? 'Enabled' : 'Disabled'}
          </Button>
        </div>
      </div>

      {/* Analytics Overview */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Session Duration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatDuration(analyticsSummary.session_duration)}
            </div>
            <p className="text-xs text-gray-500 mt-1">Current session</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Page Views</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsSummary.page_views}</div>
            <p className="text-xs text-gray-500 mt-1">This session</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Events Queued</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsSummary.events_queued}</div>
            <p className="text-xs text-gray-500 mt-1">Pending sync</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Performance Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              {getScoreIcon(performanceScore)}
              <span className={`text-2xl font-bold ${getScoreColor(performanceScore)}`}>
                {performanceScore}/100
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">Overall rating</p>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Activity className="w-5 h-5 text-blue-600" />
            <span>Performance Metrics</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-sm font-medium text-blue-800 mb-1">FCP</div>
              <div className="text-lg font-bold text-blue-600">
                {performanceMetrics.fcp ? formatDuration(performanceMetrics.fcp) : 'N/A'}
              </div>
              <div className="text-xs text-blue-600">First Contentful Paint</div>
            </div>
            
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-sm font-medium text-green-800 mb-1">LCP</div>
              <div className="text-lg font-bold text-green-600">
                {performanceMetrics.lcp ? formatDuration(performanceMetrics.lcp) : 'N/A'}
              </div>
              <div className="text-xs text-green-600">Largest Contentful Paint</div>
            </div>
            
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-sm font-medium text-purple-800 mb-1">FID</div>
              <div className="text-lg font-bold text-purple-600">
                {performanceMetrics.fid ? formatDuration(performanceMetrics.fid) : 'N/A'}
              </div>
              <div className="text-xs text-purple-600">First Input Delay</div>
            </div>
            
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-sm font-medium text-orange-800 mb-1">CLS</div>
              <div className="text-lg font-bold text-orange-600">
                {performanceMetrics.cls ? performanceMetrics.cls.toFixed(3) : 'N/A'}
              </div>
              <div className="text-xs text-orange-600">Cumulative Layout Shift</div>
            </div>
          </div>

          <div className="mt-6 grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-3">Resource Usage</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>JavaScript:</span>
                  <span className="font-medium">{formatBytes(performanceMetrics.jsSize || 0)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>CSS:</span>
                  <span className="font-medium">{formatBytes(performanceMetrics.cssSize || 0)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Images:</span>
                  <span className="font-medium">{formatBytes(performanceMetrics.imageSize || 0)}</span>
                </div>
                <div className="flex justify-between text-sm font-medium border-t pt-2">
                  <span>Total:</span>
                  <span>{formatBytes(performanceMetrics.totalSize || 0)}</span>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium mb-3">Timing Metrics</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Page Load:</span>
                  <span className="font-medium">
                    {performanceMetrics.pageLoadTime ? formatDuration(performanceMetrics.pageLoadTime) : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Memory Usage:</span>
                  <span className="font-medium">{formatBytes(performanceMetrics.memoryUsage || 0)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Interaction Delay:</span>
                  <span className="font-medium">
                    {performanceMetrics.interactionDelay ? formatDuration(performanceMetrics.interactionDelay) : 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Analytics Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="w-5 h-5 text-green-600" />
            <span>Analytics Status</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-3">Session Information</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Session ID:</span>
                  <span className="font-mono text-xs">{analyticsSummary.session_id}</span>
                </div>
                <div className="flex justify-between">
                  <span>User ID:</span>
                  <span className="font-mono text-xs">
                    {analyticsSummary.user_id || 'Anonymous'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Status:</span>
                  <Badge variant={isAnalyticsEnabled ? 'default' : 'secondary'}>
                    {isAnalyticsEnabled ? 'Active' : 'Disabled'}
                  </Badge>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium mb-3">Data Collection</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span>Performance Monitoring:</span>
                  <Badge variant="default">Enabled</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Error Tracking:</span>
                  <Badge variant="default">Enabled</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>User Interactions:</span>
                  <Badge variant={isAnalyticsEnabled ? 'default' : 'secondary'}>
                    {isAnalyticsEnabled ? 'Enabled' : 'Disabled'}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Data Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button
              variant="outline"
              onClick={handleExportAnalytics}
              disabled={!isAnalyticsEnabled}
              className="flex items-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>Export Analytics</span>
            </Button>
            
            <Button
              variant="outline"
              onClick={handleExportPerformance}
              className="flex items-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>Export Performance</span>
            </Button>
            
            <Button
              variant="outline"
              onClick={() => {
                analyticsService.clearData();
                analyticsService.trackInteraction('monitoring', 'clear_data');
                alert('Analytics data cleared');
              }}
              className="flex items-center space-x-2 text-red-600 hover:text-red-700"
            >
              <AlertTriangle className="w-4 h-4" />
              <span>Clear Data</span>
            </Button>
          </div>
          
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-800 mb-2">Privacy Notice</h4>
            <p className="text-sm text-blue-700">
              All analytics data is processed locally and anonymized. No personal information 
              is collected without explicit consent. You can disable analytics at any time.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MonitoringDashboard;

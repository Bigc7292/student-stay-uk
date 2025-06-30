import React, { useState, useEffect } from 'react';
import { Activity, Zap, Clock, Database, Wifi, Smartphone, Monitor, AlertTriangle, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { performanceService } from '@/services/performanceService';

const PerformanceDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState(performanceService.getMetrics());
  const [score, setScore] = useState(performanceService.getPerformanceScore());
  const [recommendations, setRecommendations] = useState(performanceService.getRecommendations());
  const [connectionInfo, setConnectionInfo] = useState(performanceService.getConnectionInfo());
  const [isPWA, setIsPWA] = useState(performanceService.isPWA());

  useEffect(() => {
    const updateMetrics = () => {
      setMetrics(performanceService.getMetrics());
      setScore(performanceService.getPerformanceScore());
      setRecommendations(performanceService.getRecommendations());
    };

    // Update metrics every 5 seconds
    const interval = setInterval(updateMetrics, 5000);

    return () => clearInterval(interval);
  }, []);

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatTime = (ms: number): string => {
    if (ms < 1000) return `${Math.round(ms)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
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
    <div className="space-y-6">
      {/* Performance Score */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Activity className="w-6 h-6 text-blue-600" />
            <span>Performance Score</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              {getScoreIcon(score)}
              <span className={`text-3xl font-bold ${getScoreColor(score)}`}>
                {score}/100
              </span>
            </div>
            <div className="flex items-center space-x-2">
              {isPWA ? (
                <Badge className="bg-green-500">
                  <Smartphone className="w-3 h-3 mr-1" />
                  PWA Mode
                </Badge>
              ) : (
                <Badge variant="outline">
                  <Monitor className="w-3 h-3 mr-1" />
                  Browser Mode
                </Badge>
              )}
              {connectionInfo && (
                <Badge variant="outline">
                  <Wifi className="w-3 h-3 mr-1" />
                  {connectionInfo.effectiveType}
                </Badge>
              )}
            </div>
          </div>
          <Progress value={score} className="h-3" />
          <p className="text-sm text-gray-600 mt-2">
            {score >= 90 && 'Excellent performance! Your app is running smoothly.'}
            {score >= 70 && score < 90 && 'Good performance with room for improvement.'}
            {score < 70 && 'Performance needs attention. Check recommendations below.'}
          </p>
        </CardContent>
      </Card>

      {/* Core Web Vitals */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Zap className="w-6 h-6 text-yellow-600" />
            <span>Core Web Vitals</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-sm font-medium text-blue-800 mb-1">FCP</div>
              <div className="text-lg font-bold text-blue-600">
                {metrics.fcp ? formatTime(metrics.fcp) : 'N/A'}
              </div>
              <div className="text-xs text-blue-600">First Contentful Paint</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-sm font-medium text-green-800 mb-1">LCP</div>
              <div className="text-lg font-bold text-green-600">
                {metrics.lcp ? formatTime(metrics.lcp) : 'N/A'}
              </div>
              <div className="text-xs text-green-600">Largest Contentful Paint</div>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <div className="text-sm font-medium text-purple-800 mb-1">FID</div>
              <div className="text-lg font-bold text-purple-600">
                {metrics.fid ? formatTime(metrics.fid) : 'N/A'}
              </div>
              <div className="text-xs text-purple-600">First Input Delay</div>
            </div>
            <div className="text-center p-3 bg-orange-50 rounded-lg">
              <div className="text-sm font-medium text-orange-800 mb-1">CLS</div>
              <div className="text-lg font-bold text-orange-600">
                {metrics.cls ? metrics.cls.toFixed(3) : 'N/A'}
              </div>
              <div className="text-xs text-orange-600">Cumulative Layout Shift</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resource Usage */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Database className="w-6 h-6 text-purple-600" />
            <span>Resource Usage</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-3">Bundle Sizes</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>JavaScript:</span>
                  <span className="font-medium">{formatBytes(metrics.jsSize || 0)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>CSS:</span>
                  <span className="font-medium">{formatBytes(metrics.cssSize || 0)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Images:</span>
                  <span className="font-medium">{formatBytes(metrics.imageSize || 0)}</span>
                </div>
                <div className="flex justify-between text-sm font-medium border-t pt-2">
                  <span>Total:</span>
                  <span>{formatBytes(metrics.totalSize || 0)}</span>
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-medium mb-3">Timing Metrics</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>TTFB:</span>
                  <span className="font-medium">{metrics.ttfb ? formatTime(metrics.ttfb) : 'N/A'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>DOM Ready:</span>
                  <span className="font-medium">{metrics.domContentLoaded ? formatTime(metrics.domContentLoaded) : 'N/A'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Load Complete:</span>
                  <span className="font-medium">{metrics.loadComplete ? formatTime(metrics.loadComplete) : 'N/A'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Memory Usage:</span>
                  <span className="font-medium">{formatBytes(metrics.memoryUsage || 0)}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="w-6 h-6 text-green-600" />
            <span>Performance Recommendations</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recommendations.map((recommendation, index) => (
              <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                {recommendation.includes('Great job') ? (
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                )}
                <span className="text-sm">{recommendation}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Connection Info */}
      {connectionInfo && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Wifi className="w-6 h-6 text-blue-600" />
              <span>Connection Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-sm font-medium text-blue-800 mb-1">Connection Type</div>
                <div className="text-lg font-bold text-blue-600 capitalize">
                  {connectionInfo.effectiveType}
                </div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-sm font-medium text-green-800 mb-1">Downlink</div>
                <div className="text-lg font-bold text-green-600">
                  {connectionInfo.downlink} Mbps
                </div>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <div className="text-sm font-medium text-purple-800 mb-1">RTT</div>
                <div className="text-lg font-bold text-purple-600">
                  {connectionInfo.rtt}ms
                </div>
              </div>
            </div>
            {connectionInfo.saveData && (
              <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 text-yellow-600" />
                  <span className="text-sm font-medium text-yellow-800">
                    Data Saver mode is enabled
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button
              variant="outline"
              onClick={() => {
                const metrics = performanceService.getMetrics();
                console.log('Current Performance Metrics:', metrics);
                alert('Performance metrics logged to console');
              }}
            >
              Export Metrics
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                localStorage.removeItem('performance-metrics');
                alert('Performance history cleared');
              }}
            >
              Clear History
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                window.location.reload();
              }}
            >
              Refresh App
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PerformanceDashboard;

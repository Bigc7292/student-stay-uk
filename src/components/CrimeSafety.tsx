import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { policeService, type CrimeStats } from '@/services/policeService';
import { AlertCircle, MapPin, Shield, ShieldAlert, ShieldCheck, TrendingDown, TrendingUp } from 'lucide-react';
import React, { useState } from 'react';

const CrimeSafety = () => {
  const [location, setLocation] = useState('');
  const [coordinates, setCoordinates] = useState<{lat: number, lng: number} | null>(null);
  const [crimeStats, setCrimeStats] = useState<CrimeStats | null>(null);
  const [safetyRecommendations, setSafetyRecommendations] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTimeframe, setSelectedTimeframe] = useState('6');

  // UK University locations for quick selection
  const ukUniversities = [
    { name: "University of Manchester", lat: 53.4668, lng: -2.2339, city: "Manchester" },
    { name: "University College London", lat: 51.5246, lng: -0.1340, city: "London" },
    { name: "University of Edinburgh", lat: 55.9445, lng: -3.1892, city: "Edinburgh" },
    { name: "University of Birmingham", lat: 52.4508, lng: -1.9305, city: "Birmingham" },
    { name: "University of Leeds", lat: 53.8067, lng: -1.5550, city: "Leeds" },
    { name: "University of Bristol", lat: 51.4585, lng: -2.6021, city: "Bristol" },
    { name: "University of Sheffield", lat: 53.3811, lng: -1.4701, city: "Sheffield" },
    { name: "University of Nottingham", lat: 52.9399, lng: -1.1956, city: "Nottingham" },
    { name: "University of Liverpool", lat: 53.4064, lng: -2.9666, city: "Liverpool" },
    { name: "Newcastle University", lat: 54.9799, lng: -1.6147, city: "Newcastle" }
  ];

  const handleUniversitySelect = (universityName: string) => {
    const university = ukUniversities.find(u => u.name === universityName);
    if (university) {
      setLocation(`${university.name}, ${university.city}`);
      setCoordinates({ lat: university.lat, lng: university.lng });
    }
  };

  const handleLocationSearch = async () => {
    if (!location.trim()) {
      setError('Please enter a location');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // If coordinates not set, try to geocode the location
      if (!coordinates) {
        // Simple geocoding fallback - in production, you'd use a proper geocoding service
        setError('Please select a university from the dropdown or enter coordinates manually');
        setIsLoading(false);
        return;
      }

      // Get crime statistics
      const stats = await policeService.getCrimeStats(
        coordinates.lat, 
        coordinates.lng, 
        parseInt(selectedTimeframe)
      );
      
      // Get safety recommendations
      const recommendations = await policeService.getSafetyRecommendations(
        coordinates.lat, 
        coordinates.lng
      );

      setCrimeStats(stats);
      setSafetyRecommendations(recommendations);
    } catch (err) {
      setError(`Failed to fetch crime data: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const getSafetyBadge = (score: number) => {
    if (score >= 8) return { variant: 'default' as const, icon: ShieldCheck, text: 'Very Safe', color: 'text-green-600' };
    if (score >= 6) return { variant: 'secondary' as const, icon: Shield, text: 'Moderately Safe', color: 'text-yellow-600' };
    return { variant: 'destructive' as const, icon: ShieldAlert, text: 'Exercise Caution', color: 'text-red-600' };
  };

  const formatCrimeCategory = (category: string) => {
    return category.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="w-6 h-6 text-blue-600" />
            <span>Crime & Safety Analysis</span>
            <Badge variant="outline">UK Police Data</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Location Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Select University</label>
                <Select onValueChange={handleUniversitySelect}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a UK University" />
                  </SelectTrigger>
                  <SelectContent>
                    {ukUniversities.map((university) => (
                      <SelectItem key={university.name} value={university.name}>
                        {university.name} - {university.city}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">Or Enter Location</label>
                <Input
                  placeholder="Enter location or address"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>
            </div>

            {/* Timeframe Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Analysis Timeframe</label>
                <Select value={selectedTimeframe} onValueChange={setSelectedTimeframe}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3">Last 3 months</SelectItem>
                    <SelectItem value="6">Last 6 months</SelectItem>
                    <SelectItem value="12">Last 12 months</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-end">
                <Button 
                  onClick={handleLocationSearch} 
                  disabled={isLoading || !location.trim()}
                  className="w-full"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <MapPin className="w-4 h-4 mr-2" />
                      Analyze Safety
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Crime Statistics */}
            {crimeStats && (
              <div className="space-y-4">
                {/* Safety Overview */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Safety Overview</span>
                      {(() => {
                        const badge = getSafetyBadge(crimeStats.safetyScore);
                        const Icon = badge.icon;
                        return (
                          <Badge variant={badge.variant} className="flex items-center space-x-1">
                            <Icon className="w-3 h-3" />
                            <span>{badge.text}</span>
                          </Badge>
                        );
                      })()}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">{crimeStats.safetyScore}/10</div>
                        <div className="text-sm text-gray-600">Safety Score</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-red-600">{crimeStats.totalCrimes}</div>
                        <div className="text-sm text-gray-600">Total Crimes</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-orange-600">{crimeStats.mostCommonCrime}</div>
                        <div className="text-sm text-gray-600">Most Common</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm font-bold text-gray-600">
                          {Math.round(crimeStats.totalCrimes / parseInt(selectedTimeframe))}
                        </div>
                        <div className="text-sm text-gray-600">Crimes/Month</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Crime Breakdown */}
                <Card>
                  <CardHeader>
                    <CardTitle>Crime Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {Object.entries(crimeStats.crimesByCategory)
                        .sort(([,a], [,b]) => b - a)
                        .slice(0, 8)
                        .map(([category, count]) => (
                          <div key={category} className="flex items-center justify-between">
                            <span className="text-sm font-medium">{formatCrimeCategory(category)}</span>
                            <div className="flex items-center space-x-2">
                              <div className="w-20 bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-blue-600 h-2 rounded-full" 
                                  style={{ 
                                    width: `${Math.min((count / crimeStats.totalCrimes) * 100, 100)}%` 
                                  }}
                                ></div>
                              </div>
                              <span className="text-sm text-gray-600 w-8 text-right">{count}</span>
                            </div>
                          </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Safety Recommendations */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <ShieldCheck className="w-5 h-5 text-green-600" />
                      <span>Safety Recommendations</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {safetyRecommendations.map((recommendation, index) => (
                        <div key={index} className="flex items-start space-x-2 p-2 bg-gray-50 rounded">
                          <span className="text-sm">{recommendation}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Data Source */}
                <div className="text-xs text-gray-500 text-center">
                  Data provided by UK Police API • Last updated: {new Date(crimeStats.lastUpdated).toLocaleDateString()}
                  <br />
                  Crime locations are approximate and anonymized for privacy
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CrimeSafety;

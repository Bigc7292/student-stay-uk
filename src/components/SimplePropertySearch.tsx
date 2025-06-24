import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, MapPin, Bed, Bath, Home } from 'lucide-react';

// Simple property interface for testing
interface SimpleProperty {
  id: string;
  title: string;
  price: number;
  price_type: string;
  location: string;
  bedrooms: number;
  bathrooms: number;
  property_type: string;
  furnished: boolean;
  available: boolean;
}

const SimplePropertySearch: React.FC = () => {
  const [searchLocation, setSearchLocation] = useState('');
  const [properties, setProperties] = useState<SimpleProperty[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!searchLocation.trim()) {
      setError('Please enter a location');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Direct Supabase query without service layer for testing
      const { createClient } = await import('@supabase/supabase-js');
      
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error('Missing Supabase configuration');
      }

      const supabase = createClient(supabaseUrl, supabaseAnonKey);

      const { data, error: searchError } = await supabase
        .from('properties')
        .select('*')
        .ilike('location', `%${searchLocation}%`)
        .eq('available', true)
        .limit(10);

      if (searchError) {
        throw searchError;
      }

      setProperties(data || []);
      console.log(`✅ Found ${data?.length || 0} properties`);

    } catch (err) {
      console.error('❌ Search failed:', err);
      setError(err instanceof Error ? err.message : 'Search failed');
      setProperties([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Simple Property Search (Testing)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Input
              placeholder="Enter location (e.g., London, Manchester)"
              value={searchLocation}
              onChange={(e) => setSearchLocation(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="flex-1"
            />
            <Button 
              onClick={handleSearch} 
              disabled={loading}
              className="min-w-[100px]"
            >
              {loading ? 'Searching...' : 'Search'}
            </Button>
          </div>
          
          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700">
              {error}
            </div>
          )}
        </CardContent>
      </Card>

      {properties.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">
            Found {properties.length} properties in {searchLocation}
          </h3>
          
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {properties.map((property) => (
              <Card key={property.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base line-clamp-2">
                    {property.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-green-600">
                      £{property.price}
                    </span>
                    <Badge variant="secondary">
                      {property.price_type}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin className="h-4 w-4" />
                    {property.location}
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <Bed className="h-4 w-4" />
                      {property.bedrooms} bed
                    </div>
                    <div className="flex items-center gap-1">
                      <Bath className="h-4 w-4" />
                      {property.bathrooms} bath
                    </div>
                    <div className="flex items-center gap-1">
                      <Home className="h-4 w-4" />
                      {property.property_type}
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    {property.furnished && (
                      <Badge variant="outline" className="text-xs">
                        Furnished
                      </Badge>
                    )}
                    {property.available && (
                      <Badge variant="outline" className="text-xs bg-green-50 text-green-700">
                        Available
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {!loading && properties.length === 0 && searchLocation && !error && (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-gray-500">
              No properties found in "{searchLocation}". Try a different location.
            </p>
          </CardContent>
        </Card>
      )}

      <div className="text-center text-sm text-gray-500">
        <p>🎯 Testing direct Supabase connection</p>
        <p>Database: {properties.length > 0 ? '✅ Connected' : '⏳ Ready'}</p>
      </div>
    </div>
  );
};

export default SimplePropertySearch;

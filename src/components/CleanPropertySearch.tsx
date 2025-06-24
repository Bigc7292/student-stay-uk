import EnhancedPropertyCard from '@/components/EnhancedPropertyCard';
import PropertyDetailsModal from '@/components/PropertyDetailsModal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { propertyDataUKService, type PropertyDataUKProperty } from '@/services/propertyDataUKService';
import { Bed, Grid, Home, List, Loader2, MapPin, Search, Shield, TrendingDown } from 'lucide-react';
import React, { useCallback, useState } from 'react';

interface PropertySearchProps {
  onResults?: (properties: PropertyDataUKProperty[]) => void;
}

interface SearchFilters {
  location: string;
  maxPrice: number;
  minPrice: number;
  bedrooms: number;
  propertyType: 'any' | 'studio' | 'shared' | 'flat' | 'house';
  roomOnly: boolean;
}

const CleanPropertySearch: React.FC<PropertySearchProps> = ({ onResults }) => {
  const [filters, setFilters] = useState<SearchFilters>({
    location: '',
    maxPrice: 500,
    minPrice: 100,
    bedrooms: 0,
    propertyType: 'any',
    roomOnly: false
  });

  const [properties, setProperties] = useState<PropertyDataUKProperty[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedProperty, setSelectedProperty] = useState<PropertyDataUKProperty | null>(null);
  const [showPropertyDetails, setShowPropertyDetails] = useState(false);

  const handleSearch = useCallback(async () => {
    if (!filters.location.trim()) return;

    setLoading(true);
    setSearched(true);

    try {
      console.log('🔍 Searching with filters:', filters);

      const searchFilters = {
        location: filters.location,
        maxPrice: filters.maxPrice,
        minPrice: filters.minPrice,
        bedrooms: filters.bedrooms || undefined,
        propertyType: filters.propertyType === 'any' ? undefined : filters.propertyType,
        furnished: true
      };

      // Search both regular rentals and HMO properties
      const [regularRentals, hmoRentals] = await Promise.all([
        propertyDataUKService.searchRentals(searchFilters),
        propertyDataUKService.searchHMORentals(searchFilters)
      ]);

      let allProperties = [...regularRentals, ...hmoRentals];

      // Apply filters
      if (filters.roomOnly) {
        allProperties = allProperties.filter(p => p.propertyType === 'shared');
      }

      allProperties = allProperties.filter(p => 
        p.price >= filters.minPrice && p.price <= filters.maxPrice
      );

      // Sort by price
      allProperties.sort((a, b) => a.price - b.price);

      // Enhance properties with mock data
      const enhancedProperties = allProperties.map(property => ({
        ...property,
        image: property.images?.[0] || '/placeholder.svg',
        rating: 4.2 + Math.random() * 0.8,
        viewingCount: Math.floor(Math.random() * 50) + 10,
        savedCount: Math.floor(Math.random() * 20) + 5,
        deposit: property.price * 4,
        bills: 'Bills included',
        university: filters.location.includes('Manchester') ? 'University of Manchester' :
                   filters.location.includes('London') ? 'UCL' : 'Local University',
        commuteTime: Math.floor(Math.random() * 30) + 10,
        localAmenities: [
          { type: 'supermarket' as const, name: 'Tesco Express', distance: 200, walkTime: 3 },
          { type: 'gym' as const, name: 'PureGym', distance: 500, walkTime: 6 },
          { type: 'university' as const, name: 'Main Campus', distance: 800, walkTime: 10 },
          { type: 'transport' as const, name: 'Bus Stop', distance: 100, walkTime: 2 },
          { type: 'restaurant' as const, name: 'Local Cafe', distance: 150, walkTime: 2 }
        ]
      }));

      setProperties(enhancedProperties);
      onResults?.(enhancedProperties);

      console.log(`✅ Found ${enhancedProperties.length} properties`);
    } catch (error) {
      console.error('❌ Search failed:', error);
    } finally {
      setLoading(false);
    }
  }, [filters, onResults]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  }, [handleSearch]);

  const updateFilters = useCallback((updates: Partial<SearchFilters>) => {
    setFilters(prev => ({ ...prev, ...updates }));
  }, []);

  const handleViewProperty = useCallback((propertyId: number | string) => {
    const property = properties.find(p => p.id === propertyId);
    if (property) {
      setSelectedProperty(property);
      setShowPropertyDetails(true);
    }
  }, [properties]);

  const handleClosePropertyDetails = useCallback(() => {
    setShowPropertyDetails(false);
    setSelectedProperty(null);
  }, []);

  return (
    <div className="w-full space-y-6">
      {/* Search Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Search className="w-5 h-5 text-blue-600" />
            <span>Find Student Accommodation</span>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Location Search */}
          <div className="relative">
            <MapPin className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Enter city, university, or postcode (e.g., Manchester, M1 1AA)"
              value={filters.location}
              onChange={(e) => updateFilters({ location: e.target.value })}
              onKeyPress={handleKeyPress}
              className="pl-10"
            />
          </div>

          {/* Quick Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Property Type</label>
              <Select
                value={filters.propertyType}
                onValueChange={(value: any) => updateFilters({ propertyType: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any Type</SelectItem>
                  <SelectItem value="shared">Shared House/Room</SelectItem>
                  <SelectItem value="studio">Studio</SelectItem>
                  <SelectItem value="flat">Flat/Apartment</SelectItem>
                  <SelectItem value="house">House</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Bedrooms</label>
              <Select
                value={filters.bedrooms.toString()}
                onValueChange={(value) => updateFilters({ bedrooms: parseInt(value) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Any</SelectItem>
                  <SelectItem value="1">1 Bedroom</SelectItem>
                  <SelectItem value="2">2 Bedrooms</SelectItem>
                  <SelectItem value="3">3 Bedrooms</SelectItem>
                  <SelectItem value="4">4+ Bedrooms</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Min Price (£/week)</label>
              <Input
                type="number"
                value={filters.minPrice}
                onChange={(e) => updateFilters({ minPrice: parseInt(e.target.value) || 0 })}
                placeholder="100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Max Price (£/week)</label>
              <Input
                type="number"
                value={filters.maxPrice}
                onChange={(e) => updateFilters({ maxPrice: parseInt(e.target.value) || 500 })}
                placeholder="500"
              />
            </div>
          </div>

          {/* Room Only Toggle */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="roomOnly"
              checked={filters.roomOnly}
              onChange={(e) => updateFilters({ roomOnly: e.target.checked })}
              className="rounded"
            />
            <label htmlFor="roomOnly" className="text-sm font-medium">
              Show only individual rooms (perfect for students)
            </label>
          </div>

          {/* Search Button */}
          <Button
            onClick={handleSearch}
            disabled={!filters.location.trim() || loading}
            className="w-full"
            size="lg"
          >
            {loading ? (
              <div className="flex items-center space-x-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Searching live properties...</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Search className="w-4 h-4" />
                <span>Search Properties</span>
              </div>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Results */}
      {searched && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                <span>Search Results ({properties.length})</span>
                {properties.length > 0 && (
                  <Badge variant="outline" className="flex items-center space-x-1">
                    <TrendingDown className="w-3 h-3" />
                    <span>Sorted by price</span>
                  </Badge>
                )}
              </CardTitle>

              {/* View Mode Toggle */}
              {properties.length > 0 && (
                <div className="flex items-center space-x-2">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                  >
                    <Grid className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                  >
                    <List className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse border rounded-lg p-4">
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : properties.length === 0 ? (
              <div className="text-center py-8 text-gray-600">
                <Home className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p className="text-lg font-medium mb-2">No properties found</p>
                <p className="text-sm">Try adjusting your search criteria or different location</p>
              </div>
            ) : (
              <div className="space-y-6">
                {viewMode === 'grid' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {properties.map((property) => (
                      <EnhancedPropertyCard
                        key={property.id}
                        property={property}
                        onView={handleViewProperty}
                        onSave={(id) => console.log('Save property:', id)}
                        onShare={(id) => console.log('Share property:', id)}
                        showCrimeData={true}
                        showLocalAmenities={true}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {properties.map((property) => (
                      <div key={property.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h3 className="font-semibold text-lg">{property.title}</h3>
                            <div className="flex items-center text-gray-600 text-sm mt-1">
                              <MapPin className="w-3 h-3 mr-1" />
                              {property.location} • {property.postcode}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-green-600">
                              £{property.price}
                            </div>
                            <div className="text-sm text-gray-500">per {property.priceType}</div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-4 mb-3">
                          <div className="flex items-center text-gray-600">
                            <Bed className="w-4 h-4 mr-1" />
                            <span className="text-sm">{property.bedrooms} bed</span>
                          </div>
                          <div className="flex items-center text-gray-600">
                            <Home className="w-4 h-4 mr-1" />
                            <span className="text-sm capitalize">{property.propertyType}</span>
                          </div>
                          {property.furnished && (
                            <Badge variant="outline" className="text-xs">Furnished</Badge>
                          )}
                          {property.crimeData && (
                            <Badge variant="outline" className="flex items-center text-xs">
                              <Shield className="w-3 h-3 mr-1" />
                              {property.crimeData.rating}
                            </Badge>
                          )}
                        </div>

                        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                          {property.description}
                        </p>

                        <div className="flex justify-between items-center">
                          <div className="text-xs text-gray-500">
                            {property.landlord?.verified && (
                              <span className="text-green-600">✓ Verified Landlord</span>
                            )}
                          </div>
                          <Button size="sm" onClick={() => handleViewProperty(property.id)}>
                            View Details
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Property Details Modal */}
      <PropertyDetailsModal
        property={selectedProperty}
        isOpen={showPropertyDetails}
        onClose={handleClosePropertyDetails}
      />
    </div>
  );
};

export default CleanPropertySearch;


import EnhancedPropertyCard from '@/components/EnhancedPropertyCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { propertyDataUKService, type PropertyDataUKProperty } from '@/services/propertyDataUKService';
import { Bed, Grid, Home, List, MapPin, Search, Shield, TrendingDown } from 'lucide-react';
import React, { useState } from 'react';

interface PropertySearchProps {
  onResults?: (properties: PropertyDataUKProperty[]) => void;
}

const PropertySearch = ({ onResults }: PropertySearchProps) => {
  const [filters, setFilters] = useState({
    location: '',
    maxPrice: 500,
    minPrice: 100,
    bedrooms: 0,
    propertyType: 'any' as 'any' | 'studio' | 'shared' | 'flat' | 'house',
    roomOnly: false
  });

  const [properties, setProperties] = useState<PropertyDataUKProperty[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const handleSearch = async () => {
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
        furnished: true // Students typically need furnished
      };

      // Search both regular rentals and HMO properties for students
      const [regularRentals, hmoRentals] = await Promise.all([
        propertyDataUKService.searchRentals(searchFilters),
        propertyDataUKService.searchHMORentals(searchFilters)
      ]);

      let allProperties = [...regularRentals, ...hmoRentals];

      // Filter by room only if selected
      if (filters.roomOnly) {
        allProperties = allProperties.filter(p => p.propertyType === 'shared');
      }

      // Filter by price range
      allProperties = allProperties.filter(p => 
        p.price >= filters.minPrice && p.price <= filters.maxPrice
      );

      // Sort by price
      allProperties.sort((a, b) => a.price - b.price);

      // Add mock local amenities data for enhanced display
      const enhancedProperties = allProperties.map(property => ({
        ...property,
        image: property.images?.[0] || '/placeholder.svg',
        rating: 4.2 + Math.random() * 0.8, // Mock rating between 4.2-5.0
        viewingCount: Math.floor(Math.random() * 50) + 10,
        savedCount: Math.floor(Math.random() * 20) + 5,
        deposit: property.price * 4, // Typical 4 weeks deposit
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
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const getSafetyBadgeColor = (safetyScore?: number) => {
    if (!safetyScore) return 'secondary';
    if (safetyScore >= 80) return 'default';
    if (safetyScore >= 60) return 'secondary';
    return 'destructive';
  };

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
              onChange={(e) => setFilters(prev => ({ ...prev, location: e.target.value }))}
              onKeyPress={handleKeyPress}
              className="pl-10"
            />
          </div>

          {/* Quick Filters Row */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Property Type */}
            <div>
              <label className="block text-sm font-medium mb-2">Property Type</label>
              <Select
                value={filters.propertyType}
                onValueChange={(value: any) => setFilters(prev => ({ ...prev, propertyType: value }))}
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

            {/* Bedrooms */}
            <div>
              <label className="block text-sm font-medium mb-2">Bedrooms</label>
              <Select
                value={filters.bedrooms.toString()}
                onValueChange={(value) => setFilters(prev => ({ ...prev, bedrooms: parseInt(value) }))}
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

            {/* Min Price */}
            <div>
              <label className="block text-sm font-medium mb-2">Min Price (£/week)</label>
              <Input
                type="number"
                value={filters.minPrice}
                onChange={(e) => setFilters(prev => ({ ...prev, minPrice: parseInt(e.target.value) || 0 }))}
                placeholder="100"
              />
            </div>

            {/* Max Price */}
            <div>
              <label className="block text-sm font-medium mb-2">Max Price (£/week)</label>
              <Input
                type="number"
                value={filters.maxPrice}
                onChange={(e) => setFilters(prev => ({ ...prev, maxPrice: parseInt(e.target.value) || 500 }))}
                placeholder="500"
              />
            </div>
          </div>

          {/* Price Range Slider */}
          <div>
            <label className="block text-sm font-medium mb-3">
              Budget Range: £{filters.minPrice} - £{filters.maxPrice} per week
            </label>
            <div className="px-2">
              <Slider
                value={[filters.minPrice, filters.maxPrice]}
                onValueChange={([min, max]) => setFilters(prev => ({ ...prev, minPrice: min, maxPrice: max }))}
                max={1000}
                min={50}
                step={25}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>£50</span>
                <span>£1000+</span>
              </div>
            </div>
          </div>

          {/* Room Only Toggle */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="roomOnly"
              checked={filters.roomOnly}
              onChange={(e) => setFilters(prev => ({ ...prev, roomOnly: e.target.checked }))}
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
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
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

      {/* Enhanced Results with Tabs */}
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
              <Tabs defaultValue="properties" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="properties" className="flex items-center space-x-2">
                    <Home className="w-4 h-4" />
                    <span>Properties</span>
                  </TabsTrigger>
                  <TabsTrigger value="safety" className="flex items-center space-x-2">
                    <Shield className="w-4 h-4" />
                    <span>Safety & Crime</span>
                  </TabsTrigger>
                  <TabsTrigger value="amenities" className="flex items-center space-x-2">
                    <MapPin className="w-4 h-4" />
                    <span>Local Amenities</span>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="properties" className="mt-6">
                  {viewMode === 'grid' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {properties.map((property) => (
                        <EnhancedPropertyCard
                          key={property.id}
                          property={property}
                          onView={(id) => console.log('View property:', id)}
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
                              <Badge
                                variant={getSafetyBadgeColor(property.crimeData.safetyScore)}
                                className="flex items-center text-xs"
                              >
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
                            <Button size="sm" onClick={() => console.log('View property:', property.id)}>
                              View Details
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="safety" className="mt-6">
                  <div className="space-y-4">
                    <div className="text-center mb-6">
                      <h3 className="text-lg font-semibold mb-2">Crime & Safety Information</h3>
                      <p className="text-gray-600 text-sm">Safety ratings and crime statistics for properties in {filters.location}</p>
                    </div>

                    {properties.filter(p => p.crimeData).map((property) => (
                      <Card key={property.id} className="p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="font-medium">{property.title}</h4>
                            <p className="text-sm text-gray-600">{property.location} • {property.postcode}</p>
                          </div>
                          <Badge
                            className={`${property.crimeData?.safetyScore >= 80 ? 'bg-green-500' :
                                       property.crimeData?.safetyScore >= 60 ? 'bg-yellow-500' : 'bg-red-500'} text-white`}
                          >
                            {property.crimeData?.safetyScore}% Safe
                          </Badge>
                        </div>

                        {property.crimeData && (
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                            <div>
                              <span className="font-medium">Crime Rating:</span>
                              <p className="text-gray-600">{property.crimeData.rating}</p>
                            </div>
                            <div>
                              <span className="font-medium">Crimes per 1000:</span>
                              <p className="text-gray-600">{property.crimeData.crimesPerThousand}</p>
                            </div>
                            <div>
                              <span className="font-medium">Safety Score:</span>
                              <p className="text-gray-600">{property.crimeData.safetyScore}/100</p>
                            </div>
                          </div>
                        )}
                      </Card>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="amenities" className="mt-6">
                  <div className="space-y-4">
                    <div className="text-center mb-6">
                      <h3 className="text-lg font-semibold mb-2">Local Amenities</h3>
                      <p className="text-gray-600 text-sm">Nearby supermarkets, gyms, transport, and other facilities</p>
                    </div>

                    {properties.filter(p => p.localAmenities?.length > 0).map((property) => (
                      <Card key={property.id} className="p-4">
                        <div className="mb-4">
                          <h4 className="font-medium">{property.title}</h4>
                          <p className="text-sm text-gray-600">{property.location} • {property.postcode}</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {property.localAmenities?.map((amenity, index) => (
                            <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                              <div className="flex items-center space-x-2">
                                <div className="w-6 h-6 flex items-center justify-center">
                                  {amenity.type === 'supermarket' && '🛒'}
                                  {amenity.type === 'gym' && '💪'}
                                  {amenity.type === 'university' && '🎓'}
                                  {amenity.type === 'transport' && '🚌'}
                                  {amenity.type === 'restaurant' && '🍽️'}
                                </div>
                                <span className="text-sm font-medium">{amenity.name}</span>
                              </div>
                              <span className="text-xs text-gray-500">{amenity.walkTime} min walk</span>
                            </div>
                          ))}
                        </div>
                      </Card>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PropertySearch;

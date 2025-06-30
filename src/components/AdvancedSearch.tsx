
import React, { useState } from 'react';
import { Search, Filter, MapPin, PoundSterling, Wifi, Car, Home, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';

interface SearchFilters {
  location: string;
  priceRange: [number, number];
  propertyType: string[];
  amenities: string[];
  maxCommute: number;
  availableFrom: string;
}

interface AdvancedSearchProps {
  onSearch: (filters: SearchFilters) => void;
  onSaveSearch: (filters: SearchFilters, name: string) => void;
}

const AdvancedSearch = ({ onSearch, onSaveSearch }: AdvancedSearchProps) => {
  const [filters, setFilters] = useState<SearchFilters>({
    location: '',
    priceRange: [100, 500],
    propertyType: [],
    amenities: [],
    maxCommute: 30,
    availableFrom: ''
  });
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [saveSearchName, setSaveSearchName] = useState('');

  const propertyTypes = [
    { id: 'studio', label: 'Studio', icon: Home },
    { id: 'shared', label: 'Shared House', icon: Users },
    { id: 'apartment', label: 'Apartment', icon: Home },
    { id: 'ensuite', label: 'En-suite', icon: Home }
  ];

  const amenities = [
    { id: 'wifi', label: 'Wi-Fi', icon: Wifi },
    { id: 'parking', label: 'Parking', icon: Car },
    { id: 'gym', label: 'Gym', icon: Home },
    { id: 'laundry', label: 'Laundry', icon: Home },
    { id: 'security', label: '24/7 Security', icon: Home },
    { id: 'garden', label: 'Garden', icon: Home }
  ];

  const handlePropertyTypeToggle = (typeId: string) => {
    setFilters(prev => ({
      ...prev,
      propertyType: prev.propertyType.includes(typeId)
        ? prev.propertyType.filter(t => t !== typeId)
        : [...prev.propertyType, typeId]
    }));
  };

  const handleAmenityToggle = (amenityId: string) => {
    setFilters(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenityId)
        ? prev.amenities.filter(a => a !== amenityId)
        : [...prev.amenities, amenityId]
    }));
  };

  const handleSearch = () => {
    onSearch(filters);
  };

  const handleSaveSearch = () => {
    if (saveSearchName.trim()) {
      onSaveSearch(filters, saveSearchName);
      setSaveSearchName('');
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Search className="w-5 h-5 text-blue-600" />
            <span>Find Your Perfect Home</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAdvanced(!showAdvanced)}
          >
            <Filter className="w-4 h-4 mr-2" />
            Advanced
          </Button>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Basic Search */}
        <div className="flex space-x-2">
          <div className="relative flex-1">
            <MapPin className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Enter location, university, or postcode..."
              value={filters.location}
              onChange={(e) => setFilters(prev => ({ ...prev, location: e.target.value }))}
              className="pl-10"
            />
          </div>
          <Button onClick={handleSearch} className="px-8">
            Search
          </Button>
        </div>

        {/* Advanced Filters */}
        {showAdvanced && (
          <div className="space-y-6 p-4 bg-gray-50 rounded-lg">
            {/* Price Range */}
            <div>
              <label className="block text-sm font-medium mb-3">
                Price Range: £{filters.priceRange[0]} - £{filters.priceRange[1]} per week
              </label>
              <Slider
                value={filters.priceRange}
                onValueChange={(value) => setFilters(prev => ({ ...prev, priceRange: value as [number, number] }))}
                max={1000}
                min={50}
                step={10}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>£50</span>
                <span>£1000+</span>
              </div>
            </div>

            {/* Property Types */}
            <div>
              <label className="block text-sm font-medium mb-3">Property Type</label>
              <div className="flex flex-wrap gap-2">
                {propertyTypes.map((type) => {
                  const Icon = type.icon;
                  return (
                    <Button
                      key={type.id}
                      variant={filters.propertyType.includes(type.id) ? "default" : "outline"}
                      size="sm"
                      onClick={() => handlePropertyTypeToggle(type.id)}
                      className="flex items-center space-x-1"
                    >
                      <Icon className="w-3 h-3" />
                      <span>{type.label}</span>
                    </Button>
                  );
                })}
              </div>
            </div>

            {/* Amenities */}
            <div>
              <label className="block text-sm font-medium mb-3">Amenities</label>
              <div className="flex flex-wrap gap-2">
                {amenities.map((amenity) => {
                  const Icon = amenity.icon;
                  return (
                    <Button
                      key={amenity.id}
                      variant={filters.amenities.includes(amenity.id) ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleAmenityToggle(amenity.id)}
                      className="flex items-center space-x-1"
                    >
                      <Icon className="w-3 h-3" />
                      <span>{amenity.label}</span>
                    </Button>
                  );
                })}
              </div>
            </div>

            {/* Commute Time */}
            <div>
              <label className="block text-sm font-medium mb-3">
                Max Commute: {filters.maxCommute} minutes
              </label>
              <Slider
                value={[filters.maxCommute]}
                onValueChange={(value) => setFilters(prev => ({ ...prev, maxCommute: value[0] }))}
                max={60}
                min={5}
                step={5}
                className="w-full"
              />
            </div>

            {/* Available From */}
            <div>
              <label className="block text-sm font-medium mb-2">Available From</label>
              <Input
                type="date"
                value={filters.availableFrom}
                onChange={(e) => setFilters(prev => ({ ...prev, availableFrom: e.target.value }))}
              />
            </div>

            {/* Save Search */}
            <div className="border-t pt-4">
              <div className="flex space-x-2">
                <Input
                  placeholder="Name this search..."
                  value={saveSearchName}
                  onChange={(e) => setSaveSearchName(e.target.value)}
                  className="flex-1"
                />
                <Button onClick={handleSaveSearch} variant="outline">
                  Save Search
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Active Filters Display */}
        {(filters.propertyType.length > 0 || filters.amenities.length > 0) && (
          <div className="flex flex-wrap gap-2">
            <span className="text-sm text-gray-600">Active filters:</span>
            {filters.propertyType.map(type => (
              <Badge key={type} variant="secondary" className="cursor-pointer">
                {propertyTypes.find(t => t.id === type)?.label}
                <span 
                  className="ml-1 hover:bg-gray-300 rounded-full px-1"
                  onClick={() => handlePropertyTypeToggle(type)}
                >
                  ×
                </span>
              </Badge>
            ))}
            {filters.amenities.map(amenity => (
              <Badge key={amenity} variant="secondary" className="cursor-pointer">
                {amenities.find(a => a.id === amenity)?.label}
                <span 
                  className="ml-1 hover:bg-gray-300 rounded-full px-1"
                  onClick={() => handleAmenityToggle(amenity)}
                >
                  ×
                </span>
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AdvancedSearch;

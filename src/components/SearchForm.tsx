
import React, { useState, useEffect } from 'react';
import { mockProperties } from '@/data/mockData';
import AdvancedSearch from './AdvancedSearch';
import SavedSearches from './SavedSearches';
import PropertyCard from './PropertyCard';
import { useToast } from '@/hooks/use-toast';

interface SearchFormProps {
  searchResults?: any[];
}

const SearchForm = ({ searchResults: initialResults }: SearchFormProps) => {
  const [filteredProperties, setFilteredProperties] = useState(mockProperties);
  const [savedProperties, setSavedProperties] = useState<number[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    const saved = localStorage.getItem('savedProperties');
    if (saved) {
      setSavedProperties(JSON.parse(saved));
    }
  }, []);

  const handleSearch = (filters: any) => {
    let filtered = mockProperties.filter(property => {
      // Location filter
      if (filters.location && !property.location.toLowerCase().includes(filters.location.toLowerCase()) &&
          !property.university.toLowerCase().includes(filters.location.toLowerCase())) {
        return false;
      }

      // Price range filter
      if (property.price < filters.priceRange[0] || property.price > filters.priceRange[1]) {
        return false;
      }

      // Property type filter
      if (filters.propertyType.length > 0 && !filters.propertyType.some((type: string) => 
        property.propertyType.toLowerCase().includes(type.toLowerCase()))) {
        return false;
      }

      // Amenities filter
      if (filters.amenities.length > 0 && !filters.amenities.every((amenity: string) =>
        property.amenities.some(propAmenity => propAmenity.toLowerCase().includes(amenity.toLowerCase())))) {
        return false;
      }

      // Commute time filter
      if (property.commuteTime > filters.maxCommute) {
        return false;
      }

      return true;
    });

    setFilteredProperties(filtered);
    toast({
      title: "Search Complete",
      description: `Found ${filtered.length} properties matching your criteria`,
    });
  };

  const handleSaveSearch = (filters: any, name: string) => {
    const savedSearches = JSON.parse(localStorage.getItem('savedSearches') || '[]');
    const newSearch = {
      id: Date.now().toString(),
      name,
      filters,
      alertsEnabled: true,
      created: new Date(),
      lastResults: filteredProperties.length
    };
    
    savedSearches.push(newSearch);
    localStorage.setItem('savedSearches', JSON.stringify(savedSearches));
    
    toast({
      title: "Search Saved",
      description: `"${name}" has been saved to your searches`,
    });
  };

  const handleSaveProperty = (id: number) => {
    const newSaved = savedProperties.includes(id) 
      ? savedProperties.filter(propId => propId !== id)
      : [...savedProperties, id];
    
    setSavedProperties(newSaved);
    localStorage.setItem('savedProperties', JSON.stringify(newSaved));
    
    toast({
      title: savedProperties.includes(id) ? "Property Removed" : "Property Saved",
      description: savedProperties.includes(id) 
        ? "Property removed from your saved list"
        : "Property added to your saved list",
    });
  };

  const handleShareProperty = (id: number) => {
    const property = mockProperties.find(p => p.id === id);
    if (property) {
      navigator.clipboard.writeText(`Check out this property: ${property.title} - £${property.price}/week`);
      toast({
        title: "Link Copied",
        description: "Property link copied to clipboard",
      });
    }
  };

  const handleViewProperty = (id: number) => {
    toast({
      title: "Property Details",
      description: "Opening detailed property view...",
    });
    // Here you would navigate to detailed property page
  };

  return (
    <div className="space-y-6">
      <AdvancedSearch onSearch={handleSearch} onSaveSearch={handleSaveSearch} />
      
      <div className="grid lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <SavedSearches onSearchSelect={handleSearch} />
        </div>
        
        <div className="lg:col-span-3">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold">
              {filteredProperties.length} Properties Found
            </h2>
            <select className="border rounded px-3 py-1 text-sm">
              <option>Sort by: Relevance</option>
              <option>Price: Low to High</option>
              <option>Price: High to Low</option>
              <option>Rating: Highest</option>
              <option>Distance to University</option>
            </select>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            {filteredProperties.map((property) => (
              <PropertyCard
                key={property.id}
                property={property}
                onView={handleViewProperty}
                onSave={handleSaveProperty}
                onShare={handleShareProperty}
                isSaved={savedProperties.includes(property.id)}
              />
            ))}
          </div>
          
          {filteredProperties.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-600 mb-4">No properties match your search criteria</p>
              <p className="text-sm text-gray-500">Try adjusting your filters or search terms</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchForm;

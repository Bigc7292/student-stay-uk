import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { type PropertyDataUKProperty } from '@/services/propertyDataUKService';
import { supabasePropertyService, type PropertySearchFilters } from '@/services/supabasePropertyService';
import { Bath, Bed, ChevronLeft, ChevronRight, MapPin, Shield, TrendingUp } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import styles from './PropertyCarousel.module.css';

interface PropertyCarouselProps {
  location?: string;
  maxProperties?: number;
}

const PropertyCarousel = ({ location, maxProperties = 6 }: PropertyCarouselProps) => {
  const [properties, setProperties] = useState<PropertyDataUKProperty[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [autoPlay, setAutoPlay] = useState(true);

  // Fallback method using original approach
  const loadFallbackProperties = React.useCallback(async (cities: string[]) => {
    try {
      console.log('🔄 Using fallback method for multi-city properties...');
      const allProperties: PropertyDataUKProperty[] = [];

      // Randomize cities and use 4-6 cities for diversity
      const randomizedCities = cities.sort(() => Math.random() - 0.5);
      const citiesToUse = randomizedCities.slice(0, Math.floor(Math.random() * 3) + 4); // 4-6 cities randomly

      // First, try to get properties with images from any location
      try {
        console.log('🌍 Getting diverse properties with images from any location...');

        const generalSearchFilters: PropertySearchFilters = {
          maxPrice: 800,
          available: true,
          limit: maxProperties * 2 // Get more to ensure variety
        };

        const allAvailableProperties = await supabasePropertyService.searchProperties(generalSearchFilters);

        if (allAvailableProperties.length > 0) {
          console.log(`✅ Found ${allAvailableProperties.length} properties with images`);

          // Group by location to ensure diversity
          const propertiesByLocation = allAvailableProperties.reduce((acc, prop) => {
            const location = prop.location || 'Unknown';
            if (!acc[location]) acc[location] = [];
            acc[location].push(prop);
            return acc;
          }, {} as Record<string, typeof allAvailableProperties>);

          // Take 1-2 properties from each location for variety
          const diverseProperties: typeof allAvailableProperties = [];
          Object.entries(propertiesByLocation).forEach(([location, props]) => {
            const propsToTake = Math.min(2, props.length);
            diverseProperties.push(...props.slice(0, propsToTake));
          });

          // Shuffle and limit
          const shuffledProperties = diverseProperties
            .sort(() => Math.random() - 0.5)
            .slice(0, maxProperties);

          allProperties.push(...shuffledProperties);
          console.log(`✅ Selected ${shuffledProperties.length} diverse properties from ${Object.keys(propertiesByLocation).length} locations`);
        }
      } catch (generalError) {
        console.warn('Failed to load general properties, trying city-specific search:', generalError);

        // Fallback to city-specific search
        for (const city of citiesToUse) {
          try {
            const searchFilters: PropertySearchFilters = {
              location: city,
              maxPrice: 800,
              available: true,
              limit: 2
            };

            const cityProperties = await supabasePropertyService.searchProperties(searchFilters);
            console.log(`🏙️ ${city}: Found ${cityProperties.length} properties`);

            allProperties.push(...cityProperties);
            if (allProperties.length >= maxProperties) break;
          } catch (cityError) {
            console.warn(`Failed to load properties from ${city}:`, cityError);
            continue;
          }
        }
      }

      // Shuffle properties for variety and limit to maxProperties
      const shuffledProperties = allProperties
        .sort(() => Math.random() - 0.5)
        .slice(0, maxProperties);

      setProperties(shuffledProperties);
      console.log(`✅ Loaded ${shuffledProperties.length} fallback properties from multiple cities`);
    } catch (error) {
      console.error('❌ Fallback method also failed:', error);
    }
  }, [maxProperties]);

  const loadProperties = React.useCallback(async () => {
    setLoading(true);
    try {
      // Major UK cities for diverse property showcase - randomized order each time
      const allCities = ['London', 'Manchester', 'Birmingham', 'Leeds', 'Liverpool', 'Bristol', 'Newcastle', 'Sheffield', 'Edinburgh', 'Glasgow', 'Cardiff', 'Nottingham'];
      const majorCities = allCities.sort(() => Math.random() - 0.5); // Randomize city order

      if (location) {
        // If specific location provided, search database for that location
        console.log(`🔍 Loading properties for specific location: ${location}`);

        const searchFilters: PropertySearchFilters = {
          location,
          maxPrice: 800,
          available: true,
          limit: maxProperties
        };

        const allProperties = await supabasePropertyService.searchProperties(searchFilters);

        console.log(`🔍 Carousel loaded ${allProperties.length} properties for ${location}`);
        allProperties.forEach((prop, idx) => {
          console.log(`   ${idx + 1}. ${prop.title} - Images: ${prop.images?.length || 0}`);
          if (prop.images && prop.images.length > 0) {
            console.log(`      First image: ${prop.images[0]}`);
          }
        });

        // Randomize order for variety
        const randomizedProperties = allProperties.sort(() => Math.random() - 0.5);
        setProperties(randomizedProperties);
      } else {
        // For home page carousel, use Supabase database for multi-city display
        console.log('🌍 Loading properties from multiple UK cities via Supabase...');
        await loadFallbackProperties(majorCities);
      }
    } catch (error) {
      console.error('Failed to load properties:', error);
    } finally {
      setLoading(false);
    }
  }, [location, maxProperties, loadFallbackProperties]);

  useEffect(() => {
    loadProperties();
  }, [location, loadProperties]);

  useEffect(() => {
    if (autoPlay && properties.length > 1) {
      const interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % properties.length);
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [autoPlay, properties.length]);

  const nextProperty = () => {
    setCurrentIndex((prev) => (prev + 1) % properties.length);
    setAutoPlay(false);
  };

  const prevProperty = () => {
    setCurrentIndex((prev) => (prev - 1 + properties.length) % properties.length);
    setAutoPlay(false);
  };

  const getSafetyBadgeColor = (safetyScore?: number) => {
    if (!safetyScore) return 'secondary';
    if (safetyScore >= 80) return 'default'; // green
    if (safetyScore >= 60) return 'secondary'; // yellow
    return 'destructive'; // red
  };

  const getSafetyLabel = (safetyScore?: number) => {
    if (!safetyScore) return 'Safety data pending';
    if (safetyScore >= 80) return 'Very Safe';
    if (safetyScore >= 60) return 'Safe';
    return 'Check Safety';
  };

  if (loading) {
    return (
      <div className="w-full">
        <div className="text-center py-8">
          <div className="animate-pulse">
            <div className="h-64 bg-gray-200 rounded-lg mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
          </div>
          <p className="text-gray-600 mt-4">Loading live properties...</p>
        </div>
      </div>
    );
  }

  if (properties.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">No properties found for {location}</p>
        <Button onClick={loadProperties} className="mt-4">
          Try Again
        </Button>
      </div>
    );
  }

  const currentProperty = properties[currentIndex];

  return (
    <div className="w-full max-w-3xl mx-auto px-2 sm:px-4 md:px-8">
      <div className="relative flex flex-col md:flex-row items-center bg-white rounded-lg shadow-lg overflow-hidden transition-all duration-300 min-h-[420px] md:min-h-[320px]">
        {/* Carousel Navigation (Left) */}
        <button
          className={`absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-white bg-opacity-80 rounded-full p-2 shadow-md hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 md:static md:translate-y-0 md:mr-4 ${styles['carousel-nav-touch']}`}
          onClick={prevProperty}
          aria-label="Previous property"
        >
          <ChevronLeft className="w-6 h-6 md:w-8 md:h-8 text-blue-600" />
        </button>

        {/* Property Image */}
        <div className="flex-shrink-0 w-full md:w-2/5 aspect-square md:aspect-auto flex items-center justify-center bg-gray-100 overflow-hidden">
          {currentProperty.images && currentProperty.images.length > 0 ? (
            <img
              src={currentProperty.images[0]}
              alt={currentProperty.title}
              className={`object-cover w-full h-48 sm:h-64 md:h-80 rounded-t-lg md:rounded-l-lg md:rounded-t-none transition-all duration-300 ${styles['carousel-img-mobile']}`}
            />
          ) : (
            <div className="flex items-center justify-center w-full h-48 sm:h-64 md:h-80 bg-gray-200 text-gray-400 text-4xl">
              <Bed className="w-12 h-12" />
            </div>
          )}
        </div>

        {/* Property Details */}
        <div className="flex-1 flex flex-col justify-between p-4 w-full md:w-3/5">
          {/* Property Title & Type */}
          <div className="mb-4">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {currentProperty.title}
            </h3>
            <div className="flex items-center text-gray-600 mb-3">
              <MapPin className="h-4 w-4 mr-1" />
              <span className="text-sm">{currentProperty.location}</span>
            </div>
          </div>

          {/* Price */}
          <div className="mb-4">
            <div className="text-3xl font-bold text-green-600">
              £{currentProperty.price}
              <span className="text-lg text-gray-500">/{currentProperty.priceType}</span>
            </div>
          </div>

          {/* Property Details */}
          <div className="flex items-center space-x-4 mb-4">
            <div className="flex items-center text-gray-600">
              <Bed className="h-4 w-4 mr-1" />
              <span className="text-sm">{currentProperty.bedrooms} bed</span>
            </div>
            <div className="flex items-center text-gray-600">
              <Bath className="h-4 w-4 mr-1" />
              <span className="text-sm">{currentProperty.bathrooms} bath</span>
            </div>
            {currentProperty.furnished && (
              <Badge variant="outline" className="text-xs">
                Furnished
              </Badge>
            )}
          </div>

          {/* Safety Badge */}
          {currentProperty.crimeData && (
            <div className="mb-4">
              <Badge 
                variant={getSafetyBadgeColor(currentProperty.crimeData.safetyScore)}
                className="flex items-center w-fit"
              >
                <Shield className="h-3 w-3 mr-1" />
                {getSafetyLabel(currentProperty.crimeData.safetyScore)}
              </Badge>
              <p className="text-xs text-gray-500 mt-1">
                Crime rating: {currentProperty.crimeData.rating}
              </p>
            </div>
          )}

          {/* Description */}
          <p className="text-gray-600 text-sm mb-4 line-clamp-2">
            {currentProperty.description}
          </p>

          {/* Action Button */}
          <div className="flex justify-between items-center">
            <Button
              className="flex-1 mr-2"
              onClick={() => {
                console.log('View Details clicked for property:', currentProperty.id);
                // TODO: Open property details modal or navigate to property page
                alert(`Property Details for: ${currentProperty.title}\n\nPrice: £${currentProperty.price}/week\nLocation: ${currentProperty.location}\n\nThis will open a detailed view in the future!`);
              }}
            >
              View Details
            </Button>
            <Button variant="outline" size="icon" aria-label="Show property trends" title="Show property trends">
              <TrendingUp className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Carousel Navigation (Right) */}
        <button
          className={`absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-white bg-opacity-80 rounded-full p-2 shadow-md hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 md:static md:translate-y-0 md:ml-4 ${styles['carousel-nav-touch']}`}
          onClick={nextProperty}
          aria-label="Next property"
        >
          <ChevronRight className="w-6 h-6 md:w-8 md:h-8 text-blue-600" />
        </button>
      </div>

      {/* Dots Indicator */}
      {properties.length > 1 && (
        <div className="flex justify-center space-x-2 py-4 bg-gray-50">
          {properties.map((_, index) => (
            <button
              key={index}
              type="button"
              onClick={() => setCurrentIndex(index)}
              className={`w-2 h-2 rounded-full transition-colors ${
                index === currentIndex ? 'bg-blue-600' : 'bg-gray-300'
              }`}
              aria-label={`Go to property ${index + 1}`}
              title={`Go to property ${index + 1}`}
            />
          ))}
        </div>
      )}

      {/* Property Counter */}
      <div className="text-center mt-4">
        <p className="text-sm text-gray-600">
          Showing {currentIndex + 1} of {properties.length} live properties
        </p>
      </div>
    </div>
  );
};

export default PropertyCarousel;

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { type PropertyDataUKProperty } from '@/services/propertyDataUKService';
import { supabasePropertyService, type PropertySearchFilters } from '@/services/supabasePropertyService';
import { Bath, Bed, ChevronLeft, ChevronRight, MapPin, Shield, TrendingUp } from 'lucide-react';
import React, { useEffect, useState } from 'react';

interface PropertyCarouselProps {
  location?: string;
  maxProperties?: number;
}

const PropertyCarousel = ({ location, maxProperties = 6 }: PropertyCarouselProps) => {
  const [properties, setProperties] = useState<PropertyDataUKProperty[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [autoPlay, setAutoPlay] = useState(true);

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
        // For home page carousel, use Bright Data Zoopla for multi-city display
        console.log('🌍 Loading properties from multiple UK cities via Bright Data Zoopla...');

        try {
          // Import Bright Data Zoopla service dynamically
          const { brightDataZooplaService } = await import('../services/brightDataZooplaService');

          // Search multiple cities at once
          const zooplaProperties = await brightDataZooplaService.searchMultipleCities(majorCities);

          if (zooplaProperties.length > 0) {
            console.log(`✅ Loaded ${zooplaProperties.length} real Zoopla properties from multiple cities`);
            setProperties(zooplaProperties.slice(0, maxProperties));
          } else {
            console.log('⚠️ No Zoopla properties found, falling back to market data...');
            await loadFallbackProperties(majorCities);
          }
        } catch (zooplaError) {
          console.error('❌ Bright Data Zoopla failed, using fallback:', zooplaError);
          await loadFallbackProperties(majorCities);
        }
      }
    } catch (error) {
      console.error('Failed to load properties:', error);
    } finally {
      setLoading(false);
    }
  }, [location, maxProperties]);

  // Fallback method using original approach
  const loadFallbackProperties = React.useCallback(async (cities: string[]) => {
    try {
      console.log('🔄 Using fallback method for multi-city properties...');
      const allProperties: PropertyDataUKProperty[] = [];

      // Randomize cities and use 4-6 cities for diversity
      const randomizedCities = cities.sort(() => Math.random() - 0.5);
      const citiesToUse = randomizedCities.slice(0, Math.floor(Math.random() * 3) + 4); // 4-6 cities randomly

      for (const city of citiesToUse) {
        try {
          // Search database for properties in this city
          const searchFilters: PropertySearchFilters = {
            location: city,
            maxPrice: 800,
            available: true,
            limit: 2 // 2 per city for diversity
          };

          const cityProperties = await supabasePropertyService.searchProperties(searchFilters);

          console.log(`🏙️ ${city}: Found ${cityProperties.length} properties`);
          cityProperties.forEach((prop, idx) => {
            if (idx < 2) { // Only log first 2
              console.log(`   ${prop.title} - Images: ${prop.images?.length || 0}`);
            }
          });

          // Add source city for tracking
          const propertiesWithSource = cityProperties.map(prop => ({
            ...prop,
            sourceCity: city
          }));

          allProperties.push(...propertiesWithSource);

          // If we have enough properties, break early
          if (allProperties.length >= maxProperties) break;
        } catch (cityError) {
          console.warn(`Failed to load properties from ${city}:`, cityError);
          continue; // Try next city
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
    <div className="relative w-full max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {location ? `Live Student Properties in ${location}` : 'Featured Student Properties Across UK'}
        </h2>
        <p className="text-gray-600">
          {location ? 'Real-time rental data powered by Property Data UK API' : 'Diverse properties from major UK cities - London, Manchester, Birmingham & more'}
        </p>
      </div>

      {/* Carousel Container */}
      <div className="relative overflow-hidden rounded-xl bg-white shadow-lg">
        {/* Navigation Buttons */}
        {properties.length > 1 && (
          <>
            <Button
              variant="outline"
              size="icon"
              onClick={prevProperty}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white shadow-lg"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={nextProperty}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white shadow-lg"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </>
        )}

        {/* Property Card */}
        <div className="grid md:grid-cols-2 min-h-[400px]">
          {/* Image Section */}
          <div className="relative overflow-hidden">
            {currentProperty.images && currentProperty.images.length > 0 ? (
              <img
                src={currentProperty.images[0]}
                alt={currentProperty.title}
                className="w-full h-full object-cover"
                onLoad={() => {
                  console.log('✅ Carousel image loaded:', currentProperty.images[0]);
                }}
                onError={(e) => {
                  console.log('❌ Carousel image failed:', currentProperty.images[0]);
                  // Fallback to "No Photos Available" if real image fails to load
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  target.parentElement!.innerHTML = `
                    <div class="bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center h-full">
                      <div class="text-center p-8">
                        <div class="w-24 h-24 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center">
                          <svg class="h-12 w-12 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <p class="text-gray-600 font-medium">No Photos Available</p>
                        <p class="text-gray-500 text-sm">Real property listing</p>
                      </div>
                    </div>
                  `;
                }}
              />
            ) : (
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center h-full">
                <div className="text-center p-8">
                  <div className="w-24 h-24 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <svg className="h-12 w-12 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <p className="text-gray-600 font-medium">
                    No Photos Available
                  </p>
                  <p className="text-gray-500 text-sm">
                    Real property listing
                  </p>
                </div>
              </div>
            )}

            {/* Image overlay with property count */}
            {currentProperty.images && currentProperty.images.length > 1 && (
              <div className="absolute top-4 right-4 bg-black/70 text-white px-2 py-1 rounded text-sm">
                +{currentProperty.images.length - 1} more
              </div>
            )}
          </div>

          {/* Content Section */}
          <div className="p-6 flex flex-col justify-between">
            <div>
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
            </div>

            {/* Action Button */}
            <div className="flex justify-between items-center">
              <Button className="flex-1 mr-2">
                View Details
              </Button>
              <Button variant="outline" size="icon" aria-label="Show property trends" title="Show property trends">
                <TrendingUp className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Dots Indicator */}
        {properties.length > 1 && (
          <div className="flex justify-center space-x-2 py-4 bg-gray-50">
            {properties.map((_, index) => (
              <button
                key={index}
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
      </div>

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

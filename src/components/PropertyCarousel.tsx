
import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, MapPin, Bed, Bath, Shield, TrendingUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { propertyDataUKService, type PropertyDataUKProperty } from '@/services/propertyDataUKService';

interface PropertyCarouselProps {
  location?: string;
  maxProperties?: number;
}

const PropertyCarousel = ({ location = 'Manchester', maxProperties = 6 }: PropertyCarouselProps) => {
  const [properties, setProperties] = useState<PropertyDataUKProperty[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [autoPlay, setAutoPlay] = useState(true);

  useEffect(() => {
    loadProperties();
  }, [location]);

  useEffect(() => {
    if (autoPlay && properties.length > 1) {
      const interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % properties.length);
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [autoPlay, properties.length]);

  const loadProperties = async () => {
    setLoading(true);
    try {
      // Search both regular rentals and HMO properties
      const [regularRentals, hmoRentals] = await Promise.all([
        propertyDataUKService.searchRentals({ location, maxPrice: 800 }),
        propertyDataUKService.searchHMORentals({ location, maxPrice: 300 })
      ]);

      const allProperties = [...regularRentals, ...hmoRentals]
        .slice(0, maxProperties)
        .sort((a, b) => a.price - b.price);

      setProperties(allProperties);
    } catch (error) {
      console.error('Failed to load properties:', error);
    } finally {
      setLoading(false);
    }
  };

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
          Live Student Properties in {location}
        </h2>
        <p className="text-gray-600">
          Real-time rental data powered by Property Data UK API
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
          <div className="relative bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
            <div className="text-center p-8">
              <div className="w-24 h-24 bg-blue-200 rounded-full mx-auto mb-4 flex items-center justify-center">
                <MapPin className="h-12 w-12 text-blue-600" />
              </div>
              <p className="text-blue-700 font-medium">
                Live Property Data
              </p>
              <p className="text-blue-600 text-sm">
                {currentProperty.postcode}
              </p>
            </div>
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
              <Button variant="outline" size="icon">
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

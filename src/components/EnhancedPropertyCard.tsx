import React, { useState } from 'react';
import { 
  MapPin, Star, Wifi, Car, Home, Clock, Heart, Share2, Eye, 
  Shield, ShoppingCart, Dumbbell, GraduationCap, Bus, AlertTriangle,
  ChevronDown, ChevronUp, Info, CheckCircle, XCircle, Bed, Bath
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface CrimeData {
  rating: string;
  crimesPerThousand: number;
  safetyScore: number;
}

interface LocalAmenity {
  type: 'supermarket' | 'gym' | 'university' | 'transport' | 'hospital' | 'restaurant';
  name: string;
  distance: number; // in meters
  walkTime: number; // in minutes
}

interface Property {
  id: number | string;
  title: string;
  price: number;
  location: string;
  postcode?: string;
  image?: string;
  amenities?: string[];
  rating?: number;
  available: boolean;
  description: string;
  propertyType: string;
  commuteTime?: number;
  university?: string;
  bills?: string;
  deposit?: number;
  viewingCount?: number;
  savedCount?: number;
  isNew?: boolean;
  virtualTour?: boolean;
  crimeData?: CrimeData;
  localAmenities?: LocalAmenity[];
  bedrooms?: number;
  bathrooms?: number;
  priceType?: 'weekly' | 'monthly';
}

interface EnhancedPropertyCardProps {
  property: Property;
  onView: (id: number | string) => void;
  onSave?: (id: number | string) => void;
  onShare?: (id: number | string) => void;
  isSaved?: boolean;
  showCrimeData?: boolean;
  showLocalAmenities?: boolean;
}

const EnhancedPropertyCard = ({ 
  property, 
  onView, 
  onSave, 
  onShare, 
  isSaved = false,
  showCrimeData = true,
  showLocalAmenities = true
}: EnhancedPropertyCardProps) => {
  const [showDetails, setShowDetails] = useState(false);

  const getAmenityIcon = (amenity: string) => {
    switch (amenity.toLowerCase()) {
      case 'wi-fi':
      case 'wifi':
        return <Wifi className="w-3 h-3" />;
      case 'parking':
        return <Car className="w-3 h-3" />;
      default:
        return <Home className="w-3 h-3" />;
    }
  };

  const getLocalAmenityIcon = (type: string) => {
    switch (type) {
      case 'supermarket':
        return <ShoppingCart className="w-4 h-4 text-green-600" />;
      case 'gym':
        return <Dumbbell className="w-4 h-4 text-blue-600" />;
      case 'university':
        return <GraduationCap className="w-4 h-4 text-purple-600" />;
      case 'transport':
        return <Bus className="w-4 h-4 text-orange-600" />;
      default:
        return <MapPin className="w-4 h-4 text-gray-600" />;
    }
  };

  const getSafetyBadgeColor = (safetyScore: number) => {
    if (safetyScore >= 80) return 'bg-green-500';
    if (safetyScore >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getSafetyIcon = (safetyScore: number) => {
    if (safetyScore >= 80) return <CheckCircle className="w-4 h-4" />;
    if (safetyScore >= 60) return <AlertTriangle className="w-4 h-4" />;
    return <XCircle className="w-4 h-4" />;
  };

  return (
    <Card className="hover:shadow-lg transition-all duration-300 group overflow-hidden">
      <div className="relative">
        <img 
          src={property.image || '/placeholder.svg'} 
          alt={property.title}
          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
        />
        
        {/* Overlay badges */}
        <div className="absolute top-2 left-2 flex flex-col space-y-1">
          {property.isNew && (
            <Badge className="bg-green-500 text-white">NEW</Badge>
          )}
          {property.virtualTour && (
            <Badge className="bg-purple-500 text-white">Virtual Tour</Badge>
          )}
          <Badge 
            className={`${property.available ? 'bg-green-500' : 'bg-red-500'} text-white`}
          >
            {property.available ? 'Available' : 'Full'}
          </Badge>
          
          {/* Crime Safety Badge */}
          {showCrimeData && property.crimeData && (
            <Badge className={`${getSafetyBadgeColor(property.crimeData.safetyScore)} text-white flex items-center space-x-1`}>
              {getSafetyIcon(property.crimeData.safetyScore)}
              <span>Safety: {property.crimeData.safetyScore}%</span>
            </Badge>
          )}
        </div>

        {/* Action buttons */}
        {(onSave || onShare) && (
          <div className="absolute top-2 right-2 flex flex-col space-y-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {onSave && (
              <Button
                size="sm"
                variant="secondary"
                className="w-8 h-8 p-0"
                onClick={() => onSave(property.id)}
              >
                <Heart className={`w-4 h-4 ${isSaved ? 'fill-red-500 text-red-500' : ''}`} />
              </Button>
            )}
            {onShare && (
              <Button
                size="sm"
                variant="secondary"
                className="w-8 h-8 p-0"
                onClick={() => onShare(property.id)}
              >
                <Share2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        )}

        {/* Price overlay */}
        <div className="absolute bottom-2 left-2 bg-black bg-opacity-75 text-white px-2 py-1 rounded">
          <span className="font-bold">£{property.price}/{property.priceType || 'week'}</span>
          {property.bills && <div className="text-xs">{property.bills}</div>}
        </div>
      </div>

      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-semibold text-lg line-clamp-2">{property.title}</h3>
          {property.rating && (
            <div className="flex items-center ml-2">
              <Star className="w-4 h-4 text-yellow-400 fill-current" />
              <span className="ml-1 text-sm font-medium">{property.rating}</span>
            </div>
          )}
        </div>

        <div className="flex items-center text-gray-600 mb-2">
          <MapPin className="w-4 h-4 mr-1" />
          <span className="text-sm">{property.location}</span>
          {property.postcode && (
            <span className="text-xs text-gray-500 ml-2">({property.postcode})</span>
          )}
        </div>

        {/* Property Details */}
        <div className="flex items-center space-x-4 text-gray-600 mb-2">
          {property.bedrooms && (
            <div className="flex items-center">
              <Bed className="w-4 h-4 mr-1" />
              <span className="text-sm">{property.bedrooms} bed</span>
            </div>
          )}
          {property.bathrooms && (
            <div className="flex items-center">
              <Bath className="w-4 h-4 mr-1" />
              <span className="text-sm">{property.bathrooms} bath</span>
            </div>
          )}
          {property.commuteTime && property.university && (
            <div className="flex items-center">
              <Clock className="w-4 h-4 mr-1" />
              <span className="text-sm">{property.commuteTime} min to {property.university}</span>
            </div>
          )}
        </div>

        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{property.description}</p>

        {/* Amenities */}
        {property.amenities && property.amenities.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            <Badge variant="outline" className="text-xs">{property.propertyType}</Badge>
            {property.amenities.slice(0, 3).map((amenity) => (
              <Badge key={amenity} variant="secondary" className="text-xs flex items-center">
                {getAmenityIcon(amenity)}
                <span className="ml-1">{amenity}</span>
              </Badge>
            ))}
            {property.amenities.length > 3 && (
              <Badge variant="secondary" className="text-xs">
                +{property.amenities.length - 3} more
              </Badge>
            )}
          </div>
        )}

        {/* Crime Data Section */}
        {showCrimeData && property.crimeData && (
          <Alert className="mb-3">
            <Shield className="h-4 w-4" />
            <AlertDescription>
              <div className="flex items-center justify-between">
                <span className="text-sm">
                  <strong>Safety:</strong> {property.crimeData.rating} 
                  ({property.crimeData.crimesPerThousand} crimes/1000 people)
                </span>
                <Badge className={getSafetyBadgeColor(property.crimeData.safetyScore)}>
                  {property.crimeData.safetyScore}% Safe
                </Badge>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Local Amenities Preview */}
        {showLocalAmenities && property.localAmenities && property.localAmenities.length > 0 && (
          <div className="mb-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Nearby</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDetails(!showDetails)}
                className="h-6 px-2"
              >
                {showDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </Button>
            </div>
            
            {!showDetails ? (
              <div className="flex flex-wrap gap-1">
                {property.localAmenities.slice(0, 3).map((amenity, index) => (
                  <Badge key={index} variant="outline" className="text-xs flex items-center">
                    {getLocalAmenityIcon(amenity.type)}
                    <span className="ml-1">{amenity.walkTime}min</span>
                  </Badge>
                ))}
                {property.localAmenities.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{property.localAmenities.length - 3} more
                  </Badge>
                )}
              </div>
            ) : (
              <div className="space-y-1">
                {property.localAmenities.map((amenity, index) => (
                  <div key={index} className="flex items-center justify-between text-xs">
                    <div className="flex items-center">
                      {getLocalAmenityIcon(amenity.type)}
                      <span className="ml-2">{amenity.name}</span>
                    </div>
                    <span className="text-gray-500">{amenity.walkTime} min walk</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Stats */}
        {(property.viewingCount || property.savedCount || property.deposit) && (
          <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
            {property.viewingCount && (
              <div className="flex items-center">
                <Eye className="w-3 h-3 mr-1" />
                <span>{property.viewingCount} viewed</span>
              </div>
            )}
            {property.savedCount && (
              <div className="flex items-center">
                <Heart className="w-3 h-3 mr-1" />
                <span>{property.savedCount} saved</span>
              </div>
            )}
            {property.deposit && (
              <span>£{property.deposit} deposit</span>
            )}
          </div>
        )}

        <Button 
          className="w-full" 
          disabled={!property.available}
          onClick={() => onView(property.id)}
        >
          {property.available ? 'View Details' : 'Join Waitlist'}
        </Button>
      </CardContent>
    </Card>
  );
};

export default EnhancedPropertyCard;

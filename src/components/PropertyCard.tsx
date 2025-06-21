
import React from 'react';
import { MapPin, Star, Wifi, Car, Home, Clock, Heart, Share2, Eye } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface Property {
  id: number;
  title: string;
  price: number;
  location: string;
  image: string;
  amenities: string[];
  rating: number;
  available: boolean;
  description: string;
  propertyType: string;
  commuteTime: number;
  university: string;
  bills: string;
  deposit: number;
  viewingCount: number;
  savedCount: number;
  isNew?: boolean;
  virtualTour?: boolean;
}

interface PropertyCardProps {
  property: Property;
  onView: (id: number) => void;
  onSave: (id: number) => void;
  onShare: (id: number) => void;
  isSaved?: boolean;
}

const PropertyCard = ({ property, onView, onSave, onShare, isSaved = false }: PropertyCardProps) => {
  const getAmenityIcon = (amenity: string) => {
    switch (amenity.toLowerCase()) {
      case 'wi-fi': return <Wifi className="w-3 h-3" />;
      case 'parking': return <Car className="w-3 h-3" />;
      default: return <Home className="w-3 h-3" />;
    }
  };

  return (
    <Card className="hover:shadow-lg transition-all duration-300 group overflow-hidden">
      <div className="relative">
        <img 
          src={property.image} 
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
        </div>

        {/* Action buttons */}
        <div className="absolute top-2 right-2 flex flex-col space-y-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            size="sm"
            variant="secondary"
            className="w-8 h-8 p-0"
            onClick={() => onSave(property.id)}
          >
            <Heart className={`w-4 h-4 ${isSaved ? 'fill-red-500 text-red-500' : ''}`} />
          </Button>
          <Button
            size="sm"
            variant="secondary"
            className="w-8 h-8 p-0"
            onClick={() => onShare(property.id)}
          >
            <Share2 className="w-4 h-4" />
          </Button>
        </div>

        {/* Price overlay */}
        <div className="absolute bottom-2 left-2 bg-black bg-opacity-75 text-white px-2 py-1 rounded">
          <span className="font-bold">£{property.price}/week</span>
          <div className="text-xs">{property.bills}</div>
        </div>
      </div>

      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-semibold text-lg line-clamp-2">{property.title}</h3>
          <div className="flex items-center ml-2">
            <Star className="w-4 h-4 text-yellow-400 fill-current" />
            <span className="ml-1 text-sm font-medium">{property.rating}</span>
          </div>
        </div>

        <div className="flex items-center text-gray-600 mb-2">
          <MapPin className="w-4 h-4 mr-1" />
          <span className="text-sm">{property.location}</span>
        </div>

        <div className="flex items-center text-gray-600 mb-3">
          <Clock className="w-4 h-4 mr-1" />
          <span className="text-sm">{property.commuteTime} min to {property.university}</span>
        </div>

        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{property.description}</p>

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

        <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
          <div className="flex items-center">
            <Eye className="w-3 h-3 mr-1" />
            <span>{property.viewingCount} viewed</span>
          </div>
          <div className="flex items-center">
            <Heart className="w-3 h-3 mr-1" />
            <span>{property.savedCount} saved</span>
          </div>
          <span>£{property.deposit} deposit</span>
        </div>

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

export default PropertyCard;

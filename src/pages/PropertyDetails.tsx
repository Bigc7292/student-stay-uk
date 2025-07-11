import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, MapPin, Bed, Bath, Home, Calendar, Phone, Mail, Shield, Star } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface Property {
  id: string;
  title: string;
  price: number;
  price_type: string | null;
  location: string;
  full_address: string | null;
  postcode: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  property_type: string | null;
  furnished: boolean | null;
  available: boolean | null;
  description: string | null;
  landlord_name: string | null;
  landlord_contact: string | null;
  landlord_verified: boolean | null;
  crime_rating: string | null;
  crimes_per_thousand: number | null;
  safety_score: number | null;
  available_date: string | null;
  transport_links: string | null;
  nearby_amenities: string | null;
  university_distance_miles: number | null;
  property_images: Array<{
    id: string;
    image_url: string;
    alt_text: string | null;
    is_primary: boolean | null;
  }>;
}

const PropertyDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    if (id) {
      fetchPropertyDetails(id);
    }
  }, [id]);

  const fetchPropertyDetails = async (propertyId: string) => {
    try {
      setLoading(true);
      
      const { data: propertyData, error: propertyError } = await supabase
        .from('properties')
        .select(`
          *,
          property_images (
            id,
            image_url,
            alt_text,
            is_primary
          )
        `)
        .eq('id', propertyId)
        .single();

      if (propertyError) {
        throw propertyError;
      }

      if (!propertyData) {
        setError('Property not found');
        return;
      }

      setProperty(propertyData);
    } catch (err) {
      console.error('Error fetching property details:', err);
      setError('Failed to load property details');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading property details...</p>
        </div>
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Property Not Found</h1>
          <p className="text-gray-600 mb-6">{error || 'The property you are looking for does not exist.'}</p>
          <Button onClick={() => navigate('/')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Search
          </Button>
        </div>
      </div>
    );
  }

  const images = property.property_images || [];
  const primaryImage = images.find(img => img.is_primary) || images[0];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Search
          </Button>
          
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{property.title}</h1>
              <div className="flex items-center mt-2 text-gray-600">
                <MapPin className="w-4 h-4 mr-1" />
                <span>{property.full_address}</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-blue-600">
                £{property.price.toLocaleString()}
                <span className="text-lg text-gray-500">/{property.price_type || 'week'}</span>
              </div>
              <Badge variant={property.available ? "default" : "secondary"}>
                {property.available ? "Available" : "Not Available"}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image Gallery */}
            <Card>
              <CardContent className="p-0">
                {images.length > 0 ? (
                  <div className="relative">
                    <img
                      src={images[currentImageIndex]?.image_url || primaryImage?.image_url}
                      alt={images[currentImageIndex]?.alt_text || 'Property image'}
                      className="w-full h-96 object-cover rounded-t-lg"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/placeholder.svg';
                      }}
                    />
                    {images.length > 1 && (
                      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                        {images.map((_, index) => (
                          <button
                            key={index}
                            onClick={() => setCurrentImageIndex(index)}
                            className={`w-3 h-3 rounded-full ${
                              index === currentImageIndex ? 'bg-white' : 'bg-white/50'
                            }`}
                            aria-label={`Show image ${index + 1}`}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="w-full h-96 bg-gray-200 rounded-t-lg flex items-center justify-center">
                    <Home className="w-16 h-16 text-gray-400" />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Property Details */}
            <Card>
              <CardHeader>
                <CardTitle>Property Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="flex items-center space-x-2">
                    <Bed className="w-5 h-5 text-gray-500" />
                    <span>{property.bedrooms || 0} Bedroom{(property.bedrooms || 0) !== 1 ? 's' : ''}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Bath className="w-5 h-5 text-gray-500" />
                    <span>{property.bathrooms || 0} Bathroom{(property.bathrooms || 0) !== 1 ? 's' : ''}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Home className="w-5 h-5 text-gray-500" />
                    <span className="capitalize">{property.property_type || 'Property'}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-5 h-5 text-gray-500" />
                    <span>{property.furnished ? 'Furnished' : 'Unfurnished'}</span>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-2">Description</h3>
                  <p className="text-gray-600">{property.description || 'No description available'}</p>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Transport Links</h3>
                  <p className="text-gray-600">{property.transport_links || 'No transport information available'}</p>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Nearby Amenities</h3>
                  <p className="text-gray-600">{property.nearby_amenities || 'No amenities information available'}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Landlord Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <span>Landlord Information</span>
                  {property.landlord_verified && (
                    <Badge variant="default" className="ml-2">
                      <Shield className="w-3 h-3 mr-1" />
                      Verified
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="font-medium">{property.landlord_name || 'Contact details not available'}</p>
                  {property.landlord_contact && (
                    <div className="flex items-center mt-2 text-sm text-gray-600">
                      <Mail className="w-4 h-4 mr-2" />
                      <span>{property.landlord_contact}</span>
                    </div>
                  )}
                </div>
                <Button className="w-full">
                  <Phone className="w-4 h-4 mr-2" />
                  Contact Landlord
                </Button>
              </CardContent>
            </Card>

            {/* Safety Information */}
            <Card>
              <CardHeader>
                <CardTitle>Safety & Security</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>Crime Rating</span>
                  <Badge variant={
                    property.crime_rating === 'Very Low' ? 'default' :
                    property.crime_rating === 'Low' ? 'secondary' :
                    property.crime_rating === 'Medium' ? 'outline' : 'destructive'
                  }>
                    {property.crime_rating || 'N/A'}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>Crimes per 1000</span>
                  <span className="font-medium">{property.crimes_per_thousand || 'N/A'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Safety Score</span>
                  <div className="flex items-center">
                    <Star className="w-4 h-4 text-yellow-400 mr-1" />
                    <span className="font-medium">{property.safety_score || 'N/A'}/5</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* University Distance */}
            <Card>
              <CardHeader>
                <CardTitle>University Access</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center">
                  <span>Distance to University</span>
                  <span className="font-medium">{property.university_distance_miles || 'N/A'} miles</span>
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  Available from: {property.available_date ? new Date(property.available_date).toLocaleDateString() : 'Contact landlord'}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyDetails;

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { PropertyDataUKProperty } from '@/services/propertyDataUKService';
import {
  Bath,
  Bed,
  Bus,
  Calendar,
  Dumbbell, GraduationCap,
  Heart,
  Home,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  Share2,
  Shield,
  ShoppingCart,
  Star,
  TrendingUp,
  Wifi,
  X
} from 'lucide-react';
import React, { useState } from 'react';
import './PropertyDetailsModal.css';

// Utility: map value to width class
const getProgressWidthClass = (value: number) => {
  const rounded = Math.round(Math.max(0, Math.min(100, value)) / 10) * 10;
  return `progress-bar-width-${rounded}`;
};

// Simple Progress component
const Progress = ({ value, className }: { value: number; className?: string }) => (
  <div className={`bg-gray-200 rounded-full overflow-hidden ${className || 'h-2'}`}>
    <div className={`progress-bar ${getProgressWidthClass(value)}`}></div>
  </div>
);

interface KeyInsight {
  category: string;
  rating: number;
  sentiment: string;
  trend: string;
}

interface LocalAmenity {
  type: string;
  name: string;
  distance: number;
  walkTime: number;
}

interface EnhancedProperty extends PropertyDataUKProperty {
  image?: string;
  deposit?: number;
  bills?: string;
  amenities?: string[];
  reviewData?: { keyInsights: KeyInsight[] };
  localAmenities?: LocalAmenity[];
}

interface PropertyDetailsModalProps {
  property: EnhancedProperty;
  isOpen: boolean;
  onClose: () => void;
}

const PropertyDetailsModal: React.FC<PropertyDetailsModalProps> = ({ property, isOpen, onClose }) => {
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  if (!isOpen || !property) return null;

  // Mock enhanced property data with reviews
  const enhancedProperty = {
    ...property,
    images: [
      property.image || '/placeholder.svg',
      '/placeholder.svg',
      '/placeholder.svg',
      '/placeholder.svg'
    ],
    fullDescription: `${property.description} This modern student accommodation offers excellent value for money with all bills included. Located in the heart of the city, you'll be just minutes away from the university campus and all major amenities. The property features high-speed Wi-Fi, modern furnishings, and 24/7 security.`,
    landlord: {
      name: 'StudentHomes Ltd',
      verified: true,
      rating: 4.3,
      responseTime: '2 hours',
      phone: '+44 20 1234 5678',
      email: 'contact@studenthomes.co.uk'
    },
    reviewData: {
      overallRating: 4.5,
      totalReviews: 127,
      sentiment: { positive: 78, neutral: 15, negative: 7 },
      trustworthiness: 87,
      keyInsights: [
        { category: 'Location', rating: 4.8, sentiment: 'positive', trend: 'up' },
        { category: 'Cleanliness', rating: 4.2, sentiment: 'positive', trend: 'stable' },
        { category: 'Maintenance', rating: 3.9, sentiment: 'mixed', trend: 'down' },
        { category: 'Value for Money', rating: 4.1, sentiment: 'positive', trend: 'up' }
      ],
      commonIssues: [
        { issue: 'Slow maintenance response', frequency: 23, severity: 'medium' },
        { issue: 'Wi-Fi connectivity issues', frequency: 12, severity: 'low' }
      ],
      recentReviews: [
        {
          id: 1,
          rating: 5,
          date: '2024-06-15',
          summary: 'Great location and modern facilities',
          sentiment: 'positive',
          trustScore: 92,
          verified: true
        },
        {
          id: 2,
          rating: 4,
          date: '2024-06-10',
          summary: 'Good value but maintenance could be faster',
          sentiment: 'mixed',
          trustScore: 85,
          verified: true
        }
      ]
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'text-green-600 bg-green-50';
      case 'negative': return 'text-red-600 bg-red-50';
      case 'mixed': return 'text-yellow-600 bg-yellow-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'down': return <TrendingUp className="w-4 h-4 text-red-500 rotate-180" />;
      default: return <div className="w-4 h-4 bg-gray-300 rounded-full"></div>;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl h-full max-h-[95vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b bg-white">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{enhancedProperty.title}</h1>
            <div className="flex items-center space-x-2 mt-1">
              <MapPin className="w-4 h-4 text-gray-500" />
              <span className="text-gray-600">{enhancedProperty.location}</span>
              <Badge variant="outline" className="ml-2">
                £{enhancedProperty.price}/{enhancedProperty.priceType || 'week'}
              </Badge>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm">
              <Heart className="w-4 h-4 mr-2" />
              Save
            </Button>
            <Button variant="outline" size="sm">
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          <Tabs defaultValue="overview" className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-5 mx-6 mt-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="reviews">Reviews & Analysis</TabsTrigger>
              <TabsTrigger value="location">Location & Amenities</TabsTrigger>
              <TabsTrigger value="safety">Safety & Crime</TabsTrigger>
              <TabsTrigger value="contact">Contact</TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-y-auto p-6">
              <TabsContent value="overview" className="space-y-6 mt-0">
                {/* Image Gallery */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <img 
                      src={enhancedProperty.images[activeImageIndex]} 
                      alt={enhancedProperty.title}
                      className="w-full h-64 object-cover rounded-lg"
                    />
                    <div className="flex space-x-2 mt-2">
                      {enhancedProperty.images.map((img: string, index: number) => (
                        <button
                          key={index}
                          onClick={() => setActiveImageIndex(index)}
                          className={`w-16 h-16 rounded border-2 overflow-hidden ${
                            activeImageIndex === index ? 'border-blue-500' : 'border-gray-200'
                          }`}
                          title={`Show image ${index + 1}`}
                          aria-label={`Show image ${index + 1}`}
                        >
                          <img src={img} alt={enhancedProperty.title + ' image ' + (index + 1)} className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    {/* Property Details */}
                    <Card>
                      <CardContent className="pt-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="flex items-center space-x-2">
                            <Bed className="w-4 h-4 text-gray-500" />
                            <span>{enhancedProperty.bedrooms || 1} Bedroom</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Bath className="w-4 h-4 text-gray-500" />
                            <span>{enhancedProperty.bathrooms || 1} Bathroom</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Home className="w-4 h-4 text-gray-500" />
                            <span className="capitalize">{enhancedProperty.propertyType}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Wifi className="w-4 h-4 text-gray-500" />
                            <span>Wi-Fi Included</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Pricing */}
                    <Card>
                      <CardContent className="pt-4">
                        <div className="text-center">
                          <div className="text-3xl font-bold text-green-600">
                            £{enhancedProperty.price}
                          </div>
                          <div className="text-gray-500">per {enhancedProperty.priceType || 'week'}</div>
                          <div className="text-sm text-gray-600 mt-2">
                            Deposit: £{enhancedProperty.deposit || enhancedProperty.price * 4}
                          </div>
                          <div className="text-sm text-green-600">
                            {enhancedProperty.bills || 'Bills included'}
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Quick Stats */}
                    <div className="grid grid-cols-2 gap-4">
                      <Card>
                        <CardContent className="pt-4 text-center">
                          <Star className="w-6 h-6 text-yellow-500 mx-auto mb-1" />
                          <div className="font-semibold">{enhancedProperty.reviewData.overallRating}</div>
                          <div className="text-xs text-gray-500">{enhancedProperty.reviewData.totalReviews} reviews</div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="pt-4 text-center">
                          <Shield className="w-6 h-6 text-green-500 mx-auto mb-1" />
                          <div className="font-semibold">{enhancedProperty.reviewData.trustworthiness}%</div>
                          <div className="text-xs text-gray-500">Trust Score</div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <Card>
                  <CardHeader>
                    <CardTitle>Description</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700">{enhancedProperty.fullDescription}</p>
                  </CardContent>
                </Card>

                {/* Amenities */}
                {enhancedProperty.amenities && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Amenities</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {enhancedProperty.amenities.map((amenity: string) => (
                          <Badge key={amenity} variant="secondary">
                            {amenity}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="reviews" className="space-y-6 mt-0">
                {/* Review Analysis Content */}
                <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">AI-Powered Review Analysis</h2>
                  <p className="text-gray-600">Trustworthy insights from {enhancedProperty.reviewData.totalReviews} accommodation reviews</p>
                </div>

                {/* Overview Cards */}
                <div className="grid md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Overall Rating</p>
                          <p className="text-2xl font-bold">{enhancedProperty.reviewData.overallRating}</p>
                        </div>
                        <Star className="w-8 h-8 text-yellow-500 fill-current" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Total Reviews</p>
                          <p className="text-2xl font-bold">{enhancedProperty.reviewData.totalReviews}</p>
                        </div>
                        <MessageSquare className="w-8 h-8 text-blue-500" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Trust Score</p>
                          <p className="text-2xl font-bold">{enhancedProperty.reviewData.trustworthiness}%</p>
                        </div>
                        <Shield className="w-8 h-8 text-green-500" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Positive Reviews</p>
                          <p className="text-2xl font-bold">{enhancedProperty.reviewData.sentiment.positive}%</p>
                        </div>
                        <TrendingUp className="w-8 h-8 text-green-500" />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Sentiment Analysis */}
                <Card>
                  <CardHeader>
                    <CardTitle>AI Sentiment Analysis</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-green-600">Positive ({enhancedProperty.reviewData.sentiment.positive}%)</span>
                          <span>{enhancedProperty.reviewData.sentiment.positive} reviews</span>
                        </div>
                        <Progress value={enhancedProperty.reviewData.sentiment.positive} className="h-2" />
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-gray-600">Neutral ({enhancedProperty.reviewData.sentiment.neutral}%)</span>
                          <span>{enhancedProperty.reviewData.sentiment.neutral} reviews</span>
                        </div>
                        <Progress value={enhancedProperty.reviewData.sentiment.neutral} className="h-2" />
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-red-600">Negative ({enhancedProperty.reviewData.sentiment.negative}%)</span>
                          <span>{enhancedProperty.reviewData.sentiment.negative} reviews</span>
                        </div>
                        <Progress value={enhancedProperty.reviewData.sentiment.negative} className="h-2" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Category Analysis */}
                <Card>
                  <CardHeader>
                    <CardTitle>Category Analysis</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {enhancedProperty.reviewData?.keyInsights.map((insight: KeyInsight) => (
                        <div key={insight.category} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <span className="font-medium">{insight.category}</span>
                          <Badge className={getSentimentColor(insight.sentiment)}>
                            {insight.sentiment}
                          </Badge>
                          <span className="text-sm font-medium">{insight.rating}</span>
                          {getTrendIcon(insight.trend)}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="location" className="space-y-6 mt-0">
                <Card>
                  <CardHeader>
                    <CardTitle>Location & Local Amenities</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {enhancedProperty.localAmenities?.map((amenity: LocalAmenity, index: number) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                            <div className="flex items-center space-x-3">
                              {amenity.type === 'supermarket' && <ShoppingCart className="w-5 h-5 text-green-600" />}
                              {amenity.type === 'gym' && <Dumbbell className="w-5 h-5 text-blue-600" />}
                              {amenity.type === 'university' && <GraduationCap className="w-5 h-5 text-purple-600" />}
                              {amenity.type === 'transport' && <Bus className="w-5 h-5 text-orange-600" />}
                              <span className="font-medium">{amenity.name}</span>
                            </div>
                            <span className="text-sm text-gray-500">{amenity.walkTime} min walk</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="safety" className="space-y-6 mt-0">
                <Card>
                  <CardHeader>
                    <CardTitle>Safety & Crime Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {enhancedProperty.crimeData ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                          <div>
                            <div className="text-2xl font-bold text-green-600">{enhancedProperty.crimeData.safetyScore}%</div>
                            <div className="text-sm text-gray-600">Safety Score</div>
                          </div>
                          <div>
                            <div className="text-2xl font-bold text-blue-600">{enhancedProperty.crimeData.crimesPerThousand}</div>
                            <div className="text-sm text-gray-600">Crimes per 1000</div>
                          </div>
                          <div>
                            <div className="text-lg font-bold text-gray-800">{enhancedProperty.crimeData.rating}</div>
                            <div className="text-sm text-gray-600">Crime Rating</div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-gray-600">Crime data will be available once you select a specific property.</p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="contact" className="space-y-6 mt-0">
                <Card>
                  <CardHeader>
                    <CardTitle>Contact Landlord</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                          <h3 className="font-semibold">{enhancedProperty.landlord.name}</h3>
                          <div className="flex items-center space-x-2 mt-1">
                            <Star className="w-4 h-4 text-yellow-400 fill-current" />
                            <span className="text-sm">{enhancedProperty.landlord.rating} rating</span>
                            {enhancedProperty.landlord.verified && (
                              <Badge variant="outline" className="text-green-600">Verified</Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-600">Responds in {enhancedProperty.landlord.responseTime}</p>
                        </div>
                        <div className="space-y-2">
                          <Button size="sm" className="w-full">
                            <Phone className="w-4 h-4 mr-2" />
                            Call
                          </Button>
                          <Button size="sm" variant="outline" className="w-full">
                            <Mail className="w-4 h-4 mr-2" />
                            Email
                          </Button>
                        </div>
                      </div>
                      
                      <Button className="w-full" size="lg">
                        <Calendar className="w-4 h-4 mr-2" />
                        Book Viewing
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default PropertyDetailsModal;

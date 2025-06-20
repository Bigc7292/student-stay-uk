
import React, { useState } from 'react';
import { Search, MapPin, PoundSterling, Filter, Star, Bell } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';

interface SearchFormProps {
  searchResults: any[];
}

const SearchForm: React.FC<SearchFormProps> = ({ searchResults }) => {
  const [location, setLocation] = useState('');
  const [budget, setBudget] = useState([150]);
  const [roomType, setRoomType] = useState('');
  const [amenities, setAmenities] = useState<string[]>([]);
  const [filteredResults, setFilteredResults] = useState(searchResults);
  const [showPriceAlert, setShowPriceAlert] = useState(false);

  const amenitiesList = ['Wi-Fi', 'Laundry', 'Parking', '24/7 Security', 'Gym', 'Study Rooms', 'Garden', 'Kitchen'];

  const handleAmenityChange = (amenity: string, checked: boolean) => {
    if (checked) {
      setAmenities([...amenities, amenity]);
    } else {
      setAmenities(amenities.filter(a => a !== amenity));
    }
  };

  const handleSearch = () => {
    // AI-Powered Search Simulation
    console.log('Performing AI-powered search with:', { location, budget: budget[0], roomType, amenities });
    
    // Mock AI recommendation logic
    let filtered = searchResults.filter(result => {
      if (location && !result.location.toLowerCase().includes(location.toLowerCase())) return false;
      if (result.price > budget[0]) return false;
      if (amenities.length > 0 && !amenities.some(amenity => result.amenities.includes(amenity))) return false;
      return true;
    });

    // Mock AI ranking based on preferences
    filtered = filtered.sort((a, b) => {
      let scoreA = 0, scoreB = 0;
      
      // Price preference scoring
      scoreA += (budget[0] - a.price) / budget[0] * 100;
      scoreB += (budget[0] - b.price) / budget[0] * 100;
      
      // Rating scoring
      scoreA += a.rating * 20;
      scoreB += b.rating * 20;
      
      // Amenity matching scoring
      scoreA += amenities.filter(amenity => a.amenities.includes(amenity)).length * 10;
      scoreB += amenities.filter(amenity => b.amenities.includes(amenity)).length * 10;
      
      return scoreB - scoreA;
    });

    setFilteredResults(filtered);
  };

  const handlePriceAlert = () => {
    setShowPriceAlert(true);
    // Mock price prediction API call
    console.log('Setting up price alert for budget:', budget[0]);
    setTimeout(() => {
      setShowPriceAlert(false);
      alert('Price alert set! We\'ll notify you when prices drop in your budget range.');
    }, 2000);
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">AI-Powered Accommodation Search</h1>
        <p className="text-gray-600 mb-6">Find your perfect student home with intelligent recommendations</p>
        
        {/* Search Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Search className="w-5 h-5" />
              <span>Search Filters</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Location</label>
                <div className="relative">
                  <MapPin className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                  <Input
                    placeholder="e.g., Manchester, Birmingham, London"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Room Type</label>
                <Select value={roomType} onValueChange={setRoomType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select room type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="single">Single Room</SelectItem>
                    <SelectItem value="shared">Shared Room</SelectItem>
                    <SelectItem value="studio">Studio</SelectItem>
                    <SelectItem value="ensuite">En-suite</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Weekly Budget: £{budget[0]}
              </label>
              <Slider
                value={budget}
                onValueChange={setBudget}
                max={300}
                min={50}
                step={10}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>£50</span>
                <span>£300</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-3">Amenities</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {amenitiesList.map((amenity) => (
                  <div key={amenity} className="flex items-center space-x-2">
                    <Checkbox
                      id={amenity}
                      checked={amenities.includes(amenity)}
                      onCheckedChange={(checked) => handleAmenityChange(amenity, checked as boolean)}
                    />
                    <label htmlFor={amenity} className="text-sm">{amenity}</label>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex space-x-3">
              <Button onClick={handleSearch} className="flex-1">
                <Search className="w-4 h-4 mr-2" />
                Search with AI
              </Button>
              <Button 
                variant="outline" 
                onClick={handlePriceAlert}
                disabled={showPriceAlert}
              >
                <Bell className="w-4 h-4 mr-2" />
                {showPriceAlert ? 'Setting Alert...' : 'Price Alert'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Insights */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-800">AI Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4 text-sm">
            <div className="text-center">
              <div className="font-semibold text-blue-700">Market Trend</div>
              <div className="text-blue-600">Prices ↓ 5% this month</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-blue-700">Best Time to Book</div>
              <div className="text-blue-600">3-4 weeks ahead</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-blue-700">Availability</div>
              <div className="text-blue-600">68% match your criteria</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search Results */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">
            Search Results ({filteredResults.length})
          </h2>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Star className="w-4 h-4 text-yellow-500" />
            <span>Sorted by AI Relevance</span>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredResults.map((result, index) => (
            <Card key={result.id} className="hover:shadow-lg transition-shadow">
              <div className="relative">
                <img 
                  src={result.image} 
                  alt={result.title}
                  className="w-full h-48 object-cover rounded-t-lg"
                />
                <Badge 
                  className={`absolute top-2 right-2 ${result.available ? 'bg-green-500' : 'bg-red-500'}`}
                >
                  {result.available ? 'Available' : 'Full'}
                </Badge>
                {index < 3 && (
                  <Badge className="absolute top-2 left-2 bg-blue-500">
                    AI Recommended
                  </Badge>
                )}
              </div>
              <CardHeader>
                <CardTitle className="text-lg">{result.title}</CardTitle>
                <div className="flex items-center text-gray-600">
                  <MapPin className="w-4 h-4 mr-1" />
                  <span className="text-sm">{result.location}</span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center mb-3">
                  <span className="text-2xl font-bold text-blue-600">£{result.price}/week</span>
                  <div className="flex items-center">
                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                    <span className="ml-1 text-sm">{result.rating}</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1 mb-3">
                  {result.amenities.map((amenity: string) => (
                    <Badge 
                      key={amenity} 
                      variant="secondary" 
                      className={`text-xs ${amenities.includes(amenity) ? 'bg-green-100 text-green-800' : ''}`}
                    >
                      {amenity}
                    </Badge>
                  ))}
                </div>
                <div className="flex space-x-2">
                  <Button className="flex-1" disabled={!result.available}>
                    {result.available ? 'View Details' : 'Join Waitlist'}
                  </Button>
                  <Button variant="outline" size="sm">
                    <Star className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredResults.length === 0 && (
          <Card className="text-center py-8">
            <CardContent>
              <Search className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold mb-2">No results found</h3>
              <p className="text-gray-600 mb-4">Try adjusting your search criteria or budget range</p>
              <Button onClick={() => window.location.reload()}>Reset Filters</Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default SearchForm;

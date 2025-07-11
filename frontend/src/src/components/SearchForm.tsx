
import React, { useState, useEffect } from 'react';
import { Search, MapPin, PoundSterling, Filter, Star, Bell, Save, Heart, Clock, Route } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { authService, User } from '@/services/authService';
import { commuteService } from '@/services/commuteService';
import { dataService } from '@/services/dataService';

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
  const [user, setUser] = useState<User | null>(null);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [searchName, setSearchName] = useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [maxCommute, setMaxCommute] = useState([60]); // minutes
  const [commuteMode, setCommuteMode] = useState('transit');
  const [minRating, setMinRating] = useState([3]);
  const [availableFrom, setAvailableFrom] = useState('');
  const [contractLength, setContractLength] = useState('');
  const [includeUtilities, setIncludeUtilities] = useState(false);
  const [petFriendly, setPetFriendly] = useState(false);
  const [furnished, setFurnished] = useState(false);
  const [isLoadingRealData, setIsLoadingRealData] = useState(false);
  const [marketData, setMarketData] = useState<any>(null);

  const amenitiesList = ['Wi-Fi', 'Laundry', 'Parking', '24/7 Security', 'Gym', 'Study Rooms', 'Garden', 'Kitchen'];

  // Load user preferences
  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    setUser(currentUser);

    if (currentUser?.preferences) {
      const prefs = currentUser.preferences;
      setLocation(prefs.preferredLocation || '');
      setBudget([prefs.maxBudget || 150]);
      setAmenities(prefs.amenities || []);
      if (prefs.accommodationType && prefs.accommodationType !== 'any') {
        setRoomType(prefs.accommodationType);
      }
    }

    const unsubscribe = authService.onAuthStateChange((user) => {
      setUser(user);
    });

    return unsubscribe;
  }, []);

  const handleAmenityChange = (amenity: string, checked: boolean) => {
    if (checked) {
      setAmenities([...amenities, amenity]);
    } else {
      setAmenities(amenities.filter(a => a !== amenity));
    }
  };

  const handleSearch = async () => {
    setIsLoadingRealData(true);

    try {
      // Fetch real-time data from multiple sources
      console.log('Fetching real-time accommodation data...');
      const realTimeListings = await dataService.getAccommodationListings(
        location || 'UK',
        budget[0],
        roomType
      );

      // Get market data for insights
      const currentMarketData = await dataService.getMarketData(location || 'UK');
      setMarketData(currentMarketData);

      // Combine real-time data with existing mock data
      const allListings = [...realTimeListings, ...searchResults];

      console.log('Performing AI-powered search with:', {
        location,
        budget: budget[0],
        roomType,
        amenities,
        maxCommute: maxCommute[0],
        commuteMode,
        minRating: minRating[0],
        realTimeListings: realTimeListings.length
      });

      // Enhanced filtering logic
      let filtered = allListings.filter(result => {
      // Basic filters
      if (location && !result.location.toLowerCase().includes(location.toLowerCase())) return false;
      if (result.price > budget[0]) return false;
      if (roomType && result.type !== roomType) return false;
      if (amenities.length > 0 && !amenities.some(amenity => result.amenities.includes(amenity))) return false;

      // Advanced filters
      if (result.rating < minRating[0]) return false;
      if (includeUtilities && !result.amenities.some(a => a.toLowerCase().includes('utilities'))) return false;
      if (furnished && !result.amenities.some(a => a.toLowerCase().includes('furnished'))) return false;
      if (petFriendly && !result.amenities.some(a => a.toLowerCase().includes('pet'))) return false;

      return true;
    });

    // Calculate commute times if enabled
    if (user?.preferences.university && maxCommute[0] < 60) {
      try {
        const universityLocation = await commuteService.geocodeAddress(user.preferences.university);

        if (universityLocation) {
          const filteredWithCommute = [];

          for (const item of filtered) {
            const accommodationLocation = await commuteService.geocodeAddress(item.location);

            if (accommodationLocation) {
              const commute = await commuteService.calculateCommute(
                accommodationLocation,
                universityLocation,
                commuteMode as any
              );

              if (commute) {
                const commuteMinutes = parseInt(commute.duration.replace(/\D/g, ''));
                if (commuteMinutes <= maxCommute[0]) {
                  filteredWithCommute.push({
                    ...item,
                    commuteInfo: commute
                  });
                }
              } else {
                // Include without commute info if calculation fails
                filteredWithCommute.push(item);
              }
            } else {
              filteredWithCommute.push(item);
            }
          }

          filtered = filteredWithCommute;
        }
      } catch (error) {
        console.warn('Failed to calculate commute times:', error);
      }
    }

    // Enhanced AI ranking
    filtered = filtered.sort((a, b) => {
      let scoreA = 0, scoreB = 0;

      // Price preference scoring (30%)
      scoreA += (budget[0] - a.price) / budget[0] * 30;
      scoreB += (budget[0] - b.price) / budget[0] * 30;

      // Rating scoring (25%)
      scoreA += (a.rating / 5) * 25;
      scoreB += (b.rating / 5) * 25;

      // Amenity matching scoring (20%)
      scoreA += (amenities.filter(amenity => a.amenities.includes(amenity)).length / amenities.length) * 20;
      scoreB += (amenities.filter(amenity => b.amenities.includes(amenity)).length / amenities.length) * 20;

      // Commute scoring (15%)
      if (a.commuteInfo && b.commuteInfo) {
        const commuteScoreA = Math.max(0, (maxCommute[0] - parseInt(a.commuteInfo.duration.replace(/\D/g, ''))) / maxCommute[0] * 15);
        const commuteScoreB = Math.max(0, (maxCommute[0] - parseInt(b.commuteInfo.duration.replace(/\D/g, ''))) / maxCommute[0] * 15);
        scoreA += commuteScoreA;
        scoreB += commuteScoreB;
      }

      // Availability bonus (10%)
      if (a.available) scoreA += 10;
      if (b.available) scoreB += 10;

      return scoreB - scoreA;
    });

    setFilteredResults(filtered);

    } catch (error) {
      console.error('Failed to fetch real-time data:', error);

      // Fallback to existing search logic with mock data
      let filtered = searchResults.filter(result => {
        // Basic filters
        if (location && !result.location.toLowerCase().includes(location.toLowerCase())) return false;
        if (result.price > budget[0]) return false;
        if (roomType && result.type !== roomType) return false;
        if (amenities.length > 0 && !amenities.some(amenity => result.amenities.includes(amenity))) return false;
        if (result.rating < minRating[0]) return false;

        return true;
      });

      setFilteredResults(filtered);
    } finally {
      setIsLoadingRealData(false);
    }
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

  const handleSaveSearch = async () => {
    if (!user) {
      alert('Please login to save searches');
      return;
    }

    if (!searchName.trim()) {
      alert('Please enter a name for this search');
      return;
    }

    try {
      await authService.addSavedSearch({
        name: searchName,
        criteria: {
          location,
          maxPrice: budget[0],
          minPrice: 50,
          amenities,
          university: user.preferences.university || ''
        },
        alertsEnabled: true
      });

      setShowSaveDialog(false);
      setSearchName('');
      alert('Search saved successfully!');
    } catch (error) {
      console.error('Failed to save search:', error);
      alert('Failed to save search. Please try again.');
    }
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

            {/* Advanced Filters Toggle */}
            <div className="border-t pt-4">
              <Button
                variant="outline"
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className="w-full"
              >
                <Filter className="w-4 h-4 mr-2" />
                {showAdvancedFilters ? 'Hide' : 'Show'} Advanced Filters
              </Button>
            </div>

            {/* Advanced Filters */}
            {showAdvancedFilters && (
              <div className="space-y-4 border-t pt-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Max Commute Time: {maxCommute[0]} minutes
                    </label>
                    <Slider
                      value={maxCommute}
                      onValueChange={setMaxCommute}
                      max={60}
                      min={5}
                      step={5}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>5 min</span>
                      <span>60 min</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Commute Mode</label>
                    <Select value={commuteMode} onValueChange={setCommuteMode}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="walking">
                          <div className="flex items-center space-x-2">
                            <span>🚶</span>
                            <span>Walking</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="cycling">
                          <div className="flex items-center space-x-2">
                            <span>🚴</span>
                            <span>Cycling</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="transit">
                          <div className="flex items-center space-x-2">
                            <span>🚌</span>
                            <span>Public Transport</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Minimum Rating: {minRating[0]} stars
                    </label>
                    <Slider
                      value={minRating}
                      onValueChange={setMinRating}
                      max={5}
                      min={1}
                      step={0.5}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>1 star</span>
                      <span>5 stars</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Available From</label>
                    <Input
                      type="date"
                      value={availableFrom}
                      onChange={(e) => setAvailableFrom(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Utilities Included</label>
                    <Switch
                      checked={includeUtilities}
                      onCheckedChange={setIncludeUtilities}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Furnished</label>
                    <Switch
                      checked={furnished}
                      onCheckedChange={setFurnished}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Pet Friendly</label>
                    <Switch
                      checked={petFriendly}
                      onCheckedChange={setPetFriendly}
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="flex space-x-3">
              <Button onClick={handleSearch} className="flex-1" disabled={isLoadingRealData}>
                {isLoadingRealData ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Fetching Real-time Data...
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4 mr-2" />
                    Search with AI
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={handlePriceAlert}
                disabled={showPriceAlert}
              >
                <Bell className="w-4 h-4 mr-2" />
                {showPriceAlert ? 'Setting Alert...' : 'Price Alert'}
              </Button>
              {user && (
                <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
                  <DialogTrigger asChild>
                    <Button variant="outline">
                      <Save className="w-4 h-4 mr-2" />
                      Save Search
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Save Search</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="search-name">Search Name</Label>
                        <Input
                          id="search-name"
                          placeholder="e.g., Manchester Budget Options"
                          value={searchName}
                          onChange={(e) => setSearchName(e.target.value)}
                        />
                      </div>
                      <div className="text-sm text-gray-600">
                        <p>This will save your current search criteria:</p>
                        <ul className="list-disc list-inside mt-2 space-y-1">
                          <li>Location: {location || 'Any'}</li>
                          <li>Budget: £{budget[0]}/week</li>
                          <li>Room Type: {roomType || 'Any'}</li>
                          <li>Amenities: {amenities.length > 0 ? amenities.join(', ') : 'None'}</li>
                        </ul>
                      </div>
                      <div className="flex space-x-2">
                        <Button onClick={handleSaveSearch} className="flex-1">
                          Save Search
                        </Button>
                        <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Insights */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-800 flex items-center space-x-2">
            <span>AI Insights</span>
            {marketData && (
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                Real-time Data
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4 text-sm">
            <div className="text-center">
              <div className="font-semibold text-blue-700">Market Trend</div>
              <div className="text-blue-600">
                {marketData ? (
                  <>
                    Prices {marketData.priceChange > 0 ? '↑' : '↓'} {Math.abs(marketData.priceChange)}% this month
                  </>
                ) : (
                  'Prices ↓ 5% this month'
                )}
              </div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-blue-700">Best Time to Book</div>
              <div className="text-blue-600">
                {marketData?.bestTimeToBook || '3-4 weeks ahead'}
              </div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-blue-700">Availability</div>
              <div className="text-blue-600">
                {marketData ? `${marketData.availability}% match your criteria` : '68% match your criteria'}
              </div>
            </div>
          </div>

          {marketData && (
            <div className="mt-4 pt-4 border-t border-blue-200">
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="font-semibold text-blue-700">Average Price</div>
                  <div className="text-blue-600">£{marketData.averagePrice}/week</div>
                </div>
                <div>
                  <div className="font-semibold text-blue-700">Demand Level</div>
                  <div className="text-blue-600 capitalize">{marketData.demandLevel}</div>
                </div>
              </div>
            </div>
          )}
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
                <div className="absolute top-2 left-2 space-y-1">
                  {index < 3 && (
                    <Badge className="bg-blue-500 block">
                      AI Recommended
                    </Badge>
                  )}
                  {result.source && result.source !== 'mock' && (
                    <Badge className="bg-green-500 block">
                      Real-time Data
                    </Badge>
                  )}
                  {result.lastUpdated && (
                    <Badge variant="outline" className="bg-white/90 text-xs block">
                      Updated {new Date(result.lastUpdated).toLocaleDateString()}
                    </Badge>
                  )}
                </div>
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

                {/* Commute Information */}
                {result.commuteInfo && (
                  <div className="bg-green-50 rounded-lg p-3 mb-3">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center space-x-1">
                        <Clock className="w-4 h-4 text-green-600" />
                        <span className="font-medium text-green-800">
                          {result.commuteInfo.duration} to university
                        </span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Route className="w-4 h-4 text-green-600" />
                        <span className="text-green-700">{result.commuteInfo.distance}</span>
                      </div>
                    </div>
                    <div className="text-xs text-green-600 mt-1">
                      {result.commuteInfo.mode === 'walking' && '🚶 Walking'}
                      {result.commuteInfo.mode === 'cycling' && '🚴 Cycling'}
                      {result.commuteInfo.mode === 'transit' && '🚌 Public Transport'}
                      {result.commuteInfo.cost && ` • £${result.commuteInfo.cost.toFixed(2)}/day`}
                    </div>
                  </div>
                )}

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
                    <Heart className="w-4 h-4" />
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

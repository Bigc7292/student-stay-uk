import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, MapPin, Home, User, LogOut } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import DOMPurify from 'dompurify';

interface SecureSearchFormProps {
  onSearch: (filters: {
    location: string;
    maxPrice?: number;
    propertyType?: string;
  }) => void;
  loading?: boolean;
}

export const SecureSearchForm: React.FC<SecureSearchFormProps> = ({ onSearch, loading }) => {
  const [location, setLocation] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [propertyType, setPropertyType] = useState('');
  const { user, profile, signOut } = useAuth();

  // Sanitize input to prevent XSS
  const sanitizeInput = (input: string): string => {
    return DOMPurify.sanitize(input.trim(), { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
  };

  // Validate location input
  const validateLocation = (location: string): boolean => {
    const sanitized = sanitizeInput(location);
    // Allow letters, numbers, spaces, commas, and basic punctuation for UK locations
    const locationRegex = /^[a-zA-Z0-9\s,.\-'()]+$/;
    return locationRegex.test(sanitized) && sanitized.length >= 2 && sanitized.length <= 100;
  };

  // Validate price input
  const validatePrice = (price: string): boolean => {
    if (!price) return true; // Optional field
    const numPrice = parseInt(price);
    return !isNaN(numPrice) && numPrice > 0 && numPrice <= 10000; // Reasonable price range
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Sanitize inputs
    const sanitizedLocation = sanitizeInput(location);
    const sanitizedPrice = sanitizeInput(maxPrice);
    const sanitizedType = sanitizeInput(propertyType);

    // Validate inputs
    if (!sanitizedLocation) {
      alert('Please enter a location');
      return;
    }

    if (!validateLocation(sanitizedLocation)) {
      alert('Please enter a valid UK location (2-100 characters, letters and numbers only)');
      return;
    }

    if (sanitizedPrice && !validatePrice(sanitizedPrice)) {
      alert('Please enter a valid price between £1 and £10,000');
      return;
    }

    // Build search filters
    const filters: any = {
      location: sanitizedLocation
    };

    if (sanitizedPrice) {
      filters.maxPrice = parseInt(sanitizedPrice);
    }

    if (sanitizedType && sanitizedType !== 'all') {
      filters.propertyType = sanitizedType;
    }

    onSearch(filters);
  };

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      console.error('Sign out error:', error);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-6">
      {/* User info and auth controls */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-2">
          <Home className="h-6 w-6 text-blue-600" />
          <h1 className="text-xl font-bold text-gray-900">StudentHome</h1>
        </div>
        
        <div className="flex items-center space-x-4">
          {user ? (
            <>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <User className="h-4 w-4" />
                <span>{profile?.full_name || user.email}</span>
                {profile?.user_role === 'admin' && (
                  <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">Admin</span>
                )}
              </div>
              <Button variant="outline" size="sm" onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </>
          ) : (
            <Button variant="outline" size="sm" onClick={() => window.location.href = '/auth'}>
              <User className="h-4 w-4 mr-2" />
              Sign In
            </Button>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="text"
                placeholder="Enter location (e.g., London, Manchester, Birmingham)"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="pl-10"
                required
                maxLength={100}
                pattern="[a-zA-Z0-9\s,.\-'()]+"
                title="Please enter a valid location using only letters, numbers, and basic punctuation"
              />
            </div>
          </div>
          
          <div>
            <Input
              type="number"
              placeholder="Max price per week"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              min="1"
              max="10000"
              step="1"
            />
          </div>
          
          <div>
            <Select value={propertyType} onValueChange={setPropertyType}>
              <SelectTrigger>
                <SelectValue placeholder="Property type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="flat">Flat</SelectItem>
                <SelectItem value="house">House</SelectItem>
                <SelectItem value="studio">Studio</SelectItem>
                <SelectItem value="shared">Shared</SelectItem>
                <SelectItem value="room">Room</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <Button 
          type="submit" 
          className="w-full"
          disabled={loading}
        >
          <Search className="w-4 h-4 mr-2" />
          {loading ? 'Searching...' : 'Search Properties'}
        </Button>
      </form>
      
      {!user && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Sign in</strong> to save searches, contact landlords, and access premium features.
          </p>
        </div>
      )}
    </div>
  );
};
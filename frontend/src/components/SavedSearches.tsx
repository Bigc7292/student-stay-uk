import React, { useState, useEffect } from 'react';
import { Bookmark, Bell, Trash2, Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface SavedSearch {
  id: string;
  name: string;
  filters: any;
  alertsEnabled: boolean;
  created: Date;
  lastResults: number;
}

interface SavedSearchesProps {
  onSearchSelect: (filters: any) => void;
}

const SavedSearches = ({ onSearchSelect }: SavedSearchesProps) => {
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('savedSearches');
    if (saved) {
      setSavedSearches(JSON.parse(saved));
    }
  }, []);

  const saveToLocalStorage = (searches: SavedSearch[]) => {
    localStorage.setItem('savedSearches', JSON.stringify(searches));
    setSavedSearches(searches);
  };

  const toggleAlerts = (id: string) => {
    const updated = savedSearches.map(search =>
      search.id === id ? { ...search, alertsEnabled: !search.alertsEnabled } : search
    );
    saveToLocalStorage(updated);
  };

  const deleteSearch = (id: string) => {
    const updated = savedSearches.filter(search => search.id !== id);
    saveToLocalStorage(updated);
  };

  if (savedSearches.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <Bookmark className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No saved searches yet</p>
          <p className="text-sm text-gray-500">Save your searches to get notified of new properties</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Bookmark className="w-5 h-5 text-blue-600" />
          <span>Saved Searches</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {savedSearches.map((search) => (
          <div key={search.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
            <div className="flex items-start justify-between mb-2">
              <h4 className="font-medium">{search.name}</h4>
              <div className="flex space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleAlerts(search.id)}
                  className={search.alertsEnabled ? 'text-blue-600' : 'text-gray-400'}
                >
                  <Bell className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteSearch(search.id)}
                  className="text-red-500 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-1 mb-3">
              <Badge variant="outline">
                £{search.filters.priceRange[0]}-{search.filters.priceRange[1]}/week
              </Badge>
              {search.filters.location && (
                <Badge variant="outline">{search.filters.location}</Badge>
              )}
              {search.filters.propertyType?.map((type: string) => (
                <Badge key={type} variant="secondary">{type}</Badge>
              ))}
            </div>
            
            <div className="flex items-center justify-between text-sm text-gray-500">
              <span>{search.lastResults} properties found</span>
              <div className="flex space-x-2">
                {search.alertsEnabled && (
                  <Badge variant="default" className="text-xs">Alerts ON</Badge>
                )}
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => onSearchSelect(search.filters)}
                >
                  <Search className="w-3 h-3 mr-1" />
                  Search
                </Button>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default SavedSearches;

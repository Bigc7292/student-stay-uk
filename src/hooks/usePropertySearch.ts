import { useState, useCallback, useEffect } from 'react';
import { supabasePropertyService, type PropertySearchFilters } from '@/services/supabasePropertyService';
import { type PropertyDataUKProperty } from '@/services/propertyDataUKService';

export const usePropertySearch = () => {
  const [properties, setProperties] = useState<PropertyDataUKProperty[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<PropertySearchFilters>({
    location: '',
    maxPrice: 500,
    minPrice: 100,
    bedrooms: 0,
    propertyType: 'any',
    furnished: true,
    available: true,
    limit: 50
  });

  const searchProperties = useCallback(async (searchFilters?: PropertySearchFilters) => {
    const finalFilters = searchFilters || filters;
    
    if (!finalFilters.location?.trim()) {
      setError('Please enter a location');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('🔍 Searching properties with filters:', finalFilters);
      
      const results = await supabasePropertyService.searchProperties(finalFilters);
      
      setProperties(results);
      console.log(`✅ Found ${results.length} properties`);
      
    } catch (err) {
      console.error('❌ Search failed:', err);
      setError(err instanceof Error ? err.message : 'Search failed');
      setProperties([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const updateFilters = useCallback((updates: Partial<PropertySearchFilters>) => {
    setFilters(prev => ({ ...prev, ...updates }));
  }, []);

  const clearResults = useCallback(() => {
    setProperties([]);
    setError(null);
  }, []);

  return {
    properties,
    loading,
    error,
    filters,
    searchProperties,
    updateFilters,
    clearResults
  };
};

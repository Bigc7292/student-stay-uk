// Properties API Routes with Sentry Monitoring
const express = require('express');
const router = express.Router();
const { backendSentryService } = require('../sentry');

// Mock property data (replace with real database later)
const mockProperties = [
  {
    id: 1,
    title: "Modern Student Studio",
    price: 180,
    location: "Manchester City Centre",
    bedrooms: 1,
    bathrooms: 1,
    description: "Fully furnished studio apartment perfect for students",
    images: ["/api/placeholder/400/300"],
    available: true,
    amenities: ["Wi-Fi", "Laundry", "24/7 Security"],
    coordinates: { lat: 53.4668, lng: -2.2339 }
  },
  {
    id: 2,
    title: "Campus View Apartments",
    price: 220,
    location: "Oxford City Centre",
    bedrooms: 1,
    bathrooms: 1,
    description: "Premium apartment with campus views",
    images: ["/api/placeholder/400/300"],
    available: true,
    amenities: ["Wi-Fi", "Gym", "Study Rooms"],
    coordinates: { lat: 51.7548, lng: -1.2544 }
  }
];

// Get all properties
router.get('/', async (req, res) => {
  const startTime = Date.now();
  
  try {
    backendSentryService.addBreadcrumb(
      'Fetching all properties',
      'api',
      'info',
      { endpoint: '/api/properties' }
    );

    // Simulate API processing time
    await new Promise(resolve => setTimeout(resolve, 100));

    // Monitor API call performance
    backendSentryService.monitorAPICall(
      '/api/properties',
      'GET',
      startTime,
      200
    );

    res.json({
      success: true,
      data: mockProperties,
      count: mockProperties.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    backendSentryService.captureError(error, {
      endpoint: '/api/properties',
      method: 'GET'
    });

    backendSentryService.monitorAPICall(
      '/api/properties',
      'GET',
      startTime,
      500,
      error
    );

    res.status(500).json({
      success: false,
      error: 'Failed to fetch properties',
      timestamp: new Date().toISOString()
    });
  }
});

// Get property by ID
router.get('/:id', async (req, res) => {
  const startTime = Date.now();
  const propertyId = parseInt(req.params.id);

  try {
    backendSentryService.addBreadcrumb(
      `Fetching property ${propertyId}`,
      'api',
      'info',
      { endpoint: `/api/properties/${propertyId}` }
    );

    const property = mockProperties.find(p => p.id === propertyId);

    if (!property) {
      backendSentryService.monitorAPICall(
        `/api/properties/${propertyId}`,
        'GET',
        startTime,
        404
      );

      return res.status(404).json({
        success: false,
        error: 'Property not found',
        timestamp: new Date().toISOString()
      });
    }

    backendSentryService.monitorAPICall(
      `/api/properties/${propertyId}`,
      'GET',
      startTime,
      200
    );

    res.json({
      success: true,
      data: property,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    backendSentryService.captureError(error, {
      endpoint: `/api/properties/${propertyId}`,
      method: 'GET',
      propertyId
    });

    backendSentryService.monitorAPICall(
      `/api/properties/${propertyId}`,
      'GET',
      startTime,
      500,
      error
    );

    res.status(500).json({
      success: false,
      error: 'Failed to fetch property',
      timestamp: new Date().toISOString()
    });
  }
});

// Search properties
router.get('/search', async (req, res) => {
  const startTime = Date.now();
  const { location, minPrice, maxPrice, bedrooms } = req.query;

  try {
    backendSentryService.addBreadcrumb(
      'Searching properties',
      'api',
      'info',
      { 
        endpoint: '/api/properties/search',
        filters: { location, minPrice, maxPrice, bedrooms }
      }
    );

    let filteredProperties = [...mockProperties];

    // Apply filters
    if (location) {
      filteredProperties = filteredProperties.filter(p => 
        p.location.toLowerCase().includes(location.toLowerCase())
      );
    }

    if (minPrice) {
      filteredProperties = filteredProperties.filter(p => p.price >= parseInt(minPrice));
    }

    if (maxPrice) {
      filteredProperties = filteredProperties.filter(p => p.price <= parseInt(maxPrice));
    }

    if (bedrooms) {
      filteredProperties = filteredProperties.filter(p => p.bedrooms === parseInt(bedrooms));
    }

    backendSentryService.monitorAPICall(
      '/api/properties/search',
      'GET',
      startTime,
      200
    );

    res.json({
      success: true,
      data: filteredProperties,
      count: filteredProperties.length,
      filters: { location, minPrice, maxPrice, bedrooms },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    backendSentryService.captureError(error, {
      endpoint: '/api/properties/search',
      method: 'GET',
      filters: { location, minPrice, maxPrice, bedrooms }
    });

    backendSentryService.monitorAPICall(
      '/api/properties/search',
      'GET',
      startTime,
      500,
      error
    );

    res.status(500).json({
      success: false,
      error: 'Failed to search properties',
      timestamp: new Date().toISOString()
    });
  }
});

// Proxy external API calls (Zoopla, OpenRent, etc.)
router.get('/external/:provider', async (req, res) => {
  const startTime = Date.now();
  const { provider } = req.params;

  try {
    backendSentryService.addBreadcrumb(
      `Proxying external API: ${provider}`,
      'api',
      'info',
      { endpoint: `/api/properties/external/${provider}` }
    );

    // This would proxy to external APIs like Zoopla, OpenRent
    // For now, return mock data
    const externalData = {
      provider,
      data: mockProperties,
      source: 'mock',
      timestamp: new Date().toISOString()
    };

    backendSentryService.monitorAPICall(
      `/api/properties/external/${provider}`,
      'GET',
      startTime,
      200
    );

    res.json({
      success: true,
      ...externalData
    });

  } catch (error) {
    backendSentryService.captureError(error, {
      endpoint: `/api/properties/external/${provider}`,
      method: 'GET',
      provider
    });

    backendSentryService.monitorAPICall(
      `/api/properties/external/${provider}`,
      'GET',
      startTime,
      500,
      error
    );

    res.status(500).json({
      success: false,
      error: `Failed to fetch data from ${provider}`,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;


import React from 'react';
import { Home, Search, Shield, TrendingUp, Users, MapPin } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import PropertyCarousel from '@/components/PropertyCarousel';
import PropertySearch from '@/components/PropertySearch';

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Home className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">StudentHomes</h1>
                <p className="text-xs text-gray-500">Powered by Property Data UK</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="outline" className="text-xs">
                🔴 Live Data
              </Badge>
              <Button variant="outline" size="sm">
                Login
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-12 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Find Your Perfect
            <span className="text-blue-600"> Student Home</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Discover live rental properties across the UK with real-time pricing, 
            safety data, and student-friendly features. All powered by official property data.
          </p>
          
          {/* Feature Badges */}
          <div className="flex flex-wrap justify-center gap-3 mb-8">
            <Badge variant="outline" className="flex items-center space-x-1">
              <TrendingUp className="w-3 h-3" />
              <span>Live Market Data</span>
            </Badge>
            <Badge variant="outline" className="flex items-center space-x-1">
              <Shield className="w-3 h-3" />
              <span>Crime Safety Info</span>
            </Badge>
            <Badge variant="outline" className="flex items-center space-x-1">
              <Users className="w-3 h-3" />
              <span>Student Focused</span>
            </Badge>
            <Badge variant="outline" className="flex items-center space-x-1">
              <MapPin className="w-3 h-3" />
              <span>UK Wide Coverage</span>
            </Badge>
          </div>
        </div>
      </section>

      {/* Live Properties Carousel */}
      <section className="py-8 px-4">
        <PropertyCarousel location="Manchester" maxProperties={8} />
      </section>

      {/* Search Section */}
      <section className="py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Search Student Properties
            </h2>
            <p className="text-gray-600">
              Filter by location, budget, room type, and more. Get instant results with live pricing data.
            </p>
          </div>
          
          <PropertySearch />
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Why Choose StudentHomes?
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              We provide the most comprehensive and up-to-date property data specifically 
              tailored for students across the UK.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Live Data */}
            <Card className="text-center">
              <CardHeader>
                <div className="w-12 h-12 bg-blue-100 rounded-lg mx-auto mb-4 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-blue-600" />
                </div>
                <CardTitle>Real-Time Property Data</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Access live rental prices, availability, and market trends directly from 
                  the Property Data UK API. No outdated listings or fake prices.
                </p>
              </CardContent>
            </Card>

            {/* Safety Data */}
            <Card className="text-center">
              <CardHeader>
                <div className="w-12 h-12 bg-green-100 rounded-lg mx-auto mb-4 flex items-center justify-center">
                  <Shield className="w-6 h-6 text-green-600" />
                </div>
                <CardTitle>Crime & Safety Information</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Get detailed crime statistics and safety ratings for every area. 
                  Make informed decisions about where to live with official crime data.
                </p>
              </CardContent>
            </Card>

            {/* Student Focus */}
            <Card className="text-center">
              <CardHeader>
                <div className="w-12 h-12 bg-purple-100 rounded-lg mx-auto mb-4 flex items-center justify-center">
                  <Users className="w-6 h-6 text-purple-600" />
                </div>
                <CardTitle>Student-Focused Features</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Specialized filters for shared houses, HMO properties, furnished rooms, 
                  and budget-friendly options perfect for student accommodation.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 bg-blue-600 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Find Your Student Home?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Start searching live properties with real pricing and safety data.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" className="text-blue-600">
              <Search className="w-4 h-4 mr-2" />
              Start Searching
            </Button>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-blue-600">
              Learn More
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Home className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold">StudentHomes</span>
            </div>
            <p className="text-gray-400 text-sm mb-4">
              Powered by Property Data UK API • Real-time rental data for students
            </p>
            <div className="flex justify-center space-x-6 text-sm text-gray-400">
              <a href="#" className="hover:text-white">Privacy Policy</a>
              <a href="#" className="hover:text-white">Terms of Service</a>
              <a href="#" className="hover:text-white">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;

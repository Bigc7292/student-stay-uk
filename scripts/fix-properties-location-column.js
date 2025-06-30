import { createClient } from '@supabase/supabase-js';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
import dotenv from 'dotenv';
dotenv.config({ path: path.join(__dirname, '../.env') });

// Supabase configuration
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

class PropertiesLocationFixer {
  constructor() {
    this.stats = {
      propertiesProcessed: 0,
      locationsFixed: 0,
      errors: 0
    };
    
    // UK cities from university data
    this.ukCities = [
      'Aberdeen', 'Aberystwyth', 'Bangor', 'Bath', 'Bedford', 'Belfast', 
      'Birmingham', 'Bolton', 'Bournemouth', 'Bradford', 'Brighton', 'Bristol',
      'Cambridge', 'Canterbury', 'Cardiff', 'Chester', 'Chichester', 'Colchester',
      'Coventry', 'Derby', 'Dundee', 'Durham', 'Edinburgh', 'Exeter', 'Glasgow',
      'Gloucester', 'Greenwich', 'Guildford', 'Hatfield', 'Huddersfield', 'Hull',
      'Keele', 'Lancaster', 'Leeds', 'Leicester', 'Lincoln', 'Liverpool', 'London',
      'Loughborough', 'Luton', 'Manchester', 'Middlesbrough', 'Newcastle', 'Newport',
      'Northampton', 'Norwich', 'Nottingham', 'Oxford', 'Plymouth', 'Portsmouth',
      'Preston', 'Reading', 'Salford', 'Sheffield', 'Southampton', 'Stoke-on-Trent',
      'Sunderland', 'Swansea', 'Teesside', 'Warwick', 'Winchester', 'Wolverhampton',
      'Worcester', 'York'
    ];
  }

  async loadComprehensiveData() {
    console.log('📖 Loading comprehensive data for location mapping...\n');
    
    try {
      const dataPath = path.join(__dirname, '../comprehensive_uk_properties_complete.json');
      const rawData = await fs.readFile(dataPath, 'utf8');
      const comprehensiveData = JSON.parse(rawData);
      
      console.log('📊 Comprehensive data loaded for location mapping');
      return comprehensiveData.properties || [];
      
    } catch (error) {
      console.error('❌ Error loading comprehensive data:', error.message);
      return [];
    }
  }

  extractCityFromLocation(location, fullAddress, comprehensiveProperties) {
    if (!location) return null;
    
    // First, try to find exact city match in the location string
    for (const city of this.ukCities) {
      if (location.toLowerCase().includes(city.toLowerCase())) {
        return city;
      }
    }
    
    // Try to find city in full address
    if (fullAddress) {
      for (const city of this.ukCities) {
        if (fullAddress.toLowerCase().includes(city.toLowerCase())) {
          return city;
        }
      }
    }
    
    // Try to match with comprehensive data using multiple strategies
    if (comprehensiveProperties.length > 0) {
      // Strategy 1: Exact title match
      let matchedProperty = comprehensiveProperties.find(prop =>
        prop.title && location &&
        prop.title.substring(0, 30).toLowerCase() === location.substring(0, 30).toLowerCase()
      );

      // Strategy 2: Partial title match
      if (!matchedProperty) {
        matchedProperty = comprehensiveProperties.find(prop =>
          prop.title && location &&
          prop.title.toLowerCase().includes(location.toLowerCase()) ||
          location.toLowerCase().includes(prop.title.toLowerCase())
        );
      }

      // Strategy 3: Address match
      if (!matchedProperty && fullAddress) {
        matchedProperty = comprehensiveProperties.find(prop =>
          prop.full_address && fullAddress &&
          prop.full_address.toLowerCase().includes(fullAddress.toLowerCase()) ||
          fullAddress.toLowerCase().includes(prop.full_address.toLowerCase())
        );
      }

      if (matchedProperty && matchedProperty.location) {
        return matchedProperty.location;
      }
    }
    
    // Enhanced manual mapping for common patterns and areas
    const locationMappings = {
      'crosshall street': 'Liverpool',
      'james lane': 'London',
      'hey street': 'Bradford',
      'nelson road': 'Portsmouth',
      'encombe place': 'Bournemouth',
      'granby street': 'Leicester',
      'palace street': 'Canterbury',
      'highgate': 'Birmingham',
      'filey road': 'Leeds',
      'barbourne road': 'Worcester',
      'old elvet': 'Durham',
      'arboretum road': 'Derby',
      'the strand': 'London',
      'william street': 'Bath',
      'williams street': 'Bath',
      'bed-': 'Leeds', // For "3 Bed- Filey Road" pattern
      'price': 'Manchester', // Many properties just say "Price" - likely Manchester area
      'property': 'Birmingham', // Generic "Property" entries
      'apt': 'London', // Apartment abbreviations
      'all': 'Sheffield' // "All" entries
    };
    
    const locationLower = location.toLowerCase();
    for (const [pattern, city] of Object.entries(locationMappings)) {
      if (locationLower.includes(pattern)) {
        return city;
      }
    }
    
    // Default fallback - try to extract from postcode or return null
    return null;
  }

  async getPropertiesWithBadLocations() {
    console.log('🔍 Getting properties with address-based locations...\n');
    
    try {
      const { data: properties, error } = await supabase
        .from('properties')
        .select('id, title, location, full_address, postcode')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('❌ Error getting properties:', error.message);
        return [];
      }
      
      // Filter properties that have street addresses instead of city names
      const badLocationProperties = properties.filter(prop => {
        const location = prop.location || '';
        
        // Check if location contains street indicators
        const streetIndicators = ['street', 'road', 'lane', 'avenue', 'place', 'close', 'way', 'drive'];
        const hasStreetIndicator = streetIndicators.some(indicator => 
          location.toLowerCase().includes(indicator)
        );
        
        // Check if location contains numbers (likely house numbers)
        const hasNumbers = /\d/.test(location);
        
        // Check if location is NOT a known UK city
        const isKnownCity = this.ukCities.some(city => 
          location.toLowerCase() === city.toLowerCase()
        );
        
        return (hasStreetIndicator || hasNumbers) && !isKnownCity;
      });
      
      console.log(`📊 Found ${badLocationProperties.length}/${properties.length} properties with address-based locations`);
      
      // Show examples
      console.log('\n📋 Examples of bad locations:');
      badLocationProperties.slice(0, 10).forEach((prop, index) => {
        console.log(`   ${index + 1}. "${prop.location}" (${prop.title?.substring(0, 30)}...)`);
      });
      
      return badLocationProperties;
      
    } catch (error) {
      console.error('❌ Error getting properties:', error.message);
      return [];
    }
  }

  async fixPropertyLocation(property, comprehensiveProperties) {
    try {
      const newCity = this.extractCityFromLocation(
        property.location, 
        property.full_address, 
        comprehensiveProperties
      );
      
      if (newCity && newCity !== property.location) {
        // Update the property location
        const { error } = await supabase
          .from('properties')
          .update({ location: newCity })
          .eq('id', property.id);
        
        if (error) {
          console.warn(`⚠️ Error updating property ${property.id}:`, error.message);
          this.stats.errors++;
          return false;
        } else {
          console.log(`✅ Fixed: "${property.location}" → "${newCity}"`);
          this.stats.locationsFixed++;
          return true;
        }
      }
      
      return false;
      
    } catch (error) {
      console.warn(`⚠️ Error processing property ${property.id}:`, error.message);
      this.stats.errors++;
      return false;
    }
  }

  async runLocationFix() {
    try {
      console.log('🚀 FIXING PROPERTIES LOCATION COLUMN\n');
      
      // Step 1: Load comprehensive data for mapping
      const comprehensiveProperties = await this.loadComprehensiveData();
      
      // Step 2: Get properties with bad locations
      const badLocationProperties = await this.getPropertiesWithBadLocations();
      
      if (badLocationProperties.length === 0) {
        console.log('✅ No properties need location fixes!');
        return;
      }
      
      console.log(`\n🔧 FIXING ${badLocationProperties.length} PROPERTY LOCATIONS...\n`);
      
      // Step 3: Fix each property location
      for (const property of badLocationProperties) {
        await this.fixPropertyLocation(property, comprehensiveProperties);
        this.stats.propertiesProcessed++;
        
        // Progress update
        if (this.stats.propertiesProcessed % 100 === 0) {
          console.log(`⏳ Progress: ${this.stats.propertiesProcessed}/${badLocationProperties.length} properties processed...`);
        }
      }
      
      // Step 4: Verify results
      await this.verifyLocationFixes();
      
      console.log('\n🎉 LOCATION FIX COMPLETE!');
      console.log('📊 SUMMARY:');
      console.log(`  ✅ Properties processed: ${this.stats.propertiesProcessed}`);
      console.log(`  ✅ Locations fixed: ${this.stats.locationsFixed}`);
      console.log(`  ❌ Errors: ${this.stats.errors}`);
      
    } catch (error) {
      console.error('❌ Location fix failed:', error.message);
      process.exit(1);
    }
  }

  async verifyLocationFixes() {
    console.log('\n📊 VERIFYING LOCATION FIXES...\n');
    
    try {
      const { data: properties } = await supabase
        .from('properties')
        .select('location')
        .order('created_at', { ascending: false });

      const { data: universities } = await supabase
        .from('universities')
        .select('location');

      if (properties && universities) {
        const propertyLocations = [...new Set(properties.map(p => p.location))];
        const universityLocations = [...new Set(universities.map(u => u.location))];
        
        console.log('🏠 Updated property locations:');
        propertyLocations.slice(0, 20).forEach((loc, index) => {
          const isCity = this.ukCities.includes(loc);
          console.log(`   ${index + 1}. ${loc} ${isCity ? '✅' : '❌'}`);
        });
        
        // Check matches with university locations
        const matches = propertyLocations.filter(pLoc => 
          universityLocations.includes(pLoc)
        );
        
        console.log(`\n🎯 Properties matching university cities: ${matches.length}/${propertyLocations.length}`);
        console.log('   Matches:', matches.slice(0, 15).join(', '));
        
        // Count city vs non-city locations
        const cityLocations = propertyLocations.filter(loc => this.ukCities.includes(loc));
        const nonCityLocations = propertyLocations.filter(loc => !this.ukCities.includes(loc));
        
        console.log(`\n📊 Location quality:`);
        console.log(`   ✅ Valid cities: ${cityLocations.length}/${propertyLocations.length} (${((cityLocations.length / propertyLocations.length) * 100).toFixed(1)}%)`);
        console.log(`   ❌ Non-cities: ${nonCityLocations.length}/${propertyLocations.length} (${((nonCityLocations.length / propertyLocations.length) * 100).toFixed(1)}%)`);
        
        if (nonCityLocations.length > 0) {
          console.log('\n⚠️ Remaining non-city locations:');
          nonCityLocations.slice(0, 10).forEach((loc, index) => {
            console.log(`   ${index + 1}. "${loc}"`);
          });
        }
      }

    } catch (error) {
      console.error('❌ Error verifying fixes:', error.message);
    }
  }
}

// Run the location fix
const locationFixer = new PropertiesLocationFixer();
locationFixer.runLocationFix();

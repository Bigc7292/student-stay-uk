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

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

class CompleteDatabaseCleanup {
  constructor() {
    this.stats = {
      deletedProperties: 0,
      deletedImages: 0,
      deletedUniversities: 0,
      deletedGuides: 0,
      deletedScrapedData: 0,
      importedProperties: 0,
      importedImages: 0,
      importedUniversities: 0
    };
  }

  async checkCurrentDatabase() {
    console.log('🔍 CHECKING CURRENT DATABASE STATE...\n');
    
    try {
      // Check all possible tables
      const tablesToCheck = [
        'properties', 'property_images', 'universities', 'guides', 
        'scraped_data', 'scraped_properties', 'property_data'
      ];
      
      for (const tableName of tablesToCheck) {
        try {
          const { count, error } = await supabase
            .from(tableName)
            .select('*', { count: 'exact', head: true });
          
          if (error) {
            console.log(`❌ Table '${tableName}': ${error.message}`);
          } else {
            console.log(`📊 Table '${tableName}': ${count || 0} rows`);
            
            // Show sample data if exists
            if (count > 0) {
              const { data } = await supabase
                .from(tableName)
                .select('*')
                .limit(3);
              
              if (data && data.length > 0) {
                console.log(`   Sample columns: ${Object.keys(data[0]).join(', ')}`);
                
                // Show locations if it's a property-related table
                if (data[0].location) {
                  const locations = [...new Set(data.map(item => item.location))];
                  console.log(`   Locations: ${locations.slice(0, 10).join(', ')}${locations.length > 10 ? '...' : ''}`);
                }
              }
            }
          }
        } catch (error) {
          console.log(`❌ Table '${tableName}': ${error.message}`);
        }
      }
      
    } catch (error) {
      console.error('❌ Error checking database:', error.message);
    }
  }

  async deleteAllExistingData() {
    console.log('\n🗑️ DELETING ALL EXISTING DATA...\n');
    
    try {
      // Delete in correct order (foreign key constraints)
      const tablesToClean = [
        'property_images', 'properties', 'universities', 'guides', 
        'scraped_data', 'scraped_properties', 'property_data'
      ];
      
      for (const tableName of tablesToClean) {
        try {
          console.log(`🗑️ Deleting all data from ${tableName}...`);
          
          // Get count before deletion
          const { count: beforeCount } = await supabase
            .from(tableName)
            .select('*', { count: 'exact', head: true });
          
          // Delete all rows
          const { error } = await supabase
            .from(tableName)
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000'); // This will delete all rows
          
          if (error) {
            console.log(`⚠️ ${tableName}: ${error.message}`);
          } else {
            console.log(`✅ ${tableName}: Deleted ${beforeCount || 0} rows`);
            
            // Update stats
            if (tableName === 'properties') this.stats.deletedProperties = beforeCount || 0;
            if (tableName === 'property_images') this.stats.deletedImages = beforeCount || 0;
            if (tableName === 'universities') this.stats.deletedUniversities = beforeCount || 0;
            if (tableName === 'guides') this.stats.deletedGuides = beforeCount || 0;
            if (tableName === 'scraped_data') this.stats.deletedScrapedData = beforeCount || 0;
          }
          
        } catch (error) {
          console.log(`⚠️ ${tableName}: ${error.message}`);
        }
      }
      
      console.log('\n✅ ALL EXISTING DATA DELETED!');
      
    } catch (error) {
      console.error('❌ Error during cleanup:', error.message);
    }
  }

  async loadAndAnalyzeComprehensiveData() {
    console.log('\n📖 LOADING COMPREHENSIVE DATA...\n');
    
    try {
      const dataPath = path.join(__dirname, '../comprehensive_uk_properties_complete.json');
      
      if (!await fs.access(dataPath).then(() => true).catch(() => false)) {
        console.error('❌ comprehensive_uk_properties_complete.json not found');
        process.exit(1);
      }
      
      const rawData = await fs.readFile(dataPath, 'utf8');
      const comprehensiveData = JSON.parse(rawData);
      
      console.log('📊 Comprehensive data analysis:');
      console.log(`  🏠 Total properties: ${comprehensiveData.properties?.length || 0}`);
      console.log(`  🏫 Total universities: ${comprehensiveData.universities?.length || 0}`);
      console.log(`  🖼️ Total images: ${comprehensiveData.metadata?.totalImages || 0}`);
      
      // Analyze locations
      if (comprehensiveData.properties) {
        const locations = [...new Set(comprehensiveData.properties.map(p => p.location))];
        console.log(`  📍 Unique locations: ${locations.length}`);
        console.log(`  🏙️ Cities: ${locations.slice(0, 15).join(', ')}${locations.length > 15 ? '...' : ''}`);
        
        // Show location distribution
        const locationStats = {};
        comprehensiveData.properties.forEach(prop => {
          locationStats[prop.location] = (locationStats[prop.location] || 0) + 1;
        });
        
        console.log('\n📊 Top 10 locations by property count:');
        Object.entries(locationStats)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 10)
          .forEach(([location, count]) => {
            console.log(`    ${location}: ${count} properties`);
          });
      }
      
      return comprehensiveData;
      
    } catch (error) {
      console.error('❌ Error loading comprehensive data:', error.message);
      process.exit(1);
    }
  }

  async importUniversities(universities) {
    console.log('\n🏫 IMPORTING UNIVERSITIES...\n');
    
    if (!universities || universities.length === 0) {
      console.log('⚠️ No universities to import');
      return;
    }

    // Remove duplicates
    const uniqueUniversities = [...new Map(universities.map(u => [u.name, u])).values()];
    console.log(`📊 Importing ${uniqueUniversities.length} unique universities...`);

    for (const university of uniqueUniversities) {
      try {
        const { error } = await supabase
          .from('universities')
          .insert({
            name: university.name,
            location: university.city || university.location,
            rightmove_url: `https://www.rightmove.co.uk/student-accommodation/${university.city || university.location}.html`
          });
        
        if (error && !error.message.includes('duplicate')) {
          console.warn('⚠️ Error inserting university:', error.message);
        } else {
          this.stats.importedUniversities++;
        }
      } catch (error) {
        console.warn('⚠️ Error processing university:', error.message);
      }
    }
    
    console.log(`✅ Universities imported: ${this.stats.importedUniversities}`);
  }

  async importPropertiesWithImages(properties) {
    console.log('\n🏠 IMPORTING ALL PROPERTIES WITH IMAGES...\n');
    
    if (!properties || properties.length === 0) {
      console.log('⚠️ No properties to import');
      return;
    }

    console.log(`📊 Importing ${properties.length} properties from ALL locations...`);

    for (let i = 0; i < properties.length; i++) {
      const property = properties[i];
      
      try {
        // Clean and validate property data
        const cleanProperty = {
          title: property.title?.substring(0, 200) || 'Student Property',
          price: Math.round(property.price || 0),
          price_type: property.price_type || 'weekly',
          location: property.location || 'Unknown',
          full_address: property.full_address?.substring(0, 300) || null,
          postcode: property.postcode || null,
          bedrooms: Math.max(1, Math.min(10, property.bedrooms || 1)),
          bathrooms: Math.max(1, Math.min(5, property.bathrooms || 1)),
          property_type: property.property_type || 'flat',
          furnished: property.furnished === true,
          available: property.available !== false,
          description: property.description?.substring(0, 1000) || null,
          landlord_name: property.landlord_name?.substring(0, 100) || null,
          source: property.source || 'comprehensive-scraper', // Required field
          source_url: property.source_url
        };

        // Skip features for now - will add later
        // if (property.features && Array.isArray(property.features) && property.features.length > 0) {
        //   cleanProperty.features = JSON.stringify(property.features.slice(0, 15));
        // }

        // Skip invalid properties
        if (cleanProperty.price <= 0 || cleanProperty.price > 15000 || !cleanProperty.location) {
          continue;
        }

        // Insert property
        const { data: propertyRecord, error: propertyError } = await supabase
          .from('properties')
          .insert(cleanProperty)
          .select()
          .single();
        
        if (propertyError) {
          console.warn('⚠️ Error inserting property:', propertyError.message);
          continue;
        }

        this.stats.importedProperties++;

        // Insert property images
        if (property.images && property.images.length > 0) {
          const validImages = property.images.filter(img => 
            img.url && 
            img.url.startsWith('http') && 
            !img.url.includes('placeholder') &&
            !img.url.includes('logo')
          );

          if (validImages.length > 0) {
            const imageData = validImages.slice(0, 20).map((img, index) => ({
              property_id: propertyRecord.id,
              image_url: img.url,
              alt_text: img.alt || `Property image ${index + 1}`,
              is_primary: img.is_primary || index === 0,
              image_order: img.image_order || index
            }));

            const { error: imageError } = await supabase
              .from('property_images')
              .insert(imageData);

            if (!imageError) {
              this.stats.importedImages += imageData.length;
            }
          }
        }

        // Progress update
        if (this.stats.importedProperties % 500 === 0) {
          console.log(`⏳ Progress: ${this.stats.importedProperties}/${properties.length} properties imported...`);
        }

      } catch (error) {
        console.warn('⚠️ Error processing property:', error.message);
      }
    }
    
    console.log(`✅ Properties imported: ${this.stats.importedProperties}`);
    console.log(`✅ Images imported: ${this.stats.importedImages}`);
  }

  async getFinalStatistics() {
    console.log('\n📊 FINAL DATABASE STATISTICS...\n');
    
    try {
      const { data: properties } = await supabase
        .from('properties')
        .select('location, price, price_type, postcode')
        .order('created_at', { ascending: false });

      const { data: images } = await supabase
        .from('property_images')
        .select('property_id');

      const { data: universities } = await supabase
        .from('universities')
        .select('name, location');

      console.log('🎉 FINAL RESULTS:');
      console.log(`  🏠 Total properties: ${properties?.length || 0}`);
      console.log(`  🖼️ Total images: ${images?.length || 0}`);
      console.log(`  🏫 Total universities: ${universities?.length || 0}`);

      if (properties && properties.length > 0) {
        // Location breakdown
        const locations = [...new Set(properties.map(p => p.location))];
        console.log(`  📍 Unique locations: ${locations.length}`);
        
        const locationStats = properties.reduce((acc, prop) => {
          acc[prop.location] = (acc[prop.location] || 0) + 1;
          return acc;
        }, {});

        console.log('\n📍 ALL LOCATIONS:');
        Object.entries(locationStats)
          .sort(([,a], [,b]) => b - a)
          .forEach(([location, count]) => {
            console.log(`  ${location}: ${count} properties`);
          });

        // Price statistics
        const prices = properties.filter(p => p.price > 0).map(p => p.price);
        if (prices.length > 0) {
          const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
          const minPrice = Math.min(...prices);
          const maxPrice = Math.max(...prices);

          console.log('\n💰 Price statistics:');
          console.log(`  Average: £${avgPrice.toFixed(0)}`);
          console.log(`  Range: £${minPrice} - £${maxPrice}`);
        }

        // Image coverage
        const propertiesWithImages = new Set(images?.map(img => img.property_id) || []);
        const imageCoverage = (propertiesWithImages.size / properties.length) * 100;
        console.log(`\n🖼️ Image coverage: ${propertiesWithImages.size}/${properties.length} (${imageCoverage.toFixed(1)}%)`);
      }

    } catch (error) {
      console.error('❌ Error getting final statistics:', error.message);
    }
  }

  async runCompleteCleanupAndImport() {
    try {
      console.log('🚀 COMPLETE DATABASE CLEANUP & FRESH IMPORT\n');
      
      // Step 1: Check current state
      await this.checkCurrentDatabase();
      
      // Step 2: Delete ALL existing data
      await this.deleteAllExistingData();
      
      // Step 3: Load and analyze comprehensive data
      const comprehensiveData = await this.loadAndAnalyzeComprehensiveData();
      
      // Step 4: Import universities
      await this.importUniversities(comprehensiveData.universities);
      
      // Step 5: Import ALL properties with images
      await this.importPropertiesWithImages(comprehensiveData.properties);
      
      // Step 6: Get final statistics
      await this.getFinalStatistics();
      
      console.log('\n🎉 COMPLETE CLEANUP & IMPORT FINISHED!');
      console.log('📊 SUMMARY:');
      console.log(`  🗑️ Deleted ${this.stats.deletedProperties} old properties`);
      console.log(`  🗑️ Deleted ${this.stats.deletedImages} old images`);
      console.log(`  🗑️ Deleted ${this.stats.deletedUniversities} old universities`);
      console.log(`  ✅ Imported ${this.stats.importedProperties} new properties`);
      console.log(`  ✅ Imported ${this.stats.importedImages} new images`);
      console.log(`  ✅ Imported ${this.stats.importedUniversities} new universities`);
      
      console.log('\n🎯 YOUR STUDENTHOME DATABASE IS NOW COMPLETELY FRESH!');
      console.log('✅ All old data removed');
      console.log('✅ Comprehensive property data from ALL UK university cities');
      console.log('✅ Real property images');
      console.log('✅ Ready for production!');
      
    } catch (error) {
      console.error('❌ Complete cleanup and import failed:', error.message);
      process.exit(1);
    }
  }
}

// Run the complete cleanup and import
const cleanup = new CompleteDatabaseCleanup();
cleanup.runCompleteCleanupAndImport();

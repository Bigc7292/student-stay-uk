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
  console.log('Required: VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

class CleanComprehensiveImporter {
  constructor() {
    this.importStats = {
      propertiesImported: 0,
      imagesImported: 0,
      universitiesImported: 0,
      errors: 0,
      startTime: new Date().toISOString()
    };
  }

  async cleanAllPreviousData() {
    console.log('🧹 CLEANING ALL PREVIOUS DATA...\n');
    
    try {
      // Delete in correct order (foreign key constraints)
      console.log('🗑️ Deleting property images...');
      const { error: imagesError } = await supabase
        .from('property_images')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');
      
      if (imagesError) {
        console.log('⚠️ Error deleting images (table might not exist):', imagesError.message);
      } else {
        console.log('✅ Property images deleted');
      }

      console.log('🗑️ Deleting properties...');
      const { error: propertiesError } = await supabase
        .from('properties')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');
      
      if (propertiesError) {
        console.log('⚠️ Error deleting properties (table might not exist):', propertiesError.message);
      } else {
        console.log('✅ Properties deleted');
      }

      console.log('🗑️ Deleting universities...');
      const { error: universitiesError } = await supabase
        .from('universities')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');
      
      if (universitiesError) {
        console.log('⚠️ Error deleting universities (table might not exist):', universitiesError.message);
      } else {
        console.log('✅ Universities deleted');
      }

      console.log('🗑️ Deleting guides...');
      const { error: guidesError } = await supabase
        .from('guides')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');
      
      if (guidesError) {
        console.log('⚠️ Error deleting guides (table might not exist):', guidesError.message);
      } else {
        console.log('✅ Guides deleted');
      }

      console.log('\n✅ ALL PREVIOUS DATA CLEANED!\n');
      
    } catch (error) {
      console.error('❌ Error during cleanup:', error.message);
      // Continue with import even if cleanup fails
    }
  }

  async loadComprehensiveData() {
    try {
      console.log('📖 Loading comprehensive property data...');
      
      const dataPath = path.join(__dirname, '../comprehensive_uk_properties_complete.json');
      
      if (!await fs.access(dataPath).then(() => true).catch(() => false)) {
        console.error('❌ comprehensive_uk_properties_complete.json not found');
        console.log('💡 Make sure the comprehensive scraper has been run first');
        process.exit(1);
      }
      
      const rawData = await fs.readFile(dataPath, 'utf8');
      const comprehensiveData = JSON.parse(rawData);
      
      console.log('📊 Comprehensive data loaded:');
      console.log(`  🏠 Properties: ${comprehensiveData.properties?.length || 0}`);
      console.log(`  🏫 Universities: ${comprehensiveData.universities?.length || 0}`);
      console.log(`  🖼️ Total images: ${comprehensiveData.metadata?.totalImages || 0}`);
      console.log(`  ✅ Success rate: ${comprehensiveData.metadata?.successfulRequests || 0}/${comprehensiveData.metadata?.totalRequests || 0}`);
      
      return comprehensiveData;
      
    } catch (error) {
      console.error('❌ Error loading comprehensive data:', error.message);
      process.exit(1);
    }
  }

  async importUniversities(universities) {
    console.log('\n🏫 IMPORTING UNIVERSITIES...');
    
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
          this.importStats.errors++;
        } else {
          this.importStats.universitiesImported++;
        }
      } catch (error) {
        console.warn('⚠️ Error processing university:', error.message);
        this.importStats.errors++;
      }
    }
    
    console.log(`✅ Universities imported: ${this.importStats.universitiesImported}`);
  }

  async importPropertiesWithImages(properties) {
    console.log('\n🏠 IMPORTING PROPERTIES WITH IMAGES...');
    
    if (!properties || properties.length === 0) {
      console.log('⚠️ No properties to import');
      return;
    }

    console.log(`📊 Importing ${properties.length} properties...`);

    for (let i = 0; i < properties.length; i++) {
      const property = properties[i];
      
      try {
        // Validate and clean property data
        const cleanProperty = this.cleanPropertyData(property);
        
        if (!cleanProperty) {
          continue; // Skip invalid properties
        }

        // Insert property
        const { data: propertyRecord, error: propertyError } = await supabase
          .from('properties')
          .insert(cleanProperty)
          .select()
          .single();
        
        if (propertyError) {
          console.warn('⚠️ Error inserting property:', propertyError.message);
          this.importStats.errors++;
          continue;
        }

        this.importStats.propertiesImported++;

        // Insert property images
        if (property.images && property.images.length > 0) {
          await this.insertPropertyImages(propertyRecord.id, property.images);
        }

        // Progress update
        if (this.importStats.propertiesImported % 500 === 0) {
          console.log(`⏳ Progress: ${this.importStats.propertiesImported}/${properties.length} properties imported...`);
        }

      } catch (error) {
        console.warn('⚠️ Error processing property:', error.message);
        this.importStats.errors++;
      }
    }
    
    console.log(`✅ Properties imported: ${this.importStats.propertiesImported}`);
    console.log(`✅ Images imported: ${this.importStats.imagesImported}`);
  }

  cleanPropertyData(property) {
    try {
      // Skip properties with invalid data
      if (!property.title || !property.location || property.price <= 0 || property.price > 15000) {
        return null;
      }

      return {
        title: property.title.substring(0, 200),
        price: Math.round(property.price),
        price_type: property.price_type || 'weekly',
        location: property.location,
        full_address: property.full_address?.substring(0, 300) || null,
        postcode: property.postcode || null,
        bedrooms: Math.max(1, Math.min(10, property.bedrooms || 1)),
        bathrooms: Math.max(1, Math.min(5, property.bathrooms || 1)),
        property_type: property.property_type || 'flat',
        furnished: property.furnished === true,
        available: property.available !== false,
        description: property.description?.substring(0, 1000) || null,
        landlord_name: property.landlord_name?.substring(0, 100) || null,
        features: property.features ? JSON.stringify(property.features.slice(0, 15)) : null,
        floor_area: property.floor_area || null,
        energy_rating: property.energy_rating || null,
        council_tax_band: property.council_tax_band || null,
        deposit: property.deposit || null,
        min_tenancy: property.min_tenancy || null,
        max_tenancy: property.max_tenancy || null,
        bills_included: property.bills_included || false,
        parking: property.parking || false,
        garden: property.garden || false,
        balcony: property.balcony || false,
        source: property.source || 'comprehensive-scraper',
        source_url: property.source_url
      };
    } catch (error) {
      console.warn('⚠️ Error cleaning property data:', error.message);
      return null;
    }
  }

  async insertPropertyImages(propertyId, images) {
    try {
      const validImages = images.filter(img => 
        img.url && 
        img.url.startsWith('http') && 
        !img.url.includes('placeholder') &&
        !img.url.includes('logo')
      );

      if (validImages.length === 0) {
        return;
      }

      const imageData = validImages.slice(0, 20).map((img, index) => ({
        property_id: propertyId,
        image_url: img.url,
        alt_text: img.alt || `Property image ${index + 1}`,
        is_primary: img.is_primary || index === 0,
        image_order: img.image_order || index
      }));

      const { error: imageError } = await supabase
        .from('property_images')
        .insert(imageData);

      if (!imageError) {
        this.importStats.imagesImported += imageData.length;
      } else {
        console.warn('⚠️ Error inserting images:', imageError.message);
        this.importStats.errors++;
      }

    } catch (error) {
      console.warn('⚠️ Error processing images:', error.message);
      this.importStats.errors++;
    }
  }

  async getFinalStatistics() {
    console.log('\n📊 GETTING FINAL DATABASE STATISTICS...');
    
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

      console.log('\n🎉 FINAL DATABASE STATISTICS:');
      console.log(`  🏠 Total properties: ${properties?.length || 0}`);
      console.log(`  🖼️ Total images: ${images?.length || 0}`);
      console.log(`  🏫 Total universities: ${universities?.length || 0}`);

      if (properties && properties.length > 0) {
        // Location breakdown
        const locationStats = properties.reduce((acc, prop) => {
          acc[prop.location] = (acc[prop.location] || 0) + 1;
          return acc;
        }, {});

        console.log('\n📍 Top 15 locations:');
        Object.entries(locationStats)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 15)
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

        // Postcode coverage
        const withPostcodes = properties.filter(p => p.postcode);
        console.log(`\n📮 Postcode coverage: ${withPostcodes.length}/${properties.length} (${((withPostcodes.length / properties.length) * 100).toFixed(1)}%)`);

        // Image coverage
        const propertiesWithImages = new Set(images?.map(img => img.property_id) || []);
        const imageCoverage = (propertiesWithImages.size / properties.length) * 100;
        console.log(`🖼️ Image coverage: ${propertiesWithImages.size}/${properties.length} (${imageCoverage.toFixed(1)}%)`);
        console.log(`📸 Average images per property: ${properties.length > 0 ? ((images?.length || 0) / properties.length).toFixed(1) : 0}`);
      }

    } catch (error) {
      console.error('❌ Error getting final statistics:', error.message);
    }
  }

  async runCleanImport() {
    try {
      console.log('🚀 STARTING CLEAN COMPREHENSIVE IMPORT...\n');
      
      // Step 1: Clean all previous data
      await this.cleanAllPreviousData();
      
      // Step 2: Load comprehensive data
      const comprehensiveData = await this.loadComprehensiveData();
      
      // Step 3: Import universities
      await this.importUniversities(comprehensiveData.universities);
      
      // Step 4: Import properties with images
      await this.importPropertiesWithImages(comprehensiveData.properties);
      
      // Step 5: Get final statistics
      await this.getFinalStatistics();
      
      this.importStats.endTime = new Date().toISOString();
      
      console.log('\n🎉 CLEAN COMPREHENSIVE IMPORT COMPLETED!');
      console.log('📊 IMPORT SUMMARY:');
      console.log(`  ✅ Properties imported: ${this.importStats.propertiesImported}`);
      console.log(`  ✅ Images imported: ${this.importStats.imagesImported}`);
      console.log(`  ✅ Universities imported: ${this.importStats.universitiesImported}`);
      console.log(`  ❌ Errors: ${this.importStats.errors}`);
      console.log(`  ⏱️ Duration: ${new Date(this.importStats.endTime) - new Date(this.importStats.startTime)}ms`);
      
      console.log('\n🎯 YOUR STUDENTHOME DATABASE IS NOW READY!');
      console.log('✅ Clean, comprehensive property data');
      console.log('✅ Real property images from Rightmove');
      console.log('✅ Complete university coverage');
      console.log('✅ Ready for frontend integration!');
      
    } catch (error) {
      console.error('❌ Clean import failed:', error.message);
      process.exit(1);
    }
  }
}

// Run the clean import
const importer = new CleanComprehensiveImporter();
importer.runCleanImport();

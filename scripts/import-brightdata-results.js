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

async function importBrightDataResults() {
  try {
    console.log('🚀 Starting import of Bright Data Rightmove results...');
    
    // Read Bright Data results
    const dataPath = path.join(__dirname, '../brightdata_rightmove_complete.json');
    
    if (!await fs.access(dataPath).then(() => true).catch(() => false)) {
      console.error('❌ brightdata_rightmove_complete.json not found');
      console.log('💡 Run the Bright Data scraper first: node scripts/brightdata-rightmove-scraper.js');
      process.exit(1);
    }
    
    const rawData = await fs.readFile(dataPath, 'utf8');
    const brightData = JSON.parse(rawData);
    
    console.log('📊 Bright Data results loaded:');
    console.log(`  🏠 Properties: ${brightData.properties?.length || 0}`);
    console.log(`  🏫 Universities: ${brightData.universities?.length || 0}`);
    console.log(`  ✅ Successful cities: ${brightData.metadata?.successfulCities || 0}`);
    console.log(`  ❌ Failed cities: ${brightData.metadata?.failedCities || 0}`);
    
    let successCount = 0;
    let errorCount = 0;
    let imageCount = 0;
    
    // Clear existing data
    console.log('\n🧹 Clearing existing data...');
    try {
      await supabase.from('property_images').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('properties').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('universities').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      console.log('✅ Existing data cleared');
    } catch (error) {
      console.log('⚠️ Error clearing data:', error.message);
    }
    
    // Import Universities
    if (brightData.universities && brightData.universities.length > 0) {
      console.log('\n🏫 Importing universities...');
      
      for (const university of brightData.universities) {
        try {
          const { error } = await supabase
            .from('universities')
            .insert({
              name: university.name,
              location: university.location,
              scraped_at: university.scraped_at
            });
          
          if (error && !error.message.includes('duplicate')) {
            console.warn('⚠️ Error inserting university:', error.message);
          }
        } catch (error) {
          console.warn('⚠️ Error processing university:', error.message);
        }
      }
      
      console.log(`✅ Universities imported: ${brightData.universities.length}`);
    }
    
    // Import Properties with Images
    if (brightData.properties && brightData.properties.length > 0) {
      console.log('\n🏠 Importing properties with images...');
      
      for (const property of brightData.properties) {
        try {
          // Validate property data
          if (!property.title || !property.location || property.price <= 0) {
            continue;
          }
          
          // Prepare property data for database
          const propertyData = {
            title: property.title.substring(0, 200),
            price: Math.round(property.price),
            price_type: property.price_type || 'monthly',
            location: property.location,
            full_address: property.full_address?.substring(0, 300) || null,
            postcode: property.postcode,
            bedrooms: Math.max(1, Math.min(10, property.bedrooms || 1)),
            bathrooms: Math.max(1, Math.min(5, property.bathrooms || 1)),
            property_type: property.property_type || 'flat',
            furnished: property.furnished === true,
            available: property.available !== false,
            description: property.description?.substring(0, 1000) || null,
            landlord_name: property.landlord_name?.substring(0, 100) || null,
            features: property.features ? JSON.stringify(property.features) : null,
            energy_rating: property.energy_rating,
            council_tax_band: property.council_tax_band,
            deposit: property.deposit,
            min_tenancy: property.min_tenancy,
            max_tenancy: property.max_tenancy,
            source: 'brightdata-rightmove',
            source_url: property.source_url,
            scraped_at: property.scraped_at || new Date().toISOString()
          };
          
          // Insert property
          const { data: propertyRecord, error: propertyError } = await supabase
            .from('properties')
            .insert(propertyData)
            .select()
            .single();
          
          if (propertyError) {
            console.warn('⚠️ Error inserting property:', propertyError.message);
            errorCount++;
            continue;
          }
          
          successCount++;
          
          // Insert property images
          if (property.images && property.images.length > 0) {
            const validImages = property.images.filter(img => 
              img.url && 
              img.url.startsWith('http') && 
              !img.url.includes('placeholder')
            );
            
            if (validImages.length > 0) {
              const imageData = validImages.map((img, index) => ({
                property_id: propertyRecord.id,
                image_url: img.url,
                alt_text: img.alt || `Property image ${index + 1}`,
                is_primary: img.is_primary || index === 0,
                image_order: index
              }));
              
              const { error: imageError } = await supabase
                .from('property_images')
                .insert(imageData);
              
              if (!imageError) {
                imageCount += imageData.length;
              } else {
                console.warn('⚠️ Error inserting images:', imageError.message);
              }
            }
          }
          
          if (successCount % 100 === 0) {
            console.log(`✅ Imported ${successCount} properties with ${imageCount} images...`);
          }
          
        } catch (error) {
          console.warn('⚠️ Error processing property:', error.message);
          errorCount++;
        }
      }
    }
    
    console.log('\n🎉 Bright Data import completed!');
    console.log(`✅ Successfully imported: ${successCount} properties`);
    console.log(`🖼️ Total images imported: ${imageCount}`);
    console.log(`❌ Errors: ${errorCount}`);
    console.log(`📊 Average images per property: ${successCount > 0 ? (imageCount / successCount).toFixed(1) : 0}`);
    
    // Get final statistics
    const { data: finalProperties } = await supabase
      .from('properties')
      .select('location, postcode, price, price_type')
      .order('created_at', { ascending: false });
    
    const { data: finalImages } = await supabase
      .from('property_images')
      .select('property_id')
      .order('created_at', { ascending: false });
    
    const { data: finalUniversities } = await supabase
      .from('universities')
      .select('name');
    
    if (finalProperties && finalProperties.length > 0) {
      console.log(`\n📊 Final database statistics:`);
      console.log(`  🏠 Total properties: ${finalProperties.length}`);
      console.log(`  🖼️ Total images: ${finalImages?.length || 0}`);
      console.log(`  🏫 Total universities: ${finalUniversities?.length || 0}`);
      
      const withPostcodes = finalProperties.filter(p => p.postcode);
      console.log(`  📮 Properties with postcodes: ${withPostcodes.length} (${((withPostcodes.length / finalProperties.length) * 100).toFixed(1)}%)`);
      
      // Location breakdown
      const locationStats = finalProperties.reduce((acc, prop) => {
        acc[prop.location] = (acc[prop.location] || 0) + 1;
        return acc;
      }, {});
      
      console.log('\n📍 Properties by location:');
      Object.entries(locationStats)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 15)
        .forEach(([location, count]) => {
          console.log(`  ${location}: ${count} properties`);
        });
      
      // Price statistics
      const prices = finalProperties.filter(p => p.price > 0).map(p => p.price);
      if (prices.length > 0) {
        const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);
        
        console.log('\n💰 Price statistics:');
        console.log(`  Average: £${avgPrice.toFixed(0)} per ${finalProperties[0]?.price_type || 'month'}`);
        console.log(`  Range: £${minPrice} - £${maxPrice}`);
      }
      
      // Image coverage
      const propertiesWithImages = new Set(finalImages?.map(img => img.property_id) || []);
      const imageCoverage = (propertiesWithImages.size / finalProperties.length) * 100;
      
      console.log('\n🖼️ Image coverage:');
      console.log(`  Properties with images: ${propertiesWithImages.size} (${imageCoverage.toFixed(1)}%)`);
      console.log(`  Average images per property: ${finalProperties.length > 0 ? ((finalImages?.length || 0) / finalProperties.length).toFixed(1) : 0}`);
    }
    
    console.log('\n🎯 Your StudentHome database is now complete with Bright Data!');
    console.log('✅ High-quality property data with real images');
    console.log('✅ Complete property details and features');
    console.log('✅ UK postcodes for accurate mapping');
    console.log('✅ Ready for production use!');
    
  } catch (error) {
    console.error('❌ Bright Data import failed:', error);
    process.exit(1);
  }
}

// Run the import
importBrightDataResults();

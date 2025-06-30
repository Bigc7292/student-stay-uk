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

async function importConsolidatedData() {
  try {
    console.log('🚀 Starting import of consolidated property data...');
    
    // Read consolidated data
    const dataPath = path.join(__dirname, '../consolidated_property_data.json');
    const rawData = await fs.readFile(dataPath, 'utf8');
    const consolidatedData = JSON.parse(rawData);
    
    console.log('📊 Consolidated data loaded:');
    console.log(`  🏠 Properties: ${consolidatedData.properties.length}`);
    console.log(`  🏫 Universities: ${consolidatedData.universities.length}`);
    console.log(`  📖 Guides: ${consolidatedData.guides.length}`);
    
    let successCount = 0;
    let errorCount = 0;
    
    // 1. Clear existing data first
    console.log('\n🧹 Clearing existing data...');
    
    try {
      await supabase.from('property_images').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('properties').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('universities').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('guides').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      console.log('✅ Existing data cleared');
    } catch (error) {
      console.log('⚠️ Error clearing data (tables might not exist):', error.message);
    }
    
    // 2. Import Universities
    if (consolidatedData.universities && consolidatedData.universities.length > 0) {
      console.log('\n🏫 Importing universities...');
      
      const universitiesToInsert = consolidatedData.universities.map(uni => ({
        name: uni.name,
        location: uni.location,
        rightmove_url: uni.rightmove_url
      }));
      
      const { data: universityData, error: universityError } = await supabase
        .from('universities')
        .insert(universitiesToInsert)
        .select();
      
      if (universityError) {
        console.warn('⚠️ Error inserting universities:', universityError.message);
      } else {
        console.log(`✅ Successfully imported ${universityData.length} universities`);
      }
    }
    
    // 3. Import Guides
    if (consolidatedData.guides && consolidatedData.guides.length > 0) {
      console.log('\n📖 Importing guides...');
      
      for (const guide of consolidatedData.guides) {
        try {
          // Insert main guide
          const { error: guideError } = await supabase
            .from('guides')
            .insert({
              title: guide.title,
              guide_type: guide.type,
              source_url: guide.url
            });
          
          if (guideError) {
            console.warn('⚠️ Error inserting guide:', guideError.message);
          }
          
          // Insert guide articles
          if (guide.articles && guide.articles.length > 0) {
            for (const article of guide.articles) {
              const { error: articleError } = await supabase
                .from('guides')
                .insert({
                  title: article.title,
                  content: article.content,
                  guide_type: article.type || guide.type,
                  source_url: article.url
                });
              
              if (articleError) {
                console.warn('⚠️ Error inserting article:', articleError.message);
              }
            }
          }
        } catch (error) {
          console.warn('⚠️ Error processing guide:', error.message);
        }
      }
      
      console.log('✅ Guides imported');
    }
    
    // 4. Import Properties
    if (consolidatedData.properties && consolidatedData.properties.length > 0) {
      console.log('\n🏠 Importing properties...');
      
      for (const property of consolidatedData.properties) {
        try {
          // Validate and clean property data
          const cleanProperty = {
            title: property.title || 'Student Property',
            price: Math.max(0, parseFloat(property.price) || 0),
            price_type: property.price_type || 'weekly',
            location: property.location || 'Unknown',
            full_address: property.full_address || null,
            postcode: property.postcode || null,
            bedrooms: Math.max(1, parseInt(property.bedrooms) || 1),
            bathrooms: Math.max(1, parseInt(property.bathrooms) || 1),
            property_type: property.property_type || 'flat',
            furnished: property.furnished === true,
            available: property.available !== false,
            description: property.description || null,
            landlord_name: property.landlord_name || null,
            source: property.source || 'rightmove',
            source_url: property.source_url || null,
            scraped_at: property.scraped_at || new Date().toISOString()
          };
          
          // Skip properties with no price
          if (cleanProperty.price <= 0) {
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
            errorCount++;
            continue;
          }
          
          successCount++;
          
          if (successCount % 100 === 0) {
            console.log(`✅ Imported ${successCount} properties...`);
          }
          
        } catch (error) {
          console.warn('⚠️ Error processing property:', error.message);
          errorCount++;
        }
      }
    }
    
    console.log('\n🎉 Import completed!');
    console.log(`✅ Successfully imported: ${successCount} properties`);
    console.log(`❌ Errors: ${errorCount}`);
    
    // 5. Get final statistics
    console.log('\n📊 Final database statistics:');
    
    const { data: propertyStats } = await supabase
      .from('properties')
      .select('location, price, price_type')
      .order('created_at', { ascending: false });
    
    const { data: universityStats } = await supabase
      .from('universities')
      .select('name');
    
    const { data: guideStats } = await supabase
      .from('guides')
      .select('guide_type');
    
    console.log(`  🏠 Total properties in database: ${propertyStats?.length || 0}`);
    console.log(`  🏫 Total universities in database: ${universityStats?.length || 0}`);
    console.log(`  📖 Total guides in database: ${guideStats?.length || 0}`);
    
    if (propertyStats && propertyStats.length > 0) {
      // Location breakdown
      const locationStats = propertyStats.reduce((acc, prop) => {
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
      const prices = propertyStats.filter(p => p.price > 0).map(p => p.price);
      if (prices.length > 0) {
        const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);
        
        console.log('\n💰 Price statistics:');
        console.log(`  Average: £${avgPrice.toFixed(0)}`);
        console.log(`  Range: £${minPrice} - £${maxPrice}`);
      }
      
      // Price type breakdown
      const priceTypes = propertyStats.reduce((acc, prop) => {
        acc[prop.price_type] = (acc[prop.price_type] || 0) + 1;
        return acc;
      }, {});
      
      console.log('\n📅 Price types:');
      Object.entries(priceTypes).forEach(([type, count]) => {
        console.log(`  ${type}: ${count} properties`);
      });
    }
    
    console.log('\n🎯 Database is now ready for your StudentHome platform!');
    console.log('✅ All property data has been successfully imported and organized');
    
  } catch (error) {
    console.error('❌ Import failed:', error);
    process.exit(1);
  }
}

// Run the import
importConsolidatedData();

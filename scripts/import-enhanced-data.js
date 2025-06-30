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

// Enhanced property data normalization
function normalizeEnhancedProperty(rawProperty) {
  try {
    // Extract and clean price
    let price = 0;
    let priceType = 'weekly';
    
    if (rawProperty.price) {
      const priceText = rawProperty.price.toString();
      
      // Extract numeric value
      const priceMatch = priceText.match(/£?([0-9,]+)/);
      if (priceMatch) {
        price = parseFloat(priceMatch[1].replace(/,/g, ''));
      }
      
      // Determine price frequency
      if (priceText.toLowerCase().includes('month') || priceText.toLowerCase().includes('pcm')) {
        priceType = 'monthly';
      } else if (priceText.toLowerCase().includes('year') || priceText.toLowerCase().includes('annual')) {
        priceType = 'yearly';
      } else {
        priceType = 'weekly'; // Default for student accommodation
      }
    }
    
    // Extract location from address or university
    let location = rawProperty.location || rawProperty.university || 'Unknown';
    let fullAddress = rawProperty.address || '';
    let postcode = null;
    
    if (fullAddress) {
      // Extract postcode from address
      const postcodeMatch = fullAddress.match(/\b[A-Z]{1,2}[0-9][A-Z0-9]?\s?[0-9][A-Z]{2}\b/i);
      if (postcodeMatch) {
        postcode = postcodeMatch[0];
      }
      
      // Extract city/location from address
      const addressParts = fullAddress.split(',');
      if (addressParts.length > 1) {
        location = addressParts[addressParts.length - 2].trim() || location;
      }
    }
    
    return {
      title: rawProperty.title || 'Student Property',
      price: price,
      price_type: priceType,
      location: location,
      full_address: fullAddress,
      postcode: postcode,
      bedrooms: rawProperty.bedrooms || 1,
      bathrooms: rawProperty.bathrooms || 1,
      property_type: rawProperty.property_type || 'flat',
      furnished: true, // Most student accommodation is furnished
      available: true,
      description: rawProperty.description || null,
      source: 'rightmove',
      source_url: rawProperty.property_url,
      scraped_at: rawProperty.scraped_at || new Date().toISOString()
    };
  } catch (error) {
    console.warn('⚠️ Error normalizing property:', error);
    return null;
  }
}

// Enhanced image processing
function processPropertyImages(rawProperty) {
  const images = [];
  
  if (rawProperty.images && Array.isArray(rawProperty.images)) {
    rawProperty.images.forEach((img, index) => {
      let imageUrl = null;
      let altText = '';
      
      if (typeof img === 'string') {
        imageUrl = img;
        altText = `Property image ${index + 1}`;
      } else if (typeof img === 'object') {
        imageUrl = img.url || img.src || img.image_url;
        altText = img.alt || img.caption || `Property image ${index + 1}`;
      }
      
      if (imageUrl && imageUrl.startsWith('http')) {
        // Clean up image URL
        if (imageUrl.includes('?')) {
          imageUrl = imageUrl.split('?')[0]; // Remove query parameters
        }
        
        images.push({
          image_url: imageUrl,
          alt_text: altText,
          is_primary: index === 0,
          image_order: index
        });
      }
    });
  }
  
  return images;
}

async function importEnhancedData() {
  try {
    console.log('🚀 Starting enhanced data import...');
    
    // Check for enhanced scraped data
    const dataPath = path.join(__dirname, '../enhanced_scraped_data.json');
    
    if (!await fs.access(dataPath).then(() => true).catch(() => false)) {
      console.error('❌ enhanced_scraped_data.json not found');
      console.log('💡 Run the enhanced scraper first: node scripts/enhanced-rightmove-scraper.js');
      process.exit(1);
    }
    
    const rawData = await fs.readFile(dataPath, 'utf8');
    const scrapedData = JSON.parse(rawData);
    
    console.log('📊 Enhanced data found:');
    console.log(`  🏠 Properties: ${scrapedData.properties?.length || 0}`);
    console.log(`  🏫 Universities: ${scrapedData.universities?.length || 0}`);
    
    let successCount = 0;
    let errorCount = 0;
    
    // 1. Import Universities
    if (scrapedData.universities && scrapedData.universities.length > 0) {
      console.log('\n🏫 Importing universities...');
      
      for (const university of scrapedData.universities) {
        try {
          const { error } = await supabase
            .from('universities')
            .upsert({
              name: university.university,
              location: university.location,
              rightmove_url: university.url
            }, {
              onConflict: 'name'
            });
          
          if (error) {
            console.warn('⚠️ Error inserting university:', error.message);
          }
        } catch (error) {
          console.warn('⚠️ Error processing university:', error.message);
        }
      }
      
      console.log('✅ Universities imported');
    }
    
    // 2. Import Properties
    if (scrapedData.properties && scrapedData.properties.length > 0) {
      console.log('\n🏠 Importing properties...');
      
      for (const property of scrapedData.properties) {
        try {
          const normalizedProperty = normalizeEnhancedProperty(property);
          
          if (!normalizedProperty) {
            console.warn('⚠️ Skipping invalid property');
            continue;
          }
          
          // Insert property
          const { data: propertyRecord, error: propertyError } = await supabase
            .from('properties')
            .insert(normalizedProperty)
            .select()
            .single();
          
          if (propertyError) {
            console.warn('⚠️ Error inserting property:', propertyError.message);
            errorCount++;
            continue;
          }
          
          // Insert property images
          const images = processPropertyImages(property);
          if (images.length > 0) {
            const imagesWithPropertyId = images.map(img => ({
              ...img,
              property_id: propertyRecord.id
            }));
            
            const { error: imagesError } = await supabase
              .from('property_images')
              .insert(imagesWithPropertyId);
            
            if (imagesError) {
              console.warn('⚠️ Error inserting images:', imagesError.message);
            }
          }
          
          successCount++;
          
          if (successCount % 25 === 0) {
            console.log(`✅ Processed ${successCount} properties...`);
          }
          
        } catch (error) {
          console.warn('⚠️ Error processing property:', error.message);
          errorCount++;
        }
      }
    }
    
    console.log('\n🎉 Enhanced import completed!');
    console.log(`✅ Successfully imported: ${successCount} properties`);
    console.log(`❌ Errors: ${errorCount}`);
    
    // Get summary statistics
    const { data: stats } = await supabase
      .from('properties')
      .select('location, price, price_type')
      .order('created_at', { ascending: false });
    
    if (stats) {
      const locationStats = stats.reduce((acc, prop) => {
        acc[prop.location] = (acc[prop.location] || 0) + 1;
        return acc;
      }, {});
      
      const priceStats = stats.reduce((acc, prop) => {
        if (prop.price > 0) {
          if (!acc[prop.price_type]) acc[prop.price_type] = [];
          acc[prop.price_type].push(prop.price);
        }
        return acc;
      }, {});
      
      console.log('\n📊 Import Summary:');
      console.log('📍 Top locations:');
      Object.entries(locationStats)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .forEach(([location, count]) => {
          console.log(`  ${location}: ${count} properties`);
        });
      
      console.log('\n💰 Price ranges:');
      Object.entries(priceStats).forEach(([type, prices]) => {
        if (prices.length > 0) {
          const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
          const min = Math.min(...prices);
          const max = Math.max(...prices);
          console.log(`  ${type}: £${min} - £${max} (avg: £${avg.toFixed(0)})`);
        }
      });
    }
    
  } catch (error) {
    console.error('❌ Enhanced import failed:', error);
    process.exit(1);
  }
}

// Run the enhanced import
importEnhancedData();

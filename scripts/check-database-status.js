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

async function checkDatabaseStatus() {
  try {
    console.log('🔍 Checking current database status...\n');
    
    // Check properties table
    console.log('📊 PROPERTIES TABLE:');
    const { data: properties, error: propError } = await supabase
      .from('properties')
      .select('*')
      .limit(5);
    
    if (propError) {
      console.log('❌ Error accessing properties table:', propError.message);
    } else {
      console.log(`✅ Properties in database: ${properties?.length || 0}`);
      if (properties && properties.length > 0) {
        console.log('\n📋 Sample properties:');
        properties.forEach((prop, index) => {
          console.log(`  ${index + 1}. ${prop.title}`);
          console.log(`     Price: £${prop.price} ${prop.price_type}`);
          console.log(`     Location: ${prop.location}`);
          console.log(`     Postcode: ${prop.postcode || 'None'}`);
          console.log(`     Bedrooms: ${prop.bedrooms}, Bathrooms: ${prop.bathrooms}`);
          console.log(`     Source: ${prop.source}`);
          console.log('');
        });
      }
    }
    
    // Get total count
    const { count: totalProperties } = await supabase
      .from('properties')
      .select('*', { count: 'exact', head: true });
    
    console.log(`📈 Total properties in database: ${totalProperties || 0}`);
    
    // Check property images table
    console.log('\n🖼️ PROPERTY IMAGES TABLE:');
    const { data: images, error: imgError } = await supabase
      .from('property_images')
      .select('*')
      .limit(5);
    
    if (imgError) {
      console.log('❌ Error accessing property_images table:', imgError.message);
    } else {
      console.log(`✅ Property images in database: ${images?.length || 0}`);
      if (images && images.length > 0) {
        console.log('\n📋 Sample images:');
        images.forEach((img, index) => {
          console.log(`  ${index + 1}. Property ID: ${img.property_id}`);
          console.log(`     Image URL: ${img.image_url?.substring(0, 80)}...`);
          console.log(`     Alt text: ${img.alt_text}`);
          console.log(`     Is primary: ${img.is_primary}`);
          console.log('');
        });
      }
    }
    
    // Get total image count
    const { count: totalImages } = await supabase
      .from('property_images')
      .select('*', { count: 'exact', head: true });
    
    console.log(`📈 Total images in database: ${totalImages || 0}`);
    
    // Check universities table
    console.log('\n🏫 UNIVERSITIES TABLE:');
    const { data: universities, error: uniError } = await supabase
      .from('universities')
      .select('*')
      .limit(5);
    
    if (uniError) {
      console.log('❌ Error accessing universities table:', uniError.message);
    } else {
      console.log(`✅ Universities in database: ${universities?.length || 0}`);
      if (universities && universities.length > 0) {
        console.log('\n📋 Sample universities:');
        universities.forEach((uni, index) => {
          console.log(`  ${index + 1}. ${uni.name} - ${uni.location}`);
        });
      }
    }
    
    // Get total university count
    const { count: totalUniversities } = await supabase
      .from('universities')
      .select('*', { count: 'exact', head: true });
    
    console.log(`📈 Total universities in database: ${totalUniversities || 0}`);
    
    // Check guides table
    console.log('\n📖 GUIDES TABLE:');
    const { data: guides, error: guideError } = await supabase
      .from('guides')
      .select('*')
      .limit(3);
    
    if (guideError) {
      console.log('❌ Error accessing guides table:', guideError.message);
    } else {
      console.log(`✅ Guides in database: ${guides?.length || 0}`);
      if (guides && guides.length > 0) {
        console.log('\n📋 Sample guides:');
        guides.forEach((guide, index) => {
          console.log(`  ${index + 1}. ${guide.title} (${guide.guide_type})`);
        });
      }
    }
    
    // Get total guide count
    const { count: totalGuides } = await supabase
      .from('guides')
      .select('*', { count: 'exact', head: true });
    
    console.log(`📈 Total guides in database: ${totalGuides || 0}`);
    
  } catch (error) {
    console.error('❌ Error checking database status:', error);
  }
}

async function checkLocalDataFiles() {
  try {
    console.log('\n\n🗂️ CHECKING LOCAL DATA FILES:\n');
    
    const files = [
      'scraped_data.json',
      'comprehensive_scraped_data.json', 
      'enhanced_scraping_progress.json',
      'consolidated_property_data.json',
      'real_property_data.json'
    ];
    
    for (const file of files) {
      try {
        const filePath = path.join(__dirname, `../${file}`);
        const stats = await fs.stat(filePath);
        const data = JSON.parse(await fs.readFile(filePath, 'utf8'));
        
        console.log(`📁 ${file}:`);
        console.log(`   Size: ${(stats.size / 1024 / 1024).toFixed(1)} MB`);
        
        if (data.properties) {
          console.log(`   Properties: ${data.properties.length}`);
          
          // Check for images in properties
          const propertiesWithImages = data.properties.filter(p => 
            (p.images && p.images.length > 0) || 
            (p.propertyImages && p.propertyImages.length > 0) ||
            p.image_url
          );
          console.log(`   Properties with images: ${propertiesWithImages.length}`);
          
          // Check for detailed info
          const propertiesWithDetails = data.properties.filter(p => 
            p.description || p.full_address || p.landlord_name
          );
          console.log(`   Properties with detailed info: ${propertiesWithDetails.length}`);
          
        } else if (Array.isArray(data)) {
          console.log(`   Items: ${data.length}`);
          
          // Check if items have property-like data
          const itemsWithProperties = data.filter(item => 
            item.text && (item.text.includes('£') || item.text.includes('property'))
          );
          console.log(`   Items with property data: ${itemsWithProperties.length}`);
        }
        
        if (data.universities) {
          console.log(`   Universities: ${data.universities.length}`);
        }
        
        if (data.guides) {
          console.log(`   Guides: ${data.guides.length}`);
        }
        
        console.log('');
        
      } catch (error) {
        console.log(`❌ ${file}: Not found or error reading`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error checking local files:', error);
  }
}

async function checkImageAvailability() {
  try {
    console.log('\n🖼️ CHECKING IMAGE AVAILABILITY IN DATA:\n');
    
    // Check real_property_data.json for images
    try {
      const realDataPath = path.join(__dirname, '../real_property_data.json');
      const realData = JSON.parse(await fs.readFile(realDataPath, 'utf8'));
      
      console.log('📁 real_property_data.json:');
      console.log(`   Total properties: ${realData.properties.length}`);
      
      const propertiesWithImages = realData.properties.filter(p => 
        (p.images && p.images.length > 0) || p.image_url
      );
      
      console.log(`   Properties with images: ${propertiesWithImages.length}`);
      
      if (propertiesWithImages.length > 0) {
        console.log('\n📋 Sample properties with images:');
        propertiesWithImages.slice(0, 3).forEach((prop, index) => {
          console.log(`  ${index + 1}. ${prop.title}`);
          if (prop.images && prop.images.length > 0) {
            console.log(`     Images: ${prop.images.length}`);
            console.log(`     Sample URL: ${prop.images[0].url || prop.images[0]}`);
          }
          if (prop.image_url) {
            console.log(`     Image URL: ${prop.image_url}`);
          }
        });
      }
      
    } catch (error) {
      console.log('❌ Error checking real_property_data.json for images');
    }
    
    // Check original scraped_data.json for embedded images
    try {
      const scrapedDataPath = path.join(__dirname, '../scraped_data.json');
      const scrapedData = JSON.parse(await fs.readFile(scrapedDataPath, 'utf8'));
      
      console.log('\n📁 scraped_data.json:');
      console.log(`   Total items: ${scrapedData.length}`);
      
      const itemsWithImages = scrapedData.filter(item => 
        item.text && (item.text.includes('img src') || item.text.includes('image'))
      );
      
      console.log(`   Items with image references: ${itemsWithImages.length}`);
      
      if (itemsWithImages.length > 0) {
        // Extract sample image URLs
        const sampleItem = itemsWithImages[0];
        const imageMatches = sampleItem.text.match(/src="([^"]+)"/g);
        if (imageMatches) {
          console.log(`   Sample image URLs found: ${imageMatches.length}`);
          console.log(`   Example: ${imageMatches[0]}`);
        }
      }
      
    } catch (error) {
      console.log('❌ Error checking scraped_data.json for images');
    }
    
  } catch (error) {
    console.error('❌ Error checking image availability:', error);
  }
}

// Run all checks
async function runAllChecks() {
  await checkDatabaseStatus();
  await checkLocalDataFiles();
  await checkImageAvailability();
  
  console.log('\n🎯 SUMMARY:');
  console.log('✅ Database status checked');
  console.log('✅ Local data files analyzed');
  console.log('✅ Image availability assessed');
  console.log('\nReady to proceed with data import and image extraction!');
}

runAllChecks();

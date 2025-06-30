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
  console.error('Required: VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Create Supabase client with service role key for admin operations
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Function to extract location from various fields
function extractLocation(rawProperty) {
  // Try different location fields
  let location = rawProperty.location || rawProperty.address || rawProperty.displayAddress;

  if (!location || location === 'Unknown') {
    // Try to extract from title or other fields
    const title = rawProperty.title || rawProperty.summary || '';
    const url = rawProperty.url || rawProperty.propertyUrl || '';

    // Extract city from common patterns
    const cityPatterns = [
      /Aberdeen/i, /Birmingham/i, /Manchester/i, /London/i, /Liverpool/i,
      /Leeds/i, /Bristol/i, /Newcastle/i, /Sheffield/i, /Cardiff/i,
      /Edinburgh/i, /Glasgow/i, /Nottingham/i, /Leicester/i, /Coventry/i,
      /Bradford/i, /Brighton/i, /Hull/i, /Plymouth/i, /Stoke/i,
      /Wolverhampton/i, /Derby/i, /Southampton/i, /Portsmouth/i, /Norwich/i,
      /Swansea/i, /Dundee/i, /Belfast/i, /York/i, /Oxford/i, /Cambridge/i,
      /Bath/i, /Canterbury/i, /Chester/i, /Durham/i, /Exeter/i, /Lancaster/i,
      /Reading/i, /Bournemouth/i, /Luton/i, /Middlesbrough/i, /Sunderland/i
    ];

    // Check title and URL for city names
    for (const pattern of cityPatterns) {
      if (pattern.test(title) || pattern.test(url)) {
        location = title.match(pattern)?.[0] || url.match(pattern)?.[0];
        break;
      }
    }
  }

  // Clean up location string
  if (location) {
    // Remove common prefixes and clean up
    location = location
      .replace(/^(Student accommodation in|Properties in|Flats in|Houses in)\s*/i, '')
      .replace(/,.*$/, '') // Remove everything after first comma
      .trim();

    // Extract just the city name if it's a longer address
    const cityMatch = location.match(/\b(Aberdeen|Birmingham|Manchester|London|Liverpool|Leeds|Bristol|Newcastle|Sheffield|Cardiff|Edinburgh|Glasgow|Nottingham|Leicester|Coventry|Bradford|Brighton|Hull|Plymouth|Stoke|Wolverhampton|Derby|Southampton|Portsmouth|Norwich|Swansea|Dundee|Belfast|York|Oxford|Cambridge|Bath|Canterbury|Chester|Durham|Exeter|Lancaster|Reading|Bournemouth|Luton|Middlesbrough|Sunderland)\b/i);

    if (cityMatch) {
      location = cityMatch[0];
    }
  }

  return location || 'Unknown';
}

// Function to clean and normalize property data
function normalizePropertyData(rawProperty, source = 'scraped') {
  try {
    // Extract price from various formats
    let price = 0;
    if (rawProperty.price) {
      if (typeof rawProperty.price === 'object' && rawProperty.price.amount) {
        price = parseFloat(rawProperty.price.amount);
      } else {
        price = parseFloat(rawProperty.price.toString().replace(/[£,]/g, '')) || 0;
      }
    }

    // Extract price type
    let priceType = 'weekly';
    if (rawProperty.price && typeof rawProperty.price === 'object') {
      priceType = rawProperty.price.frequency || 'weekly';
      if (priceType === 'monthly') priceType = 'monthly';
      else if (priceType === 'yearly') priceType = 'yearly';
      else priceType = 'weekly';
    }

    return {
      title: rawProperty.title || rawProperty.summary || rawProperty.name || 'Property',
      price: price,
      price_type: priceType,
      location: extractLocation(rawProperty),
      postcode: rawProperty.postcode || null,
      bedrooms: parseInt(rawProperty.bedrooms) || 1,
      bathrooms: parseInt(rawProperty.bathrooms) || 1,
      property_type: rawProperty.propertySubType || rawProperty.propertyType || rawProperty.type || 'flat',
      furnished: rawProperty.furnished === true || rawProperty.furnished === 'true',
      available: rawProperty.available !== false,
      description: rawProperty.summary || rawProperty.description || null,
      landlord_name: rawProperty.customer?.branchDisplayName || rawProperty.landlord?.name || rawProperty.agent || null,
      landlord_verified: rawProperty.landlord?.verified === true,
      crime_rating: rawProperty.crimeData?.rating || null,
      crimes_per_thousand: rawProperty.crimeData?.crimesPerThousand || null,
      safety_score: rawProperty.crimeData?.safetyScore || null,
      source: source,
      source_url: rawProperty.propertyUrl || rawProperty.url || rawProperty.link || null,
      scraped_at: new Date().toISOString()
    };
  } catch (error) {
    console.warn('⚠️ Error normalizing property data:', error);
    return null;
  }
}

// Function to extract and normalize images
function extractImages(rawProperty) {
  const images = [];

  // Try different image sources
  let imageArray = rawProperty.images || rawProperty.propertyImages?.images || [];

  if (imageArray && Array.isArray(imageArray)) {
    imageArray.forEach((img, index) => {
      let imageUrl = null;

      if (typeof img === 'string' && img.startsWith('http')) {
        imageUrl = img;
      } else if (typeof img === 'object') {
        imageUrl = img.srcUrl || img.url || img.image_url || img.src;
      }

      if (imageUrl && imageUrl.startsWith('http')) {
        // Truncate very long URLs to prevent database errors
        if (imageUrl.length > 2000) {
          imageUrl = imageUrl.substring(0, 2000);
        }

        images.push({
          image_url: imageUrl,
          alt_text: img.caption || img.alt_text || `Property image ${index + 1}`,
          is_primary: index === 0
        });
      }
    });
  }

  // Also check for main image
  const mainImage = rawProperty.propertyImages?.mainImageSrc || rawProperty.mainImage;
  if (mainImage && mainImage.startsWith('http') && !images.some(img => img.image_url === mainImage)) {
    if (mainImage.length <= 2000) {
      images.unshift({
        image_url: mainImage,
        alt_text: 'Main property image',
        is_primary: true
      });

      // Update other images to not be primary
      images.forEach((img, index) => {
        if (index > 0) img.is_primary = false;
      });
    }
  }

  return images;
}

// Main import function
async function importScrapedData() {
  try {
    console.log('🚀 Starting comprehensive Supabase data import...');

    // Check for comprehensive scraped data first
    let scrapedDataPath = path.join(__dirname, '../comprehensive_scraped_data.json');
    let isComprehensive = true;

    if (!await fs.access(scrapedDataPath).then(() => true).catch(() => false)) {
      // Fall back to regular scraped data
      scrapedDataPath = path.join(__dirname, '../scraped_data.json');
      isComprehensive = false;

      if (!await fs.access(scrapedDataPath).then(() => true).catch(() => false)) {
        console.error('❌ No scraped data found');
        console.log('💡 Run the comprehensive scraper first: node scripts/comprehensive-scraper.js');
        process.exit(1);
      }
    }

    const rawData = await fs.readFile(scrapedDataPath, 'utf8');
    const scrapedData = JSON.parse(rawData);

    if (isComprehensive) {
      console.log('📊 Found comprehensive scraped data:');
      console.log(`  🏠 Properties: ${scrapedData.properties?.length || 0}`);
      console.log(`  🏫 Universities: ${scrapedData.universities?.length || 0}`);
      console.log(`  📖 Guides: ${scrapedData.guides?.length || 0}`);

      await importComprehensiveData(scrapedData);
    } else {
      console.log(`📊 Found ${scrapedData.length} basic scraped items`);
      await importBasicData(scrapedData);
    }
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const item of scrapedData) {
      try {
        // First, insert raw scraped data
        const { data: rawDataRecord, error: rawError } = await supabase
          .from('scraped_data')
          .insert({
            source: item.type || item.source || 'unknown',
            source_url: item.url || null,
            raw_data: item,
            processed: false
          })
          .select()
          .single();

        if (rawError) {
          console.warn('⚠️ Error inserting raw data:', JSON.stringify(rawError, null, 2));
          continue;
        }

        // Check if this item has properties array or is itself a property
        let propertiesToProcess = [];

        if (item.properties && Array.isArray(item.properties) && item.properties.length > 0) {
          // Item has properties array
          propertiesToProcess = item.properties;
        } else if (item.title || item.displayAddress || item.price) {
          // Item itself is a property
          propertiesToProcess = [item];
        } else {
          // Skip items without property data
          continue;
        }

        // Process each property
        for (const property of propertiesToProcess) {
          const normalizedProperty = normalizePropertyData(property, item.type || item.source || 'scraped');

          if (!normalizedProperty) {
            console.warn('⚠️ Skipping invalid property data');
            continue;
          }
        
        // Insert normalized property
        const { data: propertyRecord, error: propertyError } = await supabase
          .from('properties')
          .insert(normalizedProperty)
          .select()
          .single();
        
        if (propertyError) {
          console.warn('⚠️ Error inserting property:', propertyError);
          errorCount++;
          continue;
        }
        
        // Insert property images
        const images = extractImages(item);
        if (images.length > 0) {
          const imagesWithPropertyId = images.map(img => ({
            ...img,
            property_id: propertyRecord.id
          }));
          
          const { error: imagesError } = await supabase
            .from('property_images')
            .insert(imagesWithPropertyId);
          
          if (imagesError) {
            console.warn('⚠️ Error inserting images:', imagesError);
          }
        }
        
        // Mark raw data as processed
        await supabase
          .from('scraped_data')
          .update({ processed: true })
          .eq('id', rawDataRecord.id);
        
        successCount++;
        
        if (successCount % 10 === 0) {
          console.log(`✅ Processed ${successCount} properties...`);
        }
        
      } catch (error) {
        console.error('❌ Error processing item:', error);
        errorCount++;
      }
    }
    
    console.log('\n🎉 Import completed!');
    console.log(`✅ Successfully imported: ${successCount} properties`);
    console.log(`❌ Errors: ${errorCount}`);
    
    // Get summary statistics
    const { data: stats } = await supabase
      .from('properties')
      .select('source, location')
      .order('created_at', { ascending: false });
    
    if (stats) {
      const sourceStats = stats.reduce((acc, prop) => {
        acc[prop.source] = (acc[prop.source] || 0) + 1;
        return acc;
      }, {});
      
      const locationStats = stats.reduce((acc, prop) => {
        acc[prop.location] = (acc[prop.location] || 0) + 1;
        return acc;
      }, {});
      
      console.log('\n📊 Import Summary:');
      console.log('By Source:', sourceStats);
      console.log('By Location:', Object.fromEntries(
        Object.entries(locationStats).slice(0, 10)
      ));
    }
    
  } catch (error) {
    console.error('❌ Import failed:', error);
    process.exit(1);
  }
}

// Import comprehensive data structure
async function importComprehensiveData(data) {
  let successCount = 0;
  let errorCount = 0;

  try {
    // 1. Import Universities
    if (data.universities && data.universities.length > 0) {
      console.log('\n🏫 Importing universities...');

      for (const university of data.universities) {
        try {
          const { error } = await supabase
            .from('universities')
            .insert({
              name: university.university || university.location,
              location: university.location,
              rightmove_url: university.url,
              created_at: new Date().toISOString()
            });

          if (error) {
            console.warn('⚠️ Error inserting university:', error);
            errorCount++;
          } else {
            successCount++;
          }
        } catch (error) {
          console.warn('⚠️ Error processing university:', error);
          errorCount++;
        }
      }

      console.log(`✅ Universities imported: ${successCount}, errors: ${errorCount}`);
    }

    // 2. Import Properties
    if (data.properties && data.properties.length > 0) {
      console.log('\n🏠 Importing properties...');
      successCount = 0;
      errorCount = 0;

      for (const property of data.properties) {
        try {
          const normalizedProperty = normalizePropertyData(property, 'rightmove');

          if (!normalizedProperty) {
            console.warn('⚠️ Skipping invalid property');
            continue;
          }

          const { data: propertyRecord, error: propertyError } = await supabase
            .from('properties')
            .insert(normalizedProperty)
            .select()
            .single();

          if (propertyError) {
            console.warn('⚠️ Error inserting property:', propertyError);
            errorCount++;
            continue;
          }

          // Insert property images
          if (property.images && property.images.length > 0) {
            const images = property.images.map((img, index) => ({
              property_id: propertyRecord.id,
              image_url: img.image_url || img.srcUrl || img,
              alt_text: img.alt_text || img.caption || `Property image ${index + 1}`,
              is_primary: index === 0,
              image_order: index
            }));

            const { error: imagesError } = await supabase
              .from('property_images')
              .insert(images);

            if (imagesError) {
              console.warn('⚠️ Error inserting images:', imagesError);
            }
          }

          successCount++;

          if (successCount % 50 === 0) {
            console.log(`✅ Processed ${successCount} properties...`);
          }

        } catch (error) {
          console.warn('⚠️ Error processing property:', error);
          errorCount++;
        }
      }

      console.log(`✅ Properties imported: ${successCount}, errors: ${errorCount}`);
    }

    // 3. Import Guides
    if (data.guides && data.guides.length > 0) {
      console.log('\n📖 Importing guides...');
      successCount = 0;
      errorCount = 0;

      for (const guide of data.guides) {
        try {
          // Insert main guide
          const { data: guideRecord, error: guideError } = await supabase
            .from('guides')
            .insert({
              title: guide.title,
              guide_type: guide.type,
              source_url: guide.url,
              created_at: new Date().toISOString()
            })
            .select()
            .single();

          if (guideError) {
            console.warn('⚠️ Error inserting guide:', guideError);
            errorCount++;
            continue;
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
                  source_url: article.url,
                  created_at: new Date().toISOString()
                });

              if (articleError) {
                console.warn('⚠️ Error inserting article:', articleError);
              }
            }
          }

          successCount++;

        } catch (error) {
          console.warn('⚠️ Error processing guide:', error);
          errorCount++;
        }
      }

      console.log(`✅ Guides imported: ${successCount}, errors: ${errorCount}`);
    }

  } catch (error) {
    console.error('❌ Comprehensive import failed:', error);
  }
}

// Import basic data structure (fallback)
async function importBasicData(scrapedData) {
  // Use existing import logic for basic data
  let successCount = 0;
  let errorCount = 0;

  for (const item of scrapedData) {
    try {
      // Insert raw scraped data
      const { data: rawDataRecord, error: rawError } = await supabase
        .from('scraped_data')
        .insert({
          source: item.type || item.source || 'unknown',
          source_url: item.url || null,
          data_type: 'property',
          raw_data: item,
          processed: false
        })
        .select()
        .single();

      if (rawError) {
        console.warn('⚠️ Error inserting raw data:', JSON.stringify(rawError, null, 2));
        continue;
      }

      // Process as property if it has property-like data
      if (item.title || item.displayAddress || item.price) {
        const normalizedProperty = normalizePropertyData(item, item.type || 'scraped');

        if (normalizedProperty) {
          const { data: propertyRecord, error: propertyError } = await supabase
            .from('properties')
            .insert(normalizedProperty)
            .select()
            .single();

          if (propertyError) {
            console.warn('⚠️ Error inserting property:', propertyError);
            errorCount++;
            continue;
          }

          // Insert images
          const images = extractImages(item);
          if (images.length > 0) {
            const imagesWithPropertyId = images.map(img => ({
              ...img,
              property_id: propertyRecord.id
            }));

            const { error: imagesError } = await supabase
              .from('property_images')
              .insert(imagesWithPropertyId);

            if (imagesError) {
              console.warn('⚠️ Error inserting images:', imagesError);
            }
          }

          // Mark raw data as processed
          await supabase
            .from('scraped_data')
            .update({ processed: true, processed_at: new Date().toISOString() })
            .eq('id', rawDataRecord.id);

          successCount++;

          if (successCount % 10 === 0) {
            console.log(`✅ Processed ${successCount} properties...`);
          }
        }
      }

    } catch (error) {
      console.error('❌ Error processing item:', error);
      errorCount++;
    }
  }

  console.log('\n🎉 Basic import completed!');
  console.log(`✅ Successfully imported: ${successCount} properties`);
  console.log(`❌ Errors: ${errorCount}`);
}

// Run the import
importScrapedData();

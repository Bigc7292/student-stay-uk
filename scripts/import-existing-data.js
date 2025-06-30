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

// Extract property data from HTML content
function extractPropertyFromHTML(htmlContent, sourceUrl) {
  try {
    // Look for JSON data in script tags
    const jsonMatches = htmlContent.match(/<script[^>]*>([^<]*(?:properties|__NEXT_DATA__|__INITIAL_STATE__)[^<]*)<\/script>/gi);
    
    if (jsonMatches) {
      for (const match of jsonMatches) {
        try {
          // Extract JSON from script tag
          const jsonContent = match.replace(/<script[^>]*>/, '').replace(/<\/script>/, '');
          
          // Try to parse as JSON
          let data;
          if (jsonContent.includes('__NEXT_DATA__')) {
            const nextDataMatch = jsonContent.match(/__NEXT_DATA__[^>]*>([^<]+)</);
            if (nextDataMatch) {
              data = JSON.parse(nextDataMatch[1]);
            }
          } else if (jsonContent.includes('window.__INITIAL_STATE__')) {
            const stateMatch = jsonContent.match(/window\.__INITIAL_STATE__\s*=\s*({.+?});/);
            if (stateMatch) {
              data = JSON.parse(stateMatch[1]);
            }
          } else {
            data = JSON.parse(jsonContent);
          }
          
          // Extract properties from the data
          const properties = extractPropertiesFromJSON(data, sourceUrl);
          if (properties.length > 0) {
            return properties;
          }
        } catch (error) {
          // Continue to next match
        }
      }
    }
    
    // Fallback: Extract from HTML structure
    return extractPropertiesFromHTMLStructure(htmlContent, sourceUrl);
    
  } catch (error) {
    console.warn('⚠️ Error extracting from HTML:', error.message);
    return [];
  }
}

function extractPropertiesFromJSON(data, sourceUrl) {
  const properties = [];
  
  function findProperties(obj) {
    if (Array.isArray(obj)) {
      obj.forEach(item => findProperties(item));
    } else if (obj && typeof obj === 'object') {
      if (obj.properties && Array.isArray(obj.properties)) {
        obj.properties.forEach(prop => {
          if (prop.price && prop.title) {
            properties.push(normalizeProperty(prop, sourceUrl));
          }
        });
      }
      Object.values(obj).forEach(value => findProperties(value));
    }
  }
  
  findProperties(data);
  return properties;
}

function extractPropertiesFromHTMLStructure(htmlContent, sourceUrl) {
  // Extract basic property info from HTML patterns
  const properties = [];
  
  // Look for price patterns
  const priceMatches = htmlContent.match(/£[\d,]+\s*(pcm|pw|per week|per month)/gi) || [];
  
  if (priceMatches.length > 0) {
    // Extract location from URL
    const locationMatch = sourceUrl.match(/\/student-accommodation\/([^\/\.]+)/);
    const location = locationMatch ? locationMatch[1].replace(/([A-Z])/g, ' $1').trim() : 'Unknown';
    
    // Create a basic property entry
    properties.push({
      title: `Student Property in ${location}`,
      price: extractPriceValue(priceMatches[0]),
      price_type: extractPriceType(priceMatches[0]),
      location: location,
      bedrooms: 1,
      bathrooms: 1,
      property_type: 'flat',
      source: 'rightmove',
      source_url: sourceUrl,
      scraped_at: new Date().toISOString()
    });
  }
  
  return properties;
}

function normalizeProperty(rawProperty, sourceUrl) {
  // Extract price
  let price = 0;
  let priceType = 'weekly';
  
  if (rawProperty.price) {
    if (typeof rawProperty.price === 'object') {
      price = rawProperty.price.amount || 0;
      priceType = rawProperty.price.frequency || 'weekly';
    } else {
      price = parseFloat(rawProperty.price.toString().replace(/[£,]/g, '')) || 0;
    }
  }
  
  // Extract location
  let location = 'Unknown';
  if (rawProperty.displayAddress) {
    const addressParts = rawProperty.displayAddress.split(',');
    location = addressParts[addressParts.length - 2]?.trim() || addressParts[0]?.trim() || 'Unknown';
  } else if (sourceUrl) {
    const locationMatch = sourceUrl.match(/\/student-accommodation\/([^\/\.]+)/);
    if (locationMatch) {
      location = locationMatch[1].replace(/([A-Z])/g, ' $1').trim();
    }
  }
  
  return {
    title: rawProperty.title || rawProperty.summary || 'Student Property',
    price: price,
    price_type: priceType === 'monthly' ? 'monthly' : 'weekly',
    location: location,
    full_address: rawProperty.displayAddress || null,
    postcode: extractPostcode(rawProperty.displayAddress),
    bedrooms: rawProperty.bedrooms || 1,
    bathrooms: rawProperty.bathrooms || 1,
    property_type: rawProperty.propertySubType || rawProperty.propertyType || 'flat',
    furnished: true,
    available: true,
    description: rawProperty.summary || rawProperty.description || null,
    landlord_name: rawProperty.customer?.branchDisplayName || null,
    source: 'rightmove',
    source_url: rawProperty.propertyUrl ? `https://www.rightmove.co.uk${rawProperty.propertyUrl}` : sourceUrl,
    scraped_at: new Date().toISOString()
  };
}

function extractPriceValue(priceText) {
  const match = priceText.match(/£([\d,]+)/);
  return match ? parseFloat(match[1].replace(/,/g, '')) : 0;
}

function extractPriceType(priceText) {
  if (priceText.toLowerCase().includes('pcm') || priceText.toLowerCase().includes('month')) {
    return 'monthly';
  }
  return 'weekly';
}

function extractPostcode(address) {
  if (!address) return null;
  const postcodeMatch = address.match(/\b[A-Z]{1,2}[0-9][A-Z0-9]?\s?[0-9][A-Z]{2}\b/i);
  return postcodeMatch ? postcodeMatch[0] : null;
}

async function importExistingData() {
  try {
    console.log('🚀 Starting import of existing scraped data...');
    
    // Read the large scraped data file
    console.log('📖 Reading scraped_data.json...');
    const rawData = await fs.readFile(path.join(__dirname, '../scraped_data.json'), 'utf8');
    const scrapedData = JSON.parse(rawData);
    
    console.log(`📊 Found ${scrapedData.length} scraped items`);
    
    let successCount = 0;
    let errorCount = 0;
    let processedCount = 0;
    
    for (const item of scrapedData) {
      try {
        processedCount++;
        
        if (processedCount % 50 === 0) {
          console.log(`⏳ Processing item ${processedCount}/${scrapedData.length}...`);
        }
        
        // Extract properties from this item
        const properties = extractPropertyFromHTML(item.text || '', item.url);
        
        for (const property of properties) {
          try {
            // Insert property into database
            const { data: propertyRecord, error: propertyError } = await supabase
              .from('properties')
              .insert(property)
              .select()
              .single();
            
            if (propertyError) {
              console.warn('⚠️ Error inserting property:', propertyError.message);
              errorCount++;
              continue;
            }
            
            successCount++;
            
            if (successCount % 25 === 0) {
              console.log(`✅ Successfully imported ${successCount} properties...`);
            }
            
          } catch (error) {
            console.warn('⚠️ Error processing property:', error.message);
            errorCount++;
          }
        }
        
      } catch (error) {
        console.warn('⚠️ Error processing item:', error.message);
        errorCount++;
      }
    }
    
    console.log('\n🎉 Import completed!');
    console.log(`✅ Successfully imported: ${successCount} properties`);
    console.log(`❌ Errors: ${errorCount}`);
    console.log(`📊 Processed: ${processedCount} items`);
    
    // Get summary statistics
    const { data: stats } = await supabase
      .from('properties')
      .select('location, price, price_type')
      .order('created_at', { ascending: false });
    
    if (stats && stats.length > 0) {
      const locationStats = stats.reduce((acc, prop) => {
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
      
      const avgPrice = stats.reduce((sum, prop) => sum + (prop.price || 0), 0) / stats.length;
      console.log(`\n💰 Average price: £${avgPrice.toFixed(0)}`);
    }
    
  } catch (error) {
    console.error('❌ Import failed:', error);
    process.exit(1);
  }
}

// Run the import
importExistingData();

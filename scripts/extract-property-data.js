import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function extractPropertyData() {
  try {
    console.log('🔍 Extracting property data from scraped HTML...');
    
    // Read scraped data
    const scrapedDataPath = path.join(__dirname, '../scraped_data.json');
    const rawData = await fs.readFile(scrapedDataPath, 'utf8');
    const scrapedData = JSON.parse(rawData);
    
    console.log(`📊 Processing ${scrapedData.length} scraped items...`);
    
    const extractedProperties = [];
    
    for (let i = 0; i < scrapedData.length; i++) {
      const item = scrapedData[i];
      
      if (!item.text) continue;
      
      try {
        // Look for __NEXT_DATA__ script tag with JSON data
        const nextDataMatch = item.text.match(/<script id="__NEXT_DATA__"[^>]*>([^<]+)<\/script>/);
        
        if (nextDataMatch) {
          const jsonData = JSON.parse(nextDataMatch[1]);
          
          // Extract properties from the JSON structure
          if (jsonData.props && jsonData.props.pageProps && jsonData.props.pageProps.properties) {
            const properties = jsonData.props.pageProps.properties;
            
            console.log(`✅ Found ${properties.length} properties in item ${i} (${item.url})`);
            
            properties.forEach(property => {
              // Extract location from URL or property data
              let location = 'Unknown';
              if (item.url) {
                const urlMatch = item.url.match(/\/student-accommodation\/([^\/\.]+)/);
                if (urlMatch) {
                  location = urlMatch[1].replace(/([A-Z])/g, ' $1').trim();
                  location = location.charAt(0).toUpperCase() + location.slice(1);
                }
              }
              
              // Extract price information
              let price = 0;
              let priceType = 'weekly';
              
              if (property.price) {
                if (typeof property.price === 'object') {
                  price = property.price.amount || 0;
                  priceType = property.price.frequency || 'weekly';
                } else {
                  price = parseFloat(property.price.toString().replace(/[£,]/g, '')) || 0;
                }
              }
              
              // Normalize price type
              if (priceType === 'monthly') priceType = 'monthly';
              else if (priceType === 'yearly') priceType = 'yearly';
              else priceType = 'weekly';
              
              const extractedProperty = {
                title: property.title || property.summary || 'Property',
                price: price,
                price_type: priceType,
                location: property.displayAddress ? 
                  property.displayAddress.split(',')[property.displayAddress.split(',').length - 2]?.trim() || location : 
                  location,
                postcode: extractPostcode(property.displayAddress),
                bedrooms: property.bedrooms || 1,
                bathrooms: property.bathrooms || 1,
                property_type: property.propertySubType || property.propertyType || 'flat',
                furnished: property.furnished === true,
                available: property.available !== false,
                description: property.summary || property.description || null,
                landlord_name: property.customer?.branchDisplayName || property.customer?.brandTradingName || null,
                landlord_verified: property.customer?.hasBrandPlus === true,
                source: 'rightmove',
                source_url: property.propertyUrl ? `https://www.rightmove.co.uk${property.propertyUrl}` : item.url,
                images: extractImages(property),
                scraped_at: new Date().toISOString()
              };
              
              extractedProperties.push(extractedProperty);
            });
          }
        }
      } catch (error) {
        console.warn(`⚠️ Error processing item ${i}:`, error.message);
      }
    }
    
    console.log(`\n🎉 Extracted ${extractedProperties.length} properties total`);
    
    // Analyze locations
    const locationCounts = {};
    extractedProperties.forEach(prop => {
      locationCounts[prop.location] = (locationCounts[prop.location] || 0) + 1;
    });
    
    console.log('\n📍 Properties by location:');
    Object.entries(locationCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 15)
      .forEach(([location, count]) => {
        console.log(`  ${location}: ${count} properties`);
      });
    
    // Save extracted data
    const outputPath = path.join(__dirname, '../extracted_properties.json');
    await fs.writeFile(outputPath, JSON.stringify(extractedProperties, null, 2));
    console.log(`\n💾 Saved extracted properties to: ${outputPath}`);
    
    return extractedProperties;
    
  } catch (error) {
    console.error('❌ Extraction failed:', error);
  }
}

function extractPostcode(address) {
  if (!address) return null;
  
  // UK postcode pattern
  const postcodeMatch = address.match(/\b[A-Z]{1,2}[0-9][A-Z0-9]?\s?[0-9][A-Z]{2}\b/i);
  return postcodeMatch ? postcodeMatch[0] : null;
}

function extractImages(property) {
  const images = [];
  
  if (property.propertyImages && property.propertyImages.images) {
    property.propertyImages.images.forEach((img, index) => {
      if (img.srcUrl) {
        images.push({
          image_url: img.srcUrl,
          alt_text: img.caption || `Property image ${index + 1}`,
          is_primary: index === 0
        });
      }
    });
  }
  
  return images;
}

// Run the extraction
extractPropertyData();

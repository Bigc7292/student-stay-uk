import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class RealPropertyExtractor {
  constructor() {
    this.extractedProperties = [];
    this.universities = [];
    this.processedCount = 0;
  }

  async extractRealProperties() {
    try {
      console.log('🔍 Extracting REAL properties from scraped data...');
      
      const rawData = await fs.readFile(path.join(__dirname, '../scraped_data.json'), 'utf8');
      const scrapedData = JSON.parse(rawData);
      
      console.log(`📊 Processing ${scrapedData.length} scraped items...`);
      
      for (const item of scrapedData) {
        this.processedCount++;
        
        if (this.processedCount % 50 === 0) {
          console.log(`⏳ Processed ${this.processedCount}/${scrapedData.length} items...`);
        }
        
        if (item.text && item.url) {
          // Extract university info
          const university = this.extractUniversityFromURL(item.url);
          if (university) {
            this.universities.push(university);
          }
          
          // Try multiple extraction methods
          const properties = [
            ...this.extractFromJSONScripts(item.text, item.url),
            ...this.extractFromHTMLStructure(item.text, item.url),
            ...this.extractFromDataAttributes(item.text, item.url)
          ];
          
          // Add unique properties
          for (const property of properties) {
            if (this.isValidProperty(property)) {
              this.extractedProperties.push(property);
            }
          }
        }
      }
      
      // Remove duplicates
      this.removeDuplicates();
      
      // Save results
      await this.saveResults();
      
    } catch (error) {
      console.error('❌ Extraction failed:', error);
    }
  }

  extractFromJSONScripts(htmlContent, sourceUrl) {
    const properties = [];
    
    try {
      // Look for various JSON script patterns
      const jsonPatterns = [
        /<script[^>]*>.*?window\.__INITIAL_STATE__\s*=\s*({.+?});.*?<\/script>/gs,
        /<script[^>]*>.*?window\.APP_STATE\s*=\s*({.+?});.*?<\/script>/gs,
        /<script[^>]*>.*?window\.pageData\s*=\s*({.+?});.*?<\/script>/gs,
        /<script id="__NEXT_DATA__"[^>]*>([^<]+)<\/script>/g,
        /<script[^>]*>.*?({.*?"properties".*?:.*?\[.*?\].*?}).*?<\/script>/gs
      ];
      
      for (const pattern of jsonPatterns) {
        const matches = htmlContent.match(pattern);
        if (matches) {
          for (const match of matches) {
            try {
              let jsonStr = match.replace(/<script[^>]*>/, '').replace(/<\/script>/, '');
              
              // Clean up the JSON string
              if (jsonStr.includes('window.__INITIAL_STATE__')) {
                const stateMatch = jsonStr.match(/window\.__INITIAL_STATE__\s*=\s*({.+?});/);
                if (stateMatch) jsonStr = stateMatch[1];
              } else if (jsonStr.includes('window.APP_STATE')) {
                const stateMatch = jsonStr.match(/window\.APP_STATE\s*=\s*({.+?});/);
                if (stateMatch) jsonStr = stateMatch[1];
              }
              
              const data = JSON.parse(jsonStr);
              this.findPropertiesInObject(data, properties, sourceUrl);
              
            } catch (error) {
              // Continue to next match
            }
          }
        }
      }
    } catch (error) {
      console.warn('⚠️ Error extracting from JSON scripts:', error.message);
    }
    
    return properties;
  }

  extractFromHTMLStructure(htmlContent, sourceUrl) {
    const properties = [];
    
    try {
      // Look for property card patterns in HTML
      const propertyPatterns = [
        /<div[^>]*class="[^"]*property[^"]*"[^>]*>.*?<\/div>/gs,
        /<article[^>]*class="[^"]*property[^"]*"[^>]*>.*?<\/article>/gs,
        /<li[^>]*class="[^"]*property[^"]*"[^>]*>.*?<\/li>/gs,
        /<div[^>]*data-test="property[^"]*"[^>]*>.*?<\/div>/gs
      ];
      
      for (const pattern of propertyPatterns) {
        const matches = htmlContent.match(pattern);
        if (matches) {
          for (const match of matches) {
            const property = this.parsePropertyHTML(match, sourceUrl);
            if (property) {
              properties.push(property);
            }
          }
        }
      }
      
      // Also look for price and address patterns
      const priceAddressPattern = /£([\d,]+)\s*(?:pcm|pw|per week|per month).*?([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*,?\s*[A-Z]{1,2}\d{1,2})/gs;
      const matches = htmlContent.match(priceAddressPattern);
      
      if (matches) {
        matches.forEach((match, index) => {
          const priceMatch = match.match(/£([\d,]+)/);
          const addressMatch = match.match(/([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*,?\s*[A-Z]{1,2}\d{1,2})/);
          
          if (priceMatch && addressMatch) {
            const location = this.extractLocationFromURL(sourceUrl);
            properties.push({
              title: `Property in ${addressMatch[1]}`,
              price: parseFloat(priceMatch[1].replace(/,/g, '')),
              price_type: match.includes('pcm') || match.includes('month') ? 'monthly' : 'weekly',
              location: location,
              full_address: addressMatch[1],
              bedrooms: 1,
              bathrooms: 1,
              property_type: 'flat',
              furnished: true,
              available: true,
              source: 'rightmove',
              source_url: sourceUrl,
              scraped_at: new Date().toISOString()
            });
          }
        });
      }
      
    } catch (error) {
      console.warn('⚠️ Error extracting from HTML structure:', error.message);
    }
    
    return properties;
  }

  extractFromDataAttributes(htmlContent, sourceUrl) {
    const properties = [];
    
    try {
      // Look for data attributes that might contain property info
      const dataPatterns = [
        /data-property="([^"]+)"/g,
        /data-listing="([^"]+)"/g,
        /data-result="([^"]+)"/g
      ];
      
      for (const pattern of dataPatterns) {
        let match;
        while ((match = pattern.exec(htmlContent)) !== null) {
          try {
            const data = JSON.parse(match[1].replace(/&quot;/g, '"'));
            if (data.price && data.title) {
              properties.push(this.normalizeProperty(data, sourceUrl));
            }
          } catch (error) {
            // Continue to next match
          }
        }
      }
    } catch (error) {
      console.warn('⚠️ Error extracting from data attributes:', error.message);
    }
    
    return properties;
  }

  findPropertiesInObject(obj, properties, sourceUrl) {
    if (Array.isArray(obj)) {
      obj.forEach(item => this.findPropertiesInObject(item, properties, sourceUrl));
    } else if (obj && typeof obj === 'object') {
      // Look for properties array
      if (obj.properties && Array.isArray(obj.properties)) {
        obj.properties.forEach(prop => {
          if (prop.price && (prop.title || prop.summary || prop.displayAddress)) {
            properties.push(this.normalizeProperty(prop, sourceUrl));
          }
        });
      }
      
      // Look for individual property objects
      if (obj.price && (obj.title || obj.summary || obj.displayAddress)) {
        properties.push(this.normalizeProperty(obj, sourceUrl));
      }
      
      // Recursively search other properties
      Object.values(obj).forEach(value => this.findPropertiesInObject(value, properties, sourceUrl));
    }
  }

  parsePropertyHTML(htmlString, sourceUrl) {
    try {
      // Extract price
      const priceMatch = htmlString.match(/£([\d,]+)/);
      if (!priceMatch) return null;
      
      const price = parseFloat(priceMatch[1].replace(/,/g, ''));
      
      // Extract title/address
      const titleMatch = htmlString.match(/<h[1-6][^>]*>([^<]+)<\/h[1-6]>/) ||
                        htmlString.match(/class="[^"]*title[^"]*"[^>]*>([^<]+)</) ||
                        htmlString.match(/class="[^"]*address[^"]*"[^>]*>([^<]+)</);
      
      const title = titleMatch ? titleMatch[1].trim() : 'Property';
      
      // Extract bedrooms
      const bedroomMatch = htmlString.match(/(\d+)\s*bed/i);
      const bedrooms = bedroomMatch ? parseInt(bedroomMatch[1]) : 1;
      
      const location = this.extractLocationFromURL(sourceUrl);
      
      return {
        title: title,
        price: price,
        price_type: htmlString.includes('pcm') || htmlString.includes('month') ? 'monthly' : 'weekly',
        location: location,
        bedrooms: bedrooms,
        bathrooms: 1,
        property_type: 'flat',
        furnished: true,
        available: true,
        source: 'rightmove',
        source_url: sourceUrl,
        scraped_at: new Date().toISOString()
      };
      
    } catch (error) {
      return null;
    }
  }

  normalizeProperty(rawProperty, sourceUrl) {
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
    let location = this.extractLocationFromURL(sourceUrl);
    if (rawProperty.displayAddress) {
      const addressParts = rawProperty.displayAddress.split(',');
      location = addressParts[addressParts.length - 2]?.trim() || location;
    }
    
    return {
      title: rawProperty.title || rawProperty.summary || 'Property',
      price: price,
      price_type: priceType === 'monthly' ? 'monthly' : 'weekly',
      location: location,
      full_address: rawProperty.displayAddress || null,
      postcode: this.extractPostcode(rawProperty.displayAddress),
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

  extractLocationFromURL(url) {
    const locationMatch = url.match(/\/student-accommodation\/([^\/\.]+)/);
    if (locationMatch) {
      let location = locationMatch[1];
      // Clean up location name
      location = location.replace(/([A-Z])/g, ' $1').trim();
      location = location.charAt(0).toUpperCase() + location.slice(1);
      return location;
    }
    return 'Unknown';
  }

  extractUniversityFromURL(url) {
    const location = this.extractLocationFromURL(url);
    if (location !== 'Unknown') {
      return {
        name: location,
        location: location,
        rightmove_url: url
      };
    }
    return null;
  }

  extractPostcode(address) {
    if (!address) return null;
    const postcodeMatch = address.match(/\b[A-Z]{1,2}[0-9][A-Z0-9]?\s?[0-9][A-Z]{2}\b/i);
    return postcodeMatch ? postcodeMatch[0] : null;
  }

  isValidProperty(property) {
    return property && 
           property.price > 0 && 
           property.title && 
           property.location && 
           property.location !== 'Unknown' &&
           !property.location.includes('find');
  }

  removeDuplicates() {
    const seen = new Set();
    const uniqueProperties = [];
    
    for (const property of this.extractedProperties) {
      const key = `${property.title}-${property.location}-${property.price}-${property.full_address}`;
      if (!seen.has(key)) {
        seen.add(key);
        uniqueProperties.push(property);
      }
    }
    
    const duplicatesRemoved = this.extractedProperties.length - uniqueProperties.length;
    this.extractedProperties = uniqueProperties;
    
    console.log(`🗑️ Removed ${duplicatesRemoved} actual duplicates`);
  }

  async saveResults() {
    try {
      const results = {
        properties: this.extractedProperties,
        universities: [...new Map(this.universities.map(u => [u.name, u])).values()],
        metadata: {
          totalExtracted: this.extractedProperties.length,
          totalUniversities: this.universities.length,
          extractedAt: new Date().toISOString()
        }
      };
      
      const outputPath = path.join(__dirname, '../real_property_data.json');
      await fs.writeFile(outputPath, JSON.stringify(results, null, 2));
      
      console.log('\n🎉 Real property extraction completed!');
      console.log(`📊 Results:`);
      console.log(`  🏠 Real properties extracted: ${this.extractedProperties.length}`);
      console.log(`  🏫 Universities found: ${results.universities.length}`);
      console.log(`💾 Saved to: ${outputPath}`);
      
      // Show location breakdown
      const locationStats = {};
      this.extractedProperties.forEach(prop => {
        locationStats[prop.location] = (locationStats[prop.location] || 0) + 1;
      });
      
      console.log('\n📍 Real properties by location:');
      Object.entries(locationStats)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 15)
        .forEach(([location, count]) => {
          console.log(`  ${location}: ${count} properties`);
        });
      
    } catch (error) {
      console.error('❌ Error saving results:', error);
    }
  }
}

// Run the real property extraction
const extractor = new RealPropertyExtractor();
extractor.extractRealProperties();

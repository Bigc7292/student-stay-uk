import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class DataConsolidator {
  constructor() {
    this.consolidatedData = {
      properties: [],
      universities: [],
      guides: [],
      metadata: {
        totalSources: 0,
        processedItems: 0,
        extractedProperties: 0,
        duplicatesRemoved: 0,
        consolidatedAt: new Date().toISOString()
      }
    };
    this.seenProperties = new Set();
    this.seenUniversities = new Set();
  }

  async consolidateAllData() {
    console.log('🔄 Starting comprehensive data consolidation...');
    
    try {
      // 1. Process scraped_data.json (HTML content with embedded property data)
      await this.processScrapedData();
      
      // 2. Process comprehensive_scraped_data.json (universities and guides)
      await this.processComprehensiveData();
      
      // 3. Process enhanced_scraping_progress.json (additional universities)
      await this.processEnhancedProgress();
      
      // 4. Remove duplicates and clean data
      await this.cleanAndDeduplicateData();
      
      // 5. Save consolidated data
      await this.saveConsolidatedData();
      
    } catch (error) {
      console.error('❌ Consolidation failed:', error);
    }
  }

  async processScrapedData() {
    try {
      console.log('\n📖 Processing scraped_data.json...');
      
      const rawData = await fs.readFile(path.join(__dirname, '../scraped_data.json'), 'utf8');
      const scrapedData = JSON.parse(rawData);
      
      console.log(`📊 Found ${scrapedData.length} scraped items`);
      this.consolidatedData.metadata.totalSources++;
      
      let extractedCount = 0;
      
      for (const item of scrapedData) {
        this.consolidatedData.metadata.processedItems++;
        
        if (item.text && item.url) {
          // Extract properties from HTML content
          const properties = this.extractPropertiesFromHTML(item.text, item.url);
          
          for (const property of properties) {
            const propertyKey = `${property.title}-${property.location}-${property.price}`;
            
            if (!this.seenProperties.has(propertyKey)) {
              this.seenProperties.add(propertyKey);
              this.consolidatedData.properties.push(property);
              extractedCount++;
            } else {
              this.consolidatedData.metadata.duplicatesRemoved++;
            }
          }
          
          // Extract university info from URL
          const university = this.extractUniversityFromURL(item.url);
          if (university) {
            const universityKey = university.name.toLowerCase();
            if (!this.seenUniversities.has(universityKey)) {
              this.seenUniversities.add(universityKey);
              this.consolidatedData.universities.push(university);
            }
          }
        }
        
        if (extractedCount % 50 === 0 && extractedCount > 0) {
          console.log(`⏳ Extracted ${extractedCount} properties so far...`);
        }
      }
      
      console.log(`✅ Extracted ${extractedCount} properties from scraped_data.json`);
      this.consolidatedData.metadata.extractedProperties += extractedCount;
      
    } catch (error) {
      console.error('❌ Error processing scraped_data.json:', error.message);
    }
  }

  async processComprehensiveData() {
    try {
      console.log('\n📖 Processing comprehensive_scraped_data.json...');
      
      const rawData = await fs.readFile(path.join(__dirname, '../comprehensive_scraped_data.json'), 'utf8');
      const comprehensiveData = JSON.parse(rawData);
      
      this.consolidatedData.metadata.totalSources++;
      
      // Add universities
      if (comprehensiveData.universities) {
        for (const university of comprehensiveData.universities) {
          const universityKey = university.university.toLowerCase();
          if (!this.seenUniversities.has(universityKey)) {
            this.seenUniversities.add(universityKey);
            this.consolidatedData.universities.push({
              name: university.university,
              location: university.location,
              rightmove_url: university.url
            });
          }
        }
        console.log(`✅ Added ${comprehensiveData.universities.length} universities`);
      }
      
      // Add guides
      if (comprehensiveData.guides) {
        this.consolidatedData.guides.push(...comprehensiveData.guides);
        console.log(`✅ Added ${comprehensiveData.guides.length} guides`);
      }
      
      // Add any properties (though there might be none)
      if (comprehensiveData.properties && comprehensiveData.properties.length > 0) {
        for (const property of comprehensiveData.properties) {
          const propertyKey = `${property.title}-${property.location}-${property.price}`;
          if (!this.seenProperties.has(propertyKey)) {
            this.seenProperties.add(propertyKey);
            this.consolidatedData.properties.push(property);
          }
        }
        console.log(`✅ Added ${comprehensiveData.properties.length} properties`);
      }
      
    } catch (error) {
      console.error('❌ Error processing comprehensive_scraped_data.json:', error.message);
    }
  }

  async processEnhancedProgress() {
    try {
      console.log('\n📖 Processing enhanced_scraping_progress.json...');
      
      const rawData = await fs.readFile(path.join(__dirname, '../enhanced_scraping_progress.json'), 'utf8');
      const enhancedData = JSON.parse(rawData);
      
      this.consolidatedData.metadata.totalSources++;
      
      // Add universities
      if (enhancedData.universities) {
        let addedCount = 0;
        for (const university of enhancedData.universities) {
          const universityKey = university.university.toLowerCase();
          if (!this.seenUniversities.has(universityKey)) {
            this.seenUniversities.add(universityKey);
            this.consolidatedData.universities.push({
              name: university.university,
              location: university.location,
              rightmove_url: university.url
            });
            addedCount++;
          }
        }
        console.log(`✅ Added ${addedCount} new universities from enhanced progress`);
      }
      
      // Add any properties
      if (enhancedData.properties && enhancedData.properties.length > 0) {
        let addedCount = 0;
        for (const property of enhancedData.properties) {
          const propertyKey = `${property.title}-${property.location}-${property.price}`;
          if (!this.seenProperties.has(propertyKey)) {
            this.seenProperties.add(propertyKey);
            this.consolidatedData.properties.push(property);
            addedCount++;
          }
        }
        console.log(`✅ Added ${addedCount} properties from enhanced progress`);
      }
      
    } catch (error) {
      console.error('❌ Error processing enhanced_scraping_progress.json:', error.message);
    }
  }

  extractPropertiesFromHTML(htmlContent, sourceUrl) {
    const properties = [];
    
    try {
      // Method 1: Extract from JSON data in script tags
      const jsonProperties = this.extractFromJSONData(htmlContent, sourceUrl);
      properties.push(...jsonProperties);
      
      // Method 2: Extract from HTML patterns
      const htmlProperties = this.extractFromHTMLPatterns(htmlContent, sourceUrl);
      properties.push(...htmlProperties);
      
    } catch (error) {
      console.warn('⚠️ Error extracting properties from HTML:', error.message);
    }
    
    return properties;
  }

  extractFromJSONData(htmlContent, sourceUrl) {
    const properties = [];
    
    try {
      // Look for __NEXT_DATA__ script tags
      const nextDataMatches = htmlContent.match(/<script id="__NEXT_DATA__"[^>]*>([^<]+)<\/script>/g);
      
      if (nextDataMatches) {
        for (const match of nextDataMatches) {
          try {
            const jsonContent = match.replace(/<script[^>]*>/, '').replace(/<\/script>/, '');
            const data = JSON.parse(jsonContent);
            
            // Recursively search for properties in the JSON
            this.findPropertiesInJSON(data, properties, sourceUrl);
          } catch (error) {
            // Continue to next match
          }
        }
      }
      
      // Look for other JSON patterns
      const otherJsonMatches = htmlContent.match(/window\.__INITIAL_STATE__\s*=\s*({.+?});/g);
      
      if (otherJsonMatches) {
        for (const match of otherJsonMatches) {
          try {
            const jsonMatch = match.match(/({.+?})/);
            if (jsonMatch) {
              const data = JSON.parse(jsonMatch[1]);
              this.findPropertiesInJSON(data, properties, sourceUrl);
            }
          } catch (error) {
            // Continue to next match
          }
        }
      }
      
    } catch (error) {
      console.warn('⚠️ Error extracting from JSON data:', error.message);
    }
    
    return properties;
  }

  findPropertiesInJSON(obj, properties, sourceUrl) {
    if (Array.isArray(obj)) {
      obj.forEach(item => this.findPropertiesInJSON(item, properties, sourceUrl));
    } else if (obj && typeof obj === 'object') {
      if (obj.properties && Array.isArray(obj.properties)) {
        obj.properties.forEach(prop => {
          if (prop.price && (prop.title || prop.summary)) {
            properties.push(this.normalizeProperty(prop, sourceUrl));
          }
        });
      }
      Object.values(obj).forEach(value => this.findPropertiesInJSON(value, properties, sourceUrl));
    }
  }

  extractFromHTMLPatterns(htmlContent, sourceUrl) {
    const properties = [];
    
    try {
      // Extract location from URL
      const location = this.extractLocationFromURL(sourceUrl);
      
      // Look for price patterns in HTML
      const priceMatches = htmlContent.match(/£[\d,]+\s*(pcm|pw|per week|per month|\/week|\/month)/gi) || [];
      
      if (priceMatches.length > 0) {
        // Create basic property entries for each price found
        priceMatches.slice(0, 10).forEach((priceText, index) => { // Limit to 10 to avoid spam
          const price = this.extractPriceValue(priceText);
          const priceType = this.extractPriceType(priceText);
          
          if (price > 0) {
            properties.push({
              title: `Student Property ${index + 1} in ${location}`,
              price: price,
              price_type: priceType,
              location: location,
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
      console.warn('⚠️ Error extracting from HTML patterns:', error.message);
    }
    
    return properties;
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
      title: rawProperty.title || rawProperty.summary || 'Student Property',
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
      return locationMatch[1].replace(/([A-Z])/g, ' $1').trim();
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

  extractPriceValue(priceText) {
    const match = priceText.match(/£([\d,]+)/);
    return match ? parseFloat(match[1].replace(/,/g, '')) : 0;
  }

  extractPriceType(priceText) {
    const text = priceText.toLowerCase();
    if (text.includes('pcm') || text.includes('month')) {
      return 'monthly';
    }
    return 'weekly';
  }

  extractPostcode(address) {
    if (!address) return null;
    const postcodeMatch = address.match(/\b[A-Z]{1,2}[0-9][A-Z0-9]?\s?[0-9][A-Z]{2}\b/i);
    return postcodeMatch ? postcodeMatch[0] : null;
  }

  async cleanAndDeduplicateData() {
    console.log('\n🧹 Cleaning and deduplicating data...');
    
    // Remove properties with no price or invalid data
    const validProperties = this.consolidatedData.properties.filter(prop => 
      prop.price > 0 && 
      prop.title && 
      prop.location !== 'Unknown'
    );
    
    const removedCount = this.consolidatedData.properties.length - validProperties.length;
    this.consolidatedData.properties = validProperties;
    
    console.log(`✅ Removed ${removedCount} invalid properties`);
    console.log(`✅ Final property count: ${this.consolidatedData.properties.length}`);
    console.log(`✅ Final university count: ${this.consolidatedData.universities.length}`);
    console.log(`✅ Final guide count: ${this.consolidatedData.guides.length}`);
  }

  async saveConsolidatedData() {
    try {
      console.log('\n💾 Saving consolidated data...');
      
      const outputPath = path.join(__dirname, '../consolidated_property_data.json');
      await fs.writeFile(outputPath, JSON.stringify(this.consolidatedData, null, 2));
      
      console.log('\n🎉 Data consolidation completed!');
      console.log(`📊 Final Statistics:`);
      console.log(`  🏠 Properties: ${this.consolidatedData.properties.length}`);
      console.log(`  🏫 Universities: ${this.consolidatedData.universities.length}`);
      console.log(`  📖 Guides: ${this.consolidatedData.guides.length}`);
      console.log(`  📁 Sources processed: ${this.consolidatedData.metadata.totalSources}`);
      console.log(`  🔄 Items processed: ${this.consolidatedData.metadata.processedItems}`);
      console.log(`  🗑️ Duplicates removed: ${this.consolidatedData.metadata.duplicatesRemoved}`);
      console.log(`💾 Saved to: ${outputPath}`);
      
      // Show location breakdown
      const locationStats = {};
      this.consolidatedData.properties.forEach(prop => {
        locationStats[prop.location] = (locationStats[prop.location] || 0) + 1;
      });
      
      console.log('\n📍 Properties by location:');
      Object.entries(locationStats)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 15)
        .forEach(([location, count]) => {
          console.log(`  ${location}: ${count} properties`);
        });
      
    } catch (error) {
      console.error('❌ Error saving consolidated data:', error);
    }
  }
}

// Run the consolidation
const consolidator = new DataConsolidator();
consolidator.consolidateAllData();

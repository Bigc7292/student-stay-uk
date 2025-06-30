import axios from 'axios';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
import dotenv from 'dotenv';
dotenv.config({ path: path.join(__dirname, '../.env') });

class BrightDataTerminalScraper {
  constructor() {
    this.apiToken = process.env.BRIGHT_DATA_API_KEY;
    this.baseUrl = 'https://api.brightdata.com';
    
    if (!this.apiToken) {
      console.error('❌ BRIGHT_DATA_API_KEY not found in .env file');
      process.exit(1);
    }
    
    this.scrapedData = {
      properties: [],
      metadata: {
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        startTime: new Date().toISOString()
      }
    };
    
    // UK University cities for scraping
    this.universityCities = [
      'London', 'Manchester', 'Birmingham', 'Leeds', 'Liverpool', 
      'Sheffield', 'Newcastle', 'Bristol', 'Nottingham', 'Leicester',
      'Coventry', 'Bradford', 'Edinburgh', 'Glasgow', 'Cardiff',
      'Aberdeen', 'Bath', 'Norwich', 'Lincoln', 'Chester'
    ];
  }

  // Create scraping request payload according to Bright Data docs
  createScrapingRequest(city) {
    return {
      url: `https://www.rightmove.co.uk/student-accommodation/${city}.html`,
      format: 'json',
      country: 'GB',
      render: true,
      parse: true,
      parsing_instructions: {
        properties: {
          _parent: '.propertyCard, .l-searchResult, [data-test="property-result"]',
          _items: {
            title: {
              _parent: 'h2, .propertyCard-title, [data-test="property-title"]',
              _value: 'text'
            },
            price: {
              _parent: '.propertyCard-priceValue, [data-test="property-price"], .price',
              _value: 'text'
            },
            price_qualifier: {
              _parent: '.propertyCard-priceQualifier, .price-qualifier',
              _value: 'text'
            },
            address: {
              _parent: '.propertyCard-address, [data-test="property-address"]',
              _value: 'text'
            },
            bedrooms: {
              _parent: '[data-test="property-bedrooms"], .bedrooms',
              _value: 'text'
            },
            bathrooms: {
              _parent: '[data-test="property-bathrooms"], .bathrooms',
              _value: 'text'
            },
            property_type: {
              _parent: '.property-type, .propertyCard-type',
              _value: 'text'
            },
            agent: {
              _parent: '.propertyCard-contactsItem, .agent-name',
              _value: 'text'
            },
            property_url: {
              _parent: 'a[href*="/properties/"]',
              _value: 'href'
            },
            main_image: {
              _parent: '.propertyCard-img img, .property-image img',
              _value: 'src'
            },
            all_images: {
              _parent: 'img[src*="rightmove"]',
              _items: {
                image_url: {
                  _value: 'src'
                },
                alt_text: {
                  _value: 'alt'
                }
              }
            },
            description: {
              _parent: '.property-description, .propertyCard-description',
              _value: 'text'
            },
            features: {
              _parent: '.property-features li, .features li',
              _items: {
                feature: {
                  _value: 'text'
                }
              }
            },
            availability: {
              _parent: '.availability, .available-from',
              _value: 'text'
            },
            furnished: {
              _parent: '.furnished, .furnishing',
              _value: 'text'
            }
          }
        },
        page_info: {
          _parent: 'body',
          total_results: {
            _parent: '.searchHeader-resultCount, .results-count',
            _value: 'text'
          },
          location: {
            _parent: 'h1, .location-title',
            _value: 'text'
          }
        }
      }
    };
  }

  // Submit scraping request using Bright Data Web Scraper API
  async submitScrapingRequest(requestData) {
    try {
      console.log(`🔄 Submitting request for: ${requestData.url}`);

      // Use the correct Bright Data Web Scraper API endpoint
      const response = await axios.post(
        `${this.baseUrl}/dca/trigger`,
        {
          url: requestData.url,
          format: 'json',
          country: 'GB',
          render: true,
          parse: true,
          parsing_instructions: requestData.parsing_instructions
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiToken}`,
            'Content-Type': 'application/json'
          },
          timeout: 60000
        }
      );

      this.scrapedData.metadata.totalRequests++;

      if (response.status === 200 && response.data) {
        console.log(`✅ Request submitted for: ${requestData.url}`);

        // If we get a snapshot_id, we need to wait for results
        if (response.data.snapshot_id) {
          console.log(`⏳ Waiting for results (snapshot: ${response.data.snapshot_id})...`);
          const results = await this.waitForResults(response.data.snapshot_id);
          this.scrapedData.metadata.successfulRequests++;
          return results;
        } else if (response.data.length > 0) {
          // Direct results
          this.scrapedData.metadata.successfulRequests++;
          return response.data;
        } else {
          console.log(`⚠️ No data in response for: ${requestData.url}`);
          this.scrapedData.metadata.failedRequests++;
          return null;
        }
      } else {
        console.log(`⚠️ Unexpected response for: ${requestData.url}`);
        this.scrapedData.metadata.failedRequests++;
        return null;
      }

    } catch (error) {
      console.error(`❌ Error scraping ${requestData.url}:`, error.response?.data || error.message);
      this.scrapedData.metadata.failedRequests++;
      return null;
    }
  }

  // Wait for async scraping results
  async waitForResults(snapshotId, maxWaitTime = 120000) { // 2 minutes max
    const startTime = Date.now();
    const pollInterval = 10000; // 10 seconds

    while (Date.now() - startTime < maxWaitTime) {
      try {
        const response = await axios.get(
          `${this.baseUrl}/dca/snapshot/${snapshotId}`,
          {
            headers: {
              'Authorization': `Bearer ${this.apiToken}`
            },
            timeout: 30000
          }
        );

        if (response.data && response.data.length > 0) {
          console.log(`✅ Results ready for snapshot: ${snapshotId}`);
          return response.data;
        }

        console.log(`⏳ Still waiting for snapshot: ${snapshotId}...`);
        await new Promise(resolve => setTimeout(resolve, pollInterval));

      } catch (error) {
        if (error.response?.status === 404) {
          console.log(`⏳ Snapshot not ready yet: ${snapshotId}...`);
          await new Promise(resolve => setTimeout(resolve, pollInterval));
        } else {
          console.error(`❌ Error checking snapshot ${snapshotId}:`, error.message);
          break;
        }
      }
    }

    console.log(`⏰ Timeout waiting for snapshot: ${snapshotId}`);
    return null;
  }

  // Process and normalize scraped data
  processScrapedData(rawData, city) {
    const properties = [];
    
    try {
      if (!rawData || !Array.isArray(rawData)) {
        console.log(`⚠️ No valid data structure for ${city}`);
        return properties;
      }

      for (const item of rawData) {
        if (item.properties && Array.isArray(item.properties)) {
          for (const prop of item.properties) {
            const normalizedProperty = this.normalizeProperty(prop, city);
            if (normalizedProperty) {
              properties.push(normalizedProperty);
            }
          }
        }
      }

      console.log(`📊 Processed ${properties.length} properties for ${city}`);
      return properties;

    } catch (error) {
      console.error(`❌ Error processing data for ${city}:`, error.message);
      return properties;
    }
  }

  // Normalize individual property data
  normalizeProperty(rawProperty, city) {
    try {
      // Extract and clean price
      let price = 0;
      let priceType = 'weekly';

      if (rawProperty.price) {
        const priceText = rawProperty.price.toString();
        const priceMatch = priceText.match(/£?([0-9,]+)/);
        if (priceMatch) {
          price = parseFloat(priceMatch[1].replace(/,/g, ''));
        }

        if (priceText.includes('pcm') || priceText.includes('month') || 
            (rawProperty.price_qualifier && rawProperty.price_qualifier.includes('month'))) {
          priceType = 'monthly';
        }
      }

      // Skip properties with invalid prices
      if (price <= 0 || price > 10000) {
        return null;
      }

      // Extract bedrooms and bathrooms
      const bedrooms = parseInt(rawProperty.bedrooms?.match(/\d+/)?.[0]) || 1;
      const bathrooms = parseInt(rawProperty.bathrooms?.match(/\d+/)?.[0]) || 1;

      // Process images
      const images = [];
      
      // Add main image
      if (rawProperty.main_image) {
        let imageUrl = rawProperty.main_image;
        if (imageUrl.startsWith('//')) {
          imageUrl = 'https:' + imageUrl;
        } else if (imageUrl.startsWith('/')) {
          imageUrl = 'https://www.rightmove.co.uk' + imageUrl;
        }
        
        images.push({
          url: imageUrl,
          alt: 'Main property image',
          is_primary: true
        });
      }

      // Add additional images
      if (rawProperty.all_images && Array.isArray(rawProperty.all_images)) {
        rawProperty.all_images.forEach((img, index) => {
          if (img.image_url && !images.some(existing => existing.url === img.image_url)) {
            let imageUrl = img.image_url;
            if (imageUrl.startsWith('//')) {
              imageUrl = 'https:' + imageUrl;
            } else if (imageUrl.startsWith('/')) {
              imageUrl = 'https://www.rightmove.co.uk' + imageUrl;
            }
            
            images.push({
              url: imageUrl,
              alt: img.alt_text || `Property image ${index + 1}`,
              is_primary: false
            });
          }
        });
      }

      // Extract postcode from address
      let postcode = null;
      if (rawProperty.address) {
        const postcodeMatch = rawProperty.address.match(/\b[A-Z]{1,2}[0-9][A-Z0-9]?\s?[0-9][A-Z]{2}\b/i);
        if (postcodeMatch) {
          postcode = postcodeMatch[0];
        }
      }

      // Extract features
      const features = [];
      if (rawProperty.features && Array.isArray(rawProperty.features)) {
        rawProperty.features.forEach(feature => {
          if (feature.feature && feature.feature.trim()) {
            features.push(feature.feature.trim());
          }
        });
      }

      return {
        title: rawProperty.title || 'Student Property',
        price: price,
        price_type: priceType,
        location: city,
        full_address: rawProperty.address || null,
        postcode: postcode,
        bedrooms: bedrooms,
        bathrooms: bathrooms,
        property_type: rawProperty.property_type || 'flat',
        furnished: rawProperty.furnished ? rawProperty.furnished.toLowerCase().includes('furnished') : true,
        available: !rawProperty.availability?.toLowerCase().includes('let agreed'),
        description: rawProperty.description || null,
        landlord_name: rawProperty.agent || null,
        features: features,
        images: images,
        source: 'brightdata-rightmove',
        source_url: rawProperty.property_url ? `https://www.rightmove.co.uk${rawProperty.property_url}` : null,
        scraped_at: new Date().toISOString()
      };

    } catch (error) {
      console.warn('⚠️ Error normalizing property:', error.message);
      return null;
    }
  }

  // Main scraping function
  async scrapeAllCities() {
    console.log('🚀 Starting Bright Data terminal scraping...');
    console.log(`📊 Scraping ${this.universityCities.length} university cities`);
    console.log(`🔑 Using API token: ${this.apiToken.substring(0, 10)}...`);

    for (let i = 0; i < this.universityCities.length; i++) {
      const city = this.universityCities[i];
      console.log(`\n[${i + 1}/${this.universityCities.length}] 🏫 Scraping ${city}...`);

      try {
        // Create scraping request
        const requestData = this.createScrapingRequest(city);
        
        // Submit request to Bright Data
        const rawData = await this.submitScrapingRequest(requestData);
        
        if (rawData) {
          // Process the scraped data
          const properties = this.processScrapedData(rawData, city);
          
          // Add to our collection
          this.scrapedData.properties.push(...properties);
          
          console.log(`✅ ${city}: Added ${properties.length} properties`);
        } else {
          console.log(`❌ ${city}: No data received`);
        }

        // Respectful delay between requests (Bright Data handles rate limiting, but good practice)
        if (i < this.universityCities.length - 1) {
          console.log('⏳ Waiting 3 seconds before next request...');
          await new Promise(resolve => setTimeout(resolve, 3000));
        }

      } catch (error) {
        console.error(`❌ Error processing ${city}:`, error.message);
      }
    }

    // Save results
    await this.saveResults();
  }

  // Save results to file
  async saveResults() {
    try {
      this.scrapedData.metadata.endTime = new Date().toISOString();
      this.scrapedData.metadata.totalProperties = this.scrapedData.properties.length;
      
      const outputPath = path.join(__dirname, '../brightdata_terminal_results.json');
      await fs.writeFile(outputPath, JSON.stringify(this.scrapedData, null, 2));

      console.log('\n🎉 Bright Data terminal scraping completed!');
      console.log(`📊 Final Results:`);
      console.log(`  🏠 Total properties: ${this.scrapedData.properties.length}`);
      console.log(`  📡 Total requests: ${this.scrapedData.metadata.totalRequests}`);
      console.log(`  ✅ Successful requests: ${this.scrapedData.metadata.successfulRequests}`);
      console.log(`  ❌ Failed requests: ${this.scrapedData.metadata.failedRequests}`);
      console.log(`  📈 Success rate: ${((this.scrapedData.metadata.successfulRequests / this.scrapedData.metadata.totalRequests) * 100).toFixed(1)}%`);
      console.log(`💾 Data saved to: ${outputPath}`);

      // Show location breakdown
      const locationStats = {};
      this.scrapedData.properties.forEach(prop => {
        locationStats[prop.location] = (locationStats[prop.location] || 0) + 1;
      });

      console.log('\n📍 Properties by location:');
      Object.entries(locationStats)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .forEach(([location, count]) => {
          console.log(`  ${location}: ${count} properties`);
        });

      // Show sample properties
      if (this.scrapedData.properties.length > 0) {
        console.log('\n📋 Sample properties:');
        this.scrapedData.properties.slice(0, 3).forEach((prop, index) => {
          console.log(`  ${index + 1}. ${prop.title}`);
          console.log(`     Price: £${prop.price} ${prop.price_type}`);
          console.log(`     Location: ${prop.location}`);
          console.log(`     Images: ${prop.images.length}`);
          console.log(`     Postcode: ${prop.postcode || 'N/A'}`);
          console.log('');
        });
      }

    } catch (error) {
      console.error('❌ Error saving results:', error);
    }
  }
}

// Run the scraper
const scraper = new BrightDataTerminalScraper();
scraper.scrapeAllCities();

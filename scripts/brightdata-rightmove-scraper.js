import axios from 'axios';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
import dotenv from 'dotenv';
dotenv.config({ path: path.join(__dirname, '../.env') });

class BrightDataRightmoveScraper {
  constructor() {
    this.apiKey = process.env.BRIGHT_DATA_API_KEY || 'daf20140ecc930ba83243d2b1ec89e5e3f97d508176d7e318e6c17822f932fb2';
    this.datasetId = process.env.BRIGHT_DATA_DATASET_ID || 'gd_lnabksndfp1pegwzh';
    this.baseUrl = 'https://api.brightdata.com/datasets/v3';
    
    this.scrapedData = {
      properties: [],
      universities: [],
      totalProcessed: 0,
      metadata: {
        scrapedAt: new Date().toISOString(),
        source: 'brightdata-rightmove',
        apiVersion: 'v3'
      }
    };
    
    // UK University cities for comprehensive scraping
    this.universityCities = [
      'Aberdeen', 'Bath', 'Birmingham', 'Bradford', 'Brighton', 'Bristol',
      'Cambridge', 'Cardiff', 'Chester', 'Coventry', 'Derby', 'Dundee',
      'Durham', 'Edinburgh', 'Exeter', 'Glasgow', 'Hull', 'Lancaster',
      'Leeds', 'Leicester', 'Lincoln', 'Liverpool', 'London', 'Manchester',
      'Newcastle', 'Norwich', 'Nottingham', 'Oxford', 'Plymouth', 'Portsmouth',
      'Reading', 'Sheffield', 'Southampton', 'Stirling', 'Sunderland',
      'Swansea', 'Warwick', 'York'
    ];
  }

  // Bright Data API scraping configuration for Rightmove
  createScrapingJob(city) {
    return {
      "url": `https://www.rightmove.co.uk/student-accommodation/find.html?locationIdentifier=REGION%5E${city}&maxPrice=2000&minPrice=200&propertyTypes=&mustHave=&dontShow=&furnishTypes=&keywords=`,
      "country": "GB",
      "format": "json",
      "webhook": null,
      "sku": "rightmove_property_scraper",
      "discover": true,
      "parse": true,
      "render": true,
      "parsing_instructions": {
        "properties": {
          "_parent": ".propertyCard, .l-searchResult, [data-test='property-result']",
          "_items": {
            "title": {
              "_parent": "h2, .propertyCard-title, [data-test='property-title']",
              "_value": "text"
            },
            "price": {
              "_parent": ".propertyCard-priceValue, [data-test='property-price'], .price",
              "_value": "text"
            },
            "price_qualifier": {
              "_parent": ".propertyCard-priceQualifier, .price-qualifier",
              "_value": "text"
            },
            "address": {
              "_parent": ".propertyCard-address, [data-test='property-address'], .address",
              "_value": "text"
            },
            "bedrooms": {
              "_parent": "[data-test='property-bedrooms'], .bedrooms, .bed",
              "_value": "text"
            },
            "bathrooms": {
              "_parent": "[data-test='property-bathrooms'], .bathrooms, .bath",
              "_value": "text"
            },
            "property_type": {
              "_parent": ".property-type, .propertyCard-type",
              "_value": "text"
            },
            "agent": {
              "_parent": ".propertyCard-contactsItem, .agent-name",
              "_value": "text"
            },
            "property_url": {
              "_parent": "a",
              "_value": "href"
            },
            "images": {
              "_parent": "img",
              "_items": {
                "url": {
                  "_value": "src"
                },
                "alt": {
                  "_value": "alt"
                }
              }
            },
            "features": {
              "_parent": ".property-features li, .features li",
              "_items": {
                "feature": {
                  "_value": "text"
                }
              }
            },
            "description": {
              "_parent": ".property-description, .propertyCard-description",
              "_value": "text"
            },
            "added_date": {
              "_parent": ".propertyCard-branchSummary-addedOrReduced, .added-date",
              "_value": "text"
            },
            "floor_plan": {
              "_parent": ".floorplan img, [data-test='floorplan'] img",
              "_value": "src"
            }
          }
        },
        "pagination": {
          "_parent": ".pagination",
          "current_page": {
            "_parent": ".pagination-current",
            "_value": "text"
          },
          "total_pages": {
            "_parent": ".pagination-last",
            "_value": "text"
          },
          "next_page_url": {
            "_parent": ".pagination-next",
            "_value": "href"
          }
        },
        "search_results_count": {
          "_parent": ".searchHeader-resultCount, .results-count",
          "_value": "text"
        }
      }
    };
  }

  // Alternative scraping job for university-specific pages
  createUniversityPageJob(city) {
    return {
      "url": `https://www.rightmove.co.uk/student-accommodation/${city}.html`,
      "country": "GB",
      "format": "json",
      "webhook": null,
      "sku": "rightmove_university_scraper",
      "discover": true,
      "parse": true,
      "render": true,
      "parsing_instructions": {
        "properties": {
          "_parent": ".propertyCard, .l-searchResult, [data-test='property-result'], .property-item",
          "_items": {
            "title": {
              "_parent": "h2, h3, .propertyCard-title, [data-test='property-title'], .property-title",
              "_value": "text"
            },
            "price": {
              "_parent": ".propertyCard-priceValue, [data-test='property-price'], .price, .property-price",
              "_value": "text"
            },
            "price_frequency": {
              "_parent": ".propertyCard-priceQualifier, .price-qualifier, .price-frequency",
              "_value": "text"
            },
            "address": {
              "_parent": ".propertyCard-address, [data-test='property-address'], .address, .property-address",
              "_value": "text"
            },
            "bedrooms": {
              "_parent": "[data-test='property-bedrooms'], .bedrooms, .bed, .bedroom-count",
              "_value": "text"
            },
            "bathrooms": {
              "_parent": "[data-test='property-bathrooms'], .bathrooms, .bath, .bathroom-count",
              "_value": "text"
            },
            "property_type": {
              "_parent": ".property-type, .propertyCard-type, .type",
              "_value": "text"
            },
            "landlord": {
              "_parent": ".propertyCard-contactsItem, .agent-name, .landlord-name, .branch-name",
              "_value": "text"
            },
            "property_url": {
              "_parent": "a[href*='/properties/']",
              "_value": "href"
            },
            "main_image": {
              "_parent": ".propertyCard-img img, .property-image img, .main-image img",
              "_value": "src"
            },
            "all_images": {
              "_parent": "img[src*='rightmove'], img[src*='property']",
              "_items": {
                "image_url": {
                  "_value": "src"
                },
                "alt_text": {
                  "_value": "alt"
                }
              }
            },
            "features": {
              "_parent": ".property-features li, .features li, .amenities li",
              "_items": {
                "feature_text": {
                  "_value": "text"
                }
              }
            },
            "description": {
              "_parent": ".property-description, .propertyCard-description, .description",
              "_value": "text"
            },
            "availability": {
              "_parent": ".availability, .available-from, .let-agreed",
              "_value": "text"
            },
            "furnished_status": {
              "_parent": ".furnished, .furnishing",
              "_value": "text"
            },
            "energy_rating": {
              "_parent": ".energy-rating, .epc-rating",
              "_value": "text"
            },
            "council_tax_band": {
              "_parent": ".council-tax, .tax-band",
              "_value": "text"
            },
            "deposit": {
              "_parent": ".deposit, .security-deposit",
              "_value": "text"
            },
            "min_tenancy": {
              "_parent": ".min-tenancy, .minimum-term",
              "_value": "text"
            },
            "max_tenancy": {
              "_parent": ".max-tenancy, .maximum-term",
              "_value": "text"
            }
          }
        },
        "university_info": {
          "_parent": ".university-info, .location-info",
          "university_name": {
            "_parent": ".university-name, h1",
            "_value": "text"
          },
          "location": {
            "_parent": ".location, .area",
            "_value": "text"
          },
          "total_properties": {
            "_parent": ".property-count, .results-count",
            "_value": "text"
          }
        }
      }
    };
  }

  async submitScrapingJob(jobConfig) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/trigger`,
        jobConfig,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      );

      return response.data;
    } catch (error) {
      console.error('❌ Error submitting scraping job:', error.response?.data || error.message);
      throw error;
    }
  }

  async getJobResults(snapshotId) {
    try {
      const response = await axios.get(
        `${this.baseUrl}/snapshot/${snapshotId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`
          },
          timeout: 30000
        }
      );

      return response.data;
    } catch (error) {
      console.error('❌ Error getting job results:', error.response?.data || error.message);
      throw error;
    }
  }

  async waitForJobCompletion(snapshotId, maxWaitTime = 300000) { // 5 minutes max
    const startTime = Date.now();
    const pollInterval = 10000; // 10 seconds

    console.log(`⏳ Waiting for job ${snapshotId} to complete...`);

    while (Date.now() - startTime < maxWaitTime) {
      try {
        const status = await axios.get(
          `${this.baseUrl}/snapshot/${snapshotId}`,
          {
            headers: {
              'Authorization': `Bearer ${this.apiKey}`
            }
          }
        );

        const jobStatus = status.data.status;
        console.log(`📊 Job status: ${jobStatus}`);

        if (jobStatus === 'ready') {
          console.log('✅ Job completed successfully!');
          return await this.getJobResults(snapshotId);
        } else if (jobStatus === 'failed') {
          throw new Error('Job failed');
        }

        await new Promise(resolve => setTimeout(resolve, pollInterval));
      } catch (error) {
        console.warn('⚠️ Error checking job status:', error.message);
        await new Promise(resolve => setTimeout(resolve, pollInterval));
      }
    }

    throw new Error('Job timeout - exceeded maximum wait time');
  }

  normalizePropertyData(rawProperty, city) {
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

        if (priceText.includes('pcm') || priceText.includes('month')) {
          priceType = 'monthly';
        }
      }

      // Extract bedrooms and bathrooms
      const bedrooms = parseInt(rawProperty.bedrooms?.match(/\d+/)?.[0]) || 1;
      const bathrooms = parseInt(rawProperty.bathrooms?.match(/\d+/)?.[0]) || 1;

      // Process images
      const images = [];
      if (rawProperty.main_image) {
        images.push({
          url: rawProperty.main_image.startsWith('http') ? rawProperty.main_image : `https:${rawProperty.main_image}`,
          alt: 'Main property image',
          is_primary: true
        });
      }

      if (rawProperty.all_images && Array.isArray(rawProperty.all_images)) {
        rawProperty.all_images.forEach((img, index) => {
          if (img.image_url && !images.some(existing => existing.url === img.image_url)) {
            images.push({
              url: img.image_url.startsWith('http') ? img.image_url : `https:${img.image_url}`,
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
        furnished: rawProperty.furnished_status ? rawProperty.furnished_status.toLowerCase().includes('furnished') : true,
        available: !rawProperty.availability?.toLowerCase().includes('let agreed'),
        description: rawProperty.description || null,
        landlord_name: rawProperty.landlord || null,
        features: rawProperty.features?.map(f => f.feature_text).filter(Boolean) || [],
        images: images,
        energy_rating: rawProperty.energy_rating || null,
        council_tax_band: rawProperty.council_tax_band || null,
        deposit: rawProperty.deposit || null,
        min_tenancy: rawProperty.min_tenancy || null,
        max_tenancy: rawProperty.max_tenancy || null,
        source: 'brightdata-rightmove',
        source_url: rawProperty.property_url ? `https://www.rightmove.co.uk${rawProperty.property_url}` : null,
        scraped_at: new Date().toISOString()
      };
    } catch (error) {
      console.warn('⚠️ Error normalizing property data:', error.message);
      return null;
    }
  }

  async scrapeAllUniversityCities() {
    console.log('🚀 Starting comprehensive Bright Data Rightmove scraping...');
    console.log(`📊 Scraping ${this.universityCities.length} university cities`);

    let totalProperties = 0;
    let successfulCities = 0;
    let failedCities = 0;

    for (let i = 0; i < this.universityCities.length; i++) {
      const city = this.universityCities[i];
      console.log(`\n[${i + 1}/${this.universityCities.length}] 🏫 Scraping ${city}...`);

      try {
        // Try university-specific page first
        const universityJobConfig = this.createUniversityPageJob(city);
        const universityJob = await this.submitScrapingJob(universityJobConfig);
        
        if (universityJob.snapshot_id) {
          const universityResults = await this.waitForJobCompletion(universityJob.snapshot_id);
          
          if (universityResults && universityResults.length > 0) {
            const properties = universityResults
              .filter(item => item.properties && item.properties.length > 0)
              .flatMap(item => item.properties)
              .map(prop => this.normalizePropertyData(prop, city))
              .filter(Boolean);

            this.scrapedData.properties.push(...properties);
            totalProperties += properties.length;
            
            console.log(`✅ ${city}: Found ${properties.length} properties`);
            successfulCities++;
          } else {
            console.log(`⚠️ ${city}: No properties found on university page, trying search...`);
            
            // Fallback to search page
            const searchJobConfig = this.createScrapingJob(city);
            const searchJob = await this.submitScrapingJob(searchJobConfig);
            
            if (searchJob.snapshot_id) {
              const searchResults = await this.waitForJobCompletion(searchJob.snapshot_id);
              
              if (searchResults && searchResults.length > 0) {
                const properties = searchResults
                  .filter(item => item.properties && item.properties.length > 0)
                  .flatMap(item => item.properties)
                  .map(prop => this.normalizePropertyData(prop, city))
                  .filter(Boolean);

                this.scrapedData.properties.push(...properties);
                totalProperties += properties.length;
                
                console.log(`✅ ${city}: Found ${properties.length} properties via search`);
                successfulCities++;
              } else {
                console.log(`❌ ${city}: No properties found`);
                failedCities++;
              }
            }
          }
        }

        // Add university info
        this.scrapedData.universities.push({
          name: city,
          location: city,
          scraped_at: new Date().toISOString()
        });

        // Respectful delay between requests
        if (i < this.universityCities.length - 1) {
          console.log('⏳ Waiting 5 seconds before next city...');
          await new Promise(resolve => setTimeout(resolve, 5000));
        }

      } catch (error) {
        console.error(`❌ Error scraping ${city}:`, error.message);
        failedCities++;
      }
    }

    this.scrapedData.totalProcessed = this.universityCities.length;
    this.scrapedData.metadata.totalProperties = totalProperties;
    this.scrapedData.metadata.successfulCities = successfulCities;
    this.scrapedData.metadata.failedCities = failedCities;

    await this.saveResults();
  }

  async saveResults() {
    try {
      const outputPath = path.join(__dirname, '../brightdata_rightmove_complete.json');
      await fs.writeFile(outputPath, JSON.stringify(this.scrapedData, null, 2));

      console.log('\n🎉 Bright Data scraping completed!');
      console.log(`📊 Final Results:`);
      console.log(`  🏠 Total properties: ${this.scrapedData.properties.length}`);
      console.log(`  🏫 Universities processed: ${this.scrapedData.universities.length}`);
      console.log(`  ✅ Successful cities: ${this.scrapedData.metadata.successfulCities}`);
      console.log(`  ❌ Failed cities: ${this.scrapedData.metadata.failedCities}`);
      console.log(`💾 Data saved to: ${outputPath}`);

      // Show sample properties
      if (this.scrapedData.properties.length > 0) {
        console.log('\n📋 Sample properties:');
        this.scrapedData.properties.slice(0, 5).forEach((prop, index) => {
          console.log(`  ${index + 1}. ${prop.title}`);
          console.log(`     Price: £${prop.price} ${prop.price_type}`);
          console.log(`     Location: ${prop.location}`);
          console.log(`     Images: ${prop.images.length}`);
          console.log(`     Address: ${prop.full_address || 'N/A'}`);
          console.log('');
        });
      }

    } catch (error) {
      console.error('❌ Error saving results:', error);
    }
  }
}

// Export for use in other scripts
export { BrightDataRightmoveScraper };

// Run the Bright Data scraper if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const scraper = new BrightDataRightmoveScraper();
  scraper.scrapeAllUniversityCities();
}

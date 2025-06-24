import puppeteer from 'puppeteer';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class EnhancedRightmoveScraper {
  constructor() {
    this.browser = null;
    this.page = null;
    this.scrapedData = {
      properties: [],
      universities: [],
      guides: [],
      totalProcessed: 0
    };
    this.visitedUrls = new Set();
    this.delay = 3000; // 3 second delay
  }

  async init() {
    console.log('🚀 Initializing enhanced Rightmove scraper...');
    this.browser = await puppeteer.launch({
      headless: false, // Keep visible for debugging
      args: [
        '--no-sandbox', 
        '--disable-setuid-sandbox',
        '--disable-blink-features=AutomationControlled'
      ]
    });
    this.page = await this.browser.newPage();
    
    await this.page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    await this.page.setViewport({ width: 1920, height: 1080 });
  }

  async waitDelay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async handleCookies() {
    try {
      // Wait a bit for any cookie banners to appear
      await this.waitDelay(2000);
      
      // Try to find and click accept buttons
      const acceptClicked = await this.page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const acceptButton = buttons.find(button => {
          const text = button.textContent.toLowerCase();
          return text.includes('accept') || text.includes('agree') || text.includes('allow');
        });
        
        if (acceptButton) {
          acceptButton.click();
          return true;
        }
        return false;
      });
      
      if (acceptClicked) {
        console.log('🍪 Accepted cookies');
        await this.waitDelay(2000);
      }
    } catch (error) {
      console.log('⚠️ Cookie handling failed:', error.message);
    }
  }

  async scrapeUniversityList() {
    console.log('📚 Scraping university list...');
    
    try {
      await this.page.goto('https://www.rightmove.co.uk/student-accommodation/list-of-uk-universities.html', { 
        waitUntil: 'networkidle2',
        timeout: 30000 
      });
      
      await this.handleCookies();
      
      const universityLinks = await this.page.evaluate(() => {
        const links = [];
        const linkElements = document.querySelectorAll('a[href*="/student-accommodation/"]');
        
        linkElements.forEach(link => {
          const href = link.href;
          const text = link.textContent.trim();
          
          if (href && text && 
              !href.includes('find.html') && 
              !href.includes('list-of-uk-universities') &&
              !href.includes('guides') &&
              text.length > 2) {
            links.push({
              url: href,
              university: text.replace('Student accommodation in ', ''),
              location: text.replace('Student accommodation in ', '')
            });
          }
        });
        
        // Remove duplicates
        const uniqueLinks = [];
        const seenUrls = new Set();
        
        links.forEach(link => {
          if (!seenUrls.has(link.url)) {
            seenUrls.add(link.url);
            uniqueLinks.push(link);
          }
        });
        
        return uniqueLinks;
      });
      
      console.log(`✅ Found ${universityLinks.length} universities`);
      this.scrapedData.universities = universityLinks;
      
      return universityLinks;
      
    } catch (error) {
      console.error('❌ Error scraping university list:', error);
      return [];
    }
  }

  async scrapeUniversityProperties(universityUrl, universityName) {
    console.log(`🏠 Scraping properties for ${universityName}...`);
    
    if (this.visitedUrls.has(universityUrl)) {
      console.log(`⏭️ Already visited ${universityUrl}`);
      return [];
    }
    
    this.visitedUrls.add(universityUrl);
    
    try {
      await this.page.goto(universityUrl, { waitUntil: 'networkidle2', timeout: 30000 });
      await this.handleCookies();
      await this.waitDelay(3000);
      
      // Check if this is a search page that needs interaction
      const isSearchPage = await this.page.evaluate(() => {
        return document.body.textContent.includes('search for student accommodation') ||
               document.querySelector('input[type="search"]') !== null ||
               document.querySelector('.search-form') !== null ||
               document.querySelector('[data-test="search-button"]') !== null;
      });
      
      if (isSearchPage) {
        console.log('🔍 This is a search page, performing search...');
        await this.performSearch(universityName);
      }
      
      // Extract properties from the current page
      const properties = await this.extractPropertiesFromPage(universityName);
      
      // Try to load more results if pagination exists
      await this.loadMoreResults();
      
      // Extract again after loading more
      const moreProperties = await this.extractPropertiesFromPage(universityName);
      
      const allProperties = [...properties, ...moreProperties];
      const uniqueProperties = this.removeDuplicateProperties(allProperties);
      
      console.log(`✅ Found ${uniqueProperties.length} properties for ${universityName}`);
      return uniqueProperties;
      
    } catch (error) {
      console.error(`❌ Error scraping ${universityName}:`, error);
      return [];
    }
  }

  async performSearch(universityName) {
    try {
      // Try to find and fill search input
      const searchInput = await this.page.$('input[type="search"], input[name="searchLocation"], #searchLocation');
      if (searchInput) {
        await searchInput.click();
        await searchInput.type(universityName);
        await this.waitDelay(1000);
        
        // Try to click search button
        const searchButton = await this.page.$('button[type="submit"], [data-test="search-button"], .search-button');
        if (searchButton) {
          await searchButton.click();
          await this.waitDelay(3000);
          console.log('🔍 Search performed');
        }
      }
    } catch (error) {
      console.log('⚠️ Search interaction failed:', error.message);
    }
  }

  async loadMoreResults() {
    try {
      // Try to find and click "Load more" or pagination buttons
      const loadMoreButton = await this.page.$('button:contains("Load more"), .load-more, .pagination-next');
      if (loadMoreButton) {
        await loadMoreButton.click();
        await this.waitDelay(3000);
        console.log('📄 Loaded more results');
      }
    } catch (error) {
      // No more results to load
    }
  }

  async extractPropertiesFromPage(universityName) {
    return await this.page.evaluate((university) => {
      const properties = [];
      
      // Multiple selectors to try for property listings
      const propertySelectors = [
        '.propertyCard',
        '.property-result',
        '.search-result',
        '.l-searchResult',
        '[data-test="property-result"]',
        '.propertyCard-wrapper',
        '.property-item',
        '.listing-result'
      ];
      
      let propertyElements = [];
      
      // Try each selector until we find properties
      for (const selector of propertySelectors) {
        propertyElements = document.querySelectorAll(selector);
        if (propertyElements.length > 0) {
          break;
        }
      }
      
      propertyElements.forEach((element, index) => {
        try {
          // Extract property details with multiple fallback selectors
          const extractText = (selectors) => {
            for (const selector of selectors) {
              const el = element.querySelector(selector);
              if (el && el.textContent.trim()) {
                return el.textContent.trim();
              }
            }
            return '';
          };
          
          const extractAttribute = (selectors, attribute) => {
            for (const selector of selectors) {
              const el = element.querySelector(selector);
              if (el && el.getAttribute(attribute)) {
                return el.getAttribute(attribute);
              }
            }
            return '';
          };
          
          // Property title
          const title = extractText([
            'h2', 'h3', '.propertyCard-title', '[data-test="property-title"]', 
            '.property-title', '.search-result-title', '.listing-title'
          ]);
          
          // Property price (often in bottom corner of image or separate price element)
          const price = extractText([
            '.propertyCard-priceValue', '[data-test="property-price"]', '.price', 
            '.property-price', '.search-result-price', '.listing-price',
            '.price-qualifier', '.propertyCard-price', '.price-text'
          ]);
          
          // Property address
          const address = extractText([
            '.propertyCard-address', '[data-test="property-address"]', '.address', 
            '.property-address', '.search-result-address', '.listing-address'
          ]);
          
          // Bedrooms
          const bedroomsText = extractText([
            '[data-test="property-bedrooms"]', '.bedrooms', '.property-bedrooms', 
            '.bed', '.bedroom-count', '.beds'
          ]);
          const bedrooms = parseInt(bedroomsText) || 1;
          
          // Bathrooms
          const bathroomsText = extractText([
            '[data-test="property-bathrooms"]', '.bathrooms', '.property-bathrooms', 
            '.bath', '.bathroom-count', '.baths'
          ]);
          const bathrooms = parseInt(bathroomsText) || 1;
          
          // Property type
          const propertyType = extractText([
            '.property-type', '.propertyCard-type', '.listing-type'
          ]) || 'flat';
          
          // Images
          const images = [];
          const imageElements = element.querySelectorAll('img');
          imageElements.forEach((img, imgIndex) => {
            if (img.src && img.src.startsWith('http')) {
              images.push({
                url: img.src,
                alt: img.alt || `Property image ${imgIndex + 1}`
              });
            }
          });
          
          // Property URL
          const propertyUrl = extractAttribute(['a'], 'href');
          
          // Only add if we have meaningful data
          if (title || price || address) {
            const property = {
              title: title || `Property ${index + 1}`,
              price: price,
              address: address,
              bedrooms: bedrooms,
              bathrooms: bathrooms,
              property_type: propertyType,
              images: images,
              property_url: propertyUrl ? (propertyUrl.startsWith('http') ? propertyUrl : `https://www.rightmove.co.uk${propertyUrl}`) : null,
              university: university,
              location: university,
              scraped_at: new Date().toISOString()
            };
            
            properties.push(property);
          }
          
        } catch (error) {
          console.warn('Error extracting property:', error);
        }
      });
      
      return properties;
    }, universityName);
  }

  removeDuplicateProperties(properties) {
    const seen = new Set();
    return properties.filter(property => {
      const key = `${property.title}-${property.address}-${property.price}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  async scrapeAll() {
    try {
      await this.init();
      
      // 1. Get university list
      const universities = await this.scrapeUniversityList();
      
      if (universities.length === 0) {
        console.log('❌ No universities found');
        return;
      }
      
      // 2. Scrape properties for each university
      console.log(`\n🏫 Starting to scrape ${universities.length} universities...`);
      
      for (let i = 0; i < universities.length; i++) {
        const university = universities[i];
        console.log(`\n[${i + 1}/${universities.length}] Processing ${university.university}...`);
        
        const properties = await this.scrapeUniversityProperties(university.url, university.university);
        this.scrapedData.properties.push(...properties);
        this.scrapedData.totalProcessed++;
        
        // Save progress every 5 universities
        if ((i + 1) % 5 === 0) {
          await this.saveProgress();
        }
        
        // Respectful delay between universities
        await this.waitDelay(this.delay);
      }
      
      // 3. Save final results
      await this.saveFinalResults();
      
    } catch (error) {
      console.error('❌ Scraping failed:', error);
    } finally {
      if (this.browser) {
        await this.browser.close();
      }
    }
  }

  async saveProgress() {
    const progressPath = path.join(__dirname, '../enhanced_scraping_progress.json');
    await fs.writeFile(progressPath, JSON.stringify(this.scrapedData, null, 2));
    console.log(`💾 Progress saved: ${this.scrapedData.properties.length} properties from ${this.scrapedData.totalProcessed} universities`);
  }

  async saveFinalResults() {
    const outputPath = path.join(__dirname, '../enhanced_scraped_data.json');
    await fs.writeFile(outputPath, JSON.stringify(this.scrapedData, null, 2));
    
    console.log('\n🎉 Enhanced scraping completed!');
    console.log(`📊 Total properties: ${this.scrapedData.properties.length}`);
    console.log(`🏫 Total universities: ${this.scrapedData.universities.length}`);
    console.log(`💾 Data saved to: ${outputPath}`);
    
    // Show summary by location
    const locationCounts = {};
    this.scrapedData.properties.forEach(prop => {
      locationCounts[prop.location] = (locationCounts[prop.location] || 0) + 1;
    });
    
    console.log('\n📍 Properties by location:');
    Object.entries(locationCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .forEach(([location, count]) => {
        console.log(`  ${location}: ${count} properties`);
      });
  }
}

// Run the enhanced scraper
const scraper = new EnhancedRightmoveScraper();
scraper.scrapeAll();

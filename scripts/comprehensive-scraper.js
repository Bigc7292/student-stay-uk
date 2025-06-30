import { promises as fs } from 'fs';
import path from 'path';
import puppeteer from 'puppeteer';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class ComprehensiveRightmoveScraper {
  constructor() {
    this.browser = null;
    this.page = null;
    this.scrapedData = {
      properties: [],
      universities: [],
      guides: [],
      rentalInfo: []
    };
    this.visitedUrls = new Set();
    this.maxRetries = 3;
    this.delay = 2000; // 2 second delay between requests
  }

  async init() {
    console.log('🚀 Initializing comprehensive Rightmove scraper...');
    this.browser = await puppeteer.launch({
      headless: false, // Set to true for production
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-blink-features=AutomationControlled',
        '--disable-features=VizDisplayCompositor'
      ]
    });
    this.page = await this.browser.newPage();

    // Set user agent to avoid detection
    await this.page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    // Set viewport
    await this.page.setViewport({ width: 1920, height: 1080 });

    // Remove webdriver property
    await this.page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'webdriver', {
        get: () => undefined,
      });
    });
  }

  async handleCookieConsent() {
    try {
      // Wait for cookie banner and accept cookies
      await this.page.waitForSelector('button', { timeout: 5000 });

      // Try different cookie consent button selectors
      const cookieSelectors = [
        'button[data-test="accept-all-cookies"]',
        'button:contains("Accept all")',
        'button:contains("Accept All")',
        'button:contains("ACCEPT ALL")',
        '#onetrust-accept-btn-handler',
        '.onetrust-close-btn-handler',
        '[id*="accept"]',
        '[class*="accept"]'
      ];

      for (const selector of cookieSelectors) {
        try {
          const button = await this.page.$(selector);
          if (button) {
            console.log('🍪 Accepting cookies...');
            await button.click();
            await this.waitDelay(2000);
            return true;
          }
        } catch (error) {
          // Continue to next selector
        }
      }

      // Try clicking any button that contains "Accept"
      const acceptButton = await this.page.evaluateHandle(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        return buttons.find(button =>
          button.textContent.toLowerCase().includes('accept') ||
          button.textContent.toLowerCase().includes('agree')
        );
      });

      if (acceptButton.asElement()) {
        console.log('🍪 Found and clicking accept button...');
        await acceptButton.asElement().click();
        await this.waitDelay(2000);
        return true;
      }

      console.log('⚠️ No cookie consent button found');
      return false;

    } catch (error) {
      console.log('⚠️ Cookie consent handling failed:', error.message);
      return false;
    }
  }

  async waitDelay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async scrapeUniversityList() {
    console.log('📚 Scraping university list...');
    
    const universityListUrl = 'https://www.rightmove.co.uk/student-accommodation/list-of-uk-universities.html';
    
    try {
      await this.page.goto(universityListUrl, { waitUntil: 'networkidle2' });
      await this.waitDelay(this.delay);

      // Handle cookie consent
      await this.handleCookieConsent();

      // Extract university links
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
              university: text,
              location: text
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
      
      console.log(`✅ Found ${universityLinks.length} university links`);
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
      await this.page.goto(universityUrl, { waitUntil: 'networkidle2' });
      await this.waitDelay(this.delay);

      // Handle cookie consent
      await this.handleCookieConsent();

      // Wait for content to load
      await this.waitDelay(3000);

      // Extract property data from the page
      const properties = await this.page.evaluate((university) => {
        const extractedProperties = [];

        // Multiple selectors to try for property listings
        const propertySelectors = [
          '[data-test="property-result"]',
          '.propertyCard',
          '.property-result',
          '.search-result',
          '.l-searchResult',
          '.propertyCard-wrapper'
        ];

        let propertyElements = [];

        // Try each selector until we find properties
        for (const selector of propertySelectors) {
          propertyElements = document.querySelectorAll(selector);
          if (propertyElements.length > 0) {
            console.log(`Found ${propertyElements.length} properties with selector: ${selector}`);
            break;
          }
        }

        if (propertyElements.length === 0) {
          // Try to find any elements that might contain property data
          propertyElements = document.querySelectorAll('[class*="property"], [class*="result"], [data-test*="property"]');
          console.log(`Fallback: Found ${propertyElements.length} potential property elements`);
        }

        propertyElements.forEach((element, index) => {
          try {
            // Multiple selectors for each property field
            const titleSelectors = ['h2', 'h3', '.propertyCard-title', '[data-test="property-title"]', '.property-title', '.search-result-title'];
            const priceSelectors = ['.propertyCard-priceValue', '[data-test="property-price"]', '.price', '.property-price', '.search-result-price'];
            const addressSelectors = ['.propertyCard-address', '[data-test="property-address"]', '.address', '.property-address', '.search-result-address'];
            const bedroomSelectors = ['[data-test="property-bedrooms"]', '.bedrooms', '.property-bedrooms', '.bed'];
            const bathroomSelectors = ['[data-test="property-bathrooms"]', '.bathrooms', '.property-bathrooms', '.bath'];
            const imageSelectors = ['img', '.property-image img', '.propertyCard-img img'];
            const linkSelectors = ['a[href*="/properties/"]', 'a[href*="/property/"]', 'a'];

            // Helper function to find element by multiple selectors
            const findElement = (selectors) => {
              for (const selector of selectors) {
                const el = element.querySelector(selector);
                if (el) return el;
              }
              return null;
            };

            const titleElement = findElement(titleSelectors);
            const priceElement = findElement(priceSelectors);
            const addressElement = findElement(addressSelectors);
            const bedroomsElement = findElement(bedroomSelectors);
            const bathroomsElement = findElement(bathroomSelectors);
            const imageElement = findElement(imageSelectors);
            const linkElement = findElement(linkSelectors);

            // Extract text content safely
            const title = titleElement ? titleElement.textContent.trim() : `Property ${index + 1}`;
            const price = priceElement ? priceElement.textContent.trim() : '';
            const address = addressElement ? addressElement.textContent.trim() : '';

            // Only add if we have at least a title or price
            if (title || price) {
              const property = {
                title: title,
                price: price,
                address: address,
                bedrooms: bedroomsElement ? parseInt(bedroomsElement.textContent) || 1 : 1,
                bathrooms: bathroomsElement ? parseInt(bathroomsElement.textContent) || 1 : 1,
                image: imageElement ? imageElement.src : null,
                propertyUrl: linkElement ? linkElement.href : null,
                university: university,
                location: university,
                scraped_at: new Date().toISOString()
              };

              extractedProperties.push(property);
            }
          } catch (error) {
            console.warn('Error extracting property:', error);
          }
        });
        
        // Also try to extract from JSON data if available
        const scriptElements = document.querySelectorAll('script');
        scriptElements.forEach(script => {
          if (script.textContent.includes('window.__INITIAL_STATE__') || script.textContent.includes('__NEXT_DATA__')) {
            try {
              let jsonMatch = script.textContent.match(/window\.__INITIAL_STATE__\s*=\s*({.+?});/) ||
                             script.textContent.match(/__NEXT_DATA__[^>]*>([^<]+)</);
              
              if (jsonMatch) {
                const data = JSON.parse(jsonMatch[1]);
                
                // Extract properties from various possible structures
                const findProperties = (obj) => {
                  if (Array.isArray(obj)) {
                    obj.forEach(item => findProperties(item));
                  } else if (obj && typeof obj === 'object') {
                    if (obj.properties && Array.isArray(obj.properties)) {
                      obj.properties.forEach(prop => {
                        if (prop.price && prop.title) {
                          extractedProperties.push({
                            title: prop.title || prop.summary || 'Property',
                            price: prop.price.amount || prop.price,
                            price_type: prop.price.frequency || 'weekly',
                            address: prop.displayAddress || '',
                            bedrooms: prop.bedrooms || 1,
                            bathrooms: prop.bathrooms || 1,
                            property_type: prop.propertySubType || 'flat',
                            images: prop.propertyImages?.images || [],
                            propertyUrl: prop.propertyUrl,
                            university: university,
                            location: university,
                            scraped_at: new Date().toISOString()
                          });
                        }
                      });
                    }
                    Object.values(obj).forEach(value => findProperties(value));
                  }
                };
                
                findProperties(data);
              }
            } catch (error) {
              // Ignore JSON parsing errors
            }
          }
        });
        
        return extractedProperties;
      }, universityName);
      
      console.log(`✅ Found ${properties.length} properties for ${universityName}`);
      return properties;
      
    } catch (error) {
      console.error(`❌ Error scraping ${universityName}:`, error);
      return [];
    }
  }

  async scrapeGuides() {
    console.log('📖 Scraping rental and student guides...');
    
    const guideUrls = [
      {
        url: 'https://www.rightmove.co.uk/guides/renter/',
        type: 'rental_guide',
        title: 'Renter Guides'
      },
      {
        url: 'https://www.rightmove.co.uk/guides/student/',
        type: 'student_guide', 
        title: 'Student Guides'
      }
    ];
    
    for (const guide of guideUrls) {
      try {
        console.log(`📄 Scraping ${guide.title}...`);
        
        await this.page.goto(guide.url, { waitUntil: 'networkidle2' });
        await this.waitDelay(this.delay);

        // Handle cookie consent
        await this.handleCookieConsent();
        
        const guideData = await this.page.evaluate((guideInfo) => {
          const articles = [];
          
          // Extract guide articles
          const articleElements = document.querySelectorAll('article, .guide-item, .content-item');
          
          articleElements.forEach(element => {
            const titleElement = element.querySelector('h1, h2, h3, .title');
            const contentElement = element.querySelector('.content, .description, p');
            const linkElement = element.querySelector('a');
            
            if (titleElement) {
              articles.push({
                title: titleElement.textContent.trim(),
                content: contentElement ? contentElement.textContent.trim() : '',
                url: linkElement ? linkElement.href : null,
                type: guideInfo.type,
                scraped_at: new Date().toISOString()
              });
            }
          });
          
          return {
            type: guideInfo.type,
            title: guideInfo.title,
            url: guideInfo.url,
            articles: articles,
            scraped_at: new Date().toISOString()
          };
        }, guide);
        
        this.scrapedData.guides.push(guideData);
        console.log(`✅ Scraped ${guideData.articles.length} articles from ${guide.title}`);
        
      } catch (error) {
        console.error(`❌ Error scraping ${guide.title}:`, error);
      }
    }
  }

  async scrapeAll() {
    try {
      await this.init();
      
      // 1. Scrape university list
      const universities = await this.scrapeUniversityList();
      
      // 2. Scrape properties for each university
      console.log(`\n🏫 Starting to scrape ${universities.length} universities...`);
      
      for (let i = 0; i < universities.length; i++) {
        const university = universities[i];
        console.log(`\n[${i + 1}/${universities.length}] Processing ${university.university}...`);
        
        const properties = await this.scrapeUniversityProperties(university.url, university.university);
        this.scrapedData.properties.push(...properties);
        
        // Save progress every 10 universities
        if ((i + 1) % 10 === 0) {
          await this.saveProgress();
        }
        
        // Delay between universities to be respectful
        await this.waitDelay(this.delay);
      }
      
      // 3. Scrape guides
      await this.scrapeGuides();
      
      // 4. Save final results
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
    const progressPath = path.join(__dirname, '../scraping_progress.json');
    await fs.writeFile(progressPath, JSON.stringify(this.scrapedData, null, 2));
    console.log(`💾 Progress saved: ${this.scrapedData.properties.length} properties so far`);
  }

  async saveFinalResults() {
    const outputPath = path.join(__dirname, '../comprehensive_scraped_data.json');
    await fs.writeFile(outputPath, JSON.stringify(this.scrapedData, null, 2));
    
    console.log('\n🎉 Scraping completed!');
    console.log(`📊 Total properties: ${this.scrapedData.properties.length}`);
    console.log(`🏫 Total universities: ${this.scrapedData.universities.length}`);
    console.log(`📖 Total guides: ${this.scrapedData.guides.length}`);
    console.log(`💾 Data saved to: ${outputPath}`);
  }
}

// Run the comprehensive scraper
const scraper = new ComprehensiveRightmoveScraper();
scraper.scrapeAll();

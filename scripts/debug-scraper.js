import puppeteer from 'puppeteer';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class DebugScraper {
  constructor() {
    this.browser = null;
    this.page = null;
  }

  async init() {
    console.log('🚀 Initializing debug scraper...');
    this.browser = await puppeteer.launch({
      headless: false, // Keep visible for debugging
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    this.page = await this.browser.newPage();
    await this.page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
  }

  async testUniversityExtraction() {
    try {
      console.log('📚 Testing university list extraction...');
      
      await this.page.goto('https://www.rightmove.co.uk/student-accommodation/list-of-uk-universities.html', { 
        waitUntil: 'networkidle2',
        timeout: 30000 
      });
      
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Handle cookies
      await this.page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const acceptButton = buttons.find(button => {
          const text = button.textContent.toLowerCase();
          return text.includes('accept') || text.includes('agree');
        });
        if (acceptButton) acceptButton.click();
      });
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      
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
        
        return links;
      });
      
      console.log(`✅ Found ${universityLinks.length} universities`);
      
      if (universityLinks.length > 0) {
        console.log('First 5 universities:');
        universityLinks.slice(0, 5).forEach((uni, index) => {
          console.log(`  ${index + 1}. ${uni.university} - ${uni.url}`);
        });
        
        // Test property extraction on first university
        await this.testPropertyExtraction(universityLinks[0]);
      }
      
    } catch (error) {
      console.error('❌ Error testing university extraction:', error);
    }
  }

  async testPropertyExtraction(university) {
    try {
      console.log(`\n🏠 Testing property extraction for ${university.university}...`);
      
      await this.page.goto(university.url, { waitUntil: 'networkidle2', timeout: 30000 });
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // Handle cookies again
      await this.page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const acceptButton = buttons.find(button => {
          const text = button.textContent.toLowerCase();
          return text.includes('accept') || text.includes('agree');
        });
        if (acceptButton) acceptButton.click();
      });
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Take screenshot for debugging
      await this.page.screenshot({ path: `debug-${university.university}.png`, fullPage: true });
      console.log(`📸 Screenshot saved as debug-${university.university}.png`);
      
      // Check page content
      const pageAnalysis = await this.page.evaluate(() => {
        return {
          title: document.title,
          url: window.location.href,
          bodyTextLength: document.body.textContent.length,
          hasPropertyCards: document.querySelector('.propertyCard') !== null,
          hasSearchResults: document.querySelector('.search-results') !== null,
          hasListings: document.querySelector('[class*="listing"]') !== null,
          hasProperties: document.querySelector('[class*="property"]') !== null,
          totalElements: document.querySelectorAll('*').length,
          scriptTags: document.querySelectorAll('script').length,
          bodyPreview: document.body.textContent.substring(0, 300)
        };
      });
      
      console.log('📄 Page Analysis:');
      console.log(`  Title: ${pageAnalysis.title}`);
      console.log(`  URL: ${pageAnalysis.url}`);
      console.log(`  Body text length: ${pageAnalysis.bodyTextLength}`);
      console.log(`  Has property cards: ${pageAnalysis.hasPropertyCards}`);
      console.log(`  Has search results: ${pageAnalysis.hasSearchResults}`);
      console.log(`  Has listings: ${pageAnalysis.hasListings}`);
      console.log(`  Has properties: ${pageAnalysis.hasProperties}`);
      console.log(`  Total elements: ${pageAnalysis.totalElements}`);
      console.log(`  Script tags: ${pageAnalysis.scriptTags}`);
      console.log(`  Body preview: ${pageAnalysis.bodyPreview}`);
      
      // Try the same extraction method that worked in our test
      const properties = await this.page.evaluate((universityName) => {
        const propertySelectors = [
          '[class*="property"]',
          '.propertyCard',
          '.property-result',
          '.search-result',
          '.l-searchResult',
          '[data-test="property-result"]'
        ];
        
        let foundElements = [];
        let usedSelector = '';
        
        for (const selector of propertySelectors) {
          const elements = document.querySelectorAll(selector);
          if (elements.length > 0) {
            foundElements = Array.from(elements);
            usedSelector = selector;
            console.log(`Found ${elements.length} elements with selector: ${selector}`);
            break;
          }
        }
        
        const properties = [];
        
        foundElements.slice(0, 10).forEach((element, index) => {
          try {
            const elementText = element.textContent || '';
            const priceMatches = elementText.match(/£[\d,]+/g) || [];
            const bedroomMatches = elementText.match(/(\d+)\s*(bed|bedroom)/gi) || [];
            const images = Array.from(element.querySelectorAll('img')).length;
            const links = Array.from(element.querySelectorAll('a')).length;
            
            if (priceMatches.length > 0 || bedroomMatches.length > 0 || images > 0 || elementText.length > 100) {
              properties.push({
                index: index,
                text: elementText.substring(0, 150),
                prices: priceMatches,
                bedrooms: bedroomMatches,
                images: images,
                links: links,
                hasContent: elementText.length > 50
              });
            }
          } catch (error) {
            console.warn('Error processing element:', error);
          }
        });
        
        return {
          selector: usedSelector,
          totalElements: foundElements.length,
          properties: properties,
          hasProperties: properties.length > 0
        };
      }, university.university);
      
      console.log('🔍 Property extraction results:');
      console.log(`  Selector used: ${properties.selector}`);
      console.log(`  Total elements found: ${properties.totalElements}`);
      console.log(`  Properties with data: ${properties.properties.length}`);
      console.log(`  Has properties: ${properties.hasProperties}`);
      
      if (properties.properties.length > 0) {
        console.log('\n📋 Sample properties found:');
        properties.properties.slice(0, 3).forEach((prop, index) => {
          console.log(`  Property ${index + 1}:`);
          console.log(`    Text: ${prop.text}...`);
          console.log(`    Prices: ${prop.prices.join(', ')}`);
          console.log(`    Bedrooms: ${prop.bedrooms.join(', ')}`);
          console.log(`    Images: ${prop.images}`);
          console.log(`    Links: ${prop.links}`);
        });
        
        console.log('\n✅ SUCCESS: Properties found! The extraction method works.');
      } else {
        console.log('\n❌ PROBLEM: No properties found with current method.');
        
        // Try alternative extraction methods
        console.log('\n🔍 Trying alternative extraction methods...');
        
        const alternativeResults = await this.page.evaluate(() => {
          // Method 1: Look for any element containing price patterns
          const allElements = document.querySelectorAll('*');
          const elementsWithPrices = [];
          
          Array.from(allElements).forEach((el, index) => {
            const text = el.textContent || '';
            if (text.match(/£[\d,]+/) && text.length < 500) {
              elementsWithPrices.push({
                tagName: el.tagName,
                className: el.className,
                text: text.substring(0, 100),
                hasImages: el.querySelectorAll('img').length > 0
              });
            }
          });
          
          return {
            elementsWithPrices: elementsWithPrices.slice(0, 5),
            totalWithPrices: elementsWithPrices.length
          };
        });
        
        console.log(`  Found ${alternativeResults.totalWithPrices} elements with prices`);
        if (alternativeResults.elementsWithPrices.length > 0) {
          console.log('  Sample elements with prices:');
          alternativeResults.elementsWithPrices.forEach((el, index) => {
            console.log(`    ${index + 1}. ${el.tagName}.${el.className}: ${el.text}...`);
          });
        }
      }
      
    } catch (error) {
      console.error('❌ Error testing property extraction:', error);
    }
  }

  async run() {
    try {
      await this.init();
      await this.testUniversityExtraction();
    } catch (error) {
      console.error('❌ Debug scraper failed:', error);
    } finally {
      if (this.browser) {
        console.log('🔚 Closing browser...');
        await this.browser.close();
      }
    }
  }
}

// Run the debug scraper
const debugScraper = new DebugScraper();
debugScraper.run();

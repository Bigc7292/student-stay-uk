import puppeteer from 'puppeteer';

async function testSingleUniversity() {
  console.log('🧪 Testing single university property extraction...');
  
  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
  
  try {
    // Test Aberdeen university page
    console.log('📚 Loading Aberdeen university page...');
    await page.goto('https://www.rightmove.co.uk/student-accommodation/Aberdeen.html', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Handle cookies
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const acceptButton = buttons.find(button => {
        const text = button.textContent.toLowerCase();
        return text.includes('accept') || text.includes('agree');
      });
      if (acceptButton) acceptButton.click();
    });
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Take screenshot to see what we're working with
    await page.screenshot({ path: 'test-university-page.png', fullPage: true });
    console.log('📸 Screenshot saved as test-university-page.png');
    
    // Check if this is a search page
    const pageInfo = await page.evaluate(() => {
      return {
        title: document.title,
        hasSearchForm: document.querySelector('form') !== null,
        hasSearchInput: document.querySelector('input[type="search"], input[name*="search"]') !== null,
        hasSearchButton: document.querySelector('button[type="submit"], .search-button') !== null,
        bodyText: document.body.textContent.substring(0, 500),
        formElements: Array.from(document.querySelectorAll('form')).map(form => ({
          action: form.action,
          method: form.method,
          inputs: Array.from(form.querySelectorAll('input')).map(input => ({
            type: input.type,
            name: input.name,
            placeholder: input.placeholder
          }))
        }))
      };
    });
    
    console.log('📄 Page Analysis:');
    console.log(`  Title: ${pageInfo.title}`);
    console.log(`  Has search form: ${pageInfo.hasSearchForm}`);
    console.log(`  Has search input: ${pageInfo.hasSearchInput}`);
    console.log(`  Has search button: ${pageInfo.hasSearchButton}`);
    console.log(`  Body preview: ${pageInfo.bodyText}`);
    
    if (pageInfo.formElements.length > 0) {
      console.log('📝 Forms found:');
      pageInfo.formElements.forEach((form, index) => {
        console.log(`  Form ${index + 1}: ${form.action} (${form.method})`);
        form.inputs.forEach(input => {
          console.log(`    Input: ${input.type} - ${input.name} - "${input.placeholder}"`);
        });
      });
    }
    
    // Try to perform a search if needed
    if (pageInfo.hasSearchInput) {
      console.log('🔍 Attempting to perform search...');
      
      const searchPerformed = await page.evaluate(() => {
        const searchInput = document.querySelector('input[type="search"], input[name*="search"], input[placeholder*="search"]');
        if (searchInput) {
          searchInput.value = 'Aberdeen';
          searchInput.dispatchEvent(new Event('input', { bubbles: true }));
          
          const searchButton = document.querySelector('button[type="submit"], .search-button, button:contains("Search")');
          if (searchButton) {
            searchButton.click();
            return true;
          }
          
          // Try submitting the form
          const form = searchInput.closest('form');
          if (form) {
            form.submit();
            return true;
          }
        }
        return false;
      });
      
      if (searchPerformed) {
        console.log('✅ Search submitted, waiting for results...');
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        // Take another screenshot after search
        await page.screenshot({ path: 'test-after-search.png', fullPage: true });
        console.log('📸 After-search screenshot saved');
      }
    }
    
    // Now try to extract properties
    console.log('🏠 Extracting properties...');
    
    const properties = await page.evaluate(() => {
      const propertySelectors = [
        '.propertyCard',
        '.property-result',
        '.search-result',
        '.l-searchResult',
        '[data-test="property-result"]',
        '.propertyCard-wrapper',
        '.property-item',
        '.listing-result',
        '.property',
        '[class*="property"]',
        '[class*="result"]'
      ];
      
      let foundElements = [];
      let usedSelector = '';
      
      // Try each selector
      for (const selector of propertySelectors) {
        const elements = document.querySelectorAll(selector);
        if (elements.length > 0) {
          foundElements = Array.from(elements);
          usedSelector = selector;
          break;
        }
      }
      
      const properties = [];
      
      foundElements.forEach((element, index) => {
        try {
          // Extract all text content and look for patterns
          const elementText = element.textContent || '';
          
          // Look for price patterns
          const priceMatches = elementText.match(/£[\d,]+/g) || [];
          
          // Look for bedroom patterns
          const bedroomMatches = elementText.match(/(\d+)\s*(bed|bedroom)/gi) || [];
          
          // Look for images
          const images = Array.from(element.querySelectorAll('img')).map(img => ({
            src: img.src,
            alt: img.alt
          }));
          
          // Look for links
          const links = Array.from(element.querySelectorAll('a')).map(a => a.href);
          
          if (priceMatches.length > 0 || bedroomMatches.length > 0 || images.length > 0) {
            properties.push({
              index: index,
              text: elementText.substring(0, 200),
              prices: priceMatches,
              bedrooms: bedroomMatches,
              images: images.length,
              links: links.length,
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
        properties: properties.slice(0, 5), // First 5 for analysis
        hasProperties: properties.length > 0
      };
    });
    
    console.log('🔍 Property extraction results:');
    console.log(`  Selector used: ${properties.selector}`);
    console.log(`  Total elements found: ${properties.totalElements}`);
    console.log(`  Properties with data: ${properties.properties.length}`);
    console.log(`  Has properties: ${properties.hasProperties}`);
    
    if (properties.properties.length > 0) {
      console.log('\n📋 Sample properties:');
      properties.properties.forEach((prop, index) => {
        console.log(`  Property ${index + 1}:`);
        console.log(`    Text: ${prop.text}...`);
        console.log(`    Prices: ${prop.prices.join(', ')}`);
        console.log(`    Bedrooms: ${prop.bedrooms.join(', ')}`);
        console.log(`    Images: ${prop.images}`);
        console.log(`    Links: ${prop.links}`);
      });
    } else {
      console.log('❌ No properties found - this might be a search page that needs interaction');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    console.log('🔚 Closing browser...');
    await browser.close();
  }
}

testSingleUniversity();

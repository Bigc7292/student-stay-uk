import puppeteer from 'puppeteer';

async function debugUniversityPage() {
  console.log('🔍 Debugging university page structure...');
  
  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
  
  try {
    // Test a specific university page
    const testUrl = 'https://www.rightmove.co.uk/student-accommodation/Aberdeen.html';
    console.log(`📚 Loading: ${testUrl}`);
    
    await page.goto(testUrl, { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Take screenshot
    await page.screenshot({ path: 'university-page-debug.png', fullPage: true });
    console.log('📸 Screenshot saved as university-page-debug.png');
    
    // Check page content
    const pageInfo = await page.evaluate(() => {
      return {
        title: document.title,
        url: window.location.href,
        bodyText: document.body.textContent.substring(0, 500),
        hasSearchResults: document.querySelector('.search-results') !== null,
        hasPropertyCards: document.querySelector('.propertyCard') !== null,
        hasListings: document.querySelector('[class*="listing"]') !== null,
        allClassNames: Array.from(document.querySelectorAll('*')).map(el => el.className).filter(c => c && typeof c === 'string' && c.includes('property')).slice(0, 10),
        scriptTags: Array.from(document.querySelectorAll('script')).map(s => s.src || 'inline').slice(0, 5),
        hasNextData: document.querySelector('#__NEXT_DATA__') !== null
      };
    });
    
    console.log('📄 Page Information:');
    console.log(`  Title: ${pageInfo.title}`);
    console.log(`  URL: ${pageInfo.url}`);
    console.log(`  Has search results: ${pageInfo.hasSearchResults}`);
    console.log(`  Has property cards: ${pageInfo.hasPropertyCards}`);
    console.log(`  Has listings: ${pageInfo.hasListings}`);
    console.log(`  Has NEXT_DATA: ${pageInfo.hasNextData}`);
    console.log(`  Property-related classes: ${pageInfo.allClassNames.join(', ')}`);
    console.log(`  Body text preview: ${pageInfo.bodyText}`);
    
    // Check if this is a search page that needs interaction
    const needsSearch = await page.evaluate(() => {
      return document.body.textContent.includes('search') || 
             document.body.textContent.includes('find') ||
             document.querySelector('input[type="search"]') !== null ||
             document.querySelector('.search-form') !== null;
    });
    
    console.log(`🔍 Needs search interaction: ${needsSearch}`);
    
    if (needsSearch) {
      console.log('🔍 This appears to be a search page, looking for search elements...');
      
      const searchElements = await page.evaluate(() => {
        const inputs = Array.from(document.querySelectorAll('input')).map(input => ({
          type: input.type,
          placeholder: input.placeholder,
          name: input.name,
          id: input.id
        }));
        
        const buttons = Array.from(document.querySelectorAll('button')).map(button => ({
          text: button.textContent.trim(),
          type: button.type,
          id: button.id,
          className: button.className
        }));
        
        return { inputs, buttons };
      });
      
      console.log('📝 Search inputs found:', searchElements.inputs);
      console.log('🔘 Buttons found:', searchElements.buttons.slice(0, 5));
    }
    
    // Try to extract any JSON data
    const jsonData = await page.evaluate(() => {
      const scripts = Array.from(document.querySelectorAll('script'));
      const dataScripts = [];
      
      scripts.forEach((script, index) => {
        if (script.textContent && (
          script.textContent.includes('properties') ||
          script.textContent.includes('__NEXT_DATA__') ||
          script.textContent.includes('window.__INITIAL_STATE__')
        )) {
          dataScripts.push({
            index,
            hasProperties: script.textContent.includes('properties'),
            hasNextData: script.textContent.includes('__NEXT_DATA__'),
            hasInitialState: script.textContent.includes('__INITIAL_STATE__'),
            preview: script.textContent.substring(0, 200)
          });
        }
      });
      
      return dataScripts;
    });
    
    console.log('📊 JSON data scripts found:', jsonData.length);
    jsonData.forEach((script, index) => {
      console.log(`  Script ${index + 1}:`);
      console.log(`    Has properties: ${script.hasProperties}`);
      console.log(`    Has NEXT_DATA: ${script.hasNextData}`);
      console.log(`    Preview: ${script.preview}...`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    console.log('🔚 Closing browser...');
    await browser.close();
  }
}

debugUniversityPage();

import puppeteer from 'puppeteer';

async function testCookieHandling() {
  console.log('🚀 Testing cookie handling on Rightmove...');
  
  const browser = await puppeteer.launch({
    headless: false, // Keep visible to see what's happening
    args: [
      '--no-sandbox', 
      '--disable-setuid-sandbox',
      '--disable-blink-features=AutomationControlled'
    ]
  });
  
  const page = await browser.newPage();
  
  // Set user agent
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
  
  try {
    console.log('📚 Navigating to university list...');
    await page.goto('https://www.rightmove.co.uk/student-accommodation/list-of-uk-universities.html', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    console.log('⏳ Waiting for page to load...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Check for cookie banner
    console.log('🍪 Looking for cookie banner...');
    
    // Take a screenshot to see what's on the page
    await page.screenshot({ path: 'cookie-test.png', fullPage: true });
    console.log('📸 Screenshot saved as cookie-test.png');
    
    // Try to find and click cookie accept button
    const cookieButtons = await page.$$eval('button', buttons => {
      return buttons.map(button => ({
        text: button.textContent.trim(),
        id: button.id,
        className: button.className,
        visible: button.offsetParent !== null
      })).filter(btn => 
        btn.text.toLowerCase().includes('accept') ||
        btn.text.toLowerCase().includes('agree') ||
        btn.text.toLowerCase().includes('allow')
      );
    });
    
    console.log('🔍 Found cookie-related buttons:', cookieButtons);
    
    if (cookieButtons.length > 0) {
      console.log('🍪 Attempting to click accept button...');
      
      // Try to click the first accept button
      await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const acceptButton = buttons.find(button => 
          button.textContent.toLowerCase().includes('accept') ||
          button.textContent.toLowerCase().includes('agree')
        );
        
        if (acceptButton) {
          console.log('Clicking accept button:', acceptButton.textContent);
          acceptButton.click();
          return true;
        }
        return false;
      });
      
      await new Promise(resolve => setTimeout(resolve, 3000));
      console.log('✅ Cookie button clicked, waiting...');
    }
    
    // Now try to extract university links
    console.log('🔍 Looking for university links...');
    
    const universityLinks = await page.$$eval('a[href*="/student-accommodation/"]', links => {
      return links.map(link => ({
        url: link.href,
        text: link.textContent.trim(),
        visible: link.offsetParent !== null
      })).filter(link => 
        link.text && 
        !link.url.includes('find.html') && 
        !link.url.includes('list-of-uk-universities') &&
        link.text.length > 2
      );
    });
    
    console.log(`✅ Found ${universityLinks.length} university links:`);
    universityLinks.slice(0, 10).forEach((link, index) => {
      console.log(`  ${index + 1}. ${link.text} - ${link.url}`);
    });
    
    if (universityLinks.length > 0) {
      console.log('\n🏫 Testing property extraction on first university...');
      const testUniversity = universityLinks[0];
      
      await page.goto(testUniversity.url, { waitUntil: 'networkidle2', timeout: 30000 });
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Handle cookies again if needed
      await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const acceptButton = buttons.find(button => 
          button.textContent.toLowerCase().includes('accept')
        );
        if (acceptButton) acceptButton.click();
      });
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Look for properties
      const properties = await page.evaluate(() => {
        const propertySelectors = [
          '[data-test="property-result"]',
          '.propertyCard',
          '.property-result',
          '.search-result',
          '.l-searchResult'
        ];
        
        let foundElements = [];
        
        for (const selector of propertySelectors) {
          const elements = document.querySelectorAll(selector);
          if (elements.length > 0) {
            foundElements = Array.from(elements).map(el => ({
              selector: selector,
              text: el.textContent.substring(0, 200),
              hasPrice: el.textContent.includes('£'),
              hasTitle: el.querySelector('h1, h2, h3') !== null
            }));
            break;
          }
        }
        
        return {
          foundElements: foundElements.slice(0, 3),
          totalFound: foundElements.length,
          pageTitle: document.title,
          hasProperties: foundElements.length > 0
        };
      });
      
      console.log('🏠 Property extraction test results:');
      console.log(`  Page title: ${properties.pageTitle}`);
      console.log(`  Properties found: ${properties.totalFound}`);
      console.log(`  Has properties: ${properties.hasProperties}`);
      
      if (properties.foundElements.length > 0) {
        console.log('  Sample properties:');
        properties.foundElements.forEach((prop, index) => {
          console.log(`    ${index + 1}. Selector: ${prop.selector}`);
          console.log(`       Text: ${prop.text.substring(0, 100)}...`);
          console.log(`       Has price: ${prop.hasPrice}, Has title: ${prop.hasTitle}`);
        });
      }
    }
    
  } catch (error) {
    console.error('❌ Error during testing:', error);
  } finally {
    console.log('🔚 Closing browser...');
    await browser.close();
  }
}

testCookieHandling();

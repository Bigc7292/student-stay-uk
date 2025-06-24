import puppeteer from 'puppeteer';

async function simpleTest() {
  console.log('🧪 Simple connection test...');
  
  const browser = await puppeteer.launch({
    headless: false,
    args: [
      '--no-sandbox', 
      '--disable-setuid-sandbox',
      '--disable-web-security',
      '--disable-features=VizDisplayCompositor'
    ]
  });
  
  const page = await browser.newPage();
  
  try {
    console.log('🌐 Testing basic connectivity...');
    
    // Test with a longer timeout and simpler page first
    await page.goto('https://www.google.com', { 
      waitUntil: 'domcontentloaded',
      timeout: 60000 
    });
    
    console.log('✅ Basic connectivity works');
    
    // Now try Rightmove with longer timeout
    console.log('🏠 Testing Rightmove connectivity...');
    
    await page.goto('https://www.rightmove.co.uk', { 
      waitUntil: 'domcontentloaded',
      timeout: 60000 
    });
    
    console.log('✅ Rightmove main page loads');
    
    // Wait and handle any popups
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Try to accept cookies
    try {
      await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const acceptButton = buttons.find(button => {
          const text = button.textContent.toLowerCase();
          return text.includes('accept') || text.includes('agree') || text.includes('allow');
        });
        if (acceptButton) {
          acceptButton.click();
          console.log('Clicked accept button');
        }
      });
      
      await new Promise(resolve => setTimeout(resolve, 3000));
    } catch (error) {
      console.log('No cookie banner found or already handled');
    }
    
    // Now try the university list page
    console.log('📚 Testing university list page...');
    
    await page.goto('https://www.rightmove.co.uk/student-accommodation/list-of-uk-universities.html', { 
      waitUntil: 'domcontentloaded',
      timeout: 60000 
    });
    
    console.log('✅ University list page loads');
    
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Check what's on the page
    const pageInfo = await page.evaluate(() => {
      return {
        title: document.title,
        url: window.location.href,
        hasLinks: document.querySelectorAll('a').length,
        hasStudentLinks: document.querySelectorAll('a[href*="student-accommodation"]').length,
        bodyLength: document.body.textContent.length,
        bodyPreview: document.body.textContent.substring(0, 200)
      };
    });
    
    console.log('📄 Page info:');
    console.log(`  Title: ${pageInfo.title}`);
    console.log(`  URL: ${pageInfo.url}`);
    console.log(`  Total links: ${pageInfo.hasLinks}`);
    console.log(`  Student accommodation links: ${pageInfo.hasStudentLinks}`);
    console.log(`  Body length: ${pageInfo.bodyLength}`);
    console.log(`  Body preview: ${pageInfo.bodyPreview}`);
    
    if (pageInfo.hasStudentLinks > 0) {
      console.log('✅ Found student accommodation links!');
      
      // Extract a few links
      const sampleLinks = await page.evaluate(() => {
        const links = Array.from(document.querySelectorAll('a[href*="student-accommodation"]'));
        return links.slice(0, 5).map(link => ({
          text: link.textContent.trim(),
          href: link.href
        }));
      });
      
      console.log('📋 Sample links:');
      sampleLinks.forEach((link, index) => {
        console.log(`  ${index + 1}. ${link.text} - ${link.href}`);
      });
      
      // Test one university page
      if (sampleLinks.length > 0) {
        const testLink = sampleLinks.find(link => 
          link.href.includes('Aberdeen') || 
          link.href.includes('Birmingham') || 
          link.href.includes('Manchester')
        ) || sampleLinks[0];
        
        console.log(`\n🏫 Testing university page: ${testLink.text}`);
        
        try {
          await page.goto(testLink.href, { 
            waitUntil: 'domcontentloaded',
            timeout: 60000 
          });
          
          await new Promise(resolve => setTimeout(resolve, 5000));
          
          const universityPageInfo = await page.evaluate(() => {
            return {
              title: document.title,
              hasPropertyElements: document.querySelectorAll('[class*="property"]').length,
              hasPrices: document.body.textContent.includes('£'),
              bodyLength: document.body.textContent.length,
              bodyPreview: document.body.textContent.substring(0, 300)
            };
          });
          
          console.log('🏠 University page info:');
          console.log(`  Title: ${universityPageInfo.title}`);
          console.log(`  Property elements: ${universityPageInfo.hasPropertyElements}`);
          console.log(`  Has prices: ${universityPageInfo.hasPrices}`);
          console.log(`  Body length: ${universityPageInfo.bodyLength}`);
          console.log(`  Body preview: ${universityPageInfo.bodyPreview}`);
          
          if (universityPageInfo.hasPropertyElements > 0 || universityPageInfo.hasPrices) {
            console.log('✅ SUCCESS: University page has property data!');
          } else {
            console.log('⚠️ University page loaded but no obvious property data found');
          }
          
        } catch (error) {
          console.log('❌ Error loading university page:', error.message);
        }
      }
      
    } else {
      console.log('❌ No student accommodation links found');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    console.log('🔚 Closing browser...');
    await browser.close();
  }
}

simpleTest();

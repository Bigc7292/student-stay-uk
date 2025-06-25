#!/usr/bin/env node

import fetch from 'node-fetch';

console.log('🧪 TESTING BRIGHT DATA API\n');

const BRIGHT_DATA_API = 'ed2ea01ce7a59e3c40558dc474a2718e970be07cee0a700fde512890f0e69804';
const BRIGHT_DATA_URL = 'https://api.brightdata.com/request';

async function testBrightDataAPI() {
  try {
    console.log('1. 🔄 Testing basic API connection...');
    
    // Test with the example URL first
    const testPayload = {
      zone: 'rental',
      url: 'https://geo.brdtest.com/welcome.txt?product=unlocker&method=api',
      format: 'raw'
    };
    
    console.log('📤 Test payload:', JSON.stringify(testPayload, null, 2));
    
    const response = await fetch(BRIGHT_DATA_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${BRIGHT_DATA_API}`
      },
      body: JSON.stringify(testPayload)
    });
    
    console.log('📥 Response status:', response.status);
    console.log('📥 Response headers:', Object.fromEntries(response.headers.entries()));
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log('❌ Error response:', errorText);
      return false;
    }
    
    const data = await response.text();
    console.log('✅ Success! Response:', data.substring(0, 200) + '...');
    
    return true;
    
  } catch (error) {
    console.log('❌ API test failed:', error.message);
    return false;
  }
}

async function testPropertyScraping() {
  try {
    console.log('\n2. 🏠 Testing property website scraping...');
    
    // Test with a simple property website
    const propertyPayload = {
      zone: 'rental',
      url: 'https://www.rightmove.co.uk/student-accommodation/find.html?locationIdentifier=REGION%5E87490&maxBedrooms=&minBedrooms=&maxPrice=&minPrice=&partBuyPartRent=false&retirement=false&sharedOwnership=false',
      format: 'raw'
    };
    
    console.log('📤 Property payload:', JSON.stringify(propertyPayload, null, 2));
    
    const response = await fetch(BRIGHT_DATA_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${BRIGHT_DATA_API}`
      },
      body: JSON.stringify(propertyPayload)
    });
    
    console.log('📥 Response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log('❌ Error response:', errorText);
      return false;
    }
    
    const data = await response.text();
    console.log('✅ Property scraping success!');
    console.log('📄 Response length:', data.length, 'characters');
    console.log('📄 Contains "property":', data.toLowerCase().includes('property'));
    console.log('📄 Contains "rightmove":', data.toLowerCase().includes('rightmove'));
    
    // Look for property cards or listings
    const propertyMatches = data.match(/property|listing|accommodation/gi);
    console.log('🏠 Property-related matches:', propertyMatches ? propertyMatches.length : 0);
    
    return true;
    
  } catch (error) {
    console.log('❌ Property scraping test failed:', error.message);
    return false;
  }
}

async function main() {
  try {
    console.log('🚀 Starting Bright Data API tests...\n');
    
    // Test basic API
    const basicTest = await testBrightDataAPI();
    
    if (basicTest) {
      console.log('✅ Basic API test passed!');
      
      // Test property scraping
      const propertyTest = await testPropertyScraping();
      
      if (propertyTest) {
        console.log('\n🎉 SUCCESS! Bright Data API is working!');
        console.log('   Ready to proceed with full property scraping.');
      } else {
        console.log('\n⚠️ Basic API works but property scraping failed.');
        console.log('   May need to adjust the scraping approach.');
      }
    } else {
      console.log('\n❌ Basic API test failed.');
      console.log('   Check API key or endpoint configuration.');
    }
    
  } catch (error) {
    console.log('❌ Test failed:', error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.log('❌ Script failed:', error.message);
    process.exit(1);
  });

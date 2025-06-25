#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 FINDING THE WORKING URL PATTERN - 1000% VERIFICATION\n');

async function testImageUrl(url) {
  try {
    const response = await fetch(url, { 
      method: 'HEAD',
      timeout: 3000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    return response.ok;
  } catch (error) {
    return false;
  }
}

async function findWorkingPattern() {
  try {
    console.log('1. 📖 Reading comprehensive property data...');
    
    const dataPath = path.join(__dirname, '../comprehensive_uk_properties_complete.json');
    const rawData = fs.readFileSync(dataPath, 'utf8');
    const data = JSON.parse(rawData);
    
    // Get first property with images for testing
    const testProperty = data.properties.find(p => p.images && p.images.length > 0);
    
    if (!testProperty) {
      console.log('❌ No properties with images found for testing!');
      return;
    }
    
    console.log(`📋 Testing with property: ${testProperty.title.substring(0, 50)}...`);
    console.log(`🖼️ Testing ${testProperty.images.length} images`);
    
    // Get first few images for testing
    const testImages = testProperty.images.slice(0, 3);
    
    console.log('\n2. 🧪 Testing different URL patterns...\n');
    
    for (let i = 0; i < testImages.length; i++) {
      const image = testImages[i];
      const originalUrl = image.url;
      
      console.log(`Testing image ${i + 1}: ${originalUrl}`);
      
      // Test different URL patterns
      const patterns = [
        // Original URL as-is
        originalUrl,
        
        // Add https://media.rightmove.co.uk/ prefix
        `https://media.rightmove.co.uk/${originalUrl}`,
        
        // Add https://media.rightmove.co.uk:443/ prefix
        `https://media.rightmove.co.uk:443/${originalUrl}`,
        
        // Add dir/crop/10:9-16:9/ path
        `https://media.rightmove.co.uk/dir/crop/10:9-16:9/${originalUrl}`,
        
        // Add dir/crop/10:9-16:9/ path with :443
        `https://media.rightmove.co.uk:443/dir/crop/10:9-16:9/${originalUrl}`,
        
        // Try different crop ratios
        `https://media.rightmove.co.uk:443/dir/crop/4:3-16:9/${originalUrl}`,
        `https://media.rightmove.co.uk:443/dir/crop/1:1-16:9/${originalUrl}`,
        
        // Try without crop
        `https://media.rightmove.co.uk:443/dir/${originalUrl}`,
        
        // Try different subdomain
        `https://images.rightmove.co.uk/${originalUrl}`,
        `https://images.rightmove.co.uk:443/${originalUrl}`,
        
        // Try with max size
        `https://media.rightmove.co.uk:443/dir/crop/10:9-16:9/${originalUrl.replace('.jpeg', '_max_476x317.jpeg')}`,
        `https://media.rightmove.co.uk:443/dir/crop/10:9-16:9/${originalUrl.replace('.jpeg', '_max_640x480.jpeg')}`,
        
        // Try different image sizes
        `https://media.rightmove.co.uk:443/dir/crop/10:9-16:9/${originalUrl.replace('_IMG_', '_IMG_')}`,
      ];
      
      console.log(`   Testing ${patterns.length} URL patterns...`);
      
      for (let j = 0; j < patterns.length; j++) {
        const testUrl = patterns[j];
        const isWorking = await testImageUrl(testUrl);
        
        if (isWorking) {
          console.log(`   ✅ WORKING PATTERN ${j + 1}: ${testUrl}`);
          
          // Test this pattern with other images to confirm
          console.log(`   🔄 Confirming pattern with other images...`);
          
          let confirmCount = 0;
          for (let k = 1; k < Math.min(testImages.length, 3); k++) {
            const otherImage = testImages[k];
            let confirmUrl;
            
            if (j === 0) confirmUrl = otherImage.url;
            else if (j === 1) confirmUrl = `https://media.rightmove.co.uk/${otherImage.url}`;
            else if (j === 2) confirmUrl = `https://media.rightmove.co.uk:443/${otherImage.url}`;
            else if (j === 3) confirmUrl = `https://media.rightmove.co.uk/dir/crop/10:9-16:9/${otherImage.url}`;
            else if (j === 4) confirmUrl = `https://media.rightmove.co.uk:443/dir/crop/10:9-16:9/${otherImage.url}`;
            else if (j === 5) confirmUrl = `https://media.rightmove.co.uk:443/dir/crop/4:3-16:9/${otherImage.url}`;
            else if (j === 6) confirmUrl = `https://media.rightmove.co.uk:443/dir/crop/1:1-16:9/${otherImage.url}`;
            else if (j === 7) confirmUrl = `https://media.rightmove.co.uk:443/dir/${otherImage.url}`;
            else if (j === 8) confirmUrl = `https://images.rightmove.co.uk/${otherImage.url}`;
            else if (j === 9) confirmUrl = `https://images.rightmove.co.uk:443/${otherImage.url}`;
            else if (j === 10) confirmUrl = `https://media.rightmove.co.uk:443/dir/crop/10:9-16:9/${otherImage.url.replace('.jpeg', '_max_476x317.jpeg')}`;
            else if (j === 11) confirmUrl = `https://media.rightmove.co.uk:443/dir/crop/10:9-16:9/${otherImage.url.replace('.jpeg', '_max_640x480.jpeg')}`;
            else confirmUrl = `https://media.rightmove.co.uk:443/dir/crop/10:9-16:9/${otherImage.url}`;
            
            const confirmWorking = await testImageUrl(confirmUrl);
            if (confirmWorking) {
              confirmCount++;
              console.log(`     ✅ Confirmed: ${confirmUrl}`);
            } else {
              console.log(`     ❌ Failed: ${confirmUrl}`);
            }
          }
          
          if (confirmCount > 0) {
            console.log(`\n🎉 FOUND WORKING PATTERN!`);
            console.log(`📋 Pattern ${j + 1} works for ${confirmCount + 1} out of ${Math.min(testImages.length, 3)} images`);
            console.log(`🔧 Pattern: ${getPatternDescription(j)}`);
            console.log(`📝 Example: ${testUrl}`);
            
            return {
              patternIndex: j,
              description: getPatternDescription(j),
              example: testUrl,
              successRate: ((confirmCount + 1) / Math.min(testImages.length, 3)) * 100
            };
          }
        } else {
          console.log(`   ❌ Pattern ${j + 1}: Failed`);
        }
        
        // Small delay between tests
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      console.log('');
    }
    
    console.log('❌ No working patterns found for any images!');
    return null;
    
  } catch (error) {
    console.log('❌ Test failed:', error.message);
    return null;
  }
}

function getPatternDescription(index) {
  const descriptions = [
    'Original URL as-is',
    'https://media.rightmove.co.uk/ + original',
    'https://media.rightmove.co.uk:443/ + original',
    'https://media.rightmove.co.uk/dir/crop/10:9-16:9/ + original',
    'https://media.rightmove.co.uk:443/dir/crop/10:9-16:9/ + original',
    'https://media.rightmove.co.uk:443/dir/crop/4:3-16:9/ + original',
    'https://media.rightmove.co.uk:443/dir/crop/1:1-16:9/ + original',
    'https://media.rightmove.co.uk:443/dir/ + original',
    'https://images.rightmove.co.uk/ + original',
    'https://images.rightmove.co.uk:443/ + original',
    'https://media.rightmove.co.uk:443/dir/crop/10:9-16:9/ + original with _max_476x317',
    'https://media.rightmove.co.uk:443/dir/crop/10:9-16:9/ + original with _max_640x480',
    'Default pattern'
  ];
  
  return descriptions[index] || 'Unknown pattern';
}

async function main() {
  try {
    const result = await findWorkingPattern();
    
    if (result) {
      console.log('\n✅ SUCCESS! Found working URL pattern!');
      console.log(`📊 Success rate: ${result.successRate.toFixed(1)}%`);
      console.log(`🔧 Use this pattern to fix all URLs before importing data.`);
    } else {
      console.log('\n❌ No working patterns found.');
      console.log('🔍 May need to investigate further or find different data source.');
    }
    
  } catch (error) {
    console.log('❌ Script failed:', error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.log('❌ Script failed:', error.message);
    process.exit(1);
  });

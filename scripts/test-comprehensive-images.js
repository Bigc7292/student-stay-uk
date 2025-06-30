#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🧪 TESTING COMPREHENSIVE DATA IMAGES - 1000% VERIFICATION\n');

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

async function testComprehensiveImages() {
  try {
    console.log('1. 📖 Reading comprehensive property data...');
    
    const dataPath = path.join(__dirname, '../comprehensive_uk_properties_complete.json');
    const rawData = fs.readFileSync(dataPath, 'utf8');
    const data = JSON.parse(rawData);
    
    console.log(`📊 Found ${data.properties.length} properties to test`);
    
    if (data.properties.length === 0) {
      console.log('❌ No properties found in data file!');
      return;
    }
    
    console.log('\n2. 🧪 Testing image URLs (testing first 100 properties for speed)...');
    
    let totalImages = 0;
    let workingImages = 0;
    let brokenImages = 0;
    let propertiesWithWorkingImages = 0;
    let propertiesWithoutWorkingImages = 0;
    
    const testLimit = Math.min(100, data.properties.length); // Test first 100 properties
    
    for (let i = 0; i < testLimit; i++) {
      const property = data.properties[i];
      
      console.log(`   Testing property ${i + 1}/${testLimit}: ${property.title.substring(0, 50)}...`);
      
      if (!property.images || property.images.length === 0) {
        console.log(`   ⚠️ No images for this property`);
        propertiesWithoutWorkingImages++;
        continue;
      }
      
      let propertyHasWorkingImage = false;
      
      for (const image of property.images) {
        totalImages++;
        
        // Fix the image URL
        let imageUrl = image.url;
        if (!imageUrl.startsWith('http')) {
          imageUrl = `https://media.rightmove.co.uk:443/dir/crop/10:9-16:9/${imageUrl}`;
        }
        
        const isWorking = await testImageUrl(imageUrl);
        
        if (isWorking) {
          workingImages++;
          propertyHasWorkingImage = true;
        } else {
          brokenImages++;
          console.log(`     ❌ Broken: ${imageUrl.substring(imageUrl.lastIndexOf('/') + 1)}`);
        }
      }
      
      if (propertyHasWorkingImage) {
        propertiesWithWorkingImages++;
        console.log(`   ✅ Property has working images`);
      } else {
        propertiesWithoutWorkingImages++;
        console.log(`   ❌ Property has NO working images`);
      }
      
      // Small delay to avoid overwhelming the server
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log(`\n📊 Image Test Results (from ${testLimit} properties):`);
    console.log(`✅ Total images tested: ${totalImages}`);
    console.log(`✅ Working images: ${workingImages}`);
    console.log(`❌ Broken images: ${brokenImages}`);
    console.log(`📈 Image success rate: ${totalImages > 0 ? ((workingImages / totalImages) * 100).toFixed(1) : 0}%`);
    
    console.log(`\n📊 Property Results:`);
    console.log(`✅ Properties with working images: ${propertiesWithWorkingImages}`);
    console.log(`❌ Properties without working images: ${propertiesWithoutWorkingImages}`);
    console.log(`📈 Property success rate: ${((propertiesWithWorkingImages / testLimit) * 100).toFixed(1)}%`);
    
    // Recommendations
    console.log(`\n💡 Recommendations:`);
    
    if (workingImages === 0) {
      console.log(`❌ CRITICAL: NO IMAGES ARE WORKING!`);
      console.log(`   Do NOT import this data - all images are broken.`);
      console.log(`   Need to find a different data source or fix image URLs.`);
    } else if (workingImages < totalImages * 0.5) {
      console.log(`⚠️ WARNING: Less than 50% of images are working.`);
      console.log(`   Consider finding better data source or fixing image URLs.`);
      console.log(`   Current success rate: ${((workingImages / totalImages) * 100).toFixed(1)}%`);
    } else if (workingImages < totalImages * 0.8) {
      console.log(`⚠️ CAUTION: ${((workingImages / totalImages) * 100).toFixed(1)}% of images are working.`);
      console.log(`   You can import but expect some properties without images.`);
      console.log(`   Recommend filtering out properties with broken images during import.`);
    } else {
      console.log(`✅ EXCELLENT: ${((workingImages / totalImages) * 100).toFixed(1)}% of images are working!`);
      console.log(`   Safe to import this data - most images will work.`);
      console.log(`   Estimated working properties: ${propertiesWithWorkingImages} out of ${data.properties.length} total`);
    }
    
    // Sample working URLs
    if (workingImages > 0) {
      console.log(`\n🔍 Sample working image URLs:`);
      let samplesShown = 0;
      
      for (let i = 0; i < testLimit && samplesShown < 3; i++) {
        const property = data.properties[i];
        if (property.images && property.images.length > 0) {
          for (const image of property.images) {
            let imageUrl = image.url;
            if (!imageUrl.startsWith('http')) {
              imageUrl = `https://media.rightmove.co.uk:443/dir/crop/10:9-16:9/${imageUrl}`;
            }
            
            const isWorking = await testImageUrl(imageUrl);
            if (isWorking) {
              console.log(`   ✅ ${imageUrl}`);
              samplesShown++;
              break;
            }
          }
        }
      }
    }
    
  } catch (error) {
    console.log('❌ Test failed:', error.message);
  }
}

async function main() {
  try {
    await testComprehensiveImages();
    
    console.log('\n✅ Image testing completed!');
    console.log('   Use the recommendations above to decide whether to import this data.');
    
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

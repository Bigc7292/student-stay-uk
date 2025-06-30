import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

// Supabase configuration
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testImageUrls() {
  console.log('🔍 Testing image URLs from database...\n');
  
  try {
    // Get sample image URLs from database
    const { data: images, error } = await supabase
      .from('property_images')
      .select('image_url')
      .limit(10);
    
    if (error) {
      console.error('❌ Error getting images:', error.message);
      return;
    }
    
    if (!images || images.length === 0) {
      console.log('⚠️ No images found in database');
      return;
    }
    
    console.log(`📊 Testing ${images.length} image URLs...\n`);
    
    for (let i = 0; i < images.length; i++) {
      const imageUrl = images[i].image_url;
      console.log(`${i + 1}. Testing: ${imageUrl}`);
      
      try {
        const response = await fetch(imageUrl, {
          method: 'HEAD',
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Referer': 'https://www.rightmove.co.uk/',
            'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8'
          }
        });
        
        if (response.ok) {
          console.log(`   ✅ Status: ${response.status} - Working`);
        } else {
          console.log(`   ❌ Status: ${response.status} - ${response.statusText}`);
        }
        
      } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error testing URLs:', error.message);
  }
}

async function analyzeImageUrlPatterns() {
  console.log('\n🔍 Analyzing image URL patterns...\n');
  
  try {
    const { data: images } = await supabase
      .from('property_images')
      .select('image_url')
      .limit(50);
    
    if (images && images.length > 0) {
      console.log('📋 Current URL patterns:');
      
      const urlPatterns = {};
      images.forEach(img => {
        const url = img.image_url;
        
        // Extract base pattern
        const pattern = url.replace(/\/\d+k\/\d+\/\d+\/.*/, '/[ID]/[ID]/[ID]/[IMAGE]');
        urlPatterns[pattern] = (urlPatterns[pattern] || 0) + 1;
      });
      
      Object.entries(urlPatterns).forEach(([pattern, count]) => {
        console.log(`   ${pattern} (${count} images)`);
      });
      
      // Show actual examples
      console.log('\n📋 Sample URLs:');
      images.slice(0, 5).forEach((img, index) => {
        console.log(`   ${index + 1}. ${img.image_url}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error analyzing patterns:', error.message);
  }
}

async function suggestImageUrlFixes() {
  console.log('\n💡 IMAGE URL FIX SUGGESTIONS...\n');
  
  console.log('🎯 Possible solutions for broken Rightmove image URLs:');
  console.log('');
  console.log('1. 📸 **Use Alternative Image Sources:**');
  console.log('   - OpenRent API images (more reliable)');
  console.log('   - Zoopla API images');
  console.log('   - SpareRoom API images');
  console.log('');
  console.log('2. 🔄 **Fix Rightmove URL Format:**');
  console.log('   - Remove the ":443" port from URLs');
  console.log('   - Use different Rightmove image endpoints');
  console.log('   - Try different image size parameters');
  console.log('');
  console.log('3. 🖼️ **Use Placeholder Images:**');
  console.log('   - Professional "No Image Available" placeholders');
  console.log('   - Property type specific placeholders');
  console.log('   - Branded StudentHome placeholders');
  console.log('');
  console.log('4. 🔧 **Proxy/Cache Solution:**');
  console.log('   - Set up image proxy server');
  console.log('   - Cache working images');
  console.log('   - Use CDN for image delivery');
  console.log('');
  console.log('🎯 **Recommended immediate fix:**');
  console.log('   1. Remove ":443" from all image URLs');
  console.log('   2. Add proper fallback placeholders');
  console.log('   3. Test with different Rightmove URL formats');
}

async function fixImageUrls() {
  console.log('\n🔧 ATTEMPTING TO FIX IMAGE URLS...\n');
  
  try {
    // Get all images with problematic URLs
    const { data: images } = await supabase
      .from('property_images')
      .select('id, image_url');
    
    if (!images || images.length === 0) {
      console.log('⚠️ No images to fix');
      return;
    }
    
    console.log(`📊 Found ${images.length} images to potentially fix`);
    
    let fixedCount = 0;
    
    for (const image of images) {
      let newUrl = image.image_url;
      let needsUpdate = false;
      
      // Fix 1: Remove :443 port
      if (newUrl.includes(':443')) {
        newUrl = newUrl.replace(':443', '');
        needsUpdate = true;
      }
      
      // Fix 2: Ensure proper HTTPS
      if (newUrl.startsWith('http://')) {
        newUrl = newUrl.replace('http://', 'https://');
        needsUpdate = true;
      }
      
      // Fix 3: Try alternative Rightmove image format
      if (newUrl.includes('media.rightmove.co.uk/dir/crop/10:9-16:9/')) {
        // Try without the crop parameters
        const altUrl = newUrl.replace('/dir/crop/10:9-16:9/', '/dir/');
        
        // Test if alternative works (we'll update to this format)
        newUrl = altUrl;
        needsUpdate = true;
      }
      
      if (needsUpdate && newUrl !== image.image_url) {
        try {
          const { error } = await supabase
            .from('property_images')
            .update({ image_url: newUrl })
            .eq('id', image.id);
          
          if (!error) {
            fixedCount++;
            if (fixedCount <= 5) {
              console.log(`✅ Fixed: ${image.image_url} → ${newUrl}`);
            }
          }
        } catch (error) {
          console.warn('⚠️ Error updating image:', error.message);
        }
      }
    }
    
    console.log(`\n✅ Fixed ${fixedCount} image URLs`);
    
  } catch (error) {
    console.error('❌ Error fixing URLs:', error.message);
  }
}

async function main() {
  console.log('🚀 IMAGE URL DIAGNOSIS & FIX\n');
  
  // Step 1: Test current URLs
  await testImageUrls();
  
  // Step 2: Analyze patterns
  await analyzeImageUrlPatterns();
  
  // Step 3: Suggest fixes
  await suggestImageUrlFixes();
  
  // Step 4: Attempt fixes
  await fixImageUrls();
  
  // Step 5: Test again
  console.log('\n🔄 Testing URLs after fixes...');
  await testImageUrls();
  
  console.log('\n✅ IMAGE URL DIAGNOSIS COMPLETE!');
}

main();

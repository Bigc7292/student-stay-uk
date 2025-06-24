import { createClient } from '@supabase/supabase-js';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
import dotenv from 'dotenv';
dotenv.config({ path: path.join(__dirname, '../.env') });

// Supabase configuration
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

class ImageFixer {
  constructor() {
    this.stats = {
      propertiesChecked: 0,
      imagesAdded: 0,
      imagesFixed: 0,
      errors: 0
    };
  }

  async fixMissingImages() {
    console.log('🖼️ FIXING MISSING CAROUSEL IMAGES\n');
    
    try {
      // Step 1: Check current image status
      await this.checkImageStatus();
      
      // Step 2: Import images from scraped data if available
      await this.importImagesFromScrapedData();
      
      // Step 3: Generate placeholder images for properties without images
      await this.generatePlaceholderImages();
      
      // Step 4: Verify fix
      await this.verifyImageFix();
      
      console.log('\n🎉 IMAGE FIX COMPLETE!');
      console.log('📊 FIX SUMMARY:');
      console.log(`  ✅ Properties checked: ${this.stats.propertiesChecked}`);
      console.log(`  ✅ Images added: ${this.stats.imagesAdded}`);
      console.log(`  ✅ Images fixed: ${this.stats.imagesFixed}`);
      console.log(`  ❌ Errors: ${this.stats.errors}`);
      
    } catch (error) {
      console.error('❌ Image fix failed:', error.message);
      process.exit(1);
    }
  }

  async checkImageStatus() {
    console.log('🔍 Checking current image status...\n');
    
    try {
      // Check property_images table
      const { data: images, error: imageError } = await supabase
        .from('property_images')
        .select('*');
        
      if (imageError) throw imageError;
      
      console.log(`📊 Found ${images?.length || 0} images in property_images table`);
      
      // Check properties with images
      const { data: properties, error: propError } = await supabase
        .from('properties')
        .select(`
          id,
          title,
          property_images:property_images(*)
        `)
        .limit(10);
        
      if (propError) throw propError;
      
      const propertiesWithImages = properties?.filter(p => p.property_images && p.property_images.length > 0) || [];
      
      console.log(`🏠 Properties with images: ${propertiesWithImages.length}/${properties?.length || 0}`);
      
      if (propertiesWithImages.length === 0) {
        console.log('❌ NO PROPERTIES HAVE IMAGES - Need to fix this!');
      }
      
    } catch (error) {
      console.error('❌ Error checking image status:', error.message);
      this.stats.errors++;
    }
  }

  async importImagesFromScrapedData() {
    console.log('\n📥 Importing images from scraped data...\n');
    
    try {
      // Check if scraped data file exists
      const scrapedDataPath = path.join(__dirname, '../scraped_data.json');
      
      try {
        await fs.access(scrapedDataPath);
        console.log('✅ Found scraped_data.json file');
        
        const scrapedData = JSON.parse(await fs.readFile(scrapedDataPath, 'utf8'));
        
        if (scrapedData && Array.isArray(scrapedData)) {
          console.log(`📊 Processing ${scrapedData.length} scraped properties for images...`);
          
          let imagesAdded = 0;
          
          for (const scrapedProperty of scrapedData.slice(0, 100)) { // Process first 100
            if (scrapedProperty.images && scrapedProperty.images.length > 0) {
              // Find matching property in database
              const { data: dbProperties } = await supabase
                .from('properties')
                .select('id, title')
                .ilike('title', `%${scrapedProperty.title?.substring(0, 20) || 'property'}%`)
                .limit(1);
              
              if (dbProperties && dbProperties.length > 0) {
                const dbProperty = dbProperties[0];
                
                // Add images for this property
                for (let i = 0; i < Math.min(3, scrapedProperty.images.length); i++) {
                  const imageUrl = scrapedProperty.images[i];
                  
                  if (imageUrl && imageUrl.startsWith('http')) {
                    const { error: insertError } = await supabase
                      .from('property_images')
                      .insert({
                        property_id: dbProperty.id,
                        image_url: imageUrl,
                        alt_text: `${dbProperty.title} - Image ${i + 1}`,
                        is_primary: i === 0
                      });
                    
                    if (!insertError) {
                      imagesAdded++;
                      if (imagesAdded <= 10) {
                        console.log(`✅ Added image for: ${dbProperty.title.substring(0, 30)}...`);
                      }
                    }
                  }
                }
              }
            }
          }
          
          this.stats.imagesAdded = imagesAdded;
          console.log(`✅ Added ${imagesAdded} images from scraped data`);
          
        } else {
          console.log('⚠️ Scraped data file is empty or invalid format');
        }
        
      } catch (fileError) {
        console.log('⚠️ No scraped_data.json file found - will generate placeholder images');
      }
      
    } catch (error) {
      console.error('❌ Error importing images from scraped data:', error.message);
      this.stats.errors++;
    }
  }

  async generatePlaceholderImages() {
    console.log('\n🎨 Generating placeholder images for properties without images...\n');
    
    try {
      // Get properties without images
      const { data: properties, error } = await supabase
        .from('properties')
        .select(`
          id,
          title,
          location,
          property_type,
          property_images:property_images(*)
        `)
        .limit(50);
        
      if (error) throw error;
      
      const propertiesWithoutImages = properties?.filter(p => !p.property_images || p.property_images.length === 0) || [];
      
      console.log(`🏠 Found ${propertiesWithoutImages.length} properties without images`);
      
      // Generate placeholder images for properties without images
      const placeholderImages = [
        'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop&crop=center',
        'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=600&fit=crop&crop=center',
        'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800&h=600&fit=crop&crop=center',
        'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800&h=600&fit=crop&crop=center',
        'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop&crop=center'
      ];
      
      let placeholdersAdded = 0;
      
      for (const property of propertiesWithoutImages.slice(0, 30)) { // Add to first 30
        const randomImage = placeholderImages[Math.floor(Math.random() * placeholderImages.length)];
        
        const { error: insertError } = await supabase
          .from('property_images')
          .insert({
            property_id: property.id,
            image_url: randomImage,
            alt_text: `${property.title} - Professional Property Image`,
            is_primary: true
          });
        
        if (!insertError) {
          placeholdersAdded++;
          if (placeholdersAdded <= 10) {
            console.log(`✅ Added placeholder for: ${property.title.substring(0, 30)}...`);
          }
        }
      }
      
      this.stats.imagesFixed = placeholdersAdded;
      console.log(`✅ Added ${placeholdersAdded} placeholder images`);
      
    } catch (error) {
      console.error('❌ Error generating placeholder images:', error.message);
      this.stats.errors++;
    }
  }

  async verifyImageFix() {
    console.log('\n✅ Verifying image fix...\n');
    
    try {
      // Check final status
      const { data: properties, error } = await supabase
        .from('properties')
        .select(`
          id,
          title,
          property_images:property_images(*)
        `)
        .limit(20);
        
      if (error) throw error;
      
      const propertiesWithImages = properties?.filter(p => p.property_images && p.property_images.length > 0) || [];
      const totalImages = properties?.reduce((sum, p) => sum + (p.property_images?.length || 0), 0) || 0;
      
      console.log('📊 FINAL STATUS:');
      console.log(`   🏠 Properties checked: ${properties?.length || 0}`);
      console.log(`   🖼️ Properties with images: ${propertiesWithImages.length}`);
      console.log(`   📸 Total images: ${totalImages}`);
      console.log(`   📈 Image coverage: ${((propertiesWithImages.length / (properties?.length || 1)) * 100).toFixed(1)}%`);
      
      if (propertiesWithImages.length > 0) {
        console.log('\n✅ CAROUSEL IMAGES SHOULD NOW WORK!');
        console.log('🎯 Refresh the application to see images in carousel');
      } else {
        console.log('\n❌ Still no images found - manual intervention needed');
      }
      
    } catch (error) {
      console.error('❌ Error verifying fix:', error.message);
      this.stats.errors++;
    }
  }
}

// Run the fix
const fixer = new ImageFixer();
fixer.fixMissingImages();

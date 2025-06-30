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

class ImageImportFixer {
  constructor() {
    this.stats = {
      propertiesProcessed: 0,
      imagesImported: 0,
      errors: 0
    };
  }

  async loadComprehensiveData() {
    console.log('📖 Loading comprehensive data for image import...\n');
    
    try {
      const dataPath = path.join(__dirname, '../comprehensive_uk_properties_complete.json');
      const rawData = await fs.readFile(dataPath, 'utf8');
      const comprehensiveData = JSON.parse(rawData);
      
      console.log('📊 Data loaded:');
      console.log(`  🏠 Properties: ${comprehensiveData.properties?.length || 0}`);
      console.log(`  🖼️ Total images in data: ${comprehensiveData.metadata?.totalImages || 0}`);
      
      return comprehensiveData;
      
    } catch (error) {
      console.error('❌ Error loading data:', error.message);
      process.exit(1);
    }
  }

  async getExistingProperties() {
    console.log('🔍 Getting existing properties from database...\n');
    
    try {
      const { data: properties, error } = await supabase
        .from('properties')
        .select('id, title, location, source_url')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('❌ Error getting properties:', error.message);
        return [];
      }
      
      console.log(`✅ Found ${properties.length} existing properties`);
      return properties;
      
    } catch (error) {
      console.error('❌ Error:', error.message);
      return [];
    }
  }

  convertToFullImageUrl(relativeUrl) {
    // Convert relative Rightmove URLs to full URLs
    if (!relativeUrl) return null;
    
    // If already a full URL, return as is
    if (relativeUrl.startsWith('http')) {
      return relativeUrl;
    }
    
    // Convert relative Rightmove paths to full URLs
    const rightmoveBaseUrl = 'https://media.rightmove.co.uk/dir/crop/10:9-16:9/';
    return rightmoveBaseUrl + relativeUrl;
  }

  async matchPropertyToData(dbProperty, comprehensiveProperties) {
    // Try to match database property to comprehensive data property
    // Match by title similarity and location
    
    for (const dataProperty of comprehensiveProperties) {
      // Simple matching by title start and location
      if (dataProperty.title && dbProperty.title) {
        const titleMatch = dataProperty.title.substring(0, 50) === dbProperty.title.substring(0, 50);
        const locationMatch = dataProperty.location === dbProperty.location;
        
        if (titleMatch && locationMatch) {
          return dataProperty;
        }
      }
    }
    
    return null;
  }

  async importImagesForProperty(propertyId, images) {
    try {
      if (!images || images.length === 0) {
        return 0;
      }

      const imageData = [];
      
      for (let i = 0; i < Math.min(images.length, 20); i++) {
        const img = images[i];
        const fullUrl = this.convertToFullImageUrl(img.url);
        
        if (fullUrl) {
          imageData.push({
            property_id: propertyId,
            image_url: fullUrl
          });
        }
      }

      if (imageData.length > 0) {
        const { error } = await supabase
          .from('property_images')
          .insert(imageData);

        if (error) {
          console.warn('⚠️ Error inserting images:', error.message);
          this.stats.errors++;
          return 0;
        } else {
          return imageData.length;
        }
      }

      return 0;

    } catch (error) {
      console.warn('⚠️ Error processing images:', error.message);
      this.stats.errors++;
      return 0;
    }
  }

  async runImageImport() {
    try {
      console.log('🚀 FIXING IMAGE IMPORT FOR EXISTING PROPERTIES\n');
      
      // Step 1: Load comprehensive data
      const comprehensiveData = await this.loadComprehensiveData();
      
      // Step 2: Get existing properties
      const existingProperties = await this.getExistingProperties();
      
      if (existingProperties.length === 0) {
        console.log('❌ No existing properties found');
        return;
      }
      
      console.log('\n🖼️ IMPORTING IMAGES FOR EXISTING PROPERTIES...\n');
      
      // Step 3: Process each existing property
      for (const dbProperty of existingProperties) {
        try {
          // Find matching property in comprehensive data
          const matchedProperty = await this.matchPropertyToData(dbProperty, comprehensiveData.properties);
          
          if (matchedProperty && matchedProperty.images) {
            console.log(`📸 Processing images for: ${dbProperty.title.substring(0, 50)}...`);
            
            const importedCount = await this.importImagesForProperty(dbProperty.id, matchedProperty.images);
            this.stats.imagesImported += importedCount;
            
            if (importedCount > 0) {
              console.log(`   ✅ Imported ${importedCount} images`);
            }
          }
          
          this.stats.propertiesProcessed++;
          
          // Progress update
          if (this.stats.propertiesProcessed % 100 === 0) {
            console.log(`⏳ Progress: ${this.stats.propertiesProcessed}/${existingProperties.length} properties processed...`);
          }
          
        } catch (error) {
          console.warn('⚠️ Error processing property:', error.message);
          this.stats.errors++;
        }
      }
      
      // Step 4: Final statistics
      await this.getFinalImageStatistics();
      
      console.log('\n🎉 IMAGE IMPORT COMPLETE!');
      console.log('📊 SUMMARY:');
      console.log(`  ✅ Properties processed: ${this.stats.propertiesProcessed}`);
      console.log(`  ✅ Images imported: ${this.stats.imagesImported}`);
      console.log(`  ❌ Errors: ${this.stats.errors}`);
      
    } catch (error) {
      console.error('❌ Image import failed:', error.message);
      process.exit(1);
    }
  }

  async getFinalImageStatistics() {
    console.log('\n📊 FINAL IMAGE STATISTICS...\n');
    
    try {
      const { data: images } = await supabase
        .from('property_images')
        .select('property_id, image_url');

      const { data: properties } = await supabase
        .from('properties')
        .select('id')
        .order('created_at', { ascending: false });

      console.log('🎉 FINAL IMAGE RESULTS:');
      console.log(`  🖼️ Total images in database: ${images?.length || 0}`);
      console.log(`  🏠 Total properties: ${properties?.length || 0}`);

      if (properties && properties.length > 0 && images) {
        const propertiesWithImages = new Set(images.map(img => img.property_id));
        const imageCoverage = (propertiesWithImages.size / properties.length) * 100;
        
        console.log(`  📸 Properties with images: ${propertiesWithImages.size}/${properties.length} (${imageCoverage.toFixed(1)}%)`);
        console.log(`  📊 Average images per property: ${(images.length / properties.length).toFixed(1)}`);
        
        // Show sample image URLs
        if (images.length > 0) {
          console.log('\n🔗 Sample image URLs:');
          images.slice(0, 3).forEach((img, index) => {
            console.log(`  ${index + 1}. ${img.image_url}`);
          });
        }
      }

    } catch (error) {
      console.error('❌ Error getting image statistics:', error.message);
    }
  }
}

// Run the image import fix
const imageFixer = new ImageImportFixer();
imageFixer.runImageImport();

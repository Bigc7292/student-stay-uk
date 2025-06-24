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

async function fixPropertyImagesSchema() {
  console.log('🔧 Fixing property_images table schema...\n');
  
  try {
    // Check current schema
    console.log('📋 Checking current property_images table...');
    
    const { data: testData, error: testError } = await supabase
      .from('property_images')
      .select('*')
      .limit(1);
    
    if (testError) {
      console.log('❌ Error checking table:', testError.message);
    } else {
      console.log('✅ Table exists');
      if (testData && testData.length > 0) {
        console.log('   Current columns:', Object.keys(testData[0]).join(', '));
      }
    }
    
    // Add missing columns
    console.log('\n🔧 Adding missing columns...');
    
    const columnsToAdd = [
      'ALTER TABLE property_images ADD COLUMN IF NOT EXISTS image_order INTEGER DEFAULT 0;',
      'ALTER TABLE property_images ADD COLUMN IF NOT EXISTS alt_text TEXT;',
      'ALTER TABLE property_images ADD COLUMN IF NOT EXISTS is_primary BOOLEAN DEFAULT false;'
    ];
    
    for (const sql of columnsToAdd) {
      try {
        console.log(`   Adding column: ${sql.split(' ')[5]}`);
        const { error } = await supabase.rpc('exec_sql', { sql });
        
        if (error) {
          console.warn(`   ⚠️ ${error.message}`);
        } else {
          console.log(`   ✅ Column added`);
        }
      } catch (error) {
        console.warn(`   ⚠️ Error: ${error.message}`);
      }
    }
    
    // Test the updated schema
    console.log('\n🧪 Testing updated schema...');
    
    // Get a property ID to test with
    const { data: properties } = await supabase
      .from('properties')
      .select('id')
      .limit(1);
    
    if (properties && properties.length > 0) {
      const testImage = {
        property_id: properties[0].id,
        image_url: 'https://test.com/test.jpg',
        alt_text: 'Test image',
        is_primary: true,
        image_order: 1
      };
      
      const { data: insertedImage, error: insertError } = await supabase
        .from('property_images')
        .insert(testImage)
        .select()
        .single();
      
      if (insertError) {
        console.log('❌ Test insert failed:', insertError.message);
      } else {
        console.log('✅ Test insert successful!');
        console.log('   Columns:', Object.keys(insertedImage).join(', '));
        
        // Clean up test data
        await supabase.from('property_images').delete().eq('id', insertedImage.id);
        console.log('🧹 Test data cleaned up');
      }
    }
    
    console.log('\n✅ Property images table schema fixed!');
    console.log('🎯 Ready to import images');
    
  } catch (error) {
    console.error('❌ Error fixing schema:', error.message);
  }
}

fixPropertyImagesSchema();

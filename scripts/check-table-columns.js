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

async function checkTableColumns() {
  console.log('🔍 Checking actual table columns...\n');
  
  try {
    // Check universities table structure
    console.log('📋 Universities table columns:');
    const { data: uniData, error: uniError } = await supabase
      .from('universities')
      .select('*')
      .limit(1);
    
    if (uniError) {
      console.log('❌ Error:', uniError.message);
    } else {
      // Try inserting a test record to see what columns are accepted
      const { data: testUni, error: testUniError } = await supabase
        .from('universities')
        .insert({
          name: 'Test University',
          location: 'Test Location'
        })
        .select()
        .single();
      
      if (testUniError) {
        console.log('❌ Test insert error:', testUniError.message);
      } else {
        console.log('✅ Available columns:', Object.keys(testUni).join(', '));
        
        // Delete the test record
        await supabase.from('universities').delete().eq('id', testUni.id);
      }
    }
    
    // Check properties table structure
    console.log('\n📋 Properties table columns:');
    const { data: testProp, error: testPropError } = await supabase
      .from('properties')
      .insert({
        title: 'Test Property',
        price: 100,
        location: 'Test Location'
      })
      .select()
      .single();
    
    if (testPropError) {
      console.log('❌ Test insert error:', testPropError.message);
    } else {
      console.log('✅ Available columns:', Object.keys(testProp).join(', '));
      
      // Delete the test record
      await supabase.from('properties').delete().eq('id', testProp.id);
    }
    
    // Check property_images table structure
    console.log('\n📋 Property Images table columns:');
    // First insert a test property to reference
    const { data: refProp } = await supabase
      .from('properties')
      .insert({
        title: 'Ref Property',
        price: 100,
        location: 'Test Location'
      })
      .select()
      .single();
    
    if (refProp) {
      const { data: testImg, error: testImgError } = await supabase
        .from('property_images')
        .insert({
          property_id: refProp.id,
          image_url: 'https://test.com/image.jpg'
        })
        .select()
        .single();
      
      if (testImgError) {
        console.log('❌ Test insert error:', testImgError.message);
      } else {
        console.log('✅ Available columns:', Object.keys(testImg).join(', '));
        
        // Delete test records
        await supabase.from('property_images').delete().eq('id', testImg.id);
      }
      
      await supabase.from('properties').delete().eq('id', refProp.id);
    }
    
  } catch (error) {
    console.error('❌ Error checking columns:', error.message);
  }
}

checkTableColumns();

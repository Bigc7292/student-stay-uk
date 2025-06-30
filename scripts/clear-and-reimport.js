import { createClient } from '@supabase/supabase-js';
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

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

// Create Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function clearAndReimport() {
  try {
    console.log('🧹 Clearing existing data...');
    
    // Delete in correct order due to foreign key constraints
    const { error: imagesError } = await supabase
      .from('property_images')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
    
    if (imagesError) {
      console.warn('⚠️ Error clearing property_images:', imagesError);
    } else {
      console.log('✅ Cleared property_images');
    }
    
    const { error: propertiesError } = await supabase
      .from('properties')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
    
    if (propertiesError) {
      console.warn('⚠️ Error clearing properties:', propertiesError);
    } else {
      console.log('✅ Cleared properties');
    }
    
    const { error: scrapedError } = await supabase
      .from('scraped_data')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
    
    if (scrapedError) {
      console.warn('⚠️ Error clearing scraped_data:', scrapedError);
    } else {
      console.log('✅ Cleared scraped_data');
    }
    
    console.log('\n🚀 Starting fresh import...');
    
    // Import the import script dynamically
    const { default: importScript } = await import('./import-scraped-data.js');
    
  } catch (error) {
    console.error('❌ Clear and reimport failed:', error);
  }
}

clearAndReimport();

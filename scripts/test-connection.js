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
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log('🔍 Testing Supabase Connection...');
console.log('URL:', supabaseUrl);
console.log('Service Key:', supabaseServiceKey ? 'Present' : 'Missing');
console.log('Anon Key:', supabaseAnonKey ? 'Present' : 'Missing');

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

// Create Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testConnection() {
  try {
    console.log('\n🧪 Testing basic connection...');
    
    // Test basic connection
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.log('⚠️ Auth test result:', error.message);
    } else {
      console.log('✅ Basic connection successful');
    }
    
    // Test if we can access any tables
    console.log('\n🔍 Checking for existing tables...');
    
    const tables = ['properties', 'property_images', 'scraped_data'];
    
    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('count(*)')
          .limit(1);
        
        if (error) {
          console.log(`❌ Table '${table}':`, error.message);
        } else {
          console.log(`✅ Table '${table}': accessible`);
        }
      } catch (err) {
        console.log(`❌ Table '${table}':`, err.message);
      }
    }
    
    // Test a simple insert to see what happens
    console.log('\n🧪 Testing insert capability...');
    
    try {
      const { data, error } = await supabase
        .from('properties')
        .insert({
          title: 'Test Property',
          price: 100,
          location: 'Test Location',
          source: 'test'
        })
        .select();
      
      if (error) {
        console.log('❌ Insert test failed:', JSON.stringify(error, null, 2));
      } else {
        console.log('✅ Insert test successful:', data);
        
        // Clean up test data
        if (data && data[0]) {
          await supabase
            .from('properties')
            .delete()
            .eq('id', data[0].id);
          console.log('🧹 Test data cleaned up');
        }
      }
    } catch (err) {
      console.log('❌ Insert test error:', err.message);
    }
    
  } catch (error) {
    console.error('❌ Connection test failed:', error);
  }
}

testConnection();

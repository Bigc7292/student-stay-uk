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

async function checkUniversitiesTableStructure() {
  console.log('🔍 Checking universities table structure...\n');
  
  try {
    // Get sample data to see current columns
    const { data: universities, error } = await supabase
      .from('universities')
      .select('*')
      .limit(5);
    
    if (error) {
      console.error('❌ Error getting universities:', error.message);
      return null;
    }
    
    if (universities && universities.length > 0) {
      console.log('📋 Current universities table structure:');
      console.log('   Columns:', Object.keys(universities[0]).join(', '));
      
      console.log('\n📊 Sample data:');
      universities.forEach((uni, index) => {
        console.log(`   ${index + 1}. Name: "${uni.name}" | Location: "${uni.location}"`);
      });
      
      return universities[0];
    } else {
      console.log('⚠️ No universities found in table');
      return null;
    }
    
  } catch (error) {
    console.error('❌ Error checking table:', error.message);
    return null;
  }
}

async function checkPropertiesLocationColumn() {
  console.log('\n🔍 Checking properties table location column...\n');
  
  try {
    // Get sample properties to see location format
    const { data: properties, error } = await supabase
      .from('properties')
      .select('location')
      .limit(10);
    
    if (error) {
      console.error('❌ Error getting properties:', error.message);
      return;
    }
    
    if (properties && properties.length > 0) {
      console.log('📋 Properties location column samples:');
      const uniqueLocations = [...new Set(properties.map(p => p.location))];
      uniqueLocations.slice(0, 10).forEach((location, index) => {
        console.log(`   ${index + 1}. "${location}"`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error checking properties:', error.message);
  }
}

async function analyzeNamingConsistency() {
  console.log('\n📊 ANALYZING NAMING CONSISTENCY...\n');
  
  try {
    // Get universities data
    const { data: universities } = await supabase
      .from('universities')
      .select('name, location');
    
    // Get unique property locations
    const { data: properties } = await supabase
      .from('properties')
      .select('location');
    
    if (universities && properties) {
      const universityLocations = [...new Set(universities.map(u => u.location))];
      const propertyLocations = [...new Set(properties.map(p => p.location))];
      
      console.log('🏫 University locations (from "location" column):');
      universityLocations.slice(0, 15).forEach((loc, index) => {
        console.log(`   ${index + 1}. ${loc}`);
      });
      
      console.log('\n🏠 Property locations (from "location" column):');
      propertyLocations.slice(0, 15).forEach((loc, index) => {
        console.log(`   ${index + 1}. ${loc}`);
      });
      
      // Find matches
      const matches = universityLocations.filter(uLoc => 
        propertyLocations.some(pLoc => 
          pLoc.toLowerCase().includes(uLoc.toLowerCase()) || 
          uLoc.toLowerCase().includes(pLoc.toLowerCase())
        )
      );
      
      console.log(`\n🎯 Matching locations: ${matches.length}/${universityLocations.length}`);
      console.log('   Matches:', matches.slice(0, 10).join(', '));
      
      // Check if university "name" column contains location data
      const universityNames = universities.map(u => u.name);
      const locationLikeNames = universityNames.filter(name => 
        propertyLocations.some(loc => 
          name.toLowerCase().includes(loc.toLowerCase()) || 
          loc.toLowerCase().includes(name.toLowerCase())
        )
      );
      
      console.log(`\n🔍 University names that look like locations: ${locationLikeNames.length}`);
      if (locationLikeNames.length > 0) {
        console.log('   Examples:', locationLikeNames.slice(0, 5).join(', '));
      }
    }
    
  } catch (error) {
    console.error('❌ Error analyzing consistency:', error.message);
  }
}

async function suggestColumnFixes() {
  console.log('\n💡 COLUMN NAMING SUGGESTIONS...\n');
  
  console.log('🎯 Recommended fixes for consistency:');
  console.log('');
  console.log('📋 Universities table should have:');
  console.log('   - "name" column: Actual university names (e.g., "University of Manchester")');
  console.log('   - "location" column: City names (e.g., "Manchester")');
  console.log('   - "postcode" column: University postcodes (optional)');
  console.log('');
  console.log('📋 Properties table has:');
  console.log('   - "location" column: City names (e.g., "Manchester") ✅ CORRECT');
  console.log('');
  console.log('🔧 If university "name" column contains city names instead of university names:');
  console.log('   - This needs to be fixed to contain actual university names');
  console.log('   - The "location" column should contain the city names');
  console.log('');
  console.log('📊 This will ensure:');
  console.log('   ✅ Consistent location filtering across tables');
  console.log('   ✅ Proper university name display');
  console.log('   ✅ Accurate location-based searches');
}

async function main() {
  console.log('🚀 UNIVERSITIES TABLE COLUMN ANALYSIS\n');
  
  // Step 1: Check current structure
  const sampleUni = await checkUniversitiesTableStructure();
  
  // Step 2: Check properties location column
  await checkPropertiesLocationColumn();
  
  // Step 3: Analyze naming consistency
  await analyzeNamingConsistency();
  
  // Step 4: Suggest fixes
  await suggestColumnFixes();
  
  console.log('\n✅ ANALYSIS COMPLETE!');
  console.log('💡 Review the suggestions above to fix column naming consistency');
}

main();

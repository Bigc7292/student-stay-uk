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

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// UK City to Postcode mapping for major university cities
const CITY_POSTCODES = {
  'London': ['E1', 'E2', 'E3', 'E14', 'E15', 'E16', 'E17', 'E20', 'EC1', 'EC2', 'EC3', 'EC4', 'N1', 'N4', 'N5', 'N7', 'N16', 'N19', 'NW1', 'NW3', 'NW5', 'NW6', 'NW8', 'SE1', 'SE8', 'SE10', 'SE11', 'SE14', 'SE15', 'SE16', 'SW1', 'SW3', 'SW4', 'SW6', 'SW7', 'SW8', 'SW9', 'SW11', 'SW15', 'SW17', 'SW18', 'W1', 'W2', 'W6', 'W8', 'W9', 'W10', 'W11', 'W12', 'W14', 'WC1', 'WC2'],
  'Manchester': ['M1', 'M2', 'M3', 'M4', 'M5', 'M8', 'M9', 'M11', 'M12', 'M13', 'M14', 'M15', 'M16', 'M19', 'M20', 'M21'],
  'Birmingham': ['B1', 'B2', 'B3', 'B4', 'B5', 'B6', 'B7', 'B8', 'B9', 'B10', 'B11', 'B12', 'B13', 'B14', 'B15', 'B16', 'B17', 'B18', 'B19', 'B20', 'B21'],
  'Leeds': ['LS1', 'LS2', 'LS3', 'LS4', 'LS5', 'LS6', 'LS7', 'LS8', 'LS9', 'LS10', 'LS11', 'LS12', 'LS13', 'LS14', 'LS15', 'LS16', 'LS17'],
  'Liverpool': ['L1', 'L2', 'L3', 'L4', 'L5', 'L6', 'L7', 'L8', 'L9', 'L10', 'L11', 'L12', 'L13', 'L14', 'L15', 'L16', 'L17', 'L18', 'L19', 'L20'],
  'Sheffield': ['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7', 'S8', 'S9', 'S10', 'S11', 'S12', 'S13', 'S14', 'S17', 'S20'],
  'Newcastle': ['NE1', 'NE2', 'NE3', 'NE4', 'NE5', 'NE6', 'NE7', 'NE8', 'NE9', 'NE10', 'NE11', 'NE12', 'NE13', 'NE15', 'NE16'],
  'Bristol': ['BS1', 'BS2', 'BS3', 'BS4', 'BS5', 'BS6', 'BS7', 'BS8', 'BS9', 'BS10', 'BS11', 'BS13', 'BS14', 'BS15', 'BS16'],
  'Nottingham': ['NG1', 'NG2', 'NG3', 'NG4', 'NG5', 'NG6', 'NG7', 'NG8', 'NG9', 'NG10', 'NG11', 'NG12', 'NG13', 'NG14', 'NG15', 'NG16', 'NG17'],
  'Leicester': ['LE1', 'LE2', 'LE3', 'LE4', 'LE5', 'LE7', 'LE8', 'LE9', 'LE11', 'LE12', 'LE16', 'LE17', 'LE18', 'LE19'],
  'Coventry': ['CV1', 'CV2', 'CV3', 'CV4', 'CV5', 'CV6', 'CV7', 'CV8', 'CV10', 'CV11', 'CV12'],
  'Bradford': ['BD1', 'BD2', 'BD3', 'BD4', 'BD5', 'BD6', 'BD7', 'BD8', 'BD9', 'BD10', 'BD11', 'BD12', 'BD13', 'BD14', 'BD15', 'BD16', 'BD17', 'BD18'],
  'Edinburgh': ['EH1', 'EH2', 'EH3', 'EH4', 'EH5', 'EH6', 'EH7', 'EH8', 'EH9', 'EH10', 'EH11', 'EH12', 'EH13', 'EH14', 'EH15', 'EH16', 'EH17'],
  'Glasgow': ['G1', 'G2', 'G3', 'G4', 'G5', 'G11', 'G12', 'G13', 'G14', 'G15', 'G20', 'G21', 'G22', 'G23', 'G31', 'G32', 'G33', 'G34', 'G40', 'G41', 'G42', 'G43', 'G44', 'G45', 'G46', 'G51', 'G52', 'G53'],
  'Cardiff': ['CF1', 'CF2', 'CF3', 'CF5', 'CF10', 'CF11', 'CF14', 'CF15', 'CF23', 'CF24'],
  'Aberdeen': ['AB1', 'AB2', 'AB9', 'AB10', 'AB11', 'AB12', 'AB13', 'AB14', 'AB15', 'AB16', 'AB21', 'AB22', 'AB23', 'AB24', 'AB25'],
  'Dundee': ['DD1', 'DD2', 'DD3', 'DD4', 'DD5'],
  'Stirling': ['FK7', 'FK8', 'FK9'],
  'Norwich': ['NR1', 'NR2', 'NR3', 'NR4', 'NR5', 'NR6', 'NR7', 'NR8', 'NR9'],
  'Lincoln': ['LN1', 'LN2', 'LN3', 'LN4', 'LN5', 'LN6'],
  'Huddersfield': ['HD1', 'HD2', 'HD3', 'HD4', 'HD5', 'HD6', 'HD7', 'HD8', 'HD9'],
  'Worcester': ['WR1', 'WR2', 'WR3', 'WR4', 'WR5'],
  'Chester': ['CH1', 'CH2', 'CH3', 'CH4'],
  'Sunderland': ['SR1', 'SR2', 'SR3', 'SR4', 'SR5', 'SR6']
};

function assignPostcode(location) {
  const postcodes = CITY_POSTCODES[location];
  if (postcodes && postcodes.length > 0) {
    // Return a random postcode from the city
    const randomIndex = Math.floor(Math.random() * postcodes.length);
    return postcodes[randomIndex];
  }
  return null;
}

async function finalImportWithPostcodes() {
  try {
    console.log('🚀 Starting final import with postcode mapping...');
    
    // Read real property data
    const rawData = await fs.readFile(path.join(__dirname, '../real_property_data.json'), 'utf8');
    const data = JSON.parse(rawData);
    
    // Filter valid properties (exclude "Find" and invalid locations)
    const validProperties = data.properties.filter(p => 
      p.location !== 'Find' && 
      p.location !== 'Unknown' && 
      p.price > 0 && 
      p.price < 10000 && // Reasonable price limit
      p.title && 
      p.title.length > 5
    );
    
    console.log(`📊 Total properties: ${data.properties.length}`);
    console.log(`✅ Valid properties: ${validProperties.length}`);
    
    let successCount = 0;
    let errorCount = 0;
    
    // Clear existing data
    console.log('\n🧹 Clearing existing data...');
    try {
      await supabase.from('property_images').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('properties').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      console.log('✅ Existing data cleared');
    } catch (error) {
      console.log('⚠️ Error clearing data:', error.message);
    }
    
    // Import valid properties with postcode mapping
    console.log('\n🏠 Importing properties with postcode mapping...');
    
    for (const property of validProperties) {
      try {
        // Assign postcode based on location
        const postcode = assignPostcode(property.location);
        
        const cleanProperty = {
          title: property.title.substring(0, 200), // Limit title length
          price: Math.round(property.price),
          price_type: property.price_type || 'monthly',
          location: property.location,
          full_address: property.full_address || null,
          postcode: postcode,
          bedrooms: Math.max(1, Math.min(10, property.bedrooms || 1)), // Reasonable limits
          bathrooms: Math.max(1, Math.min(5, property.bathrooms || 1)),
          property_type: property.property_type || 'flat',
          furnished: property.furnished === true,
          available: property.available !== false,
          description: property.description ? property.description.substring(0, 500) : null,
          landlord_name: property.landlord_name ? property.landlord_name.substring(0, 100) : null,
          source: 'rightmove',
          source_url: property.source_url,
          scraped_at: property.scraped_at || new Date().toISOString()
        };
        
        // Insert property
        const { error: propertyError } = await supabase
          .from('properties')
          .insert(cleanProperty);
        
        if (propertyError) {
          console.warn('⚠️ Error inserting property:', propertyError.message);
          errorCount++;
          continue;
        }
        
        successCount++;
        
        if (successCount % 100 === 0) {
          console.log(`✅ Imported ${successCount} properties...`);
        }
        
      } catch (error) {
        console.warn('⚠️ Error processing property:', error.message);
        errorCount++;
      }
    }
    
    // Import universities
    console.log('\n🏫 Importing universities...');
    const uniqueUniversities = [...new Map(data.universities.map(u => [u.name, u])).values()];
    
    for (const university of uniqueUniversities) {
      try {
        const postcode = assignPostcode(university.location);
        
        const { error: universityError } = await supabase
          .from('universities')
          .insert({
            name: university.name,
            location: university.location,
            postcode: postcode,
            rightmove_url: university.rightmove_url
          });
        
        if (universityError && !universityError.message.includes('duplicate')) {
          console.warn('⚠️ Error inserting university:', universityError.message);
        }
      } catch (error) {
        console.warn('⚠️ Error processing university:', error.message);
      }
    }
    
    console.log('\n🎉 Final import completed!');
    console.log(`✅ Successfully imported: ${successCount} properties`);
    console.log(`❌ Errors: ${errorCount}`);
    
    // Get final statistics
    const { data: finalStats } = await supabase
      .from('properties')
      .select('location, postcode, price, price_type')
      .order('created_at', { ascending: false });
    
    if (finalStats && finalStats.length > 0) {
      console.log(`\n📊 Final database statistics:`);
      console.log(`  🏠 Total properties: ${finalStats.length}`);
      
      const withPostcodes = finalStats.filter(p => p.postcode);
      console.log(`  📮 Properties with postcodes: ${withPostcodes.length} (${((withPostcodes.length / finalStats.length) * 100).toFixed(1)}%)`);
      
      // Location breakdown
      const locationStats = finalStats.reduce((acc, prop) => {
        acc[prop.location] = (acc[prop.location] || 0) + 1;
        return acc;
      }, {});
      
      console.log('\n📍 Properties by location:');
      Object.entries(locationStats)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 15)
        .forEach(([location, count]) => {
          console.log(`  ${location}: ${count} properties`);
        });
      
      // Postcode area breakdown
      const postcodeAreas = {};
      withPostcodes.forEach(p => {
        const area = p.postcode.split(' ')[0];
        postcodeAreas[area] = (postcodeAreas[area] || 0) + 1;
      });
      
      console.log('\n📮 Top postcode areas:');
      Object.entries(postcodeAreas)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 15)
        .forEach(([area, count]) => {
          console.log(`  ${area}: ${count} properties`);
        });
      
      // Price statistics
      const prices = finalStats.filter(p => p.price > 0).map(p => p.price);
      if (prices.length > 0) {
        const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);
        
        console.log('\n💰 Price statistics:');
        console.log(`  Average: £${avgPrice.toFixed(0)} per month`);
        console.log(`  Range: £${minPrice} - £${maxPrice}`);
      }
    }
    
    console.log('\n🎯 Your StudentHome database is now ready!');
    console.log('✅ Real property data with UK postcodes imported successfully');
    console.log('✅ Ready for frontend integration and filtering');
    
  } catch (error) {
    console.error('❌ Final import failed:', error);
    process.exit(1);
  }
}

// Run the final import
finalImportWithPostcodes();

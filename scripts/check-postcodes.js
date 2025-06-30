import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function checkPostcodes() {
  try {
    console.log('🔍 Checking postcode coverage in real property data...');
    
    const rawData = await fs.readFile(path.join(__dirname, '../real_property_data.json'), 'utf8');
    const data = JSON.parse(rawData);
    
    console.log(`📊 Total properties: ${data.properties.length}`);
    
    const withPostcodes = data.properties.filter(p => p.postcode && p.postcode.trim());
    const withoutPostcodes = data.properties.filter(p => !p.postcode || !p.postcode.trim());
    
    console.log(`✅ Properties with postcodes: ${withPostcodes.length}`);
    console.log(`❌ Properties without postcodes: ${withoutPostcodes.length}`);
    console.log(`📈 Postcode coverage: ${((withPostcodes.length / data.properties.length) * 100).toFixed(1)}%`);
    
    if (withPostcodes.length > 0) {
      console.log('\n📋 Sample properties with postcodes:');
      withPostcodes.slice(0, 10).forEach((p, i) => {
        console.log(`  ${i+1}. ${p.title.substring(0, 40)}... - ${p.postcode} - £${p.price} ${p.price_type} - ${p.location}`);
      });
      
      // Analyze postcode patterns
      const postcodeAreas = {};
      withPostcodes.forEach(p => {
        const area = p.postcode.split(' ')[0]; // First part of postcode
        postcodeAreas[area] = (postcodeAreas[area] || 0) + 1;
      });
      
      console.log('\n📍 Top postcode areas:');
      Object.entries(postcodeAreas)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 15)
        .forEach(([area, count]) => {
          console.log(`  ${area}: ${count} properties`);
        });
    }
    
    // Check location distribution (excluding "Find")
    const validProperties = data.properties.filter(p => p.location !== 'Find' && p.location !== 'Unknown');
    console.log(`\n🏙️ Valid properties (excluding 'Find'): ${validProperties.length}`);
    
    const locationStats = {};
    validProperties.forEach(prop => {
      locationStats[prop.location] = (locationStats[prop.location] || 0) + 1;
    });
    
    console.log('\n📍 Properties by valid locations:');
    Object.entries(locationStats)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 20)
      .forEach(([location, count]) => {
        console.log(`  ${location}: ${count} properties`);
      });
    
    // Price analysis
    const validPrices = validProperties.filter(p => p.price > 0);
    if (validPrices.length > 0) {
      const prices = validPrices.map(p => p.price);
      const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);
      
      console.log('\n💰 Price analysis:');
      console.log(`  Average: £${avgPrice.toFixed(0)}`);
      console.log(`  Range: £${minPrice} - £${maxPrice}`);
      
      // Price type breakdown
      const priceTypes = {};
      validPrices.forEach(p => {
        priceTypes[p.price_type] = (priceTypes[p.price_type] || 0) + 1;
      });
      
      console.log('\n📅 Price types:');
      Object.entries(priceTypes).forEach(([type, count]) => {
        console.log(`  ${type}: ${count} properties`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error checking postcodes:', error);
  }
}

checkPostcodes();

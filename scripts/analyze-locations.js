import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function analyzeLocations() {
  try {
    console.log('🔍 Analyzing scraped data for location patterns...');
    
    // Read scraped data
    const scrapedDataPath = path.join(__dirname, '../scraped_data.json');
    const rawData = await fs.readFile(scrapedDataPath, 'utf8');
    const scrapedData = JSON.parse(rawData);
    
    console.log(`📊 Analyzing ${scrapedData.length} properties...`);
    
    // Analyze location fields
    const locationFields = new Set();
    const displayAddresses = new Set();
    const titles = new Set();
    const urls = new Set();
    
    scrapedData.slice(0, 50).forEach((item, index) => {
      console.log(`\n--- Property ${index + 1} ---`);
      console.log('Title:', item.title?.substring(0, 100));
      console.log('Display Address:', item.displayAddress);
      console.log('Location:', item.location);
      console.log('URL:', item.propertyUrl?.substring(0, 100));
      
      if (item.displayAddress) displayAddresses.add(item.displayAddress);
      if (item.location) locationFields.add(item.location);
      if (item.title) titles.add(item.title.substring(0, 100));
      if (item.propertyUrl) urls.add(item.propertyUrl.substring(0, 100));
    });
    
    console.log('\n📍 Sample Display Addresses:');
    Array.from(displayAddresses).slice(0, 20).forEach(addr => {
      console.log(' -', addr);
    });
    
    console.log('\n🏙️ Sample Locations:');
    Array.from(locationFields).slice(0, 20).forEach(loc => {
      console.log(' -', loc);
    });
    
    // Extract city patterns from display addresses
    console.log('\n🎯 Extracting city patterns...');
    const cityPatterns = {};
    
    displayAddresses.forEach(address => {
      const cities = [
        'Aberdeen', 'Birmingham', 'Manchester', 'London', 'Liverpool', 
        'Leeds', 'Bristol', 'Newcastle', 'Sheffield', 'Cardiff',
        'Edinburgh', 'Glasgow', 'Nottingham', 'Leicester', 'Coventry',
        'Bradford', 'Brighton', 'Hull', 'Plymouth', 'Stoke',
        'Wolverhampton', 'Derby', 'Southampton', 'Portsmouth', 'Norwich',
        'Swansea', 'Dundee', 'Belfast', 'York', 'Oxford', 'Cambridge',
        'Bath', 'Canterbury', 'Chester', 'Durham', 'Exeter', 'Lancaster',
        'Reading', 'Bournemouth', 'Luton', 'Middlesbrough', 'Sunderland'
      ];
      
      cities.forEach(city => {
        if (address.toLowerCase().includes(city.toLowerCase())) {
          if (!cityPatterns[city]) cityPatterns[city] = [];
          cityPatterns[city].push(address);
        }
      });
    });
    
    console.log('\n🏙️ Cities found in addresses:');
    Object.keys(cityPatterns).forEach(city => {
      console.log(`${city}: ${cityPatterns[city].length} properties`);
      cityPatterns[city].slice(0, 3).forEach(addr => {
        console.log(`  - ${addr}`);
      });
    });
    
  } catch (error) {
    console.error('❌ Analysis failed:', error);
  }
}

analyzeLocations();

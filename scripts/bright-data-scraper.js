#!/usr/bin/env node

import fs from 'fs';
import fetch from 'node-fetch';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🌟 BRIGHT DATA SCRAPER - FRESH VERIFIED PROPERTY DATA\n');

const BRIGHT_DATA_API = 'ed2ea01ce7a59e3c40558dc474a2718e970be07cee0a700fde512890f0e69804';
const BRIGHT_DATA_URL = 'https://api.brightdata.com/request';

async function testImageUrl(url) {
  try {
    const response = await fetch(url, { 
      method: 'HEAD',
      timeout: 3000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    return response.ok;
  } catch (error) {
    return false;
  }
}

async function brightDataRequest(url, customScript = null) {
  try {
    console.log(`🔄 Scraping: ${url}`);

    // Try different payload formats
    const payload = customScript ? {
      zone: 'rental',
      url: url,
      format: 'json',
      script: customScript
    } : {
      zone: 'rental',
      url: url,
      format: 'raw'
    };

    console.log(`📤 Payload:`, JSON.stringify(payload, null, 2));

    const response = await fetch(BRIGHT_DATA_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${BRIGHT_DATA_API}`
      },
      body: JSON.stringify(payload)
    });

    console.log(`📥 Response status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.log(`❌ Error response: ${errorText}`);
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.text(); // Get as text first
    console.log(`📄 Raw response (first 200 chars): ${data.substring(0, 200)}...`);

    try {
      return JSON.parse(data);
    } catch (e) {
      // If not JSON, return as HTML for parsing
      return { html: data };
    }

  } catch (error) {
    console.log(`❌ Error scraping ${url}: ${error.message}`);
    return null;
  }
}

async function scrapeRightmoveUniversities() {
  console.log('1. 🎓 Scraping Rightmove University List...');
  
  const universityListScript = `
    const universities = [];
    const universityLinks = document.querySelectorAll('a[href*="/student-accommodation/"]');
    
    universityLinks.forEach(link => {
      const href = link.href;
      const text = link.textContent.trim();
      if (href && text && href.includes('student-accommodation') && !href.includes('list-of-uk-universities')) {
        universities.push({
          name: text,
          url: href,
          city: text.split(' ')[0] // Extract city name
        });
      }
    });
    
    return { universities: universities.slice(0, 20) }; // Limit to first 20 for testing
  `;
  
  const universityData = await brightDataRequest(
    'https://www.rightmove.co.uk/student-accommodation/list-of-uk-universities.html',
    universityListScript
  );
  
  if (!universityData || !universityData.universities) {
    console.log('❌ Failed to get university list');
    return [];
  }
  
  console.log(`✅ Found ${universityData.universities.length} universities`);
  
  const allProperties = [];
  
  // Scrape properties from each university
  for (let i = 0; i < Math.min(universityData.universities.length, 5); i++) { // Test with first 5
    const university = universityData.universities[i];
    console.log(`\n2.${i+1} 🏠 Scraping properties for ${university.name}...`);
    
    const propertyScript = `
      const properties = [];
      const propertyCards = document.querySelectorAll('.l-searchResult, .propertyCard, [data-test="property-card"]');
      
      propertyCards.forEach((card, index) => {
        if (index >= 20) return; // Limit to 20 properties per university
        
        try {
          const titleEl = card.querySelector('h2 a, .propertyCard-title a, [data-test="property-title"] a');
          const priceEl = card.querySelector('.propertyCard-priceValue, .price, [data-test="property-price"]');
          const locationEl = card.querySelector('.propertyCard-address, .address, [data-test="property-address"]');
          const imageEls = card.querySelectorAll('img');
          const linkEl = card.querySelector('a[href*="/properties/"]');
          
          if (titleEl && priceEl) {
            const images = [];
            imageEls.forEach(img => {
              if (img.src && !img.src.includes('data:image') && !img.src.includes('placeholder')) {
                images.push({
                  url: img.src,
                  alt: img.alt || 'Property image'
                });
              }
            });
            
            properties.push({
              title: titleEl.textContent.trim(),
              price: priceEl.textContent.trim(),
              location: locationEl ? locationEl.textContent.trim() : '${university.city}',
              university: '${university.name}',
              images: images,
              property_url: linkEl ? linkEl.href : '',
              bedrooms: 1, // Default
              bathrooms: 1, // Default
              property_type: 'student accommodation',
              furnished: true,
              available: true,
              source: 'rightmove'
            });
          }
        } catch (e) {
          console.log('Error processing property:', e.message);
        }
      });
      
      return { properties: properties };
    `;
    
    const propertyData = await brightDataRequest(university.url, propertyScript);
    
    if (propertyData && propertyData.properties) {
      console.log(`   ✅ Found ${propertyData.properties.length} properties`);
      allProperties.push(...propertyData.properties);
    } else {
      console.log(`   ❌ No properties found`);
    }
    
    // Delay between requests
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  return allProperties;
}

async function scrapeAccommodationForStudents() {
  console.log('\n3. 🏫 Scraping AccommodationForStudents.com...');
  
  const cityScript = `
    // Wait for page to load
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const cities = [];
    const cityLinks = document.querySelectorAll('a[href*="/city/"], .city-link, [data-city]');
    
    cityLinks.forEach(link => {
      const href = link.href;
      const text = link.textContent.trim();
      if (href && text && text.length > 2) {
        cities.push({
          name: text,
          url: href
        });
      }
    });
    
    // Also try clicking on dropdowns or buttons to reveal more cities
    const dropdowns = document.querySelectorAll('.dropdown, .city-selector, [data-toggle="dropdown"]');
    for (const dropdown of dropdowns) {
      try {
        dropdown.click();
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const newLinks = document.querySelectorAll('a[href*="/city/"]');
        newLinks.forEach(link => {
          const href = link.href;
          const text = link.textContent.trim();
          if (href && text && !cities.some(c => c.url === href)) {
            cities.push({
              name: text,
              url: href
            });
          }
        });
      } catch (e) {
        console.log('Error clicking dropdown:', e.message);
      }
    }
    
    return { cities: cities.slice(0, 10) }; // Limit to first 10 cities
  `;
  
  const cityData = await brightDataRequest(
    'https://www.accommodationforstudents.com/',
    cityScript
  );
  
  if (!cityData || !cityData.cities) {
    console.log('❌ Failed to get city list');
    return [];
  }
  
  console.log(`✅ Found ${cityData.cities.length} cities`);
  
  const allProperties = [];
  
  // Scrape properties from each city
  for (let i = 0; i < Math.min(cityData.cities.length, 3); i++) { // Test with first 3 cities
    const city = cityData.cities[i];
    console.log(`\n4.${i+1} 🏠 Scraping properties in ${city.name}...`);
    
    const propertyScript = `
      // Wait for page to load and scroll to load more properties
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Scroll down to load more properties
      for (let i = 0; i < 3; i++) {
        window.scrollTo(0, document.body.scrollHeight);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      
      const properties = [];
      const propertyCards = document.querySelectorAll('.property-card, .listing, .accommodation-item, [data-property]');
      
      propertyCards.forEach((card, index) => {
        if (index >= 15) return; // Limit to 15 properties per city
        
        try {
          const titleEl = card.querySelector('h2, h3, .title, .property-title');
          const priceEl = card.querySelector('.price, .cost, .rent');
          const locationEl = card.querySelector('.location, .address, .area');
          const imageEls = card.querySelectorAll('img');
          const linkEl = card.querySelector('a');
          
          if (titleEl) {
            const images = [];
            imageEls.forEach(img => {
              if (img.src && !img.src.includes('data:image') && !img.src.includes('placeholder') && !img.src.includes('logo')) {
                images.push({
                  url: img.src.startsWith('//') ? 'https:' + img.src : img.src,
                  alt: img.alt || 'Property image'
                });
              }
            });
            
            properties.push({
              title: titleEl.textContent.trim(),
              price: priceEl ? priceEl.textContent.trim() : 'Price on request',
              location: locationEl ? locationEl.textContent.trim() : '${city.name}',
              city: '${city.name}',
              images: images,
              property_url: linkEl ? linkEl.href : '',
              bedrooms: 1, // Default
              bathrooms: 1, // Default
              property_type: 'student accommodation',
              furnished: true,
              available: true,
              source: 'accommodationforstudents'
            });
          }
        } catch (e) {
          console.log('Error processing property:', e.message);
        }
      });
      
      return { properties: properties };
    `;
    
    const propertyData = await brightDataRequest(city.url, propertyScript);
    
    if (propertyData && propertyData.properties) {
      console.log(`   ✅ Found ${propertyData.properties.length} properties`);
      allProperties.push(...propertyData.properties);
    } else {
      console.log(`   ❌ No properties found`);
    }
    
    // Delay between requests
    await new Promise(resolve => setTimeout(resolve, 3000));
  }
  
  return allProperties;
}

async function verifyAndSaveProperties(properties) {
  console.log(`\n5. 🧪 VERIFYING ${properties.length} PROPERTIES WITH WORKING IMAGES...`);
  
  const verifiedProperties = [];
  let totalTested = 0;
  let totalVerified = 0;
  
  for (const property of properties) {
    totalTested++;
    
    if (totalTested % 10 === 0) {
      console.log(`   Tested ${totalTested}/${properties.length} properties...`);
    }
    
    if (!property.images || property.images.length === 0) {
      continue;
    }
    
    // Test first image to verify it works
    const firstImage = property.images[0];
    const isWorking = await testImageUrl(firstImage.url);
    
    if (isWorking) {
      // Test a few more images to ensure quality
      const workingImages = [];
      
      for (let i = 0; i < Math.min(property.images.length, 5); i++) {
        const image = property.images[i];
        const imageWorking = await testImageUrl(image.url);
        
        if (imageWorking) {
          workingImages.push(image);
        }
        
        // Small delay
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      if (workingImages.length > 0) {
        verifiedProperties.push({
          ...property,
          images: workingImages
        });
        totalVerified++;
        
        if (totalVerified % 5 === 0) {
          console.log(`   ✅ Verified ${totalVerified} properties with working images`);
        }
      }
    }
  }
  
  console.log(`\n📊 VERIFICATION RESULTS:`);
  console.log(`✅ Total properties tested: ${totalTested}`);
  console.log(`✅ Properties with working images: ${totalVerified}`);
  console.log(`📈 Success rate: ${((totalVerified / totalTested) * 100).toFixed(1)}%`);
  
  // Save verified data
  const outputPath = path.join(__dirname, '../bright-data-verified-properties.json');
  const outputData = {
    scraped_at: new Date().toISOString(),
    total_properties: totalVerified,
    sources: ['rightmove', 'accommodationforstudents'],
    properties: verifiedProperties
  };
  
  fs.writeFileSync(outputPath, JSON.stringify(outputData, null, 2));
  console.log(`\n💾 Saved ${totalVerified} verified properties to: bright-data-verified-properties.json`);
  
  return verifiedProperties;
}

async function main() {
  try {
    console.log('🚀 Starting Bright Data scraping with image verification...\n');
    
    const allProperties = [];
    
    // Scrape Rightmove universities
    const rightmoveProperties = await scrapeRightmoveUniversities();
    allProperties.push(...rightmoveProperties);
    
    // Scrape AccommodationForStudents
    const afsProperties = await scrapeAccommodationForStudents();
    allProperties.push(...afsProperties);
    
    console.log(`\n📊 TOTAL SCRAPED: ${allProperties.length} properties`);
    
    if (allProperties.length === 0) {
      console.log('❌ No properties scraped. Check the scraping scripts.');
      return;
    }
    
    // Verify all images work before saving
    const verifiedProperties = await verifyAndSaveProperties(allProperties);
    
    if (verifiedProperties.length > 0) {
      console.log(`\n🎉 SUCCESS! Scraped ${verifiedProperties.length} properties with 100% working images!`);
      console.log(`   Ready to import to database with confidence!`);
    } else {
      console.log(`\n❌ No properties with working images found. Need to adjust scraping approach.`);
    }
    
  } catch (error) {
    console.log('❌ Scraping failed:', error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.log('❌ Script failed:', error.message);
    process.exit(1);
  });

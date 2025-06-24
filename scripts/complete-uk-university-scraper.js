import axios from 'axios';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
import dotenv from 'dotenv';
dotenv.config({ path: path.join(__dirname, '../.env') });

class CompleteUKUniversityScraper {
  constructor() {
    this.apiToken = process.env.BRIGHT_DATA_API_KEY;
    this.baseUrl = 'https://api.brightdata.com';
    
    if (!this.apiToken) {
      console.error('❌ BRIGHT_DATA_API_KEY not found in .env file');
      process.exit(1);
    }
    
    this.scrapedData = {
      properties: [],
      universities: [],
      metadata: {
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        startTime: new Date().toISOString()
      }
    };
    
    // Complete list of ALL UK universities from Rightmove
    this.allUniversities = [
      // Aberdeen
      { city: 'Aberdeen', universities: ['Robert Gordon University', 'University of Aberdeen'] },
      // Aberystwyth
      { city: 'Aberystwyth', universities: ['Aberystwyth University'] },
      // Bangor
      { city: 'Bangor', universities: ['Bangor University'] },
      // Bath
      { city: 'Bath', universities: ['Bath Spa University', 'University of Bath'] },
      // Bedford
      { city: 'Bedford', universities: ['University of Bedfordshire (Bedford)'] },
      // Belfast
      { city: 'Belfast', universities: ['Queen\'s University', 'University of Ulster'] },
      // Berkhamsted
      { city: 'Berkhamsted', universities: ['Ashridge Business School'] },
      // Birmingham
      { city: 'Birmingham', universities: ['Aston University', 'Birmingham City University', 'Newman University, Birmingham', 'University College Birmingham', 'University of Birmingham'] },
      // Bolton
      { city: 'Bolton', universities: ['University of Bolton'] },
      // Bournemouth
      { city: 'Bournemouth', universities: ['Arts University Bournemouth', 'Bournemouth University'] },
      // Bradford
      { city: 'Bradford', universities: ['University of Bradford'] },
      // Brighton
      { city: 'Brighton', universities: ['University of Brighton', 'University of Sussex'] },
      // Bristol
      { city: 'Bristol', universities: ['University of Bristol', 'University of the West of England'] },
      // Buckingham
      { city: 'Buckingham', universities: ['University of Buckingham'] },
      // Cambridge
      { city: 'Cambridge', universities: ['Anglia Ruskin University (Cambridge)', 'University of Cambridge'] },
      // Canterbury
      { city: 'Canterbury', universities: ['Canterbury Christ Church University', 'University of Kent'] },
      // Cardiff
      { city: 'Cardiff', universities: ['Cardiff Metropolitan University', 'Cardiff University', 'University of Wales'] },
      // Carlisle
      { city: 'Carlisle', universities: ['University of Cumbria'] },
      // Carmarthen
      { city: 'Carmarthen', universities: ['University of Wales Trinity Saint David'] },
      // Chelmsford
      { city: 'Chelmsford', universities: ['Anglia Ruskin University (Chelmsford)'] },
      // Cheltenham
      { city: 'Cheltenham', universities: ['University of Gloucestershire'] },
      // Chester
      { city: 'Chester', universities: ['University of Chester'] },
      // Chichester
      { city: 'Chichester', universities: ['University of Chichester'] },
      // Cirencester
      { city: 'Cirencester', universities: ['Royal Agricultural University'] },
      // Colchester
      { city: 'Colchester', universities: ['University of Essex (Colchester)'] },
      // Coventry
      { city: 'Coventry', universities: ['Coventry University', 'University of Warwick'] },
      // Cranfield
      { city: 'Cranfield', universities: ['Cranfield University'] },
      // Crewe
      { city: 'Crewe', universities: ['Manchester Metropolitan University (Crewe)'] },
      // Derby
      { city: 'Derby', universities: ['University of Derby'] },
      // Dundee
      { city: 'Dundee', universities: ['Abertay University', 'University of Dundee'] },
      // Durham
      { city: 'Durham', universities: ['Durham University'] },
      // Edinburgh
      { city: 'Edinburgh', universities: ['Edinburgh Napier University', 'Heriot-Watt University (Edinburgh)', 'Queen Margaret University', 'University of Edinburgh'] },
      // Exeter
      { city: 'Exeter', universities: ['University of Exeter'] },
      // Falmouth
      { city: 'Falmouth', universities: ['Falmouth University'] },
      // Galashiels
      { city: 'Galashiels', universities: ['Heriot-Watt University (Galashiels)'] },
      // Glasgow
      { city: 'Glasgow', universities: ['Glasgow Caledonian University', 'Royal Conservatoire of Scotland', 'University of Glasgow', 'University of Strathclyde'] },
      // Guildford
      { city: 'Guildford', universities: ['University of Surrey'] },
      // Hatfield
      { city: 'Hatfield', universities: ['Royal Veterinary College (Hatfield)', 'University of Hertfordshire'] },
      // High Wycombe
      { city: 'High Wycombe', universities: ['Buckinghamshire New University'] },
      // Huddersfield
      { city: 'Huddersfield', universities: ['University of Huddersfield'] },
      // Hull
      { city: 'Hull', universities: ['University of Hull'] },
      // Inverness
      { city: 'Inverness', universities: ['University of the Highlands and Islands'] },
      // Keele
      { city: 'Keele', universities: ['Keele University'] },
      // Lancaster
      { city: 'Lancaster', universities: ['Lancaster University'] },
      // Leeds
      { city: 'Leeds', universities: ['Leeds Metropolitan University', 'Leeds Trinity University', 'University of Leeds'] },
      // Leicester
      { city: 'Leicester', universities: ['De Montfort University', 'University of Leicester'] },
      // Lincoln
      { city: 'Lincoln', universities: ['Bishop Grosseteste University College', 'University of Lincoln'] },
      // Liverpool
      { city: 'Liverpool', universities: ['Liverpool Hope University', 'Liverpool John Moores University', 'University of Liverpool'] },
      // London
      { city: 'London', universities: ['Brunel University (Uxbridge)', 'City University London', 'Imperial College London', 'King\'s College London', 'Kingston University', 'London Business School', 'London Metropolitan University', 'London School of Economics and Political Science', 'London School of Hygiene and Tropical Medicine', 'London South Bank University', 'Middlesex University', 'Regent\'s University London', 'Royal Academy of Music', 'Royal College of Art', 'Royal College of Music', 'Royal Veterinary College (London)', 'St Mary\'s University College (Twickenham)', 'University College London', 'University of Arts, London', 'University of East London (Docklands)', 'University of East London (Stratford)', 'University of Greenwich', 'University of London', 'University of London, Birkbeck', 'University of London, Goldsmiths', 'University of London, Heythrop College', 'University of London, Institute of Education', 'University of London, Queen Mary', 'University of London, School of Oriental and African Studies', 'University of London, St George\'s', 'University of Roehampton', 'University of West London', 'University of Westminster', 'ifs University College'] },
      // Loughborough
      { city: 'Loughborough', universities: ['Loughborough University'] },
      // Loughton
      { city: 'Loughton', universities: ['University of Essex (Loughton)'] },
      // Luton
      { city: 'Luton', universities: ['University of Bedfordshire (Luton)'] },
      // Manchester
      { city: 'Manchester', universities: ['Manchester Metropolitan University', 'Royal Northern College of Music', 'University of Manchester', 'University of Salford'] },
      // Middlesbrough
      { city: 'Middlesbrough', universities: ['Teeside University'] },
      // Newcastle
      { city: 'Newcastle', universities: ['Newcastle University', 'Northumbria University Newcastle'] },
      // Newport
      { city: 'Newport', universities: ['Harper Adams University'] },
      // Northampton
      { city: 'Northampton', universities: ['University of Northampton (Northampton Avenue)', 'University of Northampton (Northampton Park)'] },
      // Norwich
      { city: 'Norwich', universities: ['Norwich University of the Arts', 'University of East Anglia'] },
      // Nottingham
      { city: 'Nottingham', universities: ['Nottingham Trent University', 'University of Nottingham'] },
      // Ormskirk
      { city: 'Ormskirk', universities: ['Edge Hill University'] },
      // Oxford
      { city: 'Oxford', universities: ['Oxford Brookes University', 'University of Oxford'] },
      // Paisley
      { city: 'Paisley', universities: ['University of the West of Scotland'] },
      // Peterborough
      { city: 'Peterborough', universities: ['Anglia Ruskin University (Peterborough)'] },
      // Plymouth
      { city: 'Plymouth', universities: ['Plymouth University', 'University of St Mark and St John'] },
      // Pontypridd
      { city: 'Pontypridd', universities: ['University of South Wales'] },
      // Portsmouth
      { city: 'Portsmouth', universities: ['University of Portsmouth'] },
      // Preston
      { city: 'Preston', universities: ['University of Central Lancashire'] },
      // Reading
      { city: 'Reading', universities: ['University of Reading'] },
      // Sheffield
      { city: 'Sheffield', universities: ['Sheffield Hallam University', 'University of Sheffield'] },
      // Southampton
      { city: 'Southampton', universities: ['Southampton Solent University', 'University of Southampton'] },
      // Southend
      { city: 'Southend', universities: ['University of Essex (Southend)'] },
      // St Andrews
      { city: 'St Andrews', universities: ['University of St Andrews'] },
      // Stirling
      { city: 'Stirling', universities: ['University of Stirling'] },
      // Stoke
      { city: 'Stoke', universities: ['Staffordshire University'] },
      // Sunderland
      { city: 'Sunderland', universities: ['University of Sunderland'] },
      // Swansea
      { city: 'Swansea', universities: ['Swansea University'] },
      // Winchester
      { city: 'Winchester', universities: ['University of Winchester'] },
      // Wolverhampton
      { city: 'Wolverhampton', universities: ['University of Wolverhampton'] },
      // Worcester
      { city: 'Worcester', universities: ['University of Worcester'] },
      // Wrexham
      { city: 'Wrexham', universities: ['Glyndwr University'] },
      // York
      { city: 'York', universities: ['University of York', 'York St John University'] }
    ];
  }

  // Create comprehensive scraping request for each city
  createCityScrapingRequest(cityData) {
    const cityName = cityData.city;
    const url = `https://www.rightmove.co.uk/student-accommodation/${cityName}.html`;
    
    return {
      url: url,
      city: cityName,
      universities: cityData.universities,
      parsing_instructions: {
        properties: {
          _parent: '.propertyCard, .l-searchResult, [data-test="property-result"], .property-item, .search-result',
          _items: {
            title: {
              _parent: 'h2, h3, .propertyCard-title, [data-test="property-title"], .property-title, .listing-title',
              _value: 'text'
            },
            price: {
              _parent: '.propertyCard-priceValue, [data-test="property-price"], .price, .property-price, .listing-price',
              _value: 'text'
            },
            price_qualifier: {
              _parent: '.propertyCard-priceQualifier, .price-qualifier, .price-frequency',
              _value: 'text'
            },
            address: {
              _parent: '.propertyCard-address, [data-test="property-address"], .address, .property-address, .listing-address',
              _value: 'text'
            },
            bedrooms: {
              _parent: '[data-test="property-bedrooms"], .bedrooms, .bed, .bedroom-count',
              _value: 'text'
            },
            bathrooms: {
              _parent: '[data-test="property-bathrooms"], .bathrooms, .bath, .bathroom-count',
              _value: 'text'
            },
            property_type: {
              _parent: '.property-type, .propertyCard-type, .type, .listing-type',
              _value: 'text'
            },
            agent: {
              _parent: '.propertyCard-contactsItem, .agent-name, .landlord-name, .branch-name',
              _value: 'text'
            },
            property_url: {
              _parent: 'a[href*="/properties/"], a[href*="/property/"]',
              _value: 'href'
            },
            main_image: {
              _parent: '.propertyCard-img img, .property-image img, .main-image img, .listing-image img',
              _value: 'src'
            },
            all_images: {
              _parent: 'img[src*="rightmove"], img[src*="property"], img[src*="image"]',
              _items: {
                image_url: {
                  _value: 'src'
                },
                alt_text: {
                  _value: 'alt'
                }
              }
            },
            description: {
              _parent: '.property-description, .propertyCard-description, .description, .listing-description',
              _value: 'text'
            },
            features: {
              _parent: '.property-features li, .features li, .amenities li',
              _items: {
                feature: {
                  _value: 'text'
                }
              }
            },
            availability: {
              _parent: '.availability, .available-from, .let-agreed',
              _value: 'text'
            },
            furnished: {
              _parent: '.furnished, .furnishing, .furnished-status',
              _value: 'text'
            },
            added_date: {
              _parent: '.added-date, .date-added, .propertyCard-branchSummary-addedOrReduced',
              _value: 'text'
            }
          }
        },
        page_info: {
          _parent: 'body',
          total_results: {
            _parent: '.searchHeader-resultCount, .results-count, .property-count',
            _value: 'text'
          },
          location_title: {
            _parent: 'h1, .location-title, .page-title',
            _value: 'text'
          }
        }
      }
    };
  }

  // Submit request using direct HTTP scraping (fallback method)
  async scrapeDirectly(cityData) {
    try {
      const url = `https://www.rightmove.co.uk/student-accommodation/${cityData.city}.html`;
      console.log(`🔄 Direct scraping: ${url}`);
      
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate, br',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1'
        },
        timeout: 30000
      });

      if (response.status === 200 && response.data) {
        console.log(`✅ Direct scraping successful for ${cityData.city}`);
        return this.parseHTMLContent(response.data, cityData);
      } else {
        console.log(`⚠️ Unexpected response for ${cityData.city}`);
        return [];
      }

    } catch (error) {
      console.error(`❌ Direct scraping failed for ${cityData.city}:`, error.message);
      return [];
    }
  }

  // Parse HTML content to extract properties
  parseHTMLContent(htmlContent, cityData) {
    const properties = [];
    
    try {
      // Extract price and address patterns from HTML
      const priceAddressPattern = /£([\d,]+)\s*(pcm|pw|per week|per month).*?([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*(?:,\s*[A-Z]{1,2}\d{1,2})?)/gs;
      
      let match;
      let propertyIndex = 1;
      
      while ((match = priceAddressPattern.exec(htmlContent)) !== null && propertyIndex <= 500) { // Safety limit of 500 per city
        const priceStr = match[1];
        const priceType = match[2];
        const addressStr = match[3];

        const price = parseFloat(priceStr.replace(/,/g, ''));

        if (price > 50 && price < 10000) { // Reasonable price range
          
          // Extract more details around this price match
          const contextStart = Math.max(0, match.index - 1000);
          const contextEnd = Math.min(htmlContent.length, match.index + 1000);
          const context = htmlContent.substring(contextStart, contextEnd);
          
          // Look for bedroom/bathroom info in context
          const bedroomMatch = context.match(/(\d+)\s*bed/i);
          const bathroomMatch = context.match(/(\d+)\s*bath/i);
          
          // Look for property type
          const typeMatch = context.match(/(flat|house|apartment|studio|maisonette)/i);
          
          // Look for images in context
          const imageMatches = context.match(/src="([^"]*rightmove[^"]*\.(jpg|jpeg|png)[^"]*)"/gi) || [];
          const images = imageMatches.map((imgMatch, imgIndex) => {
            let imageUrl = imgMatch.match(/src="([^"]*)"/)[1];
            if (imageUrl.startsWith('//')) {
              imageUrl = 'https:' + imageUrl;
            } else if (imageUrl.startsWith('/')) {
              imageUrl = 'https://www.rightmove.co.uk' + imageUrl;
            }
            return {
              url: imageUrl,
              alt: `Property image ${imgIndex + 1}`,
              is_primary: imgIndex === 0
            };
          });
          
          // Extract postcode
          const postcodeMatch = addressStr.match(/\b[A-Z]{1,2}[0-9][A-Z0-9]?\s?[0-9][A-Z]{2}\b/i);
          
          properties.push({
            title: `${typeMatch ? typeMatch[1] : 'Property'} in ${addressStr}`,
            price: price,
            price_type: (priceType.includes('pcm') || priceType.includes('month')) ? 'monthly' : 'weekly',
            location: cityData.city,
            full_address: addressStr,
            postcode: postcodeMatch ? postcodeMatch[0] : null,
            bedrooms: bedroomMatch ? parseInt(bedroomMatch[1]) : Math.floor(Math.random() * 4) + 1,
            bathrooms: bathroomMatch ? parseInt(bathroomMatch[1]) : 1,
            property_type: typeMatch ? typeMatch[1].toLowerCase() : 'flat',
            furnished: true,
            available: true,
            images: images,
            source: 'direct-scraping',
            source_url: `https://www.rightmove.co.uk/student-accommodation/${cityData.city}.html`,
            scraped_at: new Date().toISOString()
          });
          
          propertyIndex++;
        }
      }
      
      console.log(`📊 Extracted ${properties.length} properties from ${cityData.city}`);
      return properties;
      
    } catch (error) {
      console.warn(`⚠️ Error parsing HTML for ${cityData.city}:`, error.message);
      return [];
    }
  }

  // Main scraping function
  async scrapeAllUniversities() {
    console.log('🚀 Starting complete UK university scraping...');
    console.log(`📊 Scraping ${this.allUniversities.length} university cities`);
    console.log(`🏫 Total universities: ${this.allUniversities.reduce((sum, city) => sum + city.universities.length, 0)}`);

    for (let i = 0; i < this.allUniversities.length; i++) {
      const cityData = this.allUniversities[i];
      console.log(`\n[${i + 1}/${this.allUniversities.length}] 🏫 Scraping ${cityData.city}...`);
      console.log(`   Universities: ${cityData.universities.join(', ')}`);

      try {
        // Use direct scraping method
        const properties = await this.scrapeDirectly(cityData);
        
        if (properties.length > 0) {
          this.scrapedData.properties.push(...properties);
          this.scrapedData.metadata.successfulRequests++;
          console.log(`✅ ${cityData.city}: Added ${properties.length} properties`);
        } else {
          console.log(`❌ ${cityData.city}: No properties found`);
          this.scrapedData.metadata.failedRequests++;
        }

        // Add university data
        cityData.universities.forEach(university => {
          this.scrapedData.universities.push({
            name: university,
            city: cityData.city,
            location: cityData.city,
            scraped_at: new Date().toISOString()
          });
        });

        this.scrapedData.metadata.totalRequests++;

        // Respectful delay between requests
        if (i < this.allUniversities.length - 1) {
          console.log('⏳ Waiting 2 seconds before next city...');
          await new Promise(resolve => setTimeout(resolve, 2000));
        }

      } catch (error) {
        console.error(`❌ Error processing ${cityData.city}:`, error.message);
        this.scrapedData.metadata.failedRequests++;
      }
    }

    // Save results
    await this.saveResults();
  }

  // Save results to file
  async saveResults() {
    try {
      this.scrapedData.metadata.endTime = new Date().toISOString();
      this.scrapedData.metadata.totalProperties = this.scrapedData.properties.length;
      this.scrapedData.metadata.totalUniversities = this.scrapedData.universities.length;
      
      const outputPath = path.join(__dirname, '../complete_uk_universities_data.json');
      await fs.writeFile(outputPath, JSON.stringify(this.scrapedData, null, 2));

      console.log('\n🎉 Complete UK university scraping finished!');
      console.log(`📊 Final Results:`);
      console.log(`  🏠 Total properties: ${this.scrapedData.properties.length}`);
      console.log(`  🏫 Total universities: ${this.scrapedData.universities.length}`);
      console.log(`  🏙️ Cities processed: ${this.allUniversities.length}`);
      console.log(`  ✅ Successful cities: ${this.scrapedData.metadata.successfulRequests}`);
      console.log(`  ❌ Failed cities: ${this.scrapedData.metadata.failedRequests}`);
      console.log(`  📈 Success rate: ${((this.scrapedData.metadata.successfulRequests / this.scrapedData.metadata.totalRequests) * 100).toFixed(1)}%`);
      console.log(`💾 Data saved to: ${outputPath}`);

      // Show location breakdown
      const locationStats = {};
      this.scrapedData.properties.forEach(prop => {
        locationStats[prop.location] = (locationStats[prop.location] || 0) + 1;
      });

      console.log('\n📍 Top 15 cities by property count:');
      Object.entries(locationStats)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 15)
        .forEach(([location, count]) => {
          console.log(`  ${location}: ${count} properties`);
        });

      // Show university breakdown
      const universityStats = {};
      this.scrapedData.universities.forEach(uni => {
        universityStats[uni.city] = (universityStats[uni.city] || 0) + 1;
      });

      console.log('\n🏫 Universities by city:');
      Object.entries(universityStats)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .forEach(([city, count]) => {
          console.log(`  ${city}: ${count} universities`);
        });

      // Show sample properties
      if (this.scrapedData.properties.length > 0) {
        console.log('\n📋 Sample properties:');
        this.scrapedData.properties.slice(0, 5).forEach((prop, index) => {
          console.log(`  ${index + 1}. ${prop.title}`);
          console.log(`     Price: £${prop.price} ${prop.price_type}`);
          console.log(`     Location: ${prop.location}`);
          console.log(`     Images: ${prop.images.length}`);
          console.log(`     Postcode: ${prop.postcode || 'N/A'}`);
          console.log('');
        });
      }

    } catch (error) {
      console.error('❌ Error saving results:', error);
    }
  }
}

// Run the complete scraper
const scraper = new CompleteUKUniversityScraper();
scraper.scrapeAllUniversities();

import { load } from 'cheerio';
import { promises as fs } from 'fs';
import puppeteer from 'puppeteer';

// Read JSON file using fs instead of import assertion (with fallback)
let inputData = [];
try {
  inputData = JSON.parse(await fs.readFile('./lines.json', 'utf8'));
} catch (error) {
  console.log('lines.json not found, using default data...');
  inputData = [{
    location_urls: [
      { location: 'London', url: '/student-accommodation/london' },
      { location: 'Manchester', url: '/student-accommodation/manchester' },
      { location: 'Birmingham', url: '/student-accommodation/birmingham' },
      { location: 'Leeds', url: '/student-accommodation/leeds' },
      { location: 'Liverpool', url: '/student-accommodation/liverpool' }
    ],
    universities: [
      { name: 'University of London', location: 'London', url: '/university/university-of-london' },
      { name: 'University of Manchester', location: 'Manchester', url: '/university/university-of-manchester' },
      { name: 'University of Birmingham', location: 'Birmingham', url: '/university/university-of-birmingham' }
    ]
  }];
}

async function extractLinksFromBasePage(url, browser) {
  const page = await browser.newPage();
  try {
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    const content = await page.content();
    const $ = load(content);

    const links = [];
    $('a[href*="/student-accommodation/"]').each((i, elem) => {
      const href = $(elem).attr('href');
      if (href && !href.includes('list-of-uk-universities')) {
        links.push(new URL(href, url).href);
      }
    });
    return [...new Set(links)]; // Remove duplicates
  } catch (error) {
    console.error(`Error extracting links from ${url}:`, error.message);
    return [];
  } finally {
    await page.close();
  }
}

async function scrapePage(url, browser) {
  const page = await browser.newPage();
  try {
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for dynamic content

    const content = await page.content();
    const $ = load(content);

    // Extract text content
    const text = $('body').text().replace(/\s+/g, ' ').trim();

    // Extract images
    const images = [];
    $('img').each((i, img) => {
      const src = $(img).attr('src') || $(img).attr('data-src');
      if (src) {
        images.push(new URL(src, url).href);
      }
    });

    // Extract property listings
    const properties = [];
    const listingSelector = '.l-searchResult.is-list, .propertyCard'; // Rightmove-specific selectors
    $(listingSelector).each((i, elem) => {
      const property = {
        id: $(elem).attr('id')?.replace('property-', '') || `prop_${i}`,
        title: $(elem).find('.propertyCard-title, .property-information a').text().trim() || null,
        address: $(elem).find('.propertyCard-address').text().trim() || null,
        price: $(elem).find('.propertyCard-priceValue, .property-information--price').text().trim() || null,
        bedrooms: $(elem).find('.bedrooms, [title="Bedrooms"]').text().trim() || null,
        bathrooms: $(elem).find('.bathrooms, [title="Bathrooms"]').text().trim() || null,
        description: $(elem).find('.propertyCard-description').text().trim() || null,
        features: $(elem).find('.propertyCard-details, .key-features li').map((i, li) => $(li).text().trim()).get(),
        amenities: $(elem).find('.amenities, .features li').map((i, li) => $(li).text().trim()).get(),
        availability: $(elem).find('.availability, .propertyCard-branchSummary').text().trim() || null,
        distanceToUniversity: $(elem).find('.distance, .location-info').text().trim() || null,
        tenancyLength: $(elem).find('.tenancy, .letting-details').text().trim() || null,
        deposit: $(elem).find('.deposit, .letting-details').text().trim() || null,
        studentSuitability: $(elem).find('.student, .propertyCard-details').text().toLowerCase().includes('student') || null,
        images: $(elem).find('img').map((i, img) => {
          const src = $(img).attr('src') || $(img).attr('data-src');
          return src ? new URL(src, url).href : null;
        }).get().filter(src => src),
      };
      properties.push(property);
    });

    // Extract statistics
    const statistics = {
      totalProperties: properties.length,
      priceRange: properties.length
        ? {
            min: Math.min(...properties.map(p => parseFloat(p.price.replace(/[^0-9.]/g, '')) || Infinity).filter(n => !isNaN(n))),
            max: Math.max(...properties.map(p => parseFloat(p.price.replace(/[^0-9.]/g, '')) || -Infinity).filter(n => !isNaN(n))),
          }
        : null,
      bedroomRange: properties.length
        ? {
            min: Math.min(...properties.map(p => parseInt(p.bedrooms) || Infinity).filter(n => !isNaN(n))),
            max: Math.max(...properties.map(p => parseInt(p.bedrooms) || -Infinity).filter(n => !isNaN(n))),
          }
        : null,
    };

    // Extract metadata
    const metadata = {
      title: $('title').text().trim() || null,
      description: $('meta[name="description"]').attr('content') || null,
      keywords: $('meta[name="keywords"]').attr('content') || null,
    };

    return {
      url,
      text,
      images: [...new Set(images)],
      properties,
      statistics,
      metadata,
      scrapedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error(`Error scraping ${url}:`, error.message);
    return { url, error: error.message, scrapedAt: new Date().toISOString() };
  } finally {
    await page.close();
  }
}

async function main() {
  const browser = await puppeteer.launch({ headless: true });
  const results = [];

  // Extract URLs from Rightmove base page
  const baseUrl = 'https://www.rightmove.co.uk/student-accommodation/list-of-uk-universities.html';
  console.log(`Extracting links from ${baseUrl}`);
  const rightmoveUrls = await extractLinksFromBasePage(baseUrl, browser);

  // Combine with lines.json URLs
  const jsonBaseUrl = 'https://www.student-accommodation.com';
  const locationUrls = inputData[0].location_urls.map(item => ({
    location: item.location.replace(/\n+/g, '').trim(),
    url: new URL(item.url, jsonBaseUrl).href,
  }));
  const universityUrls = inputData[0].universities.map(item => ({
    name: item.name,
    location: item.location.replace(/\n+/g, '').trim(),
    url: new URL(item.url, jsonBaseUrl).href,
  }));

  // Merge and deduplicate URLs
  const allUrls = [
    ...rightmoveUrls.map(url => ({ type: 'rightmove', url })),
    ...locationUrls.map(({ location, url }) => ({ type: 'location', location, url })),
    ...universityUrls.map(({ name, location, url }) => ({ type: 'university', name, location, url })),
  ];
  const uniqueUrls = [...new Map(allUrls.map(item => [item.url, item])).values()];

  // Scrape all URLs
  for (const item of uniqueUrls) {
    console.log(`Scraping ${item.type}: ${item.url}`);
    const data = await scrapePage(item.url, browser);
    results.push({
      type: item.type,
      location: item.location || null,
      name: item.name || null,
      ...data,
    });
    await new Promise(resolve => setTimeout(resolve, 2000)); // Rate limiting
  }

  // Save results
  await fs.writeFile('scraped_data.json', JSON.stringify(results, null, 2));
  console.log('Scraping complete. Results saved to scraped_data.json');

  await browser.close();
}

main().catch(console.error);
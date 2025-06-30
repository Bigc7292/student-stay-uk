# 🌐 Bright Data MCP Integration Setup Guide

## 📋 Overview

This guide helps you integrate Bright Data's Model Context Protocol (MCP) server with your StudentHome platform for advanced web scraping and data extraction capabilities.

## 🔑 Your Configuration Details

### **API Credentials:**
- **API Token**: `daf20140ecc930ba83243d2b1ec89e5e3f97d508176d7e318e6c17822f932fb2`
- **Web Unlocker Zone**: `mcp_unlocker` (default)
- **Browser Zone**: `mcp_browser` (default)
- **Rate Limit**: `100/1h` (100 requests per hour)

## 🚀 Quick Setup Steps

### **1. Claude Desktop Configuration**

Copy the `claude_desktop_config.json` file to your Claude Desktop configuration directory:

**Windows:**
```
%APPDATA%\Claude\claude_desktop_config.json
```

**macOS:**
```
~/Library/Application Support/Claude/claude_desktop_config.json
```

**Linux:**
```
~/.config/Claude/claude_desktop_config.json
```

### **2. Environment Variables (Already Added)**

Your `.env.local` file has been updated with:
```env
BRIGHT_DATA_API_TOKEN=daf20140ecc930ba83243d2b1ec89e5e3f97d508176d7e318e6c17822f932fb2
BRIGHT_DATA_WEB_UNLOCKER_ZONE=mcp_unlocker
BRIGHT_DATA_BROWSER_ZONE=mcp_browser
BRIGHT_DATA_RATE_LIMIT=100/1h
```

### **3. Service Integration (Already Created)**

The `brightDataService.ts` has been created in your services directory with:
- Web scraping capabilities
- Anti-bot detection bypass
- Browser automation
- Property data extraction

## 🛠️ Available Tools & Capabilities

### **Core Scraping Tools:**
1. **`search_engine`** - Scrape Google, Bing, Yandex search results
2. **`scrape_as_markdown`** - Extract webpage content as Markdown
3. **`scrape_as_html`** - Extract webpage content as HTML
4. **`session_stats`** - Monitor tool usage

### **Structured Data Extraction:**
- **Amazon**: Products, reviews, search results
- **LinkedIn**: Profiles, companies, jobs, posts
- **Social Media**: Instagram, Facebook, X (Twitter), TikTok
- **Real Estate**: Zillow properties, Booking hotels
- **E-commerce**: Walmart, eBay, Home Depot, Zara, Etsy, Best Buy

### **Browser Automation:**
- **`scraping_browser_navigate`** - Navigate to URLs
- **`scraping_browser_click`** - Click elements
- **`scraping_browser_type`** - Type text
- **`scraping_browser_screenshot`** - Take screenshots
- **`scraping_browser_get_html`** - Extract HTML content

## 🏠 Property Scraping Use Cases

### **1. UK Property Platforms:**
```javascript
// Scrape Rightmove search results
await brightDataService.scrapePropertySearch(
  'https://www.rightmove.co.uk/property-to-rent/find.html?locationIdentifier=REGION%5E87490',
  3 // max pages
);

// Scrape individual property listings
await brightDataService.scrapePropertyWebsite(
  'https://www.rightmove.co.uk/properties/123456789',
  { format: 'json', screenshot: true }
);
```

### **2. Dynamic Property Sites:**
```javascript
// Use browser automation for complex sites
await brightDataService.scrapeDynamicPropertySite(
  'https://www.zoopla.co.uk/to-rent/property/london/',
  [
    { action: 'click', selector: '.load-more-button' },
    { action: 'wait', selector: '.property-card' }
  ]
);
```

## 🎯 Integration with Your Platform

### **1. Enhanced Property Search:**
- Scrape multiple property platforms simultaneously
- Bypass anti-bot protection on restricted sites
- Extract structured property data automatically

### **2. Real-time Data Updates:**
- Monitor property availability changes
- Track price fluctuations
- Detect new listings instantly

### **3. Advanced Market Analysis:**
- Scrape property market trends
- Extract rental yield data
- Analyze competitor pricing

## 🔧 Testing Your Setup

### **1. Test Claude Desktop Integration:**
1. Restart Claude Desktop
2. Look for "Bright Data" in available tools
3. Try: "Search for rental properties in Manchester using web scraping"

### **2. Test Service Integration:**
```javascript
// Test the service
const status = await brightDataService.testService();
console.log(status);

// Check service status
const serviceStatus = brightDataService.getStatus();
console.log(serviceStatus);
```

## 📊 Usage Examples for Investor Demo

### **1. Live Property Data Extraction:**
```
"Show me current rental properties in Manchester under £800/month by scraping Rightmove and SpareRoom simultaneously"
```

### **2. Market Intelligence:**
```
"Scrape property price trends for student areas near University of Manchester from the last 30 days"
```

### **3. Competitive Analysis:**
```
"Extract all property listings from competitors and analyze their pricing strategies"
```

## ⚡ Performance & Limits

### **Current Configuration:**
- **Rate Limit**: 100 requests/hour
- **Concurrent Requests**: Up to 10
- **Timeout**: 180 seconds per request
- **Retry Logic**: 3 attempts with exponential backoff

### **Scaling Options:**
- Increase rate limits as needed
- Add multiple zones for higher throughput
- Implement request queuing for bulk operations

## 🛡️ Security & Best Practices

### **1. Data Validation:**
- Always validate scraped data before use
- Filter out potentially malicious content
- Sanitize extracted text and HTML

### **2. Rate Limiting:**
- Respect website terms of service
- Implement proper delays between requests
- Monitor usage to avoid blocks

### **3. Error Handling:**
- Graceful fallbacks for failed requests
- Comprehensive logging for debugging
- User-friendly error messages

## 🚀 Next Steps

### **Immediate Actions:**
1. ✅ Configuration files created
2. ✅ Environment variables set
3. ✅ Service integration ready
4. 🔄 Test Claude Desktop integration
5. 🔄 Test property scraping functionality

### **For Investor Demo:**
1. Demonstrate live property scraping
2. Show anti-bot detection bypass
3. Display real-time data extraction
4. Showcase market intelligence capabilities

## 📞 Support & Troubleshooting

### **Common Issues:**
1. **"spawn npx ENOENT"** - Install Node.js and ensure npx is available
2. **Rate limit exceeded** - Adjust RATE_LIMIT or upgrade plan
3. **Timeout errors** - Increase timeout settings for complex sites

### **Getting Help:**
- Bright Data Documentation: https://docs.brightdata.com/
- MCP Documentation: https://github.com/brightdata-com/brightdata-mcp
- Support: Contact Bright Data support team

---

## 🎉 Ready to Scrape!

Your Bright Data MCP integration is now configured and ready to power advanced web scraping capabilities for your StudentHome platform. This will significantly enhance your property data collection and provide a competitive edge in the UK student housing market!

# 🗺️ Google Maps API Setup Guide

This guide will walk you through setting up the Google Maps API for StudentHome.

## 📋 What You'll Get

With Google Maps API, StudentHome will have:
- ✅ Interactive maps with real accommodation locations
- ✅ Geocoding (convert addresses to coordinates)
- ✅ Places search (find nearby amenities)
- ✅ Directions and route planning
- ✅ Street view integration

## 💰 Cost

**FREE**: 28,000 requests per month
- Maps loads: $7 per 1,000 requests (after free tier)
- Geocoding: $5 per 1,000 requests (after free tier)
- Places: $17 per 1,000 requests (after free tier)

For typical usage, you'll stay within the free tier.

## 🚀 Step-by-Step Setup

### Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" → "New Project"
3. Enter project name: "StudentHome Maps"
4. Click "Create"

### Step 2: Enable Required APIs

1. In the Google Cloud Console, go to "APIs & Services" → "Library"
2. Search for and enable these APIs:
   - **Maps JavaScript API** (for interactive maps)
   - **Geocoding API** (for address conversion)
   - **Places API** (for places search)
   - **Directions API** (for route planning)

### Step 3: Create API Key

1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "API Key"
3. Copy the API key (starts with `AIza...`)
4. Click "Restrict Key" for security

### Step 4: Restrict API Key (IMPORTANT for security)

1. In the API key settings:
   - **Application restrictions**: 
     - Select "HTTP referrers (web sites)"
     - Add your domains:
       - `http://localhost:5173/*` (for development)
       - `https://yourdomain.com/*` (for production)
   
   - **API restrictions**:
     - Select "Restrict key"
     - Choose these APIs:
       - Maps JavaScript API
       - Geocoding API
       - Places API
       - Directions API

2. Click "Save"

### Step 5: Set Usage Quotas (Optional)

1. Go to "APIs & Services" → "Quotas"
2. Set daily quotas to prevent unexpected charges:
   - Maps JavaScript API: 1,000 requests/day
   - Geocoding API: 500 requests/day
   - Places API: 500 requests/day
   - Directions API: 500 requests/day

### Step 6: Add to StudentHome

1. Copy your API key
2. In StudentHome, go to "API Keys" tab
3. Paste the key in "Google Maps API Key" field
4. Click "Save Keys"

## 🔒 Security Best Practices

### ✅ Do:
- Restrict API key to your domains only
- Set usage quotas to prevent abuse
- Monitor usage in Google Cloud Console
- Rotate keys regularly (every 6 months)

### ❌ Don't:
- Share API keys publicly
- Commit keys to version control
- Use unrestricted keys in production
- Ignore usage alerts

## 🧪 Testing Your Setup

After adding the API key:

1. Go to the "Maps" tab in StudentHome
2. You should see a real Google Map
3. Search for a location - it should show real results
4. Click on accommodation markers - they should show real data

## 🐛 Troubleshooting

### "This page can't load Google Maps correctly"
- Check that Maps JavaScript API is enabled
- Verify API key is correct
- Check domain restrictions match your URL

### "Geocoding Service: This API project is not authorized"
- Enable Geocoding API in Google Cloud Console
- Add Geocoding API to your key restrictions

### "Places Service: This API project is not authorized"
- Enable Places API in Google Cloud Console
- Add Places API to your key restrictions

### Map shows but search doesn't work
- Check that all 4 APIs are enabled
- Verify API key restrictions include all required APIs

## 📊 Monitoring Usage

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to "APIs & Services" → "Dashboard"
3. View usage charts for each API
4. Set up billing alerts if needed

## 💡 Tips for Staying Within Free Tier

1. **Cache results**: StudentHome automatically caches API responses
2. **Batch requests**: Combine multiple operations when possible
3. **Use mock data**: For development, use mock data when possible
4. **Monitor usage**: Check usage weekly in Google Cloud Console

## 🆘 Need Help?

- [Google Maps Platform Documentation](https://developers.google.com/maps/documentation)
- [Google Cloud Support](https://cloud.google.com/support)
- [StudentHome GitHub Issues](https://github.com/Bigc7292/student-stay-uk/issues)

## ✅ Verification Checklist

Before finishing, verify:
- [ ] Google Cloud project created
- [ ] All 4 APIs enabled (Maps JavaScript, Geocoding, Places, Directions)
- [ ] API key created and copied
- [ ] API key restricted to your domains
- [ ] API key restricted to required APIs only
- [ ] Usage quotas set (optional but recommended)
- [ ] API key added to StudentHome
- [ ] Maps working in StudentHome
- [ ] Search working in StudentHome

Once complete, you'll have full maps functionality in StudentHome! 🎉

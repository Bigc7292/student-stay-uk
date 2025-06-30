# 🔑 API Keys Setup Guide

This document lists all the API keys needed for StudentHome and provides a secure way to configure them.

## 📋 Required API Keys

### 🗺️ **Google Maps API** (REQUIRED for maps functionality)
**What it's for**: Interactive maps, geocoding, places search, directions
**Cost**: FREE (28,000 requests/month)
**How to get it**:
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable these APIs:
   - Maps JavaScript API
   - Geocoding API
   - Places API
   - Directions API
4. Create credentials → API Key
5. Restrict the key to your domain for security

**Required APIs to enable**:
- Maps JavaScript API
- Geocoding API  
- Places API
- Directions API

---

## 🔧 Optional API Keys (App works without these)

### 📊 **Google Analytics 4** (Optional - for user analytics)
**What it's for**: User behavior tracking, page views, performance metrics
**Cost**: FREE
**How to get it**:
1. Go to [Google Analytics](https://analytics.google.com/)
2. Create account and property
3. Get Measurement ID (starts with G-)

### 🚇 **Transport for London (TfL)** (Optional - for London transport data)
**What it's for**: London bus, tube, and rail information
**Cost**: FREE
**How to get it**:
1. Go to [TfL API Portal](https://api.tfl.gov.uk/)
2. Register for free account
3. Get API key

### 🚂 **National Rail** (Optional - for UK rail data)
**What it's for**: UK train times and station information
**Cost**: FREE (registration required)
**How to get it**:
1. Go to [National Rail Enquiries](https://www.nationalrail.co.uk/developers)
2. Register for developer access
3. Get API credentials

### 📱 **VAPID Keys** (Optional - for push notifications)
**What it's for**: PWA push notifications
**Cost**: FREE
**How to get it**:
1. Go to [VAPID Key Generator](https://vapidkeys.com/)
2. Generate public/private key pair

### 🐛 **Sentry** (Optional - for error tracking)
**What it's for**: Error monitoring and crash reporting
**Cost**: FREE tier available
**How to get it**:
1. Go to [Sentry.io](https://sentry.io/)
2. Create account and project
3. Get DSN from project settings

---

## 🔒 Security Notes

### ⚠️ **IMPORTANT SECURITY GUIDELINES**

1. **Never commit API keys to version control**
2. **Restrict API keys by domain/IP when possible**
3. **Use environment variables only**
4. **Rotate keys regularly**
5. **Monitor usage for anomalies**

### 🛡️ **Google Maps API Security**
- Restrict by HTTP referrer (domain)
- Restrict by API (only enable needed APIs)
- Set usage quotas
- Monitor usage in Google Cloud Console

---

## 📝 **How the App Works Without API Keys**

The StudentHome app is designed to work gracefully without API keys:

### ✅ **Works WITHOUT any API keys**:
- Basic accommodation search (uses mock data)
- User authentication and profiles
- Application management tools
- Bill splitter calculator
- Legal guidance resources
- Community forum
- Accessibility features
- Performance monitoring
- PWA functionality

### 🗺️ **With Google Maps API**:
- Interactive maps with real locations
- Geocoding and address search
- Route planning and directions
- Street view integration
- Nearby places search

### 📊 **With Optional APIs**:
- Real-time transport data (TfL, National Rail)
- User analytics (Google Analytics)
- Push notifications (VAPID)
- Error tracking (Sentry)

---

## 🎯 **Recommendation**

**For basic testing**: No API keys needed - the app works with mock data

**For full functionality**: Only Google Maps API key is recommended

**For production**: Google Maps + Google Analytics recommended

---

## 🚀 **Quick Start Options**

### Option 1: **No API Keys** (Immediate testing)
- Clone and run the app
- Everything works with mock data
- Perfect for development and testing

### Option 2: **Google Maps Only** (Recommended)
- Get free Google Maps API key
- Enable maps functionality
- 90% of features available

### Option 3: **Full Setup** (Production ready)
- Google Maps API
- Google Analytics
- Optional: TfL, National Rail, VAPID, Sentry
- 100% of features available

---

## 📞 **Need Help?**

If you need help getting any API keys:
1. Check the detailed setup guides in `/docs/api-setup/`
2. Each API provider has free tiers
3. Most APIs can be set up in 5-10 minutes
4. The app works great even without them!

**Remember**: The StudentHome app is designed to be fully functional even without any API keys - they just enhance the experience! 🚀

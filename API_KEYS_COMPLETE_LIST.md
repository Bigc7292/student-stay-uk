# 🔑 Complete API Keys List for StudentHome

## 📋 Summary: What API Keys Do You Need?

### 🎯 **Quick Answer**: 
**NONE required!** The app works perfectly without any API keys using mock data.

### 🗺️ **For Full Maps Functionality**: 
**Only Google Maps API** (free, 28,000 requests/month)

### 🚀 **For Production**: 
**Google Maps + Google Analytics** (both free)

---

## 📊 Complete API Keys Breakdown

### 1. 🗺️ **Google Maps API Key** 
**Status**: ⭐ **RECOMMENDED** (enables real maps)
**Required**: No, but highly recommended
**Cost**: FREE (28,000 requests/month)
**What it enables**:
- Interactive maps with real locations
- Geocoding and address search
- Route planning and directions
- Street view integration
- Places search

**How to get**:
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create project → Enable APIs → Create API key
3. Enable: Maps JavaScript API, Geocoding API, Places API, Directions API

**Environment variable**: `VITE_GOOGLE_MAPS_API_KEY`

---

### 2. 📊 **Google Analytics 4 Measurement ID**
**Status**: 🔧 **OPTIONAL** (for analytics)
**Required**: No
**Cost**: FREE
**What it enables**:
- User behavior tracking
- Page view analytics
- Performance metrics
- User demographics (anonymous)

**How to get**:
1. Go to [Google Analytics](https://analytics.google.com/)
2. Create account → Create property → Get Measurement ID

**Environment variable**: `VITE_ANALYTICS_ID`
**Format**: `G-XXXXXXXXXX`

---

### 3. 🚇 **Transport for London (TfL) API Key**
**Status**: 🔧 **OPTIONAL** (London transport only)
**Required**: No
**Cost**: FREE
**What it enables**:
- Real London bus/tube times
- London transport accessibility info
- Live service updates

**How to get**:
1. Go to [TfL API Portal](https://api.tfl.gov.uk/)
2. Register → Get API key

**Environment variable**: `VITE_TFL_API_KEY`

---

### 4. 🚂 **National Rail API Key**
**Status**: 🔧 **OPTIONAL** (UK rail data)
**Required**: No
**Cost**: FREE (registration required)
**What it enables**:
- UK train times
- Station information
- Rail service updates

**How to get**:
1. Go to [National Rail Developers](https://www.nationalrail.co.uk/developers)
2. Register → Apply for access → Get API key

**Environment variable**: `VITE_NATIONAL_RAIL_API_KEY`

---

### 5. 📱 **VAPID Keys** (Public & Private)
**Status**: 🔧 **OPTIONAL** (push notifications)
**Required**: No
**Cost**: FREE
**What it enables**:
- PWA push notifications
- Accommodation alerts
- Update notifications

**How to get**:
1. Go to [VAPID Key Generator](https://vapidkeys.com/)
2. Generate key pair → Copy both keys

**Environment variables**: 
- `VITE_VAPID_PUBLIC_KEY`
- `VITE_VAPID_PRIVATE_KEY`

---

### 6. 🐛 **Sentry DSN**
**Status**: 🔧 **OPTIONAL** (error tracking)
**Required**: No
**Cost**: FREE tier available
**What it enables**:
- Error monitoring
- Crash reporting
- Performance monitoring
- User feedback

**How to get**:
1. Go to [Sentry.io](https://sentry.io/)
2. Create account → Create project → Get DSN

**Environment variable**: `VITE_SENTRY_DSN`
**Format**: `https://your-dsn@sentry.io/project-id`

---

## 🎯 Recommended Setup Strategies

### 🚀 **Strategy 1: Quick Start (0 API keys)**
**Time**: 0 minutes
**Cost**: FREE
**Features**: 90% of app functionality with mock data
```bash
# Just run the app - no setup needed!
npm run dev
```

### 🗺️ **Strategy 2: Maps Enabled (1 API key)**
**Time**: 10 minutes
**Cost**: FREE
**Features**: 95% of app functionality with real maps
```env
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_key
```

### 📊 **Strategy 3: Production Ready (2 API keys)**
**Time**: 15 minutes
**Cost**: FREE
**Features**: 98% of app functionality with analytics
```env
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_key
VITE_ANALYTICS_ID=G-XXXXXXXXXX
```

### 🔥 **Strategy 4: Full Featured (All API keys)**
**Time**: 30 minutes
**Cost**: FREE (all have free tiers)
**Features**: 100% of app functionality
```env
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_key
VITE_ANALYTICS_ID=G-XXXXXXXXXX
VITE_TFL_API_KEY=your_tfl_key
VITE_NATIONAL_RAIL_API_KEY=your_rail_key
VITE_VAPID_PUBLIC_KEY=your_vapid_public_key
VITE_VAPID_PRIVATE_KEY=your_vapid_private_key
VITE_SENTRY_DSN=https://your-dsn@sentry.io/project-id
```

---

## 🛠️ How to Configure API Keys

### Method 1: Using the Built-in API Key Manager
1. Run the StudentHome app
2. Go to "API Keys" tab in the navigation
3. Enter your API keys one by one
4. Click "Save Keys"
5. Copy the generated `.env.local` content

### Method 2: Manual .env.local File
1. Create `.env.local` file in project root
2. Add your API keys:
```env
VITE_GOOGLE_MAPS_API_KEY=your_key_here
VITE_ANALYTICS_ID=your_id_here
```
3. Restart the development server

---

## 🔒 Security & Privacy

### ✅ **Safe Practices**:
- API keys are stored locally only
- No keys are sent to external servers
- Keys are encrypted in localStorage
- Domain restrictions on Google Maps API
- Usage quotas to prevent abuse

### ⚠️ **Important Notes**:
- Never commit API keys to version control
- Use environment variables only
- Restrict keys to your domains
- Monitor usage regularly
- Rotate keys every 6 months

---

## 🧪 Testing Your Setup

After adding API keys, test these features:

### With Google Maps API:
- [ ] Maps load with real locations
- [ ] Address search works
- [ ] Accommodation markers appear
- [ ] Directions work
- [ ] Street view loads

### With Analytics:
- [ ] Page views are tracked
- [ ] User interactions recorded
- [ ] Performance metrics collected

### With Transport APIs:
- [ ] London transport data loads (TfL)
- [ ] UK rail information appears (National Rail)

### With VAPID Keys:
- [ ] PWA install prompt appears
- [ ] Push notifications can be enabled

### With Sentry:
- [ ] Errors are tracked
- [ ] Performance monitoring active

---

## 💡 Pro Tips

1. **Start Simple**: Begin with no API keys, add them as needed
2. **Google Maps First**: This gives the biggest feature boost
3. **Free Tiers**: All APIs have generous free tiers
4. **Monitor Usage**: Check usage weekly to stay within limits
5. **Security**: Always restrict API keys to your domains
6. **Backup**: Keep a secure backup of your API keys

---

## 🆘 Need Help?

### Getting API Keys:
- [Google Maps Setup Guide](./docs/api-setup/google-maps-setup.md)
- [Analytics Setup Guide](./docs/api-setup/analytics-setup.md)
- Each API provider has detailed documentation

### Using StudentHome:
- Use the built-in API Key Manager
- Check the generated `.env.local` content
- Restart the app after adding keys

### Troubleshooting:
- Check browser console for errors
- Verify API key formats
- Confirm domain restrictions
- Monitor usage quotas

---

## ✅ Final Checklist

Before deploying to production:

- [ ] Google Maps API key configured and restricted
- [ ] Google Analytics set up (optional but recommended)
- [ ] All API keys stored securely in environment variables
- [ ] Domain restrictions applied to all keys
- [ ] Usage quotas set to prevent unexpected charges
- [ ] Keys tested in development environment
- [ ] Backup of all API keys stored securely
- [ ] Monitoring set up for usage tracking

**Remember**: StudentHome works great even without any API keys! 🚀

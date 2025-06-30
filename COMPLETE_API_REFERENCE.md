# 🔑 Complete API Reference for StudentHome

## 📋 **TOTAL APIs AVAILABLE: 25+ APIs**

### 🎯 **Quick Summary**:
- **Required**: NONE! App works with mock data
- **Recommended**: Google Maps API (free)
- **For Production**: Google Maps + Analytics (both free)
- **Full Featured**: All APIs below (most have free tiers)

---

## 🗺️ **CORE MAPPING & LOCATION (Recommended)**

### 1. Google Maps API ⭐ **MOST IMPORTANT**
- **Cost**: FREE (28,000 requests/month)
- **Enables**: Interactive maps, geocoding, directions, places
- **Get it**: [Google Cloud Console](https://console.cloud.google.com/)
- **Variable**: `VITE_GOOGLE_MAPS_API_KEY`

### 2. Transport for London (TfL) API
- **Cost**: FREE
- **Enables**: London transport data, accessibility info
- **Get it**: [TfL API Portal](https://api.tfl.gov.uk/)
- **Variable**: `VITE_TFL_API_KEY`

### 3. National Rail API
- **Cost**: FREE (registration required)
- **Enables**: UK train times, station information
- **Get it**: [National Rail Developers](https://www.nationalrail.co.uk/developers)
- **Variable**: `VITE_NATIONAL_RAIL_API_KEY`

---

## 🏠 **PROPERTY DATA APIS**

### 4. Rightmove API
- **Cost**: FREE tier available
- **Enables**: Real property listings, market data
- **Get it**: [Rightmove Developer Portal](https://www.rightmove.co.uk/ps/developer-portal)
- **Variable**: `VITE_RIGHTMOVE_API_KEY`

### 5. Zoopla API
- **Cost**: FREE tier (100 requests/hour)
- **Enables**: Property valuations, rental prices
- **Get it**: [Zoopla Developer](https://developer.zoopla.co.uk/)
- **Variable**: `VITE_ZOOPLA_API_KEY`

### 6. SpareRoom API
- **Cost**: FREE for non-commercial use
- **Enables**: Student-specific accommodation listings
- **Get it**: [SpareRoom Developers](https://www.spareroom.co.uk/content/info-developers/)
- **Variable**: `VITE_SPAREROOM_API_KEY`

### 7. OpenRent API
- **Cost**: FREE tier available
- **Enables**: Rental property listings, landlord data
- **Get it**: [OpenRent API](https://www.openrent.com/api)
- **Variable**: `VITE_OPENRENT_API_KEY`

---

## 🏢 **LANDLORD VERIFICATION APIS (Important for Safety)**

### 8. Companies House API ⭐ **SAFETY CRITICAL**
- **Cost**: FREE
- **Enables**: Landlord company verification, director info, financial status
- **Get it**: [Companies House Developer](https://developer.company-information.service.gov.uk/)
- **Variable**: `VITE_COMPANIES_HOUSE_API_KEY`

### 9. Land Registry API
- **Cost**: FREE for basic data
- **Enables**: Property ownership history, sale prices, title info
- **Get it**: [Land Registry Data](https://landregistry.data.gov.uk/)
- **Variable**: `VITE_LAND_REGISTRY_API_KEY`

### 10. Deposit Protection API
- **Cost**: FREE verification
- **Enables**: Check if deposits are properly protected
- **Get it**: [Deposit Protection](https://www.depositprotection.com/)
- **Variable**: `VITE_DEPOSIT_PROTECTION_API_KEY`

### 11. SafeAgent API
- **Cost**: FREE for basic verification
- **Enables**: Landlord/agent accreditation verification
- **Get it**: [SafeAgent](https://www.safeagents.co.uk/)
- **Variable**: `VITE_SAFEAGENT_API_KEY`

---

## 💳 **PAYMENT & FINANCIAL APIS**

### 12. Stripe API
- **Cost**: 1.4% + 20p per transaction
- **Enables**: Secure rent payments, deposit handling
- **Get it**: [Stripe Dashboard](https://dashboard.stripe.com/)
- **Variables**: `VITE_STRIPE_PUBLISHABLE_KEY`, `VITE_STRIPE_SECRET_KEY`

### 13. GoCardless API
- **Cost**: 1% per transaction (capped at £4)
- **Enables**: Automated rent collection, direct debit
- **Get it**: [GoCardless](https://gocardless.com/)
- **Variable**: `VITE_GOCARDLESS_API_KEY`

### 14. Open Banking API
- **Cost**: FREE for licensed providers
- **Enables**: Income verification, affordability checks
- **Get it**: [Open Banking](https://www.openbanking.org.uk/)
- **Variable**: `VITE_OPEN_BANKING_API_KEY`

### 15. Experian API
- **Cost**: Pay-per-check (£15-30)
- **Enables**: Tenant credit checks, background verification
- **Get it**: [Experian Business](https://www.experian.co.uk/business/)
- **Variable**: `VITE_EXPERIAN_API_KEY`

---

## 🤖 **AI CHATBOT APIS**

### 16. OpenAI API ⭐ **BEST AI CHAT**
- **Cost**: Pay-per-use (very affordable, ~$0.002 per 1K tokens)
- **Enables**: GPT-4 powered conversations, property advice
- **Get it**: [OpenAI Platform](https://platform.openai.com/)
- **Variable**: `VITE_OPENAI_API_KEY`

### 17. Hugging Face API
- **Cost**: FREE tier available
- **Enables**: Free AI chat, sentiment analysis
- **Get it**: [Hugging Face](https://huggingface.co/)
- **Variable**: `VITE_HUGGINGFACE_API_KEY`

### 18. Anthropic Claude API
- **Cost**: Pay-per-use, competitive pricing
- **Enables**: Advanced AI conversations, helpful assistant
- **Get it**: [Anthropic Console](https://console.anthropic.com/)
- **Variable**: `VITE_ANTHROPIC_API_KEY`

### 19. Cohere API
- **Cost**: FREE tier (1000 requests/month)
- **Enables**: Text generation, classification, embeddings
- **Get it**: [Cohere Dashboard](https://dashboard.cohere.ai/)
- **Variable**: `VITE_COHERE_API_KEY`

---

## 👤 **AI AVATAR APIS**

### 20. D-ID API ⭐ **BEST FREE AVATARS**
- **Cost**: FREE tier (20 credits), then paid
- **Enables**: Talking AI avatars, video generation from text
- **Get it**: [D-ID Studio](https://studio.d-id.com/)
- **Variable**: `VITE_DID_API_KEY`

### 21. Synthesia API
- **Cost**: Paid service, enterprise pricing
- **Enables**: Professional AI avatars, multilingual videos
- **Get it**: [Synthesia](https://www.synthesia.io/)
- **Variable**: `VITE_SYNTHESIA_API_KEY`

### 22. Ready Player Me API
- **Cost**: FREE tier available
- **Enables**: 3D avatar creation, customization
- **Get it**: [Ready Player Me](https://docs.readyplayer.me/)
- **Variable**: `VITE_READYPLAYERME_API_KEY`

---

## 🎙️ **VOICE & SPEECH APIS**

### 23. ElevenLabs API
- **Cost**: FREE tier (10,000 characters/month)
- **Enables**: Natural AI voice synthesis, voice cloning
- **Get it**: [ElevenLabs](https://elevenlabs.io/)
- **Variable**: `VITE_ELEVENLABS_API_KEY`

### 24. Azure Speech Services
- **Cost**: FREE tier (5 hours/month)
- **Enables**: Speech-to-text, text-to-speech
- **Get it**: [Azure Speech](https://azure.microsoft.com/services/cognitive-services/speech-services/)
- **Variables**: `VITE_AZURE_SPEECH_KEY`, `VITE_AZURE_SPEECH_REGION`

---

## 📊 **ANALYTICS & MONITORING**

### 25. Google Analytics 4
- **Cost**: FREE
- **Enables**: User behavior tracking, performance metrics
- **Get it**: [Google Analytics](https://analytics.google.com/)
- **Variable**: `VITE_ANALYTICS_ID`

### 26. Sentry DSN
- **Cost**: FREE tier available
- **Enables**: Error tracking, performance monitoring
- **Get it**: [Sentry.io](https://sentry.io/)
- **Variable**: `VITE_SENTRY_DSN`

---

## 📱 **PWA & NOTIFICATIONS**

### 27. VAPID Keys
- **Cost**: FREE
- **Enables**: PWA push notifications
- **Get it**: [VAPID Generator](https://vapidkeys.com/)
- **Variables**: `VITE_VAPID_PUBLIC_KEY`, `VITE_VAPID_PRIVATE_KEY`

---

## 🎯 **RECOMMENDED SETUP STRATEGIES**

### 🚀 **Strategy 1: Immediate Start (0 APIs)**
**Time**: 0 minutes | **Cost**: FREE
```bash
npm run dev  # Works with mock data!
```

### 🗺️ **Strategy 2: Maps Enabled (1 API)**
**Time**: 10 minutes | **Cost**: FREE
```env
VITE_GOOGLE_MAPS_API_KEY=your_key
```
**Result**: 95% functionality with real maps

### 🏠 **Strategy 3: Property Platform (5 APIs)**
**Time**: 30 minutes | **Cost**: FREE
```env
VITE_GOOGLE_MAPS_API_KEY=your_key
VITE_COMPANIES_HOUSE_API_KEY=your_key
VITE_RIGHTMOVE_API_KEY=your_key
VITE_ANALYTICS_ID=your_id
VITE_DEPOSIT_PROTECTION_API_KEY=your_key
```
**Result**: Professional property platform with safety features

### 🤖 **Strategy 4: AI-Powered (8 APIs)**
**Time**: 45 minutes | **Cost**: Mostly FREE
```env
# Core + AI features
VITE_GOOGLE_MAPS_API_KEY=your_key
VITE_OPENAI_API_KEY=your_key
VITE_DID_API_KEY=your_key
VITE_ELEVENLABS_API_KEY=your_key
VITE_COMPANIES_HOUSE_API_KEY=your_key
VITE_ANALYTICS_ID=your_id
VITE_HUGGINGFACE_API_KEY=your_key
VITE_SENTRY_DSN=your_dsn
```
**Result**: Full AI-powered experience with avatars and voice

### 💳 **Strategy 5: Complete Platform (15+ APIs)**
**Time**: 60 minutes | **Cost**: FREE + pay-per-use
**Result**: Enterprise-grade student accommodation platform

---

## 💡 **Pro Tips**

1. **Start Simple**: Begin with Google Maps API only
2. **Free First**: Use all free APIs before paid ones
3. **Safety Critical**: Add Companies House API for landlord verification
4. **AI Enhancement**: OpenAI + D-ID for best AI experience
5. **Monitor Usage**: All APIs have usage dashboards
6. **Security**: Always restrict API keys to your domains

---

## 🔒 **Security & Cost Management**

### **Free APIs** (No ongoing costs):
- Google Maps (28K requests/month free)
- Companies House, Land Registry, TfL, National Rail
- Hugging Face, D-ID (free tiers)
- Google Analytics, Sentry (free tiers)

### **Pay-per-use APIs** (Only pay when used):
- OpenAI (~$0.002 per 1K tokens)
- Stripe (1.4% + 20p per transaction)
- Experian (£15-30 per credit check)

### **Subscription APIs** (Monthly fees):
- Synthesia, PropertyData, Hometrack (enterprise)

---

## 🎉 **Ready to Start!**

The StudentHome platform is designed to work at every level:
- **No APIs**: Full functionality with mock data
- **1 API**: Real maps and 95% features
- **5 APIs**: Professional platform
- **15+ APIs**: Enterprise-grade solution

**Choose your level and start building! 🚀**

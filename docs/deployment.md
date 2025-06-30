# Deployment Guide

This guide covers various deployment options for the StudentHome application.

## Prerequisites

Before deploying, ensure you have:
- Built the application (`npm run build`)
- Configured environment variables
- Tested the production build locally (`npm run preview`)

## Deployment Options

### 1. Vercel (Recommended)

Vercel provides the best experience for React applications with automatic deployments.

#### Quick Deploy
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Bigc7292/student-stay-uk)

#### Manual Setup
1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Login to Vercel:
```bash
vercel login
```

3. Deploy:
```bash
vercel --prod
```

#### Environment Variables
Set these in your Vercel dashboard:
- `VITE_GOOGLE_MAPS_API_KEY`
- `VITE_VAPID_PUBLIC_KEY`
- `VITE_ANALYTICS_ID`

#### Custom Domain
1. Go to your project dashboard
2. Navigate to Settings → Domains
3. Add your custom domain
4. Configure DNS records as instructed

### 2. Netlify

Netlify offers excellent static site hosting with form handling.

#### Deploy from Git
1. Connect your GitHub repository
2. Set build command: `npm run build`
3. Set publish directory: `dist`
4. Deploy

#### Environment Variables
Add in Site Settings → Environment Variables:
```
VITE_GOOGLE_MAPS_API_KEY=your_key
VITE_VAPID_PUBLIC_KEY=your_key
VITE_ANALYTICS_ID=your_id
```

#### Netlify Configuration
Create `netlify.toml`:
```toml
[build]
  publish = "dist"
  command = "npm run build"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[build.environment]
  NODE_VERSION = "18"

[[headers]]
  for = "/sw.js"
  [headers.values]
    Cache-Control = "no-cache"

[[headers]]
  for = "/manifest.json"
  [headers.values]
    Cache-Control = "public, max-age=0, must-revalidate"

[[headers]]
  for = "/*.js"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

[[headers]]
  for = "/*.css"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"
```

### 3. GitHub Pages

Free hosting for open source projects.

#### Setup
1. Install gh-pages:
```bash
npm install --save-dev gh-pages
```

2. Add to package.json:
```json
{
  "homepage": "https://yourusername.github.io/student-stay-uk",
  "scripts": {
    "predeploy": "npm run build",
    "deploy": "gh-pages -d dist"
  }
}
```

3. Deploy:
```bash
npm run deploy
```

#### Vite Configuration
Update `vite.config.ts`:
```typescript
export default defineConfig({
  base: '/student-stay-uk/',
  // ... other config
});
```

### 4. Docker Deployment

For containerized deployments.

#### Dockerfile
```dockerfile
# Build stage
FROM node:18-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

#### nginx.conf
```nginx
events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    server {
        listen 80;
        server_name localhost;
        root /usr/share/nginx/html;
        index index.html;

        # Handle client-side routing
        location / {
            try_files $uri $uri/ /index.html;
        }

        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }

        # Service worker
        location /sw.js {
            add_header Cache-Control "no-cache";
        }

        # Security headers
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;
    }
}
```

#### Build and Run
```bash
# Build image
docker build -t studenthome .

# Run container
docker run -p 80:80 studenthome
```

### 5. AWS S3 + CloudFront

For scalable static hosting.

#### S3 Setup
1. Create S3 bucket
2. Enable static website hosting
3. Upload build files
4. Configure bucket policy

#### CloudFront Setup
1. Create CloudFront distribution
2. Set S3 bucket as origin
3. Configure custom error pages
4. Set up SSL certificate

#### AWS CLI Deployment
```bash
# Build and sync
npm run build
aws s3 sync dist/ s3://your-bucket-name --delete

# Invalidate CloudFront cache
aws cloudfront create-invalidation --distribution-id YOUR_DISTRIBUTION_ID --paths "/*"
```

## Environment Configuration

### Production Environment Variables
```env
# Required for maps functionality
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key

# Optional: PWA push notifications
VITE_VAPID_PUBLIC_KEY=your_vapid_public_key

# Optional: Analytics
VITE_ANALYTICS_ID=your_analytics_id

# Optional: API endpoints
VITE_API_BASE_URL=https://api.studenthome.com

# Optional: Sentry error tracking
VITE_SENTRY_DSN=your_sentry_dsn
```

### Build Optimization
```bash
# Analyze bundle size
npm run build -- --analyze

# Build with source maps (for debugging)
npm run build -- --sourcemap

# Build for specific environment
NODE_ENV=production npm run build
```

## Performance Optimization

### 1. Enable Compression
Most hosting providers support gzip/brotli compression automatically.

### 2. CDN Configuration
- Cache static assets for 1 year
- Cache HTML for 1 hour
- Don't cache service worker

### 3. Preload Critical Resources
Add to `index.html`:
```html
<link rel="preload" href="/fonts/inter.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preconnect" href="https://maps.googleapis.com">
```

## Monitoring and Analytics

### 1. Error Tracking
Add Sentry for error monitoring:
```bash
npm install @sentry/react @sentry/tracing
```

### 2. Performance Monitoring
- Google Analytics 4
- Web Vitals tracking
- Lighthouse CI

### 3. Uptime Monitoring
- UptimeRobot
- Pingdom
- StatusCake

## Security Considerations

### 1. Content Security Policy
Add CSP headers:
```
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' https://maps.googleapis.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https://api.studenthome.com;
```

### 2. HTTPS Only
- Force HTTPS redirects
- Use HSTS headers
- Secure cookies

### 3. API Security
- Rate limiting
- CORS configuration
- API key restrictions

## Troubleshooting

### Common Issues

#### 1. Blank Page After Deployment
- Check browser console for errors
- Verify base URL configuration
- Check routing configuration

#### 2. Assets Not Loading
- Verify build output
- Check CDN configuration
- Confirm CORS settings

#### 3. Service Worker Issues
- Clear browser cache
- Check service worker registration
- Verify manifest.json

#### 4. Environment Variables Not Working
- Ensure variables start with `VITE_`
- Check deployment platform configuration
- Verify build process includes variables

### Debug Commands
```bash
# Check build output
npm run build && npm run preview

# Analyze bundle
npm run build -- --analyze

# Test PWA features
npm run build && npx serve dist

# Check for accessibility issues
npm run test:accessibility
```

## Rollback Strategy

### 1. Version Tagging
```bash
# Tag releases
git tag -a v1.0.0 -m "Release version 1.0.0"
git push origin v1.0.0
```

### 2. Blue-Green Deployment
- Maintain two identical environments
- Switch traffic between environments
- Quick rollback capability

### 3. Feature Flags
- Use feature flags for new features
- Gradual rollout capability
- Quick disable option

## Maintenance

### 1. Regular Updates
- Update dependencies monthly
- Security patches immediately
- Performance optimizations quarterly

### 2. Backup Strategy
- Regular database backups
- Code repository backups
- Configuration backups

### 3. Monitoring
- Set up alerts for errors
- Monitor performance metrics
- Track user feedback

For more detailed information, see:
- [Performance Guide](./performance.md)
- [PWA Guide](./pwa.md)
- [Security Guide](./security.md)

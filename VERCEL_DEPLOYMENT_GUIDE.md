# Vercel Deployment Guide for DataLens Frontend

**Deploy React frontend to Vercel with proper monorepo configuration**

---

## 🚀 Quick Start (5 minutes)

### Step 1: Connect GitHub to Vercel (2 minutes)

1. **Go to Vercel**: https://vercel.com
2. **Click "Add New Project"** → **"Continue with GitHub"**
3. **Install Vercel GitHub App** (if not already installed)
4. **Select your DataLens repository**
5. **Click "Import"**

---

## 📦 Configure Vercel Project (3 minutes)

### Step 2: Set Root Directory

1. **Configure Project Settings**:
   - **Root Directory**: Set to `./` (repository root)
   - **Framework Preset**: Vercel should detect **"Vite"** automatically
   - **Build Command**: `cd frontend && npm run build`
   - **Output Directory**: `frontend/dist`
   - **Install Command**: `cd frontend && npm install`

2. **Click "Deploy"** 

---

## 🔧 Environment Variables Configuration

### Step 3: Add Environment Variables

1. **Go to Project Settings** → **Environment Variables**
2. **Add these variables**:

```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://aqyacoxrjaeizgwvzcov.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFxeWFjb3hyamFlaXpnd3Z6Y292Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY1MTMzOTMsImV4cCI6MjA5MjA4OTM5M30.TR_Fl0FiLdVGdCFdW-Ph2SWw3ubEftxSZ25w2Uicvs4

# Railway Worker URLs
VITE_RAILWAY_DATA_PROCESSOR_URL=https://datalens-production.up.railway.app
VITE_RAILWAY_AI_INSIGHTS_URL=https://natural-rebirth-production-28e7.up.railway.app
VITE_RAILWAY_REPORT_GENERATOR_URL=https://mindful-serenity-production.up.railway.app
```

3. **Select All Environments** (Production, Preview, Development)
4. **Click "Save"**

---

## 🌐 Custom Domain (Optional)

### Step 4: Configure Custom Domain

1. **Go to Project Settings** → **Domains**
2. **Add Domain**: Enter your domain (e.g., `datalens.yourdomain.com`)
3. **Configure DNS**: Follow Vercel's instructions for your DNS provider
4. **Wait for SSL**: Vercel will automatically provision SSL certificate

---

## 🧪 Test Your Deployment

### Step 5: Verify Everything Works

1. **Visit your Vercel URL**: `https://your-project.vercel.app`
2. **Test the application**:
   ```bash
   # Should see the DataLens homepage
   curl https://your-project.vercel.app/
   ```

3. **Test API connections**:
   - Open browser DevTools → Console
   - Run: `testSupabaseConnection()`
   - Should see successful connection

4. **Test Railway worker connectivity**:
   - All Railway URLs should be accessible from frontend
   - No CORS errors in console

---

## 🔄 Automatic Deployments

### How Automatic Deployments Work:

- **Push to `main` branch** → Automatic production deployment
- **Push to other branches** → Automatic preview deployments
- **Pull requests** → Automatic preview deployments

### Deployment Settings:

1. **Go to Project Settings** → **Git**
2. **Configure**:
   - **Root Directory**: `./`
   - **Build Command**: `cd frontend && npm run build`
   - **Output Directory**: `frontend/dist`
   - **Install Command**: `cd frontend && npm install`

---

## 🛠️ Troubleshooting

### Build Fails

**Issue**: "Module not found" errors
- **Solution**: Make sure `frontend/package.json` has all dependencies
- **Check**: `frontend/node_modules` is in `.gitignore`

**Issue**: "Build command failed"
- **Solution**: Verify build command works locally: `cd frontend && npm run build`
- **Check**: All environment variables are set in Vercel

### Environment Variables Not Working

**Issue**: API calls failing with undefined URLs
- **Solution**: Make sure variable names start with `VITE_` prefix
- **Check**: Variables are added to correct environment (Production)

### Railway Workers Not Accessible

**Issue**: CORS errors when calling Railway workers
- **Solution**: Make sure Railway worker URLs are correct and accessible
- **Check**: Workers are deployed and healthy on Railway dashboard
- **Verify**: No typos in Railway URLs in environment variables

### Performance Issues

**Issue**: Slow page loads
- **Solution**: Enable Vercel Analytics to identify bottlenecks
- **Optimization**: Vite automatically optimizes bundles
- **CDN**: Vercel automatically serves from global CDN

---

## 💰 Cost Monitoring

**Vercel Pricing:**
- **Hobby (Free)**: Perfect for portfolio/personal projects
  - Unlimited deployments
  - Automatic HTTPS
  - Global CDN
  - 100GB bandwidth/month
  - Unlimited sites

**After Free Tier:**
- **Pro**: $20/month
- - More bandwidth
  - Faster builds
  - Analytics

**Monitor Usage:**
- Go to Vercel dashboard → Project → Usage
- Track bandwidth, builds, and functions
- Set up spending limits

---

## 🎯 Success Criteria

✅ **Frontend deployed successfully**
✅ **All environment variables configured**
✅ **Supabase connection working**
✅ **Railway workers accessible**
✅ **No build errors**
✅ **Application loads in < 3 seconds**
✅ **Automatic deployments enabled**

---

## 📚 Next Steps

After successful Vercel deployment:

1. **Set up custom domain** (optional but recommended)
2. **Configure analytics** (Vercel Analytics + Google Analytics)
3. **Enable error tracking** (Sentry - optional)
4. **Set up monitoring** (Uptime monitoring)
5. **Test all user flows** (upload → analysis → report)
6. **Optimize performance** (Core Web Vitals)

---

## 🔄 Update vs. Create New

**If you already have a Vercel project:**

1. **Go to Project Settings** → **General**
2. **Update Root Directory**: Set to `./`
3. **Update Build Command**: `cd frontend && npm run build`
4. **Update Output Directory**: `frontend/dist`
5. **Add Environment Variables** (if not already added)
6. **Redeploy**: Push to GitHub or trigger manual deployment

---

**Status**: Ready to deploy! 🚀
**Time**: 5 minutes
**Difficulty**: Beginner-friendly
**Architecture**: Frontend (Vercel) + Workers (Railway) + Database (Supabase)
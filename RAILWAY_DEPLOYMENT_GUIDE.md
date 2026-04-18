# Railway Deployment Guide for DataLens Workers

**Deploy 3 Python workers to Railway for automated EDA processing**

---

## 🚀 Quick Start (15 minutes)

### Step 1: Connect GitHub to Railway (2 minutes)

1. **Go to Railway**: https://railway.app
2. **Click "New Project"** → **"Deploy from GitHub repo"**
3. **Install Railway GitHub App** (if not already installed)
4. **Select your DataLens repository**
5. **Click "Deploy Now"**

---

## 📦 Deploy the 3 Workers (10 minutes)

### Worker 1: Data Processor

1. **Create New Service**
   - Click **"New Service"** → **"Deploy from GitHub repo"**
   - Select your DataLens repository
   - **Root Directory**: Set to `workers/data_processor`
   - Click **"Deploy"**

2. **Configure Environment Variables**
   - Go to the deployed service
   - Click **"Variables"** tab
   - Add these variables:
     ```bash
     SUPABASE_URL=https://aqyacoxrjaeizgwvzcov.supabase.co
     SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFxeWFjb3hyamFlaXpnd3Z6Y292Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjUxMzM5MywiZXhwIjoyMDkyMDg5MzkzfQ.UFm0jocrXMnQ9YiP_KWj6rGhtzIAJxxoYwQ7NP_kzuc
     GEMINI_API_KEY=AIzaSyC7EN0CsBgIMRT2zTUcIDrKYdj6goAWewY
     PORT=8000
     RAILWAY_ENVIRONMENT=production
     WEBHOOK_SECRET=generate_random_string_here
     ```
   - Click **"Save Variables"**

3. **Wait for Deployment** (~3 minutes)
   - Watch the build logs
   - Wait for "Service is healthy" message
   - **Copy the service URL** (you'll need it later)

---

### Worker 2: AI Insights

1. **Create New Service**
   - Click **"New Service"** → **"Deploy from GitHub repo"**
   - Select your DataLens repository
   - **Root Directory**: Set to `workers/ai_insights`
   - Click **"Deploy"**

2. **Configure Environment Variables**
   - Go to the deployed service
   - Click **"Variables"** tab
   - Add these variables:
     ```bash
     SUPABASE_URL=https://aqyacoxrjaeizgwvzcov.supabase.co
     SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFxeWFjb3hyamFlaXpnd3Z6Y292Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjUxMzM5MywiZXhwIjoyMDkyMDg5MzkzfQ.UFm0jocrXMnQ9YiP_KWj6rGhtzIAJxxoYwQ7NP_kzuc
     GEMINI_API_KEY=AIzaSyC7EN0CsBgIMRT2zTUcIDrKYdj6goAWewY
     PORT=8001
     RAILWAY_ENVIRONMENT=production
     ```
   - Click **"Save Variables"**

3. **Wait for Deployment** (~3 minutes)
   - Watch the build logs
   - Wait for "Service is healthy" message
   - **Copy the service URL**

---

### Worker 3: Report Generator

1. **Create New Service**
   - Click **"New Service"** → **"Deploy from GitHub repo"**
   - Select your DataLens repository
   - **Root Directory**: Set to `workers/report_generator`
   - Click **"Deploy"**

2. **Configure Environment Variables**
   - Go to the deployed service
   - Click **"Variables"** tab
   - Add these variables:
     ```bash
     SUPABASE_URL=https://aqyacoxrjaeizgwvzcov.supabase.co
     SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFxeWFjb3hyamFlaXpnd3Z6Y292Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjUxMzM5MywiZXhwIjoyMDkyMDg5MzkzfQ.UFm0jocrXMnQ9YiP_KWj6rGhtzIAJxxoYwQ7NP_kzuc
     PORT=8002
     RAILWAY_ENVIRONMENT=production
     ```
   - Click **"Save Variables"**

3. **Wait for Deployment** (~3 minutes)
   - Watch the build logs
   - Wait for "Service is healthy" message
   - **Copy the service URL**

---

## 🧪 Test Your Deployments (3 minutes)

### Test Data Processor Worker

```bash
# Replace with your actual Railway URL
curl https://your-data-processor-url.railway.app/health
```

**Expected Response:**
```json
{
  "status": "healthy",
  "service": "data-processor"
}
```

### Test AI Insights Worker

```bash
curl https://your-ai-insights-url.railway.app/health
```

**Expected Response:**
```json
{
  "status": "healthy",
  "service": "ai-insights"
}
```

### Test Report Generator Worker

```bash
curl https://your-report-generator-url.railway.app/health
```

**Expected Response:**
```json
{
  "status": "healthy",
  "service": "report-generator"
}
```

---

## 📝 Update Frontend Environment Variables

1. **Edit** `frontend/.env`
2. **Add your Railway URLs**:
   ```bash
   VITE_SUPABASE_URL=https://aqyacoxrjaeizgwvzcov.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFxeWFjb3hyamFlaXpnd3Z6Y292Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY1MTMzOTMsImV4cCI6MjA5MjA4OTM5M30.TR_Fl0FiLdVGdCFdW-Ph2SWw3ubEftxSZ25w2Uicvs4

   # Add your Railway URLs here:
   VITE_RAILWAY_DATA_PROCESSOR_URL=https://your-data-processor-url.railway.app
   VITE_RAILWAY_AI_INSIGHTS_URL=https://your-ai-insights-url.railway.app
   VITE_RAILWAY_REPORT_GENERATOR_URL=https://your-report-generator-url.railway.app
   ```

---

## 🔧 Troubleshooting

### Build Fails
- **Check Dockerfile**: Make sure it's in the worker root directory
- **Check requirements.txt**: Should be in the worker root directory
- **Check logs**: Click "View Logs" in Railway dashboard

### Service Won't Start
- **Check environment variables**: All required vars must be set
- **Check PORT**: Railway sets PORT automatically, don't hardcode
- **Check logs**: Look for Python errors

### Can't Access Service
- **Wait longer**: First build takes 5-10 minutes
- **Check deployment status**: Should be "healthy"
- **Check service URL**: Copy from Railway dashboard

### Environment Variables Not Working
- **Re-deploy**: After adding variables, trigger new deployment
- **Check names**: Must match exactly (case-sensitive)
- **Check values**: No extra spaces or quotes

---

## 💰 Cost Monitoring

**Railway Pricing:**
- **Free tier**: $5 one-time credit + $5/month credits
- **After credits**: ~$5-20/month depending on usage
- **3 workers**: Each consumes ~$1-5/month
- **Development**: Pause services when not testing = $0-5/month
- **Production**: Keep all running = $5-20/month

**Monitor Usage:**
- Go to Railway dashboard → Project → Usage
- Track CPU, memory, and costs
- Set up spending limits

---

## 🎯 Success Criteria

✅ **All 3 workers deployed**
✅ **All health endpoints return 200**
✅ **Environment variables configured**
✅ **Services show as "healthy"**
✅ **Can access Railway URLs**
✅ **Costs visible in dashboard**

---

## 📚 Next Steps

After successful deployment:

1. **Test worker endpoints** with actual API calls
2. **Implement worker logic** (Phase 3)
3. **Set up monitoring** and alerts
4. **Connect frontend** to workers
5. **Test complete pipeline**

---

**Status**: Ready to deploy! 🚀
**Time**: 15 minutes
**Difficulty**: Beginner-friendly

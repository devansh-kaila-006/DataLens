# 🔧 QUICK FIX: File Upload 500 Error

## ⚡ Quick Fix (3 minutes)

### **Step 1: Update upload-file Function (1 minute)**

1. Go to: **Supabase Dashboard** → **Edge Functions**
2. Click on **`upload-file`**
3. **Delete all existing code**
4. **Copy the updated code** from: `supabase/functions/upload-file/index.ts`
5. **Paste into the editor**
6. **Click "Deploy"**

### **Step 2: Create Storage Bucket (1 minute)**

1. Go to: **Supabase Dashboard** → **Storage**
2. Click **"New Bucket"**
3. Enter:
   - **Name**: `data-uploads`
   - **Public**: Toggle **ON**
4. Click **"Create Bucket"**

### **Step 3: Deploy Remaining Functions (5 minutes)**

Deploy these 4 functions (same way as upload-file):

#### **1. create-job**
```
Edge Functions → New Function → create-job
Paste code from: supabase/functions/create-job/index.ts
Deploy
```

#### **2. get-job-status**
```
Edge Functions → New Function → get-job-status
Paste code from: supabase/functions/get-job-status/index.ts
Deploy
```

#### **3. get-analysis-results**
```
Edge Functions → New Function → get-analysis-results
Paste code from: supabase/functions/get-analysis-results/index.ts
Deploy
```

#### **4. ai-insights**
```
Edge Functions → New Function → ai-insights
Paste code from: supabase/functions/ai-insights/index.ts
Deploy
```

---

## ✅ Verification

### **Test It:**
1. Go to: **https://data-lens-five.vercel.app**
2. **Upload a CSV file**
3. **Should work!** ✅

### **Expected Behavior:**
- ✅ File uploads successfully
- ✅ Job is created in database
- ✅ Processing starts (via Railway workers)
- ✅ No 500 errors
- ✅ No 404 errors

---

## 🐛 If Still Failing

### **Check Function Logs:**
1. Dashboard → Edge Functions → upload-file → **Logs**
2. Try uploading a file
3. Watch for errors in real-time

**Common Errors & Fixes:**

#### **Error: "Bucket not found"**
```
Fix: Create the 'data-uploads' bucket (Step 2 above)
```

#### **Error: "Missing environment variable"**
```
Fix: These are auto-configured, but if missing:
Dashboard → Edge Functions → Settings → Add:
  SUPABASE_URL = https://aqyacoxrjaeizgwvzcov.supabase.co
  SUPABASE_SERVICE_ROLE_KEY = your_service_role_key
```

#### **Error: "Permission denied"**
```
Fix: Check your service role key permissions
Dashboard → Settings → API → service_role (secret)
```

---

## 📋 Complete Checklist

After completing all steps:

- [ ] Updated `upload-file` function with new code
- [ ] Created `data-uploads` storage bucket (public)
- [ ] Deployed `create-job` function
- [ ] Deployed `get-job-status` function
- [ ] Deployed `get-analysis-results` function
- [ ] Deployed `ai-insights` function
- [ ] Tested file upload in browser
- [ ] File upload works ✅

---

## 🎯 What Changed in upload-file?

**Fixed Issues:**
1. ❌ Removed dependency on non-existent rate limiter
2. ❌ Changed bucket from `uploads` to `data-uploads`
3. ✅ Added better error logging
4. ✅ Simplified CORS handling
5. ✅ Added environment variable validation

**Now it works!** 🚀

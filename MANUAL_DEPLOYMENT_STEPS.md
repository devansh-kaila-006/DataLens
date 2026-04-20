# 🚨 MANUAL EDGE FUNCTIONS DEPLOYMENT REQUIRED

## Why Manual Deployment?

The Supabase CLI is not installed on this system, so we need to deploy the Edge Functions manually through the Supabase Dashboard.

## ⏱️ Time Required: ~10 minutes

---

## 📋 Step-by-Step Deployment Guide

### **Step 1: Access Supabase Dashboard**

1. Go to: **https://supabase.com/dashboard**
2. Sign in with your account
3. Select project: **aqyacoxrjaeizgwvzcov** (DataLens)

---

### **Step 2: Deploy Each Edge Function**

For each of the 5 functions below, repeat these steps:

#### **A. Go to Edge Functions**
- Click **"Edge Functions"** in the left sidebar
- Click **"New Function"** button

#### **B. Create Function**
1. **Function Name**: (use exact names below)
2. **Verify JWT**: Turn **OFF** (we handle auth manually)
3. **Click "Create Function"**

#### **C. Paste Code**
1. Delete the default code
2. Copy the entire contents from the corresponding file:
   - `supabase/functions/[NAME]/index.ts`
3. Paste into the editor
4. **Click "Save"**
5. **Click "Deploy"**

---

### **Functions to Deploy** (in order):

#### **1. upload-file**
- **File**: `supabase/functions/upload-file/index.ts`
- **Purpose**: Handles secure file uploads with validation
- **Verification**: Test file upload after deployment

#### **2. create-job**
- **File**: `supabase/functions/create-job/index.ts`
- **Purpose**: Creates analysis job records in database

#### **3. get-job-status**
- **File**: `supabase/functions/get-job-status/index.ts`
- **Purpose**: Retrieves job status (bypasses RLS for guests)

#### **4. get-analysis-results**
- **File**: `supabase/functions/get-analysis-results/index.ts`
- **Purpose**: Aggregates all analysis results

#### **5. ai-insights**
- **File**: `supabase/functions/ai-insights/index.ts`
- **Purpose**: Generates AI insights with rate limiting

---

### **Step 3: Configure Environment Variables**

After deploying all functions:

1. **Go to**: Edge Functions → **Settings** (gear icon)
2. **Add Environment Variables**:

   ```
   Name: GEMINI_API_KEY
   Value: your_gemini_api_key_here
   ```

3. **Click "Save"**

---

### **Step 4: Create Storage Bucket**

1. **Go to**: **Storage** in left sidebar
2. **Click "New Bucket"**
3. **Bucket Name**: `data-uploads`
4. **Make Public**: ✅ **Enable** (toggle ON)
5. **Click "Create Bucket"**

---

### **Step 5: Test Deployment**

#### **Test upload-file Function:**

```bash
# Create a test CSV file
echo "name,age\nAlice,30\nBob,25" > test.csv

# Test upload
curl -X POST \
  https://aqyacoxrjaeizgwvzcov.supabase.co/functions/v1/upload-file \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -F "file=@test.csv" \
  -F "user_id=test"
```

**Expected Response:**
```json
{
  "success": true,
  "path": "test_1234567890_test.csv",
  "url": "https://...",
  "size": 25
}
```

#### **Test in Browser:**

1. Go to: **https://data-lens-five.vercel.app**
2. **Try uploading a CSV file**
3. **Should work without CORS errors!**

---

## 🔍 Troubleshooting

### **Error: "Function not found" (404)**
- ✅ Check function name matches exactly (case-sensitive)
- ✅ Wait 30 seconds after clicking "Deploy"
- ✅ Refresh the Edge Functions page

### **Error: "CORS policy failed"**
- ✅ Check CORS headers in the function code
- ✅ Verify your Vercel domain is allowed
- ✅ Check browser console for specific error

### **Error: "Storage bucket not found"**
- ✅ Create the `data-uploads` bucket (Step 4)
- ✅ Make sure bucket is marked as public

### **Error: "Rate limit exceeded"**
- ✅ This is expected! The rate limiter is working
- ✅ Wait 1 minute before trying again

---

## ✅ Success Checklist

After deployment, verify:

- [ ] All 5 functions appear in Edge Functions list
- [ ] All functions show **"Active"** status (green)
- [ ] GEMINI_API_KEY is set in environment variables
- [ ] `data-uploads` storage bucket exists
- [ ] File upload works in the browser
- [ ] No CORS errors in console
- [ ] Job creation and processing works

---

## 🎯 Expected Result

Once deployed:

1. **File Upload**: ✅ Works smoothly
2. **Job Processing**: ✅ Railway workers process data
3. **AI Insights**: ✅ Generated (with fallback)
4. **Rate Limiting**: ✅ Protects against abuse
5. **No Errors**: ✅ Clean console logs

---

## 📞 Need Help?

If issues persist:

1. **Check Edge Function Logs**: Dashboard → Edge Functions → Click function → Logs
2. **Check Storage Logs**: Dashboard → Storage → Logs
3. **Verify Environment**: All variables set correctly
4. **Test Individually**: Test each function separately with curl

---

**Estimated time to complete: 10 minutes**

**After deployment, your DataLens application will be fully functional!** 🚀

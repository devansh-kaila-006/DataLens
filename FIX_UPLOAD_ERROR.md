# 🔧 Fix upload-file 500 Error

## Quick Diagnosis

The 500 error means the Edge Function is deployed but encountering an error.

### **Check 1: Storage Bucket (Most Likely Issue)**

1. Go to: **Supabase Dashboard** → **Storage**
2. Look for bucket named: `data-uploads`
3. **If it doesn't exist:**
   - Click **"New Bucket"**
   - Name: `data-uploads`
   - Toggle **"Make Public"** to ON
   - Click **"Create Bucket"**

### **Check 2: Edge Function Logs**

1. Go to: **Supabase Dashboard** → **Edge Functions**
2. Click on **`upload-file`**
3. Click **"Logs"** tab
4. Look for error messages

**Common errors you might see:**
- `"Bucket not found"` → Create the `data-uploads` bucket
- `"Missing environment variable"` → Check environment variables
- `"Permission denied"` → Check service role key permissions

### **Check 3: Environment Variables**

1. Go to: **Edge Functions** → **Settings** (gear icon)
2. Verify these variables exist:
   ```
   SUPABASE_URL=https://aqyacoxrjaeizgwvzcov.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```
3. **If missing, add them**

**To get your service role key:**
- Dashboard → **Settings** → **API**
- Copy **service_role** key (not anon key)

### **Check 4: Deploy Other Functions**

The `get-job-status` is still returning 404, which means it wasn't deployed yet.

**Deploy these 4 remaining functions:**
1. `create-job`
2. `get-job-status`
3. `get-analysis-results`
4. `ai-insights`

---

## 📝 Step-by-Step Fix

### Step 1: Create Storage Bucket (2 minutes)

```
Supabase Dashboard → Storage → New Bucket
Name: data-uploads
Public: ON
Create Bucket
```

### Step 2: Deploy Missing Functions (5 minutes)

For each function:
```
Edge Functions → New Function
Name: [function-name]
Paste code from: supabase/functions/[name]/index.ts
Deploy
```

### Step 3: Test

```
Go to: https://data-lens-five.vercel.app
Upload a CSV file
Should work! ✅
```

---

## 🎯 Expected Result

After fixing:
- ✅ File upload succeeds
- ✅ Job is created
- ✅ Processing starts
- ✅ No more 500 errors

---

## 🔍 Debug: Check Function Logs

**To see exact error:**
1. Dashboard → Edge Functions → upload-file
2. Click **Logs** tab
3. Try uploading a file
4. Watch logs appear in real-time

**Share the log output if issue persists!**

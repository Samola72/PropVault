# Troubleshooting Guide - PropVault Deployment
## Fix: App Keeps Spinning / Not Loading

---

## 🔴 Common Issue: App Spinning Forever

**Cause:** Missing or incorrect environment variables, or Supabase not set up.

---

## 🔍 STEP 1: Check Browser Console

1. **Open your deployed site:** https://propvault-nine.vercel.app
2. **Open Developer Tools:**
   - Mac: `Cmd + Option + I`
   - Windows: `F12` or `Ctrl + Shift + I`
3. **Click "Console" tab**
4. **Look for errors** (usually red text)

### Common Errors You Might See:

#### Error 1: "supabaseUrl is required"
**Fix:** Environment variables not configured

#### Error 2: "Failed to fetch" or "Network error"
**Fix:** Supabase not configured or wrong URL

#### Error 3: "Invalid API key"
**Fix:** Wrong Supabase keys

---

## ✅ STEP 2: Verify Environment Variables in Vercel

### Go to Vercel Dashboard:

1. Visit https://vercel.com/dashboard
2. Click on your "PropVault" project (propvault-nine)
3. Click "Settings" tab
4. Click "Environment Variables" in sidebar

### Check These Variables Exist:

```env
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
NEXT_PUBLIC_APP_URL
NEXT_PUBLIC_APP_NAME
```

### If Missing or Wrong:

**Add them now:**

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
NEXT_PUBLIC_APP_URL=https://propvault-nine.vercel.app
NEXT_PUBLIC_APP_NAME=PropVault
```

**Important:** After adding/updating, you MUST redeploy:
- Go to "Deployments" tab
- Click "..." on latest deployment
- Click "Redeploy"

---

## 🗄️ STEP 3: Verify Supabase is Set Up

### Did you create a Supabase project?

1. Go to https://supabase.com
2. Do you have a project called "propvault" or similar?

### If NO Supabase Project:

**You need to create one:**

1. Go to https://supabase.com
2. Click "New Project"
3. Name: `propvault-production`
4. Choose region
5. Set database password (save it!)
6. Wait 2 minutes for creation

### After Project Created:

**Run SQL Scripts:**

1. Click "SQL Editor" in Supabase sidebar
2. Click "New Query"
3. Copy/paste entire `SUPABASE_SCHEMA.sql` from your propvault folder
4. Click "Run"
5. Wait for success ✓

6. Create another "New Query"
7. Copy/paste `SUPABASE_RLS_POLICIES.sql`
8. Click "Run"

9. Create another "New Query"
10. Copy/paste `SUPABASE_STORAGE.sql`
11. Click "Run"

### Get API Keys from Supabase:

1. Click "Project Settings" (gear icon)
2. Click "API" in sidebar
3. Copy these values:
   - **Project URL** → This is `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** → This is `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** (click "Reveal") → This is `SUPABASE_SERVICE_ROLE_KEY`

---

## 🔧 STEP 4: Add Environment Variables to Vercel

### With your Supabase keys:

1. Go to Vercel Dashboard → PropVault project
2. Settings → Environment Variables
3. **Add each variable:**

**Click "Add New":**
- Name: `NEXT_PUBLIC_SUPABASE_URL`
- Value: `https://xxxxx.supabase.co` (your URL)
- Environment: Check ALL (Production, Preview, Development)
- Click "Save"

**Click "Add New" again:**
- Name: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Value: `eyJhbGc...` (your anon key)
- Environment: Check ALL
- Click "Save"

**Click "Add New" again:**
- Name: `SUPABASE_SERVICE_ROLE_KEY`
- Value: `eyJhbGc...` (your service role key)
- Environment: Check ALL
- Click "Save"

**Click "Add New" again:**
- Name: `NEXT_PUBLIC_APP_URL`
- Value: `https://propvault-nine.vercel.app`
- Environment: Check ALL
- Click "Save"

**Click "Add New" again:**
- Name: `NEXT_PUBLIC_APP_NAME`
- Value: `PropVault`
- Environment: Check ALL
- Click "Save"

---

## 🔄 STEP 5: Redeploy

### After adding all environment variables:

1. Go to "Deployments" tab in Vercel
2. Find your latest deployment
3. Click the "..." (three dots) button
4. Click "Redeploy"
5. Wait 2-3 minutes
6. Visit https://propvault-nine.vercel.app again

---

## ✅ VERIFICATION CHECKLIST

After redeployment, check:

- [ ] Supabase project exists
- [ ] SQL scripts executed (3 files)
- [ ] All 5 environment variables in Vercel
- [ ] App redeployed after adding variables
- [ ] No errors in browser console
- [ ] Login page loads properly
- [ ] Can register new account

---

## 🎯 Quick Fix Summary

**Most likely issue:** Missing environment variables

**Quick fix:**
1. Create Supabase project
2. Run SQL scripts
3. Copy API keys from Supabase
4. Add to Vercel environment variables
5. Redeploy
6. Should work!

---

## 📱 Testing After Fix

1. Visit: https://propvault-nine.vercel.app
2. Should see login page (not spinning)
3. Click "Register"
4. Create test account
5. Should redirect to dashboard

---

## 🆘 Still Not Working?

### Check Vercel Deployment Logs:

1. Vercel Dashboard → PropVault
2. Click "Deployments" tab
3. Click on latest deployment
4. Click "View Function Logs"
5. Look for errors

### Common Log Errors:

**"Module not found"** → Build issue (shouldn't happen)
**"Database connection failed"** → Wrong Supabase URL/keys
**"Unauthorized"** → Wrong Supabase keys

---

## 💡 Alternative: Start Fresh

If nothing works:

1. **Delete current deployment** (optional)
2. **Verify .env.example** has all needed variables
3. **Create new Supabase project** with clean slate
4. **Redeploy to Vercel** with correct variables

---

## 📞 Need More Help?

Provide these details:
1. Browser console errors (screenshot)
2. Vercel deployment logs (screenshot)  
3. List of environment variables you added (DON'T share actual keys!)

---

## 🎊 Expected Result

When working properly:
- ✅ Login page loads instantly
- ✅ No spinning
- ✅ Can register/login
- ✅ Dashboard shows empty state (no data yet)
- ✅ All navigation works

**Get it working and you're ready to use PropVault! 🚀**

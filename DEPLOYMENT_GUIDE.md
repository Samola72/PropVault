# DEPLOYMENT GUIDE - PropVault to Vercel
## Deploy Without Affecting Existing Projects

---

## 🔑 KEY CONCEPT: Multiple Independent Projects

**Important:** Vercel allows unlimited projects under one account. Each project is **completely isolated**:
- ✅ Separate deployments
- ✅ Separate domains
- ✅ Separate environment variables
- ✅ Separate build settings
- ✅ No cross-project interference

**Your Tax App on Vercel will remain completely unaffected!**

---

## 📋 STEP-BY-STEP DEPLOYMENT

### Step 1: Prepare PropVault Repository

#### Option A: New GitHub Repository (Recommended)

```bash
# Navigate to propvault directory
cd /Users/samuel/Desktop/propvault

# Initialize git (if not already done)
git init

# Add all files
git add .

# Make initial commit
git commit -m "Initial commit - PropVault v1.0"

# Create a NEW repository on GitHub
# Go to github.com → New Repository → Name it "propvault"
# DO NOT initialize with README (we already have one)

# Add the remote (replace YOUR_USERNAME)
git remote add origin https://github.com/YOUR_USERNAME/propvault.git

# Push to GitHub
git branch -M main
git push -u origin main
```

#### Option B: Separate Branch in Existing Repo (Not Recommended)

```bash
# Only if you want to use same repo as Tax app
git checkout -b propvault-app
git add .
git commit -m "Add PropVault app"
git push -u origin propvault-app
```

**Recommendation:** Use **Option A** (separate repo) for cleaner separation.

---

### Step 2: Create Supabase Project

**This is separate from any database your Tax app uses.**

1. Go to https://supabase.com
2. Click "New Project"
3. Name it: `propvault-production` or similar
4. Choose region closest to your users
5. Set a strong database password (save it!)
6. Click "Create New Project" (takes ~2 minutes)

---

### Step 3: Run Database Scripts

Once Supabase project is ready:

1. **Click "SQL Editor" in sidebar**

2. **Run Schema (Creates all tables)**
   - Click "New Query"
   - Copy/paste entire content of `SUPABASE_SCHEMA.sql`
   - Click "Run" (bottom right)
   - Wait for success message

3. **Run RLS Policies (Adds security)**
   - Click "New Query" again
   - Copy/paste content of `SUPABASE_RLS_POLICIES.sql`
   - Click "Run"
   - Wait for success

4. **Run Storage Setup (Creates buckets)**
   - Click "New Query" again
   - Copy/paste content of `SUPABASE_STORAGE.sql`
   - Click "Run"
   - Wait for success

5. **Get API Keys**
   - Click "Project Settings" (gear icon) → "API"
   - Copy these values (you'll need them):
     - `Project URL` → This is `NEXT_PUBLIC_SUPABASE_URL`
     - `anon public` → This is `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     - `service_role` → This is `SUPABASE_SERVICE_ROLE_KEY`

---

### Step 4: Deploy to Vercel (New Project)

#### 4.1 Go to Vercel Dashboard

1. Go to https://vercel.com
2. Log in (same account as your Tax app)
3. Click "Add New..." → "Project"

#### 4.2 Import PropVault Repository

1. You'll see a list of your repositories
2. Find "propvault" (or whatever you named it)
3. Click "Import"

**Important:** This creates a NEW project, separate from your Tax app!

#### 4.3 Configure Project

**Framework Preset:** Next.js (should auto-detect)

**Root Directory:** `./` (leave as is)

**Build Command:** 
```
npm run build
```

**Output Directory:** 
```
.next
```

**Install Command:** 
```
npm install
```

#### 4.4 Add Environment Variables

Click "Environment Variables" and add these **one by one**:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
NEXT_PUBLIC_APP_URL=https://propvault.vercel.app
NEXT_PUBLIC_APP_NAME=PropVault
```

**Where to get these values:**
- First 3: From Supabase (Step 3.5 above)
- `NEXT_PUBLIC_APP_URL`: Use the Vercel URL (see next step)
- `NEXT_PUBLIC_APP_NAME`: Just "PropVault"

**Optional (for emails):**
```env
RESEND_API_KEY=re_xxxxx
```

#### 4.5 Deploy!

1. Click "Deploy"
2. Wait 2-5 minutes
3. You'll get a URL like: `https://propvault-xxx.vercel.app`

---

### Step 5: Update Environment Variable

After first deployment:

1. Copy your actual Vercel URL (e.g., `https://propvault-xxx.vercel.app`)
2. Go to Vercel Dashboard → Your PropVault Project → Settings → Environment Variables
3. Find `NEXT_PUBLIC_APP_URL`
4. Click "Edit"
5. Update with your actual URL
6. Click "Save"
7. Go to Deployments tab → Click "..." on latest → "Redeploy"

---

### Step 6: Configure Supabase Auth URLs

1. Go back to Supabase Dashboard
2. Click "Authentication" → "URL Configuration"
3. Add these URLs:

**Site URL:**
```
https://propvault-xxx.vercel.app
```

**Redirect URLs (add all):**
```
https://propvault-xxx.vercel.app
https://propvault-xxx.vercel.app/login
https://propvault-xxx.vercel.app/register
https://propvault-xxx.vercel.app/dashboard
```

4. Click "Save"

---

## 🎯 VERIFYING YOUR DEPLOYMENT

### Check PropVault is Live

1. Visit your Vercel URL
2. You should see the login page
3. Click "Register" and create an account
4. Check your email for verification (if enabled)
5. Log in and explore the dashboard

### Verify Tax App is Unaffected

1. Visit your Tax app URL
2. Everything should work exactly as before
3. No changes, no interference

---

## 📊 MANAGING MULTIPLE VERCEL PROJECTS

### Vercel Dashboard Organization

```
Your Vercel Account
│
├── Tax App (Backend)
│   ├── URL: https://tax-app.vercel.app
│   ├── Environment Variables: (Tax app specific)
│   └── Deployments: (Tax app history)
│
└── PropVault (Full-stack)
    ├── URL: https://propvault-xxx.vercel.app
    ├── Environment Variables: (PropVault specific)
    └── Deployments: (PropVault history)
```

**Each project has:**
- Own domain/URL
- Own environment variables
- Own deployment history
- Own build settings
- Own analytics

---

## 🔐 ENVIRONMENT ISOLATION

### PropVault `.env.local` (Local Development)

```env
# For local development only
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=PropVault
```

### PropVault Vercel Environment (Production)

Configured in Vercel Dashboard → separate from Tax app

### Tax App Environment (Unchanged)

Your Tax app's environment variables remain exactly as they are.

---

## 🚀 CUSTOM DOMAINS (Optional)

If you want custom domains for both:

### Tax App Domain
```
https://taxapp.com (or whatever you have)
```

### PropVault Domain
```
https://propvault.com (or similar)
```

**Steps:**
1. Buy domain (Namecheap, GoDaddy, etc.)
2. Vercel Dashboard → PropVault Project → Settings → Domains
3. Add your domain
4. Follow DNS configuration steps
5. Done! (Tax app domain unaffected)

---

## 🔄 CONTINUOUS DEPLOYMENT

### Both Projects Deploy Independently

**Tax App:**
```bash
# In your Tax app repo
git push origin main
# → Automatically deploys Tax app
```

**PropVault:**
```bash
# In propvault repo  
git push origin main
# → Automatically deploys PropVault
```

No interference! Each tracks its own repository.

---

## 📱 TESTING BOTH APPS

### Test PropVault

```bash
# Visit your PropVault URL
https://propvault-xxx.vercel.app

# Test features:
- Register new account
- Log in
- Create property
- View dashboard
- Real-time notifications
```

### Test Tax App (Verify No Impact)

```bash
# Visit your Tax app URL
https://tax-app.vercel.app

# Verify:
- Everything works as before
- No changes
- No errors
```

---

## ⚠️ COMMON MISTAKES TO AVOID

### ❌ DON'T Do This:
1. ❌ Deploy PropVault to same repo as Tax app
2. ❌ Use same Supabase project for both apps
3. ❌ Mix environment variables between projects
4. ❌ Share database between apps

### ✅ DO This:
1. ✅ Separate GitHub repositories
2. ✅ Separate Supabase projects
3. ✅ Separate Vercel projects
4. ✅ Independent environments

---

## 🎊 FINAL CHECKLIST

- [ ] PropVault in separate GitHub repo
- [ ] New Supabase project created
- [ ] Database schema executed
- [ ] RLS policies applied
- [ ] Storage buckets created
- [ ] New Vercel project created (separate from Tax app)
- [ ] Environment variables configured in Vercel
- [ ] PropVault deployed successfully
- [ ] Auth redirect URLs configured in Supabase
- [ ] PropVault tested and working
- [ ] Tax app verified still working (no impact)

---

## 🆘 TROUBLESHOOTING

### Issue: "Project already exists"
**Solution:** Choose a different project name in Vercel

### Issue: "Database connection failed"
**Solution:** Double-check Supabase URL and keys in environment variables

### Issue: "Auth redirect error"
**Solution:** Add your Vercel URL to Supabase Auth redirect URLs

### Issue: "Tax app broken after deployment"
**Solution:** This shouldn't happen - projects are isolated. Check Tax app's own environment variables haven't been accidentally changed.

---

## 📚 QUICK REFERENCE

### PropVault URLs (After Deployment)
- **Production:** https://propvault-xxx.vercel.app
- **Supabase Dashboard:** https://app.supabase.com
- **Vercel Dashboard:** https://vercel.com/dashboard

### Tax App URLs (Unchanged)
- **Production:** (Your existing URL)
- **Vercel Dashboard:** https://vercel.com/dashboard

Both appear in same dashboard, different projects!

---

## 🎯 NEXT STEPS AFTER DEPLOYMENT

1. **Test thoroughly**
   - Register test account
   - Create sample data
   - Test all features

2. **Set up monitoring**
   - Vercel Analytics (built-in)
   - Supabase monitoring

3. **Configure custom domain** (optional)

4. **Set up GitHub Actions** (already configured)

5. **Share with users!**

---

**You're all set! PropVault and your Tax app will coexist peacefully on Vercel! 🚀**

# Vercel Deployment Guide for PropVault

## Overview
This guide addresses common deployment issues and provides step-by-step instructions for deploying PropVault to Vercel.

## Common Deployment Issues

### Issue 1: Previous Deployment Conflicts
If you have a previous deployment, it may cause conflicts. Here's what to check:

**Solution:**
1. Go to Vercel Dashboard → Your Project → Settings
2. Check if environment variables are properly set
3. Clear the build cache: Settings → General → Clear Build Cache
4. Redeploy from the Deployments tab

### Issue 2: Missing Environment Variables
The build errors we fixed were mainly due to missing environment variables during the build process.

**Required Environment Variables in Vercel:**

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Stripe Configuration (Build-time required)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_STARTER_MONTHLY=price_...
STRIPE_PRICE_STARTER_YEARLY=price_...
STRIPE_PRICE_PRO_MONTHLY=price_...
STRIPE_PRICE_PRO_YEARLY=price_...
STRIPE_PRICE_ENTERPRISE_MONTHLY=price_...
STRIPE_PRICE_ENTERPRISE_YEARLY=price_...

# App Configuration
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
```

### Issue 3: Database/Supabase Setup
The database itself is hosted on Supabase, not Vercel. You need to ensure:

**✅ Required Supabase Setup:**
1. **Tables Created** - Run the SQL schemas:
   - `SUPABASE_SCHEMA.sql` - Main tables
   - `STRIPE_SCHEMA.sql` - Stripe integration tables
   - `SUPABASE_RLS_POLICIES.sql` - Row Level Security
   - `SUPABASE_STORAGE.sql` - File storage buckets

2. **Authentication Enabled** - Email/password auth should be configured in Supabase Dashboard

3. **API Keys** - Both anon key and service role key must be valid

## Step-by-Step Deployment Process

### Step 1: Prepare Your Repository
```bash
# Ensure all changes are committed
cd /Users/samuel/Desktop/propvault
git add .
git commit -m "Fix build issues and add mobile integration"
git push origin main
```

### Step 2: Configure Vercel Project

#### Option A: New Deployment
```bash
# Install Vercel CLI if not installed
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel --prod
```

During setup, answer:
- **Set up and deploy?** Yes
- **Which scope?** Choose your account
- **Link to existing project?** No (or Yes if reconnecting)
- **Project name?** propvault
- **Directory?** ./
- **Override settings?** No

#### Option B: Connect Existing Project via Dashboard

1. Go to https://vercel.com/dashboard
2. Click "Add New" → "Project"
3. Import your Git repository
4. Configure:
   - **Framework Preset:** Next.js
   - **Root Directory:** ./
   - **Build Command:** `npm run build` (default)
   - **Output Directory:** `.next` (default)

### Step 3: Add Environment Variables

In Vercel Dashboard → Your Project → Settings → Environment Variables:

1. **Add all variables** from `.env.local` or `.env.example`
2. **Select environments:** Production, Preview, and Development
3. Click "Save"

**Important:** After adding environment variables, you MUST redeploy for them to take effect.

### Step 4: Redeploy

After adding environment variables:
1. Go to Deployments tab
2. Click the three dots on the latest deployment
3. Click "Redeploy"
4. Select "Use existing Build Cache" or not (try without cache if issues persist)

### Step 5: Configure Stripe Webhooks (Production)

Once deployed:
1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://your-domain.vercel.app/api/webhooks/stripe`
3. Select events:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `customer.subscription.trial_will_end`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
   - `checkout.session.completed`
4. Copy the webhook signing secret
5. Add to Vercel as `STRIPE_WEBHOOK_SECRET`
6. Redeploy again

## Troubleshooting Deployment Issues

### Build Fails with "Module not found"
```bash
# Locally test the build
npm run build

# If it works locally but fails on Vercel:
# 1. Clear Vercel build cache
# 2. Ensure package-lock.json is committed
# 3. Check Node.js version matches (see .nvmrc or package.json engines)
```

### Build Fails with Environment Variable Errors
- **Symptom:** "STRIPE_SECRET_KEY is not set" or similar
- **Solution:** We implemented lazy loading for Stripe, but double-check all env vars are in Vercel
- **Note:** Build-time variables (starting with `NEXT_PUBLIC_`) are embedded in the build

### Database Connection Issues After Deployment
```bash
# Verify Supabase credentials
# In Vercel Dashboard, check:
1. NEXT_PUBLIC_SUPABASE_URL is correct
2. NEXT_PUBLIC_SUPABASE_ANON_KEY is correct
3. SUPABASE_SERVICE_ROLE_KEY is correct (for API routes)

# Common mistake: Using wrong project credentials
# Go to Supabase Dashboard → Project Settings → API to verify
```

### 404 Errors on API Routes
- Check that API routes are in `src/app/api/` directory
- Ensure `src/` is at project root
- Verify Vercel is detecting Next.js correctly

### Prisma/Database Migration Issues
**Note:** PropVault uses Supabase (PostgreSQL) directly, not Prisma.
- Database schema must be applied in Supabase Dashboard
- Run SQL scripts in Supabase SQL Editor, not during Vercel build

## Why the Build Issues Occurred

The build errors we fixed were caused by:

1. **TypeScript Strict Mode** - Vercel builds with strict type checking
2. **Build-time Evaluation** - Some code was executing during build that expected runtime-only variables
3. **Type Mismatches** - Supabase client types vs actual usage
4. **Module Resolution** - Modal component prop name changes

These are **code issues**, not Vercel/database configuration issues.

## Post-Deployment Checklist

After successful deployment:

- [ ] Test authentication (login/register)
- [ ] Verify database connections work
- [ ] Test creating a property
- [ ] Test creating a tenant
- [ ] Test creating a work order
- [ ] Verify Stripe checkout works (use test mode)
- [ ] Check that webhooks are received
- [ ] Test file uploads (if using Supabase Storage)
- [ ] Verify email invitations work
- [ ] Check mobile API endpoints respond correctly

## Mobile App Configuration

For the React Native mobile app:

1. Update `.env` in `/Users/samuel/Desktop/propvault-mobile/`:
```bash
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
EXPO_PUBLIC_API_URL=https://your-domain.vercel.app
```

2. Run `npm start` in the mobile directory
3. Test with Expo Go app on your phone

## Database vs Application Deployment

**Important Distinction:**
- **Database (Supabase):** Hosted separately, already running
  - Tables, RLS policies, storage buckets
  - No deployment needed, just one-time setup
  
- **Application (Vercel):** Frontend + API routes
  - Needs environment variables to connect to Supabase
  - Needs Stripe keys for payment processing
  - This is what you're deploying

## Summary

**The deployment issues were primarily code-related**, not configuration-related:
- ✅ Fixed: TypeScript type errors
- ✅ Fixed: Build-time vs runtime code execution  
- ✅ Fixed: Component prop mismatches

**What you DO need in Vercel:**
- ✅ All environment variables from `.env.example`
- ✅ Supabase credentials (URL + keys)
- ✅ Stripe credentials (keys + webhook secret)
- ✅ App URL for redirects

**What you DON'T need in Vercel:**
- ❌ Database setup (it's in Supabase)
- ❌ Database migrations (run SQL in Supabase)
- ❌ Previous deployment cleanup (unless there are env var conflicts)

## Next Steps

1. **Verify local build works:** `npm run build`
2. **Commit and push changes** to your repository
3. **Set environment variables** in Vercel Dashboard
4. **Deploy** and monitor build logs
5. **Test the deployed application** thoroughly

If you encounter any specific errors during deployment, check the build logs in Vercel Dashboard → Deployments → Build Logs.

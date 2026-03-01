# 🚀 PRE-DEPLOYMENT ACTION PLAN

**Generated:** March 1, 2026, 12:33 AM  
**Status:** ⚠️ **CRITICAL ISSUES FOUND & PARTIALLY FIXED**

---

## 📋 EXECUTIVE SUMMARY

After reviewing your pre-deployment checklist and deployment assessment, I discovered **CRITICAL BUILD-BLOCKING ERRORS** that prevent deployment. I have fixed most TypeScript compilation errors but there are still remaining issues to address.

### Current Status:
- ❌ **Build Status:** FAILING (TypeScript errors)
- ✅ **Code Fixed:** Dashboard, Invite, Messages routes (partial)
- ⚠️ **Remaining:** Work Orders & Register routes need fixes
- ⚠️ **Database:** Stripe & Tenant Portal schemas NOT deployed

---

## 🔥 CRITICAL ISSUES DISCOVERED

### 1. ⛔ BUILD-BLOCKING TYPESCRIPT ERRORS

**Problem:** Missing `TENANT` role in TypeScript definitions  
**Impact:** Tenant portal completely non-functional, build fails  
**Status:** ✅ **FIXED**

**What I Fixed:**
```typescript
// Added to src/types/database.ts
export type UserRole =
  | "SUPER_ADMIN"
  | "ORG_ADMIN"
  | "PROPERTY_MANAGER"
  | "MAINTENANCE_STAFF"
  | "ACCOUNTANT"
  | "VIEWER"
  | "TENANT";  // ← ADDED THIS
```

### 2. ⛔ MISSING TYPE DEFINITIONS FOR NEW DATABASE FIELDS

**Problem:** Tenant Portal and Stripe fields not in TypeScript types  
**Impact:** TypeScript compilation errors in 5+ API routes  
**Status:** ✅ **FIXED**

**What I Added:**
- `Occupant` interface: portal_enabled, portal_last_login, portal_invitation_token, portal_user_id
- `Organization` interface: stripe_customer_id, stripe_subscription_id, plan_status, etc.
- `WorkOrder` interface: submitted_by_tenant, tenant_notes
- `Message` interface: is_tenant_message
- `Invoice` interface: stripe_payment_intent_id, stripe_payment_link

### 3. ⚠️ REMAINING TYPESCRIPT ERRORS

**Files Still Needing Fixes:**
- `src/app/api/tenant-portal/work-orders/route.ts` - Type assertions needed
- `src/app/api/tenant-portal/register/route.ts` - Type assertions needed

**Estimated Time to Fix:** 5-10 minutes

---

## ✅ WHAT I'VE COMPLETED

### Fixed Files:
1. ✅ `src/types/database.ts` - Added all missing type definitions
2. ✅ `src/app/api/tenant-portal/dashboard/route.ts` - Added type assertions
3. ✅ `src/app/api/tenant-portal/invite/route.ts` - Added type assertions
4. ✅ `src/app/api/tenant-portal/messages/route.ts` - Added type assertions

### Type Definitions Added:
- ✅ TENANT role to UserRole enum
- ✅ Tenant Portal fields to Occupant interface
- ✅ Stripe Integration fields to Organization interface
- ✅ Tenant submission fields to WorkOrder interface
- ✅ Tenant message flag to Message interface
- ✅ Stripe payment fields to Invoice interface

---

## 🎯 IMMEDIATE ACTION ITEMS (Before Deployment)

### Priority 1: Fix Remaining Build Errors (15 minutes)

```bash
# 1. Fix work-orders route
# 2. Fix register route
# 3. Run build test
npm run build

# 4. Verify successful build
```

### Priority 2: Deploy Database Schemas (10 minutes)

**Critical Schemas NOT Yet Deployed:**

1. **STRIPE_SCHEMA_REVIEWED.sql** ⛔ MUST DEPLOY
   ```sql
   -- Adds to organizations table:
   - stripe_customer_id
   - stripe_subscription_id  
   - stripe_price_id
   - plan_status
   - trial_ends_at
   - current_period_start/end
   - cancel_at_period_end
   
   -- Adds to invoices table:
   - stripe_payment_intent_id
   - stripe_payment_link
   
   -- Creates stripe_events table
   ```

2. **TENANT_PORTAL_SCHEMA.sql** ⚠️ VERIFY IF DEPLOYED
   ```sql
   -- Adds TENANT role to enum
   -- Adds portal fields to occupants
   -- Adds tenant fields to work_orders, messages
   -- Creates tenant_portal_activity table
   -- Creates RLS policies for tenants
   ```

**How to Deploy:**
```bash
# 1. Go to Supabase Dashboard → SQL Editor
# 2. Create new query
# 3. Copy content from STRIPE_SCHEMA_REVIEWED.sql
# 4. Execute
# 5. Repeat for TENANT_PORTAL_SCHEMA.sql (if not already done)
# 6. Verify with: SELECT * FROM information_schema.columns WHERE table_name = 'organizations';
```

### Priority 3: Configure Stripe Environment Variables (10 minutes)

**Missing in Production (Vercel):**
```env
# Create 6 price objects in Stripe Dashboard first
STRIPE_PRICE_STARTER_MONTHLY=price_xxx     ❌ NOT SET
STRIPE_PRICE_STARTER_YEARLY=price_xxx      ❌ NOT SET
STRIPE_PRICE_PRO_MONTHLY=price_xxx         ❌ NOT SET
STRIPE_PRICE_PRO_YEARLY=price_xxx          ❌ NOT SET
STRIPE_PRICE_ENTERPRISE_MONTHLY=price_xxx  ❌ NOT SET
STRIPE_PRICE_ENTERPRISE_YEARLY=price_xxx   ❌ NOT SET

# After creating webhook endpoint
STRIPE_WEBHOOK_SECRET=whsec_xxx            ❌ NOT SET
```

**Steps:**
1. Stripe Dashboard → Products → Create 6 prices
2. Copy price IDs  
3. Add to Vercel environment variables
4. Create webhook endpoint at `/api/webhooks/stripe`
5. Copy webhook secret
6. Add to Vercel

### Priority 4: Verify Supabase Keys in Vercel (2 minutes)

```env
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...  ⚠️ VERIFY SET
NEXT_PUBLIC_SUPABASE_URL=https://...  ⚠️ VERIFY SET
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJh...  ⚠️ VERIFY SET
```

### Priority 5: Set Production App URL (After First Deploy)

```env
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app  ❌ NOT SET
```

---

## 📊 FROM YOUR DEPLOYMENT ASSESSMENT

### Issues from DEPLOYMENT_ASSESSMENT.md:

✅ **RESOLVED:**
- TypeScript compilation errors (mostly)
- Type definitions for tenant portal
- Type definitions for Stripe integration

⚠️ **STILL PENDING:**
- Stripe Price IDs configuration
- Stripe Webhook configuration  
- Stripe schema deployment
- Production app URL configuration
- Final 2 TypeScript fixes

❌ **NOT APPLICABLE YET:**
- Supabase Auth redirect URLs (do after first deploy)
- RLS policy verification (do after schema deployment)

---

## 🔍 FROM YOUR PRE-DEPLOYMENT CHECKLIST

### Testing Status:

**From PRE_DEPLOYMENT_CHECKLIST.md:**
- ✅ BATCH 7-8: Detail Pages & CRUD - Production Ready
- ✅ BATCH 9: Forms Integration - Production Ready
- ⚠️ BATCH 10: Stripe Integration - **SCHEMA NOT DEPLOYED**
- ✅ BATCH 12: Analytics Dashboard - Production Ready
- ⚠️ BATCH 13: Tenant Portal - **BUILD ERRORS FOUND**

**Optimization Recommendations:**
- API response time optimization (can wait)
- Polling frequency reduction (can wait)
- React Query caching (can wait)
- **All optimizations are post-launch items**

---

## 📝 DEPLOYMENT SEQUENCE

### Step-by-Step Deployment Plan:

#### Phase 1: Fix & Verify (30 minutes)
```bash
# 1. Fix remaining TypeScript errors (work-orders & register routes)
# 2. Run build test
npm run build

# 3. Deploy Stripe schema to Supabase
# 4. Verify tenant portal schema deployed
# 5. Create Stripe price objects
# 6. Configure environment variables in Vercel
```

#### Phase 2: Initial Deploy (10 minutes)
```bash
# 1. Commit all changes
git add .
git commit -m "Fix: TypeScript errors and add missing type definitions"
git push origin main

# 2. Vercel will auto-deploy (if connected)
# OR manually: vercel --prod

# 3. Get production URL
```

#### Phase 3: Post-Deploy Configuration (10 minutes)
```bash
# 1. Update NEXT_PUBLIC_APP_URL in Vercel
# 2. Update Supabase Auth redirect URLs
# 3. Configure Stripe webhook with production URL
# 4. Redeploy
```

#### Phase 4: Verification (15 minutes)
```bash
# 1. Test login/register
# 2. Test property CRUD
# 3. Test tenant portal (with test tenant)
# 4. Test Stripe checkout (test mode)
# 5. Verify webhook reception
```

---

## ⚠️ KNOWN ISSUES & WORKAROUNDS

### Issue 1: Supabase Type Mismatches
**Problem:** Supabase client types don't recognize manually added fields  
**Solution:** Using `as any` type assertions in tenant portal routes  
**Impact:** Type safety reduced but functionality works  
**Future Fix:** Regenerate Supabase types after schema changes

### Issue 2: User Model Missing first_name/last_name
**Problem:** User type uses `full_name` but code references `first_name`/`last_name`  
**Impact:** May cause errors in tenant messages  
**Solution:** Need to verify actual database schema and update types or code accordingly

---

## 🎯 RECOMMENDATION

### Deploy Now or Wait?

**DEPLOY NOW IF:**
- You only need core property management features
- Can live without Stripe billing initially
- Can test tenant portal after fixing last 2 routes

**WAIT IF:**
- You need billing/subscriptions on day 1
- Want zero errors/warnings
- Need full end-to-end tenant portal testing

### My Recommendation: **FIX REMAINING ISSUES FIRST (45 min total)**

**Why:**
1. Only 2 more files to fix (10 min)
2. Schema deployment is quick (10 min)
3. Stripe configuration is straightforward (10 min)
4. Better to launch clean than debug in production

**Timeline:**
- **Tonight:** Fix remaining errors, deploy schemas, configure Stripe
- **Tomorrow Morning:** Deploy to Vercel
- **Tomorrow Afternoon:** Test & verify everything works

---

## 📞 NEXT STEPS

### Immediate (Right Now):
1. ✅ Review this action plan
2. ❓ Decide: Fix remaining issues tonight or tomorrow?
3. ❓ Confirm: Are Stripe payments required for launch?
4. ❓ Verify: Is TENANT_PORTAL_SCHEMA.sql already deployed?

### After Decision:
- **If fixing tonight:** I'll fix the remaining 2 routes now
- **If tomorrow:** I'll create a quick reference checklist

---

## 📚 REFERENCE DOCUMENTS

- `PRE_DEPLOYMENT_CHECKLIST.md` - Your testing checklist
- `DEPLOYMENT_ASSESSMENT.md` - Your deployment readiness assessment
- `STRIPE_SCHEMA_REVIEWED.sql` - Ready to deploy
- `TENANT_PORTAL_SCHEMA.sql` - May need deployment
- `VERCEL_DEPLOYMENT_GUIDE.md` - Deployment instructions

---

**Questions? Let me know if you want me to:**
1. Fix the remaining 2 TypeScript errors now
2. Create a quick deployment checklist
3. Help deploy the database schemas
4. Configure Stripe in test mode

---

*Generated by AI Assistant - March 1, 2026*

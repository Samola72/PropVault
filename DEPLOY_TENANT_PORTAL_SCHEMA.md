# How to Deploy Tenant Portal Schema to Supabase

## 📝 Step-by-Step Instructions

### Step 1: Open the SQL File

1. In VS Code, locate and open the file: **`TENANT_PORTAL_SCHEMA.sql`**
2. Select ALL the content (Cmd+A on Mac or Ctrl+A on Windows)
3. Copy the entire file content (Cmd+C or Ctrl+C)

---

### Step 2: Access Supabase Dashboard

1. Open your browser and go to: **https://app.supabase.com**
2. Log in to your Supabase account
3. Select your **PropVault project** from the project list

---

### Step 3: Open SQL Editor

1. In the left sidebar, look for **"SQL Editor"** (it has a database/query icon)
2. Click on **"SQL Editor"**
3. You'll see a SQL editor interface with a text area

**Alternative path:** Dashboard → Database → SQL Editor

---

### Step 4: Create New Query

1. Click the **"New query"** button (usually at the top)
2. This opens a blank SQL editor window

---

### Step 5: Paste the Schema

1. In the SQL editor text area, paste the entire content you copied from `TENANT_PORTAL_SCHEMA.sql`
2. You should see all 301 lines of SQL code

---

### Step 6: Run the Schema

1. Look for the **"Run"** button (usually green, at the bottom right of the editor)
2. Click **"Run"** or press **Cmd+Enter** (Mac) or **Ctrl+Enter** (Windows)

**⚠️ EXPECTED WARNING:**

You will see a warning that says:
```
⚠️ Potential issue detected with your query
Query has destructive operation
Make sure you are not accidentally removing something important.
```

**This is SAFE and expected!** The schema includes `DROP POLICY IF EXISTS` statements to ensure clean installation. These only drop and recreate the tenant portal policies we're creating.

3. **Click "Run this query"** to confirm
4. Wait for execution to complete (should take 5-10 seconds)

---

### Step 7: Verify Success

You should see success messages appear. Look for:

```
✅ SUCCESS messages for:
- ALTER TYPE statements
- ALTER TABLE statements  
- CREATE INDEX statements
- CREATE POLICY statements
- CREATE TABLE statements
- CREATE FUNCTION statements
```

At the very end, you should see:
```
Tenant Portal schema installed successfully!
Next steps:
1. Deploy API routes for tenant portal
2. Create tenant portal UI components
3. Test invitation flow
```

---

### Step 8: Verify TENANT Role Was Added

Run this verification query in a new SQL Editor tab:

```sql
SELECT enumlabel 
FROM pg_enum 
WHERE enumtypid = 'user_role'::regtype
ORDER BY enumlabel;
```

**Expected output:** You should see a list including:
- ACCOUNTANT
- MAINTENANCE_STAFF
- ORG_ADMIN
- PROPERTY_MANAGER
- SUPER_ADMIN
- TENANT ✅ (This is the new one!)
- VIEWER

---

### Step 9: Verify RLS Policies

Run this query to check policies were created:

```sql
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  cmd
FROM pg_policies 
WHERE schemaname = 'public' 
AND policyname LIKE 'tenant%'
ORDER BY tablename, policyname;
```

**Expected output:** You should see 7 policies:
1. `tenant_view_own_occupant` on occupants
2. `tenant_update_own_profile` on occupants
3. `tenant_view_own_property` on properties
4. `tenant_view_own_work_orders` on work_orders
5. `tenant_create_work_orders` on work_orders
6. `tenant_view_own_messages` on messages
7. `tenant_create_messages` on messages

---

### Step 10: Verify New Tables & Columns

Check the new activity table was created:

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'tenant_portal_activity'
ORDER BY ordinal_position;
```

Check new columns on occupants table:

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'occupants' 
AND column_name LIKE 'portal%'
ORDER BY ordinal_position;
```

**Expected columns:**
- portal_enabled
- portal_invited_at
- portal_last_login
- portal_invitation_token
- portal_user_id

---

## ✅ Success Checklist

After completing the above steps, confirm:

- [ ] Schema executed without errors
- [ ] TENANT role exists in user_role enum
- [ ] 7 RLS policies created (check with query above)
- [ ] `tenant_portal_activity` table exists
- [ ] Portal columns exist on `occupants` table
- [ ] `submitted_by_tenant` column exists on `work_orders` table
- [ ] `is_tenant_message` column exists on `messages` table

---

## 🐛 Troubleshooting

### Warning: "Query has destructive operation"

**This is SAFE and expected!**

The schema includes these safe operations:
```sql
DROP POLICY IF EXISTS tenant_view_own_occupant ON occupants;
DROP POLICY IF EXISTS tenant_update_own_profile ON occupants;
... (etc)
```

These statements only drop policies IF they exist, then recreate them. This allows the script to be run multiple times safely. **No existing data is affected.**

**Action:** Click **"Run this query"** to proceed. This is completely safe for first-time installation.

---

### Error: "type 'user_role' does not exist"

**Solution:** Run the main `SUPABASE_SCHEMA.sql` first, as it creates the user_role enum type.

### Error: "table 'occupants' does not exist"

**Solution:** Run the main `SUPABASE_SCHEMA.sql` first to create all base tables.

### Error: "relation already exists"

**Solution:** This schema was already run. You can:
1. Skip and move to verification steps
2. Or run the rollback script first (see below)

### Error: invalid input value for enum user_role: "ADMIN"

**Solution:** This error appeared in an earlier version. It's been fixed! The API routes now correctly check for "SUPER_ADMIN" and "ORG_ADMIN" instead of "ADMIN".

**If you see this:** Make sure you have the latest version of the API route files. The error was in `src/app/api/tenant-portal/invite/route.ts`.

---

### Error: "permission denied"

**Solution:** Make sure you're logged in as the project owner or have admin access.

---

## 🔄 Rollback (If Needed)

If you need to undo the changes, run this rollback script:

```sql
-- 1. Disable tenant portal for all tenants
UPDATE occupants SET portal_enabled = false;

-- 2. Drop tenant policies
DROP POLICY IF EXISTS tenant_view_own_occupant ON occupants;
DROP POLICY IF EXISTS tenant_update_own_profile ON occupants;
DROP POLICY IF EXISTS tenant_view_own_property ON properties;
DROP POLICY IF EXISTS tenant_view_own_work_orders ON work_orders;
DROP POLICY IF EXISTS tenant_create_work_orders ON work_orders;
DROP POLICY IF EXISTS tenant_view_own_messages ON messages;
DROP POLICY IF EXISTS tenant_create_messages ON messages;

-- 3. Remove tenant users (careful!)
DELETE FROM users WHERE role = 'TENANT';

-- 4. Drop tenant activity table
DROP TABLE IF EXISTS tenant_portal_activity;

-- 5. Drop helper functions
DROP FUNCTION IF EXISTS is_tenant(UUID);
DROP FUNCTION IF EXISTS get_tenant_property_manager(UUID);
DROP FUNCTION IF EXISTS get_tenant_occupancy(UUID);

-- Note: Cannot remove TENANT from enum without recreating the entire type
-- Leave it in the enum, it won't cause issues
```

---

## 🎯 What Happens Next?

Once the schema is deployed:

1. **TypeScript errors will resolve** - Restart your Next.js dev server
2. **API routes will work** - The tenant portal APIs will function correctly
3. **You can test** - Follow the testing guide in `TENANT_PORTAL_IMPLEMENTATION_GUIDE.md`
4. **Build the UI** - Create frontend pages for the tenant portal

---

## 📞 Need Help?

If you encounter issues:

1. Check the error message in Supabase SQL Editor
2. Verify you're in the correct project
3. Ensure you have admin permissions
4. Check the main schema is deployed first
5. Review `TENANT_PORTAL_IMPLEMENTATION_GUIDE.md` for troubleshooting

---

## 🎉 Success!

Once you see the success messages and verification queries pass, your tenant portal database is ready! 

**Next steps:**
1. Restart your Next.js dev server: `npm run dev`
2. TypeScript errors should disappear
3. Start building the frontend UI
4. Test the API endpoints

---

*Deployment Guide - Created: February 28, 2026*

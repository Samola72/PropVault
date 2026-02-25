# 📚 How to Run SQL Scripts in Supabase - Detailed Guide

## 🎯 What You're Going to Do

You need to run 3 SQL files to set up your database:
1. `SUPABASE_SCHEMA.sql` - Creates all your tables
2. `SUPABASE_RLS_POLICIES.sql` - Adds security rules
3. `SUPABASE_STORAGE.sql` - Creates file storage buckets

---

## 📋 Step-by-Step Instructions

### STEP 1: Open Supabase Dashboard

1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Sign in to your account
3. Click on your **PropVault** project (or whatever you named it)

---

### STEP 2: Navigate to SQL Editor

Once you're in your project:

1. Look at the **left sidebar menu**
2. Find and click on the **"SQL Editor"** option
   - It looks like a code icon `</>`
   - Usually between "Database" and "Storage"

---

### STEP 3: Open Your First SQL File

Now you need to open the SQL files I created on your computer:

**On Mac:**
1. Open **Finder**
2. Navigate to: `Desktop → propvault`
3. You'll see 3 files:
   - `SUPABASE_SCHEMA.sql`
   - `SUPABASE_RLS_POLICIES.sql`
   - `SUPABASE_STORAGE.sql`

---

### STEP 4: Run Script #1 - Database Schema

1. **In Supabase SQL Editor**, click **"New Query"** button (top right)
2. **Open the file** `SUPABASE_SCHEMA.sql` on your computer:
   - Right-click the file
   - Choose "Open with" → "TextEdit" or "VS Code"
3. **Select ALL the text** in the file (Cmd+A)
4. **Copy it** (Cmd+C)
5. **Go back to Supabase SQL Editor**
6. **Paste** the SQL code into the query window (Cmd+V)
7. **Click the "RUN" button** (or press Cmd+Enter)

#### ✅ What Success Looks Like:
- You'll see: `Success. No rows returned`
- OR: A green checkmark ✓
- Bottom of screen shows: "Query executed successfully"

#### ❌ If You See Errors:
- **Red text with errors**: Double-check you copied ALL the text
- **"relation already exists"**: That's okay! It means it ran before
- **Authentication errors**: Make sure you're logged into Supabase

---

### STEP 5: Run Script #2 - Security Policies

1. **In Supabase SQL Editor**, click **"New Query"** again (create a fresh query)
2. **Open the file** `SUPABASE_RLS_POLICIES.sql` on your computer
3. **Select ALL the text** (Cmd+A)
4. **Copy it** (Cmd+C)
5. **Paste into Supabase SQL Editor** (Cmd+V)
6. **Click "RUN"** (or press Cmd+Enter)

#### ✅ What Success Looks Like:
- Same as before: "Success. No rows returned" or green checkmark
- This adds security rules to your database

---

### STEP 6: Run Script #3 - Storage Buckets

1. **In Supabase SQL Editor**, click **"New Query"** one more time
2. **Open the file** `SUPABASE_STORAGE.sql` on your computer
3. **Select ALL the text** (Cmd+A)
4. **Copy it** (Cmd+C)
5. **Paste into Supabase SQL Editor** (Cmd+V)
6. **Click "RUN"** (or press Cmd+Enter)

#### ✅ What Success Looks Like:
- "Success. No rows returned" or green checkmark
- This creates folders for storing images and documents

---

### STEP 7: Verify Everything Worked

#### Check Your Tables:
1. In the left sidebar, click **"Table Editor"**
2. You should see **12 tables**:
   - ✅ organizations
   - ✅ users
   - ✅ properties
   - ✅ occupants
   - ✅ service_providers
   - ✅ work_orders
   - ✅ work_order_updates
   - ✅ invoices
   - ✅ documents
   - ✅ messages
   - ✅ notifications
   - ✅ audit_logs

#### Check Your Storage:
1. In the left sidebar, click **"Storage"**
2. You should see **4 buckets**:
   - ✅ property-images
   - ✅ work-order-images
   - ✅ documents
   - ✅ avatars

---

## 🎯 Quick Reference

### What Each File Does:

| File | What It Creates | Why You Need It |
|------|----------------|-----------------|
| `SUPABASE_SCHEMA.sql` | 12 database tables | Stores all your data (properties, users, etc.) |
| `SUPABASE_RLS_POLICIES.sql` | Security rules | Makes sure users only see their own org's data |
| `SUPABASE_STORAGE.sql` | 4 storage buckets | Stores images and documents |

---

## ❓ Common Questions

### Q: Do I run these files in my terminal?
**A:** No! You run them in the Supabase website, in the SQL Editor section.

### Q: Can I run them in the wrong order?
**A:** Yes! Always run in this order:
1. SCHEMA first (creates tables)
2. RLS_POLICIES second (adds security)
3. STORAGE third (creates buckets)

### Q: What if I get an error?
**A:** Most common fixes:
- Make sure you copied ALL the text from the file
- Check you're in the right Supabase project
- If it says "already exists", that's okay - it means you ran it before

### Q: Can I run them more than once?
**A:** 
- SCHEMA - May give "already exists" errors (that's fine)
- RLS_POLICIES - Safe to run multiple times
- STORAGE - May give "already exists" errors (that's fine)

---

## 🚀 After Running All 3 Scripts

Once all 3 scripts run successfully:

1. ✅ Your database is ready
2. ✅ Your security is configured  
3. ✅ Your file storage is set up
4. 🎉 You can proceed to **Batch 02**!

---

## 💡 Pro Tips

1. **Save your queries** in Supabase (use the "Save" button) so you can re-run them later if needed
2. **Name them clearly**: "1-Schema", "2-RLS", "3-Storage"
3. Keep the original `.sql` files - don't delete them!

---

## 🆘 Need More Help?

If you're stuck:
1. Take a screenshot of any error messages
2. Check which file you're trying to run
3. Make sure you're in the SQL Editor (not Database or any other section)
4. Verify you copied the ENTIRE file contents

---

## ✅ Checklist

Use this to track your progress:

- [ ] Opened Supabase dashboard
- [ ] Found SQL Editor in left sidebar
- [ ] Created new query
- [ ] Opened `SUPABASE_SCHEMA.sql` file
- [ ] Copied ALL the text
- [ ] Pasted into SQL Editor
- [ ] Clicked RUN
- [ ] Saw success message
- [ ] Created new query for script #2
- [ ] Ran `SUPABASE_RLS_POLICIES.sql`
- [ ] Saw success message
- [ ] Created new query for script #3
- [ ] Ran `SUPABASE_STORAGE.sql`
- [ ] Saw success message
- [ ] Verified 12 tables exist in Table Editor
- [ ] Verified 4 buckets exist in Storage
- [ ] 🎉 Ready for Batch 02!

---

Good luck! This process takes about 5 minutes once you understand the steps. 🚀

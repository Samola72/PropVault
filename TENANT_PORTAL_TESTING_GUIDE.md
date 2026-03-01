# Tenant Portal Testing Guide

## 🧪 Quick Testing Steps

### Step 1: Restart Dev Server

**IMPORTANT:** Restart your Next.js dev server so TypeScript picks up the new database types.

```bash
# Stop the current dev server (Ctrl+C)
# Then restart:
npm run dev
```

**Expected:** TypeScript errors in the tenant portal API routes should now disappear!

---

### Step 2: Verify TypeScript Errors Are Gone

Check these files - they should have NO TypeScript errors now:
- `src/app/api/tenant-portal/invite/route.ts`
- `src/app/api/tenant-portal/register/route.ts`
- `src/app/api/tenant-portal/dashboard/route.ts`
- `src/app/api/tenant-portal/work-orders/route.ts`
- `src/app/api/tenant-portal/messages/route.ts`

---

### Step 3: Create Test Data (If Needed)

You'll need:
1. **A property manager account** (you probably have this)
2. **A property** with occupants
3. **An occupant** (tenant) to invite

**Quick way to add an occupant:**
Go to: http://localhost:3000/tenants/new

Fill in:
- First Name: Test
- Last Name: Tenant
- Email: tenant@test.com
- Phone: (555) 123-4567
- Property: (select one)
- Unit Number: 101
- Move In Date: (today)
- Status: ACTIVE

---

### Step 4: Test Invitation Flow

**Goal:** Invite a tenant to the portal

1. **Go to tenant detail page:**
   - Navigate to `/tenants` 
   - Click on a tenant
   - You should see their details

2. **Get the tenant's ID:**
   - Look at the URL: `/tenants/[TENANT_ID]`
   - Copy that TENANT_ID (it's a UUID)

3. **Test the invitation API:**

Open a new terminal and run:

```bash
# Replace YOUR_AUTH_TOKEN with your actual token
# Replace OCCUPANT_ID with the actual occupant UUID
curl -X POST http://localhost:3000/api/tenant-portal/invite \
  -H "Content-Type: application/json" \
  -H "Cookie: YOUR_SUPABASE_AUTH_COOKIE" \
  -d '{"occupantId": "OCCUPANT_ID"}'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Invitation created successfully",
  "invitationUrl": "http://localhost:3000/tenant/accept-invitation?token=...",
  "invitationToken": "..."
}
```

**Copy the `invitationToken` from the response - you'll need it for the next step!**

---

### Step 5: Test Registration Flow

**Goal:** Register a tenant account using the invitation token

```bash
curl -X POST http://localhost:3000/api/tenant-portal/register \
  -H "Content-Type: application/json" \
  -d '{
    "token": "PASTE_INVITATION_TOKEN_HERE",
    "email": "tenant@test.com",
    "password": "TestPassword123!",
    "firstName": "Test",
    "lastName": "Tenant"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Account created successfully",
  "user": {
    "id": "...",
    "email": "tenant@test.com",
    "firstName": "Test",
    "lastName": "Tenant"
  }
}
```

---

### Step 6: Login as Tenant

1. **Go to:** http://localhost:3000/login
2. **Login with:**
   - Email: `tenant@test.com`
   - Password: `TestPassword123!`

**Expected:** You should be logged in! (Though there's no tenant UI yet, so you'll see the regular dashboard)

---

### Step 7: Test Tenant Dashboard API

**While logged in as the tenant**, open browser console and run:

```javascript
fetch('/api/tenant-portal/dashboard')
  .then(r => r.json())
  .then(data => console.log(data));
```

**Expected Response:**
```json
{
  "occupancy": {
    "id": "...",
    "unitNumber": "101",
    "moveInDate": "...",
    "leaseEndDate": "...",
    "rentAmount": 1200,
    "status": "ACTIVE"
  },
  "property": {
    "id": "...",
    "name": "Test Property",
    "address": "123 Main St",
    ...
  },
  "manager": {
    "id": "...",
    "firstName": "...",
    "lastName": "...",
    "email": "...",
    "phone": "..."
  },
  "workOrders": [],
  "unreadMessages": 0,
  "recentActivity": []
}
```

---

### Step 8: Test Submit Work Order

**While logged in as tenant:**

```javascript
fetch('/api/tenant-portal/work-orders', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    title: 'Leaky Faucet',
    description: 'Kitchen sink is dripping constantly',
    category: 'PLUMBING',
    priority: 'MEDIUM',
    tenantNotes: 'Happens mostly at night'
  })
}).then(r => r.json()).then(data => console.log(data));
```

**Expected:**
```json
{
  "success": true,
  "workOrder": {
    "id": "...",
    "title": "Leaky Faucet",
    "status": "PENDING",
    "submitted_by_tenant": true,
    ...
  },
  "message": "Maintenance request submitted successfully"
}
```

---

### Step 9: Test Messaging

**While logged in as tenant:**

```javascript
fetch('/api/tenant-portal/messages', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    subject: 'Question about lease renewal',
    content: 'When is my lease up for renewal? I would like to discuss extending it.'
  })
}).then(r => r.json()).then(data => console.log(data));
```

**Expected:**
```json
{
  "success": true,
  "message": {
    "id": "...",
    "subject": "Question about lease renewal",
    "content": "...",
    "created_at": "..."
  }
}
```

---

### Step 10: Verify Data Isolation

**CRITICAL SECURITY TEST!**

**While logged in as tenant**, try to access another property:

```javascript
// Try to fetch dashboard for a different user (should fail)
fetch('/api/tenant-portal/dashboard')
  .then(r => r.json())
  .then(data => console.log(data));
```

**Expected:** Should ONLY show YOUR tenant's data, not other tenants' data.

Try to create a work order for a different property (should fail):
```javascript
fetch('/api/tenant-portal/work-orders', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    title: 'Test',
    description: 'Test',
    category: 'MAINTENANCE',
    priority: 'LOW'
  })
}).then(r => r.json()).then(data => console.log(data));
```

**Expected:** Work order should only be created for YOUR property, not any other property.

---

## ✅ Success Checklist

After testing, confirm:

- [ ] Dev server restarted successfully
- [ ] TypeScript errors are gone
- [ ] Invitation API returns success
- [ ] Registration API creates tenant account
- [ ] Can login as tenant
- [ ] Dashboard API returns tenant's data only
- [ ] Can submit work order
- [ ] Can send message to manager
- [ ] Data isolation works (can't see other tenants' data)
- [ ] Manager receives notification when tenant submits work order

---

## 🐛 Troubleshooting

### Error: "Unauthorized"

**Solution:** Make sure you're logged in. Check that the session cookie is being sent with requests.

### Error: "No active tenancy found"

**Solution:** 
1. Check that `portal_enabled = true` for the occupant
2. Check that occupant `status = 'ACTIVE'`
3. Verify the occupant is linked to a property

**Debug query:**
```sql
SELECT 
  o.id,
  o.email,
  o.portal_enabled,
  o.portal_user_id,
  o.status,
  o.property_id,
  u.role
FROM occupants o
LEFT JOIN users u ON u.id = o.portal_user_id
WHERE o.email = 'tenant@test.com';
```

### TypeScript Errors Still Showing

**Solution:**
1. Make sure you restarted the dev server
2. Try: `rm -rf .next && npm run dev`
3. Check that the database schema deployed successfully
4. Verify TENANT role exists: Run the enum query in Supabase

---

## 📊 What to Test Next

Once basic testing passes:

### Manager Side Testing
1. Login as property manager
2. Go to `/work-orders` - verify you see the tenant-submitted work order with a badge
3. Check `/messages` - verify you see the tenant's message
4. Test responding to tenant messages

### Security Testing
1. Try to invite the same tenant twice (should fail)
2. Try to register with wrong email (should fail)
3. Try to access tenant APIs as a property manager (should fail)
4. Try to access manager APIs as a tenant (should fail)

### Data Validation Testing
1. Try to submit work order without title (should fail)
2. Try to send message without subject (should fail)
3. Try to register without password (should fail)

---

## 🎯 Next Steps After Testing

Once all tests pass:

1. **Build Frontend UI:**
   - Tenant dashboard page
   - Maintenance request form
   - Messaging interface
   - Tenant login page

2. **Add Manager UI Updates:**
   - "Invite to Portal" button on tenant detail page
   - "Tenant Request" badge on work orders list
   - Tenant messages in inbox

3. **Email Notifications:**
   - Invitation email template
   - Work order notification email
   - Message notification email

4. **Production Deployment:**
   - Deploy to Vercel
   - Test with real data
   - Monitor performance
   - Collect user feedback

---

**Testing Complete!** 🎉

Once all tests pass, your tenant portal backend is fully functional and ready for frontend development!

---

*Testing Guide - Created: February 28, 2026*

# Tenant Access in PropVault - Explained

## Current State: Tenants as Records (Not Users)

### ✅ What PropVault Currently Does

**Tenants are DATA, not app users.**

PropVault is designed as a **property manager-facing tool**. Tenants (called "occupants" in the database) are:
- 📋 Records managed BY property managers
- 🏠 Associated with properties and leases
- 💰 Recipients of invoices
- 🔧 Linked to work orders
- 📧 Contactable via email/phone (stored in their record)

### 🚫 What Tenants CANNOT Do Currently:
- ❌ Log into the PropVault app
- ❌ View their account online
- ❌ Submit work orders directly
- ❌ Pay rent through the app
- ❌ View their payment history
- ❌ Communicate through the app's message system

### ✅ What Property Managers DO for Tenants:
- Create tenant profiles with contact info
- Track lease dates and rent amounts
- Generate and send invoices (via email)
- Create work orders on behalf of tenants
- Store tenant documents
- Track tenant payment history
- Send messages to tenants (external email)

---

## How Tenant Data is Used

### 1. Tenant Management
Property managers add tenant information:
```
- Full name
- Email & phone
- Lease start/end dates
- Monthly rent amount
- Security deposit
- Emergency contacts
- National ID (SSN/license)
- Status (Active, Inactive, Eviction, Pending)
```

### 2. Work Orders
When creating a work order:
- Manager selects the property
- Can optionally link to a specific tenant
- Tenant's contact info is available for reference
- Tenant receives updates via external email (if manager sends)

### 3. Invoicing
Managers generate invoices:
- Linked to tenant records
- Includes tenant contact information
- Sent via email outside the system
- Payment tracking is manual

### 4. Communication
Current communication flow:
```
Property Manager → Email → Tenant (external)
Tenant → Email/Phone → Property Manager
```

The "Messages" feature in PropVault is for **internal team communication** only (between property managers, maintenance staff, accountants, etc.)

---

## Architecture Decision: Why No Tenant Portal?

### Current Design Philosophy:
PropVault is built as a **B2B (Business-to-Business)** tool, not B2C (Business-to-Consumer).

**Target User:** Property management professionals
**Data Subjects:** Tenants (occupants)

This is similar to tools like:
- CRM systems (clients are records, not users)
- Patient management systems (patients are records)
- Customer databases (customers are records)

---

## 🔮 Future Enhancement: Tenant Portal

A tenant portal COULD be added as a **Phase 2 feature**. Here's what it might include:

### Potential Tenant Portal Features:

#### For Tenants:
- 🏠 **View Lease Details**
  - Lease terms and expiration
  - Monthly rent amount
  - Security deposit information

- 💳 **Pay Rent Online**
  - Credit card / ACH payments
  - Payment history
  - Download receipts

- 🔧 **Submit Work Orders**
  - Report maintenance issues
  - Upload photos
  - Track status updates

- 📧 **Communicate with Property Manager**
  - In-app messaging
  - Request appointments
  - Ask questions

- 📄 **Access Documents**
  - View lease agreement
  - Download move-in checklist
  - Access property rules

- 📊 **View Account**
  - Payment history
  - Outstanding balance
  - Upcoming due dates

#### For Property Managers:
- Toggle tenant portal on/off per property
- Approve/reject work orders
- Respond to tenant messages
- Monitor tenant engagement

### Technical Implementation (Future):
1. Add `TENANT` user role to database
2. Create tenant registration flow
3. Build tenant-specific UI (simplified dashboard)
4. Implement payment processing (Stripe Connect)
5. Add tenant mobile app screens
6. Set up tenant notifications

**Estimated Effort:** 4-6 weeks of development

---

## Current Workarounds

### For Property Managers Who Want Tenant Self-Service:

#### Option 1: Rent Collection
- Use Stripe payment links (generated manually)
- Send monthly invoices via email with payment link
- Track payments in PropVault when received

#### Option 2: Work Order Submissions
- Set up Google Form / Typeform
- Tenants submit maintenance requests externally
- Manager creates work orders in PropVault

#### Option 3: Communication
- Email for correspondence
- Use messaging apps (WhatsApp, SMS)
- Log important communications in PropVault notes

#### Option 4: Document Sharing
- Email documents to tenants
- Use Google Drive / Dropbox for shared access
- Store copies in PropVault for records

---

## Comparison: Manager Tools vs Tenant Portals

### PropVault (Current) - Manager-Focused
**Best For:**
- Professional property managers
- Real estate investors
- Landlords managing portfolios
- Property management teams

**Focus:**
- Internal operations
- Team collaboration
- Financial tracking
- Maintenance coordination
- Analytics and reporting

### Tenant Portals (Common in Industry)
**Examples:**
- Buildium Tenant Portal
- AppFolio Tenant App
- RentManager Resident Portal

**Focus:**
- Tenant self-service
- Online rent payment
- Maintenance requests
- Document access
- Community features

---

## Bottom Line

### Current PropVault Model:

```
┌─────────────────────────────────────┐
│                                     │
│   Property Managers (App Users)     │
│   ↓                                 │
│   Manage Properties                 │
│   ↓                                 │
│   Track Tenants (as records)        │
│   ↓                                 │
│   External Communication            │
│   (email, phone)                    │
│   ↓                                 │
│   Tenants (outside system)          │
│                                     │
└─────────────────────────────────────┘
```

### Potential Future Model with Tenant Portal:

```
┌─────────────────────────────────────┐
│                                     │
│   Property Managers                 │
│   ↕ (bidirectional)                 │
│   PropVault Platform                │
│   ↕ (bidirectional)                 │
│   Tenants (limited app access)      │
│                                     │
└─────────────────────────────────────┘
```

---

## Recommendations

### If You Need Tenant Self-Service NOW:
Consider these tenant portal solutions that integrate with PropVault-style workflows:
1. **TenantCloud** - Free tenant portal
2. **Buildium** - Full-featured (more expensive)
3. **Cozy** - Free rent collection
4. **Zillow Rental Manager** - Free option

Use PropVault for backend management, external tool for tenant-facing features.

### If You Want to Add Tenant Portal to PropVault:
This is a **significant feature enhancement** that would require:
- Database schema updates (add TENANT role)
- New tenant-facing UI/UX
- Payment processing integration
- Mobile app tenant screens
- Security considerations (data privacy)
- Email invitation system

**Recommendation:** Launch PropVault as-is for property managers, then evaluate demand for tenant portal based on user feedback.

---

## Summary

**Q: Can tenants use PropVault?**
**A: No, not currently. Tenants are managed as records by property managers, not as app users.**

**Q: Is this a limitation?**
**A: Not necessarily. It's a design choice. PropVault is a B2B tool for property management professionals.**

**Q: Could a tenant portal be added?**
**A: Yes, absolutely. It would be a natural Phase 2 enhancement based on user demand.**

**Q: What's the value proposition without tenant access?**
**A: PropVault streamlines operations for property managers - the primary users who pay for the service. Tenant data is managed efficiently, but communication remains traditional (email/phone).**

---

**PropVault is currently optimized for property managers to efficiently manage their portfolios. Tenant self-service is a potential future enhancement, not a current feature.** 🏢✨

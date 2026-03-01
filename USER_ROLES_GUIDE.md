# PropVault User Roles & Target Users

## Overview
PropVault is a **multi-tenant, role-based property management platform** designed for property management companies, real estate investors, landlords, and their teams. The system supports 6 different user roles with varying levels of access.

---

## 🎯 Target Users

### Primary Users:
1. **Property Management Companies** - Small to enterprise-level firms managing multiple properties
2. **Real Estate Investors** - Individual or group investors with property portfolios
3. **Landlords** - Independent landlords managing their own properties
4. **Property Management Teams** - Staff members with different responsibilities

---

## 👥 User Roles & Permissions

### 1. 🔴 SUPER_ADMIN
**Who:** Platform administrators (your internal team)
- Full system access across all organizations
- Can manage all features and settings
- Access to all data and analytics
- Typically for PropVault internal use only

### 2. 🟠 ORG_ADMIN (Organization Administrator)
**Who:** Company owners, CEOs, Managing Directors
- **Full access** to their organization
- Can manage all properties, users, and settings
- Add/remove team members and assign roles
- Access all financial reports and analytics
- Configure organization settings and branding
- Manage subscriptions and billing

**Use Cases:**
- Property management company owner
- Real estate investment firm director
- Head of property operations

### 3. 🟡 PROPERTY_MANAGER
**Who:** Day-to-day property managers, portfolio managers
- **Core operational access**
- Create and manage properties
- Add/manage tenants and leases
- Create and assign work orders
- Generate invoices
- Manage service providers
- View reports and analytics
- Handle tenant communications

**Use Cases:**
- Property managers handling specific portfolios
- Regional managers overseeing multiple locations
- Leasing agents managing tenant relationships

### 4. 🟢 MAINTENANCE_STAFF
**Who:** Maintenance coordinators, facility managers
- **Maintenance-focused access**
- View and update work orders
- Manage service provider assignments
- Upload work order photos and updates
- Track maintenance costs
- Limited property and tenant viewing

**Use Cases:**
- In-house maintenance coordinators
- Facility managers
- Maintenance supervisors

### 5. 🔵 ACCOUNTANT
**Who:** Accountants, bookkeepers, financial controllers
- **Financial-focused access**
- Create and manage invoices
- Track payments and expenses
- Generate financial reports
- Export data for accounting software
- View property financial performance
- Limited access to work orders (cost tracking)

**Use Cases:**
- Company accountants
- Bookkeepers
- Financial controllers
- CFOs

### 6. ⚪ VIEWER
**Who:** Stakeholders, investors, assistants
- **Read-only access**
- View properties and their details
- View reports and dashboards
- View work orders and invoices
- Cannot create or modify any data

**Use Cases:**
- Passive real estate investors
- Property owners (landlords using PM services)
- Executive stakeholders
- Administrative assistants

---

## 📱 Mobile App Access

All user roles have access to the **PropVault mobile app** (React Native):
- iOS and Android support
- Role-based feature access matching web permissions
- Push notifications for important updates
- On-the-go work order management
- Quick property and tenant lookup

---

## 🏢 Organization Structure

### Multi-Tenant Architecture
- Each organization is **completely isolated**
- Organizations can have unlimited users (based on plan)
- Each user belongs to one organization
- Data privacy and security between organizations

### Subscription Plans
1. **Starter** - Small landlords (up to 10 properties)
2. **Professional** - Growing PM companies (up to 50 properties)
3. **Enterprise** - Large firms (unlimited properties)

Each plan supports multiple team members with different roles.

---

## 🎭 Real-World User Scenarios

### Scenario 1: Small Landlord
**Profile:** Individual with 5 rental properties
- **Role:** ORG_ADMIN (manages everything themselves)
- Uses: Property tracking, tenant management, work orders, invoices
- May add VIEWER access for spouse or business partner

### Scenario 2: Growing Property Management Company
**Profile:** Company managing 25 properties with 5-person team
- **ORG_ADMIN:** Company owner
- **PROPERTY_MANAGER:** 2 managers handling day-to-day operations
- **ACCOUNTANT:** Part-time bookkeeper
- **VIEWER:** Business partner/investor

### Scenario 3: Enterprise Property Management Firm
**Profile:** Large firm managing 200+ properties
- **ORG_ADMIN:** CEO/Director
- **PROPERTY_MANAGER:** 10 regional managers
- **MAINTENANCE_STAFF:** 3 maintenance coordinators
- **ACCOUNTANT:** 2 full-time accountants
- **VIEWER:** Multiple investors and stakeholders

---

## 🔐 Permission Matrix

| Feature | Super Admin | Org Admin | Property Manager | Maintenance | Accountant | Viewer |
|---------|------------|-----------|------------------|-------------|------------|--------|
| Manage Properties | ✅ | ✅ | ✅ | 👁️ View Only | 👁️ View Only | 👁️ View Only |
| Manage Tenants | ✅ | ✅ | ✅ | 👁️ Limited | 👁️ View Only | 👁️ View Only |
| Work Orders | ✅ | ✅ | ✅ | ✅ Update | 👁️ View Only | 👁️ View Only |
| Invoices | ✅ | ✅ | ✅ | ❌ | ✅ | 👁️ View Only |
| Service Providers | ✅ | ✅ | ✅ | ✅ | ❌ | 👁️ View Only |
| Analytics | ✅ | ✅ | ✅ | 👁️ Limited | ✅ | 👁️ View Only |
| Documents | ✅ | ✅ | ✅ | 👁️ Limited | ✅ | 👁️ View Only |
| User Management | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Billing Settings | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Messages | ✅ | ✅ | ✅ | ✅ | ✅ | 👁️ View Only |

---

## 🚀 Getting Started for Different Users

### For Property Managers:
1. Register organization (becomes ORG_ADMIN)
2. Add properties
3. Invite team members with appropriate roles
4. Add tenants and service providers
5. Start managing work orders and invoices

### For Team Members:
1. Receive email invitation from ORG_ADMIN
2. Create account with assigned role
3. Access features based on role permissions
4. Download mobile app for on-the-go access

### For Landlords:
1. Register as ORG_ADMIN
2. Add your properties
3. Manage tenants directly
4. Create work orders for maintenance
5. Generate invoices for rent collection
6. Optional: Add ACCOUNTANT role for bookkeeper

---

## 💡 Key Benefits by User Type

### For Property Managers:
- Centralized management of all properties
- Automated workflows and notifications
- Real-time collaboration with team
- Professional tenant communication
- Comprehensive reporting

### For Maintenance Staff:
- Mobile-first work order management
- Photo documentation
- Service provider coordination
- Real-time status updates

### For Accountants:
- Streamlined invoicing
- Expense tracking
- Financial reporting
- Export to accounting software
- Rent collection monitoring

### For Investors/Viewers:
- Portfolio performance visibility
- Property status monitoring
- Financial metrics at a glance
- No-hassle read-only access

---

## 📞 Support & Resources

- **Documentation:** Available in app dashboard
- **Video Tutorials:** Coming soon
- **Support:** support@propvault.com
- **Mobile Apps:** iOS App Store, Google Play Store

---

**Bottom Line:** PropVault is designed for **anyone involved in property management** - from solo landlords to enterprise property management firms with large teams. The flexible role-based system ensures each user has the right tools and permissions for their specific job function.

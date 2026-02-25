# PropVault - Batch 03: Core API Routes
## Properties, Work Orders & Tenants

---

## ✅ BATCH 03 COMPLETE!

This batch implements the complete backend API infrastructure for managing properties, work orders, and tenants with full CRUD operations, validation, and React Query integration.

---

## 📦 What Was Built

### 1. **API Helper Functions** (`src/lib/api/helpers.ts`)
- ✅ `getRequestContext()` - Extract authenticated user and org
- ✅ Response helpers (success, error, unauthorized, etc.)
- ✅ `logAudit()` - Automatic audit logging for all mutations
- ✅ `getPaginationParams()` - Parse pagination and filtering from URLs

### 2. **Validation Schemas** (Zod)
- ✅ `src/lib/validations/property.ts` - Property creation/update validation
- ✅ `src/lib/validations/work-order.ts` - Work order validation
- ✅ `src/lib/validations/tenant.ts` - Tenant/occupant validation

### 3. **Properties API** (`/api/properties`)
- ✅ `GET /api/properties` - List properties with filtering, pagination, search
- ✅ `POST /api/properties` - Create new property (requires permissions)
- ✅ `GET /api/properties/[id]` - Get property details with relations
- ✅ `PATCH /api/properties/[id]` - Update property
- ✅ `DELETE /api/properties/[id]` - Delete property (admin only)

**Features:**
- Filter by status, type
- Search by name, address, city
- Pagination & sorting
- Includes occupants and work orders count
- Role-based access control

### 4. **Work Orders API** (`/api/work-orders`)
- ✅ `GET /api/work-orders` - List work orders with advanced filtering
- ✅ `POST /api/work-orders` - Create work order with auto-assignment
- ✅ `GET /api/work-orders/[id]` - Get work order with full history
- ✅ `PATCH /api/work-orders/[id]` - Update status with activity log
- ✅ `DELETE /api/work-orders/[id]` - Delete work order

**Features:**
- Filter by status, priority, category, property, assignee
- Status update logging with messages
- Automatic notifications on assignment/updates
- Complete update history tracking
- Includes property, tenant, and service provider info

### 5. **Tenants API** (`/api/tenants`)
- ✅ `GET /api/tenants` - List tenants/occupants
- ✅ `POST /api/tenants` - Add tenant with lease validation
- ✅ `GET /api/tenants/[id]` - Get tenant details
- ✅ `PATCH /api/tenants/[id]` - Update tenant
- ✅ `DELETE /api/tenants/[id]` - Remove tenant

**Features:**
- Auto-update property status when tenant added/removed
- Lease date validation
- Filter by status, property
- Search by name, email, phone
- Links to work orders and invoices

### 6. **Analytics API** (`/api/analytics`)
- ✅ `GET /api/analytics` - Dashboard analytics and statistics

**Returns:**
- Property stats (total, available, occupied, occupancy rate)
- Work order stats (total, open, in progress, critical)
- Tenant stats (active, expiring leases, monthly rent total)
- Financial stats (invoices, pending, overdue amounts)
- Monthly revenue chart data (last 6 months)

### 7. **React Query Hooks** (Frontend Data Management)
- ✅ `src/hooks/use-properties.ts`
  - `useProperties()` - List with filters
  - `useProperty(id)` - Single property
  - `useCreateProperty()` - Create mutation
  - `useUpdateProperty()` - Update mutation
  - `useDeleteProperty()` - Delete mutation

- ✅ `src/hooks/use-work-orders.ts`
  - `useWorkOrders()` - List with filters
  - `useWorkOrder(id)` - Single work order
  - `useCreateWorkOrder()` - Create mutation
  - `useUpdateWorkOrder()` - Update with status tracking

- ✅ `src/hooks/use-tenants.ts`
  - `useTenants()` - List with filters
  - `useTenant(id)` - Single tenant
  - `useCreateTenant()` - Create mutation
  - `useUpdateTenant()` - Update mutation
  - `useDeleteTenant()` - Delete mutation

---

## 🔐 Security Features

### Authentication & Authorization
- ✅ All routes require authentication
- ✅ Role-based access control (RBAC)
- ✅ Organization-level data isolation
- ✅ Permission checks for mutations

### Audit Logging
- ✅ All create/update/delete operations logged
- ✅ Tracks user, organization, entity, and changes
- ✅ Stored in `audit_logs` table

### Data Validation
- ✅ Zod schema validation on all inputs
- ✅ Type-safe with TypeScript
- ✅ Custom validation rules (e.g., lease dates)

---

## 📊 API Response Format

### Success Response
```json
{
  "data": { /* your data */ },
  "error": null
}
```

### List Response
```json
{
  "data": {
    "data": [ /* array of items */ ],
    "total": 100,
    "page": 1,
    "limit": 20,
    "totalPages": 5
  },
  "error": null
}
```

### Error Response
```json
{
  "data": null,
  "error": "Error message"
}
```

---

## 🎯 Usage Examples

### Frontend: List Properties
```typescript
import { useProperties } from "@/hooks/use-properties";

function PropertiesList() {
  const { data, isLoading } = useProperties({
    status: "OCCUPIED",
    page: 1,
    limit: 10
  });

  if (isLoading) return <div>Loading...</div>;
  
  return (
    <div>
      {data.data.map(property => (
        <div key={property.id}>{property.name}</div>
      ))}
    </div>
  );
}
```

### Frontend: Create Work Order
```typescript
import { useCreateWorkOrder } from "@/hooks/use-work-orders";

function CreateWorkOrder() {
  const create = useCreateWorkOrder();

  const handleSubmit = (formData) => {
    create.mutate({
      property_id: "uuid",
      title: "Fix leaking faucet",
      description: "Kitchen sink is leaking",
      category: "PLUMBING",
      priority: "HIGH"
    });
  };

  return <form onSubmit={handleSubmit}>...</form>;
}
```

### Backend: Test API
```bash
# List properties (requires auth)
curl http://localhost:3000/api/properties

# Get analytics
curl http://localhost:3000/api/analytics

# Create property (requires auth token)
curl -X POST http://localhost:3000/api/properties \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Property","address_line1":"123 Main St",...}'
```

---

## 🗂️ File Structure

```
propvault/
├── src/
│   ├── app/api/
│   │   ├── properties/
│   │   │   ├── route.ts           # GET, POST /api/properties
│   │   │   └── [id]/route.ts      # GET, PATCH, DELETE /api/properties/:id
│   │   ├── work-orders/
│   │   │   ├── route.ts           # GET, POST /api/work-orders
│   │   │   └── [id]/route.ts      # GET, PATCH, DELETE /api/work-orders/:id
│   │   ├── tenants/
│   │   │   ├── route.ts           # GET, POST /api/tenants
│   │   │   └── [id]/route.ts      # GET, PATCH, DELETE /api/tenants/:id
│   │   └── analytics/
│   │       └── route.ts           # GET /api/analytics
│   ├── lib/
│   │   ├── api/
│   │   │   └── helpers.ts         # API utilities
│   │   └── validations/
│   │       ├── property.ts
│   │       ├── work-order.ts
│   │       └── tenant.ts
│   └── hooks/
│       ├── use-properties.ts
│       ├── use-work-orders.ts
│       └── use-tenants.ts
```

---

## ✨ Key Features

### Automatic Property Status Management
When you add a tenant, the property status automatically changes to "OCCUPIED". When the last tenant is removed, it reverts to "AVAILABLE".

### Work Order Activity Tracking
Every status change creates an entry in `work_order_updates` table with:
- User who made the change
- Status transition
- Message/notes
- Optional images
- Timestamp

### Smart Filtering & Search
All list endpoints support:
- Full-text search
- Status/type filtering
- Date range filtering
- Pagination (page, limit)
- Sorting (sortBy, sortOrder)

### Notifications
Work orders automatically trigger notifications when:
- Created and assigned to a service provider
- Status is updated
- Marked as completed

---

## 🚀 What's Next: Batch 04

The next batch will add:
- **Service Providers API** - Manage contractors and vendors
- **Invoices API** - Billing and payments
- **Documents API** - File uploads (images, PDFs, contracts)
- **Notifications API** - Real-time notification system
- **Messages API** - Internal messaging

---

## 📝 Testing

### Manual Testing
1. Start the dev server: `npm run dev`
2. Login at `/login`
3. Test API endpoints (they require authentication)

### API Testing with Auth
Since all routes require authentication, you need to:
1. Login through the app
2. Use browser dev tools to get the session cookie
3. Include the cookie in your curl/Postman requests

Or test directly through the React Query hooks in your components!

---

## ✅ Batch 03 Verification Checklist

- [x] API helpers created
- [x] All 3 validation schemas created
- [x] Properties API routes (2 files) created
- [x] Work Orders API routes (2 files) created
- [x] Tenants API routes (2 files) created
- [x] Analytics API route created
- [x] All 3 React Query hooks created
- [x] No TypeScript errors
- [x] Dev server running successfully

---

## 🎉 Batch 03 is Complete!

Your PropVault backend API is now fully functional with:
- ✅ 13 API endpoints
- ✅ Full CRUD for properties, work orders, tenants
- ✅ Analytics dashboard data
- ✅ React Query integration
- ✅ Audit logging
- ✅ Role-based permissions
- ✅ Data validation
- ✅ Type safety

**Ready for Batch 04!** 🚀

# Issues Resolution Plan

**Created:** March 10, 2026  
**Status:** In Progress  
**Priority:** High - Production Deployment

## Overview
This document outlines the plan to resolve 10 critical issues identified during app testing. The application is already deployed for testing, so fixes must be carefully implemented and verified.

---

## Issues Summary

### ✅ Issue Analysis Complete
All issues have been explored and root causes identified.

---

## Detailed Issues & Solutions

### 🔴 **Issue 1: Tenant Creation - Validation Error**
**Problem:**
- Fields not marked as required show "null" error when left blank
- Discrepancy between UI validation and backend schema
- Validation schema has optional fields (phone, national_id) but they may cause issues

**Root Cause:**
- `tenantSchema` in `/src/lib/validations/tenant.ts` requires fields like `security_deposit` and `status` that are not in the form
- Backend expects these fields but form doesn't provide them

**Solution:**
- Update tenant form to include all required fields OR
- Make fields truly optional in validation schema
- Add proper default values for fields not in UI
- Improve error messaging (no "null" errors)

**Files to Modify:**
- `src/lib/validations/tenant.ts`
- `src/components/forms/tenant-form.tsx`
- `src/app/api/tenants/route.ts`

---

### 🟡 **Issue 2: Work Order Creation - Optional Field Validation**
**Problem:**
- "Assign to Service Provider" is marked optional but prevents submission if left empty
- Form validation may be too strict

**Root Cause:**
- `workOrderSchema` has `assigned_to: z.string().uuid().optional()` which validates as UUID when provided
- Empty string "" is not the same as undefined/null
- Need to properly handle empty strings

**Solution:**
- Transform empty strings to undefined/null before validation
- Update form to use proper null/undefined for optional fields
- Ensure API handles null values correctly

**Files to Modify:**
- `src/lib/validations/work-order.ts`
- `src/app/(dashboard)/work-orders/new/page.tsx`
- `src/app/api/work-orders/route.ts`

---

### 🟢 **Issue 3: Work Order Form Reset**
**Problem:**
- Navigating away from work order form (e.g., to add service provider) clears all entered data
- Poor user experience

**Root Cause:**
- Form uses React state that isn't persisted
- No browser storage or draft functionality
- Navigation causes component unmount

**Solution:**
- Implement form draft saving to localStorage
- Add "Save Draft" functionality
- Restore draft when returning to form
- Add confirmation dialog before navigation if form has data

**Files to Modify:**
- `src/app/(dashboard)/work-orders/new/page.tsx`
- Create new hook: `src/hooks/use-form-draft.ts`

---

### 🟡 **Issue 4: Document Upload Not Working**
**Problem:**
- Files cannot be uploaded successfully
- Upload feature exists but may have integration issues

**Root Cause:**
- Need to verify Supabase storage configuration
- Check upload hook implementation
- Verify API endpoint functionality

**Solution:**
- Test document upload functionality
- Fix any Supabase storage bucket issues
- Ensure proper file size limits and validation
- Add better error handling and user feedback

**Files to Check:**
- `src/hooks/use-documents.ts`
- `src/app/api/documents/route.ts`
- `src/lib/upload.ts`
- Supabase storage configuration

---

### 🔴 **Issue 5: Work Order Visibility - No View Button**
**Problem:**
- No obvious "View" or "Open" button in work orders table
- Users must click on text to open work order
- Poor discoverability

**Solution:**
- Add explicit "View" button/icon to each table row
- Add hover effect to make entire row clickable
- Include visual indicator (arrow icon, eye icon)
- Improve table UX

**Files to Modify:**
- `src/app/(dashboard)/work-orders/page.tsx`
- Similar pattern for other list pages

---

### 🟡 **Issue 6: Invoice Creation Not Working**
**Problem:**
- App doesn't allow invoice creation or feature is broken
- Need to verify actual functionality

**Root Cause:**
- Form exists and looks functional in code
- May be API or validation issue
- Need to test actual creation flow

**Solution:**
- Test invoice creation end-to-end
- Fix any API errors
- Ensure line items validation works
- Verify invoice can be saved and retrieved

**Files to Check:**
- `src/app/(dashboard)/invoices/new/page.tsx`
- `src/app/api/invoices/route.ts`
- `src/lib/validations/invoice.ts`

---

### 🔴 **Issue 7: No Work Order Completion Button**
**Problem:**
- After creating work order, no way to mark as completed
- Missing status update functionality

**Root Cause:**
- Work order detail page has no status update UI
- Work order updates system exists but not exposed in UI
- Need dedicated completion/status change functionality

**Solution:**
- Add status update section to work order detail page
- Create "Mark as Complete" button
- Add status change dropdown
- Implement update message/notes functionality
- Show update in timeline

**Files to Modify:**
- `src/app/(dashboard)/work-orders/[id]/page.tsx`
- `src/app/api/work-orders/[id]/route.ts`
- Create: `src/app/api/work-orders/[id]/updates/route.ts`

---

### 🟡 **Issue 8: Dashboard Doesn't Reflect Updates**
**Problem:**
- Dashboard shows static "0" values
- No real-time updates
- Stats not fetched from API

**Root Cause:**
- Dashboard uses mock/hardcoded data
- No API calls to fetch actual statistics
- Missing data fetching hooks

**Solution:**
- Create dashboard statistics API endpoint
- Implement data fetching in dashboard page
- Add real-time updates using React Query
- Show proper loading states
- Cache stats appropriately

**Files to Modify:**
- `src/app/(dashboard)/dashboard/page.tsx`
- Create: `src/app/api/dashboard/stats/route.ts`
- Create: `src/hooks/use-dashboard-stats.ts`

---

### 🟢 **Issue 9: Settings Page Fails to Load**
**Problem:**
- Settings → Profile and Organization page fails to load
- May be related to data fetching hooks

**Root Cause:**
- Uses `useCurrentUser()` and `useCurrentOrg()` hooks
- Hooks may return null during loading
- No proper error handling for failed data fetch
- Loading states not handled properly

**Solution:**
- Add proper loading states
- Handle null/undefined data gracefully
- Add error boundaries
- Improve data fetching logic
- Add retry mechanisms

**Files to Modify:**
- `src/app/(dashboard)/settings/page.tsx`
- `src/hooks/use-organization.ts`
- Add error handling

---

### 🟢 **Issue 10: No Logout Button**
**Problem:**
- No visible logout button
- Difficult for users to sign out

**Root Cause:**
- Logout exists in sidebar but only visible when expanded
- May not be obvious to users
- Should be more prominent

**Solution:**
- Ensure logout is visible in both collapsed and expanded sidebar states
- Consider adding logout to user menu/dropdown
- Add logout to header as alternative
- Make logout more discoverable

**Files to Modify:**
- `src/components/layout/sidebar.tsx`
- `src/components/layout/header.tsx` (add user dropdown)

---

## Implementation Priority

### 🔥 **Critical (Fix First)**
1. Issue 1: Tenant Creation Validation
2. Issue 7: Work Order Completion
3. Issue 5: Work Order View Button
4. Issue 8: Dashboard Updates

### ⚠️ **High Priority**
5. Issue 2: Work Order Optional Fields
6. Issue 4: Document Upload
7. Issue 9: Settings Page Loading

### 📋 **Medium Priority**
8. Issue 6: Invoice Creation (verify/fix)
9. Issue 3: Form Data Persistence
10. Issue 10: Logout Visibility

---

## Testing Strategy

### Before Each Fix
1. Verify current behavior
2. Document exact error/issue
3. Test in production-like environment

### After Each Fix
1. Test the specific issue resolution
2. Test related functionality
3. Check for regressions
4. Verify error messages
5. Test edge cases

### Final Verification
- Complete end-to-end testing
- Test all forms with various inputs
- Verify error handling
- Check user experience flows
- Test on production deployment

---

## Deployment Notes

⚠️ **IMPORTANT:** Since this is already deployed for testing:
- Make changes incrementally
- Test thoroughly before deploying each batch
- Keep track of all changes
- Have rollback plan ready
- Monitor production after each deployment
- Communicate changes to testers

---

## Progress Tracking

- [x] Issue analysis and exploration
- [x] Action plan creation
- [ ] Fix Issue 1: Tenant Creation
- [ ] Fix Issue 2: Work Order Optional Fields
- [ ] Fix Issue 3: Form Data Persistence
- [ ] Fix Issue 4: Document Upload
- [ ] Fix Issue 5: Work Order View Button
- [ ] Fix Issue 6: Invoice Creation
- [ ] Fix Issue 7: Work Order Completion
- [ ] Fix Issue 8: Dashboard Updates
- [ ] Fix Issue 9: Settings Page Loading
- [ ] Fix Issue 10: Logout Visibility
- [ ] Final testing and verification
- [ ] Documentation update
- [ ] Deployment

---

## Notes

- All fixes should maintain backward compatibility
- Focus on user experience improvements
- Add proper error messages (no "null" errors)
- Ensure all optional fields work as expected
- Test with real data scenarios
- Document any API changes

**Last Updated:** March 10, 2026, 1:26 PM

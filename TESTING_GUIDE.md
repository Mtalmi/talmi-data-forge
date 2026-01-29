# TBOS Mobile Deployment - Testing & Validation Guide

**Created:** January 29, 2026  
**Purpose:** Comprehensive testing checklist for mobile optimization and user roles

---

## Phase 4: Testing & Validation

### Prerequisites

Before testing, ensure:
1. ✅ All code pushed to GitHub (commits: 0d27bd4, 0f53123)
2. ✅ Lovable has auto-synced and deployed changes
3. ✅ Supabase migration applied (user_roles_system.sql)

---

## 1. Database Migration Deployment

### Apply Migration to Supabase

**Option A: Via Supabase Dashboard**
1. Go to https://supabase.com/dashboard
2. Select your project (Mtalmi's Org)
3. Navigate to **SQL Editor**
4. Copy contents of `supabase/migrations/20260129_user_roles_system.sql`
5. Paste and execute
6. Verify tables created:
   - `user_profiles`
   - `role_permissions`
   - `critical_actions_log`

**Option B: Via Supabase CLI**
```bash
supabase db push
```

### Create Initial User Accounts

Execute in Supabase SQL Editor:

```sql
-- Insert user profiles for existing auth users
-- Replace UUIDs with actual auth.users IDs

-- CEO (Max Talmi)
INSERT INTO user_profiles (id, email, full_name, role, is_active)
VALUES (
  'YOUR_AUTH_USER_ID_HERE',
  'max.talmi@gmail.com',
  'Max Talmi',
  'ceo',
  true
);

-- Supervisor (Karim)
INSERT INTO user_profiles (id, email, full_name, role, is_active)
VALUES (
  'YOUR_AUTH_USER_ID_HERE',
  'karim@example.com',
  'Karim',
  'supervisor',
  true
);

-- Resp. Technique (Abdel Sadek)
INSERT INTO user_profiles (id, email, full_name, role, is_active)
VALUES (
  'YOUR_AUTH_USER_ID_HERE',
  'abdelsadek@example.com',
  'Abdel Sadek',
  'resp_technique',
  true
);

-- FrontDesk
INSERT INTO user_profiles (id, email, full_name, role, is_active)
VALUES (
  'YOUR_AUTH_USER_ID_HERE',
  'frontdesk@example.com',
  'FrontDesk',
  'frontdesk',
  true
);

-- Directeur Opérationnel
INSERT INTO user_profiles (id, email, full_name, role, is_active)
VALUES (
  'YOUR_AUTH_USER_ID_HERE',
  'directeur@example.com',
  'Directeur Opérationnel',
  'directeur_operationnel',
  true
);

-- Centraliste (Hassan)
INSERT INTO user_profiles (id, email, full_name, role, is_active)
VALUES (
  'YOUR_AUTH_USER_ID_HERE',
  'hassan@example.com',
  'Hassan',
  'centraliste',
  true
);
```

---

## 2. User Role Testing

### Test Matrix

| Role | Ventes Access | Production Access | Stocks Access | Planning Access | Finance Access |
|------|---------------|-------------------|---------------|-----------------|----------------|
| **CEO** | ✅ Full | ✅ Full | ✅ Full | ✅ Full | ✅ Full |
| **Supervisor** | ✅ Full (notify CEO on hard changes) | ✅ Full | ✅ Full | ✅ Full | ✅ Full |
| **Resp. Technique** | 👁️ View only | ✅ Approve quality | ✅ Approve reception | 👁️ View only | ❌ None |
| **FrontDesk** | ✅ Manage BC/BL/Devis | 👁️ View only | 👁️ View only | 👁️ View only | ❌ None |
| **Dir. Opérationnel** | 👁️ View formulas, Emergency BC (18h+) | 👁️ View only | 👁️ View only | ✅ Manage | 👁️ View only |
| **Centraliste** | ❌ Blocked | ✅ Production only | ❌ None | ❌ None | ❌ None |

### Testing Steps

#### Test 1: CEO Access
1. Login as CEO (max.talmi@gmail.com)
2. Verify full access to all modules
3. Check that all actions are logged
4. Verify no permission errors

#### Test 2: Supervisor Access
1. Login as Supervisor
2. Perform a "hard change" (e.g., delete a devis, override credit)
3. Verify CEO receives notification
4. Check `critical_actions_log` table

#### Test 3: Centraliste Restriction
1. Login as Centraliste (Hassan)
2. Attempt to access `/ventes` route
3. Verify "Accès Refusé" page displays
4. Verify redirect to Production module
5. Confirm no financial data visible

#### Test 4: Emergency BC Creation
1. Login as Directeur Opérationnel
2. Before 18:00: Verify emergency BC button is disabled
3. After 18:00: Verify emergency BC button is enabled
4. Create emergency BC
5. Verify CEO approval required
6. Check `critical_actions_log` for entry

#### Test 5: Resp. Technique Quality Approval
1. Login as Resp. Technique
2. Navigate to Production module
3. Verify can approve quality checks
4. Attempt to edit production data (should fail)
5. Verify can approve stock receptions

---

## 3. Mobile UI Testing

### Test Devices

**Minimum Test Matrix:**
- ✅ iPhone (iOS Safari)
- ✅ Android (Chrome)
- ✅ Tablet (iPad or Android tablet)
- ✅ Desktop (Chrome, Firefox, Safari)

### Mobile Component Tests

#### Test 1: Responsive Tables → Cards
1. Open `/ventes` on mobile
2. Verify DevisTable switches to card layout
3. Verify all data visible in cards
4. Test tap interactions
5. Verify dropdown menus work
6. Test "Convert to BC" button

#### Test 2: Mobile Navigation
1. Verify bottom navigation bar appears (< 768px)
2. Test all 4 main nav items
3. Test "More" menu
4. Verify active state highlights
5. Test hamburger sidebar (if implemented)

#### Test 3: Touch Targets
1. Verify all buttons are minimum 48px height
2. Test form inputs (should be 48px)
3. Verify comfortable spacing between elements
4. Test dropdown menus on touch devices

#### Test 4: Safe Area Support (iOS)
1. Test on iPhone with notch
2. Verify content doesn't overlap notch
3. Verify bottom nav respects home indicator
4. Check landscape orientation

#### Test 5: Mobile Forms
1. Test quote creation form
2. Verify inputs are large enough
3. Test date pickers on mobile
4. Verify keyboard doesn't overlap inputs
5. Test form submission

#### Test 6: Horizontal Scroll
1. Test stats widgets on dashboard
2. Verify smooth horizontal scrolling
3. Verify no vertical scroll triggered
4. Test on touch devices

#### Test 7: Bottom Sheets
1. Test opening bottom sheet (if used)
2. Verify drag handle works
3. Test backdrop dismiss
4. Verify content scrolls inside sheet

#### Test 8: Loading States
1. Test skeleton loaders on mobile
2. Verify spinners are visible
3. Test pull-to-refresh (if implemented)

---

## 4. Cross-Browser Testing

### Desktop Browsers
- ✅ Chrome (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Edge (latest)

### Mobile Browsers
- ✅ iOS Safari
- ✅ Chrome Mobile (Android)
- ✅ Samsung Internet

### Test Checklist
- [ ] CSS renders correctly
- [ ] Animations work smoothly
- [ ] No console errors
- [ ] Forms submit properly
- [ ] Navigation works
- [ ] Role permissions enforced

---

## 5. Performance Testing

### Metrics to Check

1. **Lighthouse Score (Mobile)**
   - Performance: > 80
   - Accessibility: > 90
   - Best Practices: > 90
   - SEO: > 80

2. **Load Times**
   - First Contentful Paint: < 2s
   - Time to Interactive: < 3s
   - Largest Contentful Paint: < 2.5s

3. **Mobile Specific**
   - Touch response: < 100ms
   - Scroll smoothness: 60fps
   - Animation smoothness: 60fps

### Tools
- Chrome DevTools (Mobile emulation)
- Lighthouse
- WebPageTest
- Real device testing

---

## 6. Security Testing

### Permission Boundaries

1. **Test Unauthorized Access**
   - Attempt to access restricted routes
   - Verify redirects work
   - Check API calls are blocked

2. **Test RLS Policies**
   - Query Supabase directly
   - Verify users can only see their data
   - Test cross-role data access

3. **Test Critical Action Logging**
   - Perform sensitive operations
   - Verify logs are created
   - Check CEO notifications sent

---

## 7. Regression Testing

### Existing Features to Verify

- [ ] Login/Logout still works
- [ ] Dashboard loads correctly
- [ ] Devis creation works
- [ ] BC creation works
- [ ] Production tracking works
- [ ] Stock management works
- [ ] Reports generate correctly
- [ ] PDF exports work
- [ ] Email sending works

---

## 8. Known Issues & Limitations

### Current Limitations

1. **Migration Not Auto-Applied**
   - Supabase migration must be manually applied
   - User profiles must be manually created

2. **Responsive Components Not Yet Integrated**
   - DevisTableResponsive created but not yet used in Ventes.tsx
   - BcTableResponsive created but not yet used
   - MobileNavigation created but not yet integrated in MainLayout

3. **Legacy Role Compatibility**
   - Old role system still in database
   - New system runs parallel for now
   - Migration path needed

### Next Steps to Complete

1. **Integrate Responsive Components**
   - Replace DevisTable with DevisTableResponsive in Ventes.tsx
   - Replace BcTable with BcTableResponsive
   - Add MobileBottomNav to MainLayout

2. **Apply Database Migration**
   - Execute migration in Supabase
   - Create user profiles
   - Test role permissions

3. **User Acceptance Testing**
   - Get feedback from Max (CEO)
   - Test with Karim (Supervisor)
   - Validate with actual users

---

## 9. Deployment Checklist

### Pre-Deployment
- [ ] All tests passed
- [ ] No console errors
- [ ] Performance acceptable
- [ ] Security verified
- [ ] Documentation complete

### Deployment Steps
1. [ ] Apply Supabase migration
2. [ ] Create user profiles
3. [ ] Integrate responsive components
4. [ ] Test in staging
5. [ ] Deploy to production
6. [ ] Monitor for errors
7. [ ] Gather user feedback

### Post-Deployment
- [ ] Monitor error logs
- [ ] Check performance metrics
- [ ] Collect user feedback
- [ ] Plan Phase 5 improvements

---

## 10. Success Criteria

### Must Have
✅ User roles system functional  
✅ Mobile UI renders correctly  
✅ All critical features work  
✅ No security vulnerabilities  
✅ Performance acceptable  

### Nice to Have
⭐ Smooth animations  
⭐ Offline support  
⭐ Push notifications  
⭐ Advanced mobile gestures  
⭐ PWA installation  

---

## Contact & Support

**Implementation Lead:** Manus AI  
**Project Owner:** Max Talmi (max.talmi@gmail.com)  
**Deployment Date:** January 29, 2026  

**For issues or questions:**
- Check GitHub commits: 0d27bd4, 0f53123
- Review IMPLEMENTATION_LOG.md
- Contact Max Talmi

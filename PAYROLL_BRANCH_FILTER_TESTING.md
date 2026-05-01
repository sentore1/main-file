# Payroll Branch Filter - Testing Checklist

## Pre-Testing Setup

### 1. Verify Data Exists
- [ ] At least 2 branches exist in the system
- [ ] Employees are assigned to different branches
- [ ] At least one payroll has been generated
- [ ] Payroll has entries for employees from multiple branches

### 2. Check Permissions
- [ ] User has 'view-payrolls' permission
- [ ] User can access payroll details page

## Functional Testing

### Test 1: Branch Filter Display
**Steps:**
1. Navigate to HRM → Payrolls
2. Click "View" on any completed payroll
3. Scroll to "Employee Salary Details" section

**Expected Results:**
- [ ] Filter icon (🔍) is visible
- [ ] Branch dropdown is displayed
- [ ] Dropdown shows "All Branches" by default
- [ ] Dropdown lists all available branches

**Status:** ⬜ Pass / ⬜ Fail

---

### Test 2: Filter by Specific Branch
**Steps:**
1. On payroll details page
2. Click the branch dropdown
3. Select a specific branch (e.g., "Kigali Branch")

**Expected Results:**
- [ ] Page reloads with ?branch_id=X in URL
- [ ] Only employees from selected branch are shown
- [ ] Employee count updates correctly
- [ ] Dropdown shows selected branch name

**Status:** ⬜ Pass / ⬜ Fail

---

### Test 3: Reset Filter (All Branches)
**Steps:**
1. With a branch filter active
2. Click the branch dropdown
3. Select "All Branches"

**Expected Results:**
- [ ] URL changes to remove ?branch_id parameter
- [ ] All employees are shown again
- [ ] Employee count returns to total
- [ ] Dropdown shows "All Branches"

**Status:** ⬜ Pass / ⬜ Fail

---

### Test 4: Switch Between Branches
**Steps:**
1. Select "Kigali Branch"
2. Note the employees shown
3. Select "Kirehe Branch"
4. Note the employees shown

**Expected Results:**
- [ ] Different employees are shown for each branch
- [ ] No overlap in employee lists
- [ ] Counts are different for each branch
- [ ] URL updates with correct branch_id

**Status:** ⬜ Pass / ⬜ Fail

---

### Test 5: Excel Export with Filter
**Steps:**
1. Select a specific branch (e.g., "Kigali Branch")
2. Click "Export Excel" button
3. Open the downloaded Excel file

**Expected Results:**
- [ ] Excel file downloads successfully
- [ ] File contains only employees from selected branch
- [ ] Employee count matches filtered view
- [ ] All columns are populated correctly

**Status:** ⬜ Pass / ⬜ Fail

---

### Test 6: Excel Export without Filter
**Steps:**
1. Select "All Branches"
2. Click "Export Excel" button
3. Open the downloaded Excel file

**Expected Results:**
- [ ] Excel file downloads successfully
- [ ] File contains all employees
- [ ] Employee count matches total count
- [ ] All columns are populated correctly

**Status:** ⬜ Pass / ⬜ Fail

---

### Test 7: PDF Export with Filter
**Steps:**
1. Select a specific branch (e.g., "Kirehe Branch")
2. Click "Export PDF" button
3. Check the PDF that opens in new tab

**Expected Results:**
- [ ] PDF opens in new tab
- [ ] PDF contains only employees from selected branch
- [ ] Employee count matches filtered view
- [ ] Layout is correct and readable

**Status:** ⬜ Pass / ⬜ Fail

---

### Test 8: PDF Export without Filter
**Steps:**
1. Select "All Branches"
2. Click "Export PDF" button
3. Check the PDF that opens in new tab

**Expected Results:**
- [ ] PDF opens in new tab
- [ ] PDF contains all employees
- [ ] Employee count matches total count
- [ ] Layout is correct and readable

**Status:** ⬜ Pass / ⬜ Fail

---

### Test 9: URL Direct Access
**Steps:**
1. Copy URL with branch filter (e.g., /hrm/payrolls/5?branch_id=2)
2. Open in new browser tab
3. Check the page

**Expected Results:**
- [ ] Page loads with filter applied
- [ ] Correct branch is selected in dropdown
- [ ] Only filtered employees are shown
- [ ] URL parameter is preserved

**Status:** ⬜ Pass / ⬜ Fail

---

### Test 10: Browser Back/Forward
**Steps:**
1. Start with "All Branches"
2. Select "Kigali Branch"
3. Select "Kirehe Branch"
4. Click browser back button twice
5. Click browser forward button once

**Expected Results:**
- [ ] Back button restores previous filter state
- [ ] Forward button moves to next filter state
- [ ] Dropdown updates correctly
- [ ] Employee list updates correctly

**Status:** ⬜ Pass / ⬜ Fail

---

## Edge Case Testing

### Test 11: No Branches Exist
**Steps:**
1. Delete all branches (or test on fresh system)
2. Navigate to payroll details

**Expected Results:**
- [ ] Filter dropdown is not displayed
- [ ] All employees are shown
- [ ] No errors occur
- [ ] Exports work normally

**Status:** ⬜ Pass / ⬜ Fail

---

### Test 12: Employees with No Branch
**Steps:**
1. Create employees without branch assignment
2. Generate payroll
3. View payroll details
4. Select a specific branch

**Expected Results:**
- [ ] Employees without branch are not shown when filter is active
- [ ] Employees without branch are shown when "All Branches" is selected
- [ ] No errors occur

**Status:** ⬜ Pass / ⬜ Fail

---

### Test 13: Branch with No Employees
**Steps:**
1. Create a branch with no employees
2. View payroll details
3. Select the empty branch

**Expected Results:**
- [ ] Empty state message is shown
- [ ] No errors occur
- [ ] Can switch to other branches
- [ ] Export buttons still work (empty file)

**Status:** ⬜ Pass / ⬜ Fail

---

### Test 14: Invalid Branch ID in URL
**Steps:**
1. Manually edit URL to include invalid branch_id (e.g., ?branch_id=999)
2. Press Enter

**Expected Results:**
- [ ] Page loads without errors
- [ ] Shows all employees (ignores invalid ID)
- [ ] Dropdown shows "All Branches"

**Status:** ⬜ Pass / ⬜ Fail

---

### Test 15: Large Dataset Performance
**Steps:**
1. Test with payroll containing 100+ employees
2. Apply branch filter
3. Switch between branches multiple times

**Expected Results:**
- [ ] Filter applies quickly (< 2 seconds)
- [ ] No lag when switching branches
- [ ] Page remains responsive
- [ ] Exports complete successfully

**Status:** ⬜ Pass / ⬜ Fail

---

## UI/UX Testing

### Test 16: Mobile Responsiveness
**Steps:**
1. Open payroll details on mobile device
2. Try to use branch filter

**Expected Results:**
- [ ] Filter dropdown is accessible
- [ ] Dropdown is easy to tap
- [ ] Selected branch is clearly visible
- [ ] Table scrolls horizontally if needed

**Status:** ⬜ Pass / ⬜ Fail

---

### Test 17: Visual Consistency
**Steps:**
1. Compare filter dropdown with other dropdowns in the system
2. Check alignment and spacing

**Expected Results:**
- [ ] Filter matches system design
- [ ] Proper spacing around filter
- [ ] Icon is aligned correctly
- [ ] Colors match theme

**Status:** ⬜ Pass / ⬜ Fail

---

### Test 18: Loading States
**Steps:**
1. Apply branch filter
2. Observe page behavior during reload

**Expected Results:**
- [ ] Loading indicator appears (if applicable)
- [ ] No flash of unfiltered content
- [ ] Smooth transition
- [ ] No layout shift

**Status:** ⬜ Pass / ⬜ Fail

---

## Integration Testing

### Test 19: Payroll Actions with Filter
**Steps:**
1. Apply branch filter
2. Try to pay salary for an employee
3. Try to delete a payslip
4. Try to view payslip

**Expected Results:**
- [ ] All actions work normally
- [ ] Filter remains active after actions
- [ ] Success messages appear
- [ ] Page doesn't lose filter state

**Status:** ⬜ Pass / ⬜ Fail

---

### Test 20: Multiple Users
**Steps:**
1. User A applies branch filter
2. User B views same payroll (different session)
3. Check if User B sees filter

**Expected Results:**
- [ ] User B sees default "All Branches"
- [ ] Filters are session-independent
- [ ] No cross-user interference

**Status:** ⬜ Pass / ⬜ Fail

---

## Security Testing

### Test 21: Permission Check
**Steps:**
1. Login as user without 'view-payrolls' permission
2. Try to access payroll details URL

**Expected Results:**
- [ ] Access denied message
- [ ] Redirected appropriately
- [ ] No data leakage

**Status:** ⬜ Pass / ⬜ Fail

---

### Test 22: Branch Access Control
**Steps:**
1. Try to access branch_id that user shouldn't see
2. Check if data is filtered correctly

**Expected Results:**
- [ ] Only authorized branches are shown
- [ ] No unauthorized data access
- [ ] Proper error handling

**Status:** ⬜ Pass / ⬜ Fail

---

## Test Summary

**Total Tests:** 22
**Passed:** ___
**Failed:** ___
**Skipped:** ___

**Overall Status:** ⬜ Pass / ⬜ Fail

---

## Issues Found

| Test # | Issue Description | Severity | Status |
|--------|------------------|----------|--------|
|        |                  |          |        |
|        |                  |          |        |
|        |                  |          |        |

---

## Notes

- Test Date: _______________
- Tester Name: _______________
- Environment: _______________
- Browser: _______________
- Additional Comments:

---

## Quick Test Commands

### Check if branches exist:
```sql
SELECT * FROM branches;
```

### Check employees with branches:
```sql
SELECT e.*, b.branch_name 
FROM employees e 
LEFT JOIN branches b ON e.branch_id = b.id;
```

### Check payroll entries:
```sql
SELECT pe.*, e.branch_id, b.branch_name
FROM payroll_entries pe
JOIN employees e ON pe.employee_id = e.user_id
LEFT JOIN branches b ON e.branch_id = b.id
WHERE pe.payroll_id = 5;
```

### Test URL patterns:
- All branches: `/hrm/payrolls/5`
- Specific branch: `/hrm/payrolls/5?branch_id=2`
- Invalid branch: `/hrm/payrolls/5?branch_id=999`

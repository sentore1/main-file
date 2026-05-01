# Payroll Branch Filter Implementation

## Overview
Added branch filtering functionality to the Payroll Details page, allowing admins to filter employee salary details by branch. The filter also applies to Excel and PDF exports.

## Changes Made

### 1. PayrollController.php
**File:** `packages/workdo/Hrm/src/Http/Controllers/PayrollController.php`

#### Changes:
- **Added Branch import** to use the Branch model
- **Updated `show()` method:**
  - Fetches all branches for the filter dropdown
  - Filters payroll entries by branch when `branch_id` is provided in the request
  - Loads employee branch relationship for display
  - Passes branches data to the view

- **Updated `exportPayroll()` method:**
  - Applies branch filter when loading payroll entries for PDF export
  - Filters based on `branch_id` query parameter

- **Updated `exportExcel()` method:**
  - Applies branch filter when loading payroll entries for Excel export
  - Filters based on `branch_id` query parameter

### 2. Show.tsx
**File:** `packages/workdo/Hrm/src/Resources/js/Pages/Payrolls/Show.tsx`

#### Changes:
- **Added imports:**
  - `useEffect` from React
  - `Filter` icon from lucide-react
  - `Select` components for the filter dropdown

- **Updated ShowProps interface:**
  - Added `branches` array to props

- **Added state management:**
  - `selectedBranch` state to track the selected branch filter
  - `useEffect` to read branch_id from URL on component mount

- **Added `handleBranchFilter()` function:**
  - Updates the selected branch state
  - Navigates to the same page with branch_id query parameter
  - Preserves state and scroll position

- **Updated Export buttons:**
  - Excel export button now includes branch_id in the URL
  - PDF export button now includes branch_id in the URL

- **Added Branch Filter UI:**
  - Filter dropdown in the Employee Salary Details card header
  - Shows "All Branches" option by default
  - Lists all available branches
  - Only displays if branches exist

### 3. Export.tsx
**File:** `packages/workdo/Hrm/src/Resources/js/Pages/Payrolls/Export.tsx`

#### No changes needed:
- The component automatically uses the filtered data from the controller
- The branch filter is applied server-side before rendering

## How It Works

### Filtering Flow:
1. **User selects a branch** from the dropdown on the Payroll Details page
2. **Page reloads** with `?branch_id=X` query parameter
3. **Controller filters** payroll entries to only show employees from that branch
4. **Table updates** to display only filtered employees
5. **Export buttons** include the branch_id parameter
6. **Exports generate** with only the filtered branch data

### Key Features:
- ✅ **No database changes required** - uses existing relationships
- ✅ **Real-time filtering** - instant results when selecting a branch
- ✅ **Export support** - both Excel and PDF exports respect the filter
- ✅ **All Branches option** - can view all employees by selecting "All Branches"
- ✅ **URL-based filtering** - filter state is preserved in the URL
- ✅ **Backward compatible** - works with existing payroll data

## Usage

### For Admins:
1. Navigate to a payroll details page (HRM > Payrolls > View Payroll)
2. In the "Employee Salary Details" section, locate the branch filter dropdown
3. Select a specific branch to filter employees, or select "All Branches" to view all
4. The table will update to show only employees from the selected branch
5. Click "Export Excel" or "Export PDF" to export the filtered data

### Filter Behavior:
- **Default:** Shows all employees (no filter applied)
- **Branch Selected:** Shows only employees from that branch
- **All Branches:** Resets filter to show all employees
- **Exports:** Always respect the current filter selection

## Technical Details

### Query Parameter:
- **Parameter name:** `branch_id`
- **Type:** Integer (branch ID) or empty string (all branches)
- **Example:** `/hrm/payrolls/5?branch_id=3`

### Database Queries:
The filter uses Laravel's `whereHas` to filter payroll entries:
```php
->when(request('branch_id'), function($q) {
    $q->whereHas('employee', function($eq) {
        $eq->where('branch_id', request('branch_id'));
    });
})
```

### Relationships Used:
- `PayrollEntry` → `Employee` (via employee_id)
- `Employee` → `Branch` (via branch_id)

## Testing Checklist

- [ ] Branch filter dropdown appears on payroll details page
- [ ] Selecting a branch filters the employee list
- [ ] Selecting "All Branches" shows all employees
- [ ] Excel export includes only filtered employees
- [ ] PDF export includes only filtered employees
- [ ] Filter state persists when navigating back to the page
- [ ] Works with payrolls that have employees from multiple branches
- [ ] Works with payrolls that have employees with no branch assigned

## Future Enhancements (Optional)

1. **Add branch column** to the employee salary details table
2. **Show branch name** in the payroll summary cards
3. **Add branch filter** to the payroll index page
4. **Store branch preference** in user session
5. **Add branch-based permissions** for viewing payrolls

## Notes

- The filter is applied server-side for better performance
- No changes to the database schema are required
- The implementation is minimal and focused on the requirement
- All existing functionality remains unchanged
- The filter is optional - users can still view all employees

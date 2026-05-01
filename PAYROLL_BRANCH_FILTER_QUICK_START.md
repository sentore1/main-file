# Payroll Branch Filter - Quick Start Guide

## 🎯 What's New?

You can now filter employee payroll details by branch on the Payroll Details page. This makes it easier to:
- View payroll for specific branches
- Export branch-specific payroll reports
- Review and verify branch payroll data

## 🚀 Quick Start

### Step 1: Navigate to Payroll Details
1. Go to **HRM** → **Payrolls**
2. Click the **View** (👁️) button on any payroll

### Step 2: Use the Branch Filter
1. Look for the **Employee Salary Details** section
2. Find the filter dropdown in the top-right corner (next to 🔍 icon)
3. Click the dropdown to see available branches

### Step 3: Select a Branch
- Choose **"All Branches"** to see all employees (default)
- Choose a specific branch (e.g., **"Kigali Branch"**) to filter

### Step 4: Export Filtered Data
- Click **"Export Excel"** to download Excel file with filtered data
- Click **"Export PDF"** to open PDF with filtered data

## 📊 Example Scenario

### Scenario: Generate Kigali Branch Payroll Report

**Before:**
- Payroll shows 138 employees from all branches
- Hard to find Kigali employees
- Export includes everyone

**After:**
1. Open payroll details page
2. Select **"Kigali Branch"** from filter
3. Now shows only 45 Kigali employees
4. Click **"Export Excel"**
5. Excel file contains only Kigali employees ✅

## 🎨 Visual Reference

```
┌────────────────────────────────────────────────────────┐
│ Employee Salary Details        [🔍] [Kigali Branch ▼] │
│ Detailed breakdown of employee salaries and deductions │
└────────────────────────────────────────────────────────┘
```

## 💡 Tips & Tricks

### Tip 1: Quick Branch Switching
You can quickly switch between branches without losing your place on the page. The filter preserves your scroll position.

### Tip 2: Shareable Links
The filter creates a unique URL that you can share:
- `https://your-site.com/hrm/payrolls/5?branch_id=2`
- Anyone with access can see the same filtered view

### Tip 3: Export Multiple Branches
To export payroll for multiple branches:
1. Select first branch → Export Excel
2. Select second branch → Export Excel
3. Repeat for each branch
4. You'll have separate files for each branch

### Tip 4: Verify Totals
When filtering by branch, the employee count in the table updates to show only filtered employees. Use this to verify your exports.

## 📋 Common Tasks

### Task 1: Review Branch Payroll
**Goal:** Check if all Kirehe branch employees are paid correctly

**Steps:**
1. Open payroll details
2. Select "Kirehe Branch"
3. Review each employee's net pay
4. Check for any unpaid employees

### Task 2: Export Branch Reports
**Goal:** Create separate Excel files for each branch

**Steps:**
1. Select "Kigali Branch" → Export Excel
2. Select "Kirehe Branch" → Export Excel
3. Select "Ngoma Branch" → Export Excel
4. Select "Rwamagana Branch" → Export Excel

### Task 3: Compare Branch Payrolls
**Goal:** Compare total payroll costs between branches

**Steps:**
1. Select "Kigali Branch" → Note total net pay
2. Select "Kirehe Branch" → Note total net pay
3. Select "Ngoma Branch" → Note total net pay
4. Compare the totals

### Task 4: Verify Employee Assignment
**Goal:** Check which employees belong to which branch

**Steps:**
1. Select "All Branches" → Note total count (e.g., 138)
2. Select "Kigali Branch" → Note count (e.g., 45)
3. Select "Kirehe Branch" → Note count (e.g., 32)
4. Verify counts add up correctly

## ❓ FAQ

### Q: Does the filter affect the payroll generation?
**A:** No, the filter only affects the view and exports. Payroll is still generated for all employees.

### Q: Can I filter by multiple branches at once?
**A:** No, you can only select one branch at a time, or "All Branches" to see everyone.

### Q: What happens to employees without a branch?
**A:** They appear when "All Branches" is selected, but not when a specific branch is selected.

### Q: Does the filter affect the summary cards (Employees, Gross Pay, etc.)?
**A:** No, the summary cards always show totals for all employees. Only the employee table is filtered.

### Q: Can I save my filter preference?
**A:** The filter is saved in the URL, so you can bookmark the filtered view. However, it doesn't persist across different payrolls.

### Q: Will the filter work on mobile devices?
**A:** Yes, the filter is fully responsive and works on all devices.

## 🔧 Troubleshooting

### Issue: Filter dropdown is not showing
**Solution:** 
- Check if any branches exist in the system
- Verify you have permission to view payrolls
- Refresh the page

### Issue: Filter shows wrong employees
**Solution:**
- Verify employees are assigned to correct branches
- Check if branch_id in URL is correct
- Clear browser cache and try again

### Issue: Export includes wrong employees
**Solution:**
- Make sure the correct branch is selected before exporting
- Check the URL includes the correct branch_id parameter
- Try exporting again

### Issue: "All Branches" shows fewer employees than expected
**Solution:**
- Some employees might not have payroll entries
- Check if payroll was generated for all employees
- Verify employee data in the system

## 📞 Support

If you encounter any issues or have questions:
1. Check this guide first
2. Review the testing checklist
3. Contact your system administrator
4. Report bugs to the development team

## 🎓 Training Resources

- **Implementation Guide:** `PAYROLL_BRANCH_FILTER_IMPLEMENTATION.md`
- **Visual Guide:** `PAYROLL_BRANCH_FILTER_VISUAL_GUIDE.md`
- **Testing Checklist:** `PAYROLL_BRANCH_FILTER_TESTING.md`

## 📝 Changelog

### Version 1.0 (Current)
- ✅ Branch filter on payroll details page
- ✅ Excel export with branch filter
- ✅ PDF export with branch filter
- ✅ URL-based filter state
- ✅ "All Branches" option

### Future Enhancements (Planned)
- 🔄 Branch column in employee table
- 🔄 Branch filter on payroll index page
- 🔄 Save filter preference per user
- 🔄 Multi-branch selection
- 🔄 Branch-based permissions

---

**Last Updated:** January 2025
**Version:** 1.0
**Status:** Active

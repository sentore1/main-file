# Payroll Branch Filter - Visual Guide

## Before vs After

### BEFORE (No Filter)
```
┌─────────────────────────────────────────────────────────────────┐
│ Employee Salary Details                                         │
│ Detailed breakdown of employee salaries and deductions          │
└─────────────────────────────────────────────────────────────────┘
│ Employee          │ Basic Salary │ Allowances │ ... │ Net Pay  │
├───────────────────┼──────────────┼────────────┼─────┼──────────┤
│ John (Branch A)   │ 350,000 Fr   │ 50,000 Fr  │ ... │ 289,495  │
│ Jane (Branch B)   │ 150,000 Fr   │ 50,000 Fr  │ ... │ 162,732  │
│ Bob (Branch A)    │ 200,000 Fr   │ 50,000 Fr  │ ... │ 194,423  │
│ Alice (Branch C)  │ 180,000 Fr   │ 50,000 Fr  │ ... │ 175,890  │
└───────────────────┴──────────────┴────────────┴─────┴──────────┘
Shows ALL 138 employees from ALL branches
```

### AFTER (With Filter)
```
┌─────────────────────────────────────────────────────────────────┐
│ Employee Salary Details                    [🔍] [Branch A ▼]   │
│ Detailed breakdown of employee salaries and deductions          │
└─────────────────────────────────────────────────────────────────┘
│ Employee          │ Basic Salary │ Allowances │ ... │ Net Pay  │
├───────────────────┼──────────────┼────────────┼─────┼──────────┤
│ John (Branch A)   │ 350,000 Fr   │ 50,000 Fr  │ ... │ 289,495  │
│ Bob (Branch A)    │ 200,000 Fr   │ 50,000 Fr  │ ... │ 194,423  │
└───────────────────┴──────────────┴────────────┴─────┴──────────┘
Shows ONLY employees from Branch A
```

## UI Components

### Branch Filter Dropdown
```
┌──────────────────────────────┐
│ [🔍] [All Branches      ▼]  │
└──────────────────────────────┘
         ↓ (when clicked)
┌──────────────────────────────┐
│ All Branches            ✓    │
│ Kigali Branch                │
│ Kirehe Branch                │
│ Ngoma Branch                 │
│ Rwamagana Branch             │
└──────────────────────────────┘
```

### Export Buttons (Updated)
```
BEFORE:
[Export Excel] [Export PDF]
         ↓
/hrm/payrolls/5/export-excel
/hrm/payrolls/5/export

AFTER (with filter):
[Export Excel] [Export PDF]
         ↓
/hrm/payrolls/5/export-excel?branch_id=2
/hrm/payrolls/5/export?branch_id=2
```

## User Flow

### Step 1: View Payroll Details
```
User navigates to: HRM → Payrolls → [View Payroll]
URL: /hrm/payrolls/5
Shows: All 138 employees
```

### Step 2: Select Branch Filter
```
User clicks: Branch dropdown
User selects: "Kigali Branch"
URL changes to: /hrm/payrolls/5?branch_id=2
Shows: Only 45 employees from Kigali Branch
```

### Step 3: Export Filtered Data
```
User clicks: [Export Excel]
Downloads: PAYROLL_FEBRUARY_PAYROLL_2026_02_01.xlsx
Contains: Only 45 employees from Kigali Branch
```

### Step 4: Reset Filter
```
User selects: "All Branches"
URL changes to: /hrm/payrolls/5
Shows: All 138 employees again
```

## Layout Structure

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Payroll Details                             │
├─────────────────────────────────────────────────────────────────────┤
│  📊 february payroll                    [Export Excel] [Export PDF] │
│  2026-02-01 - 2026-02-28                              [Completed]   │
├─────────────────────────────────────────────────────────────────────┤
│  👥 Employees    💰 Gross Pay    💸 Deductions    💵 Net Pay       │
│     138          12,455,000 Fr   1,701,734 Fr     10,753,266 Fr    │
├─────────────────────────────────────────────────────────────────────┤
│  👥 Employee Salary Details              [🔍] [All Branches ▼]     │
│  Detailed breakdown of employee salaries and deductions             │
├─────────────────────────────────────────────────────────────────────┤
│  Employee    │ Basic Salary │ Allowances │ Deductions │ Net Pay    │
│  ───────────────────────────────────────────────────────────────────│
│  JOHN DOE    │ 350,000 Fr   │ 50,000 Fr  │ 110,505 Fr │ 289,495 Fr │
│  JANE SMITH  │ 150,000 Fr   │ 50,000 Fr  │  37,268 Fr │ 162,732 Fr │
│  ...         │ ...          │ ...        │ ...        │ ...        │
└─────────────────────────────────────────────────────────────────────┘
```

## Filter States

### State 1: No Filter (Default)
- **URL:** `/hrm/payrolls/5`
- **Dropdown:** "All Branches"
- **Display:** All employees (138)
- **Export:** All employees

### State 2: Branch Selected
- **URL:** `/hrm/payrolls/5?branch_id=2`
- **Dropdown:** "Kigali Branch"
- **Display:** Kigali employees only (45)
- **Export:** Kigali employees only

### State 3: Different Branch
- **URL:** `/hrm/payrolls/5?branch_id=3`
- **Dropdown:** "Kirehe Branch"
- **Display:** Kirehe employees only (32)
- **Export:** Kirehe employees only

## Excel Export Example

### Without Filter
```
PAYROLL STAFF EAST GATE HOTEL FEBRUARY 2026
─────────────────────────────────────────────────────────────
No | NAMES          | Post      | Basic Salary | ... | NET SALARY
─────────────────────────────────────────────────────────────
1  | JOHN DOE       | Manager   | 350,000 Fr   | ... | 289,495 Fr
2  | JANE SMITH     | Staff     | 150,000 Fr   | ... | 162,732 Fr
3  | BOB JOHNSON    | Staff     | 200,000 Fr   | ... | 194,423 Fr
...
138| ALICE WILLIAMS | Staff     | 180,000 Fr   | ... | 175,890 Fr
─────────────────────────────────────────────────────────────
Total: 138 employees
```

### With Branch Filter (Kigali)
```
PAYROLL STAFF EAST GATE HOTEL FEBRUARY 2026
─────────────────────────────────────────────────────────────
No | NAMES          | Post      | Basic Salary | ... | NET SALARY
─────────────────────────────────────────────────────────────
1  | JOHN DOE       | Manager   | 350,000 Fr   | ... | 289,495 Fr
2  | BOB JOHNSON    | Staff     | 200,000 Fr   | ... | 194,423 Fr
...
45 | MARY BROWN     | Staff     | 180,000 Fr   | ... | 175,890 Fr
─────────────────────────────────────────────────────────────
Total: 45 employees (Kigali Branch only)
```

## Benefits

✅ **Easy Filtering:** One-click branch selection
✅ **Clear Display:** Only shows relevant employees
✅ **Export Support:** Filtered data in Excel/PDF
✅ **No Data Loss:** Can always view all employees
✅ **URL-Based:** Shareable filtered views
✅ **Fast Performance:** Server-side filtering

## Common Use Cases

### Use Case 1: Branch Manager Review
**Scenario:** Kigali branch manager wants to review only their branch payroll
**Action:** Select "Kigali Branch" from filter
**Result:** See only Kigali employees, export for records

### Use Case 2: Accounting Department
**Scenario:** Need separate payroll reports per branch
**Action:** Filter by each branch, export separately
**Result:** Individual Excel files per branch

### Use Case 3: Payroll Verification
**Scenario:** HR wants to verify specific branch calculations
**Action:** Filter by branch, review details
**Result:** Focused view for easier verification

### Use Case 4: Management Reports
**Scenario:** CEO wants to see total company payroll
**Action:** Select "All Branches"
**Result:** Complete overview of all employees

# Payroll Branch Filter - Flow Diagram

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER INTERFACE                          │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  Payroll Details Page (Show.tsx)                          │ │
│  │                                                           │ │
│  │  ┌─────────────────────────────────────────────────┐    │ │
│  │  │  Branch Filter Dropdown                         │    │ │
│  │  │  [🔍] [All Branches ▼]                         │    │ │
│  │  └─────────────────────────────────────────────────┘    │ │
│  │                                                           │ │
│  │  ┌─────────────────────────────────────────────────┐    │ │
│  │  │  Employee Salary Details Table                  │    │ │
│  │  │  - Filtered by selected branch                  │    │ │
│  │  │  - Shows only relevant employees                │    │ │
│  │  └─────────────────────────────────────────────────┘    │ │
│  │                                                           │ │
│  │  [Export Excel]  [Export PDF]                            │ │
│  └───────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              ↓
                    HTTP Request with branch_id
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                      BACKEND CONTROLLER                         │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  PayrollController.php                                    │ │
│  │                                                           │ │
│  │  show($payroll) {                                        │ │
│  │    1. Get all branches                                   │ │
│  │    2. Load payroll entries                               │ │
│  │    3. Filter by branch_id if provided                    │ │
│  │    4. Return to view                                     │ │
│  │  }                                                        │ │
│  │                                                           │ │
│  │  exportExcel($payroll) {                                 │ │
│  │    1. Load payroll entries                               │ │
│  │    2. Filter by branch_id if provided                    │ │
│  │    3. Generate Excel file                                │ │
│  │    4. Download                                           │ │
│  │  }                                                        │ │
│  └───────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              ↓
                      Database Queries
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                         DATABASE                                │
│                                                                 │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐    │
│  │   Payrolls   │    │   Branches   │    │  Employees   │    │
│  ├──────────────┤    ├──────────────┤    ├──────────────┤    │
│  │ id           │    │ id           │    │ id           │    │
│  │ title        │    │ branch_name  │    │ user_id      │    │
│  │ ...          │    │ ...          │    │ branch_id ───┼────┤
│  └──────────────┘    └──────────────┘    └──────────────┘    │
│         │                                         │            │
│         │                                         │            │
│  ┌──────▼─────────────────────────────────────────▼─────┐    │
│  │              Payroll Entries                         │    │
│  ├──────────────────────────────────────────────────────┤    │
│  │ id                                                   │    │
│  │ payroll_id                                           │    │
│  │ employee_id (references employees.user_id)           │    │
│  │ basic_salary                                         │    │
│  │ net_pay                                              │    │
│  │ ...                                                  │    │
│  └──────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

## User Flow Diagram

```
START
  │
  ├─→ User navigates to Payroll Details
  │
  ├─→ Page loads with "All Branches" selected
  │   └─→ Shows all 138 employees
  │
  ├─→ User clicks Branch dropdown
  │   └─→ Dropdown shows:
  │       - All Branches
  │       - Kigali Branch
  │       - Kirehe Branch
  │       - Ngoma Branch
  │       - Rwamagana Branch
  │
  ├─→ User selects "Kigali Branch"
  │   │
  │   ├─→ URL updates: /hrm/payrolls/5?branch_id=2
  │   │
  │   ├─→ Page reloads with filter
  │   │
  │   └─→ Shows only 45 Kigali employees
  │
  ├─→ User clicks "Export Excel"
  │   │
  │   ├─→ Request: /hrm/payrolls/5/export-excel?branch_id=2
  │   │
  │   ├─→ Controller filters entries by branch
  │   │
  │   └─→ Excel file downloads with 45 employees
  │
  ├─→ User selects "All Branches"
  │   │
  │   ├─→ URL updates: /hrm/payrolls/5
  │   │
  │   └─→ Shows all 138 employees again
  │
END
```

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    1. USER ACTION                               │
│                                                                 │
│  User selects "Kigali Branch" from dropdown                    │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    2. FRONTEND HANDLER                          │
│                                                                 │
│  handleBranchFilter(branchId) {                                │
│    setSelectedBranch(branchId);                                │
│    router.get('/hrm/payrolls/5', { branch_id: branchId });    │
│  }                                                              │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    3. HTTP REQUEST                              │
│                                                                 │
│  GET /hrm/payrolls/5?branch_id=2                               │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    4. CONTROLLER                                │
│                                                                 │
│  show($payroll) {                                              │
│    // Get branches for dropdown                                │
│    $branches = Branch::where('created_by', creatorId())        │
│                     ->select('id', 'branch_name')              │
│                     ->get();                                   │
│                                                                 │
│    // Load payroll with filtered entries                       │
│    $payroll->load(['payrollEntries' => function($query) {      │
│      $query->with(['employee.user', 'employee.branch'])        │
│            ->when(request('branch_id'), function($q) {         │
│              $q->whereHas('employee', function($eq) {          │
│                $eq->where('branch_id', request('branch_id'));  │
│              });                                                │
│            });                                                  │
│    }]);                                                         │
│                                                                 │
│    return Inertia::render('Hrm/Payrolls/Show', [              │
│      'payroll' => $payroll,                                    │
│      'branches' => $branches                                   │
│    ]);                                                          │
│  }                                                              │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    5. DATABASE QUERY                            │
│                                                                 │
│  SELECT payroll_entries.*                                      │
│  FROM payroll_entries                                          │
│  INNER JOIN employees ON payroll_entries.employee_id =        │
│                          employees.user_id                     │
│  WHERE payroll_entries.payroll_id = 5                          │
│    AND employees.branch_id = 2                                 │
│    AND payroll_entries.created_by = 1                          │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    6. RESPONSE DATA                             │
│                                                                 │
│  {                                                              │
│    payroll: {                                                  │
│      id: 5,                                                    │
│      title: "february payroll",                                │
│      payrollEntries: [                                         │
│        { employee: { name: "John", branch: "Kigali" }, ... },  │
│        { employee: { name: "Bob", branch: "Kigali" }, ... },   │
│        // ... 45 employees from Kigali                         │
│      ]                                                          │
│    },                                                           │
│    branches: [                                                 │
│      { id: 1, branch_name: "Kigali Branch" },                 │
│      { id: 2, branch_name: "Kirehe Branch" },                 │
│      // ...                                                    │
│    ]                                                            │
│  }                                                              │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    7. FRONTEND RENDER                           │
│                                                                 │
│  - Dropdown shows "Kigali Branch" selected                     │
│  - Table shows 45 employees                                    │
│  - Export buttons include ?branch_id=2                         │
└─────────────────────────────────────────────────────────────────┘
```

## Export Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    EXCEL EXPORT FLOW                            │
└─────────────────────────────────────────────────────────────────┘

User clicks "Export Excel" with Kigali Branch selected
                    ↓
Frontend constructs URL: /hrm/payrolls/5/export-excel?branch_id=2
                    ↓
Browser navigates to URL (opens in same tab)
                    ↓
Controller receives request with branch_id=2
                    ↓
Load payroll entries filtered by branch_id=2
                    ↓
Generate Excel file with PhpSpreadsheet
  - Title: "PAYROLL STAFF EAST GATE HOTEL FEBRUARY 2026"
  - Headers: No, NAMES, Post, Basic salary, etc.
  - Data: Only 45 Kigali employees
  - Formatting: Green headers, yellow employer columns
                    ↓
Set headers for Excel download
  - Content-Type: application/vnd.openxmlformats...
  - Content-Disposition: attachment; filename="PAYROLL_..."
                    ↓
Stream Excel file to browser
                    ↓
Browser downloads file: PAYROLL_FEBRUARY_PAYROLL_2026_02_01.xlsx
                    ↓
User opens file and sees only Kigali employees ✅

┌─────────────────────────────────────────────────────────────────┐
│                    PDF EXPORT FLOW                              │
└─────────────────────────────────────────────────────────────────┘

User clicks "Export PDF" with Kirehe Branch selected
                    ↓
Frontend constructs URL: /hrm/payrolls/5/export?branch_id=3
                    ↓
Browser opens URL in new tab
                    ↓
Controller receives request with branch_id=3
                    ↓
Load payroll entries filtered by branch_id=3
                    ↓
Render Inertia page: Hrm/Payrolls/Export
  - Pass filtered payroll entries
                    ↓
Export.tsx component renders
  - Auto-triggers window.print()
  - Shows only 32 Kirehe employees
                    ↓
Browser print dialog opens
                    ↓
User saves as PDF or prints
                    ↓
PDF contains only Kirehe employees ✅
```

## State Management Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    COMPONENT STATE                              │
└─────────────────────────────────────────────────────────────────┘

Initial State:
  selectedBranch = ""
  URL = /hrm/payrolls/5
  Display = All employees

User selects "Kigali Branch":
  selectedBranch = "2"
  URL = /hrm/payrolls/5?branch_id=2
  Display = Kigali employees only

User clicks browser back:
  selectedBranch = ""
  URL = /hrm/payrolls/5
  Display = All employees

User clicks browser forward:
  selectedBranch = "2"
  URL = /hrm/payrolls/5?branch_id=2
  Display = Kigali employees only

User selects "All Branches":
  selectedBranch = ""
  URL = /hrm/payrolls/5
  Display = All employees
```

## Component Hierarchy

```
Show.tsx (Payroll Details Page)
│
├─ AuthenticatedLayout
│  ├─ Breadcrumbs
│  └─ Page Title
│
├─ Payroll Summary Card
│  ├─ Title & Dates
│  ├─ Export Buttons (with branch_id)
│  └─ Summary Stats (Employees, Gross Pay, etc.)
│
├─ Employee Salary Details Card
│  ├─ CardHeader
│  │  ├─ Title & Description
│  │  └─ Branch Filter Dropdown ← NEW
│  │     ├─ Filter Icon
│  │     └─ Select Component
│  │        ├─ "All Branches" option
│  │        └─ Branch options (from props)
│  │
│  └─ CardContent
│     └─ DataTable
│        ├─ Columns (Employee, Salary, etc.)
│        └─ Rows (Filtered by branch)
│
├─ PayslipModal
└─ ConfirmationDialog
```

## Integration Points

```
┌─────────────────────────────────────────────────────────────────┐
│                    INTEGRATION POINTS                           │
└─────────────────────────────────────────────────────────────────┘

1. Branch Model
   - Used to fetch available branches
   - Relationship: Employee → Branch

2. Employee Model
   - Has branch_id field
   - Relationship: PayrollEntry → Employee

3. PayrollEntry Model
   - Filtered by employee's branch_id
   - Relationship: Payroll → PayrollEntry

4. Inertia.js
   - Passes data from controller to React
   - Handles page navigation with state

5. React Router
   - Manages URL parameters
   - Preserves state during navigation

6. PhpSpreadsheet
   - Generates Excel files
   - Uses filtered data from controller
```

---

**Diagram Version:** 1.0
**Last Updated:** January 2025
**Status:** Complete

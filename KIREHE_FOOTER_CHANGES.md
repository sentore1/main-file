# Kirehe Branch Footer Layout - Updated

## ✅ Changes Applied

Updated footer layout for **Kirehe branch only** (Warehouse IDs: 1, 10, 11, 12, 13, 14) in:
1. ✅ Sales Invoice (`resources/js/pages/Sales/Print.tsx`)
2. ✅ Purchase Invoice (`resources/js/pages/Purchase/Print.tsx`)
3. ✅ Quotation (`packages/workdo/Quotation/src/Resources/js/Pages/Quotations/Print.tsx`)

---

## 🏢 KIREHE BRANCH FOOTER (4 Columns)

```
┌──────────────────────┬──────────────────────┬──────────────────────┬──────────────────────┐
│  Main Bank Kirehe    │  Contact Personnel   │  Business Details    │  Online & Social     │
│                      │                      │                      │  Media               │
├──────────────────────┼──────────────────────┼──────────────────────┼──────────────────────┤
│                      │                      │                      │                      │
│  I&M Bank:           │  Manager:            │  TIN: 108229033      │  Email:              │
│  20087996001         │  0787007015          │                      │  eastgatehotel       │
│                      │                      │                      │  kirehe@gmail.com    │
│  Other Banks         │  Accountant:         │                      │                      │
│                      │  0785654301          │                      │  Website:            │
│  BK Rwanda:          │                      │                      │  http://www.         │
│  100031094598        │                      │                      │  eastgatehotel.rw    │
│                      │                      │                      │                      │
│  BPR Rwanda:         │                      │                      │  YouTube:            │
│  4493647590          │                      │                      │  EAST GATE HOTEL     │
│                      │                      │                      │  RWANDA              │
│  Equity Bank:        │                      │                      │                      │
│  4035200050923       │                      │                      │                      │
│                      │                      │                      │                      │
└──────────────────────┴──────────────────────┴──────────────────────┴──────────────────────┘
```

### Column 1: Main Bank Kirehe
- **I&M Bank**: 20087996001 (highlighted as main bank)
- **Other Banks**:
  - BK Rwanda: 100031094598
  - BPR Rwanda: 4493647590
  - Equity Bank: 4035200050923

### Column 2: Contact Personnel
- Manager: 0787007015
- Accountant: 0785654301

### Column 3: Business Details
- TIN: 108229033

### Column 4: Online & Social Media (NEW)
- Email: eastgatehotelkirehe@gmail.com
- Website: http://www.eastgatehotel.rw
- YouTube: EAST GATE HOTEL RWANDA

---

## 🌍 OTHER BRANCHES FOOTER (3 Columns - Unchanged)

For Gatsibo, Ngoma, and Kigali branches, the footer remains in 3-column layout:

```
┌──────────────────────┬──────────────────────┬──────────────────────┐
│  Bank Accounts       │  Contact Personnel   │  Business Details    │
├──────────────────────┼──────────────────────┼──────────────────────┤
│                      │                      │                      │
│  BK Rwanda:          │  Manager:            │  TIN: 108229033      │
│  100031094598        │  0787007015          │                      │
│                      │                      │                      │
│  BPR Rwanda:         │  Accountant:         │                      │
│  4493647590          │  0785654301          │                      │
│                      │                      │                      │
│  I&M Bank:           │  Online & Social     │                      │
│  20087996001         │  Media:              │                      │
│                      │                      │                      │
│  Equity Bank:        │  Email: (branch      │                      │
│  4035200050923       │  specific)           │                      │
│                      │                      │                      │
│                      │  Website:            │                      │
│                      │  www.eastgatehotel   │                      │
│                      │  .rw                 │                      │
│                      │                      │                      │
│                      │  YouTube:            │                      │
│                      │  EAST GATE HOTEL     │                      │
│                      │  RWANDA              │                      │
│                      │                      │                      │
└──────────────────────┴──────────────────────┴──────────────────────┘
```

---

## 🔍 Key Differences

### Kirehe Branch (Warehouse IDs: 1, 10-14):
- ✅ **4 columns** layout
- ✅ I&M Bank highlighted as "Main Bank Kirehe"
- ✅ Other banks grouped under "Other Banks"
- ✅ Email, Website, YouTube in separate 4th column
- ✅ Website shows as `http://www.eastgatehotel.rw`

### Other Branches (Gatsibo, Ngoma, Kigali):
- ✅ **3 columns** layout (original)
- ✅ All banks listed equally under "Bank Accounts"
- ✅ Email, Website, YouTube in 2nd column under "Online & Social Media"
- ✅ Website shows as `www.eastgatehotel.rw`

---

## 💻 Code Implementation

The code checks the warehouse_id and applies different layouts:

```typescript
{/* Kirehe branches: 1, 10, 11, 12, 13, 14 */}
{[1, 10, 11, 12, 13, 14].includes(invoice.warehouse_id) ? (
    /* 4 column layout with Main Bank Kirehe */
    <div className="grid grid-cols-4 gap-4 text-xs">
        {/* Column 1: Main Bank Kirehe + Other Banks */}
        {/* Column 2: Contact Personnel */}
        {/* Column 3: Business Details */}
        {/* Column 4: Online & Social Media */}
    </div>
) : (
    /* 3 column layout for other branches */
    <div className="grid grid-cols-3 gap-6 text-xs">
        {/* Original layout */}
    </div>
)}
```

---

## 📋 Testing Checklist

To verify the changes work correctly:

### Kirehe Branch (Should show 4 columns):
- [ ] Sales Invoice with warehouse_id = 1
- [ ] Sales Invoice with warehouse_id = 10, 11, 12, 13, or 14
- [ ] Purchase Invoice with warehouse_id = 1
- [ ] Purchase Invoice with warehouse_id = 10, 11, 12, 13, or 14
- [ ] Quotation with warehouse_id = 1
- [ ] Quotation with warehouse_id = 10, 11, 12, 13, or 14

### Other Branches (Should show 3 columns):
- [ ] Sales Invoice with warehouse_id = 2 (Gatsibo)
- [ ] Sales Invoice with warehouse_id = 3 (Ngoma)
- [ ] Sales Invoice with warehouse_id = 4 (Kigali)
- [ ] Purchase Invoice with warehouse_id = 2, 3, or 4
- [ ] Quotation with warehouse_id = 2, 3, or 4

---

## 🎯 Summary

**What Changed:**
- Kirehe branch now has a special 4-column footer layout
- I&M Bank is highlighted as "Main Bank Kirehe"
- Email, Website, YouTube moved to 4th column for Kirehe
- Website URL includes "http://" for Kirehe

**What Stayed the Same:**
- Other branches (Gatsibo, Ngoma, Kigali) keep original 3-column layout
- All bank account numbers remain the same
- Contact personnel numbers remain the same
- TIN number remains the same
- Header layout unchanged for all branches

**Files Modified:**
1. `resources/js/pages/Sales/Print.tsx`
2. `resources/js/pages/Purchase/Print.tsx`
3. `packages/workdo/Quotation/src/Resources/js/Pages/Quotations/Print.tsx`

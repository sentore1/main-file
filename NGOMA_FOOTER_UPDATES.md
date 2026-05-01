# Ngoma Branch Footer - Updated

## ✅ Changes Applied

Updated footer layout for **Ngoma branch** (Warehouse IDs: 3, 5, 6, 7, 8, 9) in:
1. ✅ Sales Invoice (`resources/js/pages/Sales/Print.tsx`)
2. ✅ Purchase Invoice (`resources/js/pages/Purchase/Print.tsx`)
3. ✅ Quotation (`packages/workdo/Quotation/src/Resources/js/Pages/Quotations/Print.tsx`)

---

## 🏢 NGOMA BRANCH - UPDATED FOOTER (4 Columns)

```
┌──────────────────────┬──────────────────────┬──────────────────────┬──────────────────────┐
│  Main Bank Ngoma     │  Contacts            │  Business Details    │  Social Media        │
│                      │                      │                      │  Account             │
├──────────────────────┼──────────────────────┼──────────────────────┼──────────────────────┤
│                      │                      │                      │                      │
│  BK:                 │  Manager:            │  TIN: 108229033      │  Email:              │
│  00065-06983633-48   │  0787584969          │                      │  eastgatehotel2020@  │
│                      │                      │                      │  gmail.com           │
│  Other Banks         │  Accountant:         │                      │                      │
│                      │  0783554653          │                      │  Website:            │
│  I&M Bank:           │                      │                      │  www.eastgatehotel   │
│  20087996001         │  Reception:          │                      │  rwanda.com          │
│                      │  0781431477          │                      │                      │
│  BPR:                │                      │                      │                      │
│  568476053110117     │                      │                      │                      │
│                      │                      │                      │                      │
│  EGH-MOMO:           │                      │                      │                      │
│  500005              │                      │                      │                      │
│                      │                      │                      │                      │
└──────────────────────┴──────────────────────┴──────────────────────┴──────────────────────┘
```

---

## 📋 DETAILED BREAKDOWN

### Column 1: Main Bank Ngoma
**Main Bank:**
- **BK**: 00065-06983633-48

**Other Banks:**
- **I&M Bank**: 20087996001
- **BPR**: 568476053110117
- **EGH-MOMO**: 500005

### Column 2: Contacts
- **Manager**: 0787584969
- **Accountant**: 0783554653
- **Reception**: 0781431477

### Column 3: Business Details
- **TIN**: 108229033

### Column 4: Social Media Account
- **Email**: eastgatehotel2020@gmail.com (from header)
- **Website**: www.eastgatehotelrwanda.com

---

## 🔄 WHAT CHANGED FOR NGOMA

### Before (3 columns):
- ❌ All banks listed equally
- ❌ Manager: 0787007015 (generic)
- ❌ Accountant: 0785654301 (generic)
- ❌ No Reception contact
- ❌ Website: www.eastgatehotel.rw
- ❌ Had YouTube channel listed

### After (4 columns):
- ✅ BK highlighted as "Main Bank Ngoma"
- ✅ Manager: 0787584969 (Ngoma-specific)
- ✅ Accountant: 0783554653 (Ngoma-specific)
- ✅ Reception: 0781431477 (NEW)
- ✅ Website: www.eastgatehotelrwanda.com (updated)
- ✅ YouTube removed
- ✅ Different bank accounts (BK, I&M, BPR, EGH-MOMO)

---

## 📊 COMPARISON: ALL BRANCHES

| Element | Kirehe | Ngoma | Gatsibo/Kigali |
|---------|--------|-------|----------------|
| **Layout** | 4 columns | 4 columns | 3 columns |
| **Main Bank** | I&M: 20087996001 | BK: 00065-06983633-48 | N/A |
| **Other Banks** | BK, BPR, Equity | I&M, BPR, EGH-MOMO | All equal |
| **Manager** | 0787007015 | 0787584969 | 0787007015 |
| **Accountant** | 0785654301 | 0783554653 | 0785654301 |
| **Reception** | - | 0781431477 | - |
| **Website** | http://www.eastgatehotel.rw | www.eastgatehotelrwanda.com | www.eastgatehotel.rw |
| **YouTube** | Yes | No | Yes |

---

## 🎯 BRANCH DETECTION LOGIC

The system now checks warehouse_id and applies the correct footer:

```typescript
// Kirehe branches: 1, 10, 11, 12, 13, 14
if ([1, 10, 11, 12, 13, 14].includes(warehouse_id)) {
    // Show Kirehe 4-column layout
}
// Ngoma branches: 3, 5, 6, 7, 8, 9
else if ([3, 5, 6, 7, 8, 9].includes(warehouse_id)) {
    // Show Ngoma 4-column layout
}
// Other branches (Gatsibo, Kigali)
else {
    // Show default 3-column layout
}
```

---

## 📝 TESTING CHECKLIST

### Ngoma Branch (Should show NEW 4-column layout):
- [ ] Sales Invoice with warehouse_id = 3
- [ ] Sales Invoice with warehouse_id = 5, 6, 7, 8, or 9
- [ ] Purchase Invoice with warehouse_id = 3
- [ ] Purchase Invoice with warehouse_id = 5, 6, 7, 8, or 9
- [ ] Quotation with warehouse_id = 3
- [ ] Quotation with warehouse_id = 5, 6, 7, 8, or 9

### Verify Ngoma-Specific Data:
- [ ] Main Bank shows: BK: 00065-06983633-48
- [ ] Other Banks show: I&M, BPR, EGH-MOMO
- [ ] Manager: 0787584969
- [ ] Accountant: 0783554653
- [ ] Reception: 0781431477
- [ ] Email: eastgatehotel2020@gmail.com
- [ ] Website: www.eastgatehotelrwanda.com
- [ ] No YouTube channel listed

### Other Branches (Should remain unchanged):
- [ ] Kirehe still shows 4-column with I&M as main bank
- [ ] Gatsibo/Kigali still show 3-column layout

---

## 🔑 KEY FEATURES

### Ngoma-Specific:
1. ✅ **4-column layout** (upgraded from 3 columns)
2. ✅ **BK as Main Bank** with unique account number
3. ✅ **3 contact numbers** (Manager, Accountant, Reception)
4. ✅ **Different bank accounts** than other branches
5. ✅ **EGH-MOMO mobile money** account included
6. ✅ **Different website** (eastgatehotelrwanda.com)
7. ✅ **No YouTube** in footer

### Shared with All Branches:
- ✅ TIN: 108229033
- ✅ Email from header (branch-specific)

---

## 📂 FILES MODIFIED

1. `resources/js/pages/Sales/Print.tsx`
2. `resources/js/pages/Purchase/Print.tsx`
3. `packages/workdo/Quotation/src/Resources/js/Pages/Quotations/Print.tsx`

---

## 💡 SUMMARY

**Ngoma branch now has:**
- ✅ Custom 4-column footer layout
- ✅ BK as main bank (00065-06983633-48)
- ✅ Branch-specific contact numbers
- ✅ Mobile money account (EGH-MOMO: 500005)
- ✅ Different website (www.eastgatehotelrwanda.com)
- ✅ Applies to Sales Invoice, Purchase Invoice, and Quotation

**Other branches:**
- Kirehe: 4-column layout (I&M as main bank)
- Gatsibo/Kigali: 3-column layout (default)

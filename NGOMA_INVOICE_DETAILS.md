# NGOMA BRANCH - Sales Invoice Header & Footer

## 🏢 NGOMA BRANCH
**Warehouse IDs**: 3, 5, 6, 7, 8, 9

---

## 📄 HEADER (Top of Invoice)

```
╔═══════════════════════════════════════════════════════════════════════╗
║                                                                       ║
║  [COMPANY LOGO]                              SALES INVOICE            ║
║                                              #INV-2024-003            ║
║                                                                       ║
║  East Gate Hotel                             Date: January 15, 2024  ║
║  Ngoma District, Eastern Province            Due: February 15, 2024  ║
║  Ngoma                                                                ║
║  Rwanda                                                               ║
║                                                                       ║
║  Phone: 0787584969 / 0781431477                                      ║
║  Email: eastgatehotel2020@gmail.com                                  ║
║  Registration: 108229033                                             ║
║                                                                       ║
╚═══════════════════════════════════════════════════════════════════════╝
```

### Header Data Breakdown:

| Field | Value | Source |
|-------|-------|--------|
| **Company Logo** | [Logo Image] | ✅ **Database** (company settings) |
| **Company Name** | East Gate Hotel | ✅ **Database** (company_name setting) |
| **Company Address** | Ngoma District, Eastern Province | ✅ **Database** (company_address setting) |
| **City** | **Ngoma** | 🏢 **HARDCODED** (warehouseHeaders.ts) |
| **Country** | Rwanda | ✅ **Database** (company_country setting) |
| **Phone** | **0787584969 / 0781431477** | 🏢 **HARDCODED** (warehouseHeaders.ts) |
| **Email** | **eastgatehotel2020@gmail.com** | 🏢 **HARDCODED** (warehouseHeaders.ts) |
| **Registration** | 108229033 | ✅ **Database** (registration_number setting) |
| **Invoice Number** | #INV-2024-003 | ✅ **Database** (invoice.invoice_number) |
| **Invoice Date** | January 15, 2024 | ✅ **Database** (invoice.invoice_date) |
| **Due Date** | February 15, 2024 | ✅ **Database** (invoice.due_date) |

---

## 📄 FOOTER (Bottom of Invoice)

### 3-Column Layout (Standard for Non-Kirehe Branches)

```
╔═══════════════════════════════════════════════════════════════════════╗
║                                                                       ║
║                    PAYMENT TERMS: Net 30 Days                         ║
║                  Thank you for your business!                         ║
║                                                                       ║
╠═══════════════════════════════════════════════════════════════════════╣
║                                                                       ║
║  ┌─────────────────────┬─────────────────────┬─────────────────────┐ ║
║  │  Bank Accounts      │  Contact Personnel  │  Business Details   │ ║
║  ├─────────────────────┼─────────────────────┼─────────────────────┤ ║
║  │                     │                     │                     │ ║
║  │  BK Rwanda:         │  Manager:           │  TIN: 108229033     │ ║
║  │  100031094598       │  0787007015         │                     │ ║
║  │                     │                     │                     │ ║
║  │  BPR Rwanda:        │  Accountant:        │                     │ ║
║  │  4493647590         │  0785654301         │                     │ ║
║  │                     │                     │                     │ ║
║  │  I&M Bank:          │  Online & Social    │                     │ ║
║  │  20087996001        │  Media:             │                     │ ║
║  │                     │                     │                     │ ║
║  │  Equity Bank:       │  Email:             │                     │ ║
║  │  4035200050923      │  eastgatehotel2020@ │                     │ ║
║  │                     │  gmail.com          │                     │ ║
║  │                     │                     │                     │ ║
║  │                     │  Website:           │                     │ ║
║  │                     │  www.eastgate       │                     │ ║
║  │                     │  hotel.rw           │                     │ ║
║  │                     │                     │                     │ ║
║  │                     │  YouTube:           │                     │ ║
║  │                     │  EAST GATE HOTEL    │                     │ ║
║  │                     │  RWANDA             │                     │ ║
║  │                     │                     │                     │ ║
║  └─────────────────────┴─────────────────────┴─────────────────────┘ ║
║                                                                       ║
╚═══════════════════════════════════════════════════════════════════════╝
```

### Footer Data Breakdown:

#### Column 1: Bank Accounts
| Bank | Account Number | Source |
|------|----------------|--------|
| **BK Rwanda** | 100031094598 | ❌ **HARDCODED** (Print.tsx) |
| **BPR Rwanda** | 4493647590 | ❌ **HARDCODED** (Print.tsx) |
| **I&M Bank** | 20087996001 | ❌ **HARDCODED** (Print.tsx) |
| **Equity Bank** | 4035200050923 | ❌ **HARDCODED** (Print.tsx) |

**Note**: All 4 banks listed equally (no "Main Bank" designation like Kirehe)

#### Column 2: Contact Personnel
| Contact | Phone/Details | Source |
|---------|---------------|--------|
| **Manager** | 0787007015 | ❌ **HARDCODED** (Print.tsx) |
| **Accountant** | 0785654301 | ❌ **HARDCODED** (Print.tsx) |

#### Column 2: Online & Social Media
| Platform | Value | Source |
|----------|-------|--------|
| **Email** | **eastgatehotel2020@gmail.com** | 🏢 **FROM HEADER** (header.company_email) |
| **Website** | www.eastgatehotel.rw | ❌ **HARDCODED** (Print.tsx) |
| **YouTube** | EAST GATE HOTEL RWANDA | ❌ **HARDCODED** (Print.tsx) |

**Note**: Website does NOT include "http://" prefix (unlike Kirehe)

#### Column 3: Business Details
| Field | Value | Source |
|-------|-------|--------|
| **TIN** | 108229033 | ❌ **HARDCODED** (Print.tsx) |

#### Additional Footer Elements
| Element | Value | Source |
|---------|-------|--------|
| **Payment Terms** | Net 30 Days | ✅ **Database** (invoice.payment_terms) with fallback |
| **Thank You Message** | Thank you for your business! | ❌ **HARDCODED** (translation key) |
| **Company Stamp** | [Stamp Image] | ❌ **HARDCODED** (/storage/media/eaststamp.png) |

---

## 🔍 SUMMARY FOR NGOMA BRANCH

### What's Unique to Ngoma:
1. 🏢 **Email**: eastgatehotel2020@gmail.com (appears in header AND footer)
2. 🏢 **Phone**: 0787584969 / 0781431477 (appears in header only)
3. 🏢 **City**: Ngoma (appears in header only)

### What's Shared with All Branches:
1. ❌ All 4 bank accounts (same account numbers)
2. ❌ Manager phone: 0787007015
3. ❌ Accountant phone: 0785654301
4. ❌ Website: www.eastgatehotel.rw
5. ❌ YouTube: EAST GATE HOTEL RWANDA
6. ❌ TIN: 108229033
7. ❌ Company stamp image

### What's Dynamic from Database:
1. ✅ Company logo
2. ✅ Company name
3. ✅ Company address
4. ✅ Invoice number
5. ✅ Invoice date
6. ✅ Due date
7. ✅ Customer information (Bill To / Ship To)
8. ✅ All line items (products, quantities, prices)
9. ✅ Totals, taxes, discounts
10. ✅ Payment terms

---

## 📊 COMPARISON: NGOMA vs KIREHE

| Element | Ngoma | Kirehe | Difference |
|---------|-------|--------|------------|
| **HEADER** |
| Email | eastgatehotel2020@gmail.com | eastgatehotelkirehe@gmail.com | ✅ Different |
| Phone | 0787584969 / 0781431477 | 0783861599 / 0782804340 | ✅ Different |
| City | Ngoma | Kirehe | ✅ Different |
| **FOOTER** |
| Layout | 3 columns | 4 columns | ✅ Different |
| Bank Section | "Bank Accounts" (all equal) | "Main Bank Kirehe" + "Other Banks" | ✅ Different |
| I&M Bank | Listed with others | Highlighted as main | ✅ Different |
| Email Location | Column 2 (with contacts) | Column 4 (separate) | ✅ Different |
| Website | www.eastgatehotel.rw | http://www.eastgatehotel.rw | ✅ Different (http://) |
| Bank Accounts | Same numbers | Same numbers | ❌ Same |
| Manager/Accountant | Same numbers | Same numbers | ❌ Same |
| TIN | Same | Same | ❌ Same |

---

## 📂 WHERE TO FIND THIS DATA

### Ngoma-Specific Configuration:
**File**: `resources/js/utils/warehouseHeaders.ts`
```typescript
// Ngoma branches (3, 5-9)
3: { 
    company_email: 'eastgatehotel2020@gmail.com', 
    company_telephone: '0787584969 / 0781431477', 
    company_city: 'Ngoma' 
},
5: { company_email: 'eastgatehotel2020@gmail.com', ... },
6: { company_email: 'eastgatehotel2020@gmail.com', ... },
7: { company_email: 'eastgatehotel2020@gmail.com', ... },
8: { company_email: 'eastgatehotel2020@gmail.com', ... },
9: { company_email: 'eastgatehotel2020@gmail.com', ... },
```

### Footer Hardcoded Data:
**File**: `resources/js/pages/Sales/Print.tsx`
- Lines ~230-260: Footer section (3-column layout for non-Kirehe branches)

### Database Settings:
**Table**: `settings`
- company_name
- company_address
- company_country
- company_logo
- registration_number

**Table**: `sales_invoices`
- invoice_number
- invoice_date
- due_date
- payment_terms
- warehouse_id (determines which branch config to use)

---

## 🎯 QUICK REFERENCE

**To change Ngoma email/phone**: Edit `resources/js/utils/warehouseHeaders.ts`
**To change bank accounts**: Edit `resources/js/pages/Sales/Print.tsx` (line ~235)
**To change manager/accountant phones**: Edit `resources/js/pages/Sales/Print.tsx` (line ~243)
**To change company name/address**: Update database settings table
**To change logo**: Upload new logo via admin settings

---

## 📝 APPLIES TO:
- ✅ Sales Invoice
- ✅ Purchase Invoice
- ✅ Quotation

All three document types use the same header and footer configuration for Ngoma branch.

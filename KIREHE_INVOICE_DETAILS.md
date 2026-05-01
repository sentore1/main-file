# KIREHE BRANCH - Sales Invoice Header & Footer

## 🏢 KIREHE BRANCH
**Warehouse IDs**: 1, 10, 11, 12, 13, 14

---

## 📄 HEADER (Top of Invoice)

```
╔═══════════════════════════════════════════════════════════════════════╗
║                                                                       ║
║  [COMPANY LOGO]                              SALES INVOICE            ║
║                                              #INV-2024-001            ║
║                                                                       ║
║  East Gate Hotel                             Date: January 15, 2024  ║
║  Kirehe District, Eastern Province           Due: February 15, 2024  ║
║  Kirehe                                                               ║
║  Rwanda                                                               ║
║                                                                       ║
║  Phone: 0783861599 / 0782804340                                      ║
║  Email: eastgatehotelkirehe@gmail.com                                ║
║  Registration: 108229033                                             ║
║                                                                       ║
╚═══════════════════════════════════════════════════════════════════════╝
```

### Header Data Breakdown:

| Field | Value | Source |
|-------|-------|--------|
| **Company Logo** | [Logo Image] | ✅ **Database** (company settings) |
| **Company Name** | East Gate Hotel | ✅ **Database** (company_name setting) |
| **Company Address** | Kirehe District, Eastern Province | ✅ **Database** (company_address setting) |
| **City** | **Kirehe** | 🏢 **HARDCODED** (warehouseHeaders.ts) |
| **Country** | Rwanda | ✅ **Database** (company_country setting) |
| **Phone** | **0783861599 / 0782804340** | 🏢 **HARDCODED** (warehouseHeaders.ts) |
| **Email** | **eastgatehotelkirehe@gmail.com** | 🏢 **HARDCODED** (warehouseHeaders.ts) |
| **Registration** | 108229033 | ✅ **Database** (registration_number setting) |
| **Invoice Number** | #INV-2024-001 | ✅ **Database** (invoice.invoice_number) |
| **Invoice Date** | January 15, 2024 | ✅ **Database** (invoice.invoice_date) |
| **Due Date** | February 15, 2024 | ✅ **Database** (invoice.due_date) |

---

## 📄 FOOTER (Bottom of Invoice)

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
║  │  4035200050923      │  eastgatehotel      │                     │ ║
║  │                     │  kirehe@gmail.com   │                     │ ║
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
| **BK Rwanda** | 100031094598 | ❌ **HARDCODED** (Print.tsx line ~235) |
| **BPR Rwanda** | 4493647590 | ❌ **HARDCODED** (Print.tsx line ~236) |
| **I&M Bank** | 20087996001 | ❌ **HARDCODED** (Print.tsx line ~237) |
| **Equity Bank** | 4035200050923 | ❌ **HARDCODED** (Print.tsx line ~238) |

#### Column 2: Contact Personnel
| Contact | Phone/Details | Source |
|---------|---------------|--------|
| **Manager** | 0787007015 | ❌ **HARDCODED** (Print.tsx line ~243) |
| **Accountant** | 0785654301 | ❌ **HARDCODED** (Print.tsx line ~244) |

#### Column 2: Online & Social Media
| Platform | Value | Source |
|----------|-------|--------|
| **Email** | **eastgatehotelkirehe@gmail.com** | 🏢 **FROM HEADER** (header.company_email) |
| **Website** | www.eastgatehotel.rw | ❌ **HARDCODED** (Print.tsx line ~250) |
| **YouTube** | EAST GATE HOTEL RWANDA | ❌ **HARDCODED** (Print.tsx line ~251) |

#### Column 3: Business Details
| Field | Value | Source |
|-------|-------|--------|
| **TIN** | 108229033 | ❌ **HARDCODED** (Print.tsx line ~256) |

#### Additional Footer Elements
| Element | Value | Source |
|---------|-------|--------|
| **Payment Terms** | Net 30 Days | ✅ **Database** (invoice.payment_terms) with fallback |
| **Thank You Message** | Thank you for your business! | ❌ **HARDCODED** (translation key) |
| **Company Stamp** | [Stamp Image] | ❌ **HARDCODED** (/storage/media/eaststamp.png) |

---

## 🔍 SUMMARY FOR KIREHE BRANCH

### What's Unique to Kirehe:
1. 🏢 **Email**: eastgatehotelkirehe@gmail.com (appears in header AND footer)
2. 🏢 **Phone**: 0783861599 / 0782804340 (appears in header only)
3. 🏢 **City**: Kirehe (appears in header only)

### What's Shared with All Branches:
1. ❌ All 4 bank accounts
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

## 📂 WHERE TO FIND THIS DATA

### Kirehe-Specific Configuration:
**File**: `resources/js/utils/warehouseHeaders.ts`
```typescript
// Kirehe branches (1, 10-14)
1: { 
    company_email: 'eastgatehotelkirehe@gmail.com', 
    company_telephone: '0783861599 / 0782804340', 
    company_city: 'Kirehe' 
},
10: { company_email: 'eastgatehotelkirehe@gmail.com', ... },
11: { company_email: 'eastgatehotelkirehe@gmail.com', ... },
12: { company_email: 'eastgatehotelkirehe@gmail.com', ... },
13: { company_email: 'eastgatehotelkirehe@gmail.com', ... },
14: { company_email: 'eastgatehotelkirehe@gmail.com', ... },
```

### Footer Hardcoded Data:
**File**: `resources/js/pages/Sales/Print.tsx`
- Lines ~230-260: Footer section with bank accounts, contacts, social media

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

**To change Kirehe email/phone**: Edit `resources/js/utils/warehouseHeaders.ts`
**To change bank accounts**: Edit `resources/js/pages/Sales/Print.tsx` (line ~235)
**To change manager/accountant phones**: Edit `resources/js/pages/Sales/Print.tsx` (line ~243)
**To change company name/address**: Update database settings table
**To change logo**: Upload new logo via admin settings

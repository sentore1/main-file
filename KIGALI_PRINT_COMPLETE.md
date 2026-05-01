# KIGALI BRANCH - Complete Print Layout

## 🏢 KIGALI BRANCH (Warehouse IDs: 4, 20-23)

---

## 📄 HEADER (Top of Invoice/Purchase/Quotation)

```
╔═══════════════════════════════════════════════════════════════════════╗
║                                                                       ║
║  [COMPANY LOGO]                              SALES INVOICE            ║
║                                              #INV-2024-004            ║
║                                                                       ║
║  East Gate Hotel                             Date: January 15, 2024  ║
║  [Company Address from DB]                   Due: February 15, 2024  ║
║  Kigali                                                               ║
║  Rwanda                                                               ║
║                                                                       ║
║  Phone: +250788470070 / +250785584664                                ║
║  Email: eastgatehotelkigali@gmail.com                                ║
║  Registration: 108229033                                             ║
║                                                                       ║
╚═══════════════════════════════════════════════════════════════════════╝
```

### Header Data:
| Field | Value | Source |
|-------|-------|--------|
| **Logo** | [Image] | Database |
| **Company Name** | East Gate Hotel | Database |
| **Address** | [From DB] | Database |
| **City** | Kigali | Hardcoded (warehouseHeaders.ts) |
| **Country** | Rwanda | Database |
| **Phone** | **+250788470070 / +250785584664** | Hardcoded (warehouseHeaders.ts) |
| **Email** | **eastgatehotelkigali@gmail.com** | Hardcoded (warehouseHeaders.ts) |
| **Registration** | 108229033 | Database |

---

## 📄 FOOTER (Bottom of Invoice/Purchase/Quotation)

### 4-Column Layout

```
╔═══════════════════════════════════════════════════════════════════════╗
║                                                                       ║
║                    PAYMENT TERMS: Net 30 Days                         ║
║                  Thank you for your business!                         ║
║                                                                       ║
╠═══════════════════════════════════════════════════════════════════════╣
║                                                                       ║
║  ┌─────────────────────┬─────────────────────┬─────────────────────┬─────────────────────┐ ║
║  │  Bank Accounts      │  Contact Personnel  │  Business Details   │  Online & Social    │ ║
║  │                     │                     │                     │  Media              │ ║
║  ├─────────────────────┼─────────────────────┼─────────────────────┼─────────────────────┤ ║
║  │                     │                     │                     │                     │ ║
║  │  BK Rwanda:         │  Receptionist:      │  TIN: 108229033     │  Email:             │ ║
║  │  100031094598       │  +250788470070      │                     │  eastgatehotelkigali│ ║
║  │                     │                     │                     │  @gmail.com         │ ║
║  │  BPR Rwanda:        │  Manager:           │                     │                     │ ║
║  │  4493647590         │  +250785584664      │                     │  Website:           │ ║
║  │                     │                     │                     │  www.eastgatehotel  │ ║
║  │  I&M Bank:          │  Email:             │                     │  .rw                │ ║
║  │  20087996001        │  eastgateshotel2020@│                     │                     │ ║
║  │                     │  gmail.com          │                     │  YouTube:           │ ║
║  │  Equity Bank:       │                     │                     │  EAST GATE HOTEL    │ ║
║  │  4035200050923      │                     │                     │  RWANDA             │ ║
║  │                     │                     │                     │                     │ ║
║  └─────────────────────┴─────────────────────┴─────────────────────┴─────────────────────┘ ║
║                                                                       ║
╚═══════════════════════════════════════════════════════════════════════╝
```

### Footer Data Breakdown:

#### Column 1: Bank Accounts
| Bank | Account Number | Source |
|------|----------------|--------|
| **BK Rwanda** | 100031094598 | Hardcoded |
| **BPR Rwanda** | 4493647590 | Hardcoded |
| **I&M Bank** | 20087996001 | Hardcoded |
| **Equity Bank** | 4035200050923 | Hardcoded |

**Note**: NO "Main Bank" designation - all banks listed equally

#### Column 2: Contact Personnel
| Contact | Value | Source |
|---------|-------|--------|
| **Receptionist** | +250788470070 | Hardcoded |
| **Manager** | +250785584664 | Hardcoded |
| **Email** | eastgateshotel2020@gmail.com | Hardcoded |

#### Column 3: Business Details
| Field | Value | Source |
|-------|-------|--------|
| **TIN** | 108229033 | Hardcoded |

#### Column 4: Online & Social Media
| Platform | Value | Source |
|----------|-------|--------|
| **Email** | eastgatehotelkigali@gmail.com | From header (dynamic) |
| **Website** | www.eastgatehotel.rw | Hardcoded |
| **YouTube** | EAST GATE HOTEL RWANDA | Hardcoded |

---

## 🔍 KIGALI UNIQUE FEATURES

### What Makes Kigali Different:

1. ✅ **Header has 2 phone numbers** with international format (+250)
   - Receptionist: +250788470070
   - Manager: +250785584664

2. ✅ **Footer has NO "Main Bank"** designation
   - All 4 banks listed equally under "Bank Accounts"

3. ✅ **Footer has 2 contact roles**:
   - Receptionist (not Accountant like other branches)
   - Manager

4. ✅ **Footer has 2 emails**:
   - eastgateshotel2020@gmail.com (in Contact Personnel column)
   - eastgatehotelkigali@gmail.com (in Online & Social Media column)

5. ✅ **Website**: www.eastgatehotel.rw (no "rwanda" in domain)

6. ✅ **Has YouTube** channel listed

---

## 📊 HEADER vs FOOTER COMPARISON

| Element | Header | Footer |
|---------|--------|--------|
| **Phone 1** | +250788470070 | Receptionist: +250788470070 ✅ Match |
| **Phone 2** | +250785584664 | Manager: +250785584664 ✅ Match |
| **Email** | eastgatehotelkigali@gmail.com | eastgatehotelkigali@gmail.com (Col 4) ✅ Match |
| **Extra Email** | - | eastgateshotel2020@gmail.com (Col 2) |

---

## 🎯 SUMMARY

**Kigali Print Shows:**

### Header:
- 2 phone numbers: +250788470070 / +250785584664
- Email: eastgatehotelkigali@gmail.com
- City: Kigali

### Footer:
- 4 banks (all equal, no main bank)
- 2 contacts: Receptionist (+250788470070) & Manager (+250785584664)
- 2 emails: eastgateshotel2020@gmail.com & eastgatehotelkigali@gmail.com
- Website: www.eastgatehotel.rw
- YouTube: EAST GATE HOTEL RWANDA

**Consistency**: ✅ Header phone numbers match footer contact numbers perfectly!

---

## 📂 FILES

- Sales Invoice: `resources/js/pages/Sales/Print.tsx`
- Purchase Invoice: `resources/js/pages/Purchase/Print.tsx`
- Quotation: `packages/workdo/Quotation/src/Resources/js/Pages/Quotations/Print.tsx`
- Header Config: `resources/js/utils/warehouseHeaders.ts`

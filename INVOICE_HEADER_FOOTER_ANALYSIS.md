# Invoice, Purchase, and Quotation Header & Footer Analysis

## Overview
This document explains the data sources for headers and footers in Sales Invoices, Purchase Invoices, and Quotations.

---

## 📋 HEADER DATA SOURCES

### 1. **Sales Invoice Header** (`resources/js/pages/Sales/Print.tsx`)

#### Company Information (Left Side)
- **Logo**: 
  - Source: Database settings via `getCompanySetting()`
  - Priority: `logo_dark` → `logo_light` → `company_logo`
  - **Dynamic from database**

- **Company Details**:
  ```typescript
  const header = getWarehouseHeader(invoice.warehouse_id);
  ```
  - **Hybrid approach**:
    - If warehouse_id matches configured warehouse → Uses hardcoded warehouse-specific data
    - Otherwise → Falls back to database settings via `getCompanySetting()`

#### Warehouse-Specific Headers (Hardcoded)
Located in: `resources/js/utils/warehouseHeaders.ts`

**Configuration by Warehouse ID:**
- **Kirehe** (IDs: 1, 10-14): 
  - Email: eastgatehotelkirehe@gmail.com
  - Phone: 0783861599 / 0782804340
  
- **Gatsibo** (IDs: 2, 15-19):
  - Email: eastgatehotelgatsibo@gmail.com
  - Phone: 0785413360 / 0784822953
  
- **Ngoma** (IDs: 3, 5-9):
  - Email: eastgatehotel2020@gmail.com
  - Phone: 0787584969 / 0781431477
  
- **Kigali** (IDs: 4, 20-23):
  - Email: eastgatehotelkigali@gmail.com
  - Phone: 0785584664

#### Invoice Details (Right Side)
- **Invoice Number**: From database (`invoice.invoice_number`)
- **Invoice Date**: From database (`invoice.invoice_date`)
- **Due Date**: From database (`invoice.due_date`)
- **All dynamic from database**

#### Customer Information
- **Bill To**: From database (`invoice.customer` and `invoice.customer_details.billing_address`)
- **Ship To**: From database (`invoice.customer_details.shipping_address`)
- **All dynamic from database**

---

### 2. **Purchase Invoice Header** (`resources/js/pages/Purchase/Print.tsx`)

#### Company Information (Left Side)
- **Same as Sales Invoice**
- Uses `getWarehouseHeader(invoice.warehouse_id)`
- **Hybrid: Hardcoded warehouse config + Database fallback**

#### Invoice Details (Right Side)
- **Invoice Number**: From database (`invoice.invoice_number`)
- **Invoice Date**: From database (`invoice.invoice_date`)
- **Due Date**: From database (`invoice.due_date`)
- **All dynamic from database**

#### Vendor Information
- **Vendor**: From database (`invoice.vendor` and `invoice.vendor_details.billing_address`)
- **Ship To**: From database (`invoice.vendor_details.shipping_address`)
- **All dynamic from database**

---

### 3. **Quotation Header** (`packages/workdo/Quotation/src/Resources/js/Pages/Quotations/Print.tsx`)

#### Company Information (Left Side)
- **Same as Sales Invoice**
- Uses `getWarehouseHeader(quotation.warehouse_id)`
- **Hybrid: Hardcoded warehouse config + Database fallback**

#### Quotation Details (Right Side)
- **Quotation Number**: From database (`quotation.quotation_number`)
- **Date**: From database (`quotation.quotation_date`)
- **Due Date**: From database (`quotation.due_date`)
- **All dynamic from database**

#### Customer Information
- **Quote To**: From database (`quotation.customer` and `quotation.customer_details.billing_address`)
- **Ship To**: From database (`quotation.customer_details.shipping_address`)
- **All dynamic from database**

---

## 📋 FOOTER DATA SOURCES

### All Three Documents Have IDENTICAL Footers

#### Footer Section 1: Bank Accounts (Left Column)
**HARDCODED** in all three Print.tsx files:
```tsx
<div>
    <h4 className="font-bold mb-2">Bank Accounts</h4>
    <div className="space-y-1">
        <p><strong>BK Rwanda:</strong> 100031094598</p>
        <p><strong>BPR Rwanda:</strong> 4493647590</p>
        <p><strong>I&M Bank:</strong> 20087996001</p>
        <p><strong>Equity Bank:</strong> 4035200050923</p>
    </div>
</div>
```

#### Footer Section 2: Contact Personnel & Social Media (Middle Column)
**HARDCODED** contact numbers:
```tsx
<div>
    <h4 className="font-bold mb-2">Contact Personnel</h4>
    <div className="space-y-1">
        <p><strong>Manager:</strong> 0787007015</p>
        <p><strong>Accountant:</strong> 0785654301</p>
    </div>
    <h4 className="font-bold mt-3 mb-2">Online & Social Media</h4>
    <div className="space-y-1">
        <p>Email: {header.company_email || 'eastgatehotelkirehe@gmail.com'}</p>
        <p>Website: www.eastgatehotel.rw</p>
        <p>YouTube: EAST GATE HOTEL RWANDA</p>
    </div>
</div>
```
- **Email**: Hybrid (warehouse-specific from header OR hardcoded fallback)
- **Website & YouTube**: HARDCODED

#### Footer Section 3: Business Details (Right Column)
**HARDCODED**:
```tsx
<div>
    <h4 className="font-bold mb-2">Business Details</h4>
    <p><strong>TIN:</strong> 108229033</p>
</div>
```

#### Additional Footer Elements
- **Company Stamp**: HARDCODED image path (`/storage/media/eaststamp.png`)
- **Payment Terms**: From database with fallback (`invoice.payment_terms || 'Net 30 Days'`)
- **Thank You Message**: HARDCODED translation key

---

## 📊 SUMMARY TABLE

| Element | Sales Invoice | Purchase Invoice | Quotation | Source Type |
|---------|--------------|------------------|-----------|-------------|
| **HEADER** |
| Company Logo | ✓ | ✓ | ✓ | Database |
| Company Name | ✓ | ✓ | ✓ | Hybrid (Warehouse config/DB) |
| Company Address | ✓ | ✓ | ✓ | Hybrid (Warehouse config/DB) |
| Company Phone | ✓ | ✓ | ✓ | Hybrid (Warehouse config/DB) |
| Company Email | ✓ | ✓ | ✓ | Hybrid (Warehouse config/DB) |
| Registration # | ✓ | ✓ | ✓ | Hybrid (Warehouse config/DB) |
| Document Number | ✓ | ✓ | ✓ | Database |
| Document Date | ✓ | ✓ | ✓ | Database |
| Due Date | ✓ | ✓ | ✓ | Database |
| Customer/Vendor Info | ✓ | ✓ | ✓ | Database |
| **FOOTER** |
| Bank Accounts | ✓ | ✓ | ✓ | **HARDCODED** |
| Contact Personnel | ✓ | ✓ | ✓ | **HARDCODED** |
| Website | ✓ | ✓ | ✓ | **HARDCODED** |
| YouTube | ✓ | ✓ | ✓ | **HARDCODED** |
| TIN Number | ✓ | ✓ | ✓ | **HARDCODED** |
| Company Stamp | ✓ | ✓ | ✓ | **HARDCODED** |
| Payment Terms | ✓ | ✓ | ✓ | Database (with fallback) |

---

## 🔍 KEY FINDINGS

### What's Dynamic (From Database):
1. ✅ Company logo
2. ✅ Invoice/Purchase/Quotation numbers
3. ✅ Dates (invoice date, due date)
4. ✅ Customer/Vendor information
5. ✅ Billing and shipping addresses
6. ✅ Line items (products, quantities, prices)
7. ✅ Totals, taxes, discounts
8. ✅ Payment terms (with fallback)

### What's Hardcoded (Same for ALL Branches):
1. ❌ Bank account numbers (all 4 banks) - **SHARED ACROSS ALL BRANCHES**
2. ❌ Contact personnel phone numbers (Manager: 0787007015, Accountant: 0785654301) - **SHARED**
3. ❌ Website URL (www.eastgatehotel.rw) - **SHARED**
4. ❌ YouTube channel name (EAST GATE HOTEL RWANDA) - **SHARED**
5. ❌ TIN number (108229033) - **SHARED**
6. ❌ Company stamp image path - **SHARED**

### What's Branch-Specific (Hardcoded per Warehouse):
1. 🏢 **Header Company Email** - Different per branch (Kirehe, Gatsibo, Ngoma, Kigali)
2. 🏢 **Header Company Phone** - Different per branch
3. 🏢 **Footer Email** - Uses header.company_email (branch-specific)
4. 🏢 **Company City** - Different per branch

**Note**: The footer email dynamically shows the branch-specific email from the header configuration!

---

## 📝 RECOMMENDATIONS

### Current Setup Analysis:
✅ **Working Well**:
- Branch-specific emails and phones in headers (via warehouseHeaders.ts)
- Footer email automatically shows branch-specific email
- Shared company-wide data (bank accounts, TIN, website) is consistent

### Potential Improvements:

#### Option 1: Keep Current Approach (Recommended for Small Changes)
- **Pros**: Simple, fast, no database changes needed
- **Cons**: Requires code deployment to update footer data
- **Best for**: Rarely changing data like bank accounts, TIN

#### Option 2: Move to Database (Recommended for Flexibility)
1. **Add database fields** for:
   - Bank accounts (multiple accounts support)
   - Contact personnel (manager, accountant phones) - could be branch-specific
   - Social media links (website, YouTube)
   - TIN number
   - Company stamp image

2. **Create two-level settings**:
   - **Company-wide settings**: Bank accounts, TIN, website (shared)
   - **Branch-specific settings**: Contact personnel phones (if different per branch)

3. **Update Print.tsx files** to fetch from database

4. **Create admin settings page** for managing footer information

### To Improve Warehouse Headers:
1. **Move warehouse configurations to database** instead of hardcoded TypeScript file
2. **Create warehouse settings table** with fields for email, phone, address per warehouse
3. **Add admin interface** to manage warehouse-specific information
4. **Benefits**: No code deployment needed to update branch contact info

---

## 📂 FILE LOCATIONS

### Print Templates:
- Sales Invoice: `resources/js/pages/Sales/Print.tsx`
- Purchase Invoice: `resources/js/pages/Purchase/Print.tsx`
- Quotation: `packages/workdo/Quotation/src/Resources/js/Pages/Quotations/Print.tsx`

### Configuration:
- Warehouse Headers: `resources/js/utils/warehouseHeaders.ts`
- Helper Functions: `resources/js/utils/helpers.ts`

### Database Models:
- Sales Invoice: `app/Models/SalesInvoice.php`
- Purchase Invoice: `app/Models/PurchaseInvoice.php`
- Quotation: `packages/workdo/Quotation/src/Models/SalesQuotation.php`

---

## 🎯 CONCLUSION

**Headers**: 
- Logo: Dynamic from database
- Company info: Branch-specific (email, phone, city) via hardcoded warehouse config
- Document details: Dynamic from database
- Customer/Vendor: Dynamic from database

**Footers**: 
- **Shared data** (bank accounts, TIN, website, YouTube, manager/accountant phones): Hardcoded - same for all branches
- **Branch-specific data** (email): Dynamically pulled from header configuration

**Current Design Philosophy**:
The system uses a **hybrid approach** that makes sense:
- **Company-wide data** (banks, TIN, website) → Hardcoded (rarely changes)
- **Branch-specific data** (email, phone) → Configured per warehouse
- **Transaction data** (invoices, customers) → Database (changes frequently)

**Recommendation**: 
- ✅ Current approach is reasonable for stable company data
- 💡 Consider moving to database if footer data needs frequent updates
- 💡 Consider moving warehouse configs to database for easier branch management

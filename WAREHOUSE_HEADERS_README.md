# Warehouse-Specific Headers - Quick Start

## What Was Added

✅ **New Feature**: Different headers on invoices and quotations based on warehouse selection

## Files Modified

1. **Sales Invoice Print** - `resources/js/pages/Sales/Print.tsx`
2. **Purchase Invoice Print** - `resources/js/pages/Purchase/Print.tsx`
3. **Quotation Print** - `packages/workdo/Quotation/src/Resources/js/Pages/Quotations/Print.tsx`

## Files Created

1. **Configuration File** - `resources/js/utils/warehouseHeaders.ts`
2. **Example File** - `resources/js/utils/warehouseHeaders.example.ts`
3. **Documentation** - `WAREHOUSE_HEADERS_GUIDE.md`

## How to Configure (3 Simple Steps)

### Step 1: Find Your Warehouse IDs
Check your database `warehouses` table or look at the URL when editing a warehouse.

### Step 2: Edit Configuration
Open `resources/js/utils/warehouseHeaders.ts` and add your warehouse information:

```typescript
const warehouseHeaders: Record<number, WarehouseHeader> = {
    1: {  // Replace 1 with your actual warehouse ID
        company_name: 'Your Branch Name',
        company_address: 'Your Address',
        company_city: 'Your City',
        company_state: 'Your State',
        company_zipcode: 'Your ZIP',
        company_country: 'Your Country',
        company_telephone: 'Your Phone',
        company_email: 'Your Email',
        registration_number: 'Your Registration'
    },
    // Add more warehouses...
};
```

### Step 3: Rebuild Assets
```bash
npm run build
```

## How It Works

- **With Warehouse Selected**: Shows warehouse-specific header
- **Without Warehouse**: Shows default company settings
- **Warehouse Not Configured**: Falls back to default company settings

## Example

If you create a sales/purchase invoice or quotation and select "Warehouse A" (ID: 1), the PDF will show:
- Company Name: "Warehouse A Branch"
- Address: "123 Warehouse A Street"
- Phone: "+1 555-0001"
- etc.

If you select "Warehouse B" (ID: 2), it will show Warehouse B's information instead.

## Need More Help?

See the detailed guide: `WAREHOUSE_HEADERS_GUIDE.md`

## Testing

1. Create a new sales invoice, purchase invoice, or quotation
2. Select a warehouse you've configured
3. Click "Download PDF" or view print preview
4. Verify the header shows the correct warehouse information

---

**Note**: All fields are optional. If you don't provide a field, it won't be displayed on the invoice/quotation.

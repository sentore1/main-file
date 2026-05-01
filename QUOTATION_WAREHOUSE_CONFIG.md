# Quotation Warehouse Headers Configuration

## Location
Configure warehouse headers directly in:
`packages/workdo/Quotation/src/Resources/js/Pages/Quotations/Print.tsx`

## Find the Configuration Section
Look for this code block around line 22:

```typescript
const warehouseHeaders: Record<number, WarehouseHeader> = {
    // Configure your warehouses here
};
```

## Add Your Warehouses

```typescript
const warehouseHeaders: Record<number, WarehouseHeader> = {
    1: {
        logo_url: '/images/warehouses/warehouse-1-logo.png',
        company_name: 'Main Branch',
        company_address: '123 Main St',
        company_city: 'New York',
        company_state: 'NY',
        company_zipcode: '10001',
        company_telephone: '+1 555-0001',
        company_email: 'main@company.com',
    },
    2: {
        logo_url: '/images/warehouses/warehouse-2-logo.png',
        company_address: '456 West Ave',
        // ... other fields
    }
};
```

## Note
This configuration is separate from Sales/Purchase invoices. 
Make sure to configure the same warehouse IDs in both places:
- Sales/Purchase: `resources/js/utils/warehouseHeaders.ts`
- Quotations: `packages/workdo/Quotation/src/Resources/js/Pages/Quotations/Print.tsx`

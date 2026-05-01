# Warehouse-Specific Headers Configuration

## Overview
This feature allows you to display different company headers (company name, address, contact info, etc.) on invoices and quotations based on the selected warehouse.

## How It Works
- When creating/viewing an invoice or quotation, if a warehouse is selected, the system will use the warehouse-specific header
- If no warehouse is selected or no custom header is configured, it falls back to the default company settings

## Configuration

### Step 1: Open the Configuration File
Navigate to: `resources/js/utils/warehouseHeaders.ts`

### Step 2: Add Warehouse Headers
Edit the `warehouseHeaders` object to add your warehouse-specific information:

```typescript
const warehouseHeaders: Record<number, WarehouseHeader> = {
    // Warehouse ID 1 - Main Branch
    1: {
        company_name: 'Main Branch - Your Company',
        company_address: '123 Main Street',
        company_city: 'New York',
        company_state: 'NY',
        company_zipcode: '10001',
        company_country: 'United States',
        company_telephone: '+1 (555) 123-4567',
        company_email: 'main@yourcompany.com',
        registration_number: 'REG-MAIN-001'
    },
    
    // Warehouse ID 2 - West Coast Branch
    2: {
        company_name: 'West Coast Branch - Your Company',
        company_address: '456 Pacific Avenue',
        company_city: 'Los Angeles',
        company_state: 'CA',
        company_zipcode: '90001',
        company_country: 'United States',
        company_telephone: '+1 (555) 987-6543',
        company_email: 'westcoast@yourcompany.com',
        registration_number: 'REG-WEST-002'
    },
    
    // Add more warehouses as needed...
};
```

### Step 3: Find Your Warehouse IDs
To find your warehouse IDs:
1. Go to your database
2. Check the `warehouses` table
3. Note the `id` column for each warehouse

OR

1. Go to your application's warehouse management page
2. The ID is usually visible in the URL when viewing/editing a warehouse

### Step 4: Test
1. Create a new sales invoice or quotation
2. Select a warehouse that you've configured
3. View the print preview or download PDF
4. The header should show the warehouse-specific information

## Fields Available

All fields are optional. If a field is not provided, it won't be displayed:

- `company_name` - Company/Branch name
- `company_address` - Street address
- `company_city` - City name
- `company_state` - State/Province
- `company_zipcode` - ZIP/Postal code
- `company_country` - Country name
- `company_telephone` - Phone number
- `company_email` - Email address
- `registration_number` - Business registration number

## Example Use Cases

### Multiple Branches
If you have multiple physical locations, each can have its own header:
- Main Office
- Regional Offices
- Distribution Centers

### Different Legal Entities
If different warehouses operate under different legal entities:
- Different company names
- Different registration numbers
- Different tax IDs

### International Operations
For warehouses in different countries:
- Local language company names
- Local addresses and contact information
- Local registration numbers

## Troubleshooting

### Header Not Showing
1. Check that the warehouse ID in the configuration matches the database ID
2. Ensure the invoice/quotation has a warehouse selected
3. Clear your browser cache and rebuild assets: `npm run build`

### Wrong Information Displaying
1. Verify the warehouse ID is correct
2. Check for typos in the configuration
3. Make sure you saved the file after editing

### Default Header Shows Instead
This is normal if:
- No warehouse is selected on the invoice/quotation
- The warehouse ID is not in the configuration
- The system will fall back to default company settings

## Need Help?
If you need assistance:
1. Check that TypeScript compilation is successful
2. Review browser console for any errors
3. Verify the warehouse relationship is properly loaded in the backend

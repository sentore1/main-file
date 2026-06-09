# Stock Report Monetary Value Implementation

## Overview
Added monetary value calculations to stock reports (Opening Stock and Closing Stock) by dynamically calculating values from existing product purchase prices.

## Approach
Instead of storing values in the database, we calculate them **dynamically** using the `purchase_price` field that already exists in the `product_service_items` table. This approach:
- ✅ Requires NO database migration
- ✅ Uses existing product pricing data
- ✅ Automatically updates when product prices change
- ✅ No additional storage needed

## Changes Made

### 1. StockReportController.php
Updated methods to calculate and return monetary values:

#### `listReports()` Method
- Added dynamic calculation of `total_value` for each report
- Formula: `total_value = sum(quantity × product.purchase_price)`

#### `index()` Method  
- Added `total_value` calculation for paginated report listings
- Calculates value by loading products and computing quantity × purchase_price

#### `show()` Method
- Added `unit_value` (purchase price) and `total_value` for each item
- Added `total_value` sum for each category
- Formula per item: `total_value = quantity × product.purchase_price`

#### `comprehensive()` Method
- Added value calculations for:
  - **Opening Stock Value**: `opening_quantity × purchase_price`
  - **Received Stock Value**: `received_quantity × purchase_price`
  - **Issued Stock Value**: `issued_quantity × purchase_price`
  - **Closing Stock Value**: `closing_quantity × purchase_price`

### 2. API Response Structure

#### Stock Report List Response
```json
{
  "date": "2026-06-09",
  "type": "opening",
  "items_count": 39,
  "total_quantity": 476,
  "total_value": 125000.00,  // NEW
  "warehouse": {...},
  "recorded_by": {...}
}
```

#### Stock Report Detail Response
```json
{
  "categories": [
    {
      "name": "Category Name",
      "items": [
        {
          "product_name": "Product A",
          "sku": "SKU001",
          "warehouse": "Warehouse Name",
          "quantity": 10,
          "unit_value": 1500.00,     // NEW - purchase price
          "total_value": 15000.00    // NEW - quantity × unit_value
        }
      ],
      "total_quantity": 476,
      "total_value": 125000.00        // NEW - sum of all item values
    }
  ]
}
```

#### Comprehensive Report Response
```json
{
  "reportData": {
    "Category Name": [
      {
        "product_name": "Product A",
        "opening_stock": 100,
        "opening_stock_value": 50000.00,      // NEW
        "received_stock": 50,
        "received_stock_value": 25000.00,     // NEW
        "issued_stock": 30,
        "issued_stock_value": 15000.00,       // NEW
        "closing_stock": 120,
        "closing_stock_value": 60000.00       // NEW
      }
    ]
  }
}
```

## Frontend Integration

The frontend (React/Inertia components) will need to display these new values:

### Pages to Update:
1. **StockReports/Index.tsx** - Show total_value column in table
2. **StockReports/Show.tsx** - Display unit_value and total_value per item
3. **StockReports/Comprehensive.tsx** - Show all stock value columns

### Example Display Format:
```
Opening Stock: 476 units (RWF 125,000.00)
Closing Stock: 479 units (RWF 127,500.00)
```

## Benefits
1. **No Migration Required** - Works immediately without database changes
2. **Always Current** - Values reflect current product prices
3. **No Data Duplication** - Single source of truth (product.purchase_price)
4. **Flexible** - Can easily switch between purchase_price and sale_price if needed

## Notes
- All monetary calculations use the `purchase_price` field from products
- If a product has no purchase_price set, it defaults to 0
- Values are calculated in real-time when reports are loaded
- Currency formatting should be handled in the frontend

## Testing Checklist
- [ ] Stock report list shows total_value
- [ ] Stock report detail shows unit_value and total_value per item
- [ ] Comprehensive report shows all stock values (opening, received, issued, closing)
- [ ] Values are correctly calculated when products have different prices
- [ ] Zero prices are handled gracefully

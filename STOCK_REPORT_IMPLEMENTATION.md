# Stock Report Implementation with Received Stock

## Overview
Enhanced the Stock Reports system to track **Opening Stock**, **Received Stock**, and **Closing Stock** to provide comprehensive inventory tracking throughout the day.

## Stock Flow Equation
```
Closing Stock = Opening Stock + Received Stock - Issued/Sold Stock
```

## Changes Made

### 1. Database Migration
**File**: `packages/workdo/ProductService/src/Database/Migrations/2026_05_24_000003_add_received_type_to_stock_reports.php`

- Added "received" as a new report type to the `stock_reports` table
- Updated enum: `['opening', 'closing', 'received']`

### 2. Controller Updates
**File**: `packages/workdo/ProductService/src/Http/Controllers/StockReportController.php`

#### Updated `store()` method:
- Added validation for "received" report type
- Changed validation rule: `'report_type' => 'required|in:opening,closing,received'`

#### Added `comprehensive()` method:
- New endpoint for comprehensive stock reports
- Shows Opening + Received - Issued = Closing
- Filters by date range and warehouse
- Groups products by category
- Calculates:
  - **Opening Stock**: Last closing stock before start date
  - **Received Stock**: Sum of all "received" entries in period
  - **Issued/Sold**: Calculated as (Opening + Received - Closing)
  - **Closing Stock**: Closing stock on end date

### 3. Frontend Components

#### Updated Index Page
**File**: `packages/workdo/ProductService/src/Resources/js/Pages/StockReports/Index.tsx`

- Added "Received Stock" to the report type filter dropdown
- Updated report type badge rendering with three colors:
  - **Opening Stock**: Blue badge
  - **Received Stock**: Green badge
  - **Closing Stock**: Orange badge
- Users can now filter and view all three types of reports

#### Updated Create Form
**File**: `packages/workdo/ProductService/src/Resources/js/Pages/StockReports/Create.tsx`

- Added "Received Stock" option to report type dropdown
- Users can now record stock received during the day

#### Updated Show Page
**File**: `packages/workdo/ProductService/src/Resources/js/Pages/StockReports/Show.tsx`

- Added support for displaying "Received Stock" reports
- Updated page title and badge to show correct type with green color for received

#### Updated Print Page
**File**: `packages/workdo/ProductService/src/Resources/js/Pages/StockReports/Print.tsx`

- Added support for printing "Received Stock" reports
- Updated report title to show correct type

#### New Comprehensive Report View
**File**: `packages/workdo/ProductService/src/Resources/js/Pages/StockReports/Comprehensive.tsx`

Features:
- Date range filter (start date to end date)
- Warehouse filter
- Summary cards showing totals:
  - Opening Stock (blue)
  - Received Stock (green, with + sign)
  - Issued/Sold (red, with - sign)
  - Closing Stock (purple)
- Detailed table by category showing all products
- Category subtotals
- Grand totals
- Print functionality

### 4. Routes
**File**: `packages/workdo/ProductService/src/Routes/web.php`

Added new route:
```php
Route::get('/comprehensive', [StockReportController::class, 'comprehensive'])
    ->name('comprehensive');
```

## Usage Workflow

### Daily Stock Recording

1. **Morning - Opening Stock**
   - Create report with type "Opening Stock"
   - Record quantities at start of day
   - Select warehouse (optional)
   - Report appears in index with **blue badge**

2. **During Day - Received Stock**
   - When stock arrives (purchases, transfers, returns)
   - Create report with type "Received Stock"
   - Record received quantities
   - Can create multiple "received" reports throughout the day
   - Each report appears in index with **green badge**

3. **Evening - Closing Stock**
   - Create report with type "Closing Stock"
   - Record actual quantities at end of day
   - System calculates issued/sold automatically
   - Report appears in index with **orange badge**

### Viewing Individual Reports

1. Navigate to Stock Reports index page
2. See all reports listed with color-coded badges:
   - **Blue**: Opening Stock
   - **Green**: Received Stock
   - **Orange**: Closing Stock
3. Filter by:
   - Date
   - Report Type (Opening/Received/Closing)
   - Warehouse
4. Click "View" or "Print" to see report details

### Viewing Comprehensive Reports

1. Navigate to: `/product-service/stock-reports/comprehensive`
2. Select date range (e.g., May 1 - May 31)
3. Optionally filter by warehouse
4. View complete stock movement:
   - Opening balance
   - All received stock
   - Calculated issued/sold
   - Closing balance

## Benefits

1. **Complete Tracking**: Track all stock movements (in and out)
2. **Automatic Calculations**: System calculates issued/sold quantities
3. **Variance Detection**: Identify discrepancies between expected and actual stock
4. **Multiple Receipts**: Record stock received multiple times per day
5. **Warehouse-Specific**: Track by individual warehouse or all warehouses
6. **Category Grouping**: Organized view by product categories
7. **Print Ready**: Comprehensive reports can be printed

## Example Scenario

**Product: Widget A**

- **May 1 Opening**: 100 units
- **May 5 Received**: 50 units (purchase)
- **May 10 Received**: 30 units (transfer in)
- **May 31 Closing**: 120 units

**Calculation**:
- Total Received: 50 + 30 = 80 units
- Issued/Sold: 100 + 80 - 120 = 60 units

The comprehensive report shows:
- Opening: 100
- Received: 80 (green)
- Issued: 60 (red)
- Closing: 120

## Next Steps

1. **Run Migration**:
   ```bash
   php artisan migrate
   ```

2. **Clear Cache**:
   ```bash
   php artisan route:clear
   php artisan config:clear
   ```

3. **Build Frontend**:
   ```bash
   npm run build
   # or for development
   npm run dev
   ```

4. **Test the Feature**:
   - Create opening stock report
   - Create received stock report
   - Create closing stock report
   - View comprehensive report

## Permissions Required

Users need the following permissions:
- `manage-stock-report` - View stock reports
- `create-stock-report` - Create stock reports
- `view-stock-report` - View detailed reports
- `delete-stock-report` - Delete stock reports

## Database Schema

```sql
stock_reports table:
- id
- report_date (date)
- report_type (enum: 'opening', 'closing', 'received')
- product_id (foreign key)
- warehouse_id (nullable, foreign key)
- quantity (decimal 15,2)
- notes (text, nullable)
- recorded_by (foreign key to users)
- created_by (foreign key to users)
- timestamps
```

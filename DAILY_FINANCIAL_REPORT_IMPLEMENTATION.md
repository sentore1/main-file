# Daily Financial Report Implementation

## Overview
Implemented a comprehensive daily financial report similar to the East Gate Hotel format, showing sales by department with payment method breakdowns and expenses.

## Features

### 1. Sales by Department
The report categorizes sales into the following departments:
- **Restaurant Sales** - Food and beverage items
- **Bar Sales** - Alcoholic and bar items
- **Room Sales** - Room bookings
- **Coffee Shop Sales** - Coffee and cafe items
- **Salle Sales** - Hall/Event sales
- **Sauna & Massage Sales** - Spa and wellness services
- **Swimming Pool/Clothes Sales** - Pool and merchandise
- **Gym Sales** - Fitness services
- **Pool Sales** - Billiards/Snooker
- **Services and Others** - Miscellaneous services

### 2. Payment Method Breakdown
Each department shows sales broken down by payment method:
- **MOMO** - Mobile money payments
- **CREDIT** - Credit/charged to room
- **POS BANK** - Card payments
- **ADVANCE** - Advance payments
- **CASH** - Cash payments
- **COMPLEMENTARY** - Complimentary/free items
- **RECOVERY** - Recovered payments
- **EXCEDENT** - Excess payments
- **VISACARD** - Visa card payments
- **BREAKFAST ROOM** - Breakfast included with room

### 3. Summary Totals
- Total Sales
- Total by each payment method
- Total Cash Sales

### 4. Cash Deposit Section
- MOMO from MD
- Advance from Sport Center
- Cash Collection
- Recovery
- Total Cash Available

### 5. Purchases (Expenses by Department)
- Bar purchases (paid/credit)
- Restaurant purchases (paid/credit)
- Maintenance/Office/Reception
- Coffee Shop
- Sport Center
- House Keeping
- Total Purchases Paid

### 6. Other Expenses
- Other expenses paid
- Credit purchases
- Total other expenses

### 7. Closing Balance
Calculated as: Total Cash Available - Total Purchases - Total Other Expenses

## Files Created/Modified

### 1. Route Added
**File:** `packages/workdo/Pos/src/Routes/web.php`
```php
Route::get('/daily-financial', [PosReportController::class, 'dailyFinancial'])->name('daily-financial');
```

### 2. Controller Method
**File:** `packages/workdo/Pos/src/Http/Controllers/PosReportController.php`
- Added `dailyFinancial()` method
- Added `groupSalesByPaymentMethod()` helper
- Added `groupRoomSalesByPaymentMethod()` helper
- Added `getPurchasesForDate()` helper
- Added `getOtherExpensesForDate()` helper

### 3. React Component
**File:** `packages/workdo/Pos/src/Resources/js/Pages/Reports/DailyFinancial.tsx`
- Full report UI matching the PDF format
- Date selector
- PDF download functionality
- Responsive table layout

## How It Works

### Department Categorization
Sales are categorized by product category names:
- Products with categories containing "Restaurant", "Food", "Beverage" → Restaurant Sales
- Products with categories containing "Bar", "Drink", "Alcohol" → Bar Sales
- Products with categories containing "Coffee", "Cafe" → Coffee Shop Sales
- And so on...

### Payment Method Detection
Payment methods are determined by:
1. **Charged to Room**: If `charged_to_room` is true → CREDIT
2. **Bank Account**: Based on bank account name:
   - Contains "momo" or "mobile" → MOMO
   - Contains "pos" or "card" → POS BANK
   - Contains "visa" → VISACARD
   - Default → CASH
3. **No Bank Account**: → CASH

### Room Bookings
Room sales are pulled from the `room_bookings` table and their associated payments.

### Purchases Integration
If the Purchase Invoice module is available, purchases are pulled from `purchase_invoices` table and categorized by product category.

### Expenses Integration
If the Account/Expense module is available, expenses are pulled from the `expenses` table.

## Usage

### Access the Report
Navigate to: `https://your-domain.com/pos/reports/daily-financial`

Or add a menu link in your POS reports section.

### Select Date
Use the date picker in the top right to view reports for different dates.

### Download PDF
Click the "Download PDF" button to generate a PDF version of the report.

## Customization

### Adding New Departments
To add a new department, edit the `dailyFinancial()` method in `PosReportController.php`:

```php
$newDeptSales = Pos::where('created_by', $creatorId)
    ->whereDate('pos_date', $date)
    ->whereHas('items.product', function($q) {
        $q->whereHas('category', function($cat) {
            $cat->where('name', 'LIKE', '%YourCategory%');
        });
    })
    ->with(['items.product.category', 'payment'])
    ->get();

$salesByDepartment['YOUR DEPARTMENT NAME'] = $this->groupSalesByPaymentMethod($newDeptSales);
```

### Modifying Payment Methods
Edit the `groupSalesByPaymentMethod()` method to add or modify payment method detection logic.

### Customizing Report Layout
Edit `packages/workdo/Pos/src/Resources/js/Pages/Reports/DailyFinancial.tsx` to modify the report appearance.

## Requirements

### Required Modules
- POS module (core)
- Product Service module (for categories)

### Optional Modules (for full functionality)
- Account module (for bank accounts and expenses)
- Room Booking module (for room sales)

### Permissions
Users need the `manage-pos-reports` permission to access this report.

## Notes

1. **Product Categories**: Ensure your products are properly categorized for accurate department reporting.

2. **Bank Accounts**: Set up bank accounts with descriptive names (e.g., "MOMO Payment", "POS Card Terminal") for accurate payment method detection.

3. **Date Range**: Currently shows data for a single day. Can be extended to show date ranges if needed.

4. **Performance**: For large datasets, consider adding caching or pagination.

5. **Currency**: Uses the system's default currency format from `formatCurrency()` helper.

## Future Enhancements

1. Add date range selection (weekly, monthly reports)
2. Add comparison with previous periods
3. Add export to Excel functionality
4. Add email scheduling for daily reports
5. Add graphical charts for visual analysis
6. Add drill-down capability to see individual transactions
7. Add budget vs actual comparison
8. Add profit margin calculations

# Tinker Diagnostic Commands for POS Orders

## Step 1: Start Tinker
```bash
php artisan tinker
```

---

## Step 2: Check Database Structure

### Check if 'partial' status exists in pos table
```php
DB::select("SHOW COLUMNS FROM pos WHERE Field = 'status'");
```
**Expected Output**: Should show enum with 'completed', 'pending', 'cancelled', 'partial'
**If 'partial' is missing**: This is the problem!

---

## Step 3: Check Recent POS Orders

### Get last 5 POS orders
```php
\Workdo\Pos\Models\Pos::orderBy('created_at', 'desc')->limit(5)->get(['id', 'sale_number', 'status', 'warehouse_id', 'created_at']);
```
**Check**: Are there any orders? What are their statuses?

### Get total count of POS orders
```php
\Workdo\Pos\Models\Pos::count();
```
**Check**: How many orders exist?

---

## Step 4: Check POS Payments

### Get last 5 POS payments
```php
\Workdo\Pos\Models\PosPayment::orderBy('created_at', 'desc')->limit(5)->get(['id', 'pos_id', 'amount', 'discount_amount', 'paid_amount', 'balance_due', 'created_at']);
```
**Check**: Do payments exist? Are paid_amount and balance_due correct?

### Check if paid_amount and balance_due columns exist
```php
DB::select("SHOW COLUMNS FROM pos_payments WHERE Field IN ('paid_amount', 'balance_due')");
```
**Expected**: Should show both columns
**If missing**: Need to run migration

---

## Step 5: Check for Orders Without Payments

```php
$ordersWithoutPayments = \Workdo\Pos\Models\Pos::doesntHave('payment')->get(['id', 'sale_number', 'created_at']);
echo "Orders without payments: " . $ordersWithoutPayments->count() . "\n";
$ordersWithoutPayments;
```
**Check**: Are there orders without payment records?

---

## Step 6: Check Warehouse Access

### Get current user's accessible warehouses
```php
$warehouseIds = getUserWarehouseIds();
echo "Accessible warehouse IDs: ";
print_r($warehouseIds);
```

### Get all warehouses for current company
```php
\App\Models\Warehouse::where('created_by', creatorId())->get(['id', 'name', 'is_active']);
```

---

## Step 7: Check Migration Status

### Check if partial payment migration has run
```php
DB::table('migrations')->where('migration', 'like', '%update_pos_status_for_partial_payment%')->first();
```
**Expected**: Should return a record
**If null**: Migration hasn't been run

### Check all POS-related migrations
```php
DB::table('migrations')->where('migration', 'like', '%pos%')->get(['id', 'migration', 'batch']);
```

---

## Step 8: Test Payment Calculation Logic

### Simulate payment calculation
```php
$finalAmount = 1000;
$discount = 100;
$paidAmount = 500;

$totalBeforeDiscount = $finalAmount;
$totalAfterDiscount = $finalAmount - $discount;
$balanceDue = $totalAfterDiscount - $paidAmount;

echo "Total Before Discount: " . $totalBeforeDiscount . "\n";
echo "Discount: " . $discount . "\n";
echo "Total After Discount: " . $totalAfterDiscount . "\n";
echo "Paid Amount: " . $paidAmount . "\n";
echo "Balance Due: " . $balanceDue . "\n";

// Determine status
if ($balanceDue > 0 && $paidAmount > 0) {
    $status = 'partial';
} elseif ($balanceDue <= 0) {
    $status = 'completed';
} else {
    $status = 'pending';
}
echo "Status: " . $status . "\n";
```
**Expected Output**:
- Total Before Discount: 1000
- Discount: 100
- Total After Discount: 900
- Paid Amount: 500
- Balance Due: 400
- Status: partial

---

## Step 9: Check Recent Order Details

### Get a specific order with all relationships
```php
$order = \Workdo\Pos\Models\Pos::with(['payment', 'items', 'customer', 'warehouse'])->latest()->first();

if ($order) {
    echo "Order ID: " . $order->id . "\n";
    echo "Sale Number: " . $order->sale_number . "\n";
    echo "Status: " . $order->status . "\n";
    echo "Warehouse: " . ($order->warehouse ? $order->warehouse->name : 'N/A') . "\n";
    echo "Customer: " . ($order->customer ? $order->customer->name : 'Walk-in') . "\n";
    echo "Items Count: " . $order->items->count() . "\n";
    
    if ($order->payment) {
        echo "\nPayment Details:\n";
        echo "  Amount: " . $order->payment->amount . "\n";
        echo "  Discount: " . $order->payment->discount . "\n";
        echo "  Discount Amount: " . $order->payment->discount_amount . "\n";
        echo "  Paid Amount: " . $order->payment->paid_amount . "\n";
        echo "  Balance Due: " . $order->payment->balance_due . "\n";
    } else {
        echo "\nNo payment record found!\n";
    }
} else {
    echo "No orders found in database\n";
}
```

---

## Step 10: Check Dashboard Query

### Simulate dashboard query for today's sales
```php
use Carbon\Carbon;

$today = Carbon::today();
$creatorId = creatorId();
$warehouseIds = getUserWarehouseIds();

$todaySales = DB::table('pos_payments')
    ->join('pos', 'pos_payments.pos_id', '=', 'pos.id')
    ->where('pos.created_by', $creatorId)
    ->whereIn('pos.warehouse_id', $warehouseIds)
    ->whereDate('pos_payments.created_at', $today)
    ->sum('pos_payments.discount_amount');

echo "Today's Sales: " . $todaySales . "\n";
```

### Check total sales count
```php
$totalSales = DB::table('pos_payments')
    ->join('pos', 'pos_payments.pos_id', '=', 'pos.id')
    ->where('pos.created_by', creatorId())
    ->whereIn('pos.warehouse_id', getUserWarehouseIds())
    ->count();

echo "Total Sales Count: " . $totalSales . "\n";
```

---

## Step 11: Check for Errors in Last Order Creation

### Check Laravel log for recent errors
```php
$logFile = storage_path('logs/laravel.log');
if (file_exists($logFile)) {
    $lines = file($logFile);
    $recentLines = array_slice($lines, -50); // Last 50 lines
    
    foreach ($recentLines as $line) {
        if (stripos($line, 'POS') !== false || stripos($line, 'error') !== false) {
            echo $line;
        }
    }
} else {
    echo "Log file not found\n";
}
```

---

## Step 12: Test Creating a Simple POS Order (DRY RUN)

### Check if we can create a POS record (don't save)
```php
$sale = new \Workdo\Pos\Models\Pos();
$sale->sale_number = '#TEST001';
$sale->warehouse_id = 1; // Use your warehouse ID
$sale->pos_date = now()->toDateString();
$sale->status = 'partial'; // Test if 'partial' status works
$sale->creator_id = auth()->id();
$sale->created_by = creatorId();

// Try to validate (don't save yet)
try {
    $sale->validate(); // This will check if the model is valid
    echo "✓ POS model validation passed\n";
    echo "✓ 'partial' status is accepted\n";
} catch (\Exception $e) {
    echo "✗ Validation failed: " . $e->getMessage() . "\n";
}

// Don't save, just test
echo "\nNote: Order not saved, just tested validation\n";
```

---

## Summary Commands (Run All at Once)

```php
// Quick diagnostic
echo "=== POS SYSTEM DIAGNOSTIC ===\n\n";

// 1. Check status column
echo "1. Checking pos.status column:\n";
$statusColumn = DB::select("SHOW COLUMNS FROM pos WHERE Field = 'status'");
print_r($statusColumn);
echo "\n";

// 2. Check orders count
echo "2. Total POS Orders: " . \Workdo\Pos\Models\Pos::count() . "\n\n";

// 3. Check payments count
echo "3. Total POS Payments: " . \Workdo\Pos\Models\PosPayment::count() . "\n\n";

// 4. Check recent order
echo "4. Most Recent Order:\n";
$recent = \Workdo\Pos\Models\Pos::with('payment')->latest()->first();
if ($recent) {
    echo "   Sale Number: " . $recent->sale_number . "\n";
    echo "   Status: " . $recent->status . "\n";
    echo "   Has Payment: " . ($recent->payment ? 'Yes' : 'No') . "\n";
    if ($recent->payment) {
        echo "   Paid Amount: " . $recent->payment->paid_amount . "\n";
        echo "   Balance Due: " . $recent->payment->balance_due . "\n";
    }
} else {
    echo "   No orders found\n";
}
echo "\n";

// 5. Check warehouse access
echo "5. Accessible Warehouses: ";
print_r(getUserWarehouseIds());
echo "\n\n";

// 6. Check migration
echo "6. Partial Payment Migration Status:\n";
$migration = DB::table('migrations')->where('migration', 'like', '%update_pos_status_for_partial_payment%')->first();
echo $migration ? "   ✓ Migration has been run\n" : "   ✗ Migration NOT run\n";
echo "\n";

echo "=== END DIAGNOSTIC ===\n";
```

---

## Exit Tinker
```php
exit
```

---

## What to Look For

### ✅ GOOD Signs:
- Status column includes 'partial'
- Orders and payments exist
- paid_amount and balance_due columns exist
- Migration has been run
- Recent orders have payment records

### ❌ BAD Signs:
- Status column missing 'partial' → Need to run ALTER TABLE
- No orders exist but you created some → Orders failing to save
- Orders exist but no payments → Payment creation failing
- paid_amount/balance_due columns missing → Need to run migration
- Migration not run → Need to run `php artisan migrate`

---

## Next Steps Based on Results

### If status column missing 'partial':
```sql
ALTER TABLE pos MODIFY COLUMN status ENUM('completed', 'pending', 'cancelled', 'partial') DEFAULT 'completed';
```

### If migration not run:
```bash
php artisan migrate
```

### If orders exist but not visible:
Check warehouse filtering and permissions

### If everything looks good:
The issue might be in the frontend or caching - clear caches

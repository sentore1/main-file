# Manual Fix Guide for POS Orders Not Recording (Production Server)

## Step 1: Check Database Status Column

### Option A: Using phpMyAdmin or Database Tool
1. Open your database management tool (phpMyAdmin, Adminer, etc.)
2. Select your database
3. Run this SQL query:

```sql
SHOW COLUMNS FROM pos WHERE Field = 'status';
```

3. Check the "Type" column in the result
4. It should show: `enum('completed','pending','cancelled','partial')`
5. If 'partial' is missing, run this SQL:

```sql
ALTER TABLE pos MODIFY COLUMN status ENUM('completed', 'pending', 'cancelled', 'partial') DEFAULT 'completed';
```

### Option B: Using SSH/Terminal
```bash
mysql -u your_username -p your_database_name
```

Then run:
```sql
SHOW COLUMNS FROM pos WHERE Field = 'status';
```

If 'partial' is missing:
```sql
ALTER TABLE pos MODIFY COLUMN status ENUM('completed', 'pending', 'cancelled', 'partial') DEFAULT 'completed';
EXIT;
```

---

## Step 2: Run Migrations (Recommended)

### Via SSH/Terminal:
```bash
cd /path/to/your/project
php artisan migrate
```

This will automatically apply the migration file:
`2025_09_30_000010_update_pos_status_for_partial_payment.php`

---

## Step 3: Verify the Files Are Updated

Check if these files have the latest code:

### File 1: `packages/workdo/Pos/src/Http/Controllers/PosController.php`

**Check lines 30-42** (index method):
```php
public function index(Request $request)
{
    if(Auth::user()->can('manage-pos-orders')){
        $warehouseIds = getUserWarehouseIds();
        
        // If no warehouse IDs returned, get all warehouses for this company
        if (empty($warehouseIds)) {
            $warehouseIds = Warehouse::where('created_by', creatorId())
                ->pluck('id')
                ->toArray();
        }
        
        $query = Pos::with([...])
            ->withCount('items')
            ->where('created_by', creatorId())
            ->whereIn('warehouse_id', $warehouseIds);
```

**Check lines 240-270** (store method - payment section):
```php
\Log::info('Creating POS Payment', ['sale_id' => $sale->id, 'final_amount' => $finalAmount]);

// Calculate payment amounts correctly
$discount = $validated['discount'] ?? 0;
$totalBeforeDiscount = $finalAmount;
$totalAfterDiscount = $finalAmount - $discount;
$paidAmount = $validated['paid_amount'] ?? 0;
$balanceDue = $totalAfterDiscount - $paidAmount;

$posPayment = new PosPayment();
$posPayment->pos_id = $sale->id;
$posPayment->discount = $discount;
$posPayment->amount = $totalBeforeDiscount;
$posPayment->discount_amount = $totalAfterDiscount;
$posPayment->paid_amount = $paidAmount;
$posPayment->balance_due = $balanceDue;
```

**Check line 280-290** (status update):
```php
// Update sale status based on payment
if ($balanceDue > 0 && $paidAmount > 0) {
    $sale->status = 'partial';
} elseif ($balanceDue <= 0) {
    $sale->status = 'completed';
} else {
    $sale->status = 'pending';
}
$sale->save();
```

**Check line 300** (redirect):
```php
return redirect()->route('pos.orders')->with('success', __('The POS sale has been created successfully.'));
```

---

## Step 4: Clear Caches

### Via SSH/Terminal:
```bash
cd /path/to/your/project
php artisan cache:clear
php artisan config:clear
php artisan view:clear
php artisan route:clear
```

### Via Web (if you have a cache clear route):
Visit: `https://yourdomain.com/clear-cache` (if available)

### Manual Cache Clear:
Delete these directories:
- `bootstrap/cache/*.php` (except `.gitignore`)
- `storage/framework/cache/*` (except `.gitignore`)
- `storage/framework/views/*` (except `.gitignore`)

---

## Step 5: Check Existing Orders

Run this SQL to see if orders exist but aren't showing:

```sql
-- Check recent POS orders
SELECT id, sale_number, status, warehouse_id, created_by, created_at 
FROM pos 
ORDER BY created_at DESC 
LIMIT 10;

-- Check recent POS payments
SELECT id, pos_id, amount, discount_amount, paid_amount, balance_due, created_at 
FROM pos_payments 
ORDER BY created_at DESC 
LIMIT 10;

-- Check if orders have payments
SELECT p.id, p.sale_number, p.status, pp.paid_amount, pp.balance_due
FROM pos p
LEFT JOIN pos_payments pp ON p.id = pp.pos_id
ORDER BY p.created_at DESC
LIMIT 10;
```

---

## Step 6: Test Order Creation

1. **Login to your system**
2. **Go to POS Create page**
3. **Create a test order:**
   - Select warehouse
   - Add 1-2 products
   - Set discount: 0
   - Set paid amount: (less than total for partial payment)
   - Click Checkout
   - Complete the sale

4. **Check if redirected to POS Orders page**
5. **Verify order appears in the list**
6. **Check Dashboard for the order**

---

## Step 7: Check Logs for Errors

### Via SSH/Terminal:
```bash
tail -100 storage/logs/laravel.log
```

Look for these entries:
- ✅ "POS Order Creation Started"
- ✅ "POS Order Created"
- ✅ "Creating POS Payment"
- ✅ "POS Payment Created"
- ✅ "POS Order Status Updated"
- ✅ "POS Order Transaction Committed"

If you see:
- ❌ "POS Order Creation Failed" - Check the error message

### Via FTP/File Manager:
Download and open: `storage/logs/laravel.log`

---

## Step 8: Verify Warehouse Access

Check if user has warehouse access:

```sql
-- Get user's warehouses
SELECT w.id, w.name, w.is_active
FROM warehouses w
WHERE w.created_by = [YOUR_CREATOR_ID]
AND w.is_active = 1;

-- Check user_warehouse table (if exists)
SELECT * FROM user_warehouse WHERE user_id = [YOUR_USER_ID];
```

---

## Common Issues & Quick Fixes

### Issue 1: "SQLSTATE[HY000]: General error: 1265 Data truncated for column 'status'"
**Fix**: Run the ALTER TABLE command from Step 1

### Issue 2: Orders created but not visible
**Fix**: 
- Check warehouse_id in pos table matches user's accessible warehouses
- Run: `SELECT * FROM pos WHERE created_by = [YOUR_CREATOR_ID] ORDER BY created_at DESC LIMIT 5;`

### Issue 3: Payment amounts showing as 0
**Fix**: Check if PosController.php has the updated payment calculation code (Step 3)

### Issue 4: Page doesn't redirect after checkout
**Fix**: Check if line 300 in PosController has `redirect()->route('pos.orders')`

---

## Verification Checklist

- [ ] Database status column includes 'partial'
- [ ] PosController.php has updated code
- [ ] Migrations run successfully
- [ ] All caches cleared
- [ ] Test order created successfully
- [ ] Order visible in POS Orders list
- [ ] Order visible on Dashboard
- [ ] Payment amounts correct (Total, Paid, Balance Due)
- [ ] Status showing correctly (completed/partial/pending)
- [ ] No errors in laravel.log

---

## If Everything Fails

1. **Backup your database**
2. **Check if pos_payments table exists:**
   ```sql
   SHOW TABLES LIKE 'pos_payments';
   ```

3. **Check if paid_amount and balance_due columns exist:**
   ```sql
   SHOW COLUMNS FROM pos_payments;
   ```

4. **If columns are missing, run:**
   ```sql
   ALTER TABLE pos_payments ADD COLUMN paid_amount DECIMAL(10,2) DEFAULT 0 AFTER discount_amount;
   ALTER TABLE pos_payments ADD COLUMN balance_due DECIMAL(10,2) DEFAULT 0 AFTER paid_amount;
   ```

5. **Contact support with:**
   - Last 50 lines of laravel.log
   - Result of: `SELECT * FROM pos ORDER BY created_at DESC LIMIT 1;`
   - Result of: `SELECT * FROM pos_payments ORDER BY created_at DESC LIMIT 1;`

---

## Quick SQL Diagnostic Script

Run this to get a complete overview:

```sql
-- Check table structure
SHOW COLUMNS FROM pos;
SHOW COLUMNS FROM pos_payments;

-- Check recent data
SELECT 'Recent POS Orders' as info;
SELECT id, sale_number, status, warehouse_id, created_at FROM pos ORDER BY created_at DESC LIMIT 5;

SELECT 'Recent POS Payments' as info;
SELECT id, pos_id, amount, discount_amount, paid_amount, balance_due, created_at FROM pos_payments ORDER BY created_at DESC LIMIT 5;

-- Check for orphaned records
SELECT 'Orders without payments' as info;
SELECT p.id, p.sale_number, p.created_at 
FROM pos p 
LEFT JOIN pos_payments pp ON p.id = pp.pos_id 
WHERE pp.id IS NULL 
ORDER BY p.created_at DESC 
LIMIT 5;
```

---

## Need Help?

If you're still having issues after following all steps:
1. Take screenshots of any error messages
2. Copy the last 100 lines from laravel.log
3. Run the SQL diagnostic script above
4. Share the results for further assistance

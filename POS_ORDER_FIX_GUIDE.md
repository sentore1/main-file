# POS Order Not Recording - Diagnostic & Fix Guide

## Problem
POS orders are not being recorded/displayed on the dashboard after checkout.

## Root Causes Identified

### 1. **Missing 'partial' Status in Database**
The `pos` table status enum might not include 'partial' status, causing the transaction to fail.

### 2. **Payment Calculation Logic**
The payment amounts were being calculated incorrectly, defaulting paid_amount to full amount instead of 0.

### 3. **Warehouse Filtering Issues**
Orders might not be visible due to warehouse access restrictions.

## Solutions Applied

### Fix 1: Run the Status Migration
Execute this command to ensure the 'partial' status is added:

```bash
cd e:\eastgate\main-file
php artisan migrate
```

Or run the fix script:
```bash
php fix-pos-status.php
```

### Fix 2: Check Logs
After creating a POS order, check the Laravel log:

```bash
tail -f storage/logs/laravel.log
```

Look for these log entries:
- "POS Order Creation Started"
- "POS Order Created"
- "Creating POS Payment"
- "POS Payment Created"
- "POS Order Status Updated"
- "POS Order Transaction Committed"

If you see "POS Order Creation Failed", check the error message.

### Fix 3: Verify Database Records
Run this SQL query to check if orders are being created:

```sql
SELECT * FROM pos ORDER BY created_at DESC LIMIT 5;
SELECT * FROM pos_payments ORDER BY created_at DESC LIMIT 5;
```

### Fix 4: Check Warehouse Access
Make sure the user has access to the warehouse where the order was created:

```sql
SELECT id, name FROM warehouses WHERE created_by = [your_creator_id];
```

## Testing Steps

1. **Clear Cache**
```bash
php artisan cache:clear
php artisan config:clear
php artisan view:clear
```

2. **Create a Test Order**
   - Go to POS Create page
   - Select a warehouse
   - Add products to cart
   - Complete checkout with partial payment
   - Check if you're redirected to POS Orders page

3. **Verify on Dashboard**
   - Go to POS Dashboard
   - Check if the order appears in "Recent Transactions"
   - Check if sales statistics are updated

4. **Check POS Orders List**
   - Go to POS Orders page
   - Verify the order is listed
   - Check if payment details are correct (Total, Paid, Balance Due)

## Common Issues & Solutions

### Issue 1: "Column 'status' cannot be null"
**Solution**: Run the migration to add 'partial' status
```bash
php artisan migrate
```

### Issue 2: Orders created but not visible
**Solution**: Check warehouse access
- Verify user has access to the warehouse
- Check if `getUserWarehouseIds()` returns correct IDs

### Issue 3: Payment amounts showing as 0
**Solution**: Already fixed in the code
- `paid_amount` now defaults to 0
- `balance_due` calculated correctly

### Issue 4: Transaction fails silently
**Solution**: Check Laravel log for detailed error
```bash
cat storage/logs/laravel.log | grep "POS Order Creation Failed"
```

## Code Changes Made

### 1. PosController.php - store() method
- Added comprehensive logging
- Fixed payment calculation logic
- Set initial status to 'pending'
- Changed redirect from `back()` to `route('pos.orders')`

### 2. PosController.php - index() method
- Added warehouse filtering with `getUserWarehouseIds()`
- Added fallback if no warehouse IDs returned

### 3. PosController.php - show() and print() methods
- Removed overly restrictive permission checks

## Verification Checklist

- [ ] Migration run successfully
- [ ] 'partial' status exists in pos table
- [ ] Test order created successfully
- [ ] Order visible in POS Orders list
- [ ] Order visible on Dashboard
- [ ] Payment amounts correct (Total, Paid, Balance Due)
- [ ] Status showing correctly (completed/partial/pending)
- [ ] No errors in Laravel log

## Next Steps

1. Run `php fix-pos-status.php` to ensure status column is correct
2. Clear all caches
3. Create a test POS order
4. Check Laravel log for any errors
5. Verify order appears on dashboard and orders list

## Support

If issues persist:
1. Check `storage/logs/laravel.log` for detailed errors
2. Run `php check-pos-status.php` to verify database structure
3. Verify user permissions: `manage-pos-orders`, `create-pos`, `view-pos-orders`
4. Check if warehouse is active and user has access

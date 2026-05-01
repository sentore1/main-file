-- ============================================
-- POS Orders Fix - Database Update Script
-- ============================================
-- Run this script in your database to fix POS order recording issues
-- You can run this via phpMyAdmin, Adminer, or MySQL command line

-- Step 1: Check current status column structure
SELECT 'Checking current pos.status column structure...' as step;
SHOW COLUMNS FROM pos WHERE Field = 'status';

-- Step 2: Update status column to include 'partial'
SELECT 'Updating pos.status column to include partial status...' as step;
ALTER TABLE pos MODIFY COLUMN status ENUM('completed', 'pending', 'cancelled', 'partial') DEFAULT 'completed';

-- Step 3: Verify the update
SELECT 'Verifying pos.status column update...' as step;
SHOW COLUMNS FROM pos WHERE Field = 'status';

-- Step 4: Check if pos_payments table has required columns
SELECT 'Checking pos_payments table structure...' as step;
SHOW COLUMNS FROM pos_payments;

-- Step 5: Add paid_amount column if missing (will fail if exists, that's OK)
SELECT 'Adding paid_amount column if missing...' as step;
ALTER TABLE pos_payments ADD COLUMN IF NOT EXISTS paid_amount DECIMAL(10,2) DEFAULT 0 AFTER discount_amount;

-- Step 6: Add balance_due column if missing (will fail if exists, that's OK)
SELECT 'Adding balance_due column if missing...' as step;
ALTER TABLE pos_payments ADD COLUMN IF NOT EXISTS balance_due DECIMAL(10,2) DEFAULT 0 AFTER paid_amount;

-- Step 7: Verify pos_payments structure
SELECT 'Verifying pos_payments table structure...' as step;
SHOW COLUMNS FROM pos_payments;

-- Step 8: Check recent POS orders
SELECT 'Checking recent POS orders...' as step;
SELECT id, sale_number, status, warehouse_id, customer_id, created_by, created_at 
FROM pos 
ORDER BY created_at DESC 
LIMIT 10;

-- Step 9: Check recent POS payments
SELECT 'Checking recent POS payments...' as step;
SELECT id, pos_id, amount, discount, discount_amount, paid_amount, balance_due, created_at 
FROM pos_payments 
ORDER BY created_at DESC 
LIMIT 10;

-- Step 10: Check for orders without payments
SELECT 'Checking for orders without payments...' as step;
SELECT p.id, p.sale_number, p.status, p.created_at 
FROM pos p 
LEFT JOIN pos_payments pp ON p.id = pp.pos_id 
WHERE pp.id IS NULL 
ORDER BY p.created_at DESC 
LIMIT 10;

-- Step 11: Check for payments with incorrect amounts
SELECT 'Checking for payments with potential issues...' as step;
SELECT pp.id, pp.pos_id, pp.amount, pp.discount_amount, pp.paid_amount, pp.balance_due,
       CASE 
           WHEN pp.paid_amount = 0 AND pp.balance_due = 0 THEN 'Both zero - possible issue'
           WHEN pp.paid_amount > pp.discount_amount THEN 'Paid more than total - issue'
           WHEN pp.balance_due < 0 THEN 'Negative balance - issue'
           ELSE 'OK'
       END as status_check
FROM pos_payments pp
ORDER BY pp.created_at DESC 
LIMIT 10;

-- ============================================
-- Summary
-- ============================================
SELECT '============================================' as summary;
SELECT 'Database structure update completed!' as summary;
SELECT 'Next steps:' as summary;
SELECT '1. Clear application cache (php artisan cache:clear)' as summary;
SELECT '2. Create a test POS order' as summary;
SELECT '3. Check if order appears in POS Orders list' as summary;
SELECT '4. Check if order appears on Dashboard' as summary;
SELECT '============================================' as summary;

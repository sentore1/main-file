# Custom Price Fix - Testing Guide

## Problem Fixed
The POS system was ignoring custom prices edited with the pencil icon and always using the database price.

## Changes Made
**File:** `packages/workdo/Pos/src/Http/Controllers/PosController.php`

**Line 484-486:** Changed from:
```php
// Use the actual product price from database, not from frontend
$actualPrice = (float) $product->sale_price;
```

To:
```php
// Use custom price from frontend if provided, otherwise use database price
$actualPrice = isset($item['price']) && $item['price'] > 0 
    ? (float) $item['price'] 
    : (float) $product->sale_price;
```

## How to Test

### Scenario 1: Price Increase with Partial Payment
1. Go to POS Create page: https://pryro.eastgatehotel.rw/pos/create
2. Add "Toilet paper" (original price: 500 RWF) to cart
3. Click the pencil icon next to the price
4. Change price from 500 to 600 RWF
5. Click the checkmark to save
6. Enter paid amount: 200 RWF
7. Complete the order

**Expected Result:**
- Total: 600 RWF
- Paid: 200 RWF
- Balance: 400 RWF (not 300 RWF)

### Scenario 2: Verify on Orders Page
1. Go to: https://pryro.eastgatehotel.rw/pos/orders
2. Find the order you just created
3. Check the Balance column

**Expected Result:**
- Should show 400.00Fr in orange

### Scenario 3: Add Additional Payment
1. On the orders page, click the dollar sign icon to add payment
2. Add 100 RWF payment
3. Check the new balance

**Expected Result:**
- New Balance: 300 RWF (400 - 100)

## Answer to Your Question

**Q:** If price was 500, increased to 600, and user paid 200, what will be the balance?

**A:** The balance will be **400 RWF** (600 - 200)

The system now correctly:
1. Uses the custom price (600) when you edit it with the pencil
2. Calculates balance as: Total (600) - Paid (200) = Balance (400)
3. Displays the correct balance on /pos/orders page

## Clear Cache
After making these changes, clear the cache:
```bash
php artisan cache:clear
php artisan config:clear
php artisan route:clear
```

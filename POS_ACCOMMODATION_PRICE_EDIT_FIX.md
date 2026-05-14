# POS Accommodation Price Edit Fix

## Problem Identified

When editing room prices in the POS system using the pen icon, the custom price was being **ignored** by the backend.

### What Was Happening

**Frontend (Working Correctly):**
- ✅ User clicks pen icon to edit room price
- ✅ Custom price stored in cart as `customPrice`
- ✅ Custom price sent to backend in request

**Backend (BUG):**
- ❌ Backend ignored the custom price from frontend
- ❌ Always used `$room->price_per_night` from database
- ❌ Custom price was lost

### Examples

**Scenario 1: Increase Price**
- Room database price: 100,000 Fr
- User edits to: 150,000 Fr
- **Before fix:** Saved as 100,000 Fr ❌
- **After fix:** Saved as 150,000 Fr ✅

**Scenario 2: Decrease Price (Discount)**
- Room database price: 100,000 Fr
- User edits to: 80,000 Fr
- **Before fix:** Saved as 100,000 Fr ❌
- **After fix:** Saved as 80,000 Fr ✅

## Solution Applied

Modified `packages/workdo/Pos/src/Http/Controllers/PosController.php`:

### Change 1: Use Custom Price in Calculation
```php
// Use custom price from frontend if provided, otherwise use database price
$actualPrice = isset($item['price']) && $item['price'] > 0 
    ? (float) $item['price'] 
    : (float) $room->price_per_night;

$subtotal = $nights * $actualPrice;
```

### Change 2: Save Custom Price to Database
```php
$saleItem->price = $actualPrice; // Use custom price if edited, otherwise database price
```

### Change 3: Enhanced Logging
```php
\Log::info('Room POS Item Saved', [
    'item_id' => $saleItem->id, 
    'db_price' => $room->price_per_night,
    'custom_price' => $item['price'] ?? null,
    'actual_price_used' => $actualPrice
]);
```

## What Gets Saved Now

### POS Order (pos_items table)
- `price`: The edited price (or database price if not edited)
- `quantity`: Number of nights
- `subtotal`: price × nights
- `total_amount`: subtotal + tax

### Room Booking (room_bookings table)
- `subtotal`: Calculated using the edited price
- `total_amount`: Reflects the edited price

### Room Booking Payment (room_booking_payments table)
- `amount_paid`: Based on the edited price

### Revenue Entry (revenues table)
- `amount`: Based on the edited price

## Testing

To verify the fix works:

1. Go to POS → Accommodation
2. Add a room to cart (e.g., 100,000 Fr)
3. Click the pen icon next to the price
4. Change to 150,000 Fr
5. Complete the checkout
6. Check the receipt - should show 150,000 Fr
7. Check database `pos_items` table - `price` should be 150,000

## Impact

- ✅ Price increases now work correctly
- ✅ Price decreases (discounts) now work correctly
- ✅ Consistent with how product price editing works
- ✅ All related records (bookings, payments, revenue) use the correct price
- ✅ No breaking changes to existing functionality

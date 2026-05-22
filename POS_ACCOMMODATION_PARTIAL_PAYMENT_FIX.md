# POS Accommodation Partial Payment Fix

## Issues Fixed

### Issue 1: Room Booking Payment Always Shows Full Amount (Even for Partial Payments)

**Problem:**
When booking a room through POS Accommodation with a partial payment:
- POS Order correctly shows: Status = "partial", Paid = 50,000 Fr, Balance = 50,000 Fr ✅
- Room Booking Payment incorrectly shows: Paid = 100,000 Fr (full amount) ❌

**Root Cause:**
In `PosController.php` line 437, the room booking payment was hardcoded to always record the full amount:
```php
$bookingPayment->amount_paid = $totalAmount; // ❌ Always full amount
```

**Solution:**
1. Initially set `amount_paid = 0` when creating the booking payment
2. After calculating the POS payment, update room booking payments proportionally based on actual amount paid
3. For partial payments: distribute the paid amount proportionally across all room bookings
4. For full payments: set each room booking payment to its full amount

**Files Modified:**
- `packages/workdo/Pos/src/Http/Controllers/PosController.php`

**Changes:**
- Lines 428-438: Changed initial booking payment to `amount_paid = 0` (temporary)
- Lines 589-650: Added logic to update room booking payments after POS payment calculation
  - Handles partial payments proportionally
  - Handles full payments correctly
  - Logs payment updates for debugging

---

### Issue 2: POS Order Detail View Shows Wrong Item Names for Rooms

**Problem:**
When viewing a POS order (clicking the eye icon) that contains room bookings:
- The item name shows as "pasta" or other product names instead of "Room 201" ❌
- This happens because the view was looking for `item.product.name` but the controller sets `item.display_name`

**Root Cause:**
Mismatch between controller and view:
- **Controller** (line 670-678): Sets `display_name`, `display_sku`, `display_category`
- **View** (line 230): Only reads `item.product.name` (ignores display fields)

**Solution:**
Updated the POS Order Show view to prioritize display fields:
```tsx
{item.display_name || item.product?.name || 'Unknown Item'}
```

**Files Modified:**
- `packages/workdo/Pos/src/Resources/js/Pages/PosOrder/Show.tsx`

**Changes:**
- Lines 12-44: Updated `PosItem` interface to include:
  - `item_type?: string`
  - `display_name?: string`
  - `display_sku?: string`
  - `display_category?: string`
  - `room?: { ... }` (room relationship)
  - Made `product` optional (since rooms don't have products)

- Lines 229-248: Updated item display logic:
  - Uses `display_name` first, falls back to `product.name`
  - Uses `display_sku` first, falls back to `product.sku`
  - Shows `display_category` as a badge (e.g., "Deluxe Room")
  - Handles both room and product items correctly

---

## Testing Scenarios

### Scenario 1: Full Payment via POS Accommodation
```
Room Total: 100,000 Fr
User Pays: 100,000 Fr (Full)

Expected Results:
✅ POS Order Status: "completed"
✅ POS Payment: Paid = 100,000 Fr, Balance = 0 Fr
✅ Room Booking Payment: Paid = 100,000 Fr
✅ POS Order Detail: Shows "Room 201" (not "pasta")
```

### Scenario 2: Partial Payment via POS Accommodation
```
Room Total: 100,000 Fr
User Pays: 50,000 Fr (Partial)

Expected Results:
✅ POS Order Status: "partial"
✅ POS Payment: Paid = 50,000 Fr, Balance = 50,000 Fr
✅ Room Booking Payment: Paid = 50,000 Fr (FIXED!)
✅ POS Order Detail: Shows "Room 201" (FIXED!)
```

### Scenario 3: Multiple Rooms with Partial Payment
```
Room 1: 100,000 Fr
Room 2: 150,000 Fr
Total: 250,000 Fr
User Pays: 100,000 Fr (Partial)

Expected Results:
✅ POS Order Status: "partial"
✅ POS Payment: Paid = 100,000 Fr, Balance = 150,000 Fr
✅ Room 1 Booking Payment: Paid = 40,000 Fr (proportional: 100k * 100k/250k)
✅ Room 2 Booking Payment: Paid = 60,000 Fr (proportional: 100k * 150k/250k)
✅ POS Order Detail: Shows "Room 201" and "Room 202"
```

### Scenario 4: Mixed Cart (Room + Products) with Partial Payment
```
Room: 100,000 Fr
Product (Pasta): 10,000 Fr
Total: 110,000 Fr
User Pays: 55,000 Fr (Partial - 50%)

Expected Results:
✅ POS Order Status: "partial"
✅ POS Payment: Paid = 55,000 Fr, Balance = 55,000 Fr
✅ Room Booking Payment: Paid = 50,000 Fr (proportional: 55k * 100k/110k)
✅ POS Order Detail: Shows "Room 201" and "Pasta"
```

---

## How It Works Now

### Payment Flow for Room Bookings via POS

1. **User adds room to POS cart** (e.g., Room 201, 2 nights, 100,000 Fr)

2. **User enters partial payment** (e.g., 50,000 Fr)

3. **System creates:**
   - Room Booking record (total = 100,000 Fr)
   - Room Booking Payment (amount_paid = 0, temporarily)
   - POS Order (status = pending)
   - POS Items (item_type = 'room', display_name = 'Room 201')

4. **System calculates POS payment:**
   - Total = 100,000 Fr
   - Paid = 50,000 Fr
   - Balance = 50,000 Fr
   - Status = 'partial'

5. **System updates Room Booking Payment:**
   - Calculates proportion: 50,000 / 100,000 = 50%
   - Updates amount_paid = 50,000 Fr ✅

6. **User views POS order:**
   - Sees "Room 201" (not "pasta") ✅
   - Sees correct payment: Paid = 50,000 Fr, Balance = 50,000 Fr ✅

---

## Benefits

1. **Accurate Financial Records**: Room booking payments now reflect actual amounts paid
2. **Correct Display**: POS order details show room names instead of wrong product names
3. **Proportional Distribution**: Partial payments are distributed correctly across multiple rooms
4. **Audit Trail**: Detailed logging for debugging payment calculations
5. **Backward Compatible**: Full payments still work as before

---

## Related Files

### Backend
- `packages/workdo/Pos/src/Http/Controllers/PosController.php` - Payment calculation logic
- `packages/workdo/Pos/src/Models/RoomBooking.php` - Room booking model
- `packages/workdo/Pos/src/Models/RoomBookingPayment.php` - Payment model
- `packages/workdo/Pos/src/Models/Pos.php` - POS order model
- `packages/workdo/Pos/src/Models/PosItem.php` - POS item model

### Frontend
- `packages/workdo/Pos/src/Resources/js/Pages/PosOrder/Show.tsx` - POS order detail view

---

## Deployment Notes

1. **No database migration required** - Uses existing fields
2. **No breaking changes** - Backward compatible with existing data
3. **Test thoroughly** with various payment scenarios before production deployment
4. **Monitor logs** for payment calculation details (search for "Updated Room Booking Payment")

---

## Future Enhancements

1. Add ability to make additional payments on partial bookings
2. Show payment history for room bookings
3. Add payment status indicator on room booking list
4. Generate payment receipts showing partial payment details

# Room Booking & POS Integration - Final Solution

## The Real Problem (Based on Your Screenshots)

### Screenshot 1: POS Order #POS00335
- Shows "Ordinary Breakfast (Omelet, Snaks, Tea)" 
- Quantity: 2.00
- Unit Price: 25,000.00Fr
- Total: 50,000.00Fr
- Status: PARTIAL (20,000 paid, 30,000 balance)

### Screenshot 2: Room Bookings List
- Shows many room bookings (#BOOK10472, #BOOK10471, etc.)
- Room bookings have their own totals and status
- No visible connection to POS orders

## What's Happening

You have **TWO SEPARATE SYSTEMS** that are getting mixed up:

1. **Room Booking System** - For reserving rooms
2. **POS System** - For selling products (food, drinks, etc.)

The confusion happens when:
- A guest books a room → Creates Room Booking
- Guest orders breakfast → Should charge to room booking, but creates POS order instead
- POS order shows wrong items because of ID conflicts

## The Correct Solution

### Option A: Keep Them Completely Separate (RECOMMENDED)

**Room Bookings:**
- Only for room reservations
- Has its own charges table for extras (breakfast, minibar, etc.)
- Shows complete bill with all charges
- Has its own payment tracking

**POS Orders:**
- Only for restaurant/bar direct sales
- Can optionally "charge to room" which adds to room booking charges
- Does NOT duplicate room booking data

### Option B: Your Suggestion (Also Valid)

> "Can we keep POS order with normal orders and then room booking update it with adding those credit on it?"

YES! This means:
1. Room Booking stays in Room Booking module
2. When guest orders food/drinks → Create POS order
3. If "charged to room" → Add as a charge/credit to the room booking
4. Room booking shows: Room charges + POS charges = Total bill

## Implementation of Option B (Your Preferred Solution)

### Step 1: Create Room Booking Charges Table

```sql
CREATE TABLE room_booking_charges (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    booking_id BIGINT UNSIGNED NOT NULL,
    charge_type ENUM('room', 'breakfast', 'minibar', 'laundry', 'restaurant', 'bar', 'other') DEFAULT 'other',
    description VARCHAR(255) NOT NULL,
    quantity DECIMAL(8,2) DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    pos_id BIGINT UNSIGNED NULL,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,
    creator_id BIGINT UNSIGNED NULL,
    created_by BIGINT UNSIGNED NOT NULL,
    
    FOREIGN KEY (booking_id) REFERENCES room_bookings(id) ON DELETE CASCADE,
    FOREIGN KEY (pos_id) REFERENCES pos(id) ON DELETE SET NULL
);
```

### Step 2: Stop Creating POS Orders for Room Bookings

Remove the room booking logic from `PosController@store()`.

Room bookings should ONLY be created in `RoomBookingController`.

### Step 3: Update Room Booking to Show All Charges

When viewing a room booking, show:

**Room Charges:**
- Room 102 × 2 nights @ 25,000Fr = 50,000Fr

**Additional Charges:**
- Breakfast (from POS #POS00335) = 50,000Fr
- Minibar (from POS #POS00340) = 15,000Fr

**Total: 115,000Fr**
**Paid: 20,000Fr**
**Balance: 95,000Fr**

### Step 4: Update POS "Charge to Room" Feature

When creating a POS order with "charged_to_room":

```php
// 1. Create POS order (for restaurant records)
$pos = new Pos();
$pos->customer_id = $customerId;
$pos->room_booking_id = $roomBookingId;
$pos->charged_to_room = true;
$pos->status = 'charged_to_room';
$pos->save();

// 2. Add items to POS
foreach ($items as $item) {
    $posItem = new PosItem();
    $posItem->pos_id = $pos->id;
    $posItem->product_id = $item['id'];
    $posItem->item_type = 'product'; // Always product for POS
    // ... other fields
    $posItem->save();
}

// 3. Add charge to room booking
$charge = new RoomBookingCharge();
$charge->booking_id = $roomBookingId;
$charge->charge_type = 'restaurant'; // or 'bar'
$charge->description = "POS Order {$pos->sale_number}";
$charge->quantity = 1;
$charge->unit_price = $totalAmount;
$charge->total_amount = $totalAmount;
$charge->pos_id = $pos->id;
$charge->save();

// 4. Update room booking total
$roomBooking = RoomBooking::find($roomBookingId);
$roomBooking->total_amount += $totalAmount;
$roomBooking->save();
```

## Benefits of This Approach

1. ✅ **Clear Separation**: Room bookings and POS orders are distinct
2. ✅ **No ID Conflicts**: POS items only reference products, never rooms
3. ✅ **Complete Bill**: Room booking shows all charges in one place
4. ✅ **Audit Trail**: POS orders track what was sold, room charges track what guest owes
5. ✅ **Flexible**: Can charge items to room or sell directly

## What You'll See After Fix

### Room Booking View (#BOOK10472)
```
Room Booking #BOOK10472
Customer: Jean
Room: 102 (Standard Room)
Check-in: 2026-05-14
Check-out: 2026-05-16
Nights: 2

CHARGES:
- Room charges (2 nights @ 25,000Fr)     50,000.00Fr
- Breakfast (POS #POS00335)              50,000.00Fr
- Minibar (POS #POS00340)                15,000.00Fr
                                    ----------------
SUBTOTAL:                               115,000.00Fr
DISCOUNT:                                     0.00Fr
                                    ----------------
TOTAL:                                  115,000.00Fr

PAYMENTS:
- 2026-05-14 (Cash)                      20,000.00Fr
                                    ----------------
BALANCE DUE:                             95,000.00Fr
```

### POS Order View (#POS00335)
```
POS Order #POS00335
Customer: Jean
Charged to Room: #BOOK10472
Date: 2026-05-14

ITEMS:
- Ordinary Breakfast (Omelet, Snaks, Tea)
  Qty: 2.00 @ 25,000.00Fr              50,000.00Fr
                                    ----------------
TOTAL:                                  50,000.00Fr

STATUS: Charged to Room #BOOK10472
(Payment will be collected with room bill)
```

## Migration Steps

1. Create `room_booking_charges` table
2. Remove room creation logic from POS controller
3. Update `RoomBookingController@show()` to display all charges
4. Update `PosController@store()` to add charges when `charged_to_room = true`
5. Migrate existing data (optional)

## Files to Modify

1. Create: `packages/workdo/Pos/src/Database/Migrations/2026_05_14_000002_create_room_booking_charges_table.php`
2. Create: `packages/workdo/Pos/src/Models/RoomBookingCharge.php`
3. Update: `packages/workdo/Pos/src/Http/Controllers/PosController.php`
4. Update: `packages/workdo/Pos/src/Http/Controllers/RoomBookingController.php`
5. Update: Room Booking view (frontend)

Would you like me to implement this solution?

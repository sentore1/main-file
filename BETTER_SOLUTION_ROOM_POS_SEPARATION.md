# Better Solution: Separate Room Bookings from POS Orders

## Current Confusing Flow

1. Guest books Room 102 for 2 nights → Creates Room Booking #BOOK10472
2. System ALSO creates POS Order #POS00335 (WHY?)
3. Guest orders breakfast → Shows as "Ordinary Breakfast" in POS
4. Room Booking doesn't show the breakfast charge

## Proposed Better Flow

### Option 1: Room Bookings Stay Separate (RECOMMENDED)

**Room Bookings Module:**
- Handles room reservations ONLY
- Shows room charges (nights × price)
- Shows additional charges (breakfast, minibar, laundry) as line items
- Has its own payment tracking

**POS Module:**
- Handles restaurant/bar sales ONLY
- Can "charge to room" which adds a line item to the room booking
- Does NOT create duplicate records for room bookings

**Benefits:**
- Clear separation of concerns
- Room bookings show all charges in one place
- POS orders are only for direct sales
- No confusion with wrong product names

### Option 2: Unified Billing (Alternative)

Keep POS as the main billing system, but:
- Room bookings create a special "Room Service" product category
- All room-related charges go through POS
- Room Booking module is just for reservation management

## Implementation Plan for Option 1 (Recommended)

### Step 1: Stop Creating POS Orders for Room Bookings

Remove the POS order creation from room booking process.

### Step 2: Add Charges Table for Room Bookings

Create `room_booking_charges` table:
- booking_id
- charge_type (room, breakfast, minibar, laundry, restaurant, bar, etc.)
- description
- quantity
- unit_price
- total_amount
- pos_id (if charged from POS)
- created_at

### Step 3: Update Room Booking to Show All Charges

Room Booking view shows:
- Room charges (nights × price)
- Additional charges (breakfast, etc.)
- POS charges (items charged to room)
- Total amount
- Payments made
- Balance due

### Step 4: Update POS "Charge to Room" Feature

When charging items to a room:
1. Create POS order (for restaurant/bar records)
2. Create charge entry in room_booking_charges
3. Update room booking balance

This way:
- POS has record of what was sold
- Room booking has record of what guest owes
- No duplicate/confusing records

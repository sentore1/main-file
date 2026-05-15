# Accommodation Booking & POS Integration Explanation

## Your Question
When a room is booked with a partial payment in the accommodation module, and then you go to POS orders, you see the transaction registered there. When you click "View More" on that transaction, you see items like "pasta" instead of the room booking. Why?

## The Answer: Two Different Scenarios

### Scenario 1: Room Booking Creates a POS Order (What You're Seeing)

When you book a room through the **Room Booking** module:

1. **Room Booking Record Created** (`room_bookings` table)
   - Booking number: e.g., #BOOK00013
   - Room details, dates, nights, guests
   - Total amount, payment status
   - Status: 'confirmed', 'checked_in', etc.

2. **Room Booking Payment Created** (`room_booking_payments` table)
   - Links to the booking
   - Records the payment method and amount paid
   - Can be partial or full payment

3. **POS Order is ALSO Created** (`pos` table)
   - Sale number: e.g., #POS00333
   - Links to the room booking via `room_booking_id`
   - Status: 'completed', 'partial', or 'charged_to_room'

4. **POS Item Created** (`pos_items` table)
   - `product_id` = Room ID (from `rooms` table)
   - Quantity = Number of nights
   - Price = Price per night
   - **IMPORTANT**: The `product_id` references the `rooms` table, NOT the `product_service_items` table

### Why You See "Pasta" or Other Products

**The Problem**: The POS system has a design flaw in how it displays items.

Looking at the code in `PosController.php` show method (line 650-653):

```php
$sale->load([
    'items:id,pos_id,product_id,quantity,price,subtotal,tax_ids,tax_amount,total_amount,notes',
    'items.product:id,name,sku',  // <-- This assumes product_id is from product_service_items
    'payment:pos_id,discount,amount,discount_amount,paid_amount,balance_due'
]);
```

And in `PosItem.php` model (line 44-47):

```php
public function product(): BelongsTo
{
    return $this->belongsTo(ProductServiceItem::class, 'product_id');
}
```

**The Issue**:
- When a room is booked, the `pos_items.product_id` stores the **Room ID** (from `rooms` table)
- But the relationship `product()` always looks in the `product_service_items` table
- If there happens to be a product with the same ID as the room (e.g., Room ID = 5, Product ID = 5 for "Pasta"), it will display "Pasta" instead of the room information

### Example:

```
Room: ID = 5, Room Number = "201", Price = 23,400.00Fr
Product: ID = 5, Name = "Pasta", SKU = "PASTA-001", Price = 5,000.00Fr

When you book Room 201:
- pos_items.product_id = 5 (Room ID)
- But PosItem->product() looks for ProductServiceItem with ID = 5
- Finds "Pasta" and displays it instead of "Room 201"
```

## Scenario 2: Charging Items to a Room (Different Use Case)

There's also a feature where you can charge restaurant/bar items to a guest's room:

1. Guest is staying in a room (has an active booking)
2. Guest orders food/drinks at the restaurant/bar
3. Instead of paying immediately, they charge it to their room
4. A POS order is created with:
   - `room_booking_id` = The guest's booking ID
   - `charged_to_room` = true
   - Status = 'charged_to_room'
   - Items = Actual products (pasta, drinks, etc.)

In this case, the items ARE supposed to be products like "pasta" because they're restaurant orders charged to the room bill.

## The Solution Needed

The system needs to differentiate between:

1. **Room Booking POS Orders**: Where `product_id` references `rooms` table
2. **Regular POS Orders**: Where `product_id` references `product_service_items` table
3. **Charged-to-Room Orders**: Where `product_id` references `product_service_items` but is linked to a room booking

### Recommended Fixes:

1. **Add a type field to `pos_items` table**:
   ```php
   $table->enum('item_type', ['product', 'room', 'service'])->default('product');
   ```

2. **Update the PosItem model** to handle polymorphic relationships:
   ```php
   public function itemable()
   {
       if ($this->item_type === 'room') {
           return $this->belongsTo(Room::class, 'product_id');
       }
       return $this->belongsTo(ProductServiceItem::class, 'product_id');
   }
   ```

3. **Update the display logic** to show the correct item name based on type

## Current Workaround

Until the fix is implemented, you can identify room bookings in POS orders by:

1. Check if `pos.room_booking_id` is not null
2. Check if `pos.status` = 'charged_to_room' (for items charged to room)
3. Look at the quantity - if it matches the number of nights, it's likely a room booking
4. Check the price - if it matches room rates, it's a room booking

## Summary

**What you're seeing**: Room bookings create POS orders, but due to a database relationship issue, the system displays the wrong product name (like "pasta") when the Room ID coincidentally matches a Product ID.

**Why it happens**: The `pos_items.product_id` can reference either `rooms` or `product_service_items`, but the model relationship only looks in `product_service_items`.

**The fix needed**: Add an item type field to distinguish between rooms and products, and update the relationships accordingly.

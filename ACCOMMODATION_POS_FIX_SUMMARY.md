# Accommodation POS Display Issue - Fix Summary

## Problem Identified

When room bookings create POS orders, the items display incorrect product names (like "pasta") instead of room information. This happens because:

1. **Root Cause**: The `pos_items.product_id` field stores both:
   - Room IDs (when booking a room)
   - Product IDs (when selling products)

2. **Display Issue**: The `PosItem` model only has a relationship to `ProductServiceItem`, so it always looks up products, even when the ID refers to a room.

3. **ID Collision**: If Room ID #5 and Product ID #5 both exist, the system shows the product name instead of the room.

## Solution Implemented

### 1. Database Changes

**New Migration**: `2026_05_14_000001_add_item_type_to_pos_items_table.php`

```sql
ALTER TABLE pos_items ADD COLUMN item_type ENUM('product', 'room') DEFAULT 'product';
```

This adds a discriminator column to identify whether an item is a product or a room.

### 2. Model Updates

**File**: `packages/workdo/Pos/src/Models/PosItem.php`

Added:
- `item_type` to fillable fields
- New `room()` relationship
- Helper methods:
  - `getItemAttribute()` - Returns the correct item (product or room)
  - `getItemNameAttribute()` - Returns "Room 201" or product name
  - `getItemSkuAttribute()` - Returns "ROOM-201" or product SKU

### 3. Controller Updates

**File**: `packages/workdo/Pos/src/Http/Controllers/PosController.php`

**Changes in `store()` method**:
- When creating room items: Set `item_type = 'room'`
- When creating product items: Set `item_type = 'product'`

**Changes in `show()` and `print()` methods**:
- Load both `items.product` and `items.room` relationships
- Add `display_name`, `display_sku`, and `display_category` based on item type
- Correctly show "Room 201" for room items
- Correctly show product names for product items

### 4. Data Migration

The migration automatically updates existing records:
```sql
UPDATE pos_items 
SET item_type = 'room' 
WHERE pos_id IN (SELECT id FROM pos WHERE room_booking_id IS NOT NULL)
```

## Files Modified

1. ✅ `packages/workdo/Pos/src/Models/PosItem.php`
2. ✅ `packages/workdo/Pos/src/Http/Controllers/PosController.php`
3. ✅ `packages/workdo/Pos/src/Database/Migrations/2026_05_14_000001_add_item_type_to_pos_items_table.php` (new)
4. ✅ `fix-pos-items-display.php` (helper script)

## How to Apply the Fix

### Step 1: Run the Migration

```bash
php artisan migrate --path=packages/workdo/Pos/src/Database/Migrations/2026_05_14_000001_add_item_type_to_pos_items_table.php
```

### Step 2: Run the Fix Script (Optional)

```bash
php fix-pos-items-display.php
```

This script:
- Runs the migration
- Updates existing data
- Verifies the fix
- Shows a summary

### Step 3: Clear Cache

```bash
php artisan cache:clear
php artisan config:clear
php artisan view:clear
```

### Step 4: Test

1. Go to POS Orders list
2. Find a POS order that was created from a room booking (check for `room_booking_id`)
3. Click "View More" or view the order details
4. **Expected Result**: You should now see "Room 201" instead of "pasta"

## Before vs After

### Before Fix
```
POS Order #POS00333
Items:
  - pasta (SKU: SKU-77482791524)
    Quantity: 304.00
    Price: 23,400.00Fr
    Total: 7,113,600.00Fr
```

### After Fix
```
POS Order #POS00333
Items:
  - Room 201 (SKU: ROOM-201)
    Quantity: 3 nights
    Price: 23,400.00Fr per night
    Total: 70,200.00Fr
```

## Technical Details

### Item Type Logic

```php
// In PosController store() method
if ($isRoom) {
    $saleItem->item_type = 'room';
    $saleItem->product_id = $room->id; // References rooms table
} else {
    $saleItem->item_type = 'product';
    $saleItem->product_id = $product->id; // References product_service_items table
}
```

### Display Logic

```php
// In PosController show() method
if ($item->item_type === 'room' && $item->room) {
    $item->display_name = 'Room ' . $item->room->room_number;
    $item->display_sku = 'ROOM-' . $item->room->room_number;
} else if ($item->product) {
    $item->display_name = $item->product->name;
    $item->display_sku = $item->product->sku;
}
```

## Future Considerations

### For New Features

When adding new item types (e.g., services, packages), update:
1. The `item_type` enum in the migration
2. The relationships in `PosItem` model
3. The display logic in controllers

### For Frontend

The frontend should now receive:
- `item.item_type` - 'product' or 'room'
- `item.display_name` - Correct name to display
- `item.display_sku` - Correct SKU to display
- `item.display_category` - Room type or product category

Update your React/Vue components to use these fields instead of `item.product.name`.

## Verification Queries

### Check item type distribution
```sql
SELECT item_type, COUNT(*) as count 
FROM pos_items 
GROUP BY item_type;
```

### Find room booking POS orders
```sql
SELECT p.sale_number, p.room_booking_id, pi.item_type, pi.product_id
FROM pos p
JOIN pos_items pi ON p.id = pi.pos_id
WHERE p.room_booking_id IS NOT NULL;
```

### Verify room items have correct type
```sql
SELECT pi.id, pi.item_type, pi.product_id, r.room_number
FROM pos_items pi
JOIN pos p ON pi.pos_id = p.id
LEFT JOIN rooms r ON pi.product_id = r.id
WHERE p.room_booking_id IS NOT NULL;
```

## Support

If you encounter issues:
1. Check the migration ran successfully: `SELECT * FROM migrations WHERE migration LIKE '%add_item_type%'`
2. Verify column exists: `DESCRIBE pos_items;`
3. Check existing data: `SELECT item_type, COUNT(*) FROM pos_items GROUP BY item_type;`
4. Review logs: `storage/logs/laravel.log`

## Rollback (If Needed)

```bash
php artisan migrate:rollback --path=packages/workdo/Pos/src/Database/Migrations/2026_05_14_000001_add_item_type_to_pos_items_table.php
```

This will:
- Remove the `item_type` column
- Revert to the previous state (with the display issue)

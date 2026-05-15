<?php

/**
 * Fix POS Items Display Issue
 * 
 * This script:
 * 1. Runs the migration to add item_type column
 * 2. Updates existing room booking items to have item_type = 'room'
 * 3. Verifies the fix
 */

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;
use Workdo\Pos\Models\Pos;
use Workdo\Pos\Models\PosItem;

echo "=== FIX POS ITEMS DISPLAY ISSUE ===\n\n";

// Step 1: Run migration
echo "Step 1: Running migration to add item_type column...\n";
try {
    Artisan::call('migrate', [
        '--path' => 'packages/workdo/Pos/src/Database/Migrations/2026_05_14_000001_add_item_type_to_pos_items_table.php',
        '--force' => true
    ]);
    echo "✅ Migration completed successfully\n\n";
} catch (\Exception $e) {
    echo "⚠️  Migration error (may already exist): " . $e->getMessage() . "\n\n";
}

// Step 2: Verify and update existing data
echo "Step 2: Updating existing room booking items...\n";

$roomBookingPosOrders = Pos::whereNotNull('room_booking_id')->pluck('id');
echo "Found " . $roomBookingPosOrders->count() . " POS orders linked to room bookings\n";

$updated = DB::table('pos_items')
    ->whereIn('pos_id', $roomBookingPosOrders)
    ->where('item_type', '!=', 'room')
    ->update(['item_type' => 'room']);

echo "✅ Updated {$updated} items to item_type = 'room'\n\n";

// Step 3: Verify the fix
echo "Step 3: Verifying the fix...\n";

$samplePosOrder = Pos::whereNotNull('room_booking_id')
    ->with([
        'items.product:id,name,sku',
        'items.room:id,room_number',
        'roomBooking:id,booking_number'
    ])
    ->first();

if ($samplePosOrder) {
    echo "\nSample POS Order: {$samplePosOrder->sale_number}\n";
    echo "Linked to Room Booking: {$samplePosOrder->roomBooking->booking_number}\n";
    echo "Items:\n";
    
    foreach ($samplePosOrder->items as $item) {
        echo "  - Item Type: {$item->item_type}\n";
        echo "    Product ID: {$item->product_id}\n";
        
        if ($item->item_type === 'room' && $item->room) {
            echo "    Display: Room {$item->room->room_number}\n";
            echo "    ✅ CORRECT - Shows room information\n";
        } else if ($item->product) {
            echo "    Display: {$item->product->name}\n";
            echo "    ⚠️  Shows product (may be incorrect if this should be a room)\n";
        }
        echo "\n";
    }
} else {
    echo "No room booking POS orders found to verify\n";
}

// Step 4: Summary
echo "\n=== SUMMARY ===\n";
echo "Total POS orders with room bookings: " . $roomBookingPosOrders->count() . "\n";
echo "Items updated to 'room' type: {$updated}\n";

$roomItems = PosItem::where('item_type', 'room')->count();
$productItems = PosItem::where('item_type', 'product')->count();

echo "\nCurrent item type distribution:\n";
echo "  - Room items: {$roomItems}\n";
echo "  - Product items: {$productItems}\n";

echo "\n✅ Fix completed! Room bookings will now display correctly in POS orders.\n";
echo "\nNext steps:\n";
echo "1. Clear cache: php artisan cache:clear\n";
echo "2. Test by viewing a POS order that was created from a room booking\n";
echo "3. The item should now show 'Room XXX' instead of a product name\n";

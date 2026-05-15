<?php

require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Workdo\Pos\Models\RoomBooking;
use Workdo\Pos\Models\Pos;

echo "=== CHECKING ROOM BOOKING TO POS ORDER LINK ===\n\n";

// Check recent room bookings
$roomBookings = RoomBooking::with(['room', 'payment'])
    ->orderBy('id', 'desc')
    ->limit(10)
    ->get();

echo "Recent Room Bookings:\n";
echo str_repeat("-", 100) . "\n";

foreach ($roomBookings as $booking) {
    echo "Booking: {$booking->booking_number}\n";
    echo "  Room ID: {$booking->room_id}\n";
    echo "  Total: {$booking->total_amount}\n";
    echo "  Status: {$booking->status}\n";
    
    // Check if there's a POS order linked to this booking
    $posOrder = Pos::where('room_booking_id', $booking->id)->first();
    
    if ($posOrder) {
        echo "  ✅ LINKED POS ORDER: {$posOrder->sale_number}\n";
        echo "     POS Status: {$posOrder->status}\n";
        echo "     POS Items:\n";
        
        foreach ($posOrder->items as $item) {
            echo "       - product_id: {$item->product_id}, qty: {$item->quantity}, price: {$item->price}\n";
            
            // Try to get product name
            if ($item->product) {
                echo "         Product Name: {$item->product->name}\n";
            }
            
            // Try to get room info
            $room = \Workdo\Pos\Models\Room::find($item->product_id);
            if ($room) {
                echo "         Room Number: {$room->room_number}\n";
            }
        }
    } else {
        echo "  ❌ NO POS ORDER LINKED\n";
    }
    
    echo "\n";
}

// Check POS orders that have room_booking_id
echo "\n" . str_repeat("=", 100) . "\n";
echo "POS Orders with Room Booking Link:\n";
echo str_repeat("-", 100) . "\n";

$posWithRooms = Pos::whereNotNull('room_booking_id')
    ->with(['items', 'roomBooking'])
    ->orderBy('id', 'desc')
    ->limit(10)
    ->get();

foreach ($posWithRooms as $pos) {
    echo "POS: {$pos->sale_number}\n";
    echo "  Linked to Booking: {$pos->roomBooking->booking_number}\n";
    echo "  Status: {$pos->status}\n";
    echo "  Charged to Room: " . ($pos->charged_to_room ? 'YES' : 'NO') . "\n";
    echo "  Items:\n";
    
    foreach ($pos->items as $item) {
        echo "    - product_id: {$item->product_id}, qty: {$item->quantity}, price: {$item->price}\n";
        
        // Check if it's a product or room
        $product = \Workdo\ProductService\Models\ProductServiceItem::find($item->product_id);
        $room = \Workdo\Pos\Models\Room::find($item->product_id);
        
        if ($product) {
            echo "      → PRODUCT: {$product->name} (SKU: {$product->sku})\n";
        }
        if ($room) {
            echo "      → ROOM: {$room->room_number}\n";
        }
        if (!$product && !$room) {
            echo "      → NOT FOUND in products or rooms\n";
        }
    }
    echo "\n";
}

echo "\n=== SUMMARY ===\n";
echo "Total Room Bookings checked: " . $roomBookings->count() . "\n";
echo "Room Bookings with POS link: " . $roomBookings->filter(function($b) {
    return Pos::where('room_booking_id', $b->id)->exists();
})->count() . "\n";
echo "POS Orders with room_booking_id: " . $posWithRooms->count() . "\n";

<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

// Check customers with active room bookings
echo "=== Customers with Active Room Bookings ===\n\n";

$customers = \App\Models\User::whereHas('roomBookings', function($query) {
    $query->whereIn('status', ['confirmed', 'checked_in']);
})
->with(['roomBookings' => function($query) {
    $query->whereIn('status', ['confirmed', 'checked_in'])
        ->with('room:id,room_number')
        ->select('id', 'customer_id', 'room_id', 'status', 'booking_number');
}])
->select('id', 'name', 'email')
->get();

echo "Found " . $customers->count() . " customers with active bookings\n\n";

foreach ($customers as $customer) {
    echo "Customer ID: {$customer->id}\n";
    echo "Name: {$customer->name}\n";
    echo "Email: {$customer->email}\n";
    echo "Room Bookings:\n";
    
    foreach ($customer->roomBookings as $booking) {
        echo "  - Booking ID: {$booking->id}\n";
        echo "    Booking Number: {$booking->booking_number}\n";
        echo "    Room ID: {$booking->room_id}\n";
        echo "    Room Number: " . ($booking->room ? $booking->room->room_number : 'N/A') . "\n";
        echo "    Status: {$booking->status}\n";
    }
    echo "\n";
}

// Also check the JSON structure that would be sent to frontend
echo "\n=== JSON Structure (as sent to frontend) ===\n";
echo json_encode($customers->toArray(), JSON_PRETTY_PRINT);

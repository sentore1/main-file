#!/usr/bin/env php
<?php

/**
 * Test script for Services endpoint
 */

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "=== Testing Services Endpoint ===\n\n";

// Get a warehouse ID
$warehouse = \App\Models\Warehouse::where('created_by', creatorId())->first();

if (!$warehouse) {
    echo "❌ No warehouse found\n";
    exit(1);
}

echo "✓ Testing with warehouse: {$warehouse->name} (ID: {$warehouse->id})\n\n";

// Test 1: Check if services exist
echo "1. Checking services in database...\n";
$services = \Workdo\ProductService\Models\ProductServiceItem::where('type', 'service')
    ->where('is_active', true)
    ->where('created_by', creatorId())
    ->count();
echo "   Found {$services} services\n\n";

// Test 2: Check if rooms exist
echo "2. Checking rooms in database...\n";
if (class_exists('\Workdo\Pos\Models\Room')) {
    $rooms = \Workdo\Pos\Models\Room::where('warehouse_id', $warehouse->id)
        ->where('created_by', creatorId())
        ->where('status', 'available')
        ->count();
    echo "   Found {$rooms} available rooms in warehouse {$warehouse->id}\n\n";
} else {
    echo "   ⚠ Room model not found\n\n";
}

// Test 3: Simulate the controller method
echo "3. Simulating getServices() method...\n";
try {
    $services = \Workdo\ProductService\Models\ProductServiceItem::select('id', 'name', 'sku', 'sale_price', 'tax_ids', 'unit', 'type')
        ->where('is_active', true)
        ->where('type', 'service')
        ->where('created_by', creatorId())
        ->get();
    
    echo "   Services fetched: " . $services->count() . "\n";
    
    if ($services->count() > 0) {
        echo "   First service: {$services->first()->name}\n";
    }
    
    // Get rooms
    if (class_exists('\Workdo\Pos\Models\Room')) {
        $rooms = \Workdo\Pos\Models\Room::with('roomType')
            ->where('warehouse_id', $warehouse->id)
            ->where('created_by', creatorId())
            ->where('status', 'available')
            ->get();
        
        echo "   Rooms fetched: " . $rooms->count() . "\n";
        
        if ($rooms->count() > 0) {
            $room = $rooms->first();
            echo "   First room: Room {$room->room_number}\n";
        }
        
        $total = $services->count() + $rooms->count();
        echo "\n   ✓ Total items that should appear: {$total}\n";
    }
    
} catch (\Exception $e) {
    echo "   ❌ Error: " . $e->getMessage() . "\n";
}

echo "\n=== Test Complete ===\n";

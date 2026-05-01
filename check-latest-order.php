<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Support\Facades\DB;

echo "=== LATEST POS ORDERS ===\n\n";

$orders = DB::table('pos')
    ->orderBy('created_at', 'desc')
    ->limit(10)
    ->get();

echo "Total orders in database: " . DB::table('pos')->count() . "\n\n";

foreach ($orders as $order) {
    echo sprintf(
        "ID: %d | Sale#: %s | Status: %s | Warehouse: %d | Customer: %s | Created By: %d | Date: %s\n",
        $order->id,
        $order->sale_number,
        $order->status,
        $order->warehouse_id,
        $order->customer_id ?? 'NULL',
        $order->created_by,
        $order->created_at
    );
}

echo "\n=== CHECKING WHAT QUERY RETURNS ===\n\n";

// Simulate the controller query
$warehouseIds = function_exists('getUserWarehouseIds') ? getUserWarehouseIds() : [];
if (empty($warehouseIds)) {
    $warehouseIds = DB::table('warehouses')
        ->where('created_by', 1)
        ->pluck('id')
        ->toArray();
}

echo "Warehouse IDs being queried: " . implode(', ', $warehouseIds) . "\n\n";

$queryOrders = DB::table('pos')
    ->where('created_by', 1)
    ->whereIn('warehouse_id', $warehouseIds)
    ->orderBy('created_at', 'desc')
    ->get();

echo "Orders returned by controller query: " . $queryOrders->count() . "\n\n";

foreach ($queryOrders as $order) {
    echo sprintf(
        "ID: %d | Sale#: %s | Warehouse: %d | Date: %s\n",
        $order->id,
        $order->sale_number,
        $order->warehouse_id,
        $order->created_at
    );
}

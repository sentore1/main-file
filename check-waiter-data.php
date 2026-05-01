<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

// Check the last 3 POS orders
echo "=== Last 3 POS Orders ===\n";
$orders = \Workdo\Pos\Models\Pos::orderBy('id', 'desc')
    ->take(3)
    ->get(['id', 'sale_number', 'waiter_name', 'status', 'created_at']);

foreach ($orders as $order) {
    echo "ID: {$order->id}\n";
    echo "Sale Number: {$order->sale_number}\n";
    echo "Waiter Name: " . ($order->waiter_name ?: 'NULL') . "\n";
    echo "Status: {$order->status}\n";
    echo "Created: {$order->created_at}\n";
    echo "---\n";
}

// Check the specific order #POS00050
echo "\n=== Order #POS00050 Details ===\n";
$order = \Workdo\Pos\Models\Pos::where('sale_number', '#POS00050')->first();
if ($order) {
    echo "ID: {$order->id}\n";
    echo "Waiter Name: " . ($order->waiter_name ?: 'NULL') . "\n";
    echo "All attributes:\n";
    print_r($order->toArray());
} else {
    echo "Order not found\n";
}

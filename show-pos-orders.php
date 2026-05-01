<?php

require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Support\Facades\DB;

echo "=== POS ORDERS SUMMARY ===\n\n";

$orders = DB::table('pos')
    ->leftJoin('pos_payments', 'pos.id', '=', 'pos_payments.pos_id')
    ->leftJoin('warehouses', 'pos.warehouse_id', '=', 'warehouses.id')
    ->select(
        'pos.id',
        'pos.sale_number',
        'pos.status',
        'pos.created_at',
        'warehouses.name as warehouse',
        'pos_payments.discount_amount as total',
        'pos_payments.paid_amount',
        'pos_payments.balance_due'
    )
    ->orderBy('pos.id', 'desc')
    ->get();

echo "Total POS Orders: " . count($orders) . "\n\n";

if (count($orders) > 0) {
    echo str_pad("ID", 5) . str_pad("Sale Number", 15) . str_pad("Warehouse", 25) . str_pad("Total", 12) . str_pad("Paid", 12) . str_pad("Status", 12) . "Created\n";
    echo str_repeat("-", 100) . "\n";
    
    foreach ($orders as $order) {
        echo str_pad($order->id, 5) . 
             str_pad($order->sale_number, 15) . 
             str_pad(substr($order->warehouse ?? 'N/A', 0, 24), 25) . 
             str_pad(number_format($order->total ?? 0, 2), 12) . 
             str_pad(number_format($order->paid_amount ?? 0, 2), 12) . 
             str_pad($order->status, 12) . 
             $order->created_at . "\n";
    }
} else {
    echo "No POS orders found.\n";
}

echo "\n";

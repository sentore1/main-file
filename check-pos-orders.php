<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Support\Facades\DB;

echo "Checking POS orders with their payments...\n\n";

// First, show the total count
$totalOrders = DB::table('pos')->count();
echo "Total POS orders in database: {$totalOrders}\n\n";

$orders = DB::table('pos')
    ->leftJoin('pos_payments', 'pos.id', '=', 'pos_payments.pos_id')
    ->select('pos.id', 'pos.sale_number', 'pos.status', 
             'pos_payments.amount', 'pos_payments.discount', 'pos_payments.discount_amount',
             'pos_payments.paid_amount', 'pos_payments.balance_due', 'pos.created_at')
    ->orderBy('pos.id', 'desc')
    ->limit(15)
    ->get();

foreach ($orders as $order) {
    echo "Order: {$order->sale_number} (ID: {$order->id}) - Created: {$order->created_at}\n";
    echo "  Status: {$order->status}\n";
    echo "  Total: {$order->discount_amount}\n";
    echo "  Paid: {$order->paid_amount}\n";
    echo "  Balance: {$order->balance_due}\n";
    echo "\n";
}

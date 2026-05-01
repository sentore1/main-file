<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

echo "Checking POS table structure...\n\n";

// Check if pos table exists
if (Schema::hasTable('pos')) {
    echo "✓ pos table exists\n";
    
    // Get table structure
    $columns = DB::select("SHOW COLUMNS FROM pos WHERE Field = 'status'");
    
    if (!empty($columns)) {
        echo "✓ status column exists\n";
        echo "  Type: " . $columns[0]->Type . "\n";
        echo "  Default: " . $columns[0]->Default . "\n\n";
    }
    
    // Check recent POS records
    echo "Recent POS orders:\n";
    $recentOrders = DB::table('pos')
        ->orderBy('created_at', 'desc')
        ->limit(5)
        ->get(['id', 'sale_number', 'status', 'created_at']);
    
    if ($recentOrders->count() > 0) {
        foreach ($recentOrders as $order) {
            echo "  ID: {$order->id}, Number: {$order->sale_number}, Status: {$order->status}, Created: {$order->created_at}\n";
        }
    } else {
        echo "  No orders found\n";
    }
    
    echo "\n";
    
    // Check pos_payments
    echo "Recent POS payments:\n";
    $recentPayments = DB::table('pos_payments')
        ->orderBy('created_at', 'desc')
        ->limit(5)
        ->get(['id', 'pos_id', 'amount', 'discount_amount', 'paid_amount', 'balance_due', 'created_at']);
    
    if ($recentPayments->count() > 0) {
        foreach ($recentPayments as $payment) {
            echo "  ID: {$payment->id}, POS ID: {$payment->pos_id}, Amount: {$payment->amount}, Discount Amount: {$payment->discount_amount}, Paid: {$payment->paid_amount}, Balance: {$payment->balance_due}, Created: {$payment->created_at}\n";
        }
    } else {
        echo "  No payments found\n";
    }
    
} else {
    echo "✗ pos table does not exist\n";
}

echo "\n";

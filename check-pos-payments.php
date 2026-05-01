<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Support\Facades\DB;

echo "Checking pos_payments table structure...\n\n";

// Check if columns exist
$columns = DB::select("SHOW COLUMNS FROM pos_payments");
echo "Columns in pos_payments table:\n";
foreach ($columns as $column) {
    echo "- {$column->Field} ({$column->Type})\n";
}

echo "\n\nChecking latest 5 POS payments data:\n";
$payments = DB::table('pos_payments')
    ->orderBy('id', 'desc')
    ->limit(5)
    ->get();

foreach ($payments as $payment) {
    echo "\nPayment ID: {$payment->id}\n";
    echo "  POS ID: {$payment->pos_id}\n";
    echo "  Amount: {$payment->amount}\n";
    echo "  Discount: {$payment->discount}\n";
    echo "  Discount Amount: {$payment->discount_amount}\n";
    echo "  Paid Amount: " . ($payment->paid_amount ?? 'NULL') . "\n";
    echo "  Balance Due: " . ($payment->balance_due ?? 'NULL') . "\n";
}

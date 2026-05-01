<?php

// Test script to check POS data
// Run with: php test-pos-data.php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "=== POS DATA TEST ===\n\n";

// Get the last 5 POS orders
$sales = \Workdo\Pos\Models\Pos::with(['items', 'payment'])
    ->latest()
    ->take(5)
    ->get();

if ($sales->isEmpty()) {
    echo "No POS orders found.\n";
    exit;
}

foreach ($sales as $sale) {
    echo "Order: {$sale->sale_number}\n";
    echo "Status: {$sale->status}\n";
    echo "Created: {$sale->created_at}\n";
    
    if ($sale->payment) {
        echo "Payment:\n";
        echo "  - Amount: {$sale->payment->amount}\n";
        echo "  - Discount: {$sale->payment->discount}\n";
        echo "  - Discount Amount: {$sale->payment->discount_amount}\n";
        echo "  - Paid Amount: {$sale->payment->paid_amount}\n";
        echo "  - Balance Due: {$sale->payment->balance_due}\n";
    }
    
    echo "Items:\n";
    foreach ($sale->items as $item) {
        echo "  - Product ID: {$item->product_id}\n";
        echo "    Quantity: {$item->quantity}\n";
        echo "    Price: {$item->price}\n";
        echo "    Notes: " . ($item->notes ?? 'NULL') . "\n";
        echo "    Subtotal: {$item->subtotal}\n";
        echo "    Tax Amount: {$item->tax_amount}\n";
        echo "    Total Amount: {$item->total_amount}\n";
    }
    
    echo "\n" . str_repeat("-", 50) . "\n\n";
}

echo "=== END TEST ===\n";

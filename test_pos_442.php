<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\Auth;
use Workdo\Pos\Models\Pos;

// Get the first user (usually admin)
$user = \App\Models\User::first();
Auth::login($user);

echo "=== CHECKING POS ORDER #442 ===\n\n";

// Try to find sale 442
$sale = Pos::with(['items.product', 'payment', 'customer', 'warehouse'])->find(442);

if (!$sale) {
    echo "ERROR: Sale #442 not found!\n";
    echo "Looking for any sales...\n\n";
    
    $allSales = Pos::orderBy('id', 'desc')->take(5)->get();
    echo "Recent sales:\n";
    foreach ($allSales as $s) {
        echo "  - ID: {$s->id}, Number: {$s->sale_number}, Date: {$s->pos_date}\n";
    }
    exit;
}

echo "Sale Found!\n";
echo "ID: {$sale->id}\n";
echo "Sale Number: {$sale->sale_number}\n";
echo "Customer: " . ($sale->customer ? $sale->customer->name : 'Walk-in') . "\n";
echo "Warehouse: " . ($sale->warehouse ? $sale->warehouse->name : 'N/A') . "\n";
echo "Date: {$sale->pos_date}\n";
echo "Status: {$sale->status}\n";
echo "Created By: {$sale->created_by}\n";
echo "Current Creator: " . creatorId() . "\n\n";

echo "=== PERMISSION CHECK ===\n";
echo "User can edit-pos: " . ($user->can('edit-pos') ? 'YES' : 'NO') . "\n";
echo "Sale belongs to user: " . ($sale->created_by == creatorId() ? 'YES' : 'NO') . "\n";
echo "Can edit this sale: " . ($user->can('edit-pos') && $sale->created_by == creatorId() ? 'YES' : 'NO') . "\n\n";

echo "=== ITEMS ===\n";
foreach ($sale->items as $item) {
    echo "Item ID: {$item->id}\n";
    echo "  Product ID: {$item->product_id}\n";
    echo "  Type: {$item->item_type}\n";
    echo "  Quantity: {$item->quantity}\n";
    echo "  Price: {$item->price}\n";
    echo "  Subtotal: {$item->subtotal}\n";
    echo "  Tax: {$item->tax_amount}\n";
    echo "  Total: {$item->total_amount}\n";
    if ($item->product) {
        echo "  Product Name: {$item->product->name}\n";
        echo "  Product SKU: {$item->product->sku}\n";
    }
    echo "\n";
}

if ($sale->payment) {
    echo "=== PAYMENT ===\n";
    echo "Amount: {$sale->payment->amount}\n";
    echo "Discount: {$sale->payment->discount}\n";
    echo "After Discount: {$sale->payment->discount_amount}\n";
    echo "Paid: {$sale->payment->paid_amount}\n";
    echo "Balance: {$sale->payment->balance_due}\n";
}

echo "\n=== CHECKING IF SALE HAS ROOM ITEMS ===\n";
$hasRooms = $sale->items->where('item_type', 'room')->count() > 0;
echo "Has room items: " . ($hasRooms ? 'YES' : 'NO') . "\n";

if ($hasRooms) {
    echo "\nWARNING: This sale contains room bookings!\n";
    echo "The update method will reject editing sales with room bookings.\n";
    echo "This is likely why the update is not working.\n";
}

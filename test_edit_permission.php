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

echo "=== POS EDIT PERMISSION TEST ===\n\n";
echo "User: {$user->name} (ID: {$user->id})\n";
echo "Email: {$user->email}\n\n";

// Check permissions
$permissions = [
    'manage-pos',
    'create-pos',
    'edit-pos',
    'manage-pos-orders',
];

echo "Permissions:\n";
foreach ($permissions as $permission) {
    $has = $user->can($permission);
    echo "  - {$permission}: " . ($has ? 'YES' : 'NO') . "\n";
}

// Get a POS sale to test
$sale = Pos::with(['items', 'payment'])->first();

if ($sale) {
    echo "\n=== TEST SALE ===\n";
    echo "Sale ID: {$sale->id}\n";
    echo "Sale Number: {$sale->sale_number}\n";
    echo "Created By: {$sale->created_by}\n";
    echo "Current Creator ID: " . creatorId() . "\n";
    echo "Can Edit: " . ($user->can('edit-pos') && $sale->created_by == creatorId() ? 'YES' : 'NO') . "\n";
    echo "Items Count: " . $sale->items->count() . "\n";
    
    if ($sale->payment) {
        echo "\nPayment Info:\n";
        echo "  Amount: {$sale->payment->amount}\n";
        echo "  Discount: {$sale->payment->discount}\n";
        echo "  Paid: {$sale->payment->paid_amount}\n";
        echo "  Balance: {$sale->payment->balance_due}\n";
    }
    
    echo "\nItems:\n";
    foreach ($sale->items as $item) {
        echo "  - Product ID: {$item->product_id}, Type: {$item->item_type}, Qty: {$item->quantity}, Price: {$item->price}\n";
    }
} else {
    echo "\nNo POS sales found in database.\n";
}

echo "\n=== ROUTE TEST ===\n";
try {
    $editRoute = route('pos.edit', ['sale' => 442]);
    echo "Edit Route: {$editRoute}\n";
    
    $updateRoute = route('pos.update', ['sale' => 442]);
    echo "Update Route: {$updateRoute}\n";
} catch (\Exception $e) {
    echo "Route Error: " . $e->getMessage() . "\n";
}

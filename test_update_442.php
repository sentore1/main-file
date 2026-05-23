<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\Auth;
use Workdo\Pos\Models\Pos;
use Illuminate\Support\Facades\DB;

// Get the first user (usually admin)
$user = \App\Models\User::first();
Auth::login($user);

echo "=== SIMULATING POS UPDATE FOR SALE #442 ===\n\n";

$sale = Pos::find(442);

if (!$sale) {
    echo "ERROR: Sale #442 not found!\n";
    exit;
}

echo "Current Sale Data:\n";
echo "  Items: " . $sale->items->count() . "\n";
echo "  Total: " . $sale->payment->discount_amount . "\n\n";

// Simulate update data (same as current)
$updateData = [
    'customer_id' => $sale->customer_id,
    'warehouse_id' => $sale->warehouse_id,
    'pos_date' => $sale->pos_date,
    'items' => $sale->items->map(function($item) {
        return [
            'id' => $item->product_id,
            'quantity' => $item->quantity,
            'price' => $item->price,
            'notes' => $item->notes,
        ];
    })->toArray(),
    'discount' => $sale->payment->discount,
    'paid_amount' => $sale->payment->paid_amount,
];

echo "Update Data:\n";
print_r($updateData);

// Validate the data
$validator = \Illuminate\Support\Facades\Validator::make($updateData, [
    'customer_id' => 'nullable|exists:users,id',
    'warehouse_id' => 'required|exists:warehouses,id',
    'pos_date' => 'nullable|date',
    'items' => 'required|array|min:1',
    'items.*.id' => 'required|integer',
    'items.*.quantity' => 'required|numeric|min:1',
    'items.*.price' => 'required|numeric|min:0',
    'items.*.notes' => 'nullable|string',
    'discount' => 'nullable|numeric|min:0',
    'paid_amount' => 'nullable|numeric|min:0',
]);

echo "\n=== VALIDATION ===\n";
if ($validator->fails()) {
    echo "VALIDATION FAILED:\n";
    foreach ($validator->errors()->all() as $error) {
        echo "  - $error\n";
    }
} else {
    echo "Validation: PASSED\n";
}

echo "\n=== PERMISSION CHECK ===\n";
echo "User can edit-pos: " . ($user->can('edit-pos') ? 'YES' : 'NO') . "\n";
echo "Sale belongs to user: " . ($sale->created_by == creatorId() ? 'YES' : 'NO') . "\n";

if ($user->can('edit-pos') && $sale->created_by == creatorId()) {
    echo "\nPermissions: PASSED\n";
    echo "\nThe update SHOULD work. The issue is likely in the frontend.\n";
    echo "\nPossible issues:\n";
    echo "1. JavaScript not executing (check browser console)\n";
    echo "2. Route not found (check network tab)\n";
    echo "3. CSRF token issue\n";
    echo "4. Inertia not properly configured\n";
} else {
    echo "\nPermissions: FAILED\n";
}

echo "\n=== CHECKING ROUTES ===\n";
try {
    echo "Edit route: " . route('pos.edit', 442) . "\n";
    echo "Update route (PUT): " . route('pos.update', 442) . "\n";
} catch (\Exception $e) {
    echo "Route error: " . $e->getMessage() . "\n";
}

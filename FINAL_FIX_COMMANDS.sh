#!/bin/bash

echo "=== POS EDIT FINAL FIX ==="
echo ""

echo "Step 1: Clear all caches..."
php artisan cache:clear
php artisan config:clear
php artisan route:clear
php artisan view:clear
php artisan optimize:clear

echo ""
echo "Step 2: Rebuild frontend assets..."
npm run build

echo ""
echo "Step 3: Verify route exists..."
php artisan route:list | grep "pos/orders/{sale}/update"

echo ""
echo "Step 4: Test the update route directly..."
echo "Creating test request..."

# Create a test file to simulate the update request
cat > test_update_request.php << 'EOF'
<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);

// Simulate a POST request to the update endpoint
$request = Illuminate\Http\Request::create(
    '/pos/orders/442/update',
    'POST',
    [
        'customer_id' => 304,
        'warehouse_id' => 1,
        'pos_date' => '2026-05-22',
        'items' => [
            [
                'id' => 4,
                'quantity' => 1,
                'price' => 10000,
                'notes' => null
            ]
        ],
        'discount' => 0,
        'paid_amount' => 3000
    ]
);

// Add authentication (simulate logged-in user)
$user = App\Models\User::find(1); // Adjust user ID as needed
Auth::login($user);

try {
    $response = $kernel->handle($request);
    echo "Response Status: " . $response->getStatusCode() . "\n";
    echo "Response Content: " . substr($response->getContent(), 0, 500) . "...\n";
    
    if ($response->getStatusCode() == 302) {
        echo "Redirect to: " . $response->headers->get('Location') . "\n";
    }
} catch (\Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
    echo $e->getTraceAsString() . "\n";
}
EOF

php test_update_request.php

echo ""
echo "=== FIX COMPLETE ==="
echo ""
echo "Now test in browser:"
echo "1. Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)"
echo "2. Clear browser cache"
echo "3. Go to: https://pryro.eastgatehotel.rw/pos/orders/442/edit"
echo "4. Change paid amount"
echo "5. Click Update Sale"
echo "6. Check logs: tail -f storage/logs/laravel.log | grep 'POS UPDATE'"

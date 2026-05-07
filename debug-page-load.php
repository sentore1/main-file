<?php
// Quick debug script to test what Inertia is sending to the browser

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "=== Testing Stock Requisition Page Data ===\n\n";

// Test 1: Check if route exists
try {
    $url = route('stock-requisitions.index');
    echo "✓ Route exists: $url\n\n";
} catch (Exception $e) {
    echo "✗ Route error: " . $e->getMessage() . "\n\n";
    exit(1);
}

// Test 2: Check controller method
try {
    $controller = new \Workdo\StockRequisition\Http\Controllers\StockRequisitionController();
    echo "✓ Controller loaded\n\n";
} catch (Exception $e) {
    echo "✗ Controller error: " . $e->getMessage() . "\n\n";
}

// Test 3: Check if manifest has the page
$manifestPath = public_path('build/manifest.json');
if (file_exists($manifestPath)) {
    $manifest = json_decode(file_get_contents($manifestPath), true);
    $stockReqPages = array_filter(array_keys($manifest), function($key) {
        return strpos($key, 'StockRequisition/src/Resources/js/Pages') !== false;
    });
    
    echo "✓ Found " . count($stockReqPages) . " StockRequisition pages in manifest:\n";
    foreach ($stockReqPages as $page) {
        echo "  - $page\n";
    }
    echo "\n";
} else {
    echo "✗ Manifest not found\n\n";
}

// Test 4: Check permissions
$user = \App\Models\User::where('type', 'company')->first();
if ($user) {
    $hasPermission = $user->can('manage-stock-requisitions');
    echo $hasPermission ? "✓" : "✗";
    echo " User has manage-stock-requisitions permission: " . ($hasPermission ? 'YES' : 'NO') . "\n\n";
}

echo "=== Diagnosis ===\n";
echo "If all checks pass but UI doesn't work:\n";
echo "1. Clear browser cache (Ctrl+Shift+Delete)\n";
echo "2. Hard refresh (Ctrl+Shift+R)\n";
echo "3. Check browser console (F12) for specific JS errors\n";
echo "4. Check Network tab to see if Index-C-x4p8Px.js loads successfully\n";

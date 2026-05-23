<?php

/**
 * Complete POS Update Test - Simulates actual HTTP request
 * Run: php test_pos_update_full.php
 */

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use App\Models\User;
use Workdo\Pos\Models\Pos;

echo "╔════════════════════════════════════════════════════════════╗\n";
echo "║         POS UPDATE COMPLETE TEST SCRIPT                   ║\n";
echo "╚════════════════════════════════════════════════════════════╝\n\n";

// Test 1: Check if user exists
echo "📋 Test 1: User Check\n";
echo "─────────────────────────────────────────────────────────────\n";
$user = User::find(1);
if (!$user) {
    echo "❌ FAILED: User ID 1 not found!\n";
    exit(1);
}
echo "✅ User found: {$user->name} ({$user->email})\n";
echo "   Skipping auth (will test without session)\n\n";

// Test 2: Check permissions (skip - can't test without auth)
echo "📋 Test 2: Permission Check (Skipped)\n";
echo "─────────────────────────────────────────────────────────────\n";
echo "⚠️  Skipping permission check (requires authenticated session)\n";
echo "\n";

// Test 3: Check if sale exists
echo "📋 Test 3: Sale Existence Check\n";
echo "─────────────────────────────────────────────────────────────\n";
$saleId = 442;
$sale = Pos::find($saleId);
if (!$sale) {
    echo "❌ FAILED: Sale #{$saleId} not found!\n";
    exit(1);
}
echo "✅ Sale found: {$sale->sale_number}\n";
echo "   Current paid amount: {$sale->payment->paid_amount}\n";
echo "   Current balance: {$sale->payment->balance_due}\n";
echo "   Creator ID: {$sale->created_by}\n\n";

// Test 4: Check route registration
echo "📋 Test 4: Route Registration Check\n";
echo "─────────────────────────────────────────────────────────────\n";
$routes = Route::getRoutes();
$updateRoutes = [];
foreach ($routes as $route) {
    $uri = $route->uri();
    if (strpos($uri, 'pos/orders') !== false && strpos($uri, 'update') !== false) {
        $updateRoutes[] = [
            'method' => implode('|', $route->methods()),
            'uri' => $uri,
            'name' => $route->getName(),
            'action' => $route->getActionName()
        ];
    }
}

if (empty($updateRoutes)) {
    echo "❌ FAILED: No update routes found!\n";
} else {
    echo "✅ Found " . count($updateRoutes) . " update route(s):\n";
    foreach ($updateRoutes as $r) {
        echo "   {$r['method']} /{$r['uri']} → {$r['name']}\n";
    }
}
echo "\n";

// Test 5: Simulate actual update request
echo "📋 Test 5: Simulating Update Request\n";
echo "─────────────────────────────────────────────────────────────\n";

$updateData = [
    'customer_id' => $sale->customer_id,
    'warehouse_id' => $sale->warehouse_id,
    'pos_date' => $sale->pos_date->format('Y-m-d'),
    'items' => [
        [
            'id' => 4,
            'quantity' => 1,
            'price' => 10000,
            'notes' => null
        ]
    ],
    'discount' => 0,
    'paid_amount' => 7500 // Changed from current value
];

echo "Request data:\n";
echo json_encode($updateData, JSON_PRETTY_PRINT) . "\n\n";

// Create request
$request = Illuminate\Http\Request::create(
    "/pos/orders/{$saleId}/update",
    'POST',
    $updateData
);

// Add headers
$request->headers->set('Accept', 'application/json');
$request->headers->set('Content-Type', 'application/json');

echo "Sending POST request to: /pos/orders/{$saleId}/update\n";
echo "Note: This will likely fail with 401/403 due to no auth\n";
echo "─────────────────────────────────────────────────────────────\n";

try {
    $response = $kernel->handle($request);
    $statusCode = $response->getStatusCode();
    
    echo "Response Status: {$statusCode}\n";
    
    if ($statusCode == 302) {
        $location = $response->headers->get('Location');
        echo "✅ Redirect to: {$location}\n";
        
        // Check if sale was actually updated
        $sale->refresh();
        $sale->load('payment');
        echo "\nVerifying update:\n";
        echo "   New paid amount: {$sale->payment->paid_amount}\n";
        echo "   New balance: {$sale->payment->balance_due}\n";
        
        if ($sale->payment->paid_amount == 7500) {
            echo "✅ SUCCESS: Sale was updated correctly!\n";
        } else {
            echo "❌ FAILED: Sale was NOT updated (still {$sale->payment->paid_amount})\n";
        }
    } elseif ($statusCode == 200) {
        echo "⚠️  WARNING: Got 200 OK instead of redirect\n";
        $content = $response->getContent();
        echo "Response preview: " . substr($content, 0, 200) . "...\n";
    } elseif ($statusCode == 403) {
        echo "❌ FAILED: Permission denied (403)\n";
    } elseif ($statusCode == 404) {
        echo "❌ FAILED: Route not found (404)\n";
        echo "   This means the route is not registered!\n";
    } elseif ($statusCode == 422) {
        echo "❌ FAILED: Validation error (422)\n";
        $errors = json_decode($response->getContent(), true);
        echo "   Errors: " . json_encode($errors, JSON_PRETTY_PRINT) . "\n";
    } elseif ($statusCode == 500) {
        echo "❌ FAILED: Server error (500)\n";
        $content = $response->getContent();
        echo "   Error: " . substr($content, 0, 500) . "\n";
    } else {
        echo "⚠️  Unexpected status code: {$statusCode}\n";
        echo "   Response: " . substr($response->getContent(), 0, 300) . "\n";
    }
    
} catch (\Exception $e) {
    echo "❌ EXCEPTION: " . $e->getMessage() . "\n";
    echo "\nStack trace:\n";
    echo $e->getTraceAsString() . "\n";
}

echo "\n";

// Test 6: Check Laravel logs
echo "📋 Test 6: Checking Laravel Logs\n";
echo "─────────────────────────────────────────────────────────────\n";
$logFile = storage_path('logs/laravel.log');
if (file_exists($logFile)) {
    $logs = file_get_contents($logFile);
    $recentLogs = array_slice(explode("\n", $logs), -20);
    
    $foundUpdateLog = false;
    foreach ($recentLogs as $log) {
        if (strpos($log, 'POS UPDATE') !== false) {
            echo "✅ Found update log: " . substr($log, 0, 100) . "...\n";
            $foundUpdateLog = true;
        }
    }
    
    if (!$foundUpdateLog) {
        echo "⚠️  No 'POS UPDATE' logs found in recent entries\n";
        echo "   This means the update method was not called\n";
    }
} else {
    echo "⚠️  Log file not found\n";
}

echo "\n";
echo "╔════════════════════════════════════════════════════════════╗\n";
echo "║                    TEST COMPLETE                           ║\n";
echo "╚════════════════════════════════════════════════════════════╝\n\n";

echo "📊 SUMMARY:\n";
echo "─────────────────────────────────────────────────────────────\n";
echo "If you see:\n";
echo "  ✅ 302 Redirect + Sale updated = WORKING PERFECTLY\n";
echo "  ❌ 404 Not Found = Route not registered\n";
echo "  ❌ 403 Forbidden = Permission issue\n";
echo "  ❌ 422 Validation = Data format issue\n";
echo "  ❌ 500 Server Error = Backend code error\n";
echo "\n";
echo "Next steps:\n";
echo "1. If backend works here but not in browser:\n";
echo "   → Clear browser cache and rebuild: npm run build\n";
echo "2. If 404 error:\n";
echo "   → Check routes/web.php has the update route\n";
echo "3. If validation error:\n";
echo "   → Check the data format being sent from frontend\n";
echo "\n";

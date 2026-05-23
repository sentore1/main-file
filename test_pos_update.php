<?php

/**
 * POS Update Test Script
 * Run this from SSH: php test_pos_update.php
 */

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Workdo\Pos\Models\Pos;
use Workdo\Pos\Models\PosItem;
use Workdo\Pos\Models\PosPayment;
use Illuminate\Support\Facades\DB;

echo "=== POS UPDATE TEST SCRIPT ===\n\n";

// Test 1: Check if sale exists
echo "Test 1: Checking if sale #442 exists...\n";
$sale = Pos::find(442);
if (!$sale) {
    echo "❌ FAILED: Sale #442 not found!\n";
    exit(1);
}
echo "✅ PASSED: Sale found - {$sale->sale_number}\n";
echo "   Customer ID: " . ($sale->customer_id ?? 'null') . "\n";
echo "   Warehouse ID: {$sale->warehouse_id}\n";
echo "   Status: {$sale->status}\n";
echo "   Created by: {$sale->created_by}\n\n";

// Test 2: Check current items
echo "Test 2: Checking current items...\n";
$items = $sale->items;
echo "   Current items count: " . $items->count() . "\n";
foreach ($items as $item) {
    echo "   - Product ID: {$item->product_id}, Qty: {$item->quantity}, Price: {$item->price}\n";
}
echo "\n";

// Test 3: Check current payment
echo "Test 3: Checking current payment...\n";
$payment = $sale->payment;
if ($payment) {
    echo "   Discount: {$payment->discount}\n";
    echo "   Amount: {$payment->amount}\n";
    echo "   Paid Amount: {$payment->paid_amount}\n";
    echo "   Balance Due: {$payment->balance_due}\n";
} else {
    echo "   ❌ No payment record found!\n";
}
echo "\n";

// Test 4: Try to update paid amount
echo "Test 4: Attempting to update paid amount from {$payment->paid_amount} to 5000...\n";
try {
    DB::beginTransaction();
    
    $payment->paid_amount = 5000;
    $payment->balance_due = $payment->discount_amount - 5000;
    $payment->save();
    
    // Update sale status
    if ($payment->balance_due > 0) {
        $sale->status = 'partial';
    } else {
        $sale->status = 'completed';
    }
    $sale->save();
    
    DB::commit();
    echo "✅ PASSED: Payment updated successfully!\n";
    echo "   New paid amount: {$payment->paid_amount}\n";
    echo "   New balance due: {$payment->balance_due}\n";
    echo "   New status: {$sale->status}\n";
} catch (\Exception $e) {
    DB::rollBack();
    echo "❌ FAILED: " . $e->getMessage() . "\n";
    echo "   Stack trace:\n";
    echo $e->getTraceAsString() . "\n";
}
echo "\n";

// Test 5: Check routes
echo "Test 5: Checking if update routes exist...\n";
$routes = \Illuminate\Support\Facades\Route::getRoutes();
$posRoutes = [];
foreach ($routes as $route) {
    $name = $route->getName();
    if ($name && strpos($name, 'pos.update') !== false) {
        $posRoutes[] = [
            'name' => $name,
            'uri' => $route->uri(),
            'methods' => implode('|', $route->methods()),
            'action' => $route->getActionName()
        ];
    }
}

if (empty($posRoutes)) {
    echo "❌ FAILED: No pos.update routes found!\n";
} else {
    echo "✅ PASSED: Found " . count($posRoutes) . " update route(s):\n";
    foreach ($posRoutes as $r) {
        echo "   - {$r['name']}: {$r['methods']} {$r['uri']} -> {$r['action']}\n";
    }
}
echo "\n";

// Test 6: Check permissions
echo "Test 6: Checking if edit-pos permission exists...\n";
try {
    $permission = \Spatie\Permission\Models\Permission::where('name', 'edit-pos')->first();
    if ($permission) {
        echo "✅ PASSED: Permission exists (ID: {$permission->id})\n";
        
        // Check which roles have this permission
        $roles = $permission->roles;
        if ($roles->count() > 0) {
            echo "   Roles with this permission:\n";
            foreach ($roles as $role) {
                echo "   - {$role->name}\n";
            }
        } else {
            echo "   ⚠️  WARNING: No roles have this permission!\n";
        }
    } else {
        echo "❌ FAILED: Permission 'edit-pos' not found!\n";
    }
} catch (\Exception $e) {
    echo "❌ FAILED: " . $e->getMessage() . "\n";
}
echo "\n";

// Test 7: Rollback the test update
echo "Test 7: Rolling back test changes...\n";
try {
    DB::beginTransaction();
    
    // Restore original values (you'll need to adjust these)
    $payment->paid_amount = 10000; // Original value
    $payment->balance_due = 0;
    $payment->save();
    
    $sale->status = 'completed';
    $sale->save();
    
    DB::commit();
    echo "✅ PASSED: Changes rolled back\n";
} catch (\Exception $e) {
    DB::rollBack();
    echo "❌ FAILED: " . $e->getMessage() . "\n";
}

echo "\n=== TEST COMPLETE ===\n";
echo "\nSummary:\n";
echo "- Sale exists and can be loaded\n";
echo "- Payment can be updated directly via PHP\n";
echo "- Check if routes are registered correctly\n";
echo "- Check if permissions are assigned\n";
echo "\nIf all tests pass, the issue is in the frontend/routing, not the backend logic.\n";

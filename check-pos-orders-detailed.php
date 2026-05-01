<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;

echo "=== POS ORDERS DIAGNOSTIC SCRIPT ===\n\n";

// 1. Check total POS orders
$totalOrders = DB::table('pos')->count();
echo "1. Total POS orders in database: {$totalOrders}\n\n";

// 2. Check POS orders with details
if ($totalOrders > 0) {
    echo "2. POS Orders Details:\n";
    echo str_repeat("-", 80) . "\n";
    
    $orders = DB::table('pos')
        ->leftJoin('pos_payments', 'pos.id', '=', 'pos_payments.pos_id')
        ->leftJoin('warehouses', 'pos.warehouse_id', '=', 'warehouses.id')
        ->leftJoin('users', 'pos.customer_id', '=', 'users.id')
        ->select(
            'pos.id',
            'pos.sale_number',
            'pos.warehouse_id',
            'warehouses.name as warehouse_name',
            'pos.customer_id',
            'users.name as customer_name',
            'pos.status',
            'pos.created_by',
            'pos.created_at',
            'pos_payments.amount',
            'pos_payments.discount',
            'pos_payments.discount_amount',
            'pos_payments.paid_amount',
            'pos_payments.balance_due'
        )
        ->orderBy('pos.id', 'desc')
        ->get();
    
    foreach ($orders as $order) {
        echo "Order ID: {$order->id}\n";
        echo "  Sale Number: {$order->sale_number}\n";
        echo "  Warehouse ID: {$order->warehouse_id}\n";
        echo "  Warehouse Name: " . ($order->warehouse_name ?? 'NULL') . "\n";
        echo "  Customer: " . ($order->customer_name ?? 'Walk-in Customer') . "\n";
        echo "  Status: {$order->status}\n";
        echo "  Created By: {$order->created_by}\n";
        echo "  Created At: {$order->created_at}\n";
        echo "  Total Amount: " . ($order->discount_amount ?? '0.00') . "\n";
        echo "  Paid Amount: " . ($order->paid_amount ?? '0.00') . "\n";
        echo "  Balance Due: " . ($order->balance_due ?? '0.00') . "\n";
        echo str_repeat("-", 80) . "\n";
    }
} else {
    echo "2. No POS orders found in database.\n\n";
}

// 3. Check POS items
$totalItems = DB::table('pos_items')->count();
echo "\n3. Total POS items: {$totalItems}\n";

if ($totalItems > 0) {
    $items = DB::table('pos_items')
        ->join('pos', 'pos_items.pos_id', '=', 'pos.id')
        ->select('pos.sale_number', 'pos_items.*')
        ->get();
    
    echo "   Items breakdown:\n";
    foreach ($items as $item) {
        echo "   - Sale: {$item->sale_number}, Product ID: {$item->product_id}, Qty: {$item->quantity}, Total: {$item->total_amount}\n";
    }
}

// 4. Check POS payments
$totalPayments = DB::table('pos_payments')->count();
echo "\n4. Total POS payments: {$totalPayments}\n\n";

// 5. Check warehouses
echo "5. Available Warehouses:\n";
$warehouses = DB::table('warehouses')
    ->select('id', 'name', 'created_by', 'is_active')
    ->get();

foreach ($warehouses as $warehouse) {
    echo "   - ID: {$warehouse->id}, Name: {$warehouse->name}, Created By: {$warehouse->created_by}, Active: {$warehouse->is_active}\n";
}

// 6. Simulate getUserWarehouseIds() for user ID 1
echo "\n6. Testing getUserWarehouseIds() for User ID 1:\n";
$user = DB::table('users')->where('id', 1)->first();

if ($user) {
    echo "   User Type: {$user->type}\n";
    
    if (in_array($user->type, ['super admin', 'company'])) {
        $warehouseIds = DB::table('warehouses')
            ->where('created_by', $user->id)
            ->pluck('id')
            ->toArray();
        echo "   Warehouse IDs (company/admin): " . json_encode($warehouseIds) . "\n";
    } else {
        $warehouseIds = [];
        if (isset($user->warehouse_id) && $user->warehouse_id) {
            $warehouseIds[] = $user->warehouse_id;
        }
        
        $additionalWarehouses = DB::table('user_warehouse')
            ->where('user_id', $user->id)
            ->pluck('warehouse_id')
            ->toArray();
        
        $warehouseIds = array_merge($warehouseIds, $additionalWarehouses);
        $warehouseIds = array_unique($warehouseIds);
        
        if (empty($warehouseIds)) {
            $warehouseIds = DB::table('warehouses')
                ->where('created_by', $user->created_by ?? $user->id)
                ->pluck('id')
                ->toArray();
        }
        
        echo "   Warehouse IDs (staff): " . json_encode($warehouseIds) . "\n";
    }
    
    // 7. Check what query would return
    echo "\n7. Testing POS Orders Query:\n";
    if (!empty($warehouseIds)) {
        $queryCount = DB::table('pos')
            ->where('created_by', $user->id)
            ->whereIn('warehouse_id', $warehouseIds)
            ->count();
        
        echo "   Orders found with warehouse filter: {$queryCount}\n";
        
        if ($queryCount > 0) {
            $queryOrders = DB::table('pos')
                ->where('created_by', $user->id)
                ->whereIn('warehouse_id', $warehouseIds)
                ->select('id', 'sale_number', 'warehouse_id')
                ->get();
            
            foreach ($queryOrders as $qo) {
                echo "   - Order: {$qo->sale_number}, Warehouse ID: {$qo->warehouse_id}\n";
            }
        }
    } else {
        echo "   WARNING: Warehouse IDs array is EMPTY!\n";
        echo "   This is why the POS orders page shows nothing.\n";
    }
} else {
    echo "   User ID 1 not found!\n";
}

// 8. Check if fix is applied
echo "\n8. Checking if the fix is working:\n";
$warehouseIds = [];
if (empty($warehouseIds)) {
    $warehouseIds = DB::table('warehouses')
        ->where('created_by', 1)
        ->pluck('id')
        ->toArray();
    echo "   Fallback triggered: Got " . count($warehouseIds) . " warehouses\n";
}

$ordersWithFallback = DB::table('pos')
    ->where('created_by', 1)
    ->whereIn('warehouse_id', $warehouseIds)
    ->count();

echo "   Orders found with fallback: {$ordersWithFallback}\n";

echo "\n=== END OF DIAGNOSTIC ===\n";

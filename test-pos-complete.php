<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Workdo\Pos\Models\Pos;
use Workdo\Pos\Models\PosItem;
use Workdo\Pos\Models\PosPayment;
use Workdo\Pos\Models\RoomBooking;
use App\Models\Warehouse;

echo "=== COMPREHENSIVE POS DIAGNOSTIC ===\n\n";

// Login as user 1
Auth::loginUsingId(1);
echo "✓ Logged in as User ID: " . Auth::id() . "\n";
echo "✓ Creator ID: " . creatorId() . "\n\n";

// 1. Check POS Orders
echo "1. CHECKING POS ORDERS\n";
echo str_repeat("-", 80) . "\n";
$totalOrders = Pos::count();
echo "Total POS orders: {$totalOrders}\n";

$orders = Pos::with(['payment', 'items'])
    ->orderBy('created_at', 'desc')
    ->limit(5)
    ->get();

foreach ($orders as $order) {
    echo sprintf(
        "  • ID: %d | %s | Status: %s | Warehouse: %d | Items: %d | Created: %s\n",
        $order->id,
        $order->sale_number,
        $order->status,
        $order->warehouse_id,
        $order->items->count(),
        $order->created_at->format('Y-m-d H:i')
    );
    if ($order->payment) {
        echo sprintf(
            "    Payment: Total: %.2f | Paid: %.2f | Balance: %.2f\n",
            $order->payment->discount_amount,
            $order->payment->paid_amount,
            $order->payment->balance_due
        );
    }
}
echo "\n";

// 2. Check what controller query returns
echo "2. TESTING CONTROLLER QUERY\n";
echo str_repeat("-", 80) . "\n";
$warehouseIds = getUserWarehouseIds();
if (empty($warehouseIds)) {
    $warehouseIds = Warehouse::where('created_by', creatorId())
        ->pluck('id')
        ->toArray();
}
echo "Warehouse IDs: " . implode(', ', $warehouseIds) . "\n";

$controllerOrders = Pos::with(['customer:id,name,email', 'warehouse:id,name', 'payment'])
    ->withCount('items')
    ->where('created_by', creatorId())
    ->whereIn('warehouse_id', $warehouseIds)
    ->orderBy('created_at', 'desc')
    ->get();

echo "Orders returned by controller query: " . $controllerOrders->count() . "\n";
foreach ($controllerOrders as $order) {
    echo sprintf(
        "  • %s | Warehouse: %s | Items: %d\n",
        $order->sale_number,
        $order->warehouse->name ?? 'N/A',
        $order->items_count
    );
}
echo "\n";

// 3. Check Room Bookings
echo "3. CHECKING ROOM BOOKINGS\n";
echo str_repeat("-", 80) . "\n";
$totalBookings = RoomBooking::count();
echo "Total room bookings: {$totalBookings}\n";

$bookings = RoomBooking::orderBy('id', 'desc')->limit(5)->get();
foreach ($bookings as $booking) {
    echo sprintf(
        "  • ID: %d | %s | Room: %d | Status: %s | Created: %s\n",
        $booking->id,
        $booking->booking_number,
        $booking->room_id,
        $booking->status,
        $booking->created_at->format('Y-m-d H:i')
    );
}

// Check for duplicate booking numbers
$duplicates = DB::table('room_bookings')
    ->select('booking_number', DB::raw('COUNT(*) as count'))
    ->groupBy('booking_number')
    ->having('count', '>', 1)
    ->get();

if ($duplicates->count() > 0) {
    echo "\n⚠ WARNING: Duplicate booking numbers found:\n";
    foreach ($duplicates as $dup) {
        echo "  • {$dup->booking_number} appears {$dup->count} times\n";
    }
} else {
    echo "\n✓ No duplicate booking numbers\n";
}

// Test booking number generation
echo "\nNext booking number would be: " . RoomBooking::generateBookingNumber() . "\n";
echo "\n";

// 4. Check POS Number Generation
echo "4. TESTING POS NUMBER GENERATION\n";
echo str_repeat("-", 80) . "\n";
$nextPosNumber = Pos::generateSaleNumber();
echo "Next POS number: {$nextPosNumber}\n";

// Check if it already exists
$exists = Pos::where('sale_number', $nextPosNumber)->exists();
echo "Already exists: " . ($exists ? "YES ⚠" : "NO ✓") . "\n\n";

// 5. Check Products/Rooms availability
echo "5. CHECKING AVAILABLE ITEMS\n";
echo str_repeat("-", 80) . "\n";
$products = DB::table('product_service_items')
    ->where('created_by', creatorId())
    ->count();
echo "Total products: {$products}\n";

$rooms = DB::table('rooms')
    ->where('created_by', creatorId())
    ->count();
echo "Total rooms: {$rooms}\n\n";

// 6. Check recent errors
echo "6. RECENT ERRORS IN LOG\n";
echo str_repeat("-", 80) . "\n";
$logFile = storage_path('logs/laravel.log');
if (file_exists($logFile)) {
    $logContent = file_get_contents($logFile);
    $lines = explode("\n", $logContent);
    $recentErrors = array_slice($lines, -100);
    
    $posErrors = array_filter($recentErrors, function($line) {
        return stripos($line, 'POS Order') !== false || stripos($line, 'BOOK') !== false;
    });
    
    if (count($posErrors) > 0) {
        echo "Recent POS-related errors:\n";
        foreach (array_slice($posErrors, -5) as $error) {
            echo "  " . substr($error, 0, 150) . "...\n";
        }
    } else {
        echo "✓ No recent POS errors found\n";
    }
} else {
    echo "⚠ Log file not found\n";
}

echo "\n";
echo "=== DIAGNOSTIC COMPLETE ===\n";
echo "\nSUMMARY:\n";
echo "- POS Orders in DB: {$totalOrders}\n";
echo "- Orders visible to user: " . $controllerOrders->count() . "\n";
echo "- Room Bookings: {$totalBookings}\n";
echo "- Products: {$products}\n";
echo "- Rooms: {$rooms}\n";

if ($totalOrders != $controllerOrders->count()) {
    echo "\n⚠ WARNING: Not all orders are visible to the user!\n";
    echo "  This could be due to warehouse filtering.\n";
}

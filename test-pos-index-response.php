<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make('Illuminate\Contracts\Console\Kernel');
$kernel->bootstrap();

use Illuminate\Support\Facades\Auth;
use Illuminate\Http\Request;
use App\Models\Warehouse;
use Workdo\Pos\Models\Pos;

echo "=== TESTING POS INDEX CONTROLLER LOGIC ===\n\n";

// Login as user 1
$user = \App\Models\User::find(1);
Auth::login($user);

echo "1. Logged in as: {$user->name} (ID: {$user->id}, Type: {$user->type})\n\n";

// Simulate getUserWarehouseIds()
echo "2. Getting warehouse IDs...\n";
$warehouseIds = getUserWarehouseIds();
echo "   Initial warehouse IDs: " . json_encode($warehouseIds) . "\n";
echo "   Count: " . count($warehouseIds) . "\n\n";

// Apply the fix
if (empty($warehouseIds)) {
    echo "   WARNING: Warehouse IDs empty! Applying fallback...\n";
    $warehouseIds = Warehouse::where('created_by', creatorId())
        ->pluck('id')
        ->toArray();
    echo "   After fallback: " . json_encode($warehouseIds) . "\n";
    echo "   Count: " . count($warehouseIds) . "\n\n";
}

// Build the query exactly as the controller does
echo "3. Building query...\n";
$query = Pos::with(['customer:id,name,email', 'warehouse:id,name', 'payment:pos_id,discount,amount,discount_amount,paid_amount,balance_due'])
    ->withCount('items')
    ->where('created_by', creatorId())
    ->whereIn('warehouse_id', $warehouseIds);

$count = $query->count();
echo "   Query count: {$count}\n\n";

if ($count > 0) {
    echo "4. Fetching results...\n";
    $sales = $query->paginate(10);
    
    echo "   Total: {$sales->total()}\n";
    echo "   Per Page: {$sales->perPage()}\n";
    echo "   Current Page: {$sales->currentPage()}\n\n";
    
    echo "5. Sales data:\n";
    foreach ($sales as $sale) {
        echo "   - ID: {$sale->id}\n";
        echo "     Sale Number: {$sale->sale_number}\n";
        echo "     Warehouse ID: {$sale->warehouse_id}\n";
        echo "     Warehouse Name: " . ($sale->warehouse ? $sale->warehouse->name : 'NULL') . "\n";
        echo "     Customer: " . ($sale->customer ? $sale->customer->name : 'Walk-in') . "\n";
        echo "     Status: {$sale->status}\n";
        echo "     Items Count: {$sale->items_count}\n";
        echo "     Payment: " . ($sale->payment ? 'YES' : 'NO') . "\n";
        
        if ($sale->payment) {
            echo "     - Amount: {$sale->payment->amount}\n";
            echo "     - Discount: {$sale->payment->discount}\n";
            echo "     - Discount Amount: {$sale->payment->discount_amount}\n";
            echo "     - Paid Amount: {$sale->payment->paid_amount}\n";
            echo "     - Balance Due: {$sale->payment->balance_due}\n";
        }
        echo "\n";
    }
    
    // Transform as controller does
    echo "6. After transformation:\n";
    $sales->getCollection()->transform(function($sale) {
        $sale->total = $sale->payment ? $sale->payment->discount_amount : 0;
        $sale->paid_amount = $sale->payment ? $sale->payment->paid_amount : 0;
        $sale->balance_due = $sale->payment ? $sale->payment->balance_due : 0;
        return $sale;
    });
    
    foreach ($sales as $sale) {
        echo "   - {$sale->sale_number}: Total={$sale->total}, Paid={$sale->paid_amount}, Balance={$sale->balance_due}\n";
    }
    
    echo "\n7. JSON output (what Inertia would send):\n";
    echo json_encode([
        'sales' => [
            'data' => $sales->items(),
            'total' => $sales->total(),
            'per_page' => $sales->perPage(),
            'current_page' => $sales->currentPage(),
        ]
    ], JSON_PRETTY_PRINT);
    
} else {
    echo "4. NO RESULTS FOUND!\n";
    echo "   This means the query is not returning any data.\n";
}

echo "\n\n=== END OF TEST ===\n";

<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "=== Debugging Stock Requisitions ===\n\n";

// Check if any requisitions exist
$count = \Workdo\StockRequisition\Models\StockRequisition::count();
echo "Total requisitions in database: $count\n\n";

if ($count > 0) {
    echo "Latest requisition:\n";
    echo "-------------------\n";
    
    $requisition = \Workdo\StockRequisition\Models\StockRequisition::with(['requestedBy', 'warehouse', 'items'])
        ->latest()
        ->first();
    
    if ($requisition) {
        echo "ID: " . $requisition->id . "\n";
        echo "Requisition #: " . $requisition->requisition_number . "\n";
        echo "Date: " . $requisition->requisition_date . "\n";
        echo "Required Date: " . $requisition->required_date . "\n";
        echo "Status: " . $requisition->status . "\n";
        echo "Priority: " . $requisition->priority . "\n";
        echo "Department: " . ($requisition->department ?? 'N/A') . "\n";
        echo "Warehouse ID: " . $requisition->warehouse_id . "\n";
        echo "Warehouse: " . ($requisition->warehouse->name ?? 'NOT LOADED') . "\n";
        echo "Requested By ID: " . $requisition->requested_by . "\n";
        echo "Requested By: " . ($requisition->requestedBy->name ?? 'NOT LOADED') . "\n";
        echo "Items Count: " . $requisition->items->count() . "\n\n";
        
        if ($requisition->items->count() > 0) {
            echo "Items:\n";
            foreach ($requisition->items as $item) {
                echo "  - Product ID: " . $item->product_id . "\n";
                echo "    Quantity: " . $item->quantity . "\n";
                echo "    Notes: " . ($item->notes ?? 'N/A') . "\n\n";
            }
        }
        
        echo "\nRaw data as JSON:\n";
        echo json_encode($requisition->toArray(), JSON_PRETTY_PRINT) . "\n";
    }
} else {
    echo "No requisitions found in database.\n";
    echo "\nChecking tables exist:\n";
    echo "stock_requisitions: " . (Schema::hasTable('stock_requisitions') ? 'YES' : 'NO') . "\n";
    echo "stock_requisition_items: " . (Schema::hasTable('stock_requisition_items') ? 'YES' : 'NO') . "\n";
}

echo "\n=== Debug Complete ===\n";

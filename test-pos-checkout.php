<?php

require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Workdo\Pos\Models\Pos;
use Workdo\Pos\Models\PosItem;
use Workdo\Pos\Models\PosPayment;

echo "=== TESTING POS CHECKOUT PROCESS ===\n\n";

// Login as user 1
Auth::loginUsingId(1);
echo "1. Logged in as: " . Auth::user()->name . "\n\n";

// Simulate checkout data
$checkoutData = [
    'customer_id' => null,
    'warehouse_id' => 4, // Kigali
    'bank_account_id' => 1,
    'items' => [
        [
            'id' => 1, // Product ID
            'quantity' => 2,
            'price' => 75,
            'notes' => 'Test order from script'
        ]
    ],
    'discount' => 0,
    'paid_amount' => 150,
    'pos_date' => now()->toDateString(),
];

echo "2. Checkout data prepared:\n";
echo "   Warehouse: {$checkoutData['warehouse_id']}\n";
echo "   Items: " . count($checkoutData['items']) . "\n";
echo "   Total: 150\n\n";

DB::beginTransaction();
try {
    echo "3. Creating POS order...\n";
    
    $saleNumber = Pos::generateSaleNumber();
    echo "   Sale Number: {$saleNumber}\n";
    
    $sale = new Pos();
    $sale->sale_number = $saleNumber;
    $sale->customer_id = $checkoutData['customer_id'];
    $sale->warehouse_id = $checkoutData['warehouse_id'];
    $sale->pos_date = $checkoutData['pos_date'];
    $sale->creator_id = Auth::id();
    $sale->created_by = creatorId();
    $sale->save();
    
    echo "   ✓ POS created with ID: {$sale->id}\n\n";
    
    echo "4. Creating POS items...\n";
    $finalAmount = 0;
    
    foreach ($checkoutData['items'] as $item) {
        $product = \Workdo\ProductService\Models\ProductServiceItem::find($item['id']);
        
        if (!$product) {
            throw new \Exception("Product ID {$item['id']} not found");
        }
        
        $subtotal = $item['quantity'] * $item['price'];
        $taxAmount = 0;
        $totalAmount = $subtotal + $taxAmount;
        $finalAmount += $totalAmount;
        
        $saleItem = new PosItem();
        $saleItem->pos_id = $sale->id;
        $saleItem->product_id = $item['id'];
        $saleItem->quantity = $item['quantity'];
        $saleItem->price = $item['price'];
        $saleItem->tax_ids = null;
        $saleItem->subtotal = $subtotal;
        $saleItem->tax_amount = $taxAmount;
        $saleItem->total_amount = $totalAmount;
        $saleItem->notes = $item['notes'];
        $saleItem->creator_id = Auth::id();
        $saleItem->created_by = creatorId();
        $saleItem->save();
        
        echo "   ✓ Item created: {$product->name} x {$item['quantity']}\n";
    }
    
    echo "\n5. Creating payment...\n";
    
    $discount = $checkoutData['discount'];
    $totalBeforeDiscount = $finalAmount;
    $totalAfterDiscount = $finalAmount - $discount;
    $paidAmount = $checkoutData['paid_amount'];
    $balanceDue = $totalAfterDiscount - $paidAmount;
    
    $posPayment = new PosPayment();
    $posPayment->pos_id = $sale->id;
    $posPayment->discount = $discount;
    $posPayment->amount = $totalBeforeDiscount;
    $posPayment->discount_amount = $totalAfterDiscount;
    $posPayment->paid_amount = $paidAmount;
    $posPayment->balance_due = $balanceDue;
    $posPayment->creator_id = Auth::id();
    $posPayment->created_by = creatorId();
    $posPayment->save();
    
    echo "   ✓ Payment created\n";
    echo "   - Total: {$totalAfterDiscount}\n";
    echo "   - Paid: {$paidAmount}\n";
    echo "   - Balance: {$balanceDue}\n\n";
    
    echo "6. Updating sale status...\n";
    
    if ($balanceDue > 0 && $paidAmount > 0) {
        $sale->status = 'partial';
    } elseif ($balanceDue <= 0) {
        $sale->status = 'completed';
    } else {
        $sale->status = 'pending';
    }
    $sale->save();
    
    echo "   ✓ Status: {$sale->status}\n\n";
    
    DB::commit();
    
    echo "✅ SUCCESS! POS order created successfully.\n";
    echo "   Order ID: {$sale->id}\n";
    echo "   Sale Number: {$sale->sale_number}\n\n";
    
    echo "7. Verifying in database...\n";
    $verify = DB::table('pos')->where('id', $sale->id)->first();
    echo "   ✓ Found in database: {$verify->sale_number}\n";
    
} catch (\Exception $e) {
    DB::rollBack();
    echo "\n❌ ERROR: " . $e->getMessage() . "\n";
    echo "\nStack trace:\n";
    echo $e->getTraceAsString() . "\n";
}

echo "\n=== END OF TEST ===\n";

<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Workdo\Pos\Models\Pos;
use Workdo\Pos\Models\PosItem;
use Workdo\Pos\Models\PosPayment;
use Workdo\ProductService\Models\ProductServiceItem;

echo "=== STEP-BY-STEP POS ORDER CREATION TEST ===\n\n";

// Login as user 1
Auth::loginUsingId(1);
echo "✓ Logged in as User ID: " . Auth::id() . "\n\n";

// Step 1: Get product from database
echo "STEP 1: Fetch Product from Database\n";
echo str_repeat("-", 80) . "\n";
$product = ProductServiceItem::find(8); // Soap
if (!$product) {
    echo "ERROR: Product not found!\n";
    exit;
}
echo "Product: {$product->name}\n";
echo "Database Price: {$product->sale_price}\n";
echo "Type: " . gettype($product->sale_price) . "\n";
$dbPrice = (float) $product->sale_price;
echo "Converted to float: {$dbPrice}\n\n";

// Step 2: Simulate what frontend sends
echo "STEP 2: Simulate Frontend Data\n";
echo str_repeat("-", 80) . "\n";
$frontendPrice = 500; // What user sees in the dialog
echo "Frontend sends price: {$frontendPrice}\n";
echo "Type: " . gettype($frontendPrice) . "\n\n";

// Step 3: Calculate amounts (like backend does)
echo "STEP 3: Calculate Amounts\n";
echo str_repeat("-", 80) . "\n";
$quantity = 1;
$subtotal = $dbPrice * $quantity;
echo "Using DB price: {$dbPrice} * {$quantity} = {$subtotal}\n";
$subtotalFromFrontend = $frontendPrice * $quantity;
echo "Using frontend price: {$frontendPrice} * {$quantity} = {$subtotalFromFrontend}\n\n";

// Step 4: Create actual POS order
echo "STEP 4: Create POS Order in Database\n";
echo str_repeat("-", 80) . "\n";

DB::beginTransaction();
try {
    // Create POS record
    $sale = new Pos();
    $sale->sale_number = '#TEST' . time();
    $sale->customer_id = null;
    $sale->warehouse_id = 4;
    $sale->pos_date = now()->toDateString();
    $sale->status = 'pending';
    $sale->creator_id = Auth::id();
    $sale->created_by = creatorId();
    $sale->save();
    echo "✓ POS created: {$sale->sale_number} (ID: {$sale->id})\n";

    // Create POS Item using DATABASE price
    $saleItem = new PosItem();
    $saleItem->pos_id = $sale->id;
    $saleItem->product_id = $product->id;
    $saleItem->quantity = $quantity;
    $saleItem->price = $dbPrice; // Using database price
    $saleItem->tax_ids = null;
    $saleItem->subtotal = $subtotal;
    $saleItem->tax_amount = 0;
    $saleItem->total_amount = $subtotal;
    $saleItem->notes = 'Test order';
    $saleItem->creator_id = Auth::id();
    $saleItem->created_by = creatorId();
    $saleItem->save();
    echo "✓ POS Item created with price: {$saleItem->price}\n";

    // Create Payment
    $payment = new PosPayment();
    $payment->pos_id = $sale->id;
    $payment->discount = 0;
    $payment->amount = $subtotal;
    $payment->discount_amount = $subtotal;
    $payment->paid_amount = $subtotal;
    $payment->balance_due = 0;
    $payment->creator_id = Auth::id();
    $payment->created_by = creatorId();
    $payment->save();
    echo "✓ Payment created\n";

    $sale->status = 'completed';
    $sale->save();

    DB::commit();
    echo "\n✓ Transaction committed successfully!\n\n";

    // Step 5: Verify what was saved
    echo "STEP 5: Verify Saved Data\n";
    echo str_repeat("-", 80) . "\n";
    $savedItem = PosItem::find($saleItem->id);
    echo "Saved price in database: {$savedItem->price}\n";
    echo "Expected price: {$dbPrice}\n";
    echo "Match: " . ($savedItem->price == $dbPrice ? "YES ✓" : "NO ✗") . "\n\n";

    if ($savedItem->price != $dbPrice) {
        echo "ERROR: Price mismatch! Something modified the price after saving.\n";
        echo "This could be:\n";
        echo "1. Database trigger\n";
        echo "2. Model accessor/mutator\n";
        echo "3. Observer/Event listener\n";
    } else {
        echo "SUCCESS: Price saved correctly!\n";
    }

    echo "\nTest order created: {$sale->sale_number}\n";
    echo "You can delete it with: DELETE FROM pos WHERE id = {$sale->id};\n";

} catch (\Exception $e) {
    DB::rollBack();
    echo "\nERROR: " . $e->getMessage() . "\n";
}

echo "\n=== TEST COMPLETE ===\n";

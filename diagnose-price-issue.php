<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Support\Facades\DB;

echo "=== PRICE ISSUE DIAGNOSTIC ===\n\n";

// 1. Check product prices in database
echo "1. PRODUCT PRICES IN DATABASE\n";
echo str_repeat("-", 80) . "\n";
$products = DB::table('product_service_items')
    ->whereIn('id', [3, 5]) // Fanta and Toilet paper
    ->get(['id', 'name', 'sale_price']);

foreach ($products as $product) {
    echo sprintf("Product ID %d: %s = %s\n", $product->id, $product->name, $product->sale_price);
}
echo "\n";

// 2. Check recent POS items to see saved prices
echo "2. RECENT POS ITEMS (Last 5 orders)\n";
echo str_repeat("-", 80) . "\n";
$posItems = DB::table('pos_items')
    ->join('pos', 'pos_items.pos_id', '=', 'pos.id')
    ->join('product_service_items', 'pos_items.product_id', '=', 'product_service_items.id')
    ->select(
        'pos.sale_number',
        'product_service_items.name as product_name',
        'product_service_items.sale_price as db_price',
        'pos_items.price as saved_price',
        'pos_items.quantity',
        'pos_items.total_amount',
        'pos.created_at'
    )
    ->orderBy('pos.created_at', 'desc')
    ->limit(5)
    ->get();

foreach ($posItems as $item) {
    $multiplier = $item->db_price > 0 ? ($item->saved_price / $item->db_price) : 0;
    echo sprintf(
        "%s | %s\n  DB Price: %s | Saved Price: %s | Multiplier: %.2fx | Total: %s\n",
        $item->sale_number,
        $item->product_name,
        $item->db_price,
        $item->saved_price,
        $multiplier,
        $item->total_amount
    );
}
echo "\n";

// 3. Check if there's a pattern
echo "3. PRICE MULTIPLICATION PATTERN\n";
echo str_repeat("-", 80) . "\n";
$analysis = DB::table('pos_items')
    ->join('product_service_items', 'pos_items.product_id', '=', 'product_service_items.id')
    ->select(
        DB::raw('product_service_items.sale_price as db_price'),
        DB::raw('pos_items.price as saved_price'),
        DB::raw('COUNT(*) as count')
    )
    ->groupBy('product_service_items.sale_price', 'pos_items.price')
    ->orderBy('count', 'desc')
    ->limit(10)
    ->get();

foreach ($analysis as $row) {
    $multiplier = $row->db_price > 0 ? ($row->saved_price / $row->db_price) : 0;
    echo sprintf(
        "DB: %s → Saved: %s (x%.2f) - %d occurrences\n",
        $row->db_price,
        $row->saved_price,
        $multiplier,
        $row->count
    );
}
echo "\n";

// 4. Check currency settings
echo "4. CURRENCY SETTINGS\n";
echo str_repeat("-", 80) . "\n";
$settings = DB::table('settings')
    ->whereIn('key', ['currencySymbol', 'decimalFormat', 'decimalSeparator', 'thousandsSeparator', 'floatNumber'])
    ->get(['key', 'value']);

foreach ($settings as $setting) {
    echo sprintf("%s: %s\n", $setting->key, $setting->value);
}
echo "\n";

echo "=== DIAGNOSTIC COMPLETE ===\n";
echo "\nCONCLUSION:\n";
echo "If you see prices multiplied by 100 (e.g., 500 → 50000), the issue is in the frontend.\n";
echo "The fix applied should use database prices instead of frontend prices.\n";
echo "If the issue persists, the code changes may not be loaded (cache issue).\n";

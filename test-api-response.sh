#!/bin/bash
# Test script to check if the API response has script injection

echo "Testing API endpoint for script injection..."
echo "============================================"
echo ""

# Replace with your actual warehouse ID
WAREHOUSE_ID=1

# Test the endpoint
echo "Fetching: /sales-invoices/warehouse/products?warehouse_id=$WAREHOUSE_ID"
echo ""

# Make the request and save response
RESPONSE=$(php artisan tinker --execute="
\$warehouseId = $WAREHOUSE_ID;
\$products = \Workdo\ProductService\Models\ProductServiceItem::select('id', 'name', 'sku', 'sale_price', 'tax_ids', 'unit', 'type')
    ->where('is_active', true)
    ->where('created_by', creatorId())
    ->whereHas('warehouseStocks', function(\$q) use (\$warehouseId) {
        \$q->where('warehouse_id', \$warehouseId)
          ->where('quantity', '>', 0);
    })
    ->with(['warehouseStocks' => function(\$q) use (\$warehouseId) {
        \$q->where('warehouse_id', \$warehouseId);
    }])
    ->get()
    ->map(function (\$product) {
        \$stock = \$product->warehouseStocks->first();
        return [
            'id' => \$product->id,
            'name' => \$product->name,
            'sku' => \$product->sku,
            'sale_price' => \$product->sale_price,
            'unit' => \$product->unit,
            'type' => \$product->type,
            'stock_quantity' => \$stock ? \$stock->quantity : 0,
            'taxes' => \$product->taxes->map(function (\$tax) {
                return [
                    'id' => \$tax->id,
                    'tax_name' => \$tax->tax_name,
                    'rate' => \$tax->rate
                ];
            })
        ];
    });
echo json_encode(\$products);
")

echo "Response (first 200 characters):"
echo "$RESPONSE" | head -c 200
echo ""
echo ""

# Check for script tags
if echo "$RESPONSE" | grep -q "<script"; then
    echo "❌ SCRIPT TAG FOUND IN RESPONSE!"
    echo "This means the injection is happening at the SERVER level."
    echo ""
    echo "Possible causes:"
    echo "  1. Hosting provider injecting ads"
    echo "  2. Compromised server"
    echo "  3. Malicious code in your application"
    echo ""
else
    echo "✅ No script tags found in server response."
    echo "The injection is likely happening at:"
    echo "  1. Browser extension"
    echo "  2. ISP/Network level"
    echo "  3. Proxy server"
    echo ""
fi

echo "============================================"
echo "Now test from your browser to compare."

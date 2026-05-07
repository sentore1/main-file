#!/bin/bash

echo "=== Testing Warehouse Products API ==="
echo ""

# Get first warehouse ID
echo "1. Getting warehouse list..."
WAREHOUSE_ID=$(php artisan tinker --execute="echo \Workdo\ProductService\Entities\Warehouse::where('is_active', true)->first()->id ?? 'none';" 2>&1 | tail -1)

if [ "$WAREHOUSE_ID" = "none" ]; then
    echo "✗ No active warehouses found"
    echo ""
    echo "Create a warehouse first in Product & Service > Warehouses"
    exit 1
fi

echo "✓ Found warehouse ID: $WAREHOUSE_ID"
echo ""

# Test the API endpoint
echo "2. Testing API endpoint..."
echo "URL: /stock-requisitions/api/warehouse-products?warehouse_id=$WAREHOUSE_ID"
echo ""

# Make the request
RESPONSE=$(curl -s "https://pryro.eastgatehotel.rw/stock-requisitions/api/warehouse-products?warehouse_id=$WAREHOUSE_ID" 2>&1)

# Check if response is JSON
if echo "$RESPONSE" | python3 -m json.tool > /dev/null 2>&1; then
    echo "✓ API returned valid JSON"
    echo ""
    echo "Response:"
    echo "$RESPONSE" | python3 -m json.tool | head -50
    echo ""
    
    # Count products
    PRODUCT_COUNT=$(echo "$RESPONSE" | python3 -c "import sys, json; print(len(json.load(sys.stdin)))" 2>/dev/null || echo "0")
    echo "Found $PRODUCT_COUNT products"
else
    echo "✗ API did not return valid JSON"
    echo ""
    echo "Response:"
    echo "$RESPONSE" | head -20
    echo ""
    echo "This might be:"
    echo "- Authentication required (need to be logged in)"
    echo "- Route not registered"
    echo "- Controller method error"
fi

echo ""
echo "3. Checking route registration..."
php artisan tinker --execute="try { echo route('stock-requisitions.warehouse-products'); echo \"\n\"; } catch (Exception \$e) { echo 'Route not found: ' . \$e->getMessage() . \"\n\"; }"

echo ""
echo "4. Checking if controller method exists..."
php artisan tinker --execute="echo method_exists('Workdo\\StockRequisition\\Http\\Controllers\\StockRequisitionController', 'getWarehouseProducts') ? 'YES' : 'NO'; echo \"\n\";"

echo ""
echo "=== Test Complete ==="

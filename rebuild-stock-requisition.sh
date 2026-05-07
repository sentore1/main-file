#!/bin/bash

echo "=== Rebuilding Stock Requisition Frontend ==="
echo ""

echo "1. Running npm run build..."
npm run build

echo ""
echo "2. Clearing Laravel caches..."
php artisan cache:clear
php artisan view:clear

echo ""
echo "3. Checking if files were built..."
if [ -f "public/build/assets/Index-C-x4p8Px.js" ]; then
    echo "✓ Index.js exists"
else
    echo "✗ Index.js missing"
fi

echo ""
echo "4. Checking manifest..."
grep -c "StockRequisition/src/Resources/js/Pages" public/build/manifest.json

echo ""
echo "=== Build Complete ==="
echo ""
echo "Now test in browser:"
echo "1. Hard refresh: Ctrl+Shift+R"
echo "2. Go to: https://pryro.eastgatehotel.rw/stock-requisitions/create"
echo "3. Select a warehouse"
echo "4. Check if products load in the dropdown"
echo ""

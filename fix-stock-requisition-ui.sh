#!/bin/bash

echo "=== Fixing Stock Requisition UI Issues ==="
echo ""

echo "Step 1: Clear all Laravel caches..."
php artisan cache:clear
php artisan config:clear
php artisan route:clear
php artisan view:clear
echo "✓ Laravel caches cleared"
echo ""

echo "Step 2: Clear compiled views..."
rm -rf storage/framework/views/*.php 2>/dev/null
echo "✓ Compiled views cleared"
echo ""

echo "Step 3: Verify manifest has StockRequisition pages..."
PAGES_COUNT=$(grep -c "StockRequisition/src/Resources/js/Pages" public/build/manifest.json)
echo "Found $PAGES_COUNT StockRequisition pages in manifest"
echo ""

echo "Step 4: Check if JS assets exist..."
if [ -f "public/build/assets/Index-C-x4p8Px.js" ]; then
    echo "✓ Index.js exists"
else
    echo "✗ Index.js missing - need to rebuild"
fi
echo ""

echo "Step 5: Test route accessibility..."
php artisan tinker --execute="echo 'Route exists: '; echo route('stock-requisitions.index'); echo \"\n\";"
echo ""

echo "=== Next Steps ==="
echo "1. Hard refresh browser: Ctrl+Shift+R (Windows/Linux) or Cmd+Shift+R (Mac)"
echo "2. Or clear browser cache completely"
echo "3. If still not working, open browser DevTools (F12) and check:"
echo "   - Console tab for JavaScript errors"
echo "   - Network tab to see if JS files are loading (look for 404s)"
echo "   - Check the response from /stock-requisitions"
echo ""

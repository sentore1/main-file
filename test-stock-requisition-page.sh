#!/bin/bash

echo "=== Testing Stock Requisition Page Loading ==="
echo ""

echo "1. Check if pages are in manifest:"
grep -c "StockRequisition/src/Resources/js/Pages" public/build/manifest.json
echo ""

echo "2. Check actual JS files built:"
ls -lh public/build/assets/ | grep -i "Create-HG2unGS8\|Edit-6WABuG2P\|Index-C-x4p8Px" | head -5
echo ""

echo "3. Test page response (should return HTML with Inertia data):"
curl -s -H "Cookie: pryro_session=test" https://pryro.eastgatehotel.rw/stock-requisitions 2>&1 | head -50
echo ""

echo "4. Check if app.tsx is loading the glob patterns:"
grep -A 5 "import.meta.glob" resources/js/app.tsx
echo ""

echo "=== Diagnosis Complete ==="

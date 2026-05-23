#!/bin/bash

echo "=== QUICK POS EDIT DIAGNOSTIC ==="
echo ""

echo "1. Checking if build files exist..."
if [ -f "public/build/manifest.json" ]; then
    echo "   ✓ manifest.json exists"
else
    echo "   ✗ manifest.json MISSING - Need to run: npm run build"
fi

echo ""
echo "2. Checking sale #442..."
php test_pos_442.php | grep -E "(Sale Found|ERROR|Can edit)"

echo ""
echo "3. Checking routes..."
php artisan route:list | grep "pos.update"

echo ""
echo "4. Checking permissions..."
php test_edit_permission.php | grep -E "(edit-pos|manage-pos-orders)"

echo ""
echo "=== SUMMARY ==="
echo "If all checks pass, the backend is ready."
echo "Next: Test in browser and check Console/Network tabs"

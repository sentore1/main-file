#!/bin/bash

echo "=== POS EDIT FIX - REBUILD AND TEST ==="
echo ""

echo "Step 1: Building frontend assets..."
npm run build

echo ""
echo "Step 2: Clearing Laravel caches..."
php artisan cache:clear
php artisan config:clear
php artisan route:clear
php artisan view:clear

echo ""
echo "Step 3: Testing sale #442..."
php test_pos_442.php

echo ""
echo "Step 4: Testing update validation..."
php test_update_442.php

echo ""
echo "=== NEXT STEPS ==="
echo "1. Open browser to: https://pryro.eastgatehotel.rw/pos/orders/442/edit"
echo "2. Open browser console (F12)"
echo "3. Click 'Update Sale' button"
echo "4. Check console for logs:"
echo "   - Should see: '=== UPDATE SALE CLICKED ==='"
echo "   - Should see: 'onBefore triggered'"
echo "   - Should see: 'onStart triggered - Request sent'"
echo "   - Should see: 'Update successful' OR error message"
echo ""
echo "5. Check Network tab for the PUT request to /pos/orders/442"
echo "6. If you see errors, copy them and share"
echo ""
echo "Common issues:"
echo "- If nothing happens: JavaScript not loaded (check manifest.json)"
echo "- If 404 error: Route not found (check routes)"
echo "- If 419 error: CSRF token issue"
echo "- If 403 error: Permission denied"
echo "- If 422 error: Validation failed"

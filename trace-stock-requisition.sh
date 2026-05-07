#!/bin/bash

echo "=========================================="
echo "Stock Requisition UI Diagnostic Trace"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Check if files exist
echo "1. Checking Source Files..."
echo "-------------------------------------------"
if [ -f "packages/workdo/StockRequisition/src/Resources/js/Pages/StockRequisitions/Index.tsx" ]; then
    echo -e "${GREEN}✓${NC} Index.tsx exists"
    wc -l packages/workdo/StockRequisition/src/Resources/js/Pages/StockRequisitions/Index.tsx
else
    echo -e "${RED}✗${NC} Index.tsx missing"
fi

if [ -f "packages/workdo/StockRequisition/src/Resources/js/Pages/StockRequisitions/Create.tsx" ]; then
    echo -e "${GREEN}✓${NC} Create.tsx exists"
else
    echo -e "${RED}✗${NC} Create.tsx missing"
fi
echo ""

# Test 2: Check compiled files
echo "2. Checking Compiled JavaScript Files..."
echo "-------------------------------------------"
if [ -f "public/build/assets/Index-C-x4p8Px.js" ]; then
    echo -e "${GREEN}✓${NC} Index-C-x4p8Px.js exists"
    ls -lh public/build/assets/Index-C-x4p8Px.js
else
    echo -e "${RED}✗${NC} Index-C-x4p8Px.js missing - need to rebuild"
fi
echo ""

# Test 3: Check manifest
echo "3. Checking Manifest Entries..."
echo "-------------------------------------------"
MANIFEST_COUNT=$(grep -c "StockRequisition/src/Resources/js/Pages" public/build/manifest.json 2>/dev/null || echo "0")
echo "Found $MANIFEST_COUNT StockRequisition pages in manifest"

if [ "$MANIFEST_COUNT" -eq "4" ]; then
    echo -e "${GREEN}✓${NC} All 4 pages found in manifest"
    grep "StockRequisition/src/Resources/js/Pages" public/build/manifest.json | grep -o '"packages/workdo/StockRequisition[^"]*"' | sed 's/"//g'
else
    echo -e "${RED}✗${NC} Expected 4 pages, found $MANIFEST_COUNT"
fi
echo ""

# Test 4: Check what the controller is rendering
echo "4. Checking Controller Render Paths..."
echo "-------------------------------------------"
echo "Controller renders these Inertia pages:"
grep -o "Inertia::render('[^']*'" packages/workdo/StockRequisition/src/Http/Controllers/StockRequisitionController.php | sed "s/Inertia::render('/  - /" | sed "s/'$//"
echo ""

# Test 5: Test actual HTTP response
echo "5. Testing HTTP Response from Server..."
echo "-------------------------------------------"
echo "Fetching /stock-requisitions page..."
RESPONSE=$(curl -s -L -H "Accept: text/html" https://pryro.eastgatehotel.rw/stock-requisitions 2>&1)

# Check if response contains Inertia data
if echo "$RESPONSE" | grep -q "data-page"; then
    echo -e "${GREEN}✓${NC} Page contains Inertia data-page attribute"
    
    # Extract the component name from data-page
    COMPONENT=$(echo "$RESPONSE" | grep -o 'data-page="[^"]*"' | head -1 | sed 's/data-page="//;s/"$//' | grep -o '"component":"[^"]*"' | sed 's/"component":"//;s/"$//')
    
    if [ ! -z "$COMPONENT" ]; then
        echo "  Component being rendered: $COMPONENT"
    else
        echo -e "${YELLOW}⚠${NC} Could not extract component name from response"
    fi
else
    echo -e "${RED}✗${NC} Page does not contain Inertia data (might be redirecting to login)"
fi
echo ""

# Test 6: Check app.tsx resolver
echo "6. Checking Page Resolver Configuration..."
echo "-------------------------------------------"
echo "Glob patterns in resources/js/app.tsx:"
grep "import.meta.glob" resources/js/app.tsx
echo ""

# Test 7: Simulate page resolution
echo "7. Simulating Page Resolution..."
echo "-------------------------------------------"
echo "Testing if resolver can find: StockRequisition/StockRequisitions/Index"
echo ""
echo "Expected path: packages/workdo/StockRequisition/src/Resources/js/Pages/StockRequisitions/Index.tsx"
echo "Resolver pattern: ../../packages/workdo/*/src/Resources/js/Pages/**/*.tsx"
echo ""

# Parse the component name
PACKAGE="StockRequisition"
PAGE_PATH="StockRequisitions/Index"
EXPECTED_FILE="packages/workdo/$PACKAGE/src/Resources/js/Pages/$PAGE_PATH.tsx"

if [ -f "$EXPECTED_FILE" ]; then
    echo -e "${GREEN}✓${NC} File exists at expected location: $EXPECTED_FILE"
else
    echo -e "${RED}✗${NC} File NOT found at: $EXPECTED_FILE"
fi
echo ""

# Test 8: Check permissions
echo "8. Checking User Permissions..."
echo "-------------------------------------------"
php artisan tinker --execute="
\$user = \App\Models\User::where('type', 'company')->first();
if (\$user) {
    echo 'User: ' . \$user->name . ' (' . \$user->email . ')' . \"\n\";
    echo 'Can manage: ' . (\$user->can('manage-stock-requisitions') ? 'YES' : 'NO') . \"\n\";
    echo 'Can create: ' . (\$user->can('create-stock-requisitions') ? 'YES' : 'NO') . \"\n\";
    echo 'Can view: ' . (\$user->can('view-stock-requisitions') ? 'YES' : 'NO') . \"\n\";
} else {
    echo 'No company user found' . \"\n\";
}
"
echo ""

# Test 9: Check routes
echo "9. Checking Routes Registration..."
echo "-------------------------------------------"
php artisan tinker --execute="
try {
    echo 'Index: ' . route('stock-requisitions.index') . \"\n\";
    echo 'Create: ' . route('stock-requisitions.create') . \"\n\";
    echo 'Store: ' . route('stock-requisitions.store') . \"\n\";
} catch (Exception \$e) {
    echo 'Route error: ' . \$e->getMessage() . \"\n\";
}
"
echo ""

# Test 10: Check module activation
echo "10. Checking Module Activation..."
echo "-------------------------------------------"
php artisan tinker --execute="
\$modules = ActivatedModule();
\$index = array_search('StockRequisition', \$modules);
if (\$index !== false) {
    echo 'StockRequisition is ACTIVATED at position [' . \$index . ']' . \"\n\";
} else {
    echo 'StockRequisition is NOT activated' . \"\n\";
}
"
echo ""

# Test 11: Check actual page content
echo "11. Extracting Inertia Page Data..."
echo "-------------------------------------------"
echo "Fetching page and extracting data-page attribute..."
curl -s -L https://pryro.eastgatehotel.rw/stock-requisitions 2>&1 | grep -o 'data-page="[^"]*"' | head -1 | sed 's/data-page="//' | sed 's/"$//' | python3 -m json.tool 2>/dev/null || echo "Could not parse JSON (might need login)"
echo ""

# Summary
echo "=========================================="
echo "DIAGNOSTIC SUMMARY"
echo "=========================================="
echo ""
echo "If all checks pass but UI doesn't work:"
echo "1. The issue is BROWSER CACHE"
echo "2. Clear browser cache: Ctrl+Shift+R (hard refresh)"
echo "3. Or use Incognito mode"
echo ""
echo "If component name is wrong:"
echo "4. Check controller render paths match file structure"
echo ""
echo "If files are missing:"
echo "5. Run: npm run build"
echo ""

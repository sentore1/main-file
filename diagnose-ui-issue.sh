#!/bin/bash

# Master diagnostic script for Stock Requisition UI issues
# This will tell you exactly what's wrong

clear
echo "╔════════════════════════════════════════════════════════════╗"
echo "║   Stock Requisition UI Issue Diagnostic Tool              ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

PASS=0
FAIL=0

check_pass() {
    echo -e "${GREEN}✓${NC} $1"
    ((PASS++))
}

check_fail() {
    echo -e "${RED}✗${NC} $1"
    ((FAIL++))
}

check_warn() {
    echo -e "${YELLOW}⚠${NC} $1"
}

section() {
    echo ""
    echo -e "${BLUE}━━━ $1 ━━━${NC}"
}

# ============================================
# TEST 1: Source Files
# ============================================
section "1. Source Files"

if [ -f "packages/workdo/StockRequisition/src/Resources/js/Pages/StockRequisitions/Index.tsx" ]; then
    check_pass "Index.tsx source file exists"
else
    check_fail "Index.tsx source file MISSING"
fi

if [ -f "packages/workdo/StockRequisition/src/Resources/js/Pages/StockRequisitions/Create.tsx" ]; then
    check_pass "Create.tsx source file exists"
else
    check_fail "Create.tsx source file MISSING"
fi

# ============================================
# TEST 2: Compiled Files
# ============================================
section "2. Compiled JavaScript Files"

if [ -f "public/build/assets/Index-C-x4p8Px.js" ]; then
    SIZE=$(ls -lh public/build/assets/Index-C-x4p8Px.js | awk '{print $5}')
    check_pass "Index-C-x4p8Px.js compiled ($SIZE)"
else
    check_fail "Index-C-x4p8Px.js NOT compiled - run 'npm run build'"
fi

# ============================================
# TEST 3: Manifest
# ============================================
section "3. Build Manifest"

MANIFEST_COUNT=$(grep -c "StockRequisition/src/Resources/js/Pages" public/build/manifest.json 2>/dev/null || echo "0")

if [ "$MANIFEST_COUNT" -eq "4" ]; then
    check_pass "All 4 pages in manifest.json"
elif [ "$MANIFEST_COUNT" -gt "0" ]; then
    check_warn "Found $MANIFEST_COUNT pages (expected 4)"
else
    check_fail "No pages in manifest - run 'npm run build'"
fi

# ============================================
# TEST 4: Controller Configuration
# ============================================
section "4. Controller Configuration"

RENDER_PATHS=$(grep -o "Inertia::render('[^']*'" packages/workdo/StockRequisition/src/Http/Controllers/StockRequisitionController.php | wc -l)

if [ "$RENDER_PATHS" -ge "4" ]; then
    check_pass "Controller has $RENDER_PATHS Inertia::render() calls"
    
    # Check the actual paths
    FIRST_PATH=$(grep -o "Inertia::render('[^']*'" packages/workdo/StockRequisition/src/Http/Controllers/StockRequisitionController.php | head -1 | sed "s/Inertia::render('//;s/'//")
    echo "  First render path: $FIRST_PATH"
    
    # Verify file exists for this path
    PACKAGE=$(echo $FIRST_PATH | cut -d'/' -f1)
    SUBPATH=$(echo $FIRST_PATH | cut -d'/' -f2-)
    FILE_PATH="packages/workdo/$PACKAGE/src/Resources/js/Pages/$SUBPATH.tsx"
    
    if [ -f "$FILE_PATH" ]; then
        check_pass "File exists at: $FILE_PATH"
    else
        check_fail "File NOT found at: $FILE_PATH"
    fi
else
    check_fail "Controller missing Inertia::render() calls"
fi

# ============================================
# TEST 5: Routes
# ============================================
section "5. Routes Registration"

ROUTE_TEST=$(php artisan tinker --execute="try { echo route('stock-requisitions.index'); } catch (Exception \$e) { echo 'ERROR'; }" 2>&1)

if [[ "$ROUTE_TEST" == *"stock-requisitions"* ]]; then
    check_pass "Routes registered correctly"
    echo "  Index route: $ROUTE_TEST"
else
    check_fail "Routes NOT registered"
fi

# ============================================
# TEST 6: Module Activation
# ============================================
section "6. Module Activation"

MODULE_CHECK=$(php artisan tinker --execute="\$m = ActivatedModule(); echo in_array('StockRequisition', \$m) ? 'YES' : 'NO';" 2>&1)

if [[ "$MODULE_CHECK" == *"YES"* ]]; then
    check_pass "StockRequisition module is activated"
else
    check_fail "StockRequisition module NOT activated"
fi

# ============================================
# TEST 7: Permissions
# ============================================
section "7. Permissions"

PERM_COUNT=$(php artisan tinker --execute="echo \Spatie\Permission\Models\Permission::where('module', 'stock-requisition')->count();" 2>&1 | tail -1)

if [ "$PERM_COUNT" -eq "8" ]; then
    check_pass "All 8 permissions created"
else
    check_warn "Found $PERM_COUNT permissions (expected 8)"
fi

# ============================================
# TEST 8: HTTP Response
# ============================================
section "8. HTTP Response Test"

HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" https://pryro.eastgatehotel.rw/stock-requisitions 2>&1)

if [ "$HTTP_CODE" = "200" ]; then
    check_pass "Page returns HTTP 200"
elif [ "$HTTP_CODE" = "302" ]; then
    check_warn "Page redirects (HTTP 302) - probably needs login"
else
    check_fail "Page returns HTTP $HTTP_CODE"
fi

# ============================================
# TEST 9: Page Resolution
# ============================================
section "9. Page Resolution Logic"

# Check app.tsx glob pattern
if grep -q "packages/workdo/\*/src/Resources/js/Pages/\*\*/\*.tsx" resources/js/app.tsx; then
    check_pass "Glob pattern includes package pages"
else
    check_warn "Glob pattern might not match package structure"
fi

# ============================================
# SUMMARY
# ============================================
echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                      DIAGNOSTIC SUMMARY                    ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo -e "Tests Passed: ${GREEN}$PASS${NC}"
echo -e "Tests Failed: ${RED}$FAIL${NC}"
echo ""

# ============================================
# RECOMMENDATIONS
# ============================================
if [ $FAIL -eq 0 ]; then
    echo -e "${GREEN}✓ All backend checks passed!${NC}"
    echo ""
    echo "If UI still doesn't work, the issue is BROWSER CACHE:"
    echo ""
    echo "Solution 1: Hard Refresh"
    echo "  • Windows/Linux: Ctrl + Shift + R"
    echo "  • Mac: Cmd + Shift + R"
    echo ""
    echo "Solution 2: Clear Browser Cache"
    echo "  • Press F12 (DevTools)"
    echo "  • Right-click refresh button"
    echo "  • Select 'Empty Cache and Hard Reload'"
    echo ""
    echo "Solution 3: Incognito Mode"
    echo "  • Open new incognito/private window"
    echo "  • Navigate to: https://pryro.eastgatehotel.rw/stock-requisitions"
    echo ""
    echo "Solution 4: Check Browser Console"
    echo "  • Press F12"
    echo "  • Go to Console tab"
    echo "  • Look for JavaScript errors"
    echo "  • Type: window.page"
    echo "  • Check 'component' property"
    echo ""
else
    echo -e "${RED}✗ Found $FAIL issue(s) that need fixing:${NC}"
    echo ""
    
    if [ ! -f "public/build/assets/Index-C-x4p8Px.js" ]; then
        echo "1. Rebuild frontend:"
        echo "   npm run build"
        echo ""
    fi
    
    if [ "$MANIFEST_COUNT" -eq "0" ]; then
        echo "2. Pages not in manifest - rebuild required:"
        echo "   npm run build"
        echo ""
    fi
    
    if [[ "$MODULE_CHECK" != *"YES"* ]]; then
        echo "3. Activate module in database:"
        echo "   Check 'add_ons' table"
        echo ""
    fi
    
    echo "After fixing, run this script again to verify."
fi

echo ""
echo "For detailed trace, run: bash trace-stock-requisition.sh"
echo ""

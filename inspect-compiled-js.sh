#!/bin/bash

echo "=== Inspecting Compiled JavaScript ==="
echo ""

# Find the actual compiled file
echo "1. Finding compiled Index.js file..."
INDEX_FILE=$(find public/build/assets -name "Index-*.js" -path "*/assets/*" | grep -v "map" | head -1)

if [ -z "$INDEX_FILE" ]; then
    echo "✗ No Index-*.js file found"
    echo ""
    echo "Searching for any StockRequisition related files..."
    find public/build/assets -name "*.js" | xargs grep -l "StockRequisition" 2>/dev/null | head -5
else
    echo "✓ Found: $INDEX_FILE"
    echo "  Size: $(ls -lh "$INDEX_FILE" | awk '{print $5}')"
    echo ""
    
    echo "2. Checking file content..."
    echo "First 50 characters:"
    head -c 50 "$INDEX_FILE"
    echo ""
    echo ""
    
    echo "3. Searching for React component export..."
    if grep -q "export default" "$INDEX_FILE"; then
        echo "✓ Contains 'export default'"
    else
        echo "✗ No 'export default' found"
    fi
    
    if grep -q "function Index" "$INDEX_FILE" || grep -q "function.*Index" "$INDEX_FILE"; then
        echo "✓ Contains Index function"
    else
        echo "⚠ No Index function found (might be minified)"
    fi
    
    echo ""
    echo "4. Checking for common React patterns..."
    if grep -q "React" "$INDEX_FILE" || grep -q "jsx" "$INDEX_FILE" || grep -q "createElement" "$INDEX_FILE"; then
        echo "✓ Contains React code"
    else
        echo "⚠ No obvious React patterns (might be heavily minified)"
    fi
    
    echo ""
    echo "5. Checking for Inertia imports..."
    if grep -q "inertia" "$INDEX_FILE" || grep -q "@inertiajs" "$INDEX_FILE"; then
        echo "✓ Contains Inertia references"
    else
        echo "⚠ No Inertia references found"
    fi
fi

echo ""
echo "=== Checking All StockRequisition Compiled Files ==="
echo ""

echo "Files in manifest:"
grep "StockRequisition/src/Resources/js/Pages" public/build/manifest.json | grep -o '"file": "[^"]*"' | sed 's/"file": "//;s/"$//' | while read file; do
    if [ -f "public/build/$file" ]; then
        SIZE=$(ls -lh "public/build/$file" | awk '{print $5}')
        echo "✓ $file ($SIZE)"
    else
        echo "✗ $file (MISSING)"
    fi
done

echo ""
echo "=== Checking Main App Bundle ==="
echo ""

# Check if main app.tsx is loading the glob
MAIN_APP="public/build/assets/app-*.js"
APP_FILE=$(ls $MAIN_APP 2>/dev/null | head -1)

if [ ! -z "$APP_FILE" ]; then
    echo "Main app bundle: $APP_FILE"
    echo "Size: $(ls -lh "$APP_FILE" | awk '{print $5}')"
    
    # Check if it contains the glob pattern
    if grep -q "packages/workdo" "$APP_FILE" 2>/dev/null; then
        echo "✓ Contains package glob pattern"
    else
        echo "⚠ No package glob pattern found (might be in separate chunk)"
    fi
else
    echo "✗ Main app bundle not found"
fi

echo ""
echo "=== Testing File Accessibility ==="
echo ""

# Test if files are accessible via HTTP
echo "Testing HTTP access to compiled JS..."
INDEX_HASH=$(grep "StockRequisition/src/Resources/js/Pages/StockRequisitions/Index.tsx" public/build/manifest.json | grep -o '"file": "[^"]*"' | sed 's/"file": "assets\///;s/"$//')

if [ ! -z "$INDEX_HASH" ]; then
    URL="https://pryro.eastgatehotel.rw/build/assets/$INDEX_HASH"
    echo "Testing: $URL"
    
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$URL")
    echo "HTTP Status: $HTTP_CODE"
    
    if [ "$HTTP_CODE" = "200" ]; then
        echo "✓ File is accessible via HTTP"
    else
        echo "✗ File returned $HTTP_CODE (should be 200)"
    fi
else
    echo "Could not extract file hash from manifest"
fi

echo ""
echo "=== Summary ==="
echo ""
echo "Run this script to diagnose the issue."
echo "Then run: bash trace-stock-requisition.sh"
echo "For full diagnostic trace."
echo ""

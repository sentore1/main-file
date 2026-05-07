#!/bin/bash

echo "=== Checking Inertia Response ==="
echo ""

# Get a valid session cookie first by logging in
echo "Step 1: Testing page response..."
echo ""

# Method 1: Check what component Inertia is trying to load
echo "Fetching page HTML..."
RESPONSE=$(curl -s -L https://pryro.eastgatehotel.rw/stock-requisitions 2>&1)

# Extract data-page attribute
echo "$RESPONSE" | grep -o 'data-page="{[^}]*}"' | sed 's/data-page="//' | sed 's/"$//' > /tmp/inertia_data.json 2>/dev/null

if [ -f /tmp/inertia_data.json ] && [ -s /tmp/inertia_data.json ]; then
    echo "✓ Found Inertia data-page attribute"
    echo ""
    echo "Component being loaded:"
    cat /tmp/inertia_data.json | python3 -c "import sys, json; data=json.load(sys.stdin); print('  ', data.get('component', 'NOT FOUND'))" 2>/dev/null || echo "  (Could not parse - might need authentication)"
    echo ""
    echo "Full Inertia data:"
    cat /tmp/inertia_data.json | python3 -m json.tool 2>/dev/null || cat /tmp/inertia_data.json
else
    echo "✗ No Inertia data found (page might be redirecting to login)"
    echo ""
    echo "Checking if it's a redirect..."
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" https://pryro.eastgatehotel.rw/stock-requisitions)
    echo "HTTP Status: $HTTP_CODE"
    
    if [ "$HTTP_CODE" = "302" ] || [ "$HTTP_CODE" = "301" ]; then
        echo "Page is redirecting (probably to login)"
        echo ""
        echo "To test properly, you need to:"
        echo "1. Login to the application in your browser"
        echo "2. Open DevTools (F12)"
        echo "3. Go to Console tab"
        echo "4. Type: window.page"
        echo "5. Look for 'component' property"
        echo "6. It should show: 'StockRequisition/StockRequisitions/Index'"
    fi
fi

echo ""
echo "=== Checking File Resolution ==="
echo ""

# Check if the resolver can find the file
COMPONENT_PATH="StockRequisition/StockRequisitions/Index"
echo "Component path from controller: $COMPONENT_PATH"
echo ""

# Split the path
PACKAGE=$(echo $COMPONENT_PATH | cut -d'/' -f1)
SUBPATH=$(echo $COMPONENT_PATH | cut -d'/' -f2-)

echo "Package: $PACKAGE"
echo "Page path: $SUBPATH"
echo ""

# Check if file exists
FILE_PATH="packages/workdo/$PACKAGE/src/Resources/js/Pages/$SUBPATH.tsx"
echo "Expected file location: $FILE_PATH"

if [ -f "$FILE_PATH" ]; then
    echo "✓ File exists"
    echo "  Size: $(wc -c < "$FILE_PATH") bytes"
    echo "  Lines: $(wc -l < "$FILE_PATH") lines"
else
    echo "✗ File NOT found"
fi

echo ""
echo "=== Checking Manifest Entry ==="
echo ""

# Check manifest
MANIFEST_KEY="packages/workdo/$PACKAGE/src/Resources/js/Pages/$SUBPATH.tsx"
echo "Looking for: $MANIFEST_KEY"

if grep -q "\"$MANIFEST_KEY\"" public/build/manifest.json; then
    echo "✓ Found in manifest"
    echo ""
    echo "Manifest entry:"
    grep -A 10 "\"$MANIFEST_KEY\"" public/build/manifest.json | head -15
else
    echo "✗ NOT found in manifest"
    echo ""
    echo "This means the file wasn't compiled. Run: npm run build"
fi

echo ""
echo "=== Resolver Logic Test ==="
echo ""

# Show how the resolver works
echo "The app.tsx resolver does this:"
echo "1. Takes component name: '$COMPONENT_PATH'"
echo "2. Splits by '/': ['$PACKAGE', '$(echo $SUBPATH | tr '/' ' ')']"
echo "3. Builds path: ../../packages/workdo/$PACKAGE/src/Resources/js/Pages/$SUBPATH.tsx"
echo "4. Checks if it exists in the glob pattern"
echo ""

# Check glob pattern
echo "Glob pattern in app.tsx:"
grep "import.meta.glob.*packages/workdo" resources/js/app.tsx | head -1

echo ""
echo "=== Quick Fix Commands ==="
echo ""
echo "If file exists but not in manifest:"
echo "  npm run build"
echo ""
echo "If everything looks good but UI doesn't work:"
echo "  # Clear Laravel cache"
echo "  php artisan cache:clear"
echo "  php artisan view:clear"
echo "  "
echo "  # Then clear BROWSER cache (Ctrl+Shift+R)"
echo ""

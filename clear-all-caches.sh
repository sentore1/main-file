#!/bin/bash

echo "=== Clearing All Server-Side Caches ==="
echo ""

echo "1. Laravel application cache..."
php artisan cache:clear
echo "✓ Done"
echo ""

echo "2. Configuration cache..."
php artisan config:clear
echo "✓ Done"
echo ""

echo "3. Route cache..."
php artisan route:clear
echo "✓ Done"
echo ""

echo "4. View cache..."
php artisan view:clear
echo "✓ Done"
echo ""

echo "5. Compiled views..."
rm -rf storage/framework/views/*.php 2>/dev/null
echo "✓ Done"
echo ""

echo "6. Compiled class files..."
php artisan clear-compiled 2>/dev/null
echo "✓ Done"
echo ""

echo "=== Server Caches Cleared Successfully ==="
echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║              NEXT STEP: CLEAR BROWSER CACHE                ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo "The server is ready. Now you MUST clear browser cache:"
echo ""
echo "METHOD 1: Hard Refresh (Easiest)"
echo "  1. Go to: https://pryro.eastgatehotel.rw/stock-requisitions"
echo "  2. Press: Ctrl + Shift + R (Windows/Linux)"
echo "     Or: Cmd + Shift + R (Mac)"
echo ""
echo "METHOD 2: DevTools Clear Cache"
echo "  1. Press F12 to open DevTools"
echo "  2. Right-click the refresh button (next to address bar)"
echo "  3. Select 'Empty Cache and Hard Reload'"
echo ""
echo "METHOD 3: Incognito Mode (Guaranteed to work)"
echo "  1. Open new Incognito/Private window"
echo "  2. Login to: https://pryro.eastgatehotel.rw"
echo "  3. Navigate to: /stock-requisitions"
echo "  4. You should see the 'New Requisition' button"
echo ""
echo "METHOD 4: Clear All Browser Data"
echo "  1. Press Ctrl+Shift+Delete (Windows/Linux)"
echo "     Or: Cmd+Shift+Delete (Mac)"
echo "  2. Select 'Cached images and files'"
echo "  3. Click 'Clear data'"
echo "  4. Reload the page"
echo ""
echo "If you see buttons in Incognito but not in normal browser,"
echo "that CONFIRMS it's a browser cache issue."
echo ""

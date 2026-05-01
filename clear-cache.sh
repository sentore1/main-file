#!/bin/bash
# Clear Laravel caches to apply route changes

echo "Clearing route cache..."
php artisan route:clear

echo "Clearing config cache..."
php artisan config:clear

echo "Clearing application cache..."
php artisan cache:clear

echo "Clearing view cache..."
php artisan view:clear

echo "Regenerating Ziggy routes..."
php artisan ziggy:generate

echo "Optimizing routes..."
php artisan route:cache

echo "Done! All caches cleared and routes optimized."
echo ""
echo "Next steps:"
echo "1. Rebuild your frontend assets: npm run build"
echo "2. Clear browser cache or do a hard refresh (Ctrl+Shift+R)"

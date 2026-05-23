#!/bin/bash

echo "=== Clearing All Caches ==="

# Clear Laravel caches
echo "1. Clearing Laravel application cache..."
php artisan cache:clear

echo "2. Clearing Laravel config cache..."
php artisan config:clear

echo "3. Clearing Laravel route cache..."
php artisan route:clear

echo "4. Clearing Laravel view cache..."
php artisan view:clear

# Clear OPcache (PHP bytecode cache)
echo "5. Clearing OPcache..."
php artisan optimize:clear

# Restart PHP-FPM to clear opcache completely
echo "6. Restarting PHP-FPM..."
if systemctl list-units --type=service | grep -q "php8.2-fpm"; then
    sudo systemctl restart php8.2-fpm
    echo "   ✓ PHP 8.2 FPM restarted"
elif systemctl list-units --type=service | grep -q "php8.1-fpm"; then
    sudo systemctl restart php8.1-fpm
    echo "   ✓ PHP 8.1 FPM restarted"
elif systemctl list-units --type=service | grep -q "php8.0-fpm"; then
    sudo systemctl restart php8.0-fpm
    echo "   ✓ PHP 8.0 FPM restarted"
elif systemctl list-units --type=service | grep -q "php7.4-fpm"; then
    sudo systemctl restart php7.4-fpm
    echo "   ✓ PHP 7.4 FPM restarted"
else
    echo "   ⚠ Could not find PHP-FPM service, trying generic restart..."
    sudo systemctl restart php-fpm 2>/dev/null || echo "   ⚠ Manual PHP-FPM restart may be needed"
fi

echo ""
echo "=== All Caches Cleared ==="
echo ""
echo "Now rebuild frontend:"
echo "  npm run build"

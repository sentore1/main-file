#!/bin/bash

echo "=== Running Migration ==="
php artisan migrate --force

echo ""
echo "=== Building Frontend ==="
npm run build

echo ""
echo "=== Clearing Caches ==="
php artisan cache:clear
php artisan config:clear
php artisan route:clear
php artisan view:clear

echo ""
echo "=== Done! ==="

@echo off
echo ========================================
echo POS Order Recording - Complete Fix
echo ========================================
echo.

echo Step 1: Fixing POS status column...
php fix-pos-status.php
echo.

echo Step 2: Running migrations...
php artisan migrate --force
echo.

echo Step 3: Clearing caches...
php artisan cache:clear
php artisan config:clear
php artisan view:clear
php artisan route:clear
echo.

echo Step 4: Checking POS status...
php check-pos-status.php
echo.

echo ========================================
echo Fix Complete!
echo ========================================
echo.
echo Next Steps:
echo 1. Create a test POS order
echo 2. Check if it appears in POS Orders list
echo 3. Check if it appears on Dashboard
echo 4. If issues persist, check storage/logs/laravel.log
echo.
pause

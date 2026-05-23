#!/bin/bash

echo "=========================================="
echo "Adding Payment Method to POS Orders"
echo "=========================================="

# Run the migration
echo ""
echo "Step 1: Running migration..."
php artisan migrate --path=packages/workdo/Pos/src/Database/Migrations/2026_05_23_000002_add_payment_method_to_pos_payments.php

# Clear all caches
echo ""
echo "Step 2: Clearing caches..."
php artisan cache:clear
php artisan config:clear
php artisan route:clear
php artisan view:clear

# Rebuild frontend
echo ""
echo "Step 3: Rebuilding frontend assets..."
npm run build

echo ""
echo "=========================================="
echo "✓ Payment Method Added Successfully!"
echo "=========================================="
echo ""
echo "The 'Payment Mode' column is now available in POS Orders."
echo "It will show: Cash, Card, Bank Transfer, Mobile Money, etc."
echo ""

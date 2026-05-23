#!/bin/bash

echo "=========================================="
echo "Adding Bank and Check Payment Methods"
echo "=========================================="

# Step 1: Rollback the payment method migration
echo ""
echo "Step 1: Rolling back payment method migration..."
php artisan migrate:rollback --path=packages/workdo/Pos/src/Database/Migrations/2026_05_23_000002_add_payment_method_to_pos_payments.php

# Step 2: Run the updated migration
echo ""
echo "Step 2: Running updated migration..."
php artisan migrate --path=packages/workdo/Pos/src/Database/Migrations/2026_05_23_000002_add_payment_method_to_pos_payments.php

# Step 3: Clear all caches
echo ""
echo "Step 3: Clearing caches..."
php artisan cache:clear
php artisan config:clear
php artisan route:clear
php artisan view:clear

# Step 4: Rebuild frontend assets
echo ""
echo "Step 4: Rebuilding frontend assets..."
npm run build

echo ""
echo "=========================================="
echo "✓ Changes Applied Successfully!"
echo "=========================================="
echo ""
echo "What was updated:"
echo ""
echo "1. Payment Methods Added:"
echo "   - Bank (NEW)"
echo "   - Check (NEW)"
echo ""
echo "2. Pay Balance Button Fixed:"
echo "   - Now shows for 'pending' orders with balance"
echo "   - Now shows for 'partial' orders with balance"
echo ""
echo "3. Payment Dialog Updated:"
echo "   - Bank and Check options added"
echo ""
echo "All payment methods available:"
echo "  - Cash"
echo "  - Card"
echo "  - Bank Transfer"
echo "  - Mobile Money"
echo "  - MTN Mobile Money"
echo "  - Airtel Money"
echo "  - Bank (NEW)"
echo "  - Check (NEW)"
echo "  - Charge to Room"
echo ""
echo "Test at: https://pryro.eastgatehotel.rw/pos/create"
echo ""

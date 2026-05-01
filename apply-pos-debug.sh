#!/bin/bash

# POS Debug Patch Script
# This script adds debugging to POS system
# Run with: bash apply-pos-debug.sh

echo "=== Applying POS Debug Patches ==="

cd /home/pryro.eastgatehotel.rw/public_html

# Backup files first
echo "Creating backups..."
cp packages/workdo/Pos/src/Http/Controllers/PosController.php packages/workdo/Pos/src/Http/Controllers/PosController.php.backup
cp packages/workdo/Pos/src/Resources/js/Pages/Pos/Create.tsx packages/workdo/Pos/src/Resources/js/Pages/Pos/Create.tsx.backup
cp packages/workdo/Pos/src/Routes/web.php packages/workdo/Pos/src/Routes/web.php.backup

echo "Backups created!"

# Add logging to PosController
echo "Patching PosController..."
sed -i '/\$validated = \$request->validated();/a\
\
            \/\/ DEBUG: Log incoming data\
            \\Log::info('\''=== POS STORE REQUEST ==='\'')\;\
            \\Log::info('\''Validated Data:'\''\\, $validated)\;\
            \\Log::info('\''Items:'\''\\, $validated['\''items'\''] ?? [])\;\
            \\Log::info('\''Items with notes:'\''\\, array_filter($validated['\''items'\''] ?? []\\, function($item) {\
                return !empty($item['\''notes'\''])\;\
            }))\;\
            \\Log::info('\''========================'\'');' packages/workdo/Pos/src/Http/Controllers/PosController.php

# Add console logging to Create.tsx
echo "Patching Create.tsx..."
sed -i '/check_in_date: new Date/a\
        };\
\
        \/\/ DEBUG: Log the data being sent\
        console.log('\''=== POS ORDER DATA ==='\'')\;\
        console.log('\''Form Data:'\''\\, formData)\;\
        console.log('\''Items with notes:'\''\\, formData.items.filter(item => item.notes))\;\
        console.log('\''Payment info:'\''\\, {\
            paid_amount: formData.paid_amount\\,\
            total: getTotal()\\,\
            balance_due: getTotal() - formData.paid_amount\
        })\;\
        console.log('\''====================='\'');' packages/workdo/Pos/src/Resources/js/Pages/Pos/Create.tsx

# Add debug route
echo "Adding debug route..."
sed -i '/Route::get.*pos-orders.print/a\
    \
    \/\/ Debug route - remove after testing\
    Route::get('\''/pos/debug/{sale}'\'', function($sale) {\
        $posOrder = \\Workdo\\Pos\\Models\\Pos::with(['\''items'\'', '\''payment'\''])->findOrFail($sale);\
        return response()->json([\
            '\''sale'\'' => $posOrder,\
            '\''items_with_notes'\'' => $posOrder->items->map(function($item) {\
                return [\
                    '\''id'\'' => $item->id,\
                    '\''product_id'\'' => $item->product_id,\
                    '\''quantity'\'' => $item->quantity,\
                    '\''price'\'' => $item->price,\
                    '\''notes'\'' => $item->notes,\
                    '\''subtotal'\'' => $item->subtotal,\
                    '\''tax_amount'\'' => $item->tax_amount,\
                    '\''total_amount'\'' => $item->total_amount,\
                ];\
            }),\
            '\''payment'\'' => $posOrder->payment,\
        ]);\
    })->name('\''pos.debug'\'');' packages/workdo/Pos/src/Routes/web.php

echo ""
echo "=== Patches Applied! ==="
echo ""
echo "Now run:"
echo "  php artisan optimize:clear"
echo "  npm run build"
echo ""
echo "To restore backups if needed:"
echo "  mv packages/workdo/Pos/src/Http/Controllers/PosController.php.backup packages/workdo/Pos/src/Http/Controllers/PosController.php"
echo "  mv packages/workdo/Pos/src/Resources/js/Pages/Pos/Create.tsx.backup packages/workdo/Pos/src/Resources/js/Pages/Pos/Create.tsx"
echo "  mv packages/workdo/Pos/src/Routes/web.php.backup packages/workdo/Pos/src/Routes/web.php"

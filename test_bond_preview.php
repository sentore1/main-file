#!/usr/bin/env php
<?php

/**
 * Test script for Bond Preview functionality
 * 
 * This script tests:
 * 1. Route registration
 * 2. Controller method existence
 * 3. View file existence
 */

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "=== Testing Bond Preview Functionality ===\n\n";

// Test 1: Check if route exists
echo "1. Checking if 'pos.preview-bond' route exists...\n";
try {
    $route = route('pos.preview-bond');
    echo "   ✓ Route exists: $route\n";
} catch (Exception $e) {
    echo "   ✗ Route not found: " . $e->getMessage() . "\n";
    exit(1);
}

// Test 2: Check if controller method exists
echo "\n2. Checking if PosController::previewBond method exists...\n";
$controllerPath = 'packages/workdo/Pos/src/Http/Controllers/PosController.php';
if (file_exists($controllerPath)) {
    $content = file_get_contents($controllerPath);
    if (strpos($content, 'function previewBond') !== false) {
        echo "   ✓ Method previewBond exists in PosController\n";
    } else {
        echo "   ✗ Method previewBond not found in PosController\n";
        exit(1);
    }
} else {
    echo "   ✗ PosController file not found\n";
    exit(1);
}

// Test 3: Check if view file exists
echo "\n3. Checking if bond-preview.blade.php view exists...\n";
$viewPath = 'packages/workdo/Pos/src/Resources/views/pos/bond-preview.blade.php';
if (file_exists($viewPath)) {
    echo "   ✓ View file exists: $viewPath\n";
} else {
    echo "   ✗ View file not found: $viewPath\n";
    exit(1);
}

// Test 4: Check if Edit.tsx has Download button
echo "\n4. Checking if Edit.tsx has Download Bond button...\n";
$editPath = 'packages/workdo/Pos/src/Resources/js/Pages/Pos/Edit.tsx';
if (file_exists($editPath)) {
    $content = file_get_contents($editPath);
    if (strpos($content, 'handleDownloadBond') !== false && strpos($content, 'Download Bond') !== false) {
        echo "   ✓ Download Bond button exists in Edit.tsx\n";
    } else {
        echo "   ✗ Download Bond button not found in Edit.tsx\n";
        exit(1);
    }
} else {
    echo "   ✗ Edit.tsx file not found\n";
    exit(1);
}

// Test 5: Check if Create.tsx has Download button
echo "\n5. Checking if Create.tsx has Download Bond button...\n";
$createPath = 'packages/workdo/Pos/src/Resources/js/Pages/Pos/Create.tsx';
if (file_exists($createPath)) {
    $content = file_get_contents($createPath);
    if (strpos($content, 'handleDownloadBond') !== false && strpos($content, 'Download Bond') !== false) {
        echo "   ✓ Download Bond button exists in Create.tsx\n";
    } else {
        echo "   ✗ Download Bond button not found in Create.tsx\n";
        exit(1);
    }
} else {
    echo "   ✗ Create.tsx file not found\n";
    exit(1);
}

echo "\n=== All Tests Passed! ===\n";
echo "\nNext steps:\n";
echo "1. Run: npm run build (to compile the React changes)\n";
echo "2. Clear cache: php artisan cache:clear\n";
echo "3. Test in browser by:\n";
echo "   - Go to POS Create page\n";
echo "   - Add items to cart\n";
echo "   - Click 'Download Bond' button (before checkout)\n";
echo "   - A PDF should download with preview notice\n";
echo "   - Then you can proceed with checkout\n";

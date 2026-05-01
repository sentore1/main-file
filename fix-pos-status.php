<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

echo "Checking and fixing POS status column...\n\n";

try {
    // Check current status column
    $columns = DB::select("SHOW COLUMNS FROM pos WHERE Field = 'status'");
    
    if (!empty($columns)) {
        echo "Current status column type: " . $columns[0]->Type . "\n\n";
        
        // Check if 'partial' is in the enum
        if (strpos($columns[0]->Type, 'partial') === false) {
            echo "⚠ 'partial' status is missing from enum. Fixing...\n";
            
            // Add partial to enum
            DB::statement("ALTER TABLE pos MODIFY COLUMN status ENUM('completed', 'pending', 'cancelled', 'partial') DEFAULT 'completed'");
            
            echo "✓ 'partial' status added successfully!\n\n";
        } else {
            echo "✓ 'partial' status already exists in enum\n\n";
        }
        
        // Verify the fix
        $columns = DB::select("SHOW COLUMNS FROM pos WHERE Field = 'status'");
        echo "Updated status column type: " . $columns[0]->Type . "\n";
    }
    
    echo "\n✓ POS status column is now properly configured!\n";
    
} catch (\Exception $e) {
    echo "✗ Error: " . $e->getMessage() . "\n";
}

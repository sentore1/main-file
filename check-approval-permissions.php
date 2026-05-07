<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "=== Stock Requisition Approval Permissions ===\n\n";

// Get the approve permission
$approvePermission = \Spatie\Permission\Models\Permission::where('name', 'approve-stock-requisitions')->first();

if ($approvePermission) {
    echo "✓ 'approve-stock-requisitions' permission exists\n\n";
    
    // Get all roles that have this permission
    $rolesWithPermission = \Spatie\Permission\Models\Role::whereHas('permissions', function($q) {
        $q->where('name', 'approve-stock-requisitions');
    })->get();
    
    echo "Roles with approval permission:\n";
    echo "--------------------------------\n";
    if ($rolesWithPermission->count() > 0) {
        foreach ($rolesWithPermission as $role) {
            echo "  ✓ " . $role->name . "\n";
        }
    } else {
        echo "  ✗ No roles have this permission yet\n";
    }
    
    echo "\n";
    
    // Get all roles
    echo "All available roles:\n";
    echo "--------------------\n";
    $allRoles = \Spatie\Permission\Models\Role::all();
    foreach ($allRoles as $role) {
        $hasPermission = $role->hasPermissionTo('approve-stock-requisitions');
        $icon = $hasPermission ? '✓' : '✗';
        echo "  $icon " . $role->name . "\n";
    }
    
    echo "\n";
    
    // Show users who can approve
    echo "Users who can approve requisitions:\n";
    echo "-----------------------------------\n";
    $users = \App\Models\User::permission('approve-stock-requisitions')->get();
    if ($users->count() > 0) {
        foreach ($users as $user) {
            echo "  ✓ " . $user->name . " (" . $user->email . ") - Role: " . $user->type . "\n";
        }
    } else {
        echo "  ✗ No users have approval permission\n";
    }
    
} else {
    echo "✗ 'approve-stock-requisitions' permission NOT found\n";
    echo "\nRun the seeder:\n";
    echo "php artisan db:seed --class=\"Workdo\\StockRequisition\\Database\\Seeders\\StockRequisitionPermissionSeeder\"\n";
}

echo "\n=== How to Grant Approval Permission ===\n\n";
echo "Option 1: Assign to a specific role (e.g., Manager)\n";
echo "------------------------------------------------------\n";
echo "php artisan tinker\n";
echo "\$role = \\Spatie\\Permission\\Models\\Role::where('name', 'manager')->first();\n";
echo "\$role->givePermissionTo('approve-stock-requisitions');\n";
echo "\n";

echo "Option 2: Assign to a specific user\n";
echo "------------------------------------\n";
echo "php artisan tinker\n";
echo "\$user = \\App\\Models\\User::where('email', 'manager@example.com')->first();\n";
echo "\$user->givePermissionTo('approve-stock-requisitions');\n";
echo "\n";

echo "Option 3: Create a Manager role with approval permissions\n";
echo "----------------------------------------------------------\n";
echo "php artisan tinker\n";
echo "\$role = \\Spatie\\Permission\\Models\\Role::create(['name' => 'manager']);\n";
echo "\$role->givePermissionTo('approve-stock-requisitions');\n";
echo "\$role->givePermissionTo('view-stock-requisitions');\n";
echo "\n";

echo "=== Check Complete ===\n";

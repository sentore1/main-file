<?php

use Illuminate\Database\Migrations\Migration;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Create the edit-pos permission
        $permission = Permission::firstOrCreate(
            ['name' => 'edit-pos', 'guard_name' => 'web'],
            [
                'module' => 'pos',
                'label' => 'Edit Pos',
                'add_on' => 'Pos',
                'created_at' => now(),
                'updated_at' => now()
            ]
        );

        // Grant permission to company role by default
        $companyRole = Role::where('name', 'company')->first();
        if ($companyRole && !$companyRole->hasPermissionTo($permission)) {
            $companyRole->givePermissionTo($permission);
        }

        // Also grant to any role that has manage-pos permission
        $rolesWithManagePos = Role::whereHas('permissions', function($query) {
            $query->where('name', 'manage-pos');
        })->get();

        foreach ($rolesWithManagePos as $role) {
            if (!$role->hasPermissionTo($permission)) {
                $role->givePermissionTo($permission);
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Remove the permission
        $permission = Permission::where('name', 'edit-pos')->where('guard_name', 'web')->first();
        if ($permission) {
            $permission->delete();
        }
    }
};

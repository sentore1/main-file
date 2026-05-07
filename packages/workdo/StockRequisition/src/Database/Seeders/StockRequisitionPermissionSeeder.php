<?php

namespace Workdo\StockRequisition\Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Artisan;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class StockRequisitionPermissionSeeder extends Seeder
{
    public function run()
    {
        Model::unguard();
        Artisan::call('cache:clear');

        $permissions = [
            ['name' => 'manage-stock-requisitions', 'module' => 'stock-requisition', 'label' => 'Manage Stock Requisitions'],
            ['name' => 'create-stock-requisitions', 'module' => 'stock-requisition', 'label' => 'Create Stock Requisition'],
            ['name' => 'view-stock-requisitions', 'module' => 'stock-requisition', 'label' => 'View Stock Requisition'],
            ['name' => 'edit-stock-requisitions', 'module' => 'stock-requisition', 'label' => 'Edit Stock Requisition'],
            ['name' => 'delete-stock-requisitions', 'module' => 'stock-requisition', 'label' => 'Delete Stock Requisition'],
            ['name' => 'approve-stock-requisitions', 'module' => 'stock-requisition', 'label' => 'Approve Stock Requisition'],
            ['name' => 'fulfill-stock-requisitions', 'module' => 'stock-requisition', 'label' => 'Fulfill Stock Requisition'],
            ['name' => 'cancel-stock-requisitions', 'module' => 'stock-requisition', 'label' => 'Cancel Stock Requisition'],
        ];

        $companyRole = Role::where('name', 'company')->first();

        foreach ($permissions as $perm) {
            $permissionObj = Permission::firstOrCreate(
                ['name' => $perm['name'], 'guard_name' => 'web'],
                [
                    'module' => $perm['module'],
                    'label' => $perm['label'],
                    'add_on' => 'StockRequisition',
                    'created_at' => now(),
                    'updated_at' => now()
                ]
            );

            if ($companyRole && !$companyRole->hasPermissionTo($permissionObj)) {
                $companyRole->givePermissionTo($permissionObj);
            }
        }

        // Assign permissions to other roles
        $managerRole = Role::where('name', 'manager')->first();
        if ($managerRole) {
            $managerPermissions = [
                'manage-stock-requisitions',
                'create-stock-requisitions',
                'view-stock-requisitions',
                'approve-stock-requisitions',
                'fulfill-stock-requisitions',
            ];
            foreach ($managerPermissions as $permName) {
                $perm = Permission::where('name', $permName)->first();
                if ($perm && !$managerRole->hasPermissionTo($perm)) {
                    $managerRole->givePermissionTo($perm);
                }
            }
        }

        $accountantRole = Role::where('name', 'accountant')->first();
        if ($accountantRole) {
            $accountantPermissions = [
                'manage-stock-requisitions',
                'view-stock-requisitions',
                'approve-stock-requisitions',
            ];
            foreach ($accountantPermissions as $permName) {
                $perm = Permission::where('name', $permName)->first();
                if ($perm && !$accountantRole->hasPermissionTo($perm)) {
                    $accountantRole->givePermissionTo($perm);
                }
            }
        }
    }
}

<?php

namespace Database\Seeders;

use App\Models\User;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Artisan;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        (new PermissionRoleSeeder())->run();
        (new DefultSetting())->run();
        // Commented out SaaS-specific seeders for non-SaaS version
        // (new PlanSeeder())->run();
        (new EmailTemplatesSeeder())->run();
        (new NotificationsTableSeeder())->run();

        // Updated for non-SaaS company user
        $userId = User::where('email', 'company@example.com')->first()->id;
        User::CompanySetting($userId);

        if(config('app.run_demo_seeder'))
        {
            // Commented out SaaS demo seeders
            // (new CouponSeeder())->run();
            // (new DemoOrderSeeder())->run($userId);
            // (new DemoCouponSeeder())->run($userId);
            // (new DemoBankTransferSeeder())->run($userId);
            // (new DemoCouponDetailsSeeder())->run($userId);
            // (new DemoUserSeeder())->run();
            // (new HelpdeskCategorySeeder())->run();
            // (new HelpdeskTicketSeeder())->run($userId);
            // (new HelpdeskReplySeeder())->run($userId);
            
            // Keep non-SaaS demo seeders
            (new DemoStaffSeeder())->run($userId);
            (new DemoLoginHistorySeeder())->run($userId);
            (new DemoWarehouseSeeder())->run($userId);
            (new MessengerSeeder())->run();
            (new DemoTransferSeeder())->run($userId);
        }
    }
}

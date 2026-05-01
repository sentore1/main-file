<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Modify the status enum to include 'charged_to_room' and 'partial'
        DB::statement("ALTER TABLE pos MODIFY COLUMN status ENUM('completed', 'pending', 'cancelled', 'partial', 'charged_to_room') DEFAULT 'completed'");
        
        // Update existing records where charged_to_room is true
        DB::table('pos')
            ->where('charged_to_room', true)
            ->update(['status' => 'charged_to_room']);
    }

    public function down(): void
    {
        // Revert charged_to_room status back to pending
        DB::table('pos')
            ->where('status', 'charged_to_room')
            ->update(['status' => 'pending']);
            
        // Revert the enum back to original
        DB::statement("ALTER TABLE pos MODIFY COLUMN status ENUM('completed', 'pending', 'cancelled') DEFAULT 'completed'");
    }
};

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
        DB::statement("ALTER TABLE pos MODIFY COLUMN status ENUM('completed', 'pending', 'partial', 'charged_to_room', 'cancelled') DEFAULT 'completed'");
    }

    public function down(): void
    {
        // Revert back to original enum values
        DB::statement("ALTER TABLE pos MODIFY COLUMN status ENUM('completed', 'pending', 'cancelled') DEFAULT 'completed'");
    }
};

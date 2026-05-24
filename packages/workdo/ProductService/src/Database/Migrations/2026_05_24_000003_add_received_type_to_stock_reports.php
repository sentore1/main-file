<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Update the enum to include 'received' type
        DB::statement("ALTER TABLE stock_reports MODIFY COLUMN report_type ENUM('opening', 'closing', 'received') NOT NULL");
    }

    public function down(): void
    {
        // Revert back to original enum values
        DB::statement("ALTER TABLE stock_reports MODIFY COLUMN report_type ENUM('opening', 'closing') NOT NULL");
    }
};

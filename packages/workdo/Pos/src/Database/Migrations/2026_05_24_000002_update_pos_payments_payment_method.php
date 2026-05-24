<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('pos_payments')) {
            // Check current enum values and update if needed
            DB::statement("ALTER TABLE pos_payments MODIFY COLUMN payment_method ENUM('cash', 'card', 'bank_transfer', 'mobile_money', 'mtn_momo', 'airtel_money', 'bank', 'check', 'charge_to_room') DEFAULT 'cash'");
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('pos_payments')) {
            // Revert back to original enum values
            DB::statement("ALTER TABLE pos_payments MODIFY COLUMN payment_method ENUM('cash', 'card', 'bank_transfer', 'mobile_money', 'mtn_momo', 'airtel_money', 'charge_to_room') DEFAULT 'cash'");
        }
    }
};

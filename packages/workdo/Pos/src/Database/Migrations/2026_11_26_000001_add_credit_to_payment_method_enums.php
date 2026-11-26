<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('pos_payments')) {
            DB::statement("ALTER TABLE pos_payments MODIFY COLUMN payment_method ENUM('cash','card','bank_transfer','mobile_money','mtn_momo','airtel_money','bank','check','charge_to_room','credit') DEFAULT 'cash'");
        }

        if (Schema::hasTable('room_booking_payments')) {
            DB::statement("ALTER TABLE room_booking_payments MODIFY COLUMN payment_method ENUM('cash','card','bank_transfer','mobile_money','mtn_momo','airtel_money','bank','check','charge_to_room','credit') DEFAULT 'cash'");
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('pos_payments')) {
            DB::statement("ALTER TABLE pos_payments MODIFY COLUMN payment_method ENUM('cash','card','bank_transfer','mobile_money','mtn_momo','airtel_money','bank','check','charge_to_room') DEFAULT 'cash'");
        }

        if (Schema::hasTable('room_booking_payments')) {
            DB::statement("ALTER TABLE room_booking_payments MODIFY COLUMN payment_method ENUM('cash','card','bank_transfer','mobile_money','mtn_momo','airtel_money','bank','check','charge_to_room') DEFAULT 'cash'");
        }
    }
};

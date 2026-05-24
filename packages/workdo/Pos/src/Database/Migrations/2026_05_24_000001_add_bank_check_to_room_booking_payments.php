<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('room_booking_payments')) {
            // Change the enum to include 'bank' and 'check' payment methods
            DB::statement("ALTER TABLE room_booking_payments MODIFY COLUMN payment_method ENUM('cash', 'card', 'bank_transfer', 'mobile_money', 'mtn_momo', 'airtel_money', 'bank', 'check', 'charge_to_room') DEFAULT 'cash'");
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('room_booking_payments')) {
            // Revert back to original enum values
            DB::statement("ALTER TABLE room_booking_payments MODIFY COLUMN payment_method ENUM('cash', 'card', 'bank_transfer', 'mobile_money') DEFAULT 'cash'");
        }
    }
};

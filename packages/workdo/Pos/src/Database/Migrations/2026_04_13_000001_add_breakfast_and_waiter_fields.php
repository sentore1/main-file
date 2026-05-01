<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Add breakfast field to room_bookings
        if (Schema::hasTable('room_bookings') && !Schema::hasColumn('room_bookings', 'includes_breakfast')) {
            Schema::table('room_bookings', function (Blueprint $table) {
                $table->boolean('includes_breakfast')->default(false)->after('number_of_guests');
            });
        }

        // Add waiter_name field to pos table
        if (Schema::hasTable('pos') && !Schema::hasColumn('pos', 'waiter_name')) {
            Schema::table('pos', function (Blueprint $table) {
                $table->string('waiter_name')->nullable()->after('bank_account_id');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('room_bookings') && Schema::hasColumn('room_bookings', 'includes_breakfast')) {
            Schema::table('room_bookings', function (Blueprint $table) {
                $table->dropColumn('includes_breakfast');
            });
        }

        if (Schema::hasTable('pos') && Schema::hasColumn('pos', 'waiter_name')) {
            Schema::table('pos', function (Blueprint $table) {
                $table->dropColumn('waiter_name');
            });
        }
    }
};

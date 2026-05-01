<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('pos', function (Blueprint $table) {
            $table->unsignedBigInteger('room_booking_id')->nullable()->after('customer_id');
            $table->boolean('charged_to_room')->default(false)->after('room_booking_id');
            
            // Add foreign key if room_bookings table exists
            if (Schema::hasTable('room_bookings')) {
                $table->foreign('room_booking_id')
                    ->references('id')
                    ->on('room_bookings')
                    ->onDelete('set null');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('pos', function (Blueprint $table) {
            if (Schema::hasColumn('pos', 'room_booking_id')) {
                $table->dropForeign(['room_booking_id']);
            }
            $table->dropColumn(['room_booking_id', 'charged_to_room']);
        });
    }
};

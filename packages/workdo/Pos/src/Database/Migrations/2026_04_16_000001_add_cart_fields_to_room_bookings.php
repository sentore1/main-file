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
        Schema::table('room_bookings', function (Blueprint $table) {
            $table->string('booking_group_id', 50)->nullable()->after('booking_number');
            $table->text('item_notes')->nullable()->after('notes');
            $table->decimal('custom_price', 10, 2)->nullable()->after('subtotal');
            $table->decimal('breakfast_price', 10, 2)->nullable()->after('includes_breakfast');
            
            // Add index for booking group queries
            $table->index('booking_group_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('room_bookings', function (Blueprint $table) {
            $table->dropIndex(['booking_group_id']);
            $table->dropColumn(['booking_group_id', 'item_notes', 'custom_price', 'breakfast_price']);
        });
    }
};

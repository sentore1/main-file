<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('pos_items', function (Blueprint $table) {
            $table->enum('item_type', ['product', 'room'])->default('product')->after('product_id');
        });

        // Update existing room booking items
        // Find pos_items where the pos record has a room_booking_id
        DB::statement("
            UPDATE pos_items 
            SET item_type = 'room' 
            WHERE pos_id IN (
                SELECT id FROM pos WHERE room_booking_id IS NOT NULL
            )
        ");
    }

    public function down(): void
    {
        Schema::table('pos_items', function (Blueprint $table) {
            $table->dropColumn('item_type');
        });
    }
};

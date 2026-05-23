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
        Schema::table('sales_invoice_items', function (Blueprint $table) {
            $table->string('item_type', 20)->default('product')->after('product_id');
            $table->bigInteger('room_id')->unsigned()->nullable()->after('item_type');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('sales_invoice_items', function (Blueprint $table) {
            $table->dropColumn(['item_type', 'room_id']);
        });
    }
};

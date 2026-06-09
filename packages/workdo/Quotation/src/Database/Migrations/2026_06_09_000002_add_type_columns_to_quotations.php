<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sales_quotations', function (Blueprint $table) {
            if (!Schema::hasColumn('sales_quotations', 'type')) {
                $table->enum('type', ['product', 'service', 'room'])->default('product')->after('warehouse_id');
            }
        });

        Schema::table('sales_quotation_items', function (Blueprint $table) {
            if (!Schema::hasColumn('sales_quotation_items', 'item_type')) {
                $table->enum('item_type', ['product', 'service', 'room'])->default('product')->after('product_id');
            }
            if (!Schema::hasColumn('sales_quotation_items', 'room_id')) {
                $table->unsignedBigInteger('room_id')->nullable()->after('item_type');
            }
        });
    }

    public function down(): void
    {
        Schema::table('sales_quotations', function (Blueprint $table) {
            if (Schema::hasColumn('sales_quotations', 'type')) {
                $table->dropColumn('type');
            }
        });

        Schema::table('sales_quotation_items', function (Blueprint $table) {
            if (Schema::hasColumn('sales_quotation_items', 'item_type')) {
                $table->dropColumn('item_type');
            }
            if (Schema::hasColumn('sales_quotation_items', 'room_id')) {
                $table->dropColumn('room_id');
            }
        });
    }
};

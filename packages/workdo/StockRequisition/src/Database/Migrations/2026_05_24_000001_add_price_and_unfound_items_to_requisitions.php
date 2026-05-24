<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Add estimated_price to stock_requisition_items
        if (Schema::hasTable('stock_requisition_items') && !Schema::hasColumn('stock_requisition_items', 'estimated_price')) {
            Schema::table('stock_requisition_items', function (Blueprint $table) {
                $table->decimal('estimated_price', 15, 2)->nullable()->after('quantity_requested');
            });
        }

        // Add unfound_items to stock_requisitions
        if (Schema::hasTable('stock_requisitions') && !Schema::hasColumn('stock_requisitions', 'unfound_items')) {
            Schema::table('stock_requisitions', function (Blueprint $table) {
                $table->text('unfound_items')->nullable()->after('notes');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('stock_requisition_items', 'estimated_price')) {
            Schema::table('stock_requisition_items', function (Blueprint $table) {
                $table->dropColumn('estimated_price');
            });
        }

        if (Schema::hasColumn('stock_requisitions', 'unfound_items')) {
            Schema::table('stock_requisitions', function (Blueprint $table) {
                $table->dropColumn('unfound_items');
            });
        }
    }
};

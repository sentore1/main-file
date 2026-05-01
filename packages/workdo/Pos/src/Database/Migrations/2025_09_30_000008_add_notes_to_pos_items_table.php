<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('pos_items') && !Schema::hasColumn('pos_items', 'notes')) {
            Schema::table('pos_items', function (Blueprint $table) {
                $table->text('notes')->nullable()->after('total_amount');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('pos_items') && Schema::hasColumn('pos_items', 'notes')) {
            Schema::table('pos_items', function (Blueprint $table) {
                $table->dropColumn('notes');
            });
        }
    }
};

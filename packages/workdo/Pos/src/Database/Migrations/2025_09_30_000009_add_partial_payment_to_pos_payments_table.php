<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('pos_payments')) {
            Schema::table('pos_payments', function (Blueprint $table) {
                if (!Schema::hasColumn('pos_payments', 'paid_amount')) {
                    $table->decimal('paid_amount', 10, 2)->default(0)->after('discount_amount');
                }
                if (!Schema::hasColumn('pos_payments', 'balance_due')) {
                    $table->decimal('balance_due', 10, 2)->default(0)->after('paid_amount');
                }
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('pos_payments')) {
            Schema::table('pos_payments', function (Blueprint $table) {
                if (Schema::hasColumn('pos_payments', 'paid_amount')) {
                    $table->dropColumn('paid_amount');
                }
                if (Schema::hasColumn('pos_payments', 'balance_due')) {
                    $table->dropColumn('balance_due');
                }
            });
        }
    }
};

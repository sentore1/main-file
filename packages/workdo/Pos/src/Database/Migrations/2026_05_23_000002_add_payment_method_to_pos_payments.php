<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('pos_payments') && !Schema::hasColumn('pos_payments', 'payment_method')) {
            Schema::table('pos_payments', function (Blueprint $table) {
                $table->enum('payment_method', ['cash', 'card', 'bank_transfer', 'mobile_money', 'mtn_momo', 'airtel_money', 'bank', 'check', 'charge_to_room'])
                    ->default('cash')
                    ->after('discount_amount');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('pos_payments') && Schema::hasColumn('pos_payments', 'payment_method')) {
            Schema::table('pos_payments', function (Blueprint $table) {
                $table->dropColumn('payment_method');
            });
        }
    }
};

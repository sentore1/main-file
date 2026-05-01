<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('room_booking_payments')) {
            Schema::create('room_booking_payments', function (Blueprint $table) {
                $table->id();
                $table->foreignId('booking_id')->index();
                $table->foreignId('bank_account_id')->nullable()->index();
                $table->enum('payment_method', ['cash', 'card', 'bank_transfer', 'mobile_money'])->default('cash');
                $table->decimal('amount_paid', 15, 2);
                $table->date('payment_date');
                $table->text('payment_notes')->nullable();
                $table->foreignId('creator_id')->nullable()->index();
                $table->foreignId('created_by')->nullable()->index();
                $table->timestamps();

                $table->foreign('booking_id')->references('id')->on('room_bookings')->onDelete('cascade');
                $table->foreign('bank_account_id')->references('id')->on('bank_accounts')->onDelete('set null');
                $table->foreign('creator_id')->references('id')->on('users')->onDelete('set null');
                $table->foreign('created_by')->references('id')->on('users')->onDelete('cascade');
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('room_booking_payments');
    }
};

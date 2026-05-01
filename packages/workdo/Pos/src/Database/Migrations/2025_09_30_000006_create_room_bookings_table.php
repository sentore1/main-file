<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('room_bookings')) {
            Schema::create('room_bookings', function (Blueprint $table) {
                $table->id();
                $table->string('booking_number')->unique();
                $table->foreignId('room_id')->index();
                $table->foreignId('customer_id')->nullable()->index();
                $table->foreignId('warehouse_id')->index();
                $table->date('check_in_date');
                $table->date('check_out_date');
                $table->integer('total_nights');
                $table->integer('number_of_guests')->default(1);
                $table->decimal('subtotal', 15, 2);
                $table->decimal('tax_amount', 15, 2)->default(0);
                $table->decimal('discount', 15, 2)->default(0);
                $table->decimal('total_amount', 15, 2);
                $table->text('notes')->nullable();
                $table->enum('status', ['pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled'])->default('confirmed');
                $table->foreignId('revenue_id')->nullable()->index();
                $table->foreignId('creator_id')->nullable()->index();
                $table->foreignId('created_by')->nullable()->index();
                $table->timestamps();

                $table->foreign('room_id')->references('id')->on('rooms')->onDelete('cascade');
                $table->foreign('customer_id')->references('id')->on('users')->onDelete('set null');
                $table->foreign('warehouse_id')->references('id')->on('warehouses')->onDelete('cascade');
                $table->foreign('creator_id')->references('id')->on('users')->onDelete('set null');
                $table->foreign('created_by')->references('id')->on('users')->onDelete('cascade');
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('room_bookings');
    }
};

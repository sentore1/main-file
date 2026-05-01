<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('rooms')) {
            Schema::create('rooms', function (Blueprint $table) {
                $table->id();
                $table->string('room_number');
                $table->foreignId('room_type_id')->index();
                $table->foreignId('warehouse_id')->index();
                $table->string('floor')->nullable();
                $table->decimal('price_per_night', 15, 2);
                $table->integer('max_occupancy')->default(2);
                $table->json('amenities')->nullable();
                $table->text('description')->nullable();
                $table->string('image')->nullable();
                $table->enum('status', ['available', 'occupied', 'maintenance', 'reserved'])->default('available');
                $table->foreignId('creator_id')->nullable()->index();
                $table->foreignId('created_by')->nullable()->index();
                $table->timestamps();

                $table->foreign('room_type_id')->references('id')->on('room_types')->onDelete('cascade');
                $table->foreign('warehouse_id')->references('id')->on('warehouses')->onDelete('cascade');
                $table->foreign('creator_id')->references('id')->on('users')->onDelete('set null');
                $table->foreign('created_by')->references('id')->on('users')->onDelete('cascade');
                
                $table->unique(['room_number', 'warehouse_id']);
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('rooms');
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if(!Schema::hasTable('stock_requisition_items'))
        {
            Schema::create('stock_requisition_items', function (Blueprint $table) {
                $table->id();
                $table->foreignId('requisition_id')->index();
                $table->foreignId('product_id')->index();
                $table->decimal('quantity_requested', 15, 2);
                $table->decimal('quantity_approved', 15, 2)->nullable();
                $table->decimal('quantity_fulfilled', 15, 2)->default(0);
                $table->text('notes')->nullable();
                $table->foreignId('creator_id')->nullable()->index();
                $table->foreignId('created_by')->index();
                $table->timestamps();

                $table->foreign('requisition_id')->references('id')->on('stock_requisitions')->onDelete('cascade');
                $table->foreign('creator_id')->references('id')->on('users')->onDelete('set null');
                $table->foreign('created_by')->references('id')->on('users')->onDelete('cascade');
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('stock_requisition_items');
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('stock_reports')) {
            Schema::create('stock_reports', function (Blueprint $table) {
                $table->id();
                $table->date('report_date');
                $table->enum('report_type', ['opening', 'closing']);
                $table->unsignedBigInteger('product_id');
                $table->unsignedBigInteger('warehouse_id')->nullable();
                $table->decimal('quantity', 15, 2);
                $table->text('notes')->nullable();
                $table->unsignedBigInteger('recorded_by');
                $table->unsignedBigInteger('created_by');
                $table->timestamps();

                $table->foreign('product_id')->references('id')->on('product_service_items')->onDelete('cascade');
                $table->foreign('warehouse_id')->references('id')->on('warehouses')->onDelete('cascade');
                $table->foreign('recorded_by')->references('id')->on('users')->onDelete('cascade');
                $table->foreign('created_by')->references('id')->on('users')->onDelete('cascade');
                
                $table->index(['report_date', 'report_type']);
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('stock_reports');
    }
};

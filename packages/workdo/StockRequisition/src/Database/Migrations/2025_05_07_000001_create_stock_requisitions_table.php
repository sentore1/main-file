<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if(!Schema::hasTable('stock_requisitions'))
        {
            Schema::create('stock_requisitions', function (Blueprint $table) {
                $table->id();
                $table->string('requisition_number')->unique();
                $table->date('requisition_date');
                $table->date('required_date');
                $table->foreignId('requested_by')->index();
                $table->foreignId('warehouse_id')->index();
                $table->string('department')->nullable();
                $table->enum('priority', ['low', 'normal', 'urgent'])->default('normal');
                $table->enum('status', ['draft', 'pending', 'approved', 'rejected', 'fulfilled', 'cancelled'])->default('pending');
                $table->foreignId('approved_by')->nullable()->index();
                $table->timestamp('approved_at')->nullable();
                $table->foreignId('fulfilled_by')->nullable()->index();
                $table->timestamp('fulfilled_at')->nullable();
                $table->text('purpose')->nullable();
                $table->text('notes')->nullable();
                $table->text('rejection_reason')->nullable();
                $table->foreignId('creator_id')->nullable()->index();
                $table->foreignId('created_by')->index();
                $table->timestamps();

                $table->foreign('requested_by')->references('id')->on('users')->onDelete('cascade');
                $table->foreign('warehouse_id')->references('id')->on('warehouses')->onDelete('cascade');
                $table->foreign('approved_by')->references('id')->on('users')->onDelete('set null');
                $table->foreign('fulfilled_by')->references('id')->on('users')->onDelete('set null');
                $table->foreign('creator_id')->references('id')->on('users')->onDelete('set null');
                $table->foreign('created_by')->references('id')->on('users')->onDelete('cascade');
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('stock_requisitions');
    }
};

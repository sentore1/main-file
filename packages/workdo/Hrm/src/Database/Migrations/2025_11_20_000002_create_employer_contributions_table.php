<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('employer_contributions')) {
            Schema::create('employer_contributions', function (Blueprint $table) {
                $table->id();
                $table->foreignId('employer_contribution_type_id')->constrained('employer_contribution_types')->onDelete('cascade');
                $table->foreignId('employee_id');
                $table->enum('type', ['fixed', 'percentage'])->default('fixed');
                $table->decimal('amount', 10, 2);
                $table->foreignId('created_by')->nullable()->index();
                $table->timestamps();

                $table->foreign('employee_id')->references('id')->on('users')->onDelete('cascade');
                $table->foreign('created_by')->references('id')->on('users')->onDelete('cascade');
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('employer_contributions');
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('payroll_entries')) {
            Schema::table('payroll_entries', function (Blueprint $table) {
                if (!Schema::hasColumn('payroll_entries', 'total_employer_contributions')) {
                    $table->decimal('total_employer_contributions', 10, 2)->default(0)->after('total_loans');
                    $table->json('employer_contributions_breakdown')->nullable()->after('loans_breakdown');
                }
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('payroll_entries')) {
            Schema::table('payroll_entries', function (Blueprint $table) {
                if (Schema::hasColumn('payroll_entries', 'total_employer_contributions')) {
                    $table->dropColumn(['total_employer_contributions', 'employer_contributions_breakdown']);
                }
            });
        }
    }
};

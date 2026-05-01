<?php

namespace Workdo\Hrm\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class EmployerContribution extends Model
{
    use HasFactory;

    protected $fillable = [
        'employer_contribution_type_id',
        'employee_id',
        'type',
        'amount',
        'created_by'
    ];

    public function employerContributionType()
    {
        return $this->belongsTo(EmployerContributionType::class);
    }

    public function employee()
    {
        return $this->belongsTo(Employee::class, 'employee_id', 'user_id');
    }
}

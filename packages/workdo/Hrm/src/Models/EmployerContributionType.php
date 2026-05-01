<?php

namespace Workdo\Hrm\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class EmployerContributionType extends Model
{
    use HasFactory;

    protected $fillable = ['name', 'created_by'];

    public function employerContributions()
    {
        return $this->hasMany(EmployerContribution::class);
    }
}

<?php

namespace Workdo\Hrm\Http\Controllers;

use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Auth;
use Workdo\Hrm\Models\EmployerContribution;
use Illuminate\Http\Request;

class EmployerContributionController extends Controller
{
    public function store(Request $request)
    {
        $request->validate([
            'employer_contribution_type_id' => 'required|exists:employer_contribution_types,id',
            'employee_id' => 'required|exists:users,id',
            'type' => 'required|in:fixed,percentage',
            'amount' => 'required|numeric|min:0',
        ]);

        EmployerContribution::create([
            'employer_contribution_type_id' => $request->employer_contribution_type_id,
            'employee_id' => $request->employee_id,
            'type' => $request->type,
            'amount' => $request->amount,
            'created_by' => creatorId(),
        ]);

        return back()->with('success', __('Employer contribution created successfully.'));
    }

    public function update(Request $request, EmployerContribution $employerContribution)
    {
        $request->validate([
            'employer_contribution_type_id' => 'required|exists:employer_contribution_types,id',
            'type' => 'required|in:fixed,percentage',
            'amount' => 'required|numeric|min:0',
        ]);

        $employerContribution->update([
            'employer_contribution_type_id' => $request->employer_contribution_type_id,
            'type' => $request->type,
            'amount' => $request->amount,
        ]);

        return back()->with('success', __('Employer contribution updated successfully.'));
    }

    public function destroy(EmployerContribution $employerContribution)
    {
        $employerContribution->delete();

        return back()->with('success', __('Employer contribution deleted successfully.'));
    }
}

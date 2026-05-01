<?php

namespace Workdo\Hrm\Http\Controllers;

use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Auth;
use Workdo\Hrm\Models\EmployerContributionType;
use Illuminate\Http\Request;
use Inertia\Inertia;

class EmployerContributionTypeController extends Controller
{
    public function index()
    {
        $employercontributiontypes = EmployerContributionType::where('created_by', creatorId())->get();

        return Inertia::render('Hrm/SystemSetup/EmployerContributionTypes/Index', [
            'employercontributiontypes' => $employercontributiontypes,
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
        ]);

        EmployerContributionType::create([
            'name' => $request->name,
            'created_by' => creatorId(),
        ]);

        return back()->with('success', __('Employer contribution type created successfully.'));
    }

    public function update(Request $request, EmployerContributionType $employerContributionType)
    {
        $request->validate([
            'name' => 'required|string|max:255',
        ]);

        $employerContributionType->update([
            'name' => $request->name,
        ]);

        return back()->with('success', __('Employer contribution type updated successfully.'));
    }

    public function destroy(EmployerContributionType $employerContributionType)
    {
        $employerContributionType->delete();

        return back()->with('success', __('Employer contribution type deleted successfully.'));
    }
}

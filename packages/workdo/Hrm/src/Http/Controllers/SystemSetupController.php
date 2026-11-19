<?php

namespace Workdo\Hrm\Http\Controllers;

use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Auth;

class SystemSetupController extends Controller
{
    /**
     * Redirect to the first system-setup sub-section (Branches).
     */
    public function index()
    {
        if (Auth::user()->can('manage-branches')) {
            return redirect()->route('branches.index');
        }

        return redirect()->route('hrm.index');
    }
}

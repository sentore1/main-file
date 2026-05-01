<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\Plan;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class HomeController extends Controller
{
    public function Dashboard(Request $request)
    {
        // Remove superadmin check - always use regular dashboard for non-SaaS
        return $this->regularDashboard();
    }

    // Commented out for non-SaaS version
    /*
    private function superAdminDashboard()
    {
        $orderData = Order::selectRaw('MONTH(created_at) as month, COUNT(*) as count, SUM(price) as payments')
            ->whereYear('created_at', now()->year)
            ->groupBy('month')
            ->orderBy('month')
            ->get()
            ->keyBy('month');

        $months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        $chartData = [];
        $isDemo = config('app.is_demo');

        for ($i = 1; $i <= 12; $i++) {
            if ($isDemo) {
                $chartData[] = [
                    'month' => $months[$i-1],
                    'orders' => rand(5, 20),
                    'payments' => rand(500, 5000)
                ];
            } else {
                $chartData[] = [
                    'month' => $months[$i-1],
                    'orders' => $orderData[$i]->count ?? 0,
                    'payments' => $orderData[$i]->payments ?? 0
                ];
            }
        }

        return Inertia::render('SuperAdminDashboard', [
            'stats' => [
                'order_payments' => Order::sum('price') ?? 0,
                'total_orders' => Order::count(),
                'total_plans' => Plan::count(),
                'total_companies' => User::where('type', 'company')->count(),
            ],
            'chartData' => $chartData
        ]);
    }
    */

    private function regularDashboard()
    {
        if (Auth::user()->type === 'company') {
            return redirect()->route('project.dashboard.index');
        }
        elseif (Auth::user()->type === 'client') {
            return redirect()->route('account.index');
        }
        elseif (Auth::user()->type === 'vendor') {
            return redirect()->route('account.index');
        }
        elseif (Auth::user()->type === 'staff' || Auth::user()->type === 'hr') {
            return redirect()->route('hrm.index');
        }
        else {
            return Inertia::render('dashboard');
        }
    }
}

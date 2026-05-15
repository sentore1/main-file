<?php

namespace Workdo\Pos\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Workdo\Pos\Models\PosSale;
use Workdo\Pos\Models\PosItem;
use Workdo\ProductService\Models\ProductServiceItem;
use App\Models\Warehouse;
use Carbon\Carbon;
use Workdo\Pos\Models\Pos;

class PosReportController extends Controller
{
    public function sales(Request $request)
    {
        if(Auth::user()->can('manage-pos-reports')){
            $creatorId = creatorId();
            
            // Sales data for the report
            $salesData = Pos::where('created_by', $creatorId)
                ->with(['customer:id,name', 'warehouse:id,name', 'items'])
                ->latest()
                ->paginate(20);

            // Calculate total from pos_sale_items
            $salesWithTotals = $salesData->getCollection()->map(function($sale) {
                $sale->total = $sale->items->sum('total_amount');
                return $sale;
            });
            $salesData->setCollection($salesWithTotals);

            $isDemo = config('app.is_demo');

            // Daily sales for last 7 days
            $dailySales = [];
            // Volatile daily trend for POS (last 7 days)
            $dailyTrend = [1200, 1500, 1100, 1800, 1400, 2200, 1900];
            
            for ($i = 6; $i >= 0; $i--) {
                $date = Carbon::now()->subDays($i);
                $sales = PosItem::where('created_by', $creatorId)
                    ->whereDate('created_at', $date)
                    ->sum('total_amount');
                $count = Pos::where('created_by', $creatorId)
                    ->whereDate('created_at', $date)
                    ->count();

                if ($isDemo && $sales < 500) {
                    $sales = $dailyTrend[6-$i] + rand(-150, 150) + rand(0, 99) / 100;
                    $count = rand(3, 8);
                }

                $dailySales[] = [
                    'date' => $date->format('M d'),
                    'sales' => $sales,
                    'count' => $count
                ];
            }

            // Monthly sales for last 6 months
            $monthlySales = [];
            // Volatile monthly growth trend
            $monthTrend = [35000, 28000, 42000, 31000, 45000, 39000];
            
            for ($i = 5; $i >= 0; $i--) {
                $date = Carbon::now()->subMonths($i);
                $sales = PosItem::where('created_by', $creatorId)
                    ->whereYear('created_at', $date->year)
                    ->whereMonth('created_at', $date->month)
                    ->sum('total_amount');
                $count = Pos::where('created_by', $creatorId)
                    ->whereYear('created_at', $date->year)
                    ->whereMonth('created_at', $date->month)
                    ->count();

                if ($isDemo && $sales < 5000) {
                    $sales = $monthTrend[5-$i] + rand(-3000, 3000) + rand(0, 99) / 100;
                    $count = rand(80, 150);
                }

                $monthlySales[] = [
                    'month' => $date->format('M Y'),
                    'sales' => $sales,
                    'count' => $count
                ];
            }

            // Warehouse sales
            $warehouseSales = PosItem::where('created_by', $creatorId)
                ->with('sale.warehouse')
                ->get()
                ->groupBy('sale.warehouse_id')
                ->map(function($items, $warehouseId) use ($isDemo) {
                    $warehouse = $items->first()->sale->warehouse;
                    $sales = $items->sum('total_amount');
                    $count = $items->pluck('pos_id')->unique()->count();

                    if ($isDemo && $sales < 1000) {
                        $sales = rand(15000, 35000) + rand(0, 99) / 100;
                        $count = rand(25, 45);
                    }

                    return [
                        'name' => $warehouse->name ?? 'Unknown',
                        'sales' => $sales,
                        'count' => $count
                    ];
                })
                ->values();

            // If warehouse sales is empty in demo mode, provide realistic defaults
            if ($isDemo && $warehouseSales->isEmpty()) {
                $warehouseSales = collect([
                    ['name' => 'Main Warehouse', 'sales' => rand(45000, 65000) + .45, 'count' => rand(55, 80)],
                    ['name' => 'North Branch', 'sales' => rand(25000, 40000) + .12, 'count' => rand(30, 50)],
                    ['name' => 'South Station', 'sales' => rand(15000, 25000) + .89, 'count' => rand(15, 30)],
                ]);
            }

            return Inertia::render('Pos/Reports/Sales', [
                'salesData' => $salesData,
                'dailySales' => $dailySales,
                'monthlySales' => $monthlySales,
                'warehouseSales' => $warehouseSales,
            ]);
        }else{
            return redirect()->route('pos.index')->with('error', __('Permission denied'));
        }
    }

    public function products(Request $request)
    {
        if(Auth::user()->can('manage-pos-reports')){
            $creatorId = creatorId();
            
            // Product performance data
            $productData = PosItem::where('created_by', $creatorId)
                ->with('product')
                ->get()
                ->groupBy('product_id')
                ->map(function($items, $productId) {
                    $product = $items->first()->product;
                    return [
                        'name' => $product->name,
                        'sku' => $product->sku,
                        'total_quantity' => $items->sum('quantity'),
                        'total_revenue' => $items->sum('total_amount'),
                        'total_orders' => $items->pluck('pos_id')->unique()->count()
                    ];
                })
                ->sortByDesc('total_revenue')
                ->take(20)
                ->values();

            return Inertia::render('Pos/Reports/Products', [
                'productData' => $productData,
            ]);
        }else{
            return redirect()->route('pos.index')->with('error', __('Permission denied'));
        }
    }

    public function customers(Request $request)
    {
        if(Auth::user()->can('manage-pos-reports')){
            $creatorId = creatorId();
            
            // Customer analysis data
            $customerData = PosItem::where('created_by', $creatorId)
                ->with('sale.customer')
                ->get()
                ->groupBy('sale.customer_id')
                ->map(function($items, $customerId) {
                    $customer = $items->first()->sale->customer;
                    $totalSpent = $items->sum('total_amount');
                    $orderCount = $items->pluck('pos_id')->unique()->count();
                    return [
                        'customer_id' => $customerId,
                        'customer' => ['name' => $customer->name ?? 'Walk-in'],
                        'total_orders' => $orderCount,
                        'total_spent' => $totalSpent,
                        'avg_order_value' => $orderCount > 0 ? $totalSpent / $orderCount : 0,
                        'last_order_date' => $items->max('created_at')
                    ];
                })
                ->sortByDesc('total_spent')
                ->take(20)
                ->values();

            return Inertia::render('Pos/Reports/Customers', [
                'customerData' => $customerData,
            ]);
        }else{
            return redirect()->route('pos.index')->with('error', __('Permission denied'));
        }
    }

    public function dailyFinancial(Request $request)
    {
        if(Auth::user()->can('manage-pos-reports')){
            $creatorId = creatorId();
            $date = $request->get('date', now()->toDateString());
            $warehouseId = $request->get('warehouse_id');
            
            // Get warehouses for filter dropdown
            $warehouses = Warehouse::where('created_by', $creatorId)
                ->select('id', 'name')
                ->get();
            
            // Get all POS sales for the selected date grouped by department/category
            $salesByDepartment = [];
            
            // Base query with warehouse filter
            $baseQuery = Pos::where('created_by', $creatorId)
                ->whereDate('pos_date', $date);
            
            if ($warehouseId) {
                $baseQuery->where('warehouse_id', $warehouseId);
            }
            
            // Restaurant Sales
            $restaurantSales = (clone $baseQuery)
                ->whereHas('items.product', function($q) {
                    $q->whereHas('category', function($cat) {
                        $cat->where('name', 'LIKE', '%Restaurant%')
                            ->orWhere('name', 'LIKE', '%Food%')
                            ->orWhere('name', 'LIKE', '%Beverage%');
                    });
                })
                ->with(['items.product.category', 'payment'])
                ->get();
            
            $salesByDepartment['RESTAURANT SALES'] = $this->groupSalesByPaymentMethod($restaurantSales);
            
            // Bar Sales
            $barSales = (clone $baseQuery)
                ->whereHas('items.product', function($q) {
                    $q->whereHas('category', function($cat) {
                        $cat->where('name', 'LIKE', '%Bar%')
                            ->orWhere('name', 'LIKE', '%Drink%')
                            ->orWhere('name', 'LIKE', '%Alcohol%');
                    });
                })
                ->with(['items.product.category', 'payment'])
                ->get();
            
            $salesByDepartment['BAR SALES'] = $this->groupSalesByPaymentMethod($barSales);
            
            // Room Sales (from room bookings)
            $roomBookingQuery = \Workdo\Pos\Models\RoomBooking::where('created_by', $creatorId)
                ->whereDate('check_in_date', $date);
            
            if ($warehouseId) {
                $roomBookingQuery->where('warehouse_id', $warehouseId);
            }
            
            $roomSales = $roomBookingQuery->with('payment')->get();
            
            $salesByDepartment['ROOM SALES'] = $this->groupRoomSalesByPaymentMethod($roomSales);
            
            // Coffee Shop Sales
            $coffeeSales = (clone $baseQuery)
                ->whereHas('items.product', function($q) {
                    $q->whereHas('category', function($cat) {
                        $cat->where('name', 'LIKE', '%Coffee%')
                            ->orWhere('name', 'LIKE', '%Cafe%');
                    });
                })
                ->with(['items.product.category', 'payment'])
                ->get();
            
            $salesByDepartment['COFFEE SHOP SALES'] = $this->groupSalesByPaymentMethod($coffeeSales);
            
            // Salle Sales (Hall/Event Sales)
            $salleSales = (clone $baseQuery)
                ->whereHas('items.product', function($q) {
                    $q->whereHas('category', function($cat) {
                        $cat->where('name', 'LIKE', '%Hall%')
                            ->orWhere('name', 'LIKE', '%Event%')
                            ->orWhere('name', 'LIKE', '%Salle%');
                    });
                })
                ->with(['items.product.category', 'payment'])
                ->get();
            
            $salesByDepartment['SALLE SALES'] = $this->groupSalesByPaymentMethod($salleSales);
            
            // Room Facilities (Spa, Massage, etc.)
            $facilitiesSales = (clone $baseQuery)
                ->whereHas('items.product', function($q) {
                    $q->whereHas('category', function($cat) {
                        $cat->where('name', 'LIKE', '%Spa%')
                            ->orWhere('name', 'LIKE', '%Massage%')
                            ->orWhere('name', 'LIKE', '%Sauna%')
                            ->orWhere('name', 'LIKE', '%Facility%');
                    });
                })
                ->with(['items.product.category', 'payment'])
                ->get();
            
            $salesByDepartment['SAUNA&MASSAGE SALES'] = $this->groupSalesByPaymentMethod($facilitiesSales);
            
            // Swimming Pool/Clothes Sales
            $poolSales = (clone $baseQuery)
                ->whereHas('items.product', function($q) {
                    $q->whereHas('category', function($cat) {
                        $cat->where('name', 'LIKE', '%Pool%')
                            ->orWhere('name', 'LIKE', '%Swimming%')
                            ->orWhere('name', 'LIKE', '%Clothes%');
                    });
                })
                ->with(['items.product.category', 'payment'])
                ->get();
            
            $salesByDepartment['SWIMMING POOL/CLOTHES SALES'] = $this->groupSalesByPaymentMethod($poolSales);
            
            // Gym Sales
            $gymSales = (clone $baseQuery)
                ->whereHas('items.product', function($q) {
                    $q->whereHas('category', function($cat) {
                        $cat->where('name', 'LIKE', '%Gym%')
                            ->orWhere('name', 'LIKE', '%Fitness%');
                    });
                })
                ->with(['items.product.category', 'payment'])
                ->get();
            
            $salesByDepartment['GYM'] = $this->groupSalesByPaymentMethod($gymSales);
            
            // Pool Sales (Billiards/Snooker)
            $billiardsSales = (clone $baseQuery)
                ->whereHas('items.product', function($q) {
                    $q->whereHas('category', function($cat) {
                        $cat->where('name', 'LIKE', '%Pool%')
                            ->orWhere('name', 'LIKE', '%Billiard%')
                            ->orWhere('name', 'LIKE', '%Snooker%');
                    });
                })
                ->with(['items.product.category', 'payment'])
                ->get();
            
            $salesByDepartment['POOL SALES'] = $this->groupSalesByPaymentMethod($billiardsSales);
            
            // Services and Others
            $otherSales = (clone $baseQuery)
                ->whereDoesntHave('items.product.category', function($cat) {
                    $cat->where('name', 'LIKE', '%Restaurant%')
                        ->orWhere('name', 'LIKE', '%Food%')
                        ->orWhere('name', 'LIKE', '%Bar%')
                        ->orWhere('name', 'LIKE', '%Coffee%')
                        ->orWhere('name', 'LIKE', '%Hall%')
                        ->orWhere('name', 'LIKE', '%Spa%')
                        ->orWhere('name', 'LIKE', '%Pool%')
                        ->orWhere('name', 'LIKE', '%Gym%');
                })
                ->with(['items.product.category', 'payment'])
                ->get();
            
            $salesByDepartment['SERVISES AND OTHERS'] = $this->groupSalesByPaymentMethod($otherSales);
            
            // Calculate totals
            $totalSales = 0;
            $totalMomo = 0;
            $totalCredit = 0;
            $totalAdvance = 0;
            $totalRecovery = 0;
            $totalExcedent = 0;
            $totalVisacard = 0;
            $totalPos = 0;
            $totalComplementary = 0;
            $totalBreakfastRoom = 0;
            $totalCash = 0;
            
            foreach ($salesByDepartment as $dept => $data) {
                $totalSales += $data['total'];
                $totalMomo += $data['momo'];
                $totalCredit += $data['credit'];
                $totalAdvance += $data['advance'];
                $totalRecovery += $data['recovery'];
                $totalExcedent += $data['excedent'];
                $totalVisacard += $data['visacard'];
                $totalPos += $data['pos_bank'];
                $totalComplementary += $data['complementary'];
                $totalBreakfastRoom += $data['breakfast_room'];
                $totalCash += $data['cash'];
            }
            
            // Cash Deposit
            $cashDeposit = [
                'momo_from_md' => 0, // This would come from a separate cash deposit table
                'advance_from_sport_center' => 0,
                'cash_collection' => 0,
                'recovery' => $totalRecovery,
                'total' => 0
            ];
            
            // Purchases (Expenses)
            $purchases = $this->getPurchasesForDate($date);
            
            // Other Expenses
            $otherExpenses = $this->getOtherExpensesForDate($date);
            
            // Closing balance
            $totalCashAvailable = $totalCash + $cashDeposit['total'];
            $totalPurchases = $purchases['total'];
            $totalOtherExpenses = $otherExpenses['total'];
            $closingBalance = $totalCashAvailable - $totalPurchases - $totalOtherExpenses;
            
            return Inertia::render('Pos/Reports/DailyFinancial', [
                'date' => $date,
                'warehouseId' => $warehouseId,
                'warehouses' => $warehouses,
                'salesByDepartment' => $salesByDepartment,
                'totals' => [
                    'sales' => $totalSales,
                    'momo' => $totalMomo,
                    'credit' => $totalCredit,
                    'advance' => $totalAdvance,
                    'recovery' => $totalRecovery,
                    'excedent' => $totalExcedent,
                    'visacard' => $totalVisacard,
                    'pos_bank' => $totalPos,
                    'complementary' => $totalComplementary,
                    'breakfast_room' => $totalBreakfastRoom,
                    'cash' => $totalCash,
                ],
                'cashDeposit' => $cashDeposit,
                'purchases' => $purchases,
                'otherExpenses' => $otherExpenses,
                'closingBalance' => $closingBalance,
            ]);
        }else{
            return redirect()->route('pos.index')->with('error', __('Permission denied'));
        }
    }
    
    private function groupSalesByPaymentMethod($sales)
    {
        $result = [
            'momo' => 0,
            'credit' => 0,
            'pos_bank' => 0,
            'advance' => 0,
            'cash' => 0,
            'complementary' => 0,
            'recovery' => 0,
            'excedent' => 0,
            'visacard' => 0,
            'breakfast_room' => 0,
            'total' => 0
        ];
        
        foreach ($sales as $sale) {
            if ($sale->payment) {
                $amount = $sale->payment->discount_amount;
                $result['total'] += $amount;
                
                // Determine payment method based on bank_account or status
                if ($sale->charged_to_room) {
                    $result['credit'] += $amount;
                } elseif ($sale->bank_account_id) {
                    // Check bank account type
                    $bankAccount = \Workdo\Account\Models\BankAccount::find($sale->bank_account_id);
                    if ($bankAccount) {
                        $accountName = strtolower($bankAccount->account_name);
                        if (str_contains($accountName, 'momo') || str_contains($accountName, 'mobile')) {
                            $result['momo'] += $amount;
                        } elseif (str_contains($accountName, 'pos') || str_contains($accountName, 'card')) {
                            $result['pos_bank'] += $amount;
                        } elseif (str_contains($accountName, 'visa')) {
                            $result['visacard'] += $amount;
                        } else {
                            $result['cash'] += $amount;
                        }
                    } else {
                        $result['cash'] += $amount;
                    }
                } else {
                    $result['cash'] += $amount;
                }
            }
        }
        
        return $result;
    }
    
    private function groupRoomSalesByPaymentMethod($bookings)
    {
        $result = [
            'momo' => 0,
            'credit' => 0,
            'pos_bank' => 0,
            'advance' => 0,
            'cash' => 0,
            'complementary' => 0,
            'recovery' => 0,
            'excedent' => 0,
            'visacard' => 0,
            'breakfast_room' => 0,
            'total' => 0
        ];
        
        foreach ($bookings as $booking) {
            $amount = $booking->total_amount;
            $result['total'] += $amount;
            
            // Check payment method from booking payment (singular)
            if ($booking->payment) {
                $payment = $booking->payment;
                $paymentMethod = strtolower($payment->payment_method ?? 'cash');
                if (str_contains($paymentMethod, 'momo') || str_contains($paymentMethod, 'mobile')) {
                    $result['momo'] += $payment->amount_paid;
                } elseif (str_contains($paymentMethod, 'card') || str_contains($paymentMethod, 'pos')) {
                    $result['pos_bank'] += $payment->amount_paid;
                } elseif (str_contains($paymentMethod, 'credit')) {
                    $result['credit'] += $payment->amount_paid;
                } else {
                    $result['cash'] += $payment->amount_paid;
                }
            } else {
                $result['cash'] += $amount;
            }
        }
        
        return $result;
    }
    
    private function getPurchasesForDate($date)
    {
        $creatorId = creatorId();
        $purchases = [
            'bar' => ['paid' => 0, 'credit' => 0],
            'resto' => ['paid' => 0, 'credit' => 0],
            'maintenance_office_reception' => ['paid' => 0, 'credit' => 0],
            'cofe_shop' => ['paid' => 0, 'credit' => 0],
            'sport_center' => ['paid' => 0, 'credit' => 0],
            'house_keeping' => ['paid' => 0, 'credit' => 0],
            'total' => 0
        ];
        
        // Get purchases from purchase invoices if available
        if (class_exists('\App\Models\PurchaseInvoice')) {
            $purchaseInvoices = \App\Models\PurchaseInvoice::where('created_by', $creatorId)
                ->whereDate('invoice_date', $date)
                ->with('items.product.category')
                ->get();
            
            foreach ($purchaseInvoices as $invoice) {
                $amount = $invoice->total_amount ?? 0;
                $isPaid = $invoice->status === 'posted';
                
                // Categorize by product category
                foreach ($invoice->items as $item) {
                    $category = strtolower($item->product->category->name ?? '');
                    if (str_contains($category, 'bar')) {
                        $purchases['bar'][$isPaid ? 'paid' : 'credit'] += $item->total_amount;
                    } elseif (str_contains($category, 'restaurant') || str_contains($category, 'food')) {
                        $purchases['resto'][$isPaid ? 'paid' : 'credit'] += $item->total_amount;
                    } elseif (str_contains($category, 'coffee')) {
                        $purchases['cofe_shop'][$isPaid ? 'paid' : 'credit'] += $item->total_amount;
                    } elseif (str_contains($category, 'sport') || str_contains($category, 'gym')) {
                        $purchases['sport_center'][$isPaid ? 'paid' : 'credit'] += $item->total_amount;
                    } elseif (str_contains($category, 'cleaning') || str_contains($category, 'housekeeping')) {
                        $purchases['house_keeping'][$isPaid ? 'paid' : 'credit'] += $item->total_amount;
                    } else {
                        $purchases['maintenance_office_reception'][$isPaid ? 'paid' : 'credit'] += $item->total_amount;
                    }
                }
            }
        }
        
        // Calculate total
        foreach ($purchases as $key => $value) {
            if ($key !== 'total' && is_array($value)) {
                $purchases['total'] += $value['paid'];
            }
        }
        
        return $purchases;
    }
    
    private function getOtherExpensesForDate($date)
    {
        $creatorId = creatorId();
        $expenses = [
            'paid' => 0,
            'credit' => 0,
            'total' => 0
        ];
        
        // Get expenses from expense module if available
        if (class_exists('\Workdo\Account\Models\Expense')) {
            $expenseRecords = \Workdo\Account\Models\Expense::where('created_by', $creatorId)
                ->whereDate('expense_date', $date)
                ->get();
            
            foreach ($expenseRecords as $expense) {
                $amount = $expense->amount ?? 0;
                $isPaid = $expense->status === 'posted';
                
                if ($isPaid) {
                    $expenses['paid'] += $amount;
                } else {
                    $expenses['credit'] += $amount;
                }
            }
        }
        
        $expenses['total'] = $expenses['paid'];
        
        return $expenses;
    }
}

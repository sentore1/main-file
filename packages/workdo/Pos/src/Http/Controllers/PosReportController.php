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
                ->where('is_active', true)
                ->select('id', 'name', 'city')
                ->get();
            
            // Get opening balance (from previous day's closing)
            $openingBalance = $this->getOpeningBalance($date, $warehouseId);
            
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
            $totalTransactionCount = 0;
            
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
                $totalTransactionCount += $data['transaction_count'] ?? 0;
            }
            
            // Payment method summary with transaction counts
            $paymentMethodSummary = [
                'cash' => [
                    'amount' => $totalCash,
                    'count' => 0,
                    'percentage' => $totalSales > 0 ? ($totalCash / $totalSales * 100) : 0
                ],
                'momo' => [
                    'amount' => $totalMomo,
                    'count' => 0,
                    'percentage' => $totalSales > 0 ? ($totalMomo / $totalSales * 100) : 0
                ],
                'pos_bank' => [
                    'amount' => $totalPos,
                    'count' => 0,
                    'percentage' => $totalSales > 0 ? ($totalPos / $totalSales * 100) : 0
                ],
                'visacard' => [
                    'amount' => $totalVisacard,
                    'count' => 0,
                    'percentage' => $totalSales > 0 ? ($totalVisacard / $totalSales * 100) : 0
                ],
                'credit' => [
                    'amount' => $totalCredit,
                    'count' => 0,
                    'percentage' => $totalSales > 0 ? ($totalCredit / $totalSales * 100) : 0
                ],
            ];
            
            // Count transactions per payment method
            $allSales = (clone $baseQuery)->with('payment')->get();
            foreach ($allSales as $sale) {
                if ($sale->charged_to_room) {
                    $paymentMethodSummary['credit']['count']++;
                } elseif ($sale->bank_account_id) {
                    $bankAccount = \Workdo\Account\Models\BankAccount::find($sale->bank_account_id);
                    if ($bankAccount) {
                        $accountName = strtolower($bankAccount->account_name);
                        if (str_contains($accountName, 'momo') || str_contains($accountName, 'mobile')) {
                            $paymentMethodSummary['momo']['count']++;
                        } elseif (str_contains($accountName, 'pos') || str_contains($accountName, 'card')) {
                            $paymentMethodSummary['pos_bank']['count']++;
                        } elseif (str_contains($accountName, 'visa')) {
                            $paymentMethodSummary['visacard']['count']++;
                        } else {
                            $paymentMethodSummary['cash']['count']++;
                        }
                    } else {
                        $paymentMethodSummary['cash']['count']++;
                    }
                } else {
                    $paymentMethodSummary['cash']['count']++;
                }
            }
            
            // Purchases (Expenses)
            $purchases = $this->getPurchasesForDate($date, $warehouseId);
            
            // Other Expenses
            $otherExpenses = $this->getOtherExpensesForDate($date, $warehouseId);
            
            // Accounts Receivable (who owes you money)
            $receivables = $this->getReceivablesForDate($date, $warehouseId);
            
            // Accounts Payable (what you owe suppliers)
            $payables = $this->getPayablesForDate($date, $warehouseId);
            
            // Historical comparison
            $comparisons = $this->getHistoricalComparisons($date, $warehouseId, $totalSales);
            
            // Top performers
            $topPerformers = $this->getTopPerformers($date, $warehouseId);
            
            // Closing balance
            $totalCashCollected = $totalCash; // Only actual cash collected
            $totalCashAvailable = $openingBalance['amount'] + $totalCashCollected;
            $totalCashOut = $purchases['total_paid'] + $otherExpenses['total_paid'];
            $closingBalance = $totalCashAvailable - $totalCashOut;
            
            return Inertia::render('Pos/Reports/DailyFinancial', [
                'date' => $date,
                'warehouseId' => $warehouseId,
                'warehouses' => $warehouses,
                'openingBalance' => $openingBalance,
                'salesByDepartment' => $salesByDepartment,
                'paymentMethodSummary' => $paymentMethodSummary,
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
                    'transaction_count' => $totalTransactionCount,
                    'cash_collected' => $totalCashCollected,
                    'electronic_payments' => $totalMomo + $totalPos + $totalVisacard,
                ],
                'purchases' => $purchases,
                'otherExpenses' => $otherExpenses,
                'receivables' => $receivables,
                'payables' => $payables,
                'comparisons' => $comparisons,
                'topPerformers' => $topPerformers,
                'cashFlow' => [
                    'opening' => $openingBalance['amount'],
                    'cash_in' => $totalCashCollected,
                    'total_available' => $totalCashAvailable,
                    'cash_out' => $totalCashOut,
                    'closing' => $closingBalance,
                ],
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
            'total' => 0,
            // NEW: Add transaction metrics
            'transaction_count' => 0,
            'average_transaction' => 0,
            'items_sold' => 0,
            'waiter_breakdown' => [],
            'top_products' => [],
        ];
        
        $transactionIds = [];
        $waiterSales = [];
        $productSales = [];
        
        foreach ($sales as $sale) {
            // Track unique transactions
            $transactionIds[$sale->id] = true;
            
            // Track waiter sales
            $waiter = $sale->waiter_name ?? 'Unknown';
            if (!isset($waiterSales[$waiter])) {
                $waiterSales[$waiter] = [
                    'name' => $waiter,
                    'transactions' => 0,
                    'total_sales' => 0,
                ];
            }
            $waiterSales[$waiter]['transactions']++;
            
            // Track items and products
            foreach ($sale->items as $item) {
                $result['items_sold'] += $item->quantity;
                
                // Track top products
                $productId = $item->product_id;
                $productName = $item->product->name ?? 'Unknown';
                
                if (!isset($productSales[$productId])) {
                    $productSales[$productId] = [
                        'name' => $productName,
                        'sku' => $item->product->sku ?? '',
                        'quantity' => 0,
                        'revenue' => 0,
                    ];
                }
                $productSales[$productId]['quantity'] += $item->quantity;
                $productSales[$productId]['revenue'] += $item->total_amount;
            }
            
            if ($sale->payment) {
                $amount = $sale->payment->discount_amount;
                $result['total'] += $amount;
                $waiterSales[$waiter]['total_sales'] += $amount;
                
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
        
        // Calculate metrics
        $result['transaction_count'] = count($transactionIds);
        $result['average_transaction'] = $result['transaction_count'] > 0 
            ? $result['total'] / $result['transaction_count'] 
            : 0;
        
        // Sort and limit waiter breakdown
        $result['waiter_breakdown'] = collect($waiterSales)
            ->sortByDesc('total_sales')
            ->values()
            ->toArray();
        
        // Sort and limit top products
        $result['top_products'] = collect($productSales)
            ->sortByDesc('revenue')
            ->take(5)
            ->values()
            ->toArray();
        
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
    
    private function getPurchasesForDate($date, $warehouseId = null)
    {
        $creatorId = creatorId();
        $purchases = [
            'bar' => ['paid' => 0, 'credit' => 0],
            'resto' => ['paid' => 0, 'credit' => 0],
            'maintenance_office_reception' => ['paid' => 0, 'credit' => 0],
            'cofe_shop' => ['paid' => 0, 'credit' => 0],
            'sport_center' => ['paid' => 0, 'credit' => 0],
            'house_keeping' => ['paid' => 0, 'credit' => 0],
            'total_paid' => 0,
            'total_credit' => 0,
            'total' => 0
        ];
        
        // Get purchases from purchase invoices if available
        if (class_exists('\App\Models\PurchaseInvoice')) {
            $purchaseInvoices = \App\Models\PurchaseInvoice::where('created_by', $creatorId)
                ->whereDate('invoice_date', $date)
                ->when($warehouseId, fn($q) => $q->where('warehouse_id', $warehouseId))
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
        
        // Calculate totals
        foreach ($purchases as $key => $value) {
            if ($key !== 'total_paid' && $key !== 'total_credit' && $key !== 'total' && is_array($value)) {
                $purchases['total_paid'] += $value['paid'];
                $purchases['total_credit'] += $value['credit'];
            }
        }
        $purchases['total'] = $purchases['total_paid'] + $purchases['total_credit'];
        
        return $purchases;
    }
    
    private function getOtherExpensesForDate($date, $warehouseId = null)
    {
        $creatorId = creatorId();
        $expenses = [
            'paid' => 0,
            'credit' => 0,
            'total_paid' => 0,
            'total_credit' => 0,
            'total' => 0
        ];
        
        // Get expenses from expense module if available
        if (class_exists('\Workdo\Account\Models\Expense')) {
            try {
                $query = \Workdo\Account\Models\Expense::where('created_by', $creatorId)
                    ->whereDate('expense_date', $date);
                
                // Only filter by warehouse if the column exists
                if ($warehouseId && \Schema::hasColumn('expenses', 'warehouse_id')) {
                    $query->where('warehouse_id', $warehouseId);
                }
                
                $expenseRecords = $query->get();
                
                foreach ($expenseRecords as $expense) {
                    $amount = $expense->amount ?? 0;
                    $isPaid = $expense->status === 'posted';
                    
                    if ($isPaid) {
                        $expenses['paid'] += $amount;
                    } else {
                        $expenses['credit'] += $amount;
                    }
                }
            } catch (\Exception $e) {
                \Log::error('Other Expenses Error: ' . $e->getMessage());
            }
        }
        
        $expenses['total_paid'] = $expenses['paid'];
        $expenses['total_credit'] = $expenses['credit'];
        $expenses['total'] = $expenses['paid'] + $expenses['credit'];
        
        return $expenses;
    }
    
    /**
     * Get opening balance (previous day's closing balance)
     */
    private function getOpeningBalance($date, $warehouseId = null)
    {
        $creatorId = creatorId();
        $previousDate = Carbon::parse($date)->subDay()->toDateString();
        
        // Calculate opening balance from previous day's closing
        // This should ideally come from a closing_balances table, but we'll calculate it
        
        // Get previous day's cash sales
        $previousCashQuery = Pos::where('created_by', $creatorId)
            ->whereDate('pos_date', $previousDate);
        
        if ($warehouseId) {
            $previousCashQuery->where('warehouse_id', $warehouseId);
        }
        
        $previousCash = 0;
        $previousSales = $previousCashQuery->with(['items', 'payment'])->get();
        
        foreach ($previousSales as $sale) {
            if ($sale->payment && !$sale->charged_to_room && !$sale->bank_account_id) {
                $previousCash += $sale->payment->discount_amount ?? 0;
            }
        }
        
        return [
            'amount' => $previousCash,
            'source' => 'calculated',
            'note' => 'Opening balance from previous day\'s cash sales',
        ];
    }
    
    /**
     * Get opening credit (unpaid credits carried forward)
     */
    private function getOpeningCredit($date, $warehouseId = null)
    {
        $creatorId = creatorId();
        
        // Get unpaid room bookings from before today
        $roomReceivables = \Workdo\Pos\Models\RoomBooking::where('created_by', $creatorId)
            ->whereDate('check_in_date', '<', $date)
            ->when($warehouseId, fn($q) => $q->where('warehouse_id', $warehouseId))
            ->with('payment')
            ->get()
            ->sum(function($booking) {
                $paid = $booking->payment->amount_paid ?? 0;
                return max(0, $booking->total_amount - $paid);
            });
        
        // Get POS sales charged to room from before today
        $posReceivables = Pos::where('created_by', $creatorId)
            ->where('charged_to_room', true)
            ->whereDate('pos_date', '<', $date)
            ->when($warehouseId, fn($q) => $q->where('warehouse_id', $warehouseId))
            ->with('items')
            ->get()
            ->sum(fn($sale) => $sale->items->sum('total_amount'));
        
        $total = $roomReceivables + $posReceivables;
        
        return [
            'amount' => $total,
            'room_bookings' => $roomReceivables,
            'pos_credit' => $posReceivables,
        ];
    }
    
    /**
     * Get accounts receivable (who owes you money)
     */
    private function getReceivablesForDate($date, $warehouseId = null)
    {
        $creatorId = creatorId();
        
        // Room bookings unpaid
        $roomReceivables = \Workdo\Pos\Models\RoomBooking::where('created_by', $creatorId)
            ->whereDate('check_in_date', '<=', $date)
            ->when($warehouseId, fn($q) => $q->where('warehouse_id', $warehouseId))
            ->with(['payment', 'warehouse', 'customer'])
            ->get()
            ->map(function($booking) use ($date) {
                $paid = $booking->payment->amount_paid ?? 0;
                $balance = $booking->total_amount - $paid;
                if ($balance <= 0) return null;
                
                return [
                    'type' => 'Room Booking',
                    'reference' => $booking->booking_number,
                    'customer' => $booking->customer->name ?? 'Unknown',
                    'branch' => $booking->warehouse->name ?? 'Unknown',
                    'amount' => $balance,
                    'date' => $booking->check_in_date->toDateString(),
                    'days_outstanding' => Carbon::parse($booking->check_in_date)->diffInDays($date),
                ];
            })
            ->filter()
            ->values();
        
        // POS sales charged to room
        $posReceivables = Pos::where('created_by', $creatorId)
            ->where('charged_to_room', true)
            ->whereDate('pos_date', '<=', $date)
            ->when($warehouseId, fn($q) => $q->where('warehouse_id', $warehouseId))
            ->with(['items', 'warehouse', 'customer'])
            ->get()
            ->map(function($sale) use ($date) {
                $total = $sale->items->sum('total_amount');
                if ($total <= 0) return null;
                
                return [
                    'type' => 'Charged to Room',
                    'reference' => $sale->sale_number,
                    'customer' => $sale->customer->name ?? 'Walk-in',
                    'branch' => $sale->warehouse->name ?? 'Unknown',
                    'amount' => $total,
                    'date' => $sale->pos_date->toDateString(),
                    'days_outstanding' => Carbon::parse($sale->pos_date)->diffInDays($date),
                ];
            })
            ->filter()
            ->values();
        
        $allReceivables = $roomReceivables->merge($posReceivables);
        
        return [
            'details' => $allReceivables,
            'total' => $allReceivables->sum('amount'),
            'count' => $allReceivables->count(),
            'by_branch' => $allReceivables->groupBy('branch')->map(fn($items) => $items->sum('amount')),
            'overdue' => $allReceivables->where('days_outstanding', '>', 30)->sum('amount'),
        ];
    }
    
    /**
     * Get accounts payable (what you owe suppliers)
     */
    private function getPayablesForDate($date, $warehouseId = null)
    {
        $creatorId = creatorId();
        
        if (!class_exists('\App\Models\PurchaseInvoice')) {
            return [
                'details' => [],
                'total' => 0,
                'count' => 0,
                'by_department' => [],
                'overdue' => 0,
            ];
        }
        
        $unpaidInvoices = \App\Models\PurchaseInvoice::where('created_by', $creatorId)
            ->where('balance_amount', '>', 0)
            ->whereDate('invoice_date', '<=', $date)
            ->when($warehouseId, fn($q) => $q->where('warehouse_id', $warehouseId))
            ->with(['items.product.category', 'vendor', 'warehouse'])
            ->get();
        
        $payableDetails = $unpaidInvoices->map(function($invoice) use ($date) {
            $daysOverdue = $invoice->due_date < now() ? Carbon::parse($invoice->due_date)->diffInDays($date) : 0;
            
            return [
                'invoice_number' => $invoice->invoice_number,
                'supplier' => $invoice->vendor->name ?? 'Unknown',
                'branch' => $invoice->warehouse->name ?? 'Unknown',
                'amount' => $invoice->balance_amount,
                'due_date' => $invoice->due_date->toDateString(),
                'days_overdue' => $daysOverdue,
                'is_overdue' => $invoice->due_date < now(),
            ];
        });
        
        // Group by department
        $byDepartment = [];
        foreach ($unpaidInvoices as $invoice) {
            foreach ($invoice->items as $item) {
                $dept = $item->product->category->name ?? 'Other';
                if (!isset($byDepartment[$dept])) {
                    $byDepartment[$dept] = ['amount' => 0, 'count' => 0];
                }
                $itemBalance = ($invoice->balance_amount / $invoice->total_amount) * $item->total_amount;
                $byDepartment[$dept]['amount'] += $itemBalance;
                $byDepartment[$dept]['count']++;
            }
        }
        
        return [
            'details' => $payableDetails,
            'total' => $unpaidInvoices->sum('balance_amount'),
            'count' => $unpaidInvoices->count(),
            'by_department' => $byDepartment,
            'overdue' => $unpaidInvoices->where('due_date', '<', now())->sum('balance_amount'),
        ];
    }
    
    /**
     * Get stock value at closing
     */
    private function getStockValueForDate($date, $warehouseId = null)
    {
        $creatorId = creatorId();
        
        if (!class_exists('\Workdo\ProductService\Models\WarehouseStock')) {
            return [
                'by_branch_and_department' => [],
                'total_value' => 0,
                'total_quantity' => 0,
            ];
        }
        
        $query = \Workdo\ProductService\Models\WarehouseStock::with(['product.category', 'warehouse'])
            ->where('quantity', '>', 0);
        
        if ($warehouseId) {
            $query->where('warehouse_id', $warehouseId);
        }
        
        $stocks = $query->get();
        
        $stockByBranchAndDept = [];
        $totalValue = 0;
        $totalQuantity = 0;
        
        foreach ($stocks as $stock) {
            $branch = $stock->warehouse->name ?? 'Unknown';
            $dept = $stock->product->category->name ?? 'Other';
            $value = $stock->quantity * ($stock->product->purchase_price ?? 0);
            
            if (!isset($stockByBranchAndDept[$branch])) {
                $stockByBranchAndDept[$branch] = [];
            }
            
            if (!isset($stockByBranchAndDept[$branch][$dept])) {
                $stockByBranchAndDept[$branch][$dept] = [
                    'quantity' => 0,
                    'value' => 0,
                ];
            }
            
            $stockByBranchAndDept[$branch][$dept]['quantity'] += $stock->quantity;
            $stockByBranchAndDept[$branch][$dept]['value'] += $value;
            $totalValue += $value;
            $totalQuantity += $stock->quantity;
        }
        
        return [
            'by_branch_and_department' => $stockByBranchAndDept,
            'total_value' => $totalValue,
            'total_quantity' => $totalQuantity,
        ];
    }
    
    /**
     * Get historical comparisons
     */
    private function getHistoricalComparisons($date, $warehouseId, $currentSales)
    {
        $creatorId = creatorId();
        
        // Previous day
        $previousDate = Carbon::parse($date)->subDay()->toDateString();
        $previousDaySales = $this->getTotalSalesForDate($previousDate, $warehouseId);
        
        // Same day last week
        $lastWeekDate = Carbon::parse($date)->subDays(7)->toDateString();
        $lastWeekSales = $this->getTotalSalesForDate($lastWeekDate, $warehouseId);
        
        // Same day last month
        $lastMonthDate = Carbon::parse($date)->subMonth()->toDateString();
        $lastMonthSales = $this->getTotalSalesForDate($lastMonthDate, $warehouseId);
        
        return [
            'previous_day' => [
                'date' => $previousDate,
                'sales' => $previousDaySales,
                'difference' => $currentSales - $previousDaySales,
                'percentage' => $previousDaySales > 0 ? (($currentSales - $previousDaySales) / $previousDaySales * 100) : 0,
            ],
            'last_week' => [
                'date' => $lastWeekDate,
                'sales' => $lastWeekSales,
                'difference' => $currentSales - $lastWeekSales,
                'percentage' => $lastWeekSales > 0 ? (($currentSales - $lastWeekSales) / $lastWeekSales * 100) : 0,
            ],
            'last_month' => [
                'date' => $lastMonthDate,
                'sales' => $lastMonthSales,
                'difference' => $currentSales - $lastMonthSales,
                'percentage' => $lastMonthSales > 0 ? (($currentSales - $lastMonthSales) / $lastMonthSales * 100) : 0,
            ],
        ];
    }
    
    /**
     * Get top performers
     */
    private function getTopPerformers($date, $warehouseId = null)
    {
        $creatorId = creatorId();
        
        $baseQuery = Pos::where('created_by', $creatorId)
            ->whereDate('pos_date', $date)
            ->when($warehouseId, fn($q) => $q->where('warehouse_id', $warehouseId));
        
        // Top selling products
        $topProducts = PosItem::whereHas('sale', function($q) use ($date, $warehouseId, $creatorId) {
                $q->where('created_by', $creatorId)
                  ->whereDate('pos_date', $date)
                  ->when($warehouseId, fn($query) => $query->where('warehouse_id', $warehouseId));
            })
            ->with('product')
            ->selectRaw('product_id, SUM(quantity) as total_quantity, SUM(total_amount) as total_revenue, COUNT(*) as transaction_count')
            ->groupBy('product_id')
            ->orderByDesc('total_revenue')
            ->limit(5)
            ->get()
            ->map(function($item) {
                return [
                    'name' => $item->product->name ?? 'Unknown',
                    'sku' => $item->product->sku ?? '',
                    'quantity' => $item->total_quantity,
                    'revenue' => $item->total_revenue,
                    'transactions' => $item->transaction_count,
                ];
            });
        
        // Top departments (calculated earlier, just get top 3)
        $topDepartments = [];
        
        return [
            'top_products' => $topProducts,
            'top_departments' => $topDepartments,
        ];
    }
    
    /**
     * Get total sales for a specific date
     */
    private function getTotalSalesForDate($date, $warehouseId = null)
    {
        $creatorId = creatorId();
        
        $query = PosItem::where('created_by', $creatorId)
            ->whereHas('sale', function($q) use ($date, $warehouseId) {
                $q->whereDate('pos_date', $date);
                if ($warehouseId) {
                    $q->where('warehouse_id', $warehouseId);
                }
            });
        
        return $query->sum('total_amount');
    }
}

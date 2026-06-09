# Daily Financial Report - Improvements for Department & Branch Tracking

## 🎯 GOAL
Improve the Daily Financial Report to accurately trace ALL sales from ALL departments based on branches, providing better visibility and accountability.

---

## 📊 CURRENT STATE ANALYSIS

### **What's Working:**
✅ Basic branch filtering (warehouse_id filter)
✅ Department categorization by product categories
✅ Payment method breakdown per department

### **What's Missing:**
❌ No comprehensive view showing all branches side-by-side
❌ Department sales not always visible if category doesn't match keywords
❌ No "Other Sales" visibility to catch uncategorized items
❌ No transaction count per department
❌ No salesperson/waiter tracking per department
❌ No comparison with previous periods
❌ Limited audit trail for sales tracking

---

## 🚀 RECOMMENDED IMPROVEMENTS

### **PRIORITY 1: Better Department Coverage & Visibility**

#### **Problem 1: Missing Sales Due to Category Mismatch**

**Current Issue:**
```php
// If a product category doesn't contain specific keywords, it goes to "SERVICES AND OTHERS"
// This makes it hard to identify which sales are being missed

$barSales = (clone $baseQuery)
    ->whereHas('items.product', function($q) {
        $q->whereHas('category', function($cat) {
            $cat->where('name', 'LIKE', '%Bar%')
                ->orWhere('name', 'LIKE', '%Drink%')
                ->orWhere('name', 'LIKE', '%Alcohol%');
        });
    })
```

**Solution:**
Add a **detailed breakdown** of "SERVICES AND OTHERS" showing actual category names:

```php
// In Controller: Add new method
private function getUncategorizedSalesBreakdown($baseQuery)
{
    $uncategorizedSales = (clone $baseQuery)
        ->with(['items.product.category'])
        ->get();
    
    $breakdown = [];
    
    foreach ($uncategorizedSales as $sale) {
        foreach ($sale->items as $item) {
            $categoryName = $item->product->category->name ?? 'Uncategorized';
            
            if (!$this->isDepartmentCategory($categoryName)) {
                if (!isset($breakdown[$categoryName])) {
                    $breakdown[$categoryName] = [
                        'quantity' => 0,
                        'amount' => 0,
                        'count' => 0
                    ];
                }
                
                $breakdown[$categoryName]['quantity'] += $item->quantity;
                $breakdown[$categoryName]['amount'] += $item->total_amount;
                $breakdown[$categoryName]['count']++;
            }
        }
    }
    
    return $breakdown;
}

private function isDepartmentCategory($categoryName)
{
    $keywords = [
        'Restaurant', 'Food', 'Beverage', 'Bar', 'Drink', 'Alcohol',
        'Coffee', 'Cafe', 'Hall', 'Event', 'Salle', 'Spa', 'Massage',
        'Sauna', 'Facility', 'Pool', 'Swimming', 'Clothes', 'Gym',
        'Fitness', 'Billiard', 'Snooker'
    ];
    
    foreach ($keywords as $keyword) {
        if (stripos($categoryName, $keyword) !== false) {
            return true;
        }
    }
    
    return false;
}
```

---

#### **Problem 2: No Transaction Count Per Department**

**Current Issue:**
Report shows revenue but not number of transactions, making it hard to identify sales patterns.

**Solution:**
Add transaction counts to each department:

```php
// Modify groupSalesByPaymentMethod to include counts
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
        // ADD THESE:
        'transaction_count' => 0,
        'average_transaction' => 0,
        'items_sold' => 0,
    ];
    
    $transactionIds = [];
    
    foreach ($sales as $sale) {
        $transactionIds[$sale->id] = true;
        
        if ($sale->payment) {
            $amount = $sale->payment->discount_amount;
            $result['total'] += $amount;
            // ... existing payment logic ...
        }
    }
    
    $result['transaction_count'] = count($transactionIds);
    $result['average_transaction'] = $result['transaction_count'] > 0 
        ? $result['total'] / $result['transaction_count'] 
        : 0;
    
    return $result;
}
```

**Frontend Update:**
```tsx
// Add to report display
<tr className="border-b bg-gray-50">
    <td className="px-3 py-1"></td>
    <td className="px-3 py-1 text-sm">Transactions</td>
    <td className="px-3 py-1 text-right text-sm">{data.transaction_count}</td>
</tr>
<tr className="border-b bg-gray-50">
    <td className="px-3 py-1"></td>
    <td className="px-3 py-1 text-sm">Avg per Transaction</td>
    <td className="px-3 py-1 text-right text-sm">{formatCurrency(data.average_transaction)}</td>
</tr>
```

---

### **PRIORITY 2: Multi-Branch Comparison View**

#### **Problem 3: Can Only View One Branch at a Time**

**Current Issue:**
Users must manually select each branch and compare numbers mentally.

**Solution:**
Add a **"Compare All Branches"** view mode:

```php
// In Controller: Add new method
public function dailyFinancialComparison(Request $request)
{
    if(Auth::user()->can('manage-pos-reports')){
        $creatorId = creatorId();
        $date = $request->get('date', now()->toDateString());
        
        // Get all active warehouses
        $warehouses = Warehouse::where('created_by', $creatorId)
            ->where('is_active', true)
            ->get();
        
        $comparisonData = [];
        
        foreach ($warehouses as $warehouse) {
            $comparisonData[$warehouse->id] = [
                'warehouse_name' => $warehouse->name,
                'warehouse_location' => $warehouse->city,
                'departments' => $this->getDepartmentSalesForWarehouse($warehouse->id, $date),
                'totals' => $this->getTotalsForWarehouse($warehouse->id, $date),
            ];
        }
        
        // Calculate grand totals across all branches
        $grandTotals = $this->calculateGrandTotals($comparisonData);
        
        return Inertia::render('Pos/Reports/DailyFinancialComparison', [
            'date' => $date,
            'comparisonData' => $comparisonData,
            'grandTotals' => $grandTotals,
            'warehouses' => $warehouses,
        ]);
    }
}

private function getDepartmentSalesForWarehouse($warehouseId, $date)
{
    $baseQuery = Pos::where('created_by', creatorId())
        ->where('warehouse_id', $warehouseId)
        ->whereDate('pos_date', $date);
    
    return [
        'RESTAURANT' => $this->getRestaurantSales($baseQuery),
        'BAR' => $this->getBarSales($baseQuery),
        'COFFEE_SHOP' => $this->getCoffeeSales($baseQuery),
        // ... other departments
    ];
}
```

**New Route:**
```php
// In web.php
Route::get('/daily-financial-comparison', [PosReportController::class, 'dailyFinancialComparison'])
    ->name('daily-financial-comparison');
```

**Frontend Component:**
```tsx
// DailyFinancialComparison.tsx
export default function DailyFinancialComparison() {
    return (
        <div className="overflow-x-auto">
            <table className="w-full border-collapse">
                <thead>
                    <tr>
                        <th>Department</th>
                        {warehouses.map(w => (
                            <th key={w.id}>{w.name}</th>
                        ))}
                        <th>Total</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>Restaurant Sales</td>
                        {comparisonData.map((branch, idx) => (
                            <td key={idx}>{formatCurrency(branch.departments.RESTAURANT.total)}</td>
                        ))}
                        <td>{formatCurrency(grandTotals.restaurant)}</td>
                    </tr>
                    {/* Repeat for each department */}
                </tbody>
            </table>
        </div>
    );
}
```

---

### **PRIORITY 3: Enhanced Audit Trail & Accountability**

#### **Problem 4: No Waiter/Salesperson Tracking**

**Current Issue:**
Can't identify who made the sales at each department.

**Solution:**
Add waiter/salesperson breakdown per department:

```php
// In Controller: Add waiter tracking
private function getWaiterSalesBreakdown($sales)
{
    $waiterSales = [];
    
    foreach ($sales as $sale) {
        $waiter = $sale->waiter_name ?? 'Unknown';
        
        if (!isset($waiterSales[$waiter])) {
            $waiterSales[$waiter] = [
                'name' => $waiter,
                'transactions' => 0,
                'total_sales' => 0,
                'cash' => 0,
                'card' => 0,
                'credit' => 0,
            ];
        }
        
        $waiterSales[$waiter]['transactions']++;
        $amount = $sale->payment->discount_amount ?? 0;
        $waiterSales[$waiter]['total_sales'] += $amount;
        
        // Breakdown by payment method
        if ($sale->charged_to_room) {
            $waiterSales[$waiter]['credit'] += $amount;
        } elseif ($sale->bank_account_id) {
            $waiterSales[$waiter]['card'] += $amount;
        } else {
            $waiterSales[$waiter]['cash'] += $amount;
        }
    }
    
    return $waiterSales;
}
```

**Add to Report:**
```tsx
// Expandable section per department
<tr className="border-b cursor-pointer" onClick={() => toggleDepartmentDetail('RESTAURANT')}>
    <td colSpan={2} className="px-3 py-1 font-semibold bg-gray-50">
        RESTAURANT SALES {showDetail.RESTAURANT ? '▼' : '▶'}
    </td>
    <td className="px-3 py-1 text-right">{formatCurrency(data.total)}</td>
</tr>

{showDetail.RESTAURANT && (
    <>
        {/* Waiter Breakdown */}
        <tr className="bg-blue-50">
            <td colSpan={3} className="px-6 py-2 font-semibold">Sales by Waiter:</td>
        </tr>
        {data.waiterBreakdown.map(waiter => (
            <tr key={waiter.name} className="border-b">
                <td className="px-6 py-1"></td>
                <td className="px-6 py-1">{waiter.name} ({waiter.transactions} trans.)</td>
                <td className="px-6 py-1 text-right">{formatCurrency(waiter.total_sales)}</td>
            </tr>
        ))}
    </>
)}
```

---

### **PRIORITY 4: Time-Based Analysis**

#### **Problem 5: No Historical Comparison**

**Current Issue:**
No way to see if sales are up or down compared to previous periods.

**Solution:**
Add comparison metrics:

```php
// In Controller: Add comparison data
public function dailyFinancial(Request $request)
{
    // ... existing code ...
    
    // Add comparison with previous day
    $previousDate = Carbon::parse($date)->subDay()->toDateString();
    $previousDaySales = $this->getTotalSalesForDate($previousDate, $warehouseId);
    
    // Add comparison with same day last week
    $lastWeekDate = Carbon::parse($date)->subDays(7)->toDateString();
    $lastWeekSales = $this->getTotalSalesForDate($lastWeekDate, $warehouseId);
    
    // Add comparison with same day last month
    $lastMonthDate = Carbon::parse($date)->subMonth()->toDateString();
    $lastMonthSales = $this->getTotalSalesForDate($lastMonthDate, $warehouseId);
    
    return Inertia::render('Pos/Reports/DailyFinancial', [
        // ... existing props ...
        'comparisons' => [
            'previous_day' => [
                'date' => $previousDate,
                'sales' => $previousDaySales,
                'difference' => $totalSales - $previousDaySales,
                'percentage' => $previousDaySales > 0 ? (($totalSales - $previousDaySales) / $previousDaySales * 100) : 0,
            ],
            'last_week' => [
                'date' => $lastWeekDate,
                'sales' => $lastWeekSales,
                'difference' => $totalSales - $lastWeekSales,
                'percentage' => $lastWeekSales > 0 ? (($totalSales - $lastWeekSales) / $lastWeekSales * 100) : 0,
            ],
            'last_month' => [
                'date' => $lastMonthDate,
                'sales' => $lastMonthSales,
                'difference' => $totalSales - $lastMonthSales,
                'percentage' => $lastMonthSales > 0 ? (($totalSales - $lastMonthSales) / $lastMonthSales * 100) : 0,
            ],
        ],
    ]);
}
```

**Frontend Display:**
```tsx
// Add comparison cards at the top
<div className="grid grid-cols-3 gap-4 mb-6">
    <Card>
        <CardContent className="p-4">
            <p className="text-sm text-gray-600">vs Previous Day</p>
            <p className={`text-2xl font-bold ${comparisons.previous_day.difference >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {comparisons.previous_day.difference >= 0 ? '+' : ''}{formatCurrency(comparisons.previous_day.difference)}
            </p>
            <p className="text-sm text-gray-500">
                {comparisons.previous_day.percentage.toFixed(1)}%
            </p>
        </CardContent>
    </Card>
    {/* Repeat for last week and last month */}
</div>
```

---

### **PRIORITY 5: Department-Specific Insights**

#### **Problem 6: No Top Products/Items Per Department**

**Current Issue:**
Can't identify best-selling items within each department.

**Solution:**
Add top products per department:

```php
// In Controller: Add top products tracking
private function getTopProductsByDepartment($sales, $limit = 5)
{
    $productSales = [];
    
    foreach ($sales as $sale) {
        foreach ($sale->items as $item) {
            $productId = $item->product_id;
            $productName = $item->product->name ?? 'Unknown';
            
            if (!isset($productSales[$productId])) {
                $productSales[$productId] = [
                    'name' => $productName,
                    'sku' => $item->product->sku ?? '',
                    'quantity' => 0,
                    'revenue' => 0,
                    'transactions' => 0,
                ];
            }
            
            $productSales[$productId]['quantity'] += $item->quantity;
            $productSales[$productId]['revenue'] += $item->total_amount;
            $productSales[$productId]['transactions']++;
        }
    }
    
    // Sort by revenue
    usort($productSales, function($a, $b) {
        return $b['revenue'] <=> $a['revenue'];
    });
    
    return array_slice($productSales, 0, $limit);
}
```

**Add to each department in return data:**
```php
$salesByDepartment['RESTAURANT SALES'] = [
    ...$this->groupSalesByPaymentMethod($restaurantSales),
    'top_products' => $this->getTopProductsByDepartment($restaurantSales, 5),
    'waiter_breakdown' => $this->getWaiterSalesBreakdown($restaurantSales),
];
```

---

### **PRIORITY 6: Export & Sharing Capabilities**

#### **Problem 7: Limited Export Options**

**Current Issue:**
Only PDF export, no Excel or detailed breakdowns.

**Solution:**
Add multiple export formats:

```php
// In Controller: Add export methods
public function exportDailyFinancialExcel(Request $request)
{
    $date = $request->get('date', now()->toDateString());
    $warehouseId = $request->get('warehouse_id');
    
    // Get all report data
    $data = $this->getDailyFinancialData($date, $warehouseId);
    
    return Excel::download(
        new DailyFinancialExport($data), 
        "daily-financial-{$date}.xlsx"
    );
}

public function exportDailyFinancialDetailed(Request $request)
{
    // Export with line-by-line transaction details
    $date = $request->get('date', now()->toDateString());
    $warehouseId = $request->get('warehouse_id');
    
    $transactions = Pos::where('created_by', creatorId())
        ->whereDate('pos_date', $date)
        ->when($warehouseId, fn($q) => $q->where('warehouse_id', $warehouseId))
        ->with(['items.product.category', 'payment', 'customer', 'warehouse'])
        ->get();
    
    return Excel::download(
        new DetailedTransactionsExport($transactions), 
        "detailed-transactions-{$date}.xlsx"
    );
}
```

**Add export buttons:**
```tsx
<Button onClick={() => router.get(route('pos.reports.daily-financial.export-excel'), { date, warehouse_id })}>
    <FileSpreadsheet className="h-4 w-4 mr-2" />
    Export Excel
</Button>
<Button onClick={() => router.get(route('pos.reports.daily-financial.export-detailed'), { date, warehouse_id })}>
    <FileText className="h-4 w-4 mr-2" />
    Detailed Report
</Button>
```

---

### **PRIORITY 7: Real-Time Dashboard View**

#### **Problem 8: Must Refresh to See New Sales**

**Current Issue:**
Static report, no real-time updates during the day.

**Solution:**
Add real-time updates using Laravel Echo/Pusher:

```php
// In POS sale creation, broadcast event
use Illuminate\Broadcasting\Channel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;

class SaleCreated implements ShouldBroadcast
{
    public function __construct(public Pos $sale)
    {
    }

    public function broadcastOn()
    {
        return new Channel('sales.' . $this->sale->created_by);
    }
}

// In POS controller
event(new SaleCreated($pos));
```

**Frontend listener:**
```tsx
// DailyFinancial.tsx
useEffect(() => {
    window.Echo.channel(`sales.${creatorId}`)
        .listen('SaleCreated', (e) => {
            // Refresh data or update incrementally
            router.reload({ only: ['salesByDepartment', 'totals'] });
        });
    
    return () => {
        window.Echo.leave(`sales.${creatorId}`);
    };
}, []);
```

---

## 📋 SUMMARY OF IMPROVEMENTS

| Priority | Improvement | Impact | Effort |
|----------|-------------|--------|--------|
| 🔴 P1 | Add transaction counts & averages | High | Low |
| 🔴 P1 | Show uncategorized sales breakdown | High | Medium |
| 🟡 P2 | Multi-branch comparison view | High | High |
| 🟡 P2 | Top products per department | Medium | Medium |
| 🟢 P3 | Waiter/salesperson tracking | Medium | Medium |
| 🟢 P3 | Historical comparisons | Medium | Low |
| 🔵 P4 | Excel & detailed exports | Medium | Medium |
| 🔵 P4 | Real-time dashboard updates | Low | High |

---

## 🎯 IMPLEMENTATION ROADMAP

### **Phase 1: Quick Wins (1-2 days)**
1. ✅ Add transaction counts and averages
2. ✅ Add uncategorized sales breakdown
3. ✅ Add historical comparison metrics
4. ✅ Add waiter breakdown (data already exists)

### **Phase 2: Enhanced Reporting (3-5 days)**
1. ✅ Create multi-branch comparison view
2. ✅ Add top products per department
3. ✅ Add Excel export functionality
4. ✅ Create detailed transaction export

### **Phase 3: Advanced Features (1 week)**
1. ✅ Implement real-time updates
2. ✅ Add performance analytics
3. ✅ Create automated alerts for low sales
4. ✅ Build dashboard widgets

---

## 💡 ADDITIONAL RECOMMENDATIONS

### **1. Add Sales Target Tracking**
```php
// Create targets table
Schema::create('sales_targets', function (Blueprint $table) {
    $table->id();
    $table->foreignId('warehouse_id');
    $table->string('department');
    $table->date('target_date');
    $table->decimal('target_amount', 10, 2);
    $table->decimal('actual_amount', 10, 2)->default(0);
    $table->timestamps();
});

// Show target vs actual in report
'target_status' => [
    'restaurant' => [
        'target' => 1000000,
        'actual' => 920800,
        'percentage' => 92.08,
        'variance' => -79200,
    ],
]
```

### **2. Add Sales Velocity Tracking**
```php
// Track hourly sales patterns
private function getHourlySalesPattern($date, $warehouseId)
{
    return Pos::where('created_by', creatorId())
        ->whereDate('pos_date', $date)
        ->when($warehouseId, fn($q) => $q->where('warehouse_id', $warehouseId))
        ->selectRaw('HOUR(created_at) as hour, SUM(total_amount) as sales, COUNT(*) as transactions')
        ->groupBy('hour')
        ->get();
}
```

### **3. Add Department Performance Ranking**
```php
// Rank departments by performance
'department_rankings' => [
    1 => ['name' => 'Restaurant', 'sales' => 920800, 'growth' => '+15.2%'],
    2 => ['name' => 'Bar', 'sales' => 450600, 'growth' => '+8.3%'],
    3 => ['name' => 'Coffee Shop', 'sales' => 123400, 'growth' => '-2.1%'],
]
```

---

## 🚀 QUICK START: Implement Transaction Counts (15 minutes)

Here's the fastest improvement you can make right now:

```php
// In PosReportController.php, update groupSalesByPaymentMethod():
private function groupSalesByPaymentMethod($sales)
{
    $result = [
        // ... existing fields ...
        'transaction_count' => $sales->count(), // ADD THIS
    ];
    
    // ... rest of method ...
    
    return $result;
}
```

```tsx
// In DailyFinancial.tsx, after each department total:
{data.total > 0 && (
    <tr className="border-b bg-gray-50">
        <td className="px-3 py-1"></td>
        <td className="px-3 py-1 text-sm italic">
            {data.transaction_count} transactions (Avg: {formatCurrency(data.total / data.transaction_count)})
        </td>
        <td className="px-3 py-1 text-right"></td>
    </tr>
)}
```

---

Would you like me to implement any of these improvements? I recommend starting with **Phase 1** (Quick Wins) as they provide immediate value with minimal effort.

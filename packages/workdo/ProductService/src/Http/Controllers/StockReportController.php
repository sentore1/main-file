<?php

namespace Workdo\ProductService\Http\Controllers;

use App\Models\Warehouse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Workdo\ProductService\Models\ProductServiceItem;
use Workdo\ProductService\Models\ProductServiceCategory;
use Workdo\ProductService\Models\StockReport;

class StockReportController extends Controller
{
    public function listReports()
    {
        if (Auth::user()->can('manage-stock-report')) {
            // Get all unique report dates and types
            $reports = StockReport::select('report_date', 'report_type')
                ->where('created_by', creatorId())
                ->groupBy('report_date', 'report_type')
                ->orderBy('report_date', 'desc')
                ->orderBy('report_type')
                ->get()
                ->map(function($report) {
                    $itemsCount = StockReport::where('created_by', creatorId())
                        ->where('report_date', $report->report_date)
                        ->where('report_type', $report->report_type)
                        ->count();
                    
                    $totalQty = StockReport::where('created_by', creatorId())
                        ->where('report_date', $report->report_date)
                        ->where('report_type', $report->report_type)
                        ->sum('quantity');
                    
                    // Calculate total value dynamically from product prices
                    $reportsWithProducts = StockReport::with('product')
                        ->where('created_by', creatorId())
                        ->where('report_date', $report->report_date)
                        ->where('report_type', $report->report_type)
                        ->get();
                    
                    $totalValue = $reportsWithProducts->sum(function($item) {
                        return $item->quantity * ($item->product->purchase_price ?? 0);
                    });
                    
                    return [
                        'date' => $report->report_date->format('Y-m-d'),
                        'type' => $report->report_type,
                        'items_count' => $itemsCount,
                        'total_quantity' => $totalQty,
                        'total_value' => $totalValue,
                        'view_url' => route('product-service.stock-reports.show', [
                            'date' => $report->report_date->format('Y-m-d'),
                            'type' => $report->report_type
                        ]),
                        'print_url' => route('product-service.stock-reports.print', [
                            'date' => $report->report_date->format('Y-m-d'),
                            'type' => $report->report_type
                        ]),
                    ];
                });

            return response()->json([
                'success' => true,
                'reports' => $reports
            ]);
        }
        return response()->json(['error' => 'Permission denied'], 403);
    }

    public function index(Request $request)
    {
        if (Auth::user()->can('manage-stock-report')) {
            // Get unique report combinations (date + type) with aggregated data
            $query = StockReport::select('report_date', 'report_type', 'warehouse_id')
                ->where('created_by', creatorId())
                ->groupBy('report_date', 'report_type', 'warehouse_id')
                ->orderBy('report_date', 'desc')
                ->orderBy('report_type');

            // Apply filters if provided
            if ($request->filled('report_date')) {
                $query->whereDate('report_date', $request->report_date);
            }
            if ($request->filled('report_type')) {
                $query->where('report_type', $request->report_type);
            }
            if ($request->filled('warehouse_id')) {
                $query->where('warehouse_id', $request->warehouse_id);
            }

            $perPage = $request->get('per_page', 10);
            $reports = $query->paginate($perPage);

            // Transform the paginated data to include additional info
            $reports->getCollection()->transform(function($report) {
                $itemsCount = StockReport::where('created_by', creatorId())
                    ->whereDate('report_date', $report->report_date)
                    ->where('report_type', $report->report_type)
                    ->where(function($q) use ($report) {
                        if ($report->warehouse_id) {
                            $q->where('warehouse_id', $report->warehouse_id);
                        } else {
                            $q->whereNull('warehouse_id');
                        }
                    })
                    ->count();
                
                $totalQty = StockReport::where('created_by', creatorId())
                    ->whereDate('report_date', $report->report_date)
                    ->where('report_type', $report->report_type)
                    ->where(function($q) use ($report) {
                        if ($report->warehouse_id) {
                            $q->where('warehouse_id', $report->warehouse_id);
                        } else {
                            $q->whereNull('warehouse_id');
                        }
                    })
                    ->sum('quantity');
                
                // Calculate total value dynamically from product prices
                $reportsWithProducts = StockReport::with('product')
                    ->where('created_by', creatorId())
                    ->whereDate('report_date', $report->report_date)
                    ->where('report_type', $report->report_type)
                    ->where(function($q) use ($report) {
                        if ($report->warehouse_id) {
                            $q->where('warehouse_id', $report->warehouse_id);
                        } else {
                            $q->whereNull('warehouse_id');
                        }
                    })
                    ->get();
                
                $totalValue = $reportsWithProducts->sum(function($item) {
                    return $item->quantity * ($item->product->purchase_price ?? 0);
                });
                
                // Get first report to access relationships
                $firstReport = StockReport::with(['warehouse', 'recordedBy'])
                    ->where('created_by', creatorId())
                    ->whereDate('report_date', $report->report_date)
                    ->where('report_type', $report->report_type)
                    ->where(function($q) use ($report) {
                        if ($report->warehouse_id) {
                            $q->where('warehouse_id', $report->warehouse_id);
                        } else {
                            $q->whereNull('warehouse_id');
                        }
                    })
                    ->first();

                return [
                    'id' => $firstReport->id ?? null,
                    'report_date' => $report->report_date->format('Y-m-d'),
                    'report_type' => $report->report_type,
                    'items_count' => $itemsCount,
                    'total_quantity' => $totalQty,
                    'total_value' => $totalValue,
                    'warehouse' => $firstReport->warehouse ?? null,
                    'recorded_by' => $firstReport->recordedBy ?? null,
                ];
            });

            $warehouses = Warehouse::where('created_by', creatorId())->get(['id', 'name']);

            return Inertia::render('ProductService/StockReports/Index', [
                'reports' => $reports,
                'warehouses' => $warehouses,
            ]);
        }
        return back()->with('error', __('Permission denied'));
    }

    public function create()
    {
        if (Auth::user()->can('create-stock-report')) {
            $categories = ProductServiceCategory::where('created_by', creatorId())
                ->with(['items' => function($q) {
                    $q->where('type', '!=', 'service')
                      ->with(['warehouseStocks', 'category'])
                      ->select('id', 'name', 'sku', 'category_id');
                }])
                ->get(['id', 'name']);

            $warehouses = Warehouse::where('created_by', creatorId())->where('is_active', true)->get(['id', 'name']);

            \Log::info('Stock Report Create - Data being sent:', [
                'categories_count' => $categories->count(),
                'warehouses_count' => $warehouses->count(),
                'categories' => $categories->toArray(),
                'warehouses' => $warehouses->toArray(),
            ]);

            return Inertia::render('ProductService/StockReports/Create', [
                'categories' => $categories->toArray(),
                'warehouses' => $warehouses->toArray(),
            ]);
        }
        return redirect()->route('product-service.stock-reports.index')->with('error', __('Permission denied'));
    }

    public function store(Request $request)
    {
        if (Auth::user()->can('create-stock-report')) {
            $validated = $request->validate([
                'report_date' => 'required|date',
                'report_type' => 'required|in:opening,closing,received',
                'warehouse_id' => 'nullable|exists:warehouses,id',
                'items' => 'required|array|min:1',
                'items.*.product_id' => 'required|exists:product_service_items,id',
                'items.*.quantity' => 'required|numeric|min:0',
                'notes' => 'nullable|string',
            ]);

            DB::beginTransaction();
            try {
                foreach ($validated['items'] as $item) {
                    StockReport::create([
                        'report_date' => $validated['report_date'],
                        'report_type' => $validated['report_type'],
                        'product_id' => $item['product_id'],
                        'warehouse_id' => $validated['warehouse_id'] ?? null,
                        'quantity' => $item['quantity'],
                        'notes' => $validated['notes'] ?? null,
                        'recorded_by' => Auth::id(),
                        'created_by' => creatorId(),
                    ]);
                }

                DB::commit();
                return redirect()->route('product-service.stock-reports.index')
                    ->with('success', __('Stock report created successfully.'));
            } catch (\Exception $e) {
                DB::rollBack();
                return back()->with('error', __('Failed to create stock report.'));
            }
        }
        return redirect()->route('product-service.stock-reports.index')->with('error', __('Permission denied'));
    }

    public function show($date, $type)
    {
        if (Auth::user()->can('view-stock-report')) {
            $reports = StockReport::with(['product.category', 'warehouse'])
                ->where('created_by', creatorId())
                ->whereDate('report_date', $date)
                ->where('report_type', $type)
                ->get()
                ->groupBy('product.category.name');

            $reportData = [
                'date' => $date,
                'type' => $type,
                'categories' => $reports->map(function ($items, $categoryName) {
                    return [
                        'name' => $categoryName ?: 'Uncategorized',
                        'items' => $items->map(function ($report) {
                            $unitValue = $report->product->purchase_price ?? 0;
                            $totalValue = $report->quantity * $unitValue;
                            return [
                                'product_name' => $report->product->name,
                                'sku' => $report->product->sku,
                                'warehouse' => $report->warehouse?->name,
                                'quantity' => $report->quantity,
                                'unit_value' => $unitValue,
                                'total_value' => $totalValue,
                            ];
                        }),
                        'total_quantity' => $items->sum('quantity'),
                        'total_value' => $items->sum(function($item) {
                            return $item->quantity * ($item->product->purchase_price ?? 0);
                        }),
                        'total_quantity' => $items->sum('quantity'),
                        'total_value' => $items->sum('total_value'),
                    ];
                }),
            ];

            return Inertia::render('ProductService/StockReports/Show', [
                'reportData' => $reportData,
            ]);
        }
        return back()->with('error', __('Permission denied'));
    }

    public function print($date, $type)
    {
        if (Auth::user()->can('view-stock-report')) {
            $reports = StockReport::with(['product.category', 'warehouse', 'recordedBy'])
                ->where('created_by', creatorId())
                ->whereDate('report_date', $date)
                ->where('report_type', $type)
                ->get()
                ->groupBy('product.category.name');

            return Inertia::render('ProductService/StockReports/Print', [
                'date' => $date,
                'type' => $type,
                'categories' => $reports,
            ]);
        }
        return back()->with('error', __('Permission denied'));
    }

    public function destroy($id)
    {
        if (Auth::user()->can('delete-stock-report')) {
            $report = StockReport::findOrFail($id);
            $report->delete();
            return back()->with('success', __('Stock report deleted successfully.'));
        }
        return back()->with('error', __('Permission denied'));
    }

    /**
     * Show comprehensive stock report with opening, received, and closing stock
     */
    public function comprehensive(Request $request)
    {
        if (Auth::user()->can('view-stock-report')) {
            $validated = $request->validate([
                'start_date' => 'required|date',
                'end_date' => 'required|date|after_or_equal:start_date',
                'warehouse_id' => 'nullable|exists:warehouses,id',
            ]);

            $startDate = $validated['start_date'];
            $endDate = $validated['end_date'];
            $warehouseId = $validated['warehouse_id'] ?? null;

            // Get all products
            $products = ProductServiceItem::where('type', '!=', 'service')
                ->where('created_by', creatorId())
                ->with('category')
                ->get();

            $reportData = [];

            foreach ($products as $product) {
                // Get opening stock (closing stock from day before start date)
                $openingStock = StockReport::where('created_by', creatorId())
                    ->where('product_id', $product->id)
                    ->where('report_type', 'closing')
                    ->whereDate('report_date', '<', $startDate)
                    ->when($warehouseId, fn($q) => $q->where('warehouse_id', $warehouseId))
                    ->orderBy('report_date', 'desc')
                    ->first();

                // Get received stock during the period
                $receivedStock = StockReport::where('created_by', creatorId())
                    ->where('product_id', $product->id)
                    ->where('report_type', 'received')
                    ->whereBetween('report_date', [$startDate, $endDate])
                    ->when($warehouseId, fn($q) => $q->where('warehouse_id', $warehouseId))
                    ->sum('quantity');

                // Get closing stock
                $closingStock = StockReport::where('created_by', creatorId())
                    ->where('product_id', $product->id)
                    ->where('report_type', 'closing')
                    ->whereDate('report_date', $endDate)
                    ->when($warehouseId, fn($q) => $q->where('warehouse_id', $warehouseId))
                    ->first();

                // Calculate quantities
                $opening = $openingStock ? $openingStock->quantity : 0;
                $closing = $closingStock ? $closingStock->quantity : 0;
                $issued = $opening + $receivedStock - $closing;
                
                // Calculate values using product purchase price
                $unitPrice = $product->purchase_price ?? 0;
                $openingValue = $opening * $unitPrice;
                $receivedValue = $receivedStock * $unitPrice;
                $closingValue = $closing * $unitPrice;
                $issuedValue = $issued * $unitPrice;

                $reportData[] = [
                    'product_id' => $product->id,
                    'product_name' => $product->name,
                    'sku' => $product->sku,
                    'category' => $product->category?->name ?? 'Uncategorized',
                    'opening_stock' => $opening,
                    'opening_stock_value' => $openingValue,
                    'received_stock' => $receivedStock,
                    'received_stock_value' => $receivedValue,
                    'issued_stock' => $issued,
                    'issued_stock_value' => $issuedValue,
                    'closing_stock' => $closing,
                    'closing_stock_value' => $closingValue,
                ];
            }

            // Group by category
            $groupedData = collect($reportData)->groupBy('category');

            $warehouse = $warehouseId ? Warehouse::find($warehouseId) : null;

            return Inertia::render('ProductService/StockReports/Comprehensive', [
                'reportData' => $groupedData,
                'startDate' => $startDate,
                'endDate' => $endDate,
                'warehouse' => $warehouse,
                'warehouses' => Warehouse::where('created_by', creatorId())->get(['id', 'name']),
            ]);
        }
        return back()->with('error', __('Permission denied'));
    }
}

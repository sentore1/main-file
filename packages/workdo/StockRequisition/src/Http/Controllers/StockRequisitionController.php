<?php

namespace Workdo\StockRequisition\Http\Controllers;

use App\Http\Controllers\Controller;
use Workdo\StockRequisition\Models\StockRequisition;
use Workdo\StockRequisition\Models\StockRequisitionItem;
use Workdo\StockRequisition\Http\Requests\StoreStockRequisitionRequest;
use Workdo\StockRequisition\Http\Requests\UpdateStockRequisitionRequest;
use App\Models\User;
use App\Models\Warehouse;
use Workdo\ProductService\Models\ProductServiceItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Workdo\StockRequisition\Events\CreateStockRequisition;
use Workdo\StockRequisition\Events\ApproveStockRequisition;
use Workdo\StockRequisition\Events\RejectStockRequisition;
use Workdo\StockRequisition\Events\FulfillStockRequisition;

class StockRequisitionController extends Controller
{
    public function index(Request $request)
    {
        if (Auth::user()->can('manage-stock-requisitions')) {
            $query = StockRequisition::with(['requestedBy:id,name', 'warehouse:id,name', 'approvedBy:id,name'])
                ->withCount('items')
                ->where('created_by', creatorId());

            // Apply filters
            if ($request->filled('search')) {
                $search = $request->get('search');
                $query->where(function($q) use ($search) {
                    $q->where('requisition_number', 'like', "%{$search}%")
                      ->orWhere('department', 'like', "%{$search}%")
                      ->orWhereHas('requestedBy', function($userQuery) use ($search) {
                          $userQuery->where('name', 'like', "%{$search}%");
                      });
                });
            }

            if ($request->filled('status')) {
                $status = $request->get('status');
                if ($status !== 'all') {
                    $query->where('status', $status);
                }
            }

            if ($request->filled('priority')) {
                $query->where('priority', $request->get('priority'));
            }

            if ($request->filled('warehouse')) {
                $query->where('warehouse_id', $request->get('warehouse'));
            }

            $sortField = $request->get('sort', 'created_at');
            $sortDirection = $request->get('direction', 'desc');

            if (in_array($sortField, ['requisition_number', 'requisition_date', 'required_date', 'status', 'priority', 'created_at'])) {
                $query->orderBy($sortField, $sortDirection);
            } else {
                $query->latest();
            }

            $perPage = $request->get('per_page', 10);
            $requisitions = $query->paginate($perPage)->withQueryString();

            $warehouses = Warehouse::where('created_by', creatorId())
                ->select('id', 'name')
                ->get();

            return Inertia::render('StockRequisition/StockRequisitions/Index', [
                'requisitions' => $requisitions,
                'warehouses' => $warehouses,
                'filters' => $request->only(['search', 'status', 'priority', 'warehouse'])
            ]);
        } else {
            return redirect()->back()->with('error', __('Permission denied'));
        }
    }

    public function create()
    {
        if (Auth::user()->can('create-stock-requisitions')) {
            $warehouses = Warehouse::where('created_by', creatorId())
                ->where('is_active', true)
                ->select('id', 'name', 'address')
                ->get();

            return Inertia::render('StockRequisition/StockRequisitions/Create', [
                'warehouses' => $warehouses
            ]);
        } else {
            return redirect()->route('stock-requisitions.index')->with('error', __('Permission denied'));
        }
    }

    public function store(StoreStockRequisitionRequest $request)
    {
        if (Auth::user()->can('create-stock-requisitions')) {
            DB::beginTransaction();
            try {
                $requisition = new StockRequisition();
                $requisition->requisition_date = $request->requisition_date;
                $requisition->required_date = $request->required_date;
                $requisition->requested_by = Auth::id();
                $requisition->warehouse_id = $request->warehouse_id;
                $requisition->department = $request->department;
                $requisition->priority = $request->priority ?? 'normal';
                $requisition->purpose = $request->purpose;
                $requisition->notes = $request->notes;
                $requisition->status = 'pending';
                $requisition->creator_id = Auth::id();
                $requisition->created_by = creatorId();
                $requisition->save();

                // Create requisition items
                foreach ($request->items as $itemData) {
                    $item = new StockRequisitionItem();
                    $item->requisition_id = $requisition->id;
                    $item->product_id = $itemData['product_id'];
                    $item->quantity_requested = $itemData['quantity'];
                    $item->notes = $itemData['notes'] ?? null;
                    $item->creator_id = Auth::id();
                    $item->created_by = creatorId();
                    $item->save();
                }

                try {
                    CreateStockRequisition::dispatch($request, $requisition);
                } catch (\Throwable $th) {
                    \Log::warning('CreateStockRequisition Event Failed', ['error' => $th->getMessage()]);
                }

                DB::commit();

                return redirect()->route('stock-requisitions.index')
                    ->with('success', __('Stock requisition created successfully.'));
            } catch (\Exception $e) {
                DB::rollBack();
                \Log::error('Stock Requisition Creation Failed', ['error' => $e->getMessage()]);
                return back()->with('error', __('Failed to create requisition: ') . $e->getMessage());
            }
        } else {
            return redirect()->route('stock-requisitions.index')->with('error', __('Permission denied'));
        }
    }

    public function show(StockRequisition $stockRequisition, Request $request)
    {
        if (Auth::user()->can('view-stock-requisitions') && $stockRequisition->created_by == creatorId()) {
            $stockRequisition->load([
                'requestedBy:id,name,email',
                'warehouse:id,name,address',
                'approvedBy:id,name',
                'fulfilledBy:id,name',
                'items.product:id,name,sku,unit'
            ]);

            // Handle PDF download
            if ($request->has('download') && $request->get('download') === 'pdf') {
                return $this->generatePDF($stockRequisition);
            }

            $permissions = [
                'canApprove' => Auth::user()->can('approve-stock-requisitions'),
                'canEdit' => Auth::user()->can('edit-stock-requisitions'),
                'canFulfill' => Auth::user()->can('fulfill-stock-requisitions'),
                'canCancel' => Auth::user()->can('cancel-stock-requisitions'),
            ];

            return Inertia::render('StockRequisition/StockRequisitions/View', [
                'requisition' => $stockRequisition,
                'permissions' => $permissions
            ]);
        } else {
            return redirect()->route('stock-requisitions.index')->with('error', __('Permission denied'));
        }
    }

    private function generatePDF(StockRequisition $stockRequisition)
    {
        return Inertia::render('StockRequisition/StockRequisitions/Print', [
            'requisition' => $stockRequisition
        ]);
    }

    public function edit(StockRequisition $stockRequisition)
    {
        if (Auth::user()->can('edit-stock-requisitions') && $stockRequisition->created_by == creatorId()) {
            if (!in_array($stockRequisition->status, ['draft', 'pending'])) {
                return redirect()->route('stock-requisitions.index')
                    ->with('error', __('Cannot edit requisition in current status.'));
            }

            $stockRequisition->load(['items']);
            $warehouses = Warehouse::where('created_by', creatorId())
                ->where('is_active', true)
                ->select('id', 'name', 'address')
                ->get();

            return Inertia::render('StockRequisition/StockRequisitions/Edit', [
                'requisition' => $stockRequisition,
                'warehouses' => $warehouses
            ]);
        } else {
            return redirect()->route('stock-requisitions.index')->with('error', __('Permission denied'));
        }
    }

    public function update(UpdateStockRequisitionRequest $request, StockRequisition $stockRequisition)
    {
        if (Auth::user()->can('edit-stock-requisitions') && $stockRequisition->created_by == creatorId()) {
            if (!in_array($stockRequisition->status, ['draft', 'pending'])) {
                return redirect()->route('stock-requisitions.index')
                    ->with('error', __('Cannot edit requisition in current status.'));
            }

            DB::beginTransaction();
            try {
                $stockRequisition->requisition_date = $request->requisition_date;
                $stockRequisition->required_date = $request->required_date;
                $stockRequisition->warehouse_id = $request->warehouse_id;
                $stockRequisition->department = $request->department;
                $stockRequisition->priority = $request->priority ?? 'normal';
                $stockRequisition->purpose = $request->purpose;
                $stockRequisition->notes = $request->notes;
                $stockRequisition->save();

                // Delete old items and create new ones
                $stockRequisition->items()->delete();
                foreach ($request->items as $itemData) {
                    $item = new StockRequisitionItem();
                    $item->requisition_id = $stockRequisition->id;
                    $item->product_id = $itemData['product_id'];
                    $item->quantity_requested = $itemData['quantity'];
                    $item->notes = $itemData['notes'] ?? null;
                    $item->creator_id = Auth::id();
                    $item->created_by = creatorId();
                    $item->save();
                }

                DB::commit();

                return redirect()->route('stock-requisitions.index')
                    ->with('success', __('Stock requisition updated successfully.'));
            } catch (\Exception $e) {
                DB::rollBack();
                return back()->with('error', __('Failed to update requisition: ') . $e->getMessage());
            }
        } else {
            return redirect()->route('stock-requisitions.index')->with('error', __('Permission denied'));
        }
    }

    public function destroy(StockRequisition $stockRequisition)
    {
        if (Auth::user()->can('delete-stock-requisitions') && $stockRequisition->created_by == creatorId()) {
            if (!in_array($stockRequisition->status, ['draft', 'pending', 'rejected', 'cancelled'])) {
                return back()->with('error', __('Cannot delete requisition in current status.'));
            }

            $stockRequisition->delete();

            return redirect()->route('stock-requisitions.index')
                ->with('success', __('Stock requisition deleted successfully.'));
        } else {
            return redirect()->route('stock-requisitions.index')->with('error', __('Permission denied'));
        }
    }

    public function approve(Request $request, StockRequisition $stockRequisition)
    {
        if (Auth::user()->can('approve-stock-requisitions') && $stockRequisition->created_by == creatorId()) {
            if (!$stockRequisition->canApprove()) {
                return back()->with('error', __('Requisition cannot be approved in current status.'));
            }

            DB::beginTransaction();
            try {
                $stockRequisition->status = 'approved';
                $stockRequisition->approved_by = Auth::id();
                $stockRequisition->approved_at = now();
                $stockRequisition->save();

                // Update approved quantities
                if ($request->has('items')) {
                    foreach ($request->items as $itemData) {
                        $item = StockRequisitionItem::find($itemData['id']);
                        if ($item && $item->requisition_id == $stockRequisition->id) {
                            $item->quantity_approved = $itemData['quantity_approved'];
                            $item->save();
                        }
                    }
                } else {
                    // Auto-approve all requested quantities
                    foreach ($stockRequisition->items as $item) {
                        $item->quantity_approved = $item->quantity_requested;
                        $item->save();
                    }
                }

                try {
                    ApproveStockRequisition::dispatch($stockRequisition);
                } catch (\Throwable $th) {
                    \Log::warning('ApproveStockRequisition Event Failed', ['error' => $th->getMessage()]);
                }

                DB::commit();

                return back()->with('success', __('Stock requisition approved successfully.'));
            } catch (\Exception $e) {
                DB::rollBack();
                return back()->with('error', __('Failed to approve requisition: ') . $e->getMessage());
            }
        } else {
            return back()->with('error', __('Permission denied'));
        }
    }

    public function reject(Request $request, StockRequisition $stockRequisition)
    {
        if (Auth::user()->can('approve-stock-requisitions') && $stockRequisition->created_by == creatorId()) {
            if (!$stockRequisition->canApprove()) {
                return back()->with('error', __('Requisition cannot be rejected in current status.'));
            }

            $request->validate([
                'rejection_reason' => 'required|string|max:500'
            ]);

            $stockRequisition->status = 'rejected';
            $stockRequisition->approved_by = Auth::id();
            $stockRequisition->approved_at = now();
            $stockRequisition->rejection_reason = $request->rejection_reason;
            $stockRequisition->save();

            try {
                RejectStockRequisition::dispatch($stockRequisition);
            } catch (\Throwable $th) {
                \Log::warning('RejectStockRequisition Event Failed', ['error' => $th->getMessage()]);
            }

            return back()->with('success', __('Stock requisition rejected.'));
        } else {
            return back()->with('error', __('Permission denied'));
        }
    }

    public function fulfill(Request $request, StockRequisition $stockRequisition)
    {
        if (Auth::user()->can('fulfill-stock-requisitions') && $stockRequisition->created_by == creatorId()) {
            if (!$stockRequisition->canFulfill()) {
                return back()->with('error', __('Requisition cannot be fulfilled in current status.'));
            }

            DB::beginTransaction();
            try {
                // Update fulfilled quantities
                if ($request->has('items')) {
                    foreach ($request->items as $itemData) {
                        $item = StockRequisitionItem::find($itemData['id']);
                        if ($item && $item->requisition_id == $stockRequisition->id) {
                            $item->quantity_fulfilled = $itemData['quantity_fulfilled'];
                            $item->save();
                        }
                    }
                }

                $stockRequisition->status = 'fulfilled';
                $stockRequisition->fulfilled_by = Auth::id();
                $stockRequisition->fulfilled_at = now();
                $stockRequisition->save();

                try {
                    FulfillStockRequisition::dispatch($stockRequisition);
                } catch (\Throwable $th) {
                    \Log::warning('FulfillStockRequisition Event Failed', ['error' => $th->getMessage()]);
                }

                DB::commit();

                return back()->with('success', __('Stock requisition fulfilled successfully.'));
            } catch (\Exception $e) {
                DB::rollBack();
                return back()->with('error', __('Failed to fulfill requisition: ') . $e->getMessage());
            }
        } else {
            return back()->with('error', __('Permission denied'));
        }
    }

    public function cancel(StockRequisition $stockRequisition)
    {
        if (Auth::user()->can('cancel-stock-requisitions') && $stockRequisition->created_by == creatorId()) {
            if (!$stockRequisition->canCancel()) {
                return back()->with('error', __('Requisition cannot be cancelled in current status.'));
            }

            $stockRequisition->status = 'cancelled';
            $stockRequisition->save();

            return back()->with('success', __('Stock requisition cancelled.'));
        } else {
            return back()->with('error', __('Permission denied'));
        }
    }

    public function getWarehouseProducts(Request $request)
    {
        if (Auth::user()->can('create-stock-requisitions') || Auth::user()->can('edit-stock-requisitions')) {
            $warehouseId = $request->warehouse_id;

            if (!$warehouseId) {
                return response()->json([]);
            }

            $products = ProductServiceItem::select('id', 'name', 'sku', 'unit', 'type')
                ->where('is_active', true)
                ->where('created_by', creatorId())
                ->where('type', '!=', 'service')
                ->with(['warehouseStocks' => function ($q) use ($warehouseId) {
                    $q->where('warehouse_id', $warehouseId);
                }])
                ->get()
                ->map(function ($product) {
                    $stock = $product->warehouseStocks->first();
                    return [
                        'id' => $product->id,
                        'name' => $product->name,
                        'sku' => $product->sku,
                        'unit' => $product->unit,
                        'type' => $product->type,
                        'stock_quantity' => $stock ? $stock->quantity : 0,
                    ];
                });

            return response()->json($products);
        } else {
            return response()->json([], 403);
        }
    }
}

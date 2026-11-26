<?php

namespace Workdo\ProductService\Http\Controllers;

use App\Models\Warehouse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Workdo\ProductService\Events\CreateProductServiceItem;
use Workdo\ProductService\Events\DestroyProductServiceItem;
use Workdo\ProductService\Events\UpdateProductServiceItem;
use Workdo\ProductService\Models\ProductServiceItem;
use Workdo\ProductService\Models\ProductServiceTax;
use Workdo\ProductService\Models\ProductServiceCategory;
use Workdo\ProductService\Models\WarehouseStock;
use Workdo\ProductService\Http\Requests\StoreProductServiceItemRequest;
use Workdo\ProductService\Http\Requests\UpdateProductServiceItemRequest;
use Workdo\ProductService\Models\ProductServiceUnit;

class ProductServiceItemController extends Controller
{
    public function index()
    {
        if(Auth::user()->can('manage-product-service-item')){
            $items = ProductServiceItem::select('id', 'name', 'sku', 'sale_price', 'purchase_price', 'tax_ids', 'category_id', 'unit', 'type', 'image', 'description', 'long_description', 'created_at')
                ->with(['category:id,name', 'unitRelation:id,unit_name', 'warehouseStocks:product_id,quantity'])
                ->where(function($q) {
                    if(Auth::user()->can('manage-any-product-service-item')) {
                        $q->where('created_by', creatorId());
                    } elseif(Auth::user()->can('manage-own-product-service-item')) {
                        $q->where('creator_id', Auth::id());
                    } else {
                        $q->whereRaw('1 = 0');
                    }
                })
                ->when(request('name'), fn($q) => $q->where('name', 'like', '%' . request('name') . '%'))
                ->when(request('type'), fn($q) => $q->where('type', request('type')))
                ->when(request('category_id'), fn($q) => $q->where('category_id', request('category_id')))
                ->when(request('is_active') !== null, fn($q) => $q->where('is_active', request('is_active')))
                ->when(request('sort'), fn($q) => $q->orderBy(request('sort'), request('direction', 'asc')), fn($q) => $q->latest())
                ->paginate(request('per_page', 10))
                ->withQueryString();

            // Add total quantity for each item
            $items->getCollection()->transform(function ($item) {
                $item->total_quantity = $item->warehouseStocks->sum('quantity');
                return $item;
            });

            $categories = ProductServiceCategory::where('created_by', creatorId())->get(['id', 'name']);

            return Inertia::render('ProductService/Items/Index', [
                'items' => $items,
                'categories' => $categories,
            ]);
        }
        return back()->with('error', __('Permission denied'));
    }

    public function create()
    {
        if(Auth::user()->can('create-product-service-item')){
            $taxes = ProductServiceTax::where('created_by', creatorId())->get(['id', 'tax_name', 'rate']);
            $categories = ProductServiceCategory::where('created_by', creatorId())->get(['id', 'name']);
            $units = ProductServiceUnit::where('created_by', creatorId())->get(['id', 'unit_name']);
            $warehouses = Warehouse::where('is_active', true)->where('created_by', creatorId())->get(['id', 'name']);

            return Inertia::render('ProductService/Items/Create', [
                'taxes' => $taxes,
                'categories' => $categories,
                'units' => $units,
                'warehouses' => $warehouses,
            ]);
        }
        return redirect()->route('product-service.items.index')->with('error', __('Permission denied'));
    }

    public function store(StoreProductServiceItemRequest $request)
    {
        if(Auth::user()->can('create-product-service-item')){
            $validated = $request->validated();
            $item = new ProductServiceItem();
            $item->name = $validated['name'];
            $item->sku = $validated['sku'];
            $item->tax_ids = (!empty($validated['tax_ids'])) ? array_map('intval', $validated['tax_ids']) : null;
            $item->category_id = $validated['category_id'] === 'none' ? null : $validated['category_id'];
            $item->description = $validated['description'] ?? null;
            $item->long_description = $validated['long_description'] ?? null;
            $item->sale_price = $validated['sale_price'];
            $item->purchase_price = $validated['purchase_price'];
            $item->unit = $validated['unit'] === 'none' ? null : $validated['unit'];
            $item->type = $validated['type'];
            $item->creator_id = Auth::id();
            $item->created_by = creatorId();

            // Handle image path from media library
            if (!empty($validated['image'])) {
                $item->image = basename($validated['image']);
            }

            // Handle multiple images
            if (!empty($validated['images'])) {
                $imageNames = array_map('basename', $validated['images']);
                $item->images = json_encode($imageNames);
            }

            $item->save();

            // Create warehouse stock entry if warehouse and quantity are provided
            if (isset($validated['warehouse_id']) && $validated['warehouse_id'] !== 'none' && isset($validated['quantity'])) {
                WarehouseStock::create([
                    'product_id' => $item->id,
                    'warehouse_id' => $validated['warehouse_id'],
                    'quantity' => $validated['quantity'] ?? 0,
                ]);
            }

            // Dispatch event for packages to handle their fields
            CreateProductServiceItem::dispatch($request, $item);

            event(new \App\Events\CustomFieldSaved($item, $request->custom_fields ?? [], 'created'));


            return redirect()->route('product-service.items.index')->with('success', __('The item has been created successfully.'));
        }
        return redirect()->route('product-service.items.index')->with('error', __('Permission denied'));
    }

    /**
     * Return taxes, categories and units for the quick-add modal.
     * GET /product-service/items/meta
     */
    public function meta()
    {
        if (!Auth::user()->can('create-product-service-item')) {
            return response()->json(['error' => 'Permission denied'], 403);
        }

        return response()->json([
            'taxes'      => ProductServiceTax::where('created_by', creatorId())->get(['id', 'tax_name', 'rate']),
            'categories' => ProductServiceCategory::where('created_by', creatorId())->get(['id', 'name']),
            'units'      => ProductServiceUnit::where('created_by', creatorId())->get(['id', 'unit_name']),
            'warehouses' => Warehouse::where('is_active', true)->where('created_by', creatorId())->get(['id', 'name']),
        ]);
    }

    /**
     * Minimal quick-create a product/service from an inline modal.
     * POST /product-service/items/quick-add  →  returns JSON with new item
     */
    public function quickAdd(Request $request)
    {
        if (!Auth::user()->can('create-product-service-item')) {
            return response()->json(['error' => 'Permission denied'], 403);
        }

        $data = $request->validate([
            'name'             => 'required|string|max:255',
            'type'             => 'required|in:product,service',
            'sale_price'       => 'required|numeric|min:0',
            'purchase_price'   => 'required|numeric|min:0',
            'category_id'      => 'nullable|exists:product_service_categories,id',
            'unit'             => 'nullable|string|max:50',
            'tax_ids'          => 'nullable|array',
            'tax_ids.*'        => 'integer|exists:product_service_taxes,id',
            'warehouse_id'     => 'nullable|exists:warehouses,id',
            'quantity'         => 'nullable|integer|min:0',
        ]);

        // Auto-generate SKU
        $sku = strtoupper(substr(preg_replace('/[^A-Za-z0-9]/', '', $data['name']), 0, 6))
             . '-' . strtoupper(substr(md5(microtime()), 0, 4));

        $item = new ProductServiceItem();
        $item->name           = $data['name'];
        $item->sku            = $sku;
        $item->type           = $data['type'];
        $item->sale_price     = $data['sale_price'];
        $item->purchase_price = $data['purchase_price'];
        $item->category_id    = $data['category_id'] ?? null;
        $item->unit           = $data['unit'] ?? null;
        $item->tax_ids        = !empty($data['tax_ids']) ? array_map('intval', $data['tax_ids']) : null;
        $item->is_active      = true;
        $item->creator_id     = Auth::id();
        $item->created_by     = creatorId();
        $item->save();

        // Create stock entry for products
        if ($item->type === 'product' && !empty($data['warehouse_id'])) {
            WarehouseStock::create([
                'product_id'   => $item->id,
                'warehouse_id' => $data['warehouse_id'],
                'quantity'     => $data['quantity'] ?? 0,
            ]);
        }

        // Load taxes for response
        $taxes = [];
        if ($item->tax_ids) {
            $taxes = ProductServiceTax::whereIn('id', $item->tax_ids)
                ->where('created_by', creatorId())
                ->get(['id', 'tax_name', 'rate'])
                ->toArray();
        }

        return response()->json([
            'success' => true,
            'message' => __('Product created successfully.'),
            'item'    => [
                'id'             => $item->id,
                'name'           => $item->name,
                'sku'            => $item->sku,
                'type'           => $item->type,
                'sale_price'     => (float) $item->sale_price,
                'purchase_price' => (float) $item->purchase_price,
                'unit'           => $item->unit,
                'taxes'          => $taxes,
                // For sales/quotation selector compatibility
                'item_type'      => $item->type,
                'stock_quantity' => $data['quantity'] ?? 0,
            ],
        ]);
    }

    public function show(ProductServiceItem $item)
    {
        if(Auth::user()->can('view-product-service-item')){
            $item->load(['category', 'unitRelation', 'warehouseStocks.warehouse:id,name']);

            // Load taxes if tax_ids exist
            $taxes = [];
            if ($item->tax_ids) {
                $taxIds = $item->tax_ids;
                if (!empty($taxIds) && is_array($taxIds) && count($taxIds) > 0) {
                    $taxes = ProductServiceTax::whereIn('id', $taxIds)
                        ->where('created_by', creatorId())
                        ->get(['id', 'tax_name', 'rate'])
                        ->toArray();
                }
            }

            $itemData = $item->toArray();
            $itemData['taxes'] = $taxes;
            $itemData['total_quantity'] = $item->warehouseStocks->sum('quantity');
            $itemData['warehouse_stocks'] = $item->warehouseStocks->map(function($stock) {
                return [
                    'warehouse_name' => $stock->warehouse->name,
                    'quantity' => $stock->quantity
                ];
            });

            return Inertia::render('ProductService/Items/Show', [
                'item' => $itemData,
            ]);
        }
        return redirect()->route('product-service.items.index')->with('error', __('Permission denied'));
    }

    public function edit(ProductServiceItem $item)
    {
        if(Auth::user()->can('edit-product-service-item')){
            $taxes = ProductServiceTax::where('created_by', creatorId())->get(['id', 'tax_name', 'rate']);
            $categories = ProductServiceCategory::where('created_by', creatorId())->get(['id', 'name']);
            $units = ProductServiceUnit::where('created_by', creatorId())->get(['id', 'unit_name']);
            $warehouses = Warehouse::where('is_active', true)->where('created_by', creatorId())->get(['id', 'name']);

            // Load the item with all necessary fields
            $item->load(['category', 'unitRelation']);

            return Inertia::render('ProductService/Items/Edit', [
                'item' => $item,
                'taxes' => $taxes,
                'categories' => $categories,
                'units' => $units,
                'warehouses' => $warehouses,
            ]);
        }
        return redirect()->route('product-service.items.index')->with('error', __('Permission denied'));
    }



    public function update(UpdateProductServiceItemRequest $request, ProductServiceItem $item)
    {
        if(Auth::user()->can('edit-product-service-item')){
            $validated = $request->validated();

            $item->name = $validated['name'];
            $item->sku = $validated['sku'];
            $item->tax_ids = (!empty($validated['tax_ids'])) ? array_map('intval', $validated['tax_ids']) : null;
            $item->category_id = $validated['category_id'] === 'none' ? null : $validated['category_id'];
            $item->description = $validated['description'];
            $item->long_description = $validated['long_description'] ?? null;
            $item->sale_price = $validated['sale_price'];
            $item->purchase_price = $validated['purchase_price'];
            $item->unit = $validated['unit'] === 'none' ? null : $validated['unit'];
            $item->type = $validated['type'];

            // Handle image path from media library
            if (isset($validated['image'])) {
                $item->image = !empty($validated['image']) ? basename($validated['image']) : null;
            }

            // Handle multiple images
            if (isset($validated['images'])) {
                if (!empty($validated['images'])) {
                    $imageNames = array_map('basename', $validated['images']);
                    $item->images = json_encode($imageNames);
                } else {
                    $item->images = null;
                }
            }

            $item->save();

            // Update warehouse stock if warehouse is selected
            if ($item->warehouse_id && isset($validated['quantity'])) {
                WarehouseStock::updateOrCreate(
                    [
                        'product_id' => $item->id,
                        'warehouse_id' => $item->warehouse_id,
                    ],
                    [
                        'quantity' => $validated['quantity'],
                    ]
                );
            }

            // Dispatch event for packages to handle their fields
            UpdateProductServiceItem::dispatch($request, $item);

            event(new \App\Events\CustomFieldSaved($item, $request->custom_fields ?? [], 'updated'));

            return redirect()->route('product-service.items.index')->with('success', __('The item details are updated successfully.'));
        }
        return redirect()->route('product-service.items.index')->with('error', __('Permission denied'));
    }

    public function destroy(ProductServiceItem $item)
    {
        if(Auth::user()->can('delete-product-service-item')){
            // Delete associated image
            if ($item->image) {
                \Illuminate\Support\Facades\Storage::disk('public')->delete($item->image);
            }

            // Delete warehouse stock entries
            WarehouseStock::where('product_id', $item->id)->delete();

            DestroyProductServiceItem::dispatch($item);
            $item->delete();
            return back()->with('success', __('The item has been deleted.'));
        }
        return back()->with('error', __('Permission denied'));
    }

    public function stockIndex()
    {
        if(Auth::user()->can('manage-stock')){
            $stocks = ProductServiceItem::select('id', 'name', 'sku')
                ->with(['warehouseStocks:product_id,warehouse_id,quantity'])
                ->where('created_by', creatorId())
                ->where('type', '!=', 'service')
                ->when(request('name'), fn($q) => $q->where('name', 'like', '%' . request('name') . '%'))
                ->when(request('sku'), fn($q) => $q->where('sku', 'like', '%' . request('sku') . '%'))
                ->latest()
                ->paginate(request('per_page', 10))
                ->withQueryString();

            // Add total quantity for each item
            $stocks->getCollection()->transform(function ($item) {
                $item->total_quantity = $item->warehouseStocks->sum('quantity');
                return $item;
            });

            $warehouses = \App\Models\Warehouse::where('created_by', creatorId())->where('is_active', true)->get(['id', 'name']);

            return Inertia::render('ProductService/Stock/Index', [
                'stocks' => $stocks,
                'warehouses' => $warehouses,
            ]);
        }
        return back()->with('error', __('Permission denied'));
    }

    public function apiIndex()
    {
        if(Auth::user()->can('manage-product-service-item') || Auth::user()->can('manage-any-product-service-item') || Auth::user()->can('manage-own-product-service-item')){
            try {
                $query = ProductServiceItem::query();

                if(Auth::user()->can('manage-any-product-service-item')) {
                   $query->where('created_by', creatorId());
                } elseif(Auth::user()->can('manage-own-product-service-item')) {
                    $query->where('creator_id', Auth::id());
                }
                $items = $query->get(['id', 'name', 'sku', 'sale_price', 'tax_ids', 'description']);

                $transformedItems = $items->map(function ($item) {
                    $taxes = [];
                    if ($item->tax_ids) {
                        $taxIds = is_string($item->tax_ids) ? json_decode($item->tax_ids, true) : $item->tax_ids;
                        if (!empty($taxIds) && is_array($taxIds)) {
                            $taxes = ProductServiceTax::whereIn('id', $taxIds)
                                ->get(['id', 'tax_name', 'rate'])
                                ->toArray();
                        }
                    }

                    return [
                        'id' => $item->id,
                        'name' => $item->name,
                        'sku' => $item->sku,
                        'sale_price' => $item->sale_price,
                        'description' => $item->description,
                        'taxes' => $taxes
                    ];
                });

                return response()->json($transformedItems);
            } catch (\Exception $e) {
                return response()->json(['error' => 'Failed to fetch products'], 500);
            }
        }
        return response()->json(['error' => 'Permission denied'], 403);
    }

    public function stockStore(Request $request)
    {
        if(Auth::user()->can('create-stock')){
            $request->validate([
                'product_id' => 'required|exists:product_service_items,id',
                'warehouse_id' => 'required|exists:warehouses,id',
                'quantity' => 'required|numeric|min:0'
            ]);

            $existingStock = WarehouseStock::where('product_id', $request->product_id)
                ->where('warehouse_id', $request->warehouse_id)
                ->first();

            if ($existingStock) {
                $existingStock->increment('quantity', $request->quantity);
            } else {
                WarehouseStock::create([
                    'product_id' => $request->product_id,
                    'warehouse_id' => $request->warehouse_id,
                    'quantity' => $request->quantity,
                ]);
            }

            return back()->with('success', __('Stock entry created successfully.'));
        }
        return back()->with('error', __('Permission denied'));
    }

    /**
     * Download a CSV template for bulk product import.
     * GET /product-service/items/import-template
     */
    public function downloadTemplate()
    {
        if (!Auth::user()->can('create-product-service-item')) {
            return back()->with('error', __('Permission denied'));
        }

        $headers = ['name', 'sku', 'type', 'sale_price', 'purchase_price', 'description', 'unit', 'category_name'];
        $sample  = ['Example Product', 'SKU-001', 'product', '100.00', '80.00', 'A sample product description', 'pcs', 'General'];

        return response()->streamDownload(function () use ($headers, $sample) {
            $out = fopen('php://output', 'w');
            fputcsv($out, $headers);
            fputcsv($out, $sample);
            fclose($out);
        }, 'items_import_template_' . date('Y-m-d') . '.csv', [
            'Content-Type'        => 'text/csv',
            'Content-Disposition' => 'attachment',
        ]);
    }

    /**
     * Parse a CSV, detect duplicates, and return them to the frontend without writing anything.
     * POST /product-service/items/preview-import
     */
    public function previewImport(Request $request)
    {
        if (!Auth::user()->can('create-product-service-item')) {
            return response()->json(['error' => __('Permission denied')], 403);
        }

        $request->validate([
            'file' => 'required|file|mimes:csv,txt|max:10240',
        ]);

        $raw = file_get_contents($request->file('file')->getRealPath());

        if (substr($raw, 0, 3) === "\xEF\xBB\xBF") $raw = substr($raw, 3);
        if (!mb_check_encoding($raw, 'UTF-8')) $raw = mb_convert_encoding($raw, 'UTF-8', 'Windows-1252');

        $tmp = tmpfile();
        fwrite($tmp, $raw);
        rewind($tmp);

        $headers = array_map('trim', fgetcsv($tmp));
        $required = ['name', 'type', 'sale_price', 'purchase_price'];
        $missing  = array_diff($required, $headers);

        if (!empty($missing)) {
            fclose($tmp);
            return response()->json([
                'error' => __('CSV is missing required columns: ') . implode(', ', $missing),
            ], 422);
        }

        $rows      = [];
        $conflicts = [];
        $rowNum    = 1;

        while (($row = fgetcsv($tmp)) !== false) {
            $rowNum++;
            if (count($row) < count($headers)) continue;
            $data = array_map('trim', array_combine($headers, $row));
            if (empty($data['name'])) continue;

            // Detect duplicate: match by SKU (if provided) or by name
            $existing = null;
            if (!empty($data['sku'])) {
                $existing = ProductServiceItem::where('created_by', creatorId())
                    ->where('sku', $data['sku'])
                    ->with(['category:id,name', 'warehouseStocks:product_id,quantity'])
                    ->first(['id', 'name', 'sku', 'sale_price', 'purchase_price', 'type', 'unit', 'category_id']);
            }
            if (!$existing) {
                $existing = ProductServiceItem::where('created_by', creatorId())
                    ->where('name', $data['name'])
                    ->with(['category:id,name', 'warehouseStocks:product_id,quantity'])
                    ->first(['id', 'name', 'sku', 'sale_price', 'purchase_price', 'type', 'unit', 'category_id']);
            }

            $rowData = [
                'row'            => $rowNum,
                'name'           => $data['name'],
                'sku'            => $data['sku'] ?? '',
                'type'           => $data['type'],
                'sale_price'     => $data['sale_price'],
                'purchase_price' => $data['purchase_price'],
                'description'    => $data['description'] ?? '',
                'unit'           => $data['unit'] ?? '',
                'category_name'  => $data['category_name'] ?? '',
                'quantity'       => $data['quantity'] ?? '',
                'warehouse_id'   => $data['warehouse_id'] ?? '',
            ];

            if ($existing) {
                $conflicts[] = array_merge($rowData, [
                    'existing_id'       => $existing->id,
                    'existing_name'     => $existing->name,
                    'existing_sku'      => $existing->sku,
                    'existing_sale'     => $existing->sale_price,
                    'existing_purchase' => $existing->purchase_price,
                    'existing_unit'     => $existing->unit ?? '',
                    'existing_category' => $existing->category?->name ?? '',
                    'existing_quantity' => $existing->warehouseStocks?->sum('quantity') ?? 0,
                    'resolution'        => 'skip',
                ]);
            } else {
                $rows[] = $rowData;
            }
        }

        fclose($tmp);

        return response()->json([
            'new_rows'   => $rows,
            'conflicts'  => $conflicts,
        ]);
    }

    /**
     * Bulk-import products from a CSV file.
     * POST /product-service/items/bulk-import
     * Accepts optional conflict_resolutions: [{ row, existing_id, resolution: 'skip'|'update' }]
     */
    public function bulkImport(Request $request)
    {
        if (!Auth::user()->can('create-product-service-item')) {
            return back()->with('error', __('Permission denied'));
        }

        $request->validate([
            'file'                   => 'required|file|mimes:csv,txt|max:10240',
            'conflict_resolutions'   => 'nullable|string', // JSON-encoded array
        ]);

        // Decode conflict resolutions sent from the frontend modal
        $resolutions = [];
        if ($request->filled('conflict_resolutions')) {
            $decoded = json_decode($request->conflict_resolutions, true);
            if (is_array($decoded)) {
                foreach ($decoded as $res) {
                    if (isset($res['row'], $res['resolution'])) {
                        $resolutions[$res['row']] = $res; // keyed by CSV row number
                    }
                }
            }
        }

        $raw = file_get_contents($request->file('file')->getRealPath());

        if (substr($raw, 0, 3) === "\xEF\xBB\xBF") $raw = substr($raw, 3);
        if (!mb_check_encoding($raw, 'UTF-8')) $raw = mb_convert_encoding($raw, 'UTF-8', 'Windows-1252');

        $tmp = tmpfile();
        fwrite($tmp, $raw);
        rewind($tmp);

        $headers = array_map('trim', fgetcsv($tmp));
        $required = ['name', 'type', 'sale_price', 'purchase_price'];
        $missing  = array_diff($required, $headers);
        if (!empty($missing)) {
            fclose($tmp);
            return back()->with('error', __('CSV is missing required columns: ') . implode(', ', $missing));
        }

        $imported  = 0;
        $updated   = 0;
        $skipped   = 0;
        $rowErrors = [];
        $rowNum    = 1;

        while (($row = fgetcsv($tmp)) !== false) {
            $rowNum++;
            if (count($row) < count($headers)) continue;

            $data = array_map('trim', array_combine($headers, $row));
            if (empty($data['name'])) { $skipped++; continue; }

            $validator = \Illuminate\Support\Facades\Validator::make($data, [
                'name'           => 'required|string|max:255',
                'type'           => 'required|in:product,service,part',
                'sale_price'     => 'required|numeric|min:0',
                'purchase_price' => 'required|numeric|min:0',
            ]);

            if ($validator->fails()) {
                $rowErrors[] = "Row {$rowNum}: " . implode(', ', $validator->errors()->all());
                $skipped++;
                continue;
            }

            // Resolve category
            $categoryId = null;
            if (!empty($data['category_name'])) {
                $cat = ProductServiceCategory::where('created_by', creatorId())
                    ->where('name', $data['category_name'])->first();
                $categoryId = $cat?->id;
            }

            $sku = !empty($data['sku']) ? $data['sku']
                : strtoupper(substr(preg_replace('/[^A-Za-z0-9]/', '', $data['name']), 0, 6))
                  . '-' . strtoupper(substr(md5(microtime(true) . $rowNum), 0, 4));

            $payload = [
                'name'           => $data['name'],
                'sku'            => $sku,
                'type'           => $data['type'],
                'sale_price'     => (float) $data['sale_price'],
                'purchase_price' => (float) $data['purchase_price'],
                'description'    => $data['description'] ?? null,
                'unit'           => !empty($data['unit']) ? $data['unit'] : null,
                'category_id'    => $categoryId,
            ];

            // Check if this row has a conflict resolution decision
            if (isset($resolutions[$rowNum])) {
                $res = $resolutions[$rowNum];
                if ($res['resolution'] === 'skip') {
                    $skipped++;
                    continue;
                }
                if ($res['resolution'] === 'update' && !empty($res['existing_id'])) {
                    try {
                        $existing = ProductServiceItem::where('id', $res['existing_id'])
                            ->where('created_by', creatorId())->first();
                        if ($existing) {
                            $existing->fill($payload)->save();

                            // Also update warehouse stock if warehouse_id + quantity are in the CSV
                            if (!empty($data['warehouse_id']) && isset($data['quantity']) && $data['quantity'] !== '') {
                                WarehouseStock::updateOrCreate(
                                    ['product_id' => $existing->id, 'warehouse_id' => (int) $data['warehouse_id']],
                                    ['quantity' => (float) $data['quantity']]
                                );
                            }

                            $updated++;
                        }
                    } catch (\Exception $e) {
                        $rowErrors[] = "Row {$rowNum} ({$data['name']}): " . $e->getMessage();
                        $skipped++;
                    }
                    continue;
                }
            }

            // No resolution provided — check for duplicate on-the-fly and skip to be safe
            $duplicate = ProductServiceItem::where('created_by', creatorId())
                ->where(function ($q) use ($data, $sku) {
                    $q->where('sku', $sku)->orWhere('name', $data['name']);
                })->exists();

            if ($duplicate) {
                $skipped++;
                continue;
            }

            try {
                ProductServiceItem::create(array_merge($payload, [
                    'is_active'  => true,
                    'creator_id' => Auth::id(),
                    'created_by' => creatorId(),
                ]));
                $imported++;
            } catch (\Exception $e) {
                $rowErrors[] = "Row {$rowNum} ({$data['name']}): " . $e->getMessage();
                $skipped++;
            }
        }

        fclose($tmp);

        $parts = [];
        if ($imported > 0) $parts[] = "{$imported} item(s) imported";
        if ($updated  > 0) $parts[] = "{$updated} item(s) updated";
        if ($skipped  > 0) $parts[] = "{$skipped} row(s) skipped";
        $message = implode(', ', $parts) . '.';
        if (!empty($rowErrors)) {
            $message .= ' Errors: ' . implode(' | ', array_slice($rowErrors, 0, 5));
        }

        $flashKey = ($skipped > 0 || !empty($rowErrors)) ? 'warning' : 'success';
        return back()->with($flashKey, $message);
    }
}

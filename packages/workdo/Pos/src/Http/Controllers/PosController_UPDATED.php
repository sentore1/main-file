<?php

namespace Workdo\Pos\Http\Controllers;

use App\Models\User;
use App\Models\Warehouse;
use Workdo\ProductService\Models\WarehouseStock;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;
use Workdo\Pos\Events\CreatePos;
use Workdo\ProductService\Models\ProductServiceCategory;
use Workdo\ProductService\Models\ProductServiceItem;
use Workdo\Pos\Models\Pos;
use Workdo\Pos\Models\PosItem;
use Workdo\Pos\Http\Requests\StorePosRequest;
use Workdo\Pos\Events\CreatePosSale;
use Workdo\Pos\Models\PosPayment;
use Workdo\ProductService\Models\ProductServiceTax;
use Workdo\Pos\Models\Room;
use Workdo\Pos\Models\RoomBooking;
use Workdo\Pos\Models\RoomBookingPayment;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class PosController extends Controller
{
    public function index(Request $request)
    {
        if(Auth::user()->can('manage-pos-orders')){
            $query = Pos::with(['customer:id,name,email', 'warehouse:id,name', 'payment:pos_id,discount,amount,discount_amount,paid_amount,balance_due'])
                ->withCount('items')
                ->where('created_by', creatorId());

            if ($request->filled('search')) {
                $search = $request->get('search');
                $query->where(function($q) use ($search) {
                    $q->where('sale_number', 'like', "%{$search}%")
                      ->orWhereHas('customer', function($customerQuery) use ($search) {
                          $customerQuery->where('name', 'like', "%{$search}%");
                      })
                      ->orWhereHas('warehouse', function($warehouseQuery) use ($search) {
                          $warehouseQuery->where('name', 'like', "%{$search}%");
                      });
                });
            }

            if ($request->filled('customer')) {
                $customer = $request->get('customer');
                $query->whereHas('customer', function($customerQuery) use ($customer) {
                    $customerQuery->where('name', 'like', "%{$customer}%");
                });
            }

            if ($request->filled('warehouse')) {
                $warehouse = $request->get('warehouse');
                $query->whereHas('warehouse', function($warehouseQuery) use ($warehouse) {
                    $warehouseQuery->where('name', 'like', "%{$warehouse}%");
                });
            }

            if ($request->filled('status')) {
                $status = $request->get('status');
                if ($status !== 'all') {
                    $query->where('status', $status);
                }
            }

            $sortField = $request->get('sort', 'created_at');
            $sortDirection = $request->get('direction', 'desc');

            if (in_array($sortField, ['sale_number', 'total', 'created_at'])) {
                $query->orderBy($sortField, $sortDirection);
            } else {
                $query->latest();
            }

            $perPage = $request->get('per_page', 10);
            $sales = $query->paginate($perPage)->withQueryString();

            $sales->getCollection()->transform(function($sale) {
                $sale->total = $sale->payment ? $sale->payment->discount_amount : 0;
                $sale->paid_amount = $sale->payment ? $sale->payment->paid_amount : 0;
                $sale->balance_due = $sale->payment ? $sale->payment->balance_due : 0;
                return $sale;
            });

            return Inertia::render('Pos/PosOrder/Index', [
                'sales' => $sales,
            ]);
        }else{
            return redirect()->route('warehouses.index')->with('error', __('Permission denied'));

        }
    }

    public function create()
    {
        if(Auth::user()->can('create-pos')){
            $customers = User::whereHas('roles', function($query) {
                $query->where('name', 'client');
            })->where('created_by', creatorId())->select('id', 'name', 'email')->get();

            $warehouses = Warehouse::where('created_by', creatorId())
                ->where('is_active', true)
                ->select('id', 'name', 'address')
                ->get();

            $categories = ProductServiceCategory::where('created_by', creatorId())
                ->select('id', 'name', 'color')
                ->get();
            
            return Inertia::render('Pos/Pos/Create', [
                'customers' => $customers,
                'warehouses' => $warehouses,
                'categories' => $categories,
            ]);
        }else{
            return redirect()->route('pos.index')->with('error', __('Permission denied'));
        }
    }

    public function getProducts(Request $request)
    {
        $warehouseId = $request->get('warehouse_id');
        $categoryId = $request->get('category_id');

        if (!$warehouseId) {
            return response()->json([]);
        }

        $query = ProductServiceItem::select('id', 'name', 'sku', 'sale_price', 'category_id', 'image', 'tax_ids')
            ->with(['category:id,name', 'warehouseStocks' => function($q) use ($warehouseId) {
                $q->where('warehouse_id', $warehouseId)->where('quantity', '>', 0);
            }])
            ->whereHas('warehouseStocks', function($q) use ($warehouseId) {
                $q->where('warehouse_id', $warehouseId)->where('quantity', '>', 0);
            })
            ->where('created_by', creatorId())
            ->where('is_active', true)
            ->where('type', '!=', 'service');

        if ($categoryId) {
            $query->where('category_id', $categoryId);
        }

        $products = $query->get()
            ->map(function($product) {
                $warehouseStock = $product->warehouseStocks->first();
                $taxes = [];
                if ($product->tax_ids && is_array($product->tax_ids) && !empty($product->tax_ids)) {
                    $taxes = \Workdo\ProductService\Models\ProductServiceTax::whereIn('id', $product->tax_ids)
                        ->where('created_by', creatorId())
                        ->get(['id', 'tax_name', 'rate'])
                        ->map(function($tax) {
                            return [
                                'id' => $tax->id,
                                'name' => $tax->tax_name,
                                'rate' => $tax->rate
                            ];
                        })
                        ->toArray();
                }

                return [
                    'id' => $product->id,
                    'name' => $product->name,
                    'sku' => $product->sku,
                    'price' => $product->sale_price,
                    'stock' => $warehouseStock ? $warehouseStock->quantity : 0,
                    'category' => $product->category ? $product->category->name : null,
                    'image' => $product->image,
                    'tax_ids_debug' => $product->tax_ids,
                    'taxes' => $taxes
                ];
            });

        return response()->json($products);
    }

    public function getRooms(Request $request)
    {
        $warehouseId = $request->get('warehouse_id');

        if (!$warehouseId) {
            return response()->json([]);
        }

        $rooms = Room::with(['roomType:id,name,color'])
            ->where('warehouse_id', $warehouseId)
            ->whereIn('status', ['available'])
            ->where('created_by', creatorId())
            ->select('id', 'room_number', 'room_type_id', 'floor', 'price_per_night', 'max_occupancy', 'image', 'status')
            ->get()
            ->map(function($room) {
                return [
                    'id' => $room->id,
                    'name' => 'Room ' . $room->room_number,
                    'sku' => 'ROOM-' . $room->room_number,
                    'price' => $room->price_per_night,
                    'stock' => 1,
                    'category' => $room->roomType ? $room->roomType->name : 'Room',
                    'image' => $room->image,
                    'room_type_color' => $room->roomType ? $room->roomType->color : '#3B82F6',
                    'floor' => $room->floor,
                    'max_occupancy' => $room->max_occupancy,
                    'is_room' => true,
                ];
            });

        return response()->json($rooms);
    }

    public function store(StorePosRequest $request)
    {
        if(Auth::user()->can('create-pos')){
            $validated = $request->validated();

            DB::beginTransaction();
            try {
                $saleNumber = Pos::generateSaleNumber();
                $sale = new Pos();
                $sale->sale_number = $saleNumber;
                $sale->customer_id = $validated['customer_id'] ?? null;
                $sale->warehouse_id = $validated['warehouse_id'];
                $sale->pos_date = $validated['pos_date'] ?? now()->toDateString();
                $sale->creator_id = Auth::id();
                $sale->created_by = creatorId();
                $sale->save();

                $finalAmount = 0;
                foreach ($validated['items'] as $item) {
                    // Check if this is a room
                    $room = Room::find($item['id']);
                    
                    if ($room) {
                        // This is a room booking
                        $checkInDate = $validated['check_in_date'] ?? now()->toDateString();
                        $nights = max(1, $item['quantity']);
                        
                        $subtotal = $nights * $room->price_per_night;
                        $taxAmount = 0; // No automatic tax
                        $totalAmount = $subtotal + $taxAmount;
                        $finalAmount += $totalAmount;
                        
                        // Create room booking
                        $booking = new RoomBooking();
                        $booking->room_id = $room->id;
                        $booking->customer_id = $validated['customer_id'] ?? null;
                        $booking->warehouse_id = $validated['warehouse_id'];
                        $booking->check_in_date = $checkInDate;
                        $booking->check_out_date = date('Y-m-d', strtotime($checkInDate . ' +' . $nights . ' days'));
                        $booking->total_nights = $nights;
                        $booking->number_of_guests = $room->max_occupancy;
                        $booking->subtotal = $subtotal;
                        $booking->tax_amount = $taxAmount;
                        $booking->discount = 0;
                        $booking->total_amount = $totalAmount;
                        $booking->status = 'confirmed';
                        $booking->creator_id = Auth::id();
                        $booking->created_by = creatorId();
                        $booking->save();
                        
                        // Create booking payment
                        $bookingPayment = new RoomBookingPayment();
                        $bookingPayment->booking_id = $booking->id;
                        $bookingPayment->bank_account_id = $validated['bank_account_id'] ?? null;
                        $bookingPayment->payment_method = $validated['payment_method'] ?? 'cash';
                        $bookingPayment->amount_paid = $totalAmount;
                        $bookingPayment->payment_date = now();
                        $bookingPayment->creator_id = Auth::id();
                        $bookingPayment->created_by = creatorId();
                        $bookingPayment->save();
                        
                        // Create Revenue Entry
                        if (class_exists('\Workdo\Account\Models\Revenue')) {
                            try {
                                $revenueCategory = \Workdo\Account\Models\RevenueCategories::firstOrCreate(
                                    [
                                        'category_name' => 'Room Booking',
                                        'created_by' => creatorId()
                                    ],
                                    [
                                        'color' => '#10B981',
                                        'creator_id' => Auth::id(),
                                    ]
                                );

                                $revenue = new \Workdo\Account\Models\Revenue();
                                $revenue->revenue_date = now();
                                $revenue->category_id = $revenueCategory->id;
                                $revenue->bank_account_id = $validated['bank_account_id'] ?? null;
                                $revenue->amount = $totalAmount;
                                $revenue->description = "POS Room Booking {$booking->booking_number} - Room {$room->room_number} ({$nights} nights)";
                                $revenue->reference_number = $booking->booking_number;
                                $revenue->status = 'posted';
                                $revenue->approved_by = Auth::id();
                                $revenue->creator_id = Auth::id();
                                $revenue->created_by = creatorId();
                                $revenue->save();

                                $booking->revenue_id = $revenue->id;
                                $booking->save();
                            } catch (\Exception $e) {
                                \Log::warning('Failed to create revenue for POS room booking: ' . $e->getMessage());
                            }
                        }
                        
                        // Create Sales Invoice for room booking
                        if (class_exists('\App\Models\SalesInvoice')) {
                            try {
                                // Get or create walk-in customer
                                $customerId = $validated['customer_id'];
                                if (!$customerId) {
                                    $walkInCustomer = User::whereHas('roles', function($query) {
                                        $query->where('name', 'client');
                                    })->where('name', 'Walk-in Customer')
                                      ->where('created_by', creatorId())
                                      ->first();
                                    
                                    if (!$walkInCustomer) {
                                        $walkInCustomer = new User();
                                        $walkInCustomer->name = 'Walk-in Customer';
                                        $walkInCustomer->email = 'walkin@hotel.local';
                                        $walkInCustomer->password = bcrypt(Str::random(16));
                                        $walkInCustomer->type = 'client';
                                        $walkInCustomer->created_by = creatorId();
                                        $walkInCustomer->save();
                                        $walkInCustomer->assignRole('client');
                                    }
                                    $customerId = $walkInCustomer->id;
                                }

                                $invoice = new \App\Models\SalesInvoice();
                                $invoice->customer_id = $customerId;
                                $invoice->warehouse_id = $validated['warehouse_id'];
                                $invoice->invoice_date = now()->toDateString();
                                $invoice->due_date = now()->toDateString();
                                $invoice->subtotal = $subtotal;
                                $invoice->tax_amount = $taxAmount;
                                $invoice->discount_amount = 0;
                                $invoice->total_amount = $totalAmount;
                                $invoice->paid_amount = $totalAmount;
                                $invoice->balance_amount = 0;
                                $invoice->status = 'paid';
                                $invoice->type = 'service';
                                $invoice->notes = "POS Room: {$booking->booking_number} - Room {$room->room_number}";
                                $invoice->creator_id = Auth::id();
                                $invoice->created_by = creatorId();
                                $invoice->save();

                                $invoiceItem = new \App\Models\SalesInvoiceItem();
                                $invoiceItem->invoice_id = $invoice->id;
                                $invoiceItem->product_id = null;
                                $invoiceItem->product_type = 'service';
                                $invoiceItem->quantity = $nights;
                                $invoiceItem->unit_price = $room->price_per_night;
                                $invoiceItem->discount_amount = 0;
                                $invoiceItem->tax_amount = $taxAmount;
                                $invoiceItem->total_amount = $totalAmount;
                                $invoiceItem->description = "Room {$room->room_number} ({$nights} nights)";
                                $invoiceItem->creator_id = Auth::id();
                                $invoiceItem->created_by = creatorId();
                                $invoiceItem->save();

                                \Log::info('POS invoice: ' . $invoice->invoice_number);
                            } catch (\Exception $e) {
                                \Log::error('POS invoice error: ' . $e->getMessage());
                            }
                        }
                        
                        // Update room status to reserved
                        $room->status = 'reserved';
                        $room->save();
                        
                        // Add to POS items
                        $saleItem = new PosItem();
                        $saleItem->pos_id = $sale->id;
                        $saleItem->product_id = $room->id;
                        $saleItem->quantity = $nights;
                        $saleItem->price = $room->price_per_night;
                        $saleItem->tax_ids = null;
                        $saleItem->subtotal = $subtotal;
                        $saleItem->tax_amount = $taxAmount;
                        $saleItem->total_amount = $totalAmount;
                        $saleItem->notes = $item['notes'] ?? null;
                        $saleItem->creator_id = Auth::id();
                        $saleItem->created_by = creatorId();
                        $saleItem->save();
                    } else {
                        // This is a regular product
                        $product = ProductServiceItem::find($item['id']);
                        if (!$product) continue;

                        $subtotal = $item['quantity'] * $item['price'];

                        $taxAmount = 0;
                        $taxIds = null;
                        if ($product->tax_ids && is_array($product->tax_ids) && !empty($product->tax_ids)) {
                            $taxIds = $product->tax_ids;
                            $taxes = ProductServiceTax::whereIn('id', $taxIds)
                                ->where('created_by', creatorId())
                                ->get();

                            foreach ($taxes as $tax) {
                                $taxAmount += $subtotal * ($tax->rate / 100);
                            }
                        }

                        $totalAmount = $subtotal + $taxAmount;
                        $finalAmount += $totalAmount;
                        
                        $saleItem = new PosItem();
                        $saleItem->pos_id = $sale->id;
                        $saleItem->product_id = $item['id'];
                        $saleItem->quantity = $item['quantity'];
                        $saleItem->price = $item['price'];
                        $saleItem->tax_ids = $taxIds;
                        $saleItem->subtotal = $subtotal;
                        $saleItem->tax_amount = $taxAmount;
                        $saleItem->total_amount = $totalAmount;
                        $saleItem->notes = $item['notes'] ?? null;
                        $saleItem->creator_id = Auth::id();
                        $saleItem->created_by = creatorId();
                        $saleItem->save();
                    }
                }

                $posPayment = new PosPayment();
                $posPayment->pos_id = $sale->id;
                $posPayment->discount = $validated['discount'];
                $posPayment->amount = $finalAmount;
                $posPayment->discount_amount = $finalAmount-$validated['discount'];
                $posPayment->paid_amount = $validated['paid_amount'] ?? ($finalAmount-$validated['discount']);
                $posPayment->balance_due = ($finalAmount-$validated['discount']) - ($validated['paid_amount'] ?? ($finalAmount-$validated['discount']));
                $posPayment->creator_id = Auth::id();
                $posPayment->created_by = creatorId();
                $posPayment->save();

                // Update sale status based on payment
                if ($posPayment->balance_due > 0) {
                    $sale->status = 'partial';
                } else {
                    $sale->status = 'completed';
                }
                $sale->save();

                try {
                    CreatePos::dispatch($request, $sale);
                } catch (\Throwable $th) {
                    
                }

                DB::commit();
                return back()->with('success', __('The POS sale has been created successfully.'));
            } catch (\Exception $e) {
                DB::rollBack();
                return back()->with('error', __('Sale failed: ') . $e->getMessage());
            }
        }else{
            return redirect()->route('pos.index')->with('error', __('Permission denied'));
        }
    }

    public function show(Pos $sale)
    {
        if(Auth::user()->can('view-pos-orders') &&  $sale->created_by == creatorId() && ($sale->customer_id == Auth::id() || $sale->creator_id == Auth::id())){
            $sale->load([
                'customer:id,name,email',
                'warehouse:id,name',
                'items:id,pos_id,product_id,quantity,price,subtotal,tax_ids,tax_amount,total_amount,notes',
                'items.product:id,name,sku',
                'payment:pos_id,discount,amount,discount_amount,paid_amount,balance_due'
            ]);
            $totals = PosItem::where('pos_id', $sale->id)
                ->selectRaw('SUM(subtotal) as subtotal, SUM(tax_amount) as tax_amount, SUM(total_amount) as total_amount')
                ->first();

            $sale->subtotal = $totals->subtotal ?? 0;
            $sale->tax_amount = $totals->tax_amount ?? 0;
            $sale->discount_amount = $sale->payment ? $sale->payment->discount : 0;
            $sale->total_amount = $sale->payment ? $sale->payment->discount_amount : 0;
            $sale->paid_amount = $sale->payment ? $sale->payment->paid_amount : 0;
            $sale->balance_due = $sale->payment ? $sale->payment->balance_due : 0;

            $sale->items->each(function($item) {
                $taxes = [];
                if ($item->tax_ids && is_array($item->tax_ids)) {
                    $taxes = ProductServiceTax::whereIn('id', $item->tax_ids)
                        ->where('created_by', creatorId())
                        ->get(['id', 'tax_name', 'rate'])
                        ->toArray();
                }
                $item->taxes = $taxes;
            });

            return Inertia::render('Pos/PosOrder/Show', [
                'sale' => $sale,
            ]);
        }else{
           return redirect()->route('pos.index')->with('error', __('Permission denied'));
        }
    }

    public function barcode()
    {
        if(Auth::user()->can('manage-pos-barcodes')){
            $warehouses = Warehouse::where('created_by', creatorId())
                ->where('is_active', true)
                ->select('id', 'name')
                ->get();

            return Inertia::render('Pos/Barcode/Index', [
                'warehouses' => $warehouses,
            ]);
        }else{
           return redirect()->route('pos.index')->with('error', __('Permission denied'));
        }
    }

    public function printBarcode(Request $request, $sale = null)
    {
        if(Auth::user()->can('manage-pos-barcodes')){
            return Inertia::render('Pos/Barcode/Print', [
                'products' => json_decode($request->get('products'), true),
                'copies' => json_decode($request->get('copies'), true),
            ]);
        }else{
           return redirect()->route('pos.index')->with('error', __('Permission denied'));
        }
    }

    public function print(Pos $sale)
    {
        if(Auth::user()->can('view-pos-orders')){
            $sale->load([
                'customer:id,name,email',
                'warehouse:id,name',
                'items:id,pos_id,product_id,quantity,price,subtotal,tax_ids,tax_amount,total_amount,notes',
                'items.product:id,name,sku',
                'payment:pos_id,discount,amount,discount_amount,paid_amount,balance_due'
            ]);

            $totals = PosItem::where('pos_id', $sale->id)
                ->selectRaw('SUM(subtotal) as subtotal, SUM(tax_amount) as tax_amount, SUM(total_amount) as total_amount')
                ->first();

            $sale->subtotal = $totals->subtotal ?? 0;
            $sale->tax_amount = $totals->tax_amount ?? 0;
            $sale->discount_amount = $sale->payment ? $sale->payment->discount : 0;
            $sale->total_amount = $sale->payment ? $sale->payment->discount_amount : 0;
            $sale->paid_amount = $sale->payment ? $sale->payment->paid_amount : 0;
            $sale->balance_due = $sale->payment ? $sale->payment->balance_due : 0;

            $sale->items->each(function($item) {
                $taxes = [];
                if ($item->tax_ids && is_array($item->tax_ids)) {
                    $taxes = ProductServiceTax::whereIn('id', $item->tax_ids)
                        ->where('created_by', creatorId())
                        ->get(['id', 'tax_name', 'rate'])
                        ->toArray();
                }
                $item->taxes = $taxes;
            });

            return Inertia::render('Pos/PosOrder/Print', [
                'sale' => $sale,
            ]);
        }else{
           return redirect()->route('pos.index')->with('error', __('Permission denied'));
        }
    }
    
    public function getNextPosNumber()
    {
        return response()->json([
            'pos_number' => Pos::generateSaleNumber()
        ]);
    }

    public function storeCustomer(Request $request)
    {
        if(Auth::user()->can('create-pos')){
            $request->validate([
                'name' => 'required|string|max:255',
                'email' => 'required|email|unique:users,email',
                'phone' => 'nullable|string|max:20',
            ]);

            DB::beginTransaction();
            try {
                $customer = new User();
                $customer->name = $request->name;
                $customer->email = $request->email;
                $customer->mobile_no = $request->phone;
                $customer->password = Hash::make(Str::random(16));
                $customer->type = 'client';
                $customer->created_by = creatorId();
                $customer->save();
                $customer->assignRole('client');

                DB::commit();
                return response()->json([
                    'success' => true,
                    'customer' => [
                        'id' => $customer->id,
                        'name' => $customer->name,
                        'email' => $customer->email,
                    ],
                    'message' => __('Customer created successfully')
                ]);
            } catch (\Exception $e) {
                DB::rollBack();
                return response()->json([
                    'success' => false,
                    'message' => __('Failed to create customer: ') . $e->getMessage()
                ], 500);
            }
        }else{
            return response()->json([
                'success' => false,
                'message' => __('Permission denied')
            ], 403);
        }
    }
}

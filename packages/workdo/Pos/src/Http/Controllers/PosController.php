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
        \Log::info('POS Orders Index - Method Called', [
            'user_id' => Auth::id(),
            'can_manage' => Auth::user()->can('manage-pos-orders'),
            'request_params' => $request->all()
        ]);
        
        if(Auth::user()->can('manage-pos-orders')){
            $warehouseIds = getUserWarehouseIds();
            
            // If no warehouse IDs returned, get all warehouses for this company
            if (empty($warehouseIds)) {
                $warehouseIds = Warehouse::where('created_by', creatorId())
                    ->pluck('id')
                    ->toArray();
            }
            
            $query = Pos::with(['customer:id,name,email', 'warehouse:id,name', 'payment:pos_id,discount,amount,discount_amount,paid_amount,balance_due'])
                ->withCount('items')
                ->where('created_by', creatorId())
                ->whereIn('warehouse_id', $warehouseIds);

            if ($request->filled('search')) {
                $search = $request->get('search');
                $query->where(function($q) use ($search) {
                    $q->where('sale_number', 'like', "%{$search}%")
                      ->orWhereHas('customer', function($customerQuery) use ($search) {
                          $customerQuery->where('name', 'like', "%{$search}%");
                      })
                      ->orWhereHas('warehouse', function($warehouseQuery) use ($search) {
                          $warehouseQuery->where('name', 'like', "%{$search}%");
                      })
                      ->orWhere(function($subQ) use ($search) {
                          // Include orders with null customer_id when searching for "walk-in"
                          if (stripos('walk-in customer', $search) !== false || stripos('walk-in', $search) !== false) {
                              $subQ->whereNull('customer_id');
                          }
                      });
                });
            }

            if ($request->filled('customer')) {
                $customer = $request->get('customer');
                $query->where(function($q) use ($customer) {
                    $q->whereHas('customer', function($customerQuery) use ($customer) {
                        $customerQuery->where('name', 'like', "%{$customer}%");
                    })
                    ->orWhere(function($subQ) use ($customer) {
                        // Also search for "walk-in" when customer is null
                        if (stripos('walk-in customer', $customer) !== false) {
                            $subQ->whereNull('customer_id');
                        }
                    });
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

            // Date filtering
            if ($request->filled('start_date') && $request->filled('end_date')) {
                $query->whereBetween('pos_date', [$request->start_date, $request->end_date]);
            } elseif ($request->filled('start_date')) {
                $query->where('pos_date', '>=', $request->start_date);
            } elseif ($request->filled('end_date')) {
                $query->where('pos_date', '<=', $request->end_date);
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

            // Debug logging
            \Log::info('POS Orders Index - Query Results', [
                'total_count' => $sales->total(),
                'current_page_count' => $sales->count(),
                'warehouse_ids' => $warehouseIds,
                'filters' => $request->only(['search', 'customer', 'warehouse', 'status', 'start_date', 'end_date']),
                'first_sale' => $sales->items()[0] ?? null,
            ]);

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
            // Get regular customers (clients)
            $regularCustomers = User::whereHas('roles', function($query) {
                $query->where('name', 'client');
            })->where('created_by', creatorId())->select('id', 'name', 'email')->get();

            // Get customers with active room bookings (with room info)
            $bookingCustomers = User::whereHas('roomBookings', function($query) {
                $query->whereIn('status', ['confirmed', 'checked_in'])
                    ->where('created_by', creatorId());
            })
            ->with(['roomBookings' => function($query) {
                $query->whereIn('status', ['confirmed', 'checked_in'])
                    ->where('created_by', creatorId())
                    ->with('room:id,room_number')
                    ->select('id', 'customer_id', 'room_id', 'status', 'booking_number');
            }])
            ->select('id', 'name', 'email')
            ->get();

            // Merge and remove duplicates
            $customers = $regularCustomers->merge($bookingCustomers)->unique('id')->values();

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
        // Force JSON response for API calls
        if (!$request->expectsJson() && $request->ajax()) {
            $request->headers->set('Accept', 'application/json');
        }

        $warehouseId = $request->get('warehouse_id');
        $categoryId = $request->get('category_id');

        \Log::info('POS getProducts Request', [
            'warehouse_id' => $warehouseId,
            'category_id' => $categoryId,
            'creator_id' => creatorId(),
            'all_params' => $request->all(),
            'expects_json' => $request->expectsJson(),
            'is_ajax' => $request->ajax(),
            'accept_header' => $request->header('Accept')
        ]);

        if (!$warehouseId) {
            \Log::warning('POS getProducts: No warehouse_id provided');
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
                    'price' => (float) $product->sale_price, // Ensure it's a float
                    'stock' => $warehouseStock ? $warehouseStock->quantity : 0,
                    'category' => $product->category ? $product->category->name : null,
                    'image' => $product->image,
                    'tax_ids_debug' => $product->tax_ids,
                    'taxes' => $taxes
                ];
            });

        \Log::info('POS getProducts Response', ['count' => $products->count(), 'first_product' => $products->first()]);

        return response()->json($products);
    }

    public function getRooms(Request $request)
    {
        $warehouseId = $request->get('warehouse_id');
        $roomTypeId = $request->get('room_type_id');

        if (!$warehouseId) {
            return response()->json([]);
        }

        $query = Room::with(['roomType:id,name,color'])
            ->where('warehouse_id', $warehouseId)
            ->whereIn('status', ['available'])
            ->where('created_by', creatorId());
        
        // Filter by room type if provided
        if ($roomTypeId) {
            $query->where('room_type_id', $roomTypeId);
        }
        
        $rooms = $query->select('id', 'room_number', 'room_type_id', 'floor', 'price_per_night', 'max_occupancy', 'image', 'status')
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
                    'room_type_name' => $room->roomType ? $room->roomType->name : 'Standard',
                    'floor' => $room->floor,
                    'max_occupancy' => $room->max_occupancy,
                    'is_room' => true,
                ];
            });

        return response()->json($rooms);
    }
    
    public function getRoomTypes(Request $request)
    {
        $warehouseId = $request->get('warehouse_id');
        
        if (!$warehouseId) {
            return response()->json([]);
        }
        
        // Get room types that have rooms in this warehouse
        $roomTypes = \Workdo\Pos\Models\RoomType::whereHas('rooms', function($query) use ($warehouseId) {
            $query->where('warehouse_id', $warehouseId)
                  ->where('created_by', creatorId());
        })
        ->where('created_by', creatorId())
        ->select('id', 'name', 'color')
        ->get();
        
        return response()->json($roomTypes);
    }

    public function store(StorePosRequest $request)
    {
        if(Auth::user()->can('create-pos')){
            $validated = $request->validated();

            // CRITICAL DEBUG: Log exactly what frontend sends
            \Log::critical('=== POS STORE REQUEST ===', [
                'items' => $validated['items'],
                'raw_request' => $request->all()
            ]);

            DB::beginTransaction();
            try {
                \Log::info('POS Order Creation Started', [
                    'user_id' => Auth::id(), 
                    'warehouse_id' => $validated['warehouse_id'],
                    'items_received' => $validated['items']
                ]);
                
                $saleNumber = Pos::generateSaleNumber();
                $sale = new Pos();
                $sale->sale_number = $saleNumber;
                $sale->customer_id = $validated['customer_id'] ?? null;
                $sale->room_booking_id = $validated['room_booking_id'] ?? null;
                $sale->charged_to_room = $validated['charged_to_room'] ?? false;
                $sale->warehouse_id = $validated['warehouse_id'];
                $sale->bank_account_id = $validated['bank_account_id'] ?? null;
                $sale->waiter_name = $validated['waiter_name'] ?? null;
                $sale->pos_date = $validated['pos_date'] ?? now()->toDateString();
                $sale->status = 'pending'; // Set initial status
                $sale->creator_id = Auth::id();
                $sale->created_by = creatorId();
                $sale->save();
                
                \Log::info('POS Order Created', ['sale_id' => $sale->id, 'sale_number' => $saleNumber]);

                $finalAmount = 0;
                foreach ($validated['items'] as $item) {
                    \Log::info('Processing POS Item', [
                        'item_id' => $item['id'],
                        'price_received' => $item['price'],
                        'quantity' => $item['quantity'],
                        'is_room' => $item['is_room'] ?? false
                    ]);
                    
                    // Check if this is a ROOM first (using is_room flag from frontend)
                    $isRoom = isset($item['is_room']) && $item['is_room'] === true;
                    
                    if ($isRoom) {
                        // This is a room booking
                        $room = Room::find($item['id']);
                        
                        if ($room) {
                            \Log::info('Found Room', ['id' => $room->id, 'number' => $room->room_number, 'price' => $room->price_per_night]);
                            
                            $checkInDate = $validated['check_in_date'] ?? now()->toDateString();
                            $nights = max(1, $item['quantity']);
                            $numberOfGuests = $item['number_of_guests'] ?? $room->max_occupancy;
                            
                            // Use custom price from frontend if provided, otherwise use database price
                            $actualPrice = isset($item['price']) && $item['price'] > 0 
                                ? (float) $item['price'] 
                                : (float) $room->price_per_night;
                            
                            $subtotal = $nights * $actualPrice;
                            $taxAmount = 0; // No automatic tax
                            
                            // Breakfast is complimentary - no charge
                            $breakfastTotal = 0;
                            if (isset($item['includes_breakfast']) && $item['includes_breakfast']) {
                                $breakfastPrice = $item['breakfast_price'] ?? 0; // Breakfast is complimentary
                                $breakfastTotal = $breakfastPrice * $numberOfGuests * $nights;
                            }
                            
                            $totalAmount = $subtotal + $taxAmount + $breakfastTotal;
                            $finalAmount += $totalAmount;
                            
                            // Create room booking
                            $booking = new RoomBooking();
                            $booking->room_id = $room->id;
                            $booking->customer_id = $validated['customer_id'] ?? null;
                            $booking->warehouse_id = $validated['warehouse_id'];
                            $booking->check_in_date = $checkInDate;
                            $booking->check_out_date = date('Y-m-d', strtotime($checkInDate . ' +' . $nights . ' days'));
                            $booking->total_nights = $nights;
                            $booking->number_of_guests = $numberOfGuests;
                            $booking->includes_breakfast = $item['includes_breakfast'] ?? false;
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
                            
                            // Update room status to reserved
                            $room->status = 'reserved';
                            $room->save();
                            
                            // Add to POS items
                            $saleItem = new PosItem();
                            $saleItem->pos_id = $sale->id;
                            $saleItem->product_id = $room->id;
                            $saleItem->item_type = 'room';
                            $saleItem->quantity = $nights;
                            $saleItem->price = $actualPrice; // Use custom price if edited, otherwise database price
                            $saleItem->tax_ids = null;
                            $saleItem->subtotal = $subtotal;
                            $saleItem->tax_amount = $taxAmount;
                            $saleItem->total_amount = $totalAmount;
                            $saleItem->notes = $item['notes'] ?? null;
                            $saleItem->creator_id = Auth::id();
                            $saleItem->created_by = creatorId();
                            $saleItem->save();
                            
                            \Log::info('Room POS Item Saved', [
                                'item_id' => $saleItem->id, 
                                'db_price' => $room->price_per_night,
                                'custom_price' => $item['price'] ?? null,
                                'actual_price_used' => $actualPrice
                            ]);
                        }
                    } else {
                        // This is a regular product
                        $product = ProductServiceItem::find($item['id']);
                        
                        if ($product) {
                            \Log::info('Found Product', ['id' => $product->id, 'name' => $product->name, 'db_price' => $product->sale_price]);
                            
                            // Use custom price from frontend if provided, otherwise use database price
                            $actualPrice = isset($item['price']) && $item['price'] > 0 
                                ? (float) $item['price'] 
                                : (float) $product->sale_price;
                            $subtotal = $item['quantity'] * $actualPrice;

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
                            
                            \Log::info('Product Calculation', [
                                'db_price' => $product->sale_price,
                                'custom_price' => $item['price'] ?? null,
                                'actual_price_used' => $actualPrice,
                                'quantity' => $item['quantity'],
                                'subtotal' => $subtotal,
                                'total' => $totalAmount
                            ]);
                            
                            $saleItem = new PosItem();
                            $saleItem->pos_id = $sale->id;
                            $saleItem->product_id = $item['id'];
                            $saleItem->item_type = 'product';
                            $saleItem->quantity = $item['quantity'];
                            $saleItem->price = $actualPrice; // Use custom price if provided, otherwise database price
                            $saleItem->tax_ids = $taxIds;
                            $saleItem->subtotal = $subtotal;
                            $saleItem->tax_amount = $taxAmount;
                            $saleItem->total_amount = $totalAmount;
                            $saleItem->notes = $item['notes'] ?? null;
                            $saleItem->creator_id = Auth::id();
                            $saleItem->created_by = creatorId();
                            $saleItem->save();
                            
                            \Log::info('Product POS Item Saved', ['item_id' => $saleItem->id, 'price' => $saleItem->price]);
                        }
                    }
                }

                \Log::info('Creating POS Payment', ['sale_id' => $sale->id, 'final_amount' => $finalAmount]);
                
                // Calculate payment amounts correctly
                $discount = $validated['discount'] ?? 0;
                $totalBeforeDiscount = $finalAmount;
                $totalAfterDiscount = $finalAmount - $discount;
                
                // When charged to room, the amount is added to the room bill
                // So paid_amount should equal the total (no balance due on POS)
                if ($sale->charged_to_room) {
                    $paidAmount = $totalAfterDiscount; // Mark as paid (charged to room)
                    $balanceDue = 0; // No balance on POS order
                } else {
                    $paidAmount = $validated['paid_amount'] ?? 0;
                    $balanceDue = $totalAfterDiscount - $paidAmount;
                }

                $posPayment = new PosPayment();
                $posPayment->pos_id = $sale->id;
                $posPayment->discount = $discount;
                $posPayment->amount = $totalBeforeDiscount;
                $posPayment->discount_amount = $totalAfterDiscount;
                $posPayment->paid_amount = $paidAmount;
                $posPayment->balance_due = $balanceDue;
                $posPayment->creator_id = Auth::id();
                $posPayment->created_by = creatorId();
                $posPayment->save();
                
                \Log::info('POS Payment Created', [
                    'payment_id' => $posPayment->id, 
                    'charged_to_room' => $sale->charged_to_room,
                    'paid_amount' => $paidAmount, 
                    'balance_due' => $balanceDue
                ]);

                // Update sale status based on payment
                if ($sale->charged_to_room) {
                    // If charged to room, mark as charged_to_room regardless of payment
                    $sale->status = 'charged_to_room';
                } elseif ($balanceDue > 0 && $paidAmount > 0) {
                    $sale->status = 'partial';
                } elseif ($balanceDue <= 0) {
                    $sale->status = 'completed';
                } else {
                    $sale->status = 'pending';
                }
                $sale->save();
                
                \Log::info('POS Order Status Updated', ['sale_id' => $sale->id, 'status' => $sale->status]);

                try {
                    CreatePos::dispatch($request, $sale);
                } catch (\Throwable $th) {
                    \Log::warning('CreatePos Event Failed', ['error' => $th->getMessage()]);
                }

                DB::commit();
                \Log::info('POS Order Transaction Committed', ['sale_id' => $sale->id]);
                
                // Load the sale with relationships for the receipt
                $sale->load([
                    'customer:id,name,email',
                    'warehouse:id,name',
                    'items:id,pos_id,product_id,quantity,price,subtotal,tax_ids,tax_amount,total_amount,notes',
                    'items.product:id,name,sku',
                    'payment:pos_id,discount,amount,discount_amount,paid_amount,balance_due'
                ]);
                
                // Prepare sale data with waiter_name explicitly included
                $saleData = $sale->toArray();
                $saleData['waiter_name'] = $sale->waiter_name;
                
                // Return back to POS create page with sale data so receipt modal can show
                return back()->with([
                    'success' => __('The POS sale has been created successfully.'),
                    'sale' => $saleData
                ]);
            } catch (\Exception $e) {
                DB::rollBack();
                \Log::error('POS Order Creation Failed', [
                    'error' => $e->getMessage(),
                    'trace' => $e->getTraceAsString(),
                    'user_id' => Auth::id(),
                    'warehouse_id' => $validated['warehouse_id'] ?? null
                ]);
                return back()->with('error', __('Sale failed: ') . $e->getMessage());
            }
        }else{
            return redirect()->route('pos.index')->with('error', __('Permission denied'));
        }
    }

    public function show(Pos $sale)
    {
        if(Auth::user()->can('view-pos-orders') && $sale->created_by == creatorId()){
            $sale->load([
                'customer:id,name,email',
                'warehouse:id,name',
                'items:id,pos_id,product_id,item_type,quantity,price,subtotal,tax_ids,tax_amount,total_amount,notes',
                'items.product:id,name,sku',
                'items.room:id,room_number,room_type_id',
                'items.room.roomType:id,name',
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
                // Add item name and SKU based on type
                if ($item->item_type === 'room' && $item->room) {
                    $item->display_name = 'Room ' . $item->room->room_number;
                    $item->display_sku = 'ROOM-' . $item->room->room_number;
                    $item->display_category = $item->room->roomType ? $item->room->roomType->name : 'Room';
                } else if ($item->product) {
                    $item->display_name = $item->product->name;
                    $item->display_sku = $item->product->sku;
                    $item->display_category = null;
                }
                
                // Add taxes for products
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
        if(Auth::user()->can('view-pos-orders') && $sale->created_by == creatorId()){
            $sale->load([
                'customer:id,name,email',
                'warehouse:id,name',
                'items:id,pos_id,product_id,item_type,quantity,price,subtotal,tax_ids,tax_amount,total_amount,notes',
                'items.product:id,name,sku',
                'items.room:id,room_number,room_type_id',
                'items.room.roomType:id,name',
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
                // Add item name and SKU based on type
                if ($item->item_type === 'room' && $item->room) {
                    $item->display_name = 'Room ' . $item->room->room_number;
                    $item->display_sku = 'ROOM-' . $item->room->room_number;
                    $item->display_category = $item->room->roomType ? $item->room->roomType->name : 'Room';
                } else if ($item->product) {
                    $item->display_name = $item->product->name;
                    $item->display_sku = $item->product->sku;
                    $item->display_category = null;
                }
                
                // Add taxes for products
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

    public function addPayment(Request $request, Pos $sale)
    {
        if(Auth::user()->can('manage-pos') && $sale->created_by == creatorId()){
            $request->validate([
                'amount' => 'required|numeric|min:0.01',
                'payment_method' => 'required|string|in:cash,card,bank_transfer,mtn_momo,airtel_money',
                'bank_account_id' => 'nullable|exists:bank_accounts,id',
            ]);

            DB::beginTransaction();
            try {
                $payment = $sale->payment;
                
                if (!$payment) {
                    return back()->with('error', __('Payment record not found'));
                }

                $newPaidAmount = $payment->paid_amount + $request->amount;
                $newBalanceDue = $payment->balance_due - $request->amount;

                // Prevent overpayment
                if ($newBalanceDue < 0) {
                    return back()->with('error', __('Payment amount exceeds balance due'));
                }

                // Update payment record
                $payment->paid_amount = $newPaidAmount;
                $payment->balance_due = $newBalanceDue;
                $payment->save();

                // Update sale status
                if ($newBalanceDue <= 0) {
                    $sale->status = 'completed';
                } else {
                    $sale->status = 'partial';
                }
                $sale->save();

                DB::commit();
                
                return back()->with('success', __('Payment added successfully'));
            } catch (\Exception $e) {
                DB::rollBack();
                \Log::error('Add Payment Failed', [
                    'error' => $e->getMessage(),
                    'sale_id' => $sale->id
                ]);
                return back()->with('error', __('Failed to add payment: ') . $e->getMessage());
            }
        }else{
            return redirect()->route('pos.orders')->with('error', __('Permission denied'));
        }
    }

    public function downloadReport(Request $request)
    {
        if(Auth::user()->can('view-pos-orders')){
            $warehouseIds = getUserWarehouseIds();
            
            if (empty($warehouseIds)) {
                $warehouseIds = Warehouse::where('created_by', creatorId())
                    ->pluck('id')
                    ->toArray();
            }
            
            $query = Pos::with(['customer:id,name,email', 'warehouse:id,name', 'payment'])
                ->withCount('items')
                ->where('created_by', creatorId())
                ->whereIn('warehouse_id', $warehouseIds);

            // Apply filters
            if ($request->filled('customer')) {
                $customer = $request->get('customer');
                $query->where(function($q) use ($customer) {
                    $q->whereHas('customer', function($customerQuery) use ($customer) {
                        $customerQuery->where('name', 'like', "%{$customer}%");
                    })
                    ->orWhere(function($subQ) use ($customer) {
                        if (stripos('walk-in customer', $customer) !== false) {
                            $subQ->whereNull('customer_id');
                        }
                    });
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

            // Date filtering - support both date_range and start_date/end_date
            if ($request->filled('start_date') && $request->filled('end_date')) {
                $query->whereBetween('pos_date', [$request->start_date, $request->end_date]);
            } elseif ($request->filled('start_date')) {
                $query->where('pos_date', '>=', $request->start_date);
            } elseif ($request->filled('end_date')) {
                $query->where('pos_date', '<=', $request->end_date);
            } elseif ($request->filled('date_range')) {
                $dateRange = explode(' to ', $request->date_range);
                if (count($dateRange) == 2) {
                    $query->whereBetween('pos_date', [$dateRange[0], $dateRange[1]]);
                }
            }

            if ($request->filled('search')) {
                $search = $request->get('search');
                $query->where(function($q) use ($search) {
                    $q->where('sale_number', 'like', "%{$search}%")
                      ->orWhereHas('customer', function($customerQuery) use ($search) {
                          $customerQuery->where('name', 'like', "%{$search}%");
                      })
                      ->orWhereHas('warehouse', function($warehouseQuery) use ($search) {
                          $warehouseQuery->where('name', 'like', "%{$search}%");
                      })
                      ->orWhere(function($subQ) use ($search) {
                          if (stripos('walk-in customer', $search) !== false || stripos('walk-in', $search) !== false) {
                              $subQ->whereNull('customer_id');
                          }
                      });
                });
            }

            $sales = $query->orderBy('pos_date', 'desc')->get();

            // Map payment data to the sales object
            $sales->each(function($sale) {
                if ($sale->payment) {
                    $sale->total = $sale->payment->amount ?? 0;
                    $sale->paid_amount = $sale->payment->paid_amount ?? 0;
                    $sale->balance_due = $sale->payment->balance_due ?? 0;
                } else {
                    $sale->total = 0;
                    $sale->paid_amount = 0;
                    $sale->balance_due = 0;
                }
            });

            return Inertia::render('Pos/PosOrder/Report', [
                'sales' => $sales,
                'filters' => $request->only(['customer', 'warehouse', 'status', 'date_range', 'search', 'start_date', 'end_date'])
            ]);
        }else{
            return redirect()->route('pos.orders')->with('error', __('Permission denied'));
        }
    }
}

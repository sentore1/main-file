<?php

namespace Workdo\Pos\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Workdo\Pos\Models\Room;
use Workdo\Pos\Models\RoomType;
use Workdo\Pos\Models\RoomBooking;
use Workdo\Pos\Models\RoomBookingPayment;
use App\Models\User;
use App\Models\Warehouse;
use Carbon\Carbon;
use Illuminate\Support\Str;

class RoomBookingController extends Controller
{
    public function index(Request $request)
    {
        if (Auth::user()->can('manage-room-bookings')) {
            // Get user's accessible warehouse IDs
            $warehouseIds = getUserWarehouseIds();
            
            $query = RoomBooking::with([
                'room:id,room_number,room_type_id',
                'room.roomType:id,name',
                'customer:id,name,email',
                'warehouse:id,name',
                'payment:booking_id,amount_paid,payment_method'
            ])
            ->where('created_by', creatorId())
            ->whereIn('warehouse_id', $warehouseIds);

            if ($request->filled('search')) {
                $search = $request->get('search');
                $query->where(function($q) use ($search) {
                    $q->where('booking_number', 'like', "%{$search}%")
                      ->orWhereHas('customer', function($customerQuery) use ($search) {
                          $customerQuery->where('name', 'like', "%{$search}%");
                      })
                      ->orWhereHas('room', function($roomQuery) use ($search) {
                          $roomQuery->where('room_number', 'like', "%{$search}%");
                      });
                });
            }

            if ($request->filled('warehouse')) {
                $query->where('warehouse_id', $request->get('warehouse'));
            }

            if ($request->filled('status')) {
                $query->where('status', $request->get('status'));
            }

            if ($request->filled('date_from')) {
                $query->where('check_in_date', '>=', $request->get('date_from'));
            }

            if ($request->filled('date_to')) {
                $query->where('check_out_date', '<=', $request->get('date_to'));
            }

            $bookings = $query->latest()->paginate(15)->withQueryString();

            $warehouses = Warehouse::where('created_by', creatorId())
                ->whereIn('id', $warehouseIds)
                ->where('is_active', true)
                ->select('id', 'name')
                ->get();

            // Late Checkout Alerts with warehouse filter
            $today = Carbon::today();
            $lateCheckouts = RoomBooking::with(['customer:id,name', 'room:id,room_number', 'warehouse:id,name'])
                ->where('check_out_date', '<', $today)
                ->whereIn('status', ['confirmed', 'checked_in'])
                ->where('created_by', creatorId())
                ->whereIn('warehouse_id', $warehouseIds)
                ->orderBy('check_out_date', 'asc')
                ->get()
                ->map(function ($booking) use ($today) {
                    $booking->days_late = $today->diffInDays($booking->check_out_date);
                    return $booking;
                });

            return Inertia::render('Pos/RoomBookings/Index', [
                'bookings' => $bookings,
                'warehouses' => $warehouses,
                'lateCheckouts' => $lateCheckouts,
            ]);
        }

        return redirect()->back()->with('error', __('Permission denied'));
    }

    public function create()
    {
        if (Auth::user()->can('create-room-bookings')) {
            $customers = User::whereHas('roles', function($query) {
                $query->where('name', 'client');
            })->where('created_by', creatorId())->select('id', 'name', 'email')->get();

            $warehouses = Warehouse::where('created_by', creatorId())
                ->where('is_active', true)
                ->select('id', 'name', 'address')
                ->get();

            $roomTypes = RoomType::where('created_by', creatorId())
                ->where('is_active', true)
                ->select('id', 'name', 'color', 'base_price')
                ->get();

            return Inertia::render('Pos/RoomBookings/Create', [
                'customers' => $customers,
                'warehouses' => $warehouses,
                'roomTypes' => $roomTypes,
            ]);
        }

        return redirect()->route('room-bookings.index')->with('error', __('Permission denied'));
    }

    public function getAvailableRooms(Request $request)
    {
        \Log::info('=== Getting Available Rooms ===');
        \Log::info('Request params:', $request->all());
        
        try {
            $request->validate([
                'warehouse_id' => 'required|exists:warehouses,id',
                'check_in_date' => 'required|date',
                'check_out_date' => 'required|date|after:check_in_date',
                'room_type_id' => 'nullable|exists:room_types,id',
            ]);

            $warehouseId = $request->warehouse_id;
            $checkIn = $request->check_in_date;
            $checkOut = $request->check_out_date;
            $roomTypeId = $request->room_type_id;

            \Log::info('Validated params:', [
                'warehouse_id' => $warehouseId,
                'check_in' => $checkIn,
                'check_out' => $checkOut,
                'room_type_id' => $roomTypeId
            ]);

            $query = Room::with(['roomType:id,name,color'])
                ->where('warehouse_id', $warehouseId)
                ->where('created_by', creatorId())
                ->where('status', '!=', 'maintenance');

            if ($roomTypeId) {
                $query->where('room_type_id', $roomTypeId);
            }

            $rooms = $query->get();
            \Log::info('Total rooms found before availability check:', ['count' => $rooms->count()]);

            $availableRooms = $rooms->filter(function($room) use ($checkIn, $checkOut) {
                $isAvailable = $room->isAvailable($checkIn, $checkOut);
                \Log::info("Room {$room->room_number} availability:", ['available' => $isAvailable ? 'yes' : 'no']);
                return $isAvailable;
            })->values();

            \Log::info('Available rooms count:', ['count' => $availableRooms->count()]);
            \Log::info('Available rooms data:', $availableRooms->toArray());

            return response()->json($availableRooms);
            
        } catch (\Illuminate\Validation\ValidationException $e) {
            \Log::error('Validation error:', ['errors' => $e->errors()]);
            return response()->json(['error' => 'Validation failed', 'details' => $e->errors()], 422);
        } catch (\Exception $e) {
            \Log::error('Error in getAvailableRooms:', [
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json(['error' => 'Failed to fetch rooms', 'message' => $e->getMessage()], 500);
        }
    }

    public function store(Request $request)
    {
        if (Auth::user()->can('create-room-bookings')) {
            // Support both cart-based and single-room bookings
            $isCartBased = $request->has('items');
            
            if ($isCartBased) {
                // Cart-based booking validation
                $validated = $request->validate([
                    'customer_id' => 'nullable|exists:users,id',
                    'warehouse_id' => 'required|exists:warehouses,id',
                    'items' => 'required|array|min:1|max:10',
                    'items.*.room_id' => 'required|exists:rooms,id',
                    'items.*.check_in_date' => 'required|date',
                    'items.*.check_out_date' => 'required|date|after:items.*.check_in_date',
                    'items.*.number_of_guests' => 'required|integer|min:1',
                    'items.*.includes_breakfast' => 'boolean',
                    'items.*.breakfast_price' => 'nullable|numeric|min:0',
                    'items.*.custom_price' => 'nullable|numeric|min:0',
                    'items.*.item_notes' => 'nullable|string|max:500',
                    'discount' => 'nullable|numeric|min:0',
                    'payment_method' => 'required|in:cash,card,bank_transfer,mobile_money',
                    'bank_account_id' => 'nullable|exists:bank_accounts,id',
                ]);
            } else {
                // Single-room booking validation (backward compatibility)
                $validated = $request->validate([
                    'room_id' => 'required|exists:rooms,id',
                    'customer_id' => 'nullable|exists:users,id',
                    'warehouse_id' => 'required|exists:warehouses,id',
                    'check_in_date' => 'required|date',
                    'check_out_date' => 'required|date|after:check_in_date',
                    'number_of_guests' => 'required|integer|min:1',
                    'notes' => 'nullable|string',
                    'discount' => 'nullable|numeric|min:0',
                    'bank_account_id' => 'nullable|exists:bank_accounts,id',
                    'payment_method' => 'required|in:cash,card,bank_transfer,mobile_money',
                ]);
            }

            DB::beginTransaction();
            try {
                if ($isCartBased) {
                    // Cart-based booking logic
                    $bookingGroupId = RoomBooking::generateBookingGroupId();
                    $totalAmount = 0;
                    $bookings = [];
                    
                    foreach ($validated['items'] as $item) {
                        $room = Room::findOrFail($item['room_id']);
                        
                        // Check availability
                        if (!$room->isAvailable($item['check_in_date'], $item['check_out_date'])) {
                            throw new \Exception("Room {$room->room_number} is not available for selected dates");
                        }
                        
                        // Calculate amounts
                        $checkIn = Carbon::parse($item['check_in_date']);
                        $checkOut = Carbon::parse($item['check_out_date']);
                        $totalNights = $checkIn->diffInDays($checkOut);
                        
                        $pricePerNight = $item['custom_price'] ?? $room->price_per_night;
                        $subtotal = $pricePerNight * $totalNights;
                        
                        // No breakfast cost - it's free
                        $breakfastTotal = 0;
                        
                        // No tax by default (can be configured later)
                        $taxAmount = 0;
                        $itemTotal = $subtotal + $breakfastTotal + $taxAmount;
                        
                        // Create booking
                        $booking = new RoomBooking();
                        $booking->booking_group_id = $bookingGroupId;
                        $booking->room_id = $item['room_id'];
                        $booking->customer_id = $validated['customer_id'] ?? null;
                        $booking->warehouse_id = $validated['warehouse_id'];
                        $booking->check_in_date = $item['check_in_date'];
                        $booking->check_out_date = $item['check_out_date'];
                        $booking->total_nights = $totalNights;
                        $booking->number_of_guests = $item['number_of_guests'];
                        $booking->includes_breakfast = $item['includes_breakfast'] ?? false;
                        $booking->breakfast_price = $item['breakfast_price'] ?? null;
                        $booking->subtotal = $subtotal;
                        $booking->custom_price = $item['custom_price'] ?? null;
                        $booking->tax_amount = $taxAmount;
                        $booking->discount = 0; // Discount applied to group total
                        $booking->total_amount = $itemTotal;
                        $booking->item_notes = $item['item_notes'] ?? null;
                        $booking->status = 'confirmed';
                        $booking->creator_id = Auth::id();
                        $booking->created_by = creatorId();
                        $booking->save();
                        
                        $bookings[] = $booking;
                        $totalAmount += $itemTotal;
                        
                        // Update room status
                        $room->status = 'reserved';
                        $room->save();
                    }
                    
                    // Apply group discount
                    if (($validated['discount'] ?? 0) > 0) {
                        $discountPerBooking = $validated['discount'] / count($bookings);
                        foreach ($bookings as $booking) {
                            $booking->discount = $discountPerBooking;
                            $booking->total_amount -= $discountPerBooking;
                            $booking->save();
                        }
                        $totalAmount -= $validated['discount'];
                    }
                    
                    // Create single payment record for the group
                    $payment = new RoomBookingPayment();
                    $payment->booking_id = $bookings[0]->id;
                    $payment->bank_account_id = $validated['bank_account_id'] ?? null;
                    $payment->payment_method = $validated['payment_method'];
                    $payment->amount_paid = $totalAmount;
                    $payment->payment_date = now();
                    $payment->creator_id = Auth::id();
                    $payment->created_by = creatorId();
                    $payment->save();
                    
                    // Create revenue entry for the group
                    $this->createRevenueEntry($bookings, $totalAmount, $validated);
                    
                    DB::commit();
                    
                    return redirect()->route('room-bookings.create')
                        ->with('success', __('Booking created successfully.'));
                        
                } else {
                    // Single-room booking logic (backward compatibility)
                    $room = Room::findOrFail($validated['room_id']);
                    
                    // Check availability
                    if (!$room->isAvailable($validated['check_in_date'], $validated['check_out_date'])) {
                        return redirect()->back()->with('error', __('Room is not available for selected dates.'))->withInput();
                    }

                    // Calculate dates and amounts
                    $checkIn = Carbon::parse($validated['check_in_date']);
                    $checkOut = Carbon::parse($validated['check_out_date']);
                    $totalNights = $checkIn->diffInDays($checkOut);
                    
                    $subtotal = $room->price_per_night * $totalNights;
                    $taxAmount = 0; // No automatic tax
                    $discount = $validated['discount'] ?? 0;
                    $totalAmount = $subtotal + $taxAmount - $discount;

                    // Create booking
                    $booking = new RoomBooking();
                    $booking->room_id = $validated['room_id'];
                    $booking->customer_id = $validated['customer_id'] ?? null;
                    $booking->warehouse_id = $validated['warehouse_id'];
                    $booking->check_in_date = $validated['check_in_date'];
                    $booking->check_out_date = $validated['check_out_date'];
                    $booking->total_nights = $totalNights;
                    $booking->number_of_guests = $validated['number_of_guests'];
                    $booking->subtotal = $subtotal;
                    $booking->tax_amount = $taxAmount;
                    $booking->discount = $discount;
                    $booking->total_amount = $totalAmount;
                    $booking->notes = $validated['notes'] ?? null;
                    $booking->status = 'confirmed';
                    $booking->creator_id = Auth::id();
                    $booking->created_by = creatorId();
                    $booking->save();

                    // Create payment record
                    $payment = new RoomBookingPayment();
                    $payment->booking_id = $booking->id;
                    $payment->bank_account_id = $validated['bank_account_id'] ?? null;
                    $payment->payment_method = $validated['payment_method'];
                    $payment->amount_paid = $totalAmount;
                    $payment->payment_date = now();
                    $payment->creator_id = Auth::id();
                    $payment->created_by = creatorId();
                    $payment->save();

                // Create Revenue Entry for Financial Integration
                if (class_exists('\Workdo\Account\Models\Revenue')) {
                    try {
                        // Get or create "Room Booking" revenue category
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
                        $revenue->bank_account_id = $validated['bank_account_id'] ?? \Workdo\Account\Models\BankAccount::where('created_by', creatorId())->first()->id ?? null;
                        $revenue->amount = $totalAmount;
                        $revenue->description = "Room Booking {$booking->booking_number} - Room {$room->room_number} ({$totalNights} nights)";
                        $revenue->reference_number = $booking->booking_number;
                        $revenue->status = 'posted';
                        $revenue->approved_by = Auth::id();
                        $revenue->creator_id = Auth::id();
                        $revenue->created_by = creatorId();
                        $revenue->save();

                        // Link revenue to booking
                        $booking->revenue_id = $revenue->id;
                        $booking->save();
                    } catch (\Exception $e) {
                        // Revenue creation failed, but booking still succeeds
                        \Log::warning('Failed to create revenue entry for booking: ' . $e->getMessage());
                    }
                }

                // Create Sales Invoice
                if (class_exists('\App\Models\SalesInvoice')) {
                    try {
                        // Get or create a default walk-in customer if no customer selected
                        $customerId = $validated['customer_id'];
                        if (!$customerId) {
                            $walkInCustomer = User::whereHas('roles', function($query) {
                                $query->where('name', 'client');
                            })->where('name', 'Walk-in Customer')
                              ->where('created_by', creatorId())
                              ->first();
                            
                            if (!$walkInCustomer) {
                                // Create walk-in customer
                                $walkInCustomer = new User();
                                $walkInCustomer->name = 'Walk-in Customer';
                                $walkInCustomer->email = 'walkin@' . str_replace(['http://', 'https://', 'www.'], '', request()->getHost()) . '.local';
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
                        $invoice->discount_amount = $discount;
                        $invoice->total_amount = $totalAmount;
                        $invoice->paid_amount = $totalAmount;
                        $invoice->balance_amount = 0;
                        $invoice->status = 'paid';
                        $invoice->type = 'service';
                        $invoice->notes = "Room Booking: {$booking->booking_number} - Room {$room->room_number}";
                        $invoice->creator_id = Auth::id();
                        $invoice->created_by = creatorId();
                        $invoice->save();

                        // Create invoice item
                        $invoiceItem = new \App\Models\SalesInvoiceItem();
                        $invoiceItem->invoice_id = $invoice->id;
                        $invoiceItem->product_id = null;
                        // $invoiceItem->product_type = 'service'; // Column doesn't exist in table
                        $invoiceItem->quantity = $totalNights;
                        $invoiceItem->unit_price = $room->price_per_night;
                        $invoiceItem->discount_amount = 0;
                        $invoiceItem->tax_amount = $taxAmount;
                        $invoiceItem->total_amount = $totalAmount;
                        $invoiceItem->description = "Room {$room->room_number} - {$room->roomType->name} ({$totalNights} nights)";
                        $invoiceItem->creator_id = Auth::id();
                        $invoiceItem->created_by = creatorId();
                        $invoiceItem->save();

                        // Link invoice to booking
                        $booking->invoice_id = $invoice->id;
                        $booking->save();

                        \Log::info('✅ Sales invoice created successfully', [
                            'booking_number' => $booking->booking_number,
                            'invoice_number' => $invoice->invoice_number,
                            'invoice_id' => $invoice->id,
                            'total_amount' => $totalAmount
                        ]);
                    } catch (\Exception $e) {
                        \Log::error('❌ Failed to create sales invoice for booking', [
                            'booking_number' => $booking->booking_number ?? 'unknown',
                            'error' => $e->getMessage(),
                            'trace' => $e->getTraceAsString()
                        ]);
                    }
                }

                // Update room status
                $room->status = 'reserved';
                $room->save();

                DB::commit();

                return redirect()->route('room-bookings.create')->with('success', __('Booking created successfully.'));
                }
            } catch (\Exception $e) {
                DB::rollBack();
                \Log::error('Booking failed', [
                    'error' => $e->getMessage(),
                    'user_id' => Auth::id()
                ]);
                return redirect()->back()->with('error', __('Booking failed: ') . $e->getMessage())->withInput();
            }
        }

        return redirect()->route('room-bookings.index')->with('error', __('Permission denied'));
    }

    private function createRevenueEntry($bookings, $totalAmount, $validated)
    {
        if (!class_exists('\Workdo\Account\Models\Revenue')) {
            return;
        }

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

            $roomNumbers = collect($bookings)->pluck('room.room_number')->join(', ');
            $totalNights = collect($bookings)->sum('total_nights');

            $revenue = new \Workdo\Account\Models\Revenue();
            $revenue->revenue_date = now();
            $revenue->category_id = $revenueCategory->id;
            $revenue->bank_account_id = $validated['bank_account_id'] ?? \Workdo\Account\Models\BankAccount::where('created_by', creatorId())->first()->id ?? null;
            $revenue->amount = $totalAmount;
            $revenue->description = "Room Booking Group {$bookings[0]->booking_group_id} - Rooms: {$roomNumbers} ({$totalNights} total nights)";
            $revenue->reference_number = $bookings[0]->booking_group_id;
            $revenue->status = 'posted';
            $revenue->approved_by = Auth::id();
            $revenue->creator_id = Auth::id();
            $revenue->created_by = creatorId();
            $revenue->save();

            // Link revenue to first booking
            $bookings[0]->revenue_id = $revenue->id;
            $bookings[0]->save();
        } catch (\Exception $e) {
            \Log::warning('Failed to create revenue entry for booking group: ' . $e->getMessage());
        }
    }

    public function storeCustomer(Request $request)
    {
        if (Auth::user()->can('create-room-bookings')) {
            $validated = $request->validate([
                'name' => 'required|string|max:255',
                'email' => 'required|email|unique:users,email',
                'phone' => 'nullable|string|max:20',
            ]);

            DB::beginTransaction();
            try {
                $customer = new User();
                $customer->name = $validated['name'];
                $customer->email = $validated['email'];
                $customer->mobile_no = $validated['phone'] ?? null; // Use mobile_no instead of phone
                $customer->password = bcrypt(Str::random(16));
                $customer->type = 'client';
                $customer->created_by = creatorId();
                $customer->save();
                $customer->assignRole('client');

                DB::commit();

                return response()->json([
                    'success' => true,
                    'message' => __('Customer created successfully'),
                    'customer' => [
                        'id' => $customer->id,
                        'name' => $customer->name,
                        'email' => $customer->email,
                    ]
                ]);
            } catch (\Exception $e) {
                DB::rollBack();
                return response()->json([
                    'success' => false,
                    'message' => __('Failed to create customer: ') . $e->getMessage()
                ], 422);
            }
        }

        return response()->json([
            'success' => false,
            'message' => __('Permission denied')
        ], 403);
    }

    public function receipt($groupId)
    {
        if (Auth::user()->can('view-room-bookings')) {
            $bookings = RoomBooking::with([
                'room.roomType',
                'customer',
                'warehouse',
            ])
            ->where('booking_group_id', $groupId)
            ->where('created_by', creatorId())
            ->get();

            if ($bookings->isEmpty()) {
                return redirect()->route('room-bookings.index')
                    ->with('error', __('Booking not found'));
            }

            // Get payment for the first booking in the group
            $payment = RoomBookingPayment::where('booking_id', $bookings[0]->id)
                ->where('created_by', creatorId())
                ->first();

            return Inertia::render('Pos/RoomBookings/Receipt', [
                'bookings' => $bookings,
                'groupId' => $groupId,
                'totalAmount' => $bookings->sum('total_amount'),
                'payment' => $payment,
            ]);
        }

        return redirect()->route('room-bookings.index')->with('error', __('Permission denied'));
    }

    public function show(RoomBooking $roomBooking)
    {
        if (Auth::user()->can('view-room-bookings') && $roomBooking->created_by == creatorId()) {
            $roomBooking->load([
                'room.roomType',
                'room.warehouse',
                'customer',
                'warehouse',
                'payment.bankAccount',
                'revenue'
            ]);

            // Get all POS sales linked to this room booking
            $posInvoices = \Workdo\Pos\Models\Pos::with(['items.product', 'payment'])
                ->where('room_booking_id', $roomBooking->id)
                ->where('created_by', creatorId())
                ->orderBy('created_at', 'desc')
                ->get()
                ->map(function($pos) {
                    // Use discount_amount as the total (it's the amount after discount)
                    $totalAmount = $pos->payment ? (float) $pos->payment->discount_amount : 0;
                    $paidAmount = $pos->payment ? (float) $pos->payment->paid_amount : 0;
                    $balanceDue = $pos->payment ? (float) $pos->payment->balance_due : 0;
                    
                    \Log::info('=== POS Invoice Data ===', [
                        'pos_id' => $pos->id,
                        'booking_id' => $pos->room_booking_id,
                        'sale_number' => $pos->sale_number,
                        'payment_exists' => $pos->payment ? 'yes' : 'no',
                        'raw_discount_amount' => $pos->payment ? $pos->payment->discount_amount : 'N/A',
                        'raw_paid_amount' => $pos->payment ? $pos->payment->paid_amount : 'N/A',
                        'raw_balance_due' => $pos->payment ? $pos->payment->balance_due : 'N/A',
                        'converted_total' => $totalAmount,
                        'converted_paid' => $paidAmount,
                        'converted_balance' => $balanceDue,
                        'charged_to_room' => $pos->charged_to_room
                    ]);
                    
                    return [
                        'id' => $pos->id,
                        'sale_number' => $pos->sale_number,
                        'pos_date' => $pos->pos_date->format('Y-m-d'),
                        'items' => $pos->items->map(function($item) {
                            return [
                                'product_name' => $item->product ? $item->product->name : 'N/A',
                                'quantity' => (int) $item->quantity,
                                'unit_price' => (float) $item->price,
                                'total_amount' => (float) $item->total_amount,
                            ];
                        }),
                        'total_amount' => $totalAmount,
                        'paid_amount' => $paidAmount,
                        'balance_due' => $balanceDue,
                        'charged_to_room' => (bool) $pos->charged_to_room,
                    ];
                });

            \Log::info('=== POS Invoices Summary ===', [
                'booking_id' => $roomBooking->id,
                'booking_number' => $roomBooking->booking_number,
                'pos_count' => $posInvoices->count(),
                'pos_invoices_data' => $posInvoices->toArray()
            ]);

            return Inertia::render('Pos/RoomBookings/Show', [
                'booking' => $roomBooking,
                'posInvoices' => $posInvoices,
            ]);
        }

        return redirect()->route('room-bookings.index')->with('error', __('Permission denied'));
    }

    public function checkIn(RoomBooking $roomBooking)
    {
        if (Auth::user()->can('manage-room-bookings') && $roomBooking->created_by == creatorId()) {
            // Eager load the room relationship
            $roomBooking->load('room');
            
            if ($roomBooking->status !== 'confirmed') {
                return redirect()->back()->with('error', __('Only confirmed bookings can be checked in.'));
            }

            DB::beginTransaction();
            try {
                $roomBooking->status = 'checked_in';
                $roomBooking->save();

                if ($roomBooking->room) {
                    $roomBooking->room->status = 'occupied';
                    $roomBooking->room->save();
                }

                DB::commit();
                return redirect()->back()->with('success', __('Guest checked in successfully.'));
            } catch (\Exception $e) {
                DB::rollBack();
                \Log::error('Check-in failed: ' . $e->getMessage());
                return redirect()->back()->with('error', __('Check-in failed: ') . $e->getMessage());
            }
        }

        return redirect()->route('room-bookings.index')->with('error', __('Permission denied'));
    }

    public function checkOut(RoomBooking $roomBooking)
    {
        if (Auth::user()->can('manage-room-bookings') && $roomBooking->created_by == creatorId()) {
            // Eager load the room relationship
            $roomBooking->load('room');
            
            if ($roomBooking->status !== 'checked_in') {
                return redirect()->back()->with('error', __('Only checked-in bookings can be checked out.'));
            }

            DB::beginTransaction();
            try {
                $roomBooking->status = 'checked_out';
                $roomBooking->save();

                if ($roomBooking->room) {
                    $roomBooking->room->status = 'available';
                    $roomBooking->room->save();
                }

                DB::commit();
                return redirect()->back()->with('success', __('Guest checked out successfully.'));
            } catch (\Exception $e) {
                DB::rollBack();
                \Log::error('Checkout failed: ' . $e->getMessage());
                return redirect()->back()->with('error', __('Checkout failed: ') . $e->getMessage());
            }
        }

        return redirect()->route('room-bookings.index')->with('error', __('Permission denied'));
    }

    public function cancel(RoomBooking $roomBooking)
    {
        if (Auth::user()->can('manage-room-bookings') && $roomBooking->created_by == creatorId()) {
            if (in_array($roomBooking->status, ['checked_out', 'cancelled'])) {
                return redirect()->back()->with('error', __('Cannot cancel this booking.'));
            }

            DB::beginTransaction();
            try {
                $roomBooking->status = 'cancelled';
                $roomBooking->save();

                // Make room available again
                if ($roomBooking->room->status === 'reserved' || $roomBooking->room->status === 'occupied') {
                    $roomBooking->room->status = 'available';
                    $roomBooking->room->save();
                }

                // Create refund revenue entry (negative)
                if ($roomBooking->revenue_id && class_exists('\Workdo\Account\Models\Revenue')) {
                    try {
                        $revenueCategory = \Workdo\Account\Models\RevenueCategories::where('category_name', 'Room Booking Refund')
                            ->where('created_by', creatorId())
                            ->first();

                        if (!$revenueCategory) {
                            $revenueCategory = \Workdo\Account\Models\RevenueCategories::create([
                                'category_name' => 'Room Booking Refund',
                                'color' => '#EF4444',
                                'creator_id' => Auth::id(),
                                'created_by' => creatorId(),
                            ]);
                        }

                        $refundRevenue = new \Workdo\Account\Models\Revenue();
                        $refundRevenue->revenue_date = now();
                        $refundRevenue->category_id = $revenueCategory->id;
                        $refundRevenue->bank_account_id = $roomBooking->payment->bank_account_id ?? \Workdo\Account\Models\BankAccount::where('created_by', creatorId())->first()->id ?? null;
                        $refundRevenue->amount = -$roomBooking->total_amount; // Negative for refund
                        $refundRevenue->description = "Refund for cancelled booking {$roomBooking->booking_number}";
                        $refundRevenue->reference_number = $roomBooking->booking_number . '-REFUND';
                        $refundRevenue->status = 'posted';
                        $refundRevenue->approved_by = Auth::id();
                        $refundRevenue->creator_id = Auth::id();
                        $refundRevenue->created_by = creatorId();
                        $refundRevenue->save();
                    } catch (\Exception $e) {
                        \Log::warning('Failed to create refund revenue entry: ' . $e->getMessage());
                    }
                }

                DB::commit();

                return redirect()->back()->with('success', __('Booking cancelled successfully.'));
            } catch (\Exception $e) {
                DB::rollBack();
                return redirect()->back()->with('error', __('Cancellation failed: ') . $e->getMessage());
            }
        }

        return redirect()->route('room-bookings.index')->with('error', __('Permission denied'));
    }

    public function calendar(Request $request)
    {
        if (Auth::user()->can('view-room-bookings')) {
            $warehouseId = $request->get('warehouse_id');
            
            $warehouses = Warehouse::where('created_by', creatorId())
                ->where('is_active', true)
                ->select('id', 'name')
                ->get();

            $query = RoomBooking::with(['room:id,room_number', 'customer:id,name'])
                ->where('created_by', creatorId())
                ->whereIn('status', ['confirmed', 'checked_in']);

            if ($warehouseId) {
                $query->where('warehouse_id', $warehouseId);
            }

            $bookings = $query->get()->map(function($booking) {
                return [
                    'id' => $booking->id,
                    'title' => "Room {$booking->room->room_number} - " . ($booking->customer->name ?? 'Walk-in'),
                    'start' => $booking->check_in_date->format('Y-m-d'),
                    'end' => $booking->check_out_date->format('Y-m-d'),
                    'status' => $booking->status,
                    'booking_number' => $booking->booking_number,
                ];
            });

            return Inertia::render('Pos/RoomBookings/Calendar', [
                'bookings' => $bookings,
                'warehouses' => $warehouses,
            ]);
        }

        return redirect()->back()->with('error', __('Permission denied'));
    }

    public function getTodayBreakfastBookings()
    {
        if (Auth::user()->can('view-room-bookings')) {
            $today = Carbon::today();
            $warehouseIds = getUserWarehouseIds();
            
            $breakfastBookings = RoomBooking::with(['room:id,room_number', 'customer:id,name,email', 'warehouse:id,name'])
                ->where('created_by', creatorId())
                ->whereIn('warehouse_id', $warehouseIds)
                ->where('includes_breakfast', true)
                ->whereDate('check_in_date', '<=', $today)
                ->whereDate('check_out_date', '>=', $today)
                ->whereIn('status', ['confirmed', 'checked_in'])
                ->orderBy('room_id')
                ->get()
                ->map(function($booking) {
                    return [
                        'id' => $booking->id,
                        'booking_number' => $booking->booking_number,
                        'room_number' => $booking->room->room_number ?? 'N/A',
                        'customer_name' => $booking->customer->name ?? 'Walk-in',
                        'number_of_guests' => $booking->number_of_guests,
                        'warehouse_name' => $booking->warehouse->name ?? 'N/A',
                        'status' => $booking->status,
                    ];
                });

            return response()->json([
                'success' => true,
                'count' => $breakfastBookings->count(),
                'bookings' => $breakfastBookings
            ]);
        }

        return response()->json(['success' => false, 'message' => 'Permission denied'], 403);
    }
}

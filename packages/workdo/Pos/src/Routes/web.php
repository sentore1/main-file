<?php

use Illuminate\Support\Facades\Route;
use Workdo\Pos\Http\Controllers\DashboardController;
use Workdo\Pos\Http\Controllers\PosController;
use Workdo\Pos\Http\Controllers\PosReportController;
use Workdo\Pos\Http\Controllers\RoomTypeController;
use Workdo\Pos\Http\Controllers\RoomController;
use Workdo\Pos\Http\Controllers\RoomBookingController;
use Workdo\Pos\Http\Controllers\BreakfastController;
use Workdo\Pos\Http\Controllers\DebugController;

Route::middleware(['web', 'auth', 'verified', 'PlanModuleCheck:Pos'])->group(function () {
    Route::get('/pos', [DashboardController::class, 'index'])->name('pos.index');

    // Debug routes - Check POS and Room Booking links
    Route::get('/pos/debug/check-links', [DebugController::class, 'checkPosRoomLinks'])->name('pos.debug.check-links');
    Route::post('/pos/debug/fix-links', [DebugController::class, 'fixPosRoomLinks'])->name('pos.debug.fix-links');
    Route::get('/pos/debug/booking/{bookingId}', [DebugController::class, 'inspectBookingData'])->name('pos.debug.booking');
    Route::post('/pos/debug/fix-old-orders', [DebugController::class, 'fixOldChargedToRoomOrders'])->name('pos.debug.fix-old-orders');

    // Debug route - REMOVE AFTER TESTING
    Route::get('/pos/debug-orders', function() {
        $warehouseIds = getUserWarehouseIds();
        if (empty($warehouseIds)) {
            $warehouseIds = \App\Models\Warehouse::where('created_by', creatorId())
                ->pluck('id')
                ->toArray();
        }
        
        $sales = \Workdo\Pos\Models\Pos::with(['customer:id,name,email', 'warehouse:id,name', 'payment'])
            ->withCount('items')
            ->where('created_by', creatorId())
            ->whereIn('warehouse_id', $warehouseIds)
            ->get();
        
        return response()->json([
            'warehouse_ids' => $warehouseIds,
            'creator_id' => creatorId(),
            'user_id' => auth()->id(),
            'total_sales' => $sales->count(),
            'sales' => $sales->map(function($sale) {
                return [
                    'id' => $sale->id,
                    'sale_number' => $sale->sale_number,
                    'status' => $sale->status,
                    'customer_id' => $sale->customer_id,
                    'customer' => $sale->customer,
                    'warehouse' => $sale->warehouse,
                    'payment' => $sale->payment,
                    'items_count' => $sale->items_count,
                    'created_at' => $sale->created_at,
                ];
            })
        ]);
    });

    // POS Routes
    Route::get('/pos/orders', [PosController::class, 'index'])->name('pos.orders');
    Route::get('/pos/create', [PosController::class, 'create'])->name('pos.create');
    Route::get('/pos/products', [PosController::class, 'getProducts'])->name('pos.products');
    Route::get('/pos/rooms', [PosController::class, 'getRooms'])->name('pos.rooms');
    Route::get('/pos/room-types', [PosController::class, 'getRoomTypes'])->name('pos.room-types');
    Route::get('/pos/pos-number', [PosController::class, 'getNextPosNumber'])->name('pos.pos-number');
    Route::post('/pos/customers', [PosController::class, 'storeCustomer'])->name('pos.customers.store');
    Route::post('/pos/store', [PosController::class, 'store'])->name('pos.store');
    Route::get('/pos/orders/{sale}', [PosController::class, 'show'])->name('pos.show');
    Route::post('/pos/orders/{sale}/add-payment', [PosController::class, 'addPayment'])->name('pos.add-payment');
    Route::get('/pos/barcode', [PosController::class, 'barcode'])->name('pos.barcode');
    Route::get('/pos/barcode/{sale}', [PosController::class, 'printBarcode'])->name('pos.barcode.print');
    Route::get('/pos/orders/{sale}/print', [PosController::class, 'print'])->name('pos-orders.print');
    Route::get('/pos/orders-report/download', [PosController::class, 'downloadReport'])->name('pos-orders.download-report');
    
    // POS Reports
    Route::prefix('pos/reports')->name('pos.reports.')->group(function () {
        Route::get('/sales', [PosReportController::class, 'sales'])->name('sales');
        Route::get('/products', [PosReportController::class, 'products'])->name('products');
        Route::get('/customers', [PosReportController::class, 'customers'])->name('customers');
        Route::get('/daily-financial', [PosReportController::class, 'dailyFinancial'])->name('daily-financial');
    });

    // Breakfast Alert
    Route::get('/pos/breakfast-alert', [BreakfastController::class, 'index'])->name('pos.breakfast-alert');

    // Room Type Management
    Route::resource('room-types', RoomTypeController::class);

    // Room Management
    Route::resource('rooms', RoomController::class);

    // Room Booking Management
    Route::get('/room-bookings/calendar', [RoomBookingController::class, 'calendar'])->name('room-bookings.calendar');
    Route::get('/room-bookings/available-rooms', [RoomBookingController::class, 'getAvailableRooms'])->name('room-bookings.available-rooms');
    Route::get('/room-bookings/today-breakfast', [RoomBookingController::class, 'getTodayBreakfastBookings'])->name('room-bookings.today-breakfast');
    Route::get('/room-bookings/receipt/{group_id}', [RoomBookingController::class, 'receipt'])->name('room-bookings.receipt');
    Route::post('/room-bookings/customers/store', [RoomBookingController::class, 'storeCustomer'])->name('room-bookings.customers.store');
    Route::post('/room-bookings/{roomBooking}/check-in', [RoomBookingController::class, 'checkIn'])->name('room-bookings.check-in');
    Route::post('/room-bookings/{roomBooking}/check-out', [RoomBookingController::class, 'checkOut'])->name('room-bookings.check-out');
    Route::post('/room-bookings/{roomBooking}/cancel', [RoomBookingController::class, 'cancel'])->name('room-bookings.cancel');
    Route::resource('room-bookings', RoomBookingController::class);
});
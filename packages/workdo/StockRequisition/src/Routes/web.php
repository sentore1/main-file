<?php

use Illuminate\Support\Facades\Route;
use Workdo\StockRequisition\Http\Controllers\StockRequisitionController;

Route::middleware(['web', 'auth', 'verified'])->group(function () {
    Route::prefix('stock-requisitions')->name('stock-requisitions.')->group(function () {
        // API endpoints (must be before resource routes)
        Route::get('api/warehouse-products', [StockRequisitionController::class, 'getWarehouseProducts'])->name('warehouse-products');
        
        // Main routes
        Route::get('/', [StockRequisitionController::class, 'index'])->name('index');
        Route::get('/create', [StockRequisitionController::class, 'create'])->name('create');
        Route::post('/', [StockRequisitionController::class, 'store'])->name('store');
        Route::get('/{stockRequisition}', [StockRequisitionController::class, 'show'])->name('show');
        Route::get('/{stockRequisition}/edit', [StockRequisitionController::class, 'edit'])->name('edit');
        Route::put('/{stockRequisition}', [StockRequisitionController::class, 'update'])->name('update');
        Route::delete('/{stockRequisition}', [StockRequisitionController::class, 'destroy'])->name('destroy');
        
        // Approval actions
        Route::post('/{stockRequisition}/approve', [StockRequisitionController::class, 'approve'])->name('approve');
        Route::post('/{stockRequisition}/reject', [StockRequisitionController::class, 'reject'])->name('reject');
        Route::post('/{stockRequisition}/fulfill', [StockRequisitionController::class, 'fulfill'])->name('fulfill');
        Route::post('/{stockRequisition}/cancel', [StockRequisitionController::class, 'cancel'])->name('cancel');
    });
});

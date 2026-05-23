# Sales Invoice - Rooms & Services Feature

## Summary
Added the ability to include rooms and services in Sales Invoices with warehouse filtering, similar to how POS works.

## Changes Made

### 1. Backend - SalesInvoiceController.php
**File:** `app/Http/Controllers/SalesInvoiceController.php`

**Updated `getServices()` method to:**
- Accept `warehouse_id` parameter
- Fetch services (existing functionality)
- Fetch available rooms from the selected warehouse
- Return combined list of services and rooms

**Room data structure:**
```php
[
    'id' => room_id,
    'name' => 'Room 101 - Deluxe',
    'sku' => 'ROOM-101',
    'sale_price' => price_per_night,
    'unit' => 'night',
    'type' => 'room',
    'item_type' => 'room',
    'room_id' => room_id,
    'room_number' => '101',
    'taxes' => []
]
```

### 2. Frontend - Sales/Create.tsx
**File:** `resources/js/pages/Sales/Create.tsx`

**Changes:**
1. **Added `handleWarehouseChangeForServices()` function**
   - Fetches services and rooms when warehouse is selected
   - Only triggers when type is 'service'
   - Populates `availableProducts` state

2. **Updated `handleTypeChange()` function**
   - Removed automatic service fetching
   - Now waits for warehouse selection

3. **Added warehouse selector for Service Wise**
   - Shows warehouse dropdown when "Service Wise" is selected
   - Uses `handleWarehouseChangeForServices` for onChange event
   - Same UI as Product Wise warehouse selector

## How It Works

### User Flow:
1. User goes to Create Sales Invoice
2. Clicks "Service Wise" radio button
3. Warehouse dropdown appears
4. User selects a warehouse (e.g., "East Gate Kirehe - Kirehe")
5. System fetches:
   - All services
   - All available rooms in that warehouse
6. Product dropdown in "Sales Invoice Items" now shows:
   - Services (e.g., "Cleaning Service - 5,000Fr")
   - Rooms (e.g., "Room 101 - Deluxe - 10,000Fr")
7. User can select and add items to invoice

### Technical Flow:
```
User selects warehouse
    ↓
handleWarehouseChangeForServices() called
    ↓
GET /sales-invoices/services?warehouse_id=X
    ↓
Backend: SalesInvoiceController@getServices
    ↓
Fetch services + rooms for warehouse
    ↓
Return JSON array
    ↓
Frontend: setAvailableProducts(services + rooms)
    ↓
ProductSelector component displays items
```

## Files Modified

1. **app/Http/Controllers/SalesInvoiceController.php**
   - Updated `getServices()` method

2. **resources/js/pages/Sales/Create.tsx**
   - Added `handleWarehouseChangeForServices()` function
   - Updated `handleTypeChange()` function
   - Added warehouse selector for services
   - Added console logging for debugging

## Testing Steps

1. Clear cache: `php artisan cache:clear`
2. Rebuild frontend: `npm run build`
3. Go to Sales Invoice → Create
4. Select "Service Wise"
5. Select a warehouse
6. Check browser console for:
   - "Fetching services from: [URL]"
   - "Services received: [array]"
7. Click "+ Add Item" button
8. Click on Product dropdown
9. Verify services and rooms appear in the list
10. Select a room or service
11. Verify price auto-fills
12. Complete and save invoice

## Debugging

If products don't show:
1. Open browser console (F12)
2. Look for console.log messages:
   - "Fetching services from: ..."
   - "Services received: ..."
3. Check the services array structure
4. Verify warehouse_id is being sent in the URL
5. Check Laravel logs for backend errors

## Benefits

✅ Rooms can be added to sales invoices
✅ Warehouse filtering for services and rooms
✅ Consistent with POS functionality
✅ Easy to add room charges to customer invoices
✅ Supports multi-warehouse setups

# POS Edit Functionality

## Overview
The POS system now supports editing completed sales orders. This allows authorized users to modify order details, update items, quantities, prices, and payment information.

## Features Implemented

### 1. Backend Changes

#### New Files Created:
- `packages/workdo/Pos/src/Http/Requests/UpdatePosRequest.php` - Validation rules for updating POS orders
- `packages/workdo/Pos/src/Resources/js/Pages/Pos/Edit.tsx` - Frontend edit interface

#### Modified Files:
- `packages/workdo/Pos/src/Http/Controllers/PosController.php`
  - Added `edit()` method - Loads sale data and displays edit form
  - Added `update()` method - Processes updates with inventory management
  
- `packages/workdo/Pos/src/Routes/web.php`
  - Added `GET /pos/orders/{sale}/edit` route
  - Added `PUT /pos/orders/{sale}` route

- `packages/workdo/Pos/src/Database/Seeders/PermissionTableSeeder.php`
  - Added `edit-pos` permission

### 2. Key Functionality

#### Edit Method (`edit()`)
- Checks user permission (`edit-pos`)
- Loads sale with all relationships (customer, warehouse, items, payment)
- Prepares data for the edit form
- Returns Inertia view with sale data and available products/categories

#### Update Method (`update()`)
- Validates input using `UpdatePosRequest`
- Uses database transactions for data integrity
- **Inventory Management:**
  - Restores stock for old items
  - Deducts stock for new/updated items
  - Validates sufficient stock before updating
- Updates sale items (deletes old, creates new)
- Recalculates totals, taxes, and discounts
- Updates payment information
- Updates sale status based on payment (partial/completed)

### 3. Inventory Handling

The update process carefully manages inventory:

1. **Restore Old Stock**: When editing, the system first restores inventory for all items in the original order
2. **Validate New Stock**: Checks if sufficient stock exists for the updated order
3. **Deduct New Stock**: Deducts inventory for the updated items
4. **Rollback on Error**: If any step fails, all changes are rolled back

### 4. Limitations

**Room Bookings Cannot Be Edited:**
- POS orders containing room bookings cannot be edited through this interface
- Room bookings require special handling due to:
  - Room status management (available/reserved/occupied)
  - Booking dates and check-in/check-out logic
  - Revenue entries and invoices
  - Booking payment records
- If a user attempts to edit an order with rooms, they'll receive an error message

### 5. Permissions

New permission added: `edit-pos`
- Automatically granted to the `company` role
- Can be assigned to other roles through the admin panel
- Required to access edit functionality

### 6. Routes

```php
GET  /pos/orders/{sale}/edit  - Display edit form
PUT  /pos/orders/{sale}        - Process update
```

### 7. Frontend Interface

The Edit page (`Edit.tsx`) provides:
- Product selection grid (filtered by warehouse and category)
- Shopping cart with item management
- Quantity and price editing
- Item notes
- Discount and payment amount fields
- Real-time total calculations
- Customer selection
- Warehouse selection

## Usage

### To Edit a POS Order:

1. Navigate to POS Orders list (`/pos/orders`)
2. Click "Edit" button on the order you want to modify
3. Make changes:
   - Add/remove products
   - Update quantities
   - Adjust prices
   - Modify discount
   - Update paid amount
4. Click "Update Sale" to save changes

### Important Notes:

- Only users with `edit-pos` permission can edit orders
- Orders must belong to the same company (creator)
- Room booking orders cannot be edited
- Stock availability is validated before saving
- All changes are atomic (either all succeed or all fail)

## Testing Recommendations

1. **Test Basic Edit:**
   - Edit an order with regular products
   - Verify inventory is correctly updated

2. **Test Stock Validation:**
   - Try to increase quantity beyond available stock
   - Verify error message appears

3. **Test Room Booking Protection:**
   - Try to edit an order containing room bookings
   - Verify error message appears

4. **Test Payment Updates:**
   - Update paid amount
   - Verify status changes (partial/completed)

5. **Test Permissions:**
   - Try accessing edit without `edit-pos` permission
   - Verify access is denied

## Database Seeding

To add the new permission to existing installations, run:

```bash
php artisan db:seed --class=Workdo\\Pos\\Database\\Seeders\\PermissionTableSeeder
```

Or run the full seeder if needed.

## Future Enhancements

Potential improvements:
1. Add edit history/audit trail
2. Support editing room booking orders with special handling
3. Add bulk edit functionality
4. Add void/cancel functionality as an alternative to editing
5. Add email notifications for edited orders
6. Add approval workflow for edits above certain amounts

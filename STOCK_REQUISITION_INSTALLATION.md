# Stock Requisition Module - Installation Guide

## Overview

The Stock Requisition module has been successfully created and integrated into your system. This module allows users to request stock items, which then go through an approval workflow before being fulfilled.

## What Was Created

### Backend Components

1. **Models**
   - `StockRequisition` - Main requisition model
   - `StockRequisitionItem` - Requisition line items

2. **Migrations**
   - `2025_05_07_000001_create_stock_requisitions_table.php`
   - `2025_05_07_000002_create_stock_requisition_items_table.php`

3. **Controller**
   - `StockRequisitionController` - Handles all CRUD and approval operations

4. **Request Validation**
   - `StoreStockRequisitionRequest`
   - `UpdateStockRequisitionRequest`

5. **Events**
   - `CreateStockRequisition`
   - `ApproveStockRequisition`
   - `RejectStockRequisition`
   - `FulfillStockRequisition`

6. **Routes**
   - All routes registered under `/stock-requisitions` prefix

7. **Service Provider**
   - `StockRequisitionServiceProvider` - Auto-registered via composer

### Frontend Components (React/TypeScript)

1. **Index.tsx** - List all requisitions with filters
2. **Create.tsx** - Create new requisition form
3. **Edit.tsx** - Edit existing requisition
4. **View.tsx** - View requisition details with approval actions

## Installation Steps

### Step 1: Run Migrations

```bash
php artisan migrate
```

This will create the `stock_requisitions` and `stock_requisition_items` tables.

### Step 2: Seed Permissions

```bash
php artisan db:seed --class="Workdo\\StockRequisition\\Database\\Seeders\\StockRequisitionPermissionSeeder"
```

This will create the following permissions:
- manage-stock-requisitions
- create-stock-requisitions
- view-stock-requisitions
- edit-stock-requisitions
- delete-stock-requisitions
- approve-stock-requisitions
- fulfill-stock-requisitions
- cancel-stock-requisitions

And assign them to appropriate roles (admin, manager, accountant).

### Step 3: Build Frontend Assets

```bash
npm run build
# or for development
npm run dev
```

### Step 4: Clear Cache

```bash
php artisan cache:clear
php artisan config:clear
php artisan route:clear
```

## Usage

### For Regular Users

1. Navigate to **Stock Requisitions** menu
2. Click **New Requisition**
3. Fill in:
   - Requisition Date
   - Required Date (when items are needed)
   - Warehouse (source warehouse)
   - Department (optional)
   - Priority (Low, Normal, Urgent)
   - Purpose (why items are needed)
   - Items (select products and quantities)
4. Submit - Status becomes **Pending**

### For Managers/Accountants

1. View pending requisitions
2. Click on a requisition to view details
3. Options:
   - **Approve** - Approve the requisition (can modify quantities)
   - **Reject** - Reject with a reason
4. Approved requisitions move to **Approved** status

### For Warehouse Staff

1. View approved requisitions
2. Click **Mark as Fulfilled**
3. Confirm fulfillment (can specify actual quantities fulfilled)
4. Status becomes **Fulfilled**

## Status Flow

```
Draft → Pending → Approved → Fulfilled
              ↓
           Rejected
```

Users can also cancel requisitions in Draft, Pending, or Approved status.

## Features

✅ **Role-Based Approval** - Manager/Accountant can approve requisitions
✅ **Priority Levels** - Low, Normal, Urgent
✅ **Department Tracking** - Track which department requested items
✅ **Warehouse Integration** - Select products from specific warehouses
✅ **Stock Visibility** - See available stock when selecting products
✅ **Quantity Tracking** - Track requested, approved, and fulfilled quantities
✅ **Audit Trail** - Track who requested, approved, and fulfilled
✅ **Rejection Reasons** - Capture why requisitions were rejected
✅ **Auto-Generated Numbers** - Format: SR-YYYY-MM-NNNN

## API Endpoints

All endpoints are under `/stock-requisitions`:

- `GET /` - List requisitions
- `GET /create` - Show create form
- `POST /` - Store new requisition
- `GET /{id}` - View details
- `GET /{id}/edit` - Show edit form
- `PUT /{id}` - Update requisition
- `DELETE /{id}` - Delete requisition
- `POST /{id}/approve` - Approve
- `POST /{id}/reject` - Reject
- `POST /{id}/fulfill` - Mark as fulfilled
- `POST /{id}/cancel` - Cancel

## Permissions Setup

If you need to manually assign permissions to roles:

```php
use Spatie\Permission\Models\Role;

$role = Role::findByName('manager');
$role->givePermissionTo([
    'manage-stock-requisitions',
    'create-stock-requisitions',
    'view-stock-requisitions',
    'approve-stock-requisitions',
    'fulfill-stock-requisitions',
]);
```

## Troubleshooting

### Routes not found
```bash
php artisan route:clear
php artisan route:cache
```

### Permissions not working
```bash
php artisan permission:cache-reset
```

### Frontend not loading
```bash
npm run build
php artisan view:clear
```

## Next Steps

1. **Customize Approval Workflow** - Add multi-level approvals if needed
2. **Add Notifications** - Email/SMS notifications for approvals
3. **Integration with Transfers** - Auto-create transfers when fulfilled
4. **Reports** - Add requisition reports and analytics
5. **Mobile App** - Create mobile interface for approvals

## Support

For questions or issues, refer to the README.md in the package directory:
`packages/workdo/StockRequisition/README.md`

# Stock Requisition Module

A comprehensive stock requisition management system for Laravel applications with approval workflow.

## Features

- **Create Requisitions**: Users can request stock items from warehouses
- **Approval Workflow**: Manager/Accountant approval system
- **Priority Levels**: Low, Normal, Urgent
- **Status Tracking**: Draft → Pending → Approved/Rejected → Fulfilled
- **Department Tracking**: Track requisitions by department
- **Warehouse Integration**: Integrated with existing warehouse system
- **Product Selection**: Select products with real-time stock visibility
- **Fulfillment Tracking**: Track approved vs fulfilled quantities

## Installation

### 1. Register the Service Provider

Add the package to your `composer.json` autoload section:

```json
"autoload": {
    "psr-4": {
        "Workdo\\StockRequisition\\": "packages/workdo/StockRequisition/src/"
    }
}
```

### 2. Update Composer Autoload

```bash
composer dump-autoload
```

### 3. Run Migrations

```bash
php artisan migrate
```

### 4. Seed Permissions

```bash
php artisan db:seed --class="Workdo\\StockRequisition\\Database\\Seeders\\StockRequisitionPermissionSeeder"
```

### 5. Build Frontend Assets

```bash
npm run build
```

## Permissions

The module includes the following permissions:

- `manage-stock-requisitions` - View all requisitions
- `create-stock-requisitions` - Create new requisitions
- `view-stock-requisitions` - View requisition details
- `edit-stock-requisitions` - Edit draft/pending requisitions
- `delete-stock-requisitions` - Delete requisitions
- `approve-stock-requisitions` - Approve or reject requisitions
- `fulfill-stock-requisitions` - Mark requisitions as fulfilled
- `cancel-stock-requisitions` - Cancel requisitions

## Usage

### Creating a Requisition

1. Navigate to Stock Requisitions → Create
2. Fill in requisition details (date, warehouse, department, priority)
3. Add items with quantities
4. Submit for approval

### Approval Process

1. Manager/Accountant reviews pending requisitions
2. Can approve with modified quantities or reject with reason
3. Approved requisitions move to fulfillment queue

### Fulfillment

1. Warehouse staff views approved requisitions
2. Marks items as fulfilled with actual quantities
3. System updates requisition status to fulfilled

## API Endpoints

- `GET /stock-requisitions` - List all requisitions
- `GET /stock-requisitions/create` - Show create form
- `POST /stock-requisitions` - Store new requisition
- `GET /stock-requisitions/{id}` - View requisition details
- `GET /stock-requisitions/{id}/edit` - Show edit form
- `PUT /stock-requisitions/{id}` - Update requisition
- `DELETE /stock-requisitions/{id}` - Delete requisition
- `POST /stock-requisitions/{id}/approve` - Approve requisition
- `POST /stock-requisitions/{id}/reject` - Reject requisition
- `POST /stock-requisitions/{id}/fulfill` - Mark as fulfilled
- `POST /stock-requisitions/{id}/cancel` - Cancel requisition

## Status Flow

```
Draft → Pending → Approved → Fulfilled
              ↓
           Rejected
              ↓
          Cancelled
```

## Database Schema

### stock_requisitions
- id
- requisition_number (auto-generated: SR-YYYY-MM-NNNN)
- requisition_date
- required_date
- requested_by (user_id)
- warehouse_id
- department
- priority (low, normal, urgent)
- status (draft, pending, approved, rejected, fulfilled, cancelled)
- approved_by (user_id)
- approved_at
- fulfilled_by (user_id)
- fulfilled_at
- purpose
- notes
- rejection_reason
- creator_id
- created_by
- timestamps

### stock_requisition_items
- id
- requisition_id
- product_id
- quantity_requested
- quantity_approved
- quantity_fulfilled
- notes
- creator_id
- created_by
- timestamps

## Events

The module dispatches the following events:

- `CreateStockRequisition` - When a requisition is created
- `ApproveStockRequisition` - When a requisition is approved
- `RejectStockRequisition` - When a requisition is rejected
- `FulfillStockRequisition` - When a requisition is fulfilled

## Support

For issues or questions, please contact support@workdo.io

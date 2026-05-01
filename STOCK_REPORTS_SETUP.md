# Stock Reports Feature - Setup Instructions

## What Was Created

A complete Stock Reports system for tracking opening and closing stock by category:

### Backend Files:
1. `packages/workdo/ProductService/src/Models/StockReport.php` - Model
2. `packages/workdo/ProductService/src/Database/Migrations/2026_04_20_000001_create_stock_reports_table.php` - Migration
3. `packages/workdo/ProductService/src/Http/Controllers/StockReportController.php` - Controller
4. `packages/workdo/ProductService/src/Routes/web.php` - Routes (updated)
5. `packages/workdo/ProductService/src/Database/Seeders/PermissionTableSeeder.php` - Permissions (updated)

### Frontend Files:
1. `packages/workdo/ProductService/src/Resources/js/Pages/StockReports/Index.tsx` - List page
2. `packages/workdo/ProductService/src/Resources/js/Pages/StockReports/Create.tsx` - Create page
3. `packages/workdo/ProductService/src/Resources/js/Pages/StockReports/Show.tsx` - View page
4. `packages/workdo/ProductService/src/Resources/js/Pages/StockReports/Print.tsx` - Print page
5. `packages/workdo/ProductService/src/Resources/js/menus/company-menu.ts` - Menu (updated)

## Setup Steps (Run these commands in order)

```bash
# 1. Clear all caches
php artisan cache:clear
php artisan config:clear
php artisan route:clear
php artisan view:clear

# 2. Run the migration (if not already run)
php artisan migrate

# 3. Seed the permissions
php artisan db:seed --class="Workdo\ProductService\Database\Seeders\PermissionTableSeeder"

# 4. Rebuild frontend assets
npm run build

# 5. Clear browser cache or hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
```

## Verify Setup

1. Check migration status:
```bash
php artisan migrate:status | grep stock_reports
```
Should show: `2026_04_20_000001_create_stock_reports_table .... Ran`

2. Check permissions:
```bash
php artisan tinker
>>> \Spatie\Permission\Models\Permission::where('module', 'stock-report')->get(['name', 'label']);
```
Should show 4 permissions:
- manage-stock-report
- view-stock-report
- create-stock-report
- delete-stock-report

3. Check routes:
```bash
php artisan route:list | grep stock-reports
```
Should show 6 routes

## Troubleshooting

### If menu doesn't appear:
```bash
php artisan cache:clear
npm run build
# Hard refresh browser
```

### If "Permission denied" error:
```bash
# Re-seed permissions
php artisan db:seed --class="Workdo\ProductService\Database\Seeders\PermissionTableSeeder"

# Assign permissions to your role via admin panel
# Or via tinker:
php artisan tinker
>>> $role = \Spatie\Permission\Models\Role::where('name', 'company')->first();
>>> $permissions = \Spatie\Permission\Models\Permission::where('module', 'stock-report')->get();
>>> $role->givePermissionTo($permissions);
```

### If pagination error on Create page:
This should be fixed in the latest code. Make sure to run `npm run build`.

## How to Use

1. Go to sidebar: Product & Service > Stock Reports
2. Click "Create Report"
3. Select:
   - Report Date
   - Report Type (Opening or Closing)
   - Warehouse (optional)
4. Select category and add items
5. Adjust quantities as needed
6. Submit
7. View and print reports grouped by category

## Features

- Create opening stock reports (morning)
- Create closing stock reports (evening)
- Group items by category
- Track stock per warehouse
- Print reports with signatures
- Filter reports by date, type, warehouse
- View grand totals and category totals

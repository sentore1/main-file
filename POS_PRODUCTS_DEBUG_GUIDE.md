# POS Products Not Showing - Debugging Guide

## Issue
Products are not visible on the POS create dashboard at https://pryro.eastgatehotel.rw/pos/create

## Changes Made
1. Replaced all `route()` helper calls with hardcoded paths (e.g., `/pos/products`)
2. Added extensive console logging in frontend
3. Added detailed Laravel logging in backend

## How to Trace the Error

### Step 1: Check Browser Console
Open browser DevTools (F12) and look for these logs:

```
=== POS Create Component Mounted ===
Warehouses: [...]
Categories: [...]
Initial selectedWarehouse: X
Initial selectedCategory: all

Fetching products from: /pos/products?warehouse_id=X
Products response status: 200
Products data received: [...]
Number of products: X
```

### Step 2: Check Laravel Logs
View `storage/logs/laravel.log` for:

```
[timestamp] local.INFO: POS getProducts Request
{
    "warehouse_id": "1",
    "category_id": null,
    "creator_id": "1",
    "all_params": {...}
}

[timestamp] local.INFO: POS getProducts Response
{
    "count": 5,
    "first_product": {...}
}
```

### Step 3: Test API Directly
Visit in browser (replace warehouse_id with actual ID):
```
https://pryro.eastgatehotel.rw/pos/products?warehouse_id=1
```

Should return JSON like:
```json
[
  {
    "id": 1,
    "name": "Product Name",
    "sku": "SKU123",
    "price": 100.00,
    "stock": 10,
    "category": "Category Name",
    "image": "path/to/image.jpg",
    "taxes": [...]
  }
]
```

## Common Issues & Solutions

### Issue 1: Empty Array Returned
**Symptom:** API returns `[]`
**Causes:**
- No products have stock in the selected warehouse
- Products are marked as inactive (`is_active = false`)
- Products are services (`type = 'service'`)
- Products don't belong to current user (`created_by` mismatch)

**Solution:**
```sql
-- Check products in database
SELECT id, name, sku, is_active, type, created_by 
FROM product_service_items 
WHERE created_by = YOUR_CREATOR_ID;

-- Check warehouse stocks
SELECT * FROM warehouse_stocks 
WHERE warehouse_id = YOUR_WAREHOUSE_ID 
AND quantity > 0;
```

### Issue 2: No Warehouse Selected
**Symptom:** Console shows "Initial warehouse: ''"
**Solution:** Ensure warehouses are passed to the component and at least one exists

### Issue 3: 404 or 500 Error
**Symptom:** Console shows "Products response status: 404" or "500"
**Solution:**
- Check route is registered: `php artisan route:list | grep pos.products`
- Check middleware allows access
- Check Laravel logs for PHP errors

### Issue 4: CSRF Token Error
**Symptom:** 419 error in console
**Solution:** This shouldn't happen with GET requests, but ensure session is valid

## Quick Fixes to Try

1. **Clear browser cache and reload**
   ```
   Ctrl+Shift+R (hard reload)
   ```

2. **Clear Laravel cache**
   ```bash
   php artisan cache:clear
   php artisan config:clear
   php artisan route:clear
   ```

3. **Check if products exist with stock**
   ```bash
   php artisan tinker
   >>> \Workdo\ProductService\Models\ProductServiceItem::where('is_active', true)->where('type', '!=', 'service')->count()
   ```

4. **Rebuild frontend**
   ```bash
   npm run build
   ```

## Files Modified

### Frontend
- `packages/workdo/Pos/src/Resources/js/Pages/Pos/Create.tsx`
  - Added console logging for debugging
  - Replaced `route()` calls with hardcoded paths

### Backend
- `packages/workdo/Pos/src/Http/Controllers/PosController.php`
  - Added Laravel logging in `getProducts()` method

## Next Steps

1. Open the POS create page
2. Open browser console (F12)
3. Check the console logs
4. Check Laravel logs
5. Report findings:
   - What does the console show?
   - What does Laravel log show?
   - What does direct API test return?

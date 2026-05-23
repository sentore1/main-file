# Test Edit Route

## Run these commands in SSH to diagnose the issue:

### 1. Check if route exists
```bash
php artisan route:list | grep "pos.edit"
```

### 2. Test the route directly (replace 441 with your order ID)
```bash
php artisan tinker
```
Then in tinker:
```php
$sale = \Workdo\Pos\Models\Pos::find(441);
dd($sale);
```

### 3. Check if permission exists
```bash
php artisan tinker
```
Then:
```php
$permission = Spatie\Permission\Models\Permission::where('name', 'edit-pos')->first();
dd($permission);
```

### 4. Rebuild frontend assets
```bash
npm run build
```

### 5. Clear all caches
```bash
php artisan optimize:clear
```

### 6. Check Laravel logs while clicking Edit button
```bash
tail -f storage/logs/laravel.log
```

## Quick Fix Commands (run all at once):

```bash
# Run migration
php artisan migrate

# Clear caches
php artisan cache:clear
php artisan config:clear
php artisan route:clear
php artisan view:clear

# Rebuild assets
npm run build

# Check route
php artisan route:list | grep pos
```

## If you see "Unexpected token '<'" error:

This means the page is returning HTML (probably an error page) instead of JSON. Check:

1. Is the permission added? Run: `php artisan migrate`
2. Does your user have the permission?
3. Are there any PHP errors? Check: `tail -n 100 storage/logs/laravel.log`

## Test URL directly:

Visit in browser: `https://pryro.eastgatehotel.rw/pos/orders/441/edit`

If you see a Laravel error page, that's the issue - not JavaScript!

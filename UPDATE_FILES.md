# Files to Upload to Server

Upload these 3 files to your server to enable debugging:

## 1. packages/workdo/Pos/src/Routes/web.php
Location: `/home/pryro.eastgatehotel.rw/public_html/packages/workdo/Pos/src/Routes/web.php`

## 2. packages/workdo/Pos/src/Resources/js/Pages/Pos/Create.tsx
Location: `/home/pryro.eastgatehotel.rw/public_html/packages/workdo/Pos/src/Resources/js/Pages/Pos/Create.tsx`

## 3. packages/workdo/Pos/src/Http/Controllers/PosController.php
Location: `/home/pryro.eastgatehotel.rw/public_html/packages/workdo/Pos/src/Http/Controllers/PosController.php`

---

## After uploading, run these commands on the server:

```bash
cd /home/pryro.eastgatehotel.rw/public_html

# Clear caches
php artisan optimize:clear

# Rebuild frontend
npm run build

# Watch logs
tail -f storage/logs/laravel.log
```

---

## Then test in browser:

1. Open https://pryro.eastgatehotel.rw/pos/create
2. Press F12 to open DevTools
3. Go to Console tab
4. Create a POS order with notes
5. You should see "=== POS ORDER DATA ===" in console
6. Check the SSH terminal - you should see "=== POS STORE REQUEST ===" in logs

# QUICK CYBERPANEL DEPLOYMENT GUIDE

## 🎯 FASTEST WAY TO DEPLOY (5 MINUTES)

### STEP 1: Upload Files via CyberPanel File Manager

1. **Login to CyberPanel**: `https://your-server-ip:8090`

2. **Go to File Manager**:
   - Click **"File Manager"** in left sidebar
   - Navigate to: `/home/your-domain.com/public_html/packages/workdo/Pos/src/`

3. **Upload Models** (4 files):
   - Click on **"Models"** folder
   - Click **"Upload"** button (top right)
   - Select and upload:
     - `RoomType.php`
     - `Room.php`
     - `RoomBooking.php`
     - `RoomBookingPayment.php`

4. **Upload Controllers** (3 files):
   - Go back, click **"Http"** → **"Controllers"**
   - Click **"Upload"**
   - Select and upload:
     - `RoomTypeController.php`
     - `RoomController.php`
     - `RoomBookingController.php`

5. **Upload Migrations** (4 files):
   - Go back, click **"Database"** → **"Migrations"**
   - Click **"Upload"**
   - Select and upload:
     - `2025_09_30_000004_create_room_types_table.php`
     - `2025_09_30_000005_create_rooms_table.php`
     - `2025_09_30_000006_create_room_bookings_table.php`
     - `2025_09_30_000007_create_room_booking_payments_table.php`

6. **Update Routes**:
   - Go back, click **"Routes"** folder
   - Right-click on **"web.php"** → **"Download"** (backup)
   - Delete old **"web.php"**
   - Click **"Upload"** → Upload new **"web.php"**

---

### STEP 2: Run Migrations via CyberPanel Terminal

1. **Open Terminal**:
   - In CyberPanel, click **"Terminal"** in left sidebar
   - Click **"SSH Terminal"**

2. **Navigate to your project**:
   ```bash
   cd /home/your-domain.com/public_html
   ```

3. **Run migrations**:
   ```bash
   php artisan migrate
   ```
   - Type `yes` when asked

4. **Clear cache**:
   ```bash
   php artisan cache:clear
   php artisan config:clear
   php artisan route:clear
   php artisan optimize
   ```

---

### STEP 3: Add Permissions

1. **Still in Terminal**, run:
   ```bash
   php artisan tinker
   ```

2. **Copy and paste this entire block**:
   ```php
   $permissions = ['manage-room-types','create-room-types','edit-room-types','delete-room-types','manage-rooms','create-rooms','edit-rooms','delete-rooms','view-rooms','manage-room-bookings','create-room-bookings','view-room-bookings'];
   foreach ($permissions as $permission) {
       \Spatie\Permission\Models\Permission::firstOrCreate(['name' => $permission, 'guard_name' => 'web']);
   }
   $role = \Spatie\Permission\Models\Role::where('name', 'superadmin')->first();
   if ($role) { $role->givePermissionTo($permissions); }
   echo "Permissions added successfully!";
   exit;
   ```

3. **Press Enter**

---

### STEP 4: Verify Installation

1. **Check Database**:
   - CyberPanel → **"Databases"** → **"phpMyAdmin"**
   - Select your database
   - You should see 4 new tables:
     - `room_types`
     - `rooms`
     - `room_bookings`
     - `room_booking_payments`

2. **Test in Browser**:
   - Visit: `https://your-domain.com/room-types`
   - You should see a page (might be empty, that's OK!)

---

## ✅ DONE! Backend is Live

**What's Working:**
- ✅ Database tables created
- ✅ Models uploaded
- ✅ Controllers uploaded
- ✅ Routes configured
- ✅ Permissions added

**What's Next:**
- Need to create frontend React pages (I can do this next!)
- Then you can start adding room types and rooms

---

## 🔧 IF SOMETHING GOES WRONG

### Error: "Class not found"
**Fix in Terminal**:
```bash
cd /home/your-domain.com/public_html
composer dump-autoload
php artisan optimize:clear
```

### Error: "Permission denied"
**Fix in Terminal**:
```bash
cd /home/your-domain.com/public_html
chmod -R 775 storage bootstrap/cache
chown -R your-username:your-username storage bootstrap/cache
```

### Error: "Route not found"
**Fix in Terminal**:
```bash
cd /home/your-domain.com/public_html
php artisan route:cache
php artisan config:cache
```

### Can't access Terminal?
**Alternative - Use SSH Client**:
1. Download **PuTTY** (Windows) or use **Terminal** (Mac/Linux)
2. Connect to: `your-server-ip` (Port 22)
3. Login with your credentials
4. Run the same commands

---

## 📁 FILE LOCATIONS REFERENCE

```
/home/your-domain.com/public_html/
├── packages/
│   └── workdo/
│       └── Pos/
│           └── src/
│               ├── Models/
│               │   ├── RoomType.php ← Upload here
│               │   ├── Room.php ← Upload here
│               │   ├── RoomBooking.php ← Upload here
│               │   └── RoomBookingPayment.php ← Upload here
│               ├── Http/
│               │   └── Controllers/
│               │       ├── RoomTypeController.php ← Upload here
│               │       ├── RoomController.php ← Upload here
│               │       └── RoomBookingController.php ← Upload here
│               ├── Database/
│               │   └── Migrations/
│               │       ├── 2025_09_30_000004_create_room_types_table.php ← Upload here
│               │       ├── 2025_09_30_000005_create_rooms_table.php ← Upload here
│               │       ├── 2025_09_30_000006_create_room_bookings_table.php ← Upload here
│               │       └── 2025_09_30_000007_create_room_booking_payments_table.php ← Upload here
│               └── Routes/
│                   └── web.php ← Replace this file
```

---

## 🎬 WHAT TO DO AFTER DEPLOYMENT

1. **Login to your system** as admin

2. **You won't see menu items yet** because frontend pages aren't created

3. **Test backend by visiting URLs directly**:
   - `https://your-domain.com/room-types` (should load, might be blank)
   - `https://your-domain.com/rooms` (should load, might be blank)
   - `https://your-domain.com/room-bookings` (should load, might be blank)

4. **If pages load without errors** = Backend is working! ✅

5. **Next step**: Create frontend React pages (I'll do this for you)

---

## 💡 IMPORTANT TIPS

1. **Always backup before uploading** (Download existing files first)
2. **Test on localhost first** if possible
3. **Clear cache after every change**
4. **Check error logs** if something breaks:
   - CyberPanel → File Manager → `storage/logs/laravel.log`

---

## 🆘 NEED HELP?

**Check Logs**:
1. CyberPanel → **File Manager**
2. Navigate to: `storage/logs/`
3. Open: `laravel.log`
4. Look at the last few lines for errors

**Common Issues**:
- **500 Error** = Check permissions and logs
- **404 Error** = Clear route cache
- **Class not found** = Run composer dump-autoload
- **Database error** = Check .env database credentials

---

**Ready? Start with STEP 1 above! 🚀**

**After deployment, let me know and I'll create the frontend pages!**

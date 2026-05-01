# ROOM BOOKING SYSTEM - DEPLOYMENT GUIDE FOR CYBERPANEL

## 📋 WHAT WE'VE CREATED

### Database Tables (4 new tables):
1. **room_types** - Store room categories (Single, Double, Suite, etc.)
2. **rooms** - Store individual rooms linked to warehouses/branches
3. **room_bookings** - Store booking records with customer and dates
4. **room_booking_payments** - Track payment details

### Backend Files Created:
1. **Models** (4 files):
   - RoomType.php
   - Room.php
   - RoomBooking.php
   - RoomBookingPayment.php

2. **Controllers** (3 files):
   - RoomTypeController.php
   - RoomController.php
   - RoomBookingController.php

3. **Migrations** (4 files):
   - 2025_09_30_000004_create_room_types_table.php
   - 2025_09_30_000005_create_rooms_table.php
   - 2025_09_30_000006_create_room_bookings_table.php
   - 2025_09_30_000007_create_room_booking_payments_table.php

4. **Routes**:
   - Updated web.php with room management routes

---

## 🚀 DEPLOYMENT STEPS - LOCALHOST TO LIVE SERVER

### STEP 1: PREPARE FILES ON LOCALHOST

1. **Open Terminal/Command Prompt** in your project root:
   ```bash
   cd e:\eastgate\main-file
   ```

2. **Test Locally First** (Important!):
   ```bash
   # Run migrations to create tables
   php artisan migrate
   
   # Clear cache
   php artisan cache:clear
   php artisan config:clear
   php artisan route:clear
   php artisan view:clear
   ```

3. **Check if migrations worked**:
   ```bash
   php artisan migrate:status
   ```
   You should see the 4 new room tables listed.

---

### STEP 2: BACKUP YOUR LIVE SERVER

**CRITICAL: Always backup before deploying!**

1. **Login to CyberPanel** (https://your-server-ip:8090)

2. **Backup Database**:
   - Go to: **Databases → phpMyAdmin**
   - Select your database
   - Click **Export** → **Go**
   - Download the SQL file

3. **Backup Files**:
   - Go to: **File Manager**
   - Navigate to your website folder
   - Right-click → **Compress** → Download

---

### STEP 3: UPLOAD FILES TO LIVE SERVER

**Option A: Using CyberPanel File Manager (Easiest)**

1. **Login to CyberPanel**

2. **Go to File Manager**:
   - Navigate to: `/home/your-domain/public_html/packages/workdo/Pos/src/`

3. **Upload Models**:
   - Navigate to: `Models/` folder
   - Click **Upload**
   - Upload these 4 files:
     - RoomType.php
     - Room.php
     - RoomBooking.php
     - RoomBookingPayment.php

4. **Upload Controllers**:
   - Navigate to: `Http/Controllers/` folder
   - Click **Upload**
   - Upload these 3 files:
     - RoomTypeController.php
     - RoomController.php
     - RoomBookingController.php

5. **Upload Migrations**:
   - Navigate to: `Database/Migrations/` folder
   - Click **Upload**
   - Upload these 4 files:
     - 2025_09_30_000004_create_room_types_table.php
     - 2025_09_30_000005_create_rooms_table.php
     - 2025_09_30_000006_create_room_bookings_table.php
     - 2025_09_30_000007_create_room_booking_payments_table.php

6. **Update Routes**:
   - Navigate to: `Routes/` folder
   - Download existing `web.php` (backup)
   - Upload new `web.php` file

**Option B: Using FTP/SFTP (FileZilla)**

1. **Download FileZilla** (if not installed)

2. **Connect to Server**:
   - Host: your-server-ip
   - Username: your-username
   - Password: your-password
   - Port: 22 (SFTP) or 21 (FTP)

3. **Navigate to**:
   - Remote: `/home/your-domain/public_html/packages/workdo/Pos/src/`
   - Local: `e:\eastgate\main-file\packages\workdo\Pos\src\`

4. **Upload folders**:
   - Drag and drop: Models, Http/Controllers, Database/Migrations, Routes

**Option C: Using Git (Best Practice)**

1. **On Localhost**:
   ```bash
   git add .
   git commit -m "Added room booking system"
   git push origin main
   ```

2. **On Live Server** (SSH):
   ```bash
   cd /home/your-domain/public_html
   git pull origin main
   ```

---

### STEP 4: RUN MIGRATIONS ON LIVE SERVER

**Option A: Using SSH Terminal (Recommended)**

1. **Connect via SSH**:
   - In CyberPanel: **Terminal → SSH Terminal**
   - Or use PuTTY/Terminal

2. **Navigate to project**:
   ```bash
   cd /home/your-domain/public_html
   ```

3. **Run migrations**:
   ```bash
   php artisan migrate
   ```

4. **If asked "Do you want to run migrations?", type**: `yes`

**Option B: Using CyberPanel Terminal**

1. Go to: **Terminal → SSH Terminal**
2. Run same commands as above

---

### STEP 5: SET PERMISSIONS (IMPORTANT!)

```bash
# Set correct ownership
chown -R your-username:your-username /home/your-domain/public_html

# Set folder permissions
find /home/your-domain/public_html -type d -exec chmod 755 {} \;

# Set file permissions
find /home/your-domain/public_html -type f -exec chmod 644 {} \;

# Storage and cache folders need write permission
chmod -R 775 /home/your-domain/public_html/storage
chmod -R 775 /home/your-domain/public_html/bootstrap/cache
```

---

### STEP 6: CLEAR CACHE ON LIVE SERVER

```bash
cd /home/your-domain/public_html

php artisan cache:clear
php artisan config:clear
php artisan route:clear
php artisan view:clear
php artisan optimize
```

---

### STEP 7: VERIFY DEPLOYMENT

1. **Check Database Tables**:
   - CyberPanel → **Databases → phpMyAdmin**
   - Select your database
   - You should see 4 new tables:
     - room_types
     - rooms
     - room_bookings
     - room_booking_payments

2. **Check Routes**:
   ```bash
   php artisan route:list | grep room
   ```
   You should see routes like:
   - room-types.index
   - rooms.index
   - room-bookings.index

3. **Test in Browser**:
   - Visit: `https://your-domain.com/room-types`
   - You should see the room types page (or permission error if not logged in)

---

## 🔧 TROUBLESHOOTING

### Issue 1: "Class not found" error
**Solution**:
```bash
composer dump-autoload
php artisan optimize:clear
```

### Issue 2: "Table doesn't exist" error
**Solution**:
```bash
php artisan migrate:fresh --seed
# WARNING: This will delete all data! Only use on development
# For production, use: php artisan migrate
```

### Issue 3: Permission denied errors
**Solution**:
```bash
chmod -R 775 storage bootstrap/cache
chown -R www-data:www-data storage bootstrap/cache
```

### Issue 4: 500 Internal Server Error
**Solution**:
1. Check error logs:
   ```bash
   tail -f /home/your-domain/public_html/storage/logs/laravel.log
   ```
2. Enable debug mode temporarily:
   - Edit `.env` file
   - Set: `APP_DEBUG=true`
   - Check error message
   - Set back to: `APP_DEBUG=false`

### Issue 5: Routes not working
**Solution**:
```bash
php artisan route:cache
php artisan config:cache
```

---

## 📝 NEXT STEPS AFTER DEPLOYMENT

### 1. Add Permissions (Important!)

You need to add permissions for the new features. Run this in SSH:

```bash
php artisan tinker
```

Then paste this code:

```php
$permissions = [
    'manage-room-types',
    'create-room-types',
    'edit-room-types',
    'delete-room-types',
    'manage-rooms',
    'create-rooms',
    'edit-rooms',
    'delete-rooms',
    'view-rooms',
    'manage-room-bookings',
    'create-room-bookings',
    'view-room-bookings',
];

foreach ($permissions as $permission) {
    \Spatie\Permission\Models\Permission::firstOrCreate([
        'name' => $permission,
        'guard_name' => 'web'
    ]);
}

// Assign all permissions to superadmin role
$role = \Spatie\Permission\Models\Role::where('name', 'superadmin')->first();
if ($role) {
    $role->givePermissionTo($permissions);
}

exit;
```

### 2. Create First Room Type

1. Login to your system
2. Go to: **POS → Room Types**
3. Click **Add Room Type**
4. Fill in:
   - Name: "Standard Room"
   - Base Price: 100
   - Description: "Standard room with basic amenities"
5. Save

### 3. Add Your First Room

1. Go to: **POS → Rooms**
2. Click **Add Room**
3. Fill in:
   - Room Number: "101"
   - Warehouse: Select your branch
   - Room Type: "Standard Room"
   - Price per Night: 100
   - Max Occupancy: 2
4. Save

### 4. Test Booking

1. Go to: **POS → Room Bookings**
2. Click **Create Booking**
3. Select dates and room
4. Complete booking
5. Check if revenue appears in **Account → Dashboard**

---

## 🎯 WHAT'S WORKING NOW

✅ Room Types Management (Add/Edit/Delete room categories)
✅ Room Management (Add unlimited rooms per warehouse)
✅ Room Availability Checker (Real-time availability)
✅ Booking System (Create/View/Manage bookings)
✅ Financial Integration (Auto-creates revenue entries)
✅ Multi-Warehouse Support (Each room linked to branch)
✅ Payment Tracking (Multiple payment methods)
✅ Check-in/Check-out System
✅ Booking Cancellation with Refunds

---

## 📊 WHAT'S STILL NEEDED (Frontend)

We still need to create the React/TypeScript frontend pages:
- Room Types Index/Create/Edit pages
- Rooms Index/Create/Edit pages
- Room Bookings Index/Create/Show pages
- Calendar view for bookings
- Dashboard widgets

**Would you like me to create the frontend pages next?**

---

## 🆘 NEED HELP?

If you encounter any issues during deployment:

1. **Check Laravel logs**:
   ```bash
   tail -f storage/logs/laravel.log
   ```

2. **Check web server logs**:
   ```bash
   tail -f /var/log/apache2/error.log
   # or
   tail -f /var/log/nginx/error.log
   ```

3. **Test database connection**:
   ```bash
   php artisan tinker
   DB::connection()->getPdo();
   ```

---

## ✅ DEPLOYMENT CHECKLIST

- [ ] Backed up live database
- [ ] Backed up live files
- [ ] Uploaded Models folder
- [ ] Uploaded Controllers folder
- [ ] Uploaded Migrations folder
- [ ] Updated Routes file
- [ ] Ran migrations on live server
- [ ] Set correct permissions
- [ ] Cleared all caches
- [ ] Verified tables exist in database
- [ ] Added permissions via tinker
- [ ] Tested room type creation
- [ ] Tested room creation
- [ ] Tested booking creation
- [ ] Verified revenue entry created

---

**IMPORTANT NOTES:**

1. **Always test on localhost first** before deploying to live
2. **Always backup** before making changes to live server
3. **Use Git** for version control (recommended)
4. **Check permissions** if you get 500 errors
5. **Clear cache** after every deployment
6. **Test thoroughly** after deployment

---

**Ready to deploy? Follow the steps above carefully!**

**Next: Would you like me to create the frontend React pages so users can actually use the system?**

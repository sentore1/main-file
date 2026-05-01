# ROOM BOOKING SYSTEM - DEPLOYMENT CHECKLIST

## ✅ PRE-DEPLOYMENT CHECKLIST (LOCALHOST)

### Files Created (Verify All Exist)
- [ ] `packages/workdo/Pos/src/Models/RoomType.php`
- [ ] `packages/workdo/Pos/src/Models/Room.php`
- [ ] `packages/workdo/Pos/src/Models/RoomBooking.php`
- [ ] `packages/workdo/Pos/src/Models/RoomBookingPayment.php`
- [ ] `packages/workdo/Pos/src/Http/Controllers/RoomTypeController.php`
- [ ] `packages/workdo/Pos/src/Http/Controllers/RoomController.php`
- [ ] `packages/workdo/Pos/src/Http/Controllers/RoomBookingController.php`
- [ ] `packages/workdo/Pos/src/Database/Migrations/2025_09_30_000004_create_room_types_table.php`
- [ ] `packages/workdo/Pos/src/Database/Migrations/2025_09_30_000005_create_rooms_table.php`
- [ ] `packages/workdo/Pos/src/Database/Migrations/2025_09_30_000006_create_room_bookings_table.php`
- [ ] `packages/workdo/Pos/src/Database/Migrations/2025_09_30_000007_create_room_booking_payments_table.php`
- [ ] `packages/workdo/Pos/src/Routes/web.php` (updated)

### Test on Localhost
- [ ] Run: `php artisan migrate`
- [ ] Check: All 4 tables created in database
- [ ] Run: `php artisan route:list | grep room`
- [ ] Verify: Routes are registered
- [ ] Run: `php artisan cache:clear`
- [ ] Run: `php artisan config:clear`
- [ ] No errors in terminal

---

## 📦 BACKUP CHECKLIST (BEFORE DEPLOYMENT)

### Live Server Backup
- [ ] Login to CyberPanel
- [ ] Backup database via phpMyAdmin (Export SQL)
- [ ] Download backup file (save with date: `backup_2025-01-15.sql`)
- [ ] Backup files via File Manager (Compress & Download)
- [ ] Save backups to safe location (external drive/cloud)
- [ ] Verify backup files are not corrupted (can open them)

### Document Current State
- [ ] Note current Laravel version
- [ ] Note current PHP version
- [ ] Note current database name
- [ ] Take screenshot of current system working
- [ ] List any custom modifications made

---

## 🚀 DEPLOYMENT CHECKLIST (LIVE SERVER)

### Step 1: Upload Files
- [ ] Login to CyberPanel File Manager
- [ ] Navigate to: `/home/your-domain/public_html/packages/workdo/Pos/src/`
- [ ] Upload Models folder (4 files)
- [ ] Upload Http/Controllers folder (3 files)
- [ ] Upload Database/Migrations folder (4 files)
- [ ] Backup old Routes/web.php
- [ ] Upload new Routes/web.php
- [ ] Verify all files uploaded successfully
- [ ] Check file sizes match localhost files

### Step 2: Run Migrations
- [ ] Open CyberPanel Terminal (or SSH)
- [ ] Navigate: `cd /home/your-domain/public_html`
- [ ] Run: `php artisan migrate`
- [ ] Type: `yes` when prompted
- [ ] Check for success message
- [ ] No error messages displayed

### Step 3: Verify Database
- [ ] Open phpMyAdmin
- [ ] Select your database
- [ ] Verify table exists: `room_types`
- [ ] Verify table exists: `rooms`
- [ ] Verify table exists: `room_bookings`
- [ ] Verify table exists: `room_booking_payments`
- [ ] Check table structures are correct
- [ ] All foreign keys created properly

### Step 4: Set Permissions
- [ ] Run: `chmod -R 775 storage`
- [ ] Run: `chmod -R 775 bootstrap/cache`
- [ ] Run: `chown -R username:username storage`
- [ ] Run: `chown -R username:username bootstrap/cache`
- [ ] No permission errors

### Step 5: Clear Cache
- [ ] Run: `php artisan cache:clear`
- [ ] Run: `php artisan config:clear`
- [ ] Run: `php artisan route:clear`
- [ ] Run: `php artisan view:clear`
- [ ] Run: `php artisan optimize`
- [ ] All commands successful

### Step 6: Add Permissions
- [ ] Run: `php artisan tinker`
- [ ] Paste permission creation code
- [ ] Press Enter
- [ ] See: "Permissions added successfully!"
- [ ] Type: `exit`
- [ ] No errors

### Step 7: Verify Routes
- [ ] Run: `php artisan route:list | grep room`
- [ ] Verify routes listed:
  - [ ] room-types.index
  - [ ] room-types.create
  - [ ] room-types.store
  - [ ] room-types.edit
  - [ ] room-types.update
  - [ ] room-types.destroy
  - [ ] rooms.index
  - [ ] rooms.create
  - [ ] rooms.store
  - [ ] rooms.edit
  - [ ] rooms.update
  - [ ] rooms.destroy
  - [ ] room-bookings.index
  - [ ] room-bookings.create
  - [ ] room-bookings.store
  - [ ] room-bookings.show
  - [ ] room-bookings.calendar
  - [ ] room-bookings.available-rooms
  - [ ] room-bookings.check-in
  - [ ] room-bookings.check-out
  - [ ] room-bookings.cancel

---

## 🧪 TESTING CHECKLIST (POST-DEPLOYMENT)

### Basic Tests
- [ ] Visit: `https://your-domain.com`
- [ ] Site loads without errors
- [ ] Login as admin
- [ ] No 500 errors
- [ ] No 404 errors

### Backend Tests
- [ ] Visit: `https://your-domain.com/room-types`
- [ ] Page loads (may be empty, that's OK)
- [ ] Visit: `https://your-domain.com/rooms`
- [ ] Page loads (may be empty, that's OK)
- [ ] Visit: `https://your-domain.com/room-bookings`
- [ ] Page loads (may be empty, that's OK)
- [ ] No PHP errors displayed
- [ ] No database connection errors

### Database Tests
- [ ] Open phpMyAdmin
- [ ] Run query: `SELECT * FROM room_types;`
- [ ] Query executes successfully
- [ ] Run query: `SELECT * FROM rooms;`
- [ ] Query executes successfully
- [ ] Run query: `SELECT * FROM room_bookings;`
- [ ] Query executes successfully
- [ ] Run query: `SELECT * FROM room_booking_payments;`
- [ ] Query executes successfully

### Permission Tests
- [ ] Login as admin
- [ ] Check user has permissions
- [ ] Run in tinker: `auth()->user()->getAllPermissions()`
- [ ] Verify room permissions listed

---

## 🔍 TROUBLESHOOTING CHECKLIST

### If You See Errors

#### "Class not found" Error
- [ ] Run: `composer dump-autoload`
- [ ] Run: `php artisan optimize:clear`
- [ ] Refresh browser

#### "Table doesn't exist" Error
- [ ] Check database in phpMyAdmin
- [ ] Run: `php artisan migrate:status`
- [ ] If not migrated, run: `php artisan migrate`

#### "Permission denied" Error
- [ ] Check file permissions: `ls -la storage`
- [ ] Fix permissions: `chmod -R 775 storage`
- [ ] Fix ownership: `chown -R username:username storage`

#### "Route not found" Error
- [ ] Run: `php artisan route:cache`
- [ ] Run: `php artisan config:cache`
- [ ] Refresh browser

#### "500 Internal Server Error"
- [ ] Check logs: `tail -f storage/logs/laravel.log`
- [ ] Enable debug: Set `APP_DEBUG=true` in `.env`
- [ ] Check error message
- [ ] Fix issue
- [ ] Set `APP_DEBUG=false` again

---

## 📝 POST-DEPLOYMENT TASKS

### Immediate Tasks
- [ ] Test creating a room type
- [ ] Test creating a room
- [ ] Test creating a booking (when frontend ready)
- [ ] Verify revenue entry created
- [ ] Check Account dashboard shows revenue

### Configuration Tasks
- [ ] Set correct tax rate in RoomBookingController (line 186)
- [ ] Configure default bank account if needed
- [ ] Set up email notifications (optional)
- [ ] Configure backup schedule

### Documentation Tasks
- [ ] Document any custom changes made
- [ ] Note any issues encountered
- [ ] Record solutions to problems
- [ ] Update team on new features

---

## 🎯 SUCCESS CRITERIA

### Deployment is Successful When:
- [ ] All files uploaded without errors
- [ ] All migrations ran successfully
- [ ] All 4 tables exist in database
- [ ] All routes are registered
- [ ] No errors in Laravel logs
- [ ] Backend pages load (even if empty)
- [ ] Permissions are added
- [ ] Cache is cleared
- [ ] Site still works normally

### Ready for Frontend When:
- [ ] All backend tests pass
- [ ] Can access room-types URL
- [ ] Can access rooms URL
- [ ] Can access room-bookings URL
- [ ] Database queries work
- [ ] No console errors

---

## 📞 SUPPORT CHECKLIST

### Before Asking for Help
- [ ] Checked Laravel logs
- [ ] Checked web server logs
- [ ] Cleared all caches
- [ ] Verified file permissions
- [ ] Tested database connection
- [ ] Reviewed error messages
- [ ] Tried troubleshooting steps

### Information to Provide
- [ ] Exact error message
- [ ] Laravel version
- [ ] PHP version
- [ ] What you were doing when error occurred
- [ ] Contents of laravel.log (last 50 lines)
- [ ] Screenshot of error (if applicable)

---

## 🎉 COMPLETION CHECKLIST

### Backend Deployment Complete When:
- [ ] ✅ All files uploaded
- [ ] ✅ All migrations successful
- [ ] ✅ All tables created
- [ ] ✅ All routes working
- [ ] ✅ Permissions added
- [ ] ✅ Cache cleared
- [ ] ✅ Tests passed
- [ ] ✅ No errors

### Ready for Next Phase:
- [ ] ✅ Backend fully functional
- [ ] ✅ Database structure complete
- [ ] ✅ API endpoints working
- [ ] ✅ Financial integration active
- [ ] ✅ Ready for frontend development

---

## 📅 TIMELINE

**Estimated Time:**
- File Upload: 10 minutes
- Run Migrations: 2 minutes
- Set Permissions: 3 minutes
- Clear Cache: 2 minutes
- Add Permissions: 3 minutes
- Testing: 10 minutes
- **Total: ~30 minutes**

---

## 🚨 ROLLBACK PLAN (IF NEEDED)

### If Deployment Fails:
1. [ ] Stop deployment immediately
2. [ ] Restore database from backup
3. [ ] Restore files from backup
4. [ ] Clear cache
5. [ ] Verify site works normally
6. [ ] Review what went wrong
7. [ ] Fix issues on localhost
8. [ ] Try deployment again

### Rollback Commands:
```bash
# Restore database
mysql -u username -p database_name < backup_2025-01-15.sql

# Restore files (if needed)
# Delete uploaded files and restore from backup

# Clear cache
php artisan cache:clear
php artisan config:clear
php artisan route:clear
```

---

**PRINT THIS CHECKLIST AND CHECK OFF ITEMS AS YOU GO!**

**Good luck with your deployment! 🚀**

# Late Checkout Alert System - Quick Start

## ✅ What Was Created

### 1. Backend Files
- ✅ `app/Console/Commands/CheckLateCheckouts.php` - Command to check late checkouts
- ✅ `app/Notifications/LateCheckoutNotification.php` - Email & database notifications
- ✅ `app/Console/Kernel.php` - Scheduler configured (runs hourly)

### 2. Frontend Files
- ✅ `packages/workdo/Pos/src/Resources/js/components/LateCheckoutAlert.tsx` - Dashboard alert widget
- ✅ `packages/workdo/Pos/src/Resources/js/components/LateCheckoutBadge.tsx` - Notification badge
- ✅ Updated Dashboard Controller with late checkout data
- ✅ Updated Dashboard Index to display alerts

## 🚀 Next Steps

### Step 1: Compile Frontend Assets
```bash
npm run build
```
Or for development:
```bash
npm run dev
```

### Step 2: Test the System

#### Option A: Create Test Data (Recommended)
```bash
php artisan tinker
```

Then paste this code:
```php
\Workdo\Pos\Models\RoomBooking::create([
    'booking_number' => '#BOOK99999',
    'room_id' => 1,
    'warehouse_id' => 1,
    'check_in_date' => now()->subDays(5),
    'check_out_date' => now()->subDays(2),
    'total_nights' => 3,
    'status' => 'checked_in',
    'subtotal' => 300,
    'total_amount' => 300,
    'created_by' => 1
]);
```

#### Option B: Run Command Manually
```bash
php artisan bookings:check-late-checkouts
```

### Step 3: View the Dashboard
1. Login to your application
2. Navigate to the POS Dashboard
3. You should see a RED ALERT CARD at the top if there are late checkouts

### Step 4: Setup Cron (Production Only)
Add to your server's crontab:
```bash
* * * * * cd /path-to-your-project && php artisan schedule:run >> /dev/null 2>&1
```

## 📊 What You'll See

### Dashboard Alert
- Red alert card at the top of the dashboard
- Shows all late checkouts with:
  - Booking number
  - Customer name
  - Room number
  - Days overdue (color-coded)
  - Quick action buttons (View/Checkout)

### Notifications
- Email sent to customer
- Email sent to all super admins
- Database notification for in-app alerts

## 🎨 Features

✅ **Automatic Detection** - Runs every hour
✅ **Real-time Dashboard Alert** - Shows immediately on dashboard
✅ **Color-Coded Severity** - 1 day = yellow, 3+ days = red
✅ **Email Notifications** - To customers and staff
✅ **Quick Actions** - View or checkout directly from alert
✅ **Responsive Design** - Works on all devices

## 🔧 Configuration

### Change Schedule Frequency
Edit `app/Console/Kernel.php` line 14:

```php
// Current: Every hour
$schedule->command('bookings:check-late-checkouts')->hourly();

// Options:
// ->everyThirtyMinutes()
// ->twiceDaily(10, 16)
// ->dailyAt('09:00')
```

### Customize Alert Severity
Edit `packages/workdo/Pos/src/Resources/js/components/LateCheckoutAlert.tsx` line 28:

```tsx
const getSeverityColor = (daysLate: number) => {
    if (daysLate >= 3) return 'destructive'; // Change 3 to your preference
    if (daysLate >= 1) return 'warning';     // Change 1 to your preference
    return 'default';
};
```

## 🐛 Troubleshooting

### Alert Not Showing?
1. Run: `npm run build`
2. Clear cache: `php artisan cache:clear`
3. Refresh browser (Ctrl+F5)

### Command Not Working?
```bash
# Check if command exists
php artisan list | grep bookings

# Should show: bookings:check-late-checkouts
```

### No Test Data?
Make sure you have:
- At least one room in the database
- At least one warehouse in the database
- Replace `room_id` and `warehouse_id` with actual IDs

## 📝 How It Works

1. **Scheduler** runs every hour
2. **Command** checks for bookings where:
   - Checkout date has passed
   - Status is still 'confirmed' or 'checked_in'
3. **Notifications** sent to customers and admins
4. **Dashboard** displays red alert card with all late checkouts
5. **Staff** can click "View" or "Checkout" to take action

## 🎯 Success Criteria

You'll know it's working when:
- ✅ Command runs without errors
- ✅ Red alert card appears on dashboard
- ✅ Email notifications are sent
- ✅ Database notifications are created

## 📞 Need Help?

Check the full documentation: `LATE_CHECKOUT_ALERT_SYSTEM.md`

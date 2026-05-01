# Late Checkout Alert System

## Overview
This system automatically detects and alerts staff when hotel guests have not checked out by their scheduled checkout date.

## Features
✅ Automated hourly checks for late checkouts
✅ Email notifications to customers and staff
✅ Database notifications for in-app alerts
✅ Dashboard widget with real-time alerts
✅ Color-coded severity indicators (1 day = warning, 3+ days = critical)
✅ Quick action buttons (View/Checkout)
✅ Notification badge in header

## Files Created

### Backend
1. `app/Console/Commands/CheckLateCheckouts.php` - Scheduled command to check late checkouts
2. `app/Notifications/LateCheckoutNotification.php` - Notification class for alerts
3. `app/Console/Kernel.php` - Updated with scheduler configuration

### Frontend
1. `packages/workdo/Pos/src/Resources/js/components/LateCheckoutAlert.tsx` - Dashboard alert widget
2. `packages/workdo/Pos/src/Resources/js/components/LateCheckoutBadge.tsx` - Header notification badge
3. `packages/workdo/Pos/src/Http/Controllers/DashboardController.php` - Updated with late checkout data
4. `packages/workdo/Pos/src/Resources/js/Pages/Dashboard/Index.tsx` - Updated to display alerts

## Setup Instructions

### 1. Run Migrations (if needed)
```bash
php artisan migrate
```

### 2. Test the Command Manually
```bash
php artisan bookings:check-late-checkouts
```

### 3. Setup Cron Job (Production)
Add this to your server's crontab:
```bash
* * * * * cd /path-to-your-project && php artisan schedule:run >> /dev/null 2>&1
```

### 4. Compile Frontend Assets
```bash
npm run build
# or for development
npm run dev
```

## Testing

### Create Test Data
Use Laravel Tinker to create a late checkout booking:

```bash
php artisan tinker
```

```php
// Create a booking that's 2 days overdue
$booking = \Workdo\Pos\Models\RoomBooking::create([
    'booking_number' => '#BOOK00099',
    'room_id' => 1, // Use existing room ID
    'warehouse_id' => 1, // Use existing warehouse ID
    'check_in_date' => now()->subDays(5),
    'check_out_date' => now()->subDays(2), // 2 days ago
    'total_nights' => 3,
    'status' => 'checked_in', // Still checked in!
    'subtotal' => 300,
    'total_amount' => 300,
    'created_by' => 1
]);
```

### Verify the Alert
1. Run the command: `php artisan bookings:check-late-checkouts`
2. Check your email for notifications
3. Visit the dashboard to see the red alert card
4. Check database notifications: `SELECT * FROM notifications;`

## How It Works

### Scheduled Command
- Runs every hour (configurable in `app/Console/Kernel.php`)
- Queries bookings where:
  - `check_out_date` < today
  - `status` = 'confirmed' OR 'checked_in'
- Sends notifications to customers and admins
- Logs activity in console

### Dashboard Alert
- Displays at the top of the dashboard
- Shows booking number, customer, room, days late
- Color-coded badges based on severity
- Quick action buttons for viewing/checking out
- Auto-refreshes on page load

### Notifications
- **Email**: Sent to customer and all super admins
- **Database**: Stored for in-app notification center
- **Optional**: Can add SMS via Twilio (see customization)

## Customization

### Change Schedule Frequency
Edit `app/Console/Kernel.php`:

```php
// Every 30 minutes
$schedule->command('bookings:check-late-checkouts')->everyThirtyMinutes();

// Twice daily at 10 AM and 4 PM
$schedule->command('bookings:check-late-checkouts')->twiceDaily(10, 16);

// Every day at 9 AM
$schedule->command('bookings:check-late-checkouts')->dailyAt('09:00');
```

### Add SMS Notifications
Update `app/Notifications/LateCheckoutNotification.php`:

```php
public function via($notifiable): array
{
    return ['mail', 'database', 'twilio']; // Add twilio
}

public function toTwilio($notifiable)
{
    return (new TwilioSmsMessage())
        ->content("Late checkout alert: {$this->booking->booking_number} is {$this->daysLate} days overdue.");
}
```

### Add Grace Period
Update `app/Console/Commands/CheckLateCheckouts.php`:

```php
// Only alert after 2 hours past checkout time
$lateCheckouts = RoomBooking::with(['customer', 'room', 'warehouse'])
    ->where('check_out_date', '<', $today->subHours(2))
    ->whereIn('status', ['confirmed', 'checked_in'])
    ->get();
```

### Customize Alert Colors
Edit `packages/workdo/Pos/src/Resources/js/components/LateCheckoutAlert.tsx`:

```tsx
const getSeverityColor = (daysLate: number) => {
    if (daysLate >= 5) return 'destructive'; // 5+ days = critical
    if (daysLate >= 2) return 'warning';     // 2-4 days = warning
    return 'default';                         // 1 day = default
};
```

## Troubleshooting

### Command Not Running
```bash
# Check if command is registered
php artisan list | grep bookings

# Check scheduler
php artisan schedule:list

# Run scheduler manually
php artisan schedule:run
```

### No Alerts Showing
1. Check if there are late bookings: `SELECT * FROM room_bookings WHERE check_out_date < CURDATE() AND status IN ('confirmed', 'checked_in');`
2. Clear cache: `php artisan cache:clear`
3. Rebuild frontend: `npm run build`
4. Check browser console for errors

### Notifications Not Sending
1. Check mail configuration in `.env`
2. Test email: `php artisan tinker` then `Mail::raw('Test', function($msg) { $msg->to('test@example.com')->subject('Test'); });`
3. Check notification table: `SELECT * FROM notifications;`

## Future Enhancements

- [ ] Add automatic late checkout fees
- [ ] Send reminder before checkout time
- [ ] WhatsApp notifications
- [ ] Export late checkout reports
- [ ] Automatic room status updates
- [ ] Integration with payment system for penalties

## Support

For issues or questions, contact your development team.

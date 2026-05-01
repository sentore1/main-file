<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Workdo\Pos\Models\RoomBooking;
use Carbon\Carbon;

class DebugLateCheckouts extends Command
{
    protected $signature = 'bookings:debug-late-checkouts';
    protected $description = 'Debug late checkout detection';

    public function handle()
    {
        $this->info('=== Late Checkout Debug ===');
        $this->newLine();

        $today = Carbon::today();
        $this->info("Today's date: " . $today->format('Y-m-d'));
        $this->newLine();

        // Check all bookings
        $allBookings = RoomBooking::all();
        $this->info("Total bookings in database: " . $allBookings->count());
        $this->newLine();

        // Check bookings with status
        $confirmedOrCheckedIn = RoomBooking::whereIn('status', ['confirmed', 'checked_in'])->get();
        $this->info("Bookings with status 'confirmed' or 'checked_in': " . $confirmedOrCheckedIn->count());
        $this->newLine();

        // Check late checkouts
        $lateCheckouts = RoomBooking::where('check_out_date', '<', $today)
            ->whereIn('status', ['confirmed', 'checked_in'])
            ->get();

        $this->info("Late checkouts found: " . $lateCheckouts->count());
        $this->newLine();

        if ($lateCheckouts->count() > 0) {
            $this->info('=== Late Checkout Details ===');
            foreach ($lateCheckouts as $booking) {
                $this->line("Booking #: " . $booking->booking_number);
                $this->line("Status: " . $booking->status);
                $this->line("Check-out date: " . $booking->check_out_date->format('Y-m-d'));
                $this->line("Days late: " . $today->diffInDays($booking->check_out_date));
                $this->line("Customer: " . ($booking->customer->name ?? 'N/A'));
                $this->line("Room: " . ($booking->room->room_number ?? 'N/A'));
                $this->line("Created by: " . $booking->created_by);
                $this->line("---");
            }
        } else {
            $this->warn("No late checkouts found.");
            $this->newLine();
            
            if ($allBookings->count() > 0) {
                $this->info('=== All Bookings ===');
                foreach ($allBookings as $booking) {
                    $this->line("Booking #: " . $booking->booking_number);
                    $this->line("Status: " . $booking->status);
                    $this->line("Check-out date: " . $booking->check_out_date->format('Y-m-d'));
                    $this->line("Is late? " . ($booking->check_out_date < $today ? 'YES' : 'NO'));
                    $this->line("---");
                }
            }
        }

        $this->newLine();
        $this->info('=== Troubleshooting Tips ===');
        $this->line('1. Make sure you created a booking with check_out_date in the past');
        $this->line('2. Make sure the booking status is "confirmed" or "checked_in"');
        $this->line('3. Run: php artisan cache:clear');
        $this->line('4. Run: npm run build');
        $this->line('5. Check browser console for JavaScript errors');

        return 0;
    }
}

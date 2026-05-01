<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Workdo\Pos\Models\RoomBooking;
use App\Models\User;
use Illuminate\Support\Facades\Notification;
use Carbon\Carbon;

class CheckLateCheckouts extends Command
{
    protected $signature = 'bookings:check-late-checkouts';
    protected $description = 'Check for bookings with late checkouts and send alerts';

    public function handle()
    {
        $today = Carbon::today();
        
        $lateCheckouts = RoomBooking::with(['customer', 'room', 'warehouse'])
            ->where('check_out_date', '<', $today)
            ->whereIn('status', ['confirmed', 'checked_in'])
            ->get();

        if ($lateCheckouts->isEmpty()) {
            $this->info('No late checkouts found.');
            return 0;
        }

        foreach ($lateCheckouts as $booking) {
            $daysLate = $today->diffInDays($booking->check_out_date);
            
            // Send notification to customer
            if ($booking->customer) {
                $booking->customer->notify(new \App\Notifications\LateCheckoutNotification($booking, $daysLate));
            }
            
            // Send notification to hotel staff/admin
            $admins = User::role('super admin')->get();
            Notification::send($admins, new \App\Notifications\LateCheckoutNotification($booking, $daysLate));
            
            $this->info("Alert sent for booking {$booking->booking_number} - {$daysLate} days late");
        }

        $this->info("Processed {$lateCheckouts->count()} late checkout(s).");
        return 0;
    }
}

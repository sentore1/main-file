<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\MailMessage;
use Workdo\Pos\Models\RoomBooking;

class LateCheckoutNotification extends Notification
{
    use Queueable;

    public function __construct(
        public RoomBooking $booking,
        public int $daysLate
    ) {}

    public function via($notifiable): array
    {
        return ['mail', 'database'];
    }

    public function toMail($notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('Late Checkout Alert - ' . $this->booking->booking_number)
            ->line('Booking ' . $this->booking->booking_number . ' has not checked out.')
            ->line('Expected checkout: ' . $this->booking->check_out_date->format('Y-m-d'))
            ->line('Days overdue: ' . $this->daysLate)
            ->line('Customer: ' . ($this->booking->customer->name ?? 'N/A'))
            ->line('Room: ' . ($this->booking->room->room_number ?? 'N/A'))
            ->action('View Booking', url('/room-bookings/' . $this->booking->id))
            ->line('Please contact the customer or take necessary action.');
    }

    public function toArray($notifiable): array
    {
        return [
            'booking_id' => $this->booking->id,
            'booking_number' => $this->booking->booking_number,
            'check_out_date' => $this->booking->check_out_date,
            'days_late' => $this->daysLate,
            'customer_name' => $this->booking->customer->name ?? 'N/A',
            'room_number' => $this->booking->room->room_number ?? 'N/A',
        ];
    }
}

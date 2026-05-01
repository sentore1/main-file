<?php

namespace Workdo\Pos\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RoomBookingPayment extends Model
{
    protected $fillable = [
        'booking_id',
        'bank_account_id',
        'payment_method',
        'amount_paid',
        'payment_date',
        'payment_notes',
        'creator_id',
        'created_by'
    ];

    protected function casts(): array
    {
        return [
            'amount_paid' => 'decimal:2',
            'payment_date' => 'date',
        ];
    }

    public function booking(): BelongsTo
    {
        return $this->belongsTo(RoomBooking::class);
    }

    public function bankAccount(): BelongsTo
    {
        return $this->belongsTo(\Workdo\Account\Models\BankAccount::class);
    }
}

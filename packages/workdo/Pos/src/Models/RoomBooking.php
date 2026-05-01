<?php

namespace Workdo\Pos\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;
use App\Models\User;
use App\Models\Warehouse;

class RoomBooking extends Model
{
    protected $fillable = [
        'booking_number',
        'booking_group_id',
        'room_id',
        'customer_id',
        'warehouse_id',
        'check_in_date',
        'check_out_date',
        'total_nights',
        'number_of_guests',
        'includes_breakfast',
        'breakfast_price',
        'subtotal',
        'custom_price',
        'tax_amount',
        'discount',
        'total_amount',
        'notes',
        'item_notes',
        'status',
        'revenue_id',
        'creator_id',
        'created_by'
    ];

    protected function casts(): array
    {
        return [
            'check_in_date' => 'date',
            'check_out_date' => 'date',
            'total_nights' => 'integer',
            'number_of_guests' => 'integer',
            'includes_breakfast' => 'boolean',
            'breakfast_price' => 'decimal:2',
            'subtotal' => 'decimal:2',
            'custom_price' => 'decimal:2',
            'tax_amount' => 'decimal:2',
            'discount' => 'decimal:2',
            'total_amount' => 'decimal:2',
        ];
    }

    public function room(): BelongsTo
    {
        return $this->belongsTo(Room::class);
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'customer_id');
    }

    public function warehouse(): BelongsTo
    {
        return $this->belongsTo(Warehouse::class);
    }

    public function payment(): HasOne
    {
        return $this->hasOne(RoomBookingPayment::class, 'booking_id');
    }

    public function revenue(): BelongsTo
    {
        return $this->belongsTo(\Workdo\Account\Models\Revenue::class);
    }

    public function bookingGroup()
    {
        return $this->hasMany(RoomBooking::class, 'booking_group_id', 'booking_group_id');
    }

    public static function generateBookingGroupId()
    {
        return 'BG-' . time() . '-' . \Illuminate\Support\Str::random(6);
    }

    public static function generateBookingNumber()
    {
        // Get the highest booking number
        $lastBooking = self::where('created_by', creatorId())
            ->orderBy('booking_number', 'desc')
            ->first();
        
        if ($lastBooking && $lastBooking->booking_number) {
            // Extract number from format #BOOK00013
            $lastNumber = (int) substr($lastBooking->booking_number, 5);
            $nextNumber = $lastNumber + 1;
        } else {
            $nextNumber = 1;
        }
        
        // Ensure uniqueness - keep incrementing until we find an unused number
        $bookingNumber = '#BOOK' . str_pad($nextNumber, 5, '0', STR_PAD_LEFT);
        while (self::where('booking_number', $bookingNumber)->where('created_by', creatorId())->exists()) {
            $nextNumber++;
            $bookingNumber = '#BOOK' . str_pad($nextNumber, 5, '0', STR_PAD_LEFT);
        }
        
        return $bookingNumber;
    }

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($booking) {
            if (empty($booking->booking_number)) {
                $booking->booking_number = static::generateBookingNumber();
            }
        });
    }
}

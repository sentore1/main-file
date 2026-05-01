<?php

namespace Workdo\Pos\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Models\Warehouse;

class Room extends Model
{
    protected $fillable = [
        'room_number',
        'room_type_id',
        'warehouse_id',
        'floor',
        'price_per_night',
        'max_occupancy',
        'amenities',
        'description',
        'image',
        'status',
        'creator_id',
        'created_by'
    ];

    protected function casts(): array
    {
        return [
            'price_per_night' => 'decimal:2',
            'max_occupancy' => 'integer',
            'amenities' => 'array',
        ];
    }

    public function roomType(): BelongsTo
    {
        return $this->belongsTo(RoomType::class);
    }

    public function warehouse(): BelongsTo
    {
        return $this->belongsTo(Warehouse::class);
    }

    public function bookings(): HasMany
    {
        return $this->hasMany(RoomBooking::class);
    }

    public function isAvailable($checkIn, $checkOut): bool
    {
        if ($this->status === 'maintenance') {
            return false;
        }

        $conflictingBookings = $this->bookings()
            ->whereIn('status', ['confirmed', 'checked_in'])
            ->where(function($query) use ($checkIn, $checkOut) {
                $query->whereBetween('check_in_date', [$checkIn, $checkOut])
                      ->orWhereBetween('check_out_date', [$checkIn, $checkOut])
                      ->orWhere(function($q) use ($checkIn, $checkOut) {
                          $q->where('check_in_date', '<=', $checkIn)
                            ->where('check_out_date', '>=', $checkOut);
                      });
            })
            ->exists();

        return !$conflictingBookings;
    }
}

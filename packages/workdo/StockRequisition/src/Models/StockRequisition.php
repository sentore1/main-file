<?php

namespace Workdo\StockRequisition\Models;

use App\Models\User;
use App\Models\Warehouse;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StockRequisition extends Model
{
    protected $fillable = [
        'requisition_number',
        'requisition_date',
        'required_date',
        'requested_by',
        'warehouse_id',
        'department',
        'priority',
        'status',
        'approved_by',
        'approved_at',
        'fulfilled_by',
        'fulfilled_at',
        'purpose',
        'notes',
        'rejection_reason',
        'creator_id',
        'created_by'
    ];

    protected $casts = [
        'requisition_date' => 'date',
        'required_date' => 'date',
        'approved_at' => 'datetime',
        'fulfilled_at' => 'datetime',
    ];

    public function items(): HasMany
    {
        return $this->hasMany(StockRequisitionItem::class, 'requisition_id');
    }

    public function requestedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'requested_by');
    }

    public function warehouse(): BelongsTo
    {
        return $this->belongsTo(Warehouse::class, 'warehouse_id');
    }

    public function approvedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function fulfilledBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'fulfilled_by');
    }

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($requisition) {
            if (empty($requisition->requisition_number)) {
                $requisition->requisition_number = static::generateRequisitionNumber();
            }
        });
    }

    public static function generateRequisitionNumber(): string
    {
        $year = date('Y');
        $month = date('m');
        $lastRequisition = static::where('requisition_number', 'like', "SR-{$year}-{$month}-%")
            ->where('created_by', creatorId())
            ->orderBy('requisition_number', 'desc')
            ->first();

        if ($lastRequisition) {
            $lastNumber = (int) substr($lastRequisition->requisition_number, -4);
            $nextNumber = $lastNumber + 1;
        } else {
            $nextNumber = 1;
        }

        return "SR-{$year}-{$month}-" . str_pad($nextNumber, 4, '0', STR_PAD_LEFT);
    }

    public function canApprove(): bool
    {
        return $this->status === 'pending';
    }

    public function canFulfill(): bool
    {
        return $this->status === 'approved';
    }

    public function canCancel(): bool
    {
        return in_array($this->status, ['draft', 'pending', 'approved']);
    }
}

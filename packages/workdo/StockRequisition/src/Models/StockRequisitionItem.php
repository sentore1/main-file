<?php

namespace Workdo\StockRequisition\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Workdo\ProductService\Models\ProductServiceItem;

class StockRequisitionItem extends Model
{
    protected $fillable = [
        'requisition_id',
        'product_id',
        'quantity_requested',
        'quantity_approved',
        'quantity_fulfilled',
        'notes',
        'creator_id',
        'created_by'
    ];

    protected $casts = [
        'quantity_requested' => 'decimal:2',
        'quantity_approved' => 'decimal:2',
        'quantity_fulfilled' => 'decimal:2',
    ];

    public function requisition(): BelongsTo
    {
        return $this->belongsTo(StockRequisition::class, 'requisition_id');
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(ProductServiceItem::class, 'product_id');
    }
}

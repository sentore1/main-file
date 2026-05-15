<?php

namespace Workdo\Pos\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Workdo\ProductService\Models\ProductServiceItem;
use Workdo\Pos\Models\Room;

class PosItem extends Model
{
    protected $fillable = [
        'pos_id',
        'product_id',
        'item_type',
        'quantity',
        'price',
        'subtotal',
        'tax_ids',
        'tax_amount',
        'total_amount',
        'notes',
        'creator_id',
        'created_by'
    ];

    protected function casts(): array
    {
        return [
            'quantity' => 'decimal:2',
            'price' => 'decimal:2',
            'tax_ids' => 'array',
            'subtotal' => 'decimal:2',
            'tax_amount' => 'decimal:2',
            'total_amount' => 'decimal:2'
        ];
    }

    public function sale(): BelongsTo
    {
        return $this->belongsTo(Pos::class, 'pos_id');
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(ProductServiceItem::class, 'product_id');
    }

    public function room(): BelongsTo
    {
        return $this->belongsTo(Room::class, 'product_id');
    }

    /**
     * Get the actual item (either product or room) based on item_type
     */
    public function getItemAttribute()
    {
        if ($this->item_type === 'room') {
            return $this->room;
        }
        return $this->product;
    }

    /**
     * Get the item name regardless of type
     */
    public function getItemNameAttribute()
    {
        if ($this->item_type === 'room' && $this->room) {
            return 'Room ' . $this->room->room_number;
        }
        return $this->product ? $this->product->name : 'Unknown Item';
    }

    /**
     * Get the item SKU regardless of type
     */
    public function getItemSkuAttribute()
    {
        if ($this->item_type === 'room' && $this->room) {
            return 'ROOM-' . $this->room->room_number;
        }
        return $this->product ? $this->product->sku : '';
    }
}
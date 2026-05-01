<?php

namespace Workdo\ProductService\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\User;
use App\Models\Warehouse;

class StockReport extends Model
{
    protected $fillable = [
        'report_date',
        'report_type',
        'product_id',
        'warehouse_id',
        'quantity',
        'notes',
        'recorded_by',
        'created_by',
    ];

    protected $casts = [
        'report_date' => 'date',
        'quantity' => 'decimal:2',
    ];

    public function product()
    {
        return $this->belongsTo(ProductServiceItem::class, 'product_id');
    }

    public function warehouse()
    {
        return $this->belongsTo(Warehouse::class, 'warehouse_id');
    }

    public function recordedBy()
    {
        return $this->belongsTo(User::class, 'recorded_by');
    }
}

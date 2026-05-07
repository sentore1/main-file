<?php

namespace Workdo\StockRequisition\Events;

use Illuminate\Queue\SerializesModels;
use Workdo\StockRequisition\Models\StockRequisition;

class FulfillStockRequisition
{
    use SerializesModels;

    public $requisition;

    public function __construct(StockRequisition $requisition)
    {
        $this->requisition = $requisition;
    }
}

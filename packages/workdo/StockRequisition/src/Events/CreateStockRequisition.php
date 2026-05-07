<?php

namespace Workdo\StockRequisition\Events;

use Illuminate\Queue\SerializesModels;
use Workdo\StockRequisition\Models\StockRequisition;

class CreateStockRequisition
{
    use SerializesModels;

    public $request;
    public $requisition;

    public function __construct($request, StockRequisition $requisition)
    {
        $this->request = $request;
        $this->requisition = $requisition;
    }
}

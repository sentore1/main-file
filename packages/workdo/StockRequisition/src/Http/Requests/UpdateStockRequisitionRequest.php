<?php

namespace Workdo\StockRequisition\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateStockRequisitionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'requisition_date' => 'required|date',
            'required_date' => 'required|date|after_or_equal:requisition_date',
            'warehouse_id' => 'required|exists:warehouses,id',
            'department' => 'nullable|string|max:255',
            'priority' => 'required|in:low,normal,urgent',
            'purpose' => 'nullable|string|max:1000',
            'notes' => 'nullable|string|max:1000',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:product_service_items,id',
            'items.*.quantity' => 'required|numeric|min:0.01',
            'items.*.notes' => 'nullable|string|max:500',
        ];
    }
}

<?php

namespace Workdo\StockRequisition\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreStockRequisitionRequest extends FormRequest
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

    public function messages(): array
    {
        return [
            'requisition_date.required' => 'Requisition date is required.',
            'required_date.required' => 'Required date is required.',
            'required_date.after_or_equal' => 'Required date must be on or after requisition date.',
            'warehouse_id.required' => 'Warehouse is required.',
            'warehouse_id.exists' => 'Selected warehouse does not exist.',
            'priority.required' => 'Priority is required.',
            'priority.in' => 'Priority must be low, normal, or urgent.',
            'items.required' => 'At least one item is required.',
            'items.min' => 'At least one item is required.',
            'items.*.product_id.required' => 'Product is required for each item.',
            'items.*.product_id.exists' => 'Selected product does not exist.',
            'items.*.quantity.required' => 'Quantity is required for each item.',
            'items.*.quantity.min' => 'Quantity must be greater than 0.',
        ];
    }
}

<?php

namespace Workdo\Pos\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdatePosRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'customer_id' => 'nullable|exists:users,id',
            'warehouse_id' => 'required|exists:warehouses,id',
            'pos_date' => 'nullable|date',
            'payment_method' => 'nullable|in:cash,card,bank_transfer,mobile_money,mtn_momo,airtel_money,bank,check,charge_to_room',
            'items' => 'required|array|min:1',
            'items.*.id' => 'required|integer',
            'items.*.quantity' => 'required|numeric|min:1',
            'items.*.price' => 'required|numeric|min:0',
            'items.*.notes' => 'nullable|string',
            'discount' => 'nullable|numeric|min:0',
            'paid_amount' => 'nullable|numeric|min:0',
        ];
    }
}

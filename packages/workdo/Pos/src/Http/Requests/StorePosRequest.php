<?php

namespace Workdo\Pos\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;

class StorePosRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'customer_id' => 'nullable|exists:users,id',
            'room_booking_id' => 'nullable|exists:room_bookings,id',
            'charged_to_room' => 'nullable|boolean',
            'warehouse_id' => 'required|exists:warehouses,id',
            'pos_date' => 'nullable|date',
            'bank_account_id' => 'nullable|exists:bank_accounts,id',
            'waiter_name' => 'nullable|string|max:255',
            'payment_method' => 'nullable|in:cash,card,bank_transfer,mobile_money,mtn_momo,airtel_money,charge_to_room',
            'check_in_date' => 'nullable|date',
            'items' => 'required|array|min:1',
            'items.*.id' => 'required|integer',
            'items.*.quantity' => 'required|numeric|min:1',
            'items.*.price' => 'required|numeric|min:0',
            'items.*.notes' => 'nullable|string',
            'items.*.is_room' => 'nullable|boolean',
            'items.*.includes_breakfast' => 'nullable|boolean',
            'items.*.breakfast_price' => 'nullable|numeric|min:0',
            'items.*.number_of_guests' => 'nullable|integer|min:1',
            'items.*.discount_amount' => 'nullable|numeric|min:0',
            'items.*.tax_amount' => 'nullable|numeric|min:0',
            'tax_amount' => 'nullable|numeric|min:0',
            'discount' => 'nullable|numeric|min:0',
            'paid_amount' => 'nullable|numeric|min:0',
        ];
    }
}
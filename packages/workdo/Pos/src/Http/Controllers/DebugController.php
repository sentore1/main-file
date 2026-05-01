<?php

namespace Workdo\Pos\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Workdo\Pos\Models\Pos;
use Workdo\Pos\Models\RoomBooking;

class DebugController extends Controller
{
    public function checkPosRoomLinks()
    {
        if (!Auth::user()->can('manage-pos-orders')) {
            return response()->json(['error' => 'Permission denied'], 403);
        }

        $creatorId = creatorId();

        // Get all POS orders
        $posOrders = Pos::with(['payment', 'customer', 'roomBooking'])
            ->where('created_by', $creatorId)
            ->orderBy('created_at', 'desc')
            ->limit(20)
            ->get()
            ->map(function($pos) {
                return [
                    'id' => $pos->id,
                    'sale_number' => $pos->sale_number,
                    'customer_id' => $pos->customer_id,
                    'customer_name' => $pos->customer ? $pos->customer->name : 'Walk-in',
                    'room_booking_id' => $pos->room_booking_id,
                    'charged_to_room' => $pos->charged_to_room,
                    'status' => $pos->status,
                    'total' => $pos->payment ? $pos->payment->discount_amount : 0,
                    'balance' => $pos->payment ? $pos->payment->balance_due : 0,
                    'created_at' => $pos->created_at->format('Y-m-d H:i:s'),
                ];
            });

        // Get all room bookings
        $roomBookings = RoomBooking::with(['customer', 'room'])
            ->where('created_by', $creatorId)
            ->orderBy('created_at', 'desc')
            ->limit(20)
            ->get()
            ->map(function($booking) use ($creatorId) {
                // Count linked POS orders
                $posCount = Pos::where('room_booking_id', $booking->id)
                    ->where('created_by', $creatorId)
                    ->count();

                return [
                    'id' => $booking->id,
                    'booking_number' => $booking->booking_number,
                    'customer_id' => $booking->customer_id,
                    'customer_name' => $booking->customer ? $booking->customer->name : 'N/A',
                    'room_number' => $booking->room ? $booking->room->room_number : 'N/A',
                    'status' => $booking->status,
                    'total_amount' => $booking->total_amount,
                    'pos_orders_count' => $posCount,
                    'created_at' => $booking->created_at->format('Y-m-d H:i:s'),
                ];
            });

        // Get POS orders that should be linked but aren't
        $unlinkedPosOrders = Pos::where('charged_to_room', true)
            ->whereNull('room_booking_id')
            ->where('created_by', $creatorId)
            ->with(['customer'])
            ->get()
            ->map(function($pos) {
                return [
                    'id' => $pos->id,
                    'sale_number' => $pos->sale_number,
                    'customer_id' => $pos->customer_id,
                    'customer_name' => $pos->customer ? $pos->customer->name : 'Walk-in',
                    'status' => $pos->status,
                    'created_at' => $pos->created_at->format('Y-m-d H:i:s'),
                ];
            });

        return response()->json([
            'pos_orders' => $posOrders,
            'room_bookings' => $roomBookings,
            'unlinked_pos_orders' => $unlinkedPosOrders,
            'summary' => [
                'total_pos_orders' => $posOrders->count(),
                'total_room_bookings' => $roomBookings->count(),
                'pos_with_room_link' => $posOrders->where('room_booking_id', '!=', null)->count(),
                'unlinked_charged_to_room' => $unlinkedPosOrders->count(),
            ]
        ], 200, [], JSON_PRETTY_PRINT);
    }

    public function fixPosRoomLinks(Request $request)
    {
        if (!Auth::user()->can('manage-pos-orders')) {
            return response()->json(['error' => 'Permission denied'], 403);
        }

        $creatorId = creatorId();
        $fixed = 0;

        // Find POS orders that are charged_to_room but don't have room_booking_id
        $unlinkedOrders = Pos::where('charged_to_room', true)
            ->whereNull('room_booking_id')
            ->where('created_by', $creatorId)
            ->get();

        foreach ($unlinkedOrders as $pos) {
            if ($pos->customer_id) {
                // Try to find an active booking for this customer
                $booking = RoomBooking::where('customer_id', $pos->customer_id)
                    ->where('created_by', $creatorId)
                    ->whereIn('status', ['confirmed', 'checked_in'])
                    ->whereDate('check_in_date', '<=', $pos->pos_date)
                    ->whereDate('check_out_date', '>=', $pos->pos_date)
                    ->first();

                if ($booking) {
                    $pos->room_booking_id = $booking->id;
                    $pos->save();
                    $fixed++;
                }
            }
        }

        return response()->json([
            'success' => true,
            'message' => "Fixed {$fixed} POS orders",
            'fixed_count' => $fixed,
        ]);
    }

    public function inspectBookingData($bookingId)
    {
        if (!Auth::user()->can('view-room-bookings')) {
            return response()->json(['error' => 'Permission denied'], 403);
        }

        $booking = RoomBooking::with(['payment', 'customer', 'room'])
            ->where('id', $bookingId)
            ->where('created_by', creatorId())
            ->first();

        if (!$booking) {
            return response()->json(['error' => 'Booking not found'], 404);
        }

        $posInvoices = Pos::with(['items.product', 'payment'])
            ->where('room_booking_id', $bookingId)
            ->where('created_by', creatorId())
            ->get();

        $posData = $posInvoices->map(function($pos) {
            return [
                'id' => $pos->id,
                'sale_number' => $pos->sale_number,
                'charged_to_room' => $pos->charged_to_room,
                'status' => $pos->status,
                'payment' => $pos->payment ? [
                    'amount' => $pos->payment->amount,
                    'discount' => $pos->payment->discount,
                    'discount_amount' => $pos->payment->discount_amount,
                    'paid_amount' => $pos->payment->paid_amount,
                    'balance_due' => $pos->payment->balance_due,
                ] : null,
                'items' => $pos->items->map(function($item) {
                    return [
                        'product_name' => $item->product ? $item->product->name : 'N/A',
                        'quantity' => $item->quantity,
                        'price' => $item->price,
                        'total_amount' => $item->total_amount,
                    ];
                }),
            ];
        });

        return response()->json([
            'booking' => [
                'id' => $booking->id,
                'booking_number' => $booking->booking_number,
                'customer_name' => $booking->customer ? $booking->customer->name : 'N/A',
                'room_number' => $booking->room ? $booking->room->room_number : 'N/A',
                'total_amount' => $booking->total_amount,
                'status' => $booking->status,
            ],
            'pos_invoices' => $posData,
            'pos_count' => $posInvoices->count(),
            'total_consumption' => $posInvoices->sum(function($pos) {
                return $pos->payment ? $pos->payment->discount_amount : 0;
            }),
        ], 200, [], JSON_PRETTY_PRINT);
    }

    public function fixOldChargedToRoomOrders()
    {
        if (!Auth::user()->can('manage-pos-orders')) {
            return response()->json(['error' => 'Permission denied'], 403);
        }

        $creatorId = creatorId();
        
        // Find all POS orders that are charged_to_room but have wrong status or payment
        $ordersToFix = Pos::with('payment')
            ->where('charged_to_room', true)
            ->where('created_by', $creatorId)
            ->get();

        $fixed = 0;
        $updated = [];

        foreach ($ordersToFix as $pos) {
            $needsUpdate = false;
            $changes = [];

            // Fix status
            if ($pos->status !== 'charged_to_room') {
                $pos->status = 'charged_to_room';
                $needsUpdate = true;
                $changes[] = 'status: ' . $pos->status . ' -> charged_to_room';
            }

            // Fix payment if balance_due is not 0
            if ($pos->payment && $pos->payment->balance_due != 0) {
                $totalAmount = $pos->payment->discount_amount;
                $pos->payment->paid_amount = $totalAmount;
                $pos->payment->balance_due = 0;
                $pos->payment->save();
                $needsUpdate = true;
                $changes[] = 'payment: set paid_amount=' . $totalAmount . ', balance_due=0';
            }

            if ($needsUpdate) {
                $pos->save();
                $fixed++;
                $updated[] = [
                    'sale_number' => $pos->sale_number,
                    'changes' => $changes
                ];
            }
        }

        return response()->json([
            'success' => true,
            'message' => "Fixed {$fixed} POS orders",
            'total_checked' => $ordersToFix->count(),
            'fixed_count' => $fixed,
            'updated_orders' => $updated,
        ], 200, [], JSON_PRETTY_PRINT);
    }
}

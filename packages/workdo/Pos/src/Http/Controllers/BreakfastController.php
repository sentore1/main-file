<?php

namespace Workdo\Pos\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Workdo\Pos\Models\RoomBooking;
use App\Http\Controllers\Controller;

class BreakfastController extends Controller
{
    public function index()
    {
        if(Auth::user()->can('view-pos-orders')){
            $today = now()->toDateString();
            
            $breakfastBookings = RoomBooking::with(['customer:id,name,email', 'room:id,room_number'])
                ->where('includes_breakfast', true)
                ->where('check_in_date', '<=', $today)
                ->where('check_out_date', '>=', $today)
                ->whereIn('status', ['confirmed', 'checked_in'])
                ->where('created_by', creatorId())
                ->orderBy('room_id')
                ->get();
            
            return Inertia::render('Pos/Breakfast/Index', [
                'bookings' => $breakfastBookings,
                'today' => $today
            ]);
        }else{
            return redirect()->route('pos.index')->with('error', __('Permission denied'));
        }
    }
}

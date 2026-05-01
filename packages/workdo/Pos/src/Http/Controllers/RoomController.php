<?php

namespace Workdo\Pos\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Workdo\Pos\Models\Room;
use Workdo\Pos\Models\RoomType;
use App\Models\Warehouse;

class RoomController extends Controller
{
    public function index(Request $request)
    {
        if (Auth::user()->can('manage-rooms')) {
            // Get user's accessible warehouse IDs
            $warehouseIds = getUserWarehouseIds();
            
            $query = Room::with(['roomType:id,name,color', 'warehouse:id,name'])
                ->where('created_by', creatorId())
                ->whereIn('warehouse_id', $warehouseIds);

            if ($request->filled('search')) {
                $search = $request->get('search');
                $query->where(function($q) use ($search) {
                    $q->where('room_number', 'like', "%{$search}%")
                      ->orWhereHas('roomType', function($typeQuery) use ($search) {
                          $typeQuery->where('name', 'like', "%{$search}%");
                      });
                });
            }

            if ($request->filled('warehouse')) {
                $query->where('warehouse_id', $request->get('warehouse'));
            }

            if ($request->filled('room_type')) {
                $query->where('room_type_id', $request->get('room_type'));
            }

            if ($request->filled('status')) {
                $query->where('status', $request->get('status'));
            }

            $rooms = $query->latest()->paginate(12)->withQueryString();

            $warehouses = Warehouse::where('created_by', creatorId())
                ->whereIn('id', $warehouseIds)
                ->where('is_active', true)
                ->select('id', 'name')
                ->get();

            $roomTypes = RoomType::where('created_by', creatorId())
                ->where('is_active', true)
                ->select('id', 'name')
                ->get();

            return Inertia::render('Pos/Rooms/Index', [
                'rooms' => $rooms,
                'warehouses' => $warehouses,
                'roomTypes' => $roomTypes,
            ]);
        }

        return redirect()->back()->with('error', __('Permission denied'));
    }

    public function create()
    {
        if (Auth::user()->can('create-rooms')) {
            // Get user's accessible warehouse IDs
            $warehouseIds = getUserWarehouseIds();
            
            $warehouses = Warehouse::where('created_by', creatorId())
                ->whereIn('id', $warehouseIds)
                ->where('is_active', true)
                ->select('id', 'name', 'address')
                ->get();

            $roomTypes = RoomType::where('created_by', creatorId())
                ->where('is_active', true)
                ->get();

            return Inertia::render('Pos/Rooms/Create', [
                'warehouses' => $warehouses,
                'roomTypes' => $roomTypes,
            ]);
        }

        return redirect()->route('rooms.index')->with('error', __('Permission denied'));
    }

    public function store(Request $request)
    {
        if (Auth::user()->can('create-rooms')) {
            // Get user's accessible warehouse IDs
            $warehouseIds = getUserWarehouseIds();
            
            $validated = $request->validate([
                'room_number' => 'required|string|max:50',
                'room_type_id' => 'required|exists:room_types,id',
                'warehouse_id' => 'required|exists:warehouses,id',
                'floor' => 'nullable|string|max:20',
                'price_per_night' => 'required|numeric|min:0',
                'max_occupancy' => 'required|integer|min:1',
                'amenities' => 'nullable|array',
                'description' => 'nullable|string',
                'image' => 'nullable|image|max:2048',
            ]);
            
            // Check if user has access to the selected warehouse
            if (!in_array($validated['warehouse_id'], $warehouseIds)) {
                return redirect()->back()->with('error', __('You do not have access to this warehouse.'))->withInput();
            }

            // Check for duplicate room number in same warehouse
            $exists = Room::where('room_number', $validated['room_number'])
                ->where('warehouse_id', $validated['warehouse_id'])
                ->where('created_by', creatorId())
                ->exists();

            if ($exists) {
                return redirect()->back()->withErrors(['room_number' => __('Room number already exists in this warehouse.')])->withInput();
            }

            $room = new Room();
            $room->room_number = $validated['room_number'];
            $room->room_type_id = $validated['room_type_id'];
            $room->warehouse_id = $validated['warehouse_id'];
            $room->floor = $validated['floor'] ?? null;
            $room->price_per_night = $validated['price_per_night'];
            $room->max_occupancy = $validated['max_occupancy'];
            $room->amenities = $validated['amenities'] ?? [];
            $room->description = $validated['description'] ?? null;
            
            if ($request->hasFile('image')) {
                $path = $request->file('image')->store('rooms', 'public');
                $room->image = $path;
            }

            $room->creator_id = Auth::id();
            $room->created_by = creatorId();
            $room->save();

            return redirect()->route('rooms.index')->with('success', __('Room created successfully.'));
        }

        return redirect()->route('rooms.index')->with('error', __('Permission denied'));
    }

    public function edit(Room $room)
    {
        if (Auth::user()->can('edit-rooms') && $room->created_by == creatorId()) {
            // Get user's accessible warehouse IDs
            $warehouseIds = getUserWarehouseIds();
            
            // Check if user has access to this room's warehouse
            if (!in_array($room->warehouse_id, $warehouseIds)) {
                return redirect()->route('rooms.index')->with('error', __('Permission denied'));
            }
            
            $warehouses = Warehouse::where('created_by', creatorId())
                ->whereIn('id', $warehouseIds)
                ->where('is_active', true)
                ->select('id', 'name', 'address')
                ->get();

            $roomTypes = RoomType::where('created_by', creatorId())
                ->where('is_active', true)
                ->get();

            $room->load(['roomType', 'warehouse']);

            return Inertia::render('Pos/Rooms/Edit', [
                'room' => $room,
                'warehouses' => $warehouses,
                'roomTypes' => $roomTypes,
            ]);
        }

        return redirect()->route('rooms.index')->with('error', __('Permission denied'));
    }

    public function update(Request $request, Room $room)
    {
        if (Auth::user()->can('edit-rooms') && $room->created_by == creatorId()) {
            // Get user's accessible warehouse IDs
            $warehouseIds = getUserWarehouseIds();
            
            // Check if user has access to this room's warehouse
            if (!in_array($room->warehouse_id, $warehouseIds)) {
                return redirect()->route('rooms.index')->with('error', __('Permission denied'));
            }
            
            $validated = $request->validate([
                'room_number' => 'required|string|max:50',
                'room_type_id' => 'required|exists:room_types,id',
                'warehouse_id' => 'required|exists:warehouses,id',
                'floor' => 'nullable|string|max:20',
                'price_per_night' => 'required|numeric|min:0',
                'max_occupancy' => 'required|integer|min:1',
                'amenities' => 'nullable|array',
                'description' => 'nullable|string',
                'status' => 'required|in:available,occupied,maintenance,reserved',
                'image' => 'nullable|image|max:2048',
            ]);

            // Check for duplicate room number in same warehouse (excluding current room)
            $exists = Room::where('room_number', $validated['room_number'])
                ->where('warehouse_id', $validated['warehouse_id'])
                ->where('created_by', creatorId())
                ->where('id', '!=', $room->id)
                ->exists();

            if ($exists) {
                return redirect()->back()->withErrors(['room_number' => __('Room number already exists in this warehouse.')])->withInput();
            }

            if ($request->hasFile('image')) {
                if ($room->image) {
                    Storage::disk('public')->delete($room->image);
                }
                $path = $request->file('image')->store('rooms', 'public');
                $validated['image'] = $path;
            }

            $room->update($validated);

            return redirect()->route('rooms.index')->with('success', __('Room updated successfully.'));
        }

        return redirect()->route('rooms.index')->with('error', __('Permission denied'));
    }

    public function destroy(Room $room)
    {
        if (Auth::user()->can('delete-rooms') && $room->created_by == creatorId()) {
            // Get user's accessible warehouse IDs
            $warehouseIds = getUserWarehouseIds();
            
            // Check if user has access to this room's warehouse
            if (!in_array($room->warehouse_id, $warehouseIds)) {
                return redirect()->route('rooms.index')->with('error', __('Permission denied'));
            }
            
            // Check if room has active bookings
            $hasActiveBookings = $room->bookings()
                ->whereIn('status', ['confirmed', 'checked_in'])
                ->exists();

            if ($hasActiveBookings) {
                return redirect()->back()->with('error', __('Cannot delete room with active bookings.'));
            }

            if ($room->image) {
                Storage::disk('public')->delete($room->image);
            }

            $room->delete();

            return redirect()->route('rooms.index')->with('success', __('Room deleted successfully.'));
        }

        return redirect()->route('rooms.index')->with('error', __('Permission denied'));
    }

    public function show(Room $room)
    {
        if (Auth::user()->can('view-rooms') && $room->created_by == creatorId()) {
            // Get user's accessible warehouse IDs
            $warehouseIds = getUserWarehouseIds();
            
            // Check if user has access to this room's warehouse
            if (!in_array($room->warehouse_id, $warehouseIds)) {
                return redirect()->route('rooms.index')->with('error', __('Permission denied'));
            }
            
            $room->load(['roomType', 'warehouse', 'bookings' => function($query) {
                $query->with('customer:id,name,email')
                    ->whereIn('status', ['confirmed', 'checked_in'])
                    ->orderBy('check_in_date', 'desc');
            }]);

            return Inertia::render('Pos/Rooms/Show', [
                'room' => $room,
            ]);
        }

        return redirect()->route('rooms.index')->with('error', __('Permission denied'));
    }
}

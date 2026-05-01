<?php

namespace Workdo\Pos\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Workdo\Pos\Models\RoomType;

class RoomTypeController extends Controller
{
    public function index(Request $request)
    {
        if (Auth::user()->can('manage-room-types')) {
            $query = RoomType::where('created_by', creatorId());

            if ($request->filled('search')) {
                $search = $request->get('search');
                $query->where('name', 'like', "%{$search}%");
            }

            $roomTypes = $query->withCount('rooms')->latest()->paginate(10)->withQueryString();

            return Inertia::render('Pos/RoomTypes/Index', [
                'roomTypes' => $roomTypes,
            ]);
        }

        return redirect()->back()->with('error', __('Permission denied'));
    }

    public function create()
    {
        if (Auth::user()->can('create-room-types')) {
            return Inertia::render('Pos/RoomTypes/Create');
        }

        return redirect()->route('room-types.index')->with('error', __('Permission denied'));
    }

    public function store(Request $request)
    {
        if (Auth::user()->can('create-room-types')) {
            $validated = $request->validate([
                'name' => 'required|string|max:255',
                'description' => 'nullable|string',
                'base_price' => 'required|numeric|min:0',
                'color' => 'nullable|string|max:20',
            ]);

            $roomType = new RoomType();
            $roomType->name = $validated['name'];
            $roomType->description = $validated['description'] ?? null;
            $roomType->base_price = $validated['base_price'];
            $roomType->color = $validated['color'] ?? '#3B82F6';
            $roomType->creator_id = Auth::id();
            $roomType->created_by = creatorId();
            $roomType->save();

            return redirect()->route('room-types.index')->with('success', __('Room type created successfully.'));
        }

        return redirect()->route('room-types.index')->with('error', __('Permission denied'));
    }

    public function edit(RoomType $roomType)
    {
        if (Auth::user()->can('edit-room-types') && $roomType->created_by == creatorId()) {
            return Inertia::render('Pos/RoomTypes/Edit', [
                'roomType' => $roomType,
            ]);
        }

        return redirect()->route('room-types.index')->with('error', __('Permission denied'));
    }

    public function update(Request $request, RoomType $roomType)
    {
        if (Auth::user()->can('edit-room-types') && $roomType->created_by == creatorId()) {
            $validated = $request->validate([
                'name' => 'required|string|max:255',
                'description' => 'nullable|string',
                'base_price' => 'required|numeric|min:0',
                'color' => 'nullable|string|max:20',
                'is_active' => 'boolean',
            ]);

            $roomType->update($validated);

            return redirect()->route('room-types.index')->with('success', __('Room type updated successfully.'));
        }

        return redirect()->route('room-types.index')->with('error', __('Permission denied'));
    }

    public function destroy(RoomType $roomType)
    {
        if (Auth::user()->can('delete-room-types') && $roomType->created_by == creatorId()) {
            if ($roomType->rooms()->count() > 0) {
                return redirect()->back()->with('error', __('Cannot delete room type with existing rooms.'));
            }

            $roomType->delete();

            return redirect()->route('room-types.index')->with('success', __('Room type deleted successfully.'));
        }

        return redirect()->route('room-types.index')->with('error', __('Permission denied'));
    }
}

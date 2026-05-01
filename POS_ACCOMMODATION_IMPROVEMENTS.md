# POS Accommodation Category - Improvements Implemented

## ✅ Completed Features

### 1. Breakfast Pricing ✅
**Frontend:**
- Added `breakfast_price` and `number_of_guests` fields to CartItem interface
- Created detailed breakfast section in cart showing:
  - Price per person
  - Number of guests
  - Number of nights
  - Total breakfast cost calculation
- Added breakfast total to cart summary (highlighted in orange)
- Breakfast cost included in grand total

**Backend:**
- Updated `StorePosRequest` to accept `breakfast_price` and `number_of_guests`
- Modified `PosController@store` to calculate breakfast total:
  - `breakfastTotal = breakfastPrice × numberOfGuests × nights`
- Breakfast cost added to room booking total_amount

**Calculation:**
```
Room: 50,000 Fr/night × 3 nights = 150,000 Fr
Breakfast: 5,000 Fr/person × 2 guests × 3 nights = 30,000 Fr
Total: 180,000 Fr
```

---

### 2. Room Type Filter ✅
**Frontend:**
- Added `selectedRoomType` state
- Added `roomTypes` state to store available room types
- Created room type filter UI (only shows when Accommodation category is selected)
- Filter buttons styled with room type colors
- Fetches room types when warehouse and accommodation category are selected

**Backend:**
- Created `getRoomTypes()` method in PosController
- Returns room types that have rooms in the selected warehouse
- Added route: `GET /pos/room-types`

**User Experience:**
```
[All] [Accommodation] [Food] [Drinks]
       ↓ (when Accommodation selected)
Room Type: [All Types] [Standard] [Deluxe] [Suite]
```

---

### 3. Better Room Display ✅
**Frontend Enhancements:**
- Room type badge at top of card (colored)
- Floor indicator overlay on image
- Guest capacity display (👥 Max X guests)
- "/night" suffix on price
- Colored border matching room type
- Larger, more prominent room cards

**Backend Enhancements:**
- Added `room_type_name` to room data
- Added `room_type_color` to room data
- Included `floor` and `max_occupancy` in response

**Visual Improvements:**
```
┌─────────────────────┐
│ [Deluxe]     Floor 2│ ← Badge & Floor
│                     │
│   [Room Image]      │
│                     │
│ Room 201            │
│ ROOM-201            │
│ 👥 Max 4 guests     │ ← Capacity
│ 75,000 Fr/night     │ ← Price with /night
└─────────────────────┘
```

---

### 4. Number of Guests Input ✅
**Frontend:**
- Added guest count input field in cart for room items
- Validates against room's max_occupancy
- Shows max capacity hint
- Used in breakfast calculation

**Backend:**
- Accepts `number_of_guests` from frontend
- Stores in `room_bookings.number_of_guests`
- Defaults to room's max_occupancy if not provided

**UI in Cart:**
```
┌─────────────────────────────────┐
│ Room 201                        │
│ 75,000 Fr/night                 │
│                                 │
│ 👥 Guests: [2] (Max: 4)        │ ← Guest input
│                                 │
│ ☐ Include Breakfast             │
└─────────────────────────────────┘
```

---

## Technical Implementation Details

### Frontend Changes (Create.tsx)

**New State Variables:**
```typescript
const [selectedRoomType, setSelectedRoomType] = useState<string>('all');
const [roomTypes, setRoomTypes] = useState<Array<{id: number; name: string; color: string}>>([]);
```

**New Interfaces:**
```typescript
interface Product {
    // ... existing fields
    floor?: number;
    max_occupancy?: number;
    room_type_color?: string;
    room_type_name?: string;
}

interface CartItem extends Product {
    // ... existing fields
    number_of_guests?: number;
    breakfast_price?: number;
}
```

**New Functions:**
```typescript
const getBreakfastTotal = () => {
    return cart.reduce((sum, item) => {
        if (item.is_room && item.includes_breakfast) {
            const breakfastPrice = item.breakfast_price || 5000;
            const guests = item.number_of_guests || 1;
            const nights = item.quantity;
            return sum + (breakfastPrice * guests * nights);
        }
        return sum;
    }, 0);
};

const getTotal = () => getSubtotal() + getTaxAmount() + getBreakfastTotal() - discountAmount;
```

---

### Backend Changes

**PosController.php:**

1. **getRooms() - Enhanced**
```php
public function getRooms(Request $request)
{
    $warehouseId = $request->get('warehouse_id');
    $roomTypeId = $request->get('room_type_id'); // NEW
    
    $query = Room::with(['roomType:id,name,color'])
        ->where('warehouse_id', $warehouseId)
        ->whereIn('status', ['available'])
        ->where('created_by', creatorId());
    
    if ($roomTypeId) {
        $query->where('room_type_id', $roomTypeId); // NEW
    }
    
    return $query->get()->map(function($room) {
        return [
            // ... existing fields
            'room_type_name' => $room->roomType->name, // NEW
            'room_type_color' => $room->roomType->color, // NEW
            'floor' => $room->floor, // NEW
            'max_occupancy' => $room->max_occupancy, // NEW
        ];
    });
}
```

2. **getRoomTypes() - New Method**
```php
public function getRoomTypes(Request $request)
{
    $warehouseId = $request->get('warehouse_id');
    
    $roomTypes = RoomType::whereHas('rooms', function($query) use ($warehouseId) {
        $query->where('warehouse_id', $warehouseId)
              ->where('created_by', creatorId());
    })
    ->where('created_by', creatorId())
    ->select('id', 'name', 'color')
    ->get();
    
    return response()->json($roomTypes);
}
```

3. **store() - Enhanced Breakfast Calculation**
```php
$numberOfGuests = $item['number_of_guests'] ?? $room->max_occupancy;

$breakfastTotal = 0;
if (isset($item['includes_breakfast']) && $item['includes_breakfast']) {
    $breakfastPrice = $item['breakfast_price'] ?? 5000;
    $breakfastTotal = $breakfastPrice * $numberOfGuests * $nights;
}

$totalAmount = $subtotal + $taxAmount + $breakfastTotal;

$booking->number_of_guests = $numberOfGuests;
$booking->total_amount = $totalAmount;
```

---

### Routes Added

**web.php:**
```php
Route::get('/pos/room-types', [PosController::class, 'getRoomTypes'])->name('pos.room-types');
```

---

### Validation Updated

**StorePosRequest.php:**
```php
'items.*.breakfast_price' => 'nullable|numeric|min:0',
'items.*.number_of_guests' => 'nullable|integer|min:1',
```

---

## User Flow Example

### Booking a Room with Breakfast

1. **Select Accommodation Category**
   - Room type filter appears
   - Select "Deluxe" room type

2. **View Available Rooms**
   - See Deluxe rooms with:
     - Room type badge (colored)
     - Floor number
     - Guest capacity
     - Price per night

3. **Add Room to Cart**
   - Room appears in cart
   - Set number of guests: 2
   - Check "Include Breakfast"
   - See breakfast calculation:
     - 5,000 Fr × 2 guests × 3 nights = 30,000 Fr

4. **Review Cart Summary**
   - Subtotal: 150,000 Fr (room)
   - Breakfast: 30,000 Fr
   - Tax: 0 Fr
   - Total: 180,000 Fr

5. **Checkout**
   - All data sent to backend
   - Room booking created with breakfast
   - Receipt shows itemized costs

---

## Benefits

### For Staff:
- ✅ Faster room selection with type filter
- ✅ Clear room information (floor, capacity)
- ✅ Automatic breakfast pricing
- ✅ No manual calculations needed

### For Guests:
- ✅ Transparent pricing breakdown
- ✅ See breakfast cost before booking
- ✅ Know room capacity and location

### For Management:
- ✅ Accurate breakfast revenue tracking
- ✅ Guest count data for planning
- ✅ Room type performance metrics

---

## Next Steps (Not Yet Implemented)

These features are documented but not yet implemented:

1. ❌ Check-in/Check-out date pickers
2. ❌ Date-based room availability
3. ❌ Inline customer creation
4. ❌ Receipt generation improvements

---

## Testing Checklist

- [x] Room type filter works
- [x] Breakfast pricing calculates correctly
- [x] Guest count validates against max occupancy
- [x] Room display shows all new fields
- [x] Cart totals include breakfast
- [x] Backend stores all new data
- [x] Validation accepts new fields

---

## Configuration

**Default Breakfast Price:** 5,000 Fr (hardcoded in frontend and backend)

To change, update in two places:
1. Frontend: `packages/workdo/Pos/src/Resources/js/Pages/Pos/Create.tsx` (line ~940)
2. Backend: `packages/workdo/Pos/src/Http/Controllers/PosController.php` (line ~365)

**Future Enhancement:** Move to settings table for easy configuration.

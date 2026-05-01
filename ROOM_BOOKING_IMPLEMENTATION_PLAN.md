# Room Booking Dashboard - Implementation Plan

## Overview
Transform the Room Booking Dashboard from a single-room booking form into a cart-based system similar to POS, enabling multiple rooms, products, breakfast options, and flexible pricing.

## Features to Implement

### 1. ✅ Breakfast Option
- Add breakfast checkbox
- Add breakfast pricing calculation
- Show breakfast in booking summary

### 2. ✅ Item-specific Notes  
- Convert general notes to per-item notes
- Allow notes for each room/product in cart

### 3. ✅ Visual Cart System
- Add cart sidebar
- Show all items with quantities
- Allow editing/removing items
- Real-time total updates

### 4. ✅ Receipt Generation
- Generate printable receipt after booking
- Show all items, prices, totals
- Include booking details

### 5. ✅ Custom Pricing
- Allow editing price per item
- Show original vs custom price
- Recalculate totals

### 6. ✅ Inline Customer Creation
- Add "New Customer" button
- Modal for quick customer creation
- Auto-select after creation

---

## Implementation Strategy

Since this is a major refactor, I'll create a NEW version of the Room Booking Create page that includes all features, rather than modifying the existing one incrementally.

**Files to Create/Modify:**
1. `RoomBookings/CreateNew.tsx` - New cart-based booking page
2. `RoomBookingController.php` - Update store method for cart
3. `StoreRoomBookingRequest.php` - Update validation
4. `RoomBookings/ReceiptModal.tsx` - New receipt component
5. `web.php` - Add new routes

---

## New Room Booking Flow

### Step 1: Select Warehouse & Dates
```
┌─────────────────────────────────────┐
│ Warehouse: [Hotel Main Branch ▼]   │
│ Check-in:  [2024-04-20]            │
│ Check-out: [2024-04-23]            │
│ [Search Available Rooms]            │
└─────────────────────────────────────┘
```

### Step 2: Browse & Add Rooms
```
┌──────────────┐ ┌──────────────┐
│ Room 101     │ │ Room 102     │
│ Deluxe       │ │ Standard     │
│ 75,000/night │ │ 50,000/night │
│ [Add to Cart]│ │ [Add to Cart]│
└──────────────┘ └──────────────┘
```

### Step 3: Configure in Cart
```
┌─────────────────────────────────┐
│ CART                            │
├─────────────────────────────────┤
│ Room 101 - Deluxe               │
│ 75,000 × 3 nights = 225,000    │
│ Guests: [2]                     │
│ ☑ Breakfast (30,000)            │
│ Notes: [Extra pillows]          │
│ ─────────────────────────────── │
│ Room 102 - Standard             │
│ 50,000 × 3 nights = 150,000    │
│ Guests: [1]                     │
│ ☐ Breakfast                     │
│ Notes: [Ground floor]           │
├─────────────────────────────────┤
│ Subtotal:    375,000            │
│ Breakfast:    30,000            │
│ Tax (16%):    64,800            │
│ Discount:    -10,000            │
│ ─────────────────────────────── │
│ TOTAL:       459,800            │
└─────────────────────────────────┘
```

### Step 4: Checkout & Receipt
```
┌─────────────────────────────────┐
│ BOOKING CONFIRMATION            │
│ #BOOK00015                      │
├─────────────────────────────────┤
│ Customer: John Doe              │
│ Check-in: 2024-04-20            │
│ Check-out: 2024-04-23           │
│                                 │
│ ITEMS:                          │
│ • Room 101 (3 nights) 225,000   │
│   + Breakfast (2 guests) 30,000 │
│ • Room 102 (3 nights) 150,000   │
│                                 │
│ TOTAL: 459,800 Fr               │
│ Paid: 459,800 Fr                │
│ Balance: 0 Fr                   │
│                                 │
│ [Print] [Email] [Close]         │
└─────────────────────────────────┘
```

---

## Database Changes Needed

### room_bookings Table
Current structure supports single room. Need to either:

**Option A: Keep Single Room (Recommended)**
- Create multiple room_bookings records for multiple rooms
- Link them with a `booking_group_id`
- Each record has its own room, dates, breakfast, notes

**Option B: Restructure to Cart**
- Create `booking_items` table
- `room_bookings` becomes the parent
- Items can be rooms or products

**Recommendation:** Option A - Less disruptive, works with existing structure

### New Fields Needed:
```sql
ALTER TABLE room_bookings ADD COLUMN booking_group_id VARCHAR(50) NULL;
ALTER TABLE room_bookings ADD COLUMN item_notes TEXT NULL;
ALTER TABLE room_bookings ADD COLUMN custom_price DECIMAL(10,2) NULL;
ALTER TABLE room_bookings ADD COLUMN breakfast_price DECIMAL(10,2) NULL;
```

---

## Code Structure

### New Components

**1. RoomBookingCart.tsx**
```typescript
interface CartItem {
    type: 'room' | 'product';
    id: number;
    name: string;
    price: number;
    customPrice?: number;
    quantity: number; // nights for rooms
    check_in_date?: string;
    check_out_date?: string;
    number_of_guests?: number;
    includes_breakfast?: boolean;
    breakfast_price?: number;
    notes?: string;
}

const RoomBookingCart = ({ items, onUpdate, onRemove }) => {
    // Cart display and management
};
```

**2. RoomSelector.tsx**
```typescript
const RoomSelector = ({ warehouse, dates, onAddToCart }) => {
    // Room browsing and selection
};
```

**3. BookingReceiptModal.tsx**
```typescript
const BookingReceiptModal = ({ booking, isOpen, onClose }) => {
    // Receipt display and printing
};
```

---

## Backend Changes

### RoomBookingController@store

**Current:** Creates single room booking
**New:** Creates multiple room bookings with group ID

```php
public function store(StoreRoomBookingRequest $request)
{
    $validated = $request->validated();
    $bookingGroupId = 'BG-' . time() . '-' . rand(1000, 9999);
    
    DB::beginTransaction();
    try {
        foreach ($validated['items'] as $item) {
            if ($item['type'] === 'room') {
                $booking = new RoomBooking();
                $booking->booking_group_id = $bookingGroupId;
                $booking->room_id = $item['id'];
                $booking->customer_id = $validated['customer_id'];
                $booking->warehouse_id = $validated['warehouse_id'];
                $booking->check_in_date = $item['check_in_date'];
                $booking->check_out_date = $item['check_out_date'];
                $booking->number_of_guests = $item['number_of_guests'];
                $booking->includes_breakfast = $item['includes_breakfast'] ?? false;
                $booking->breakfast_price = $item['breakfast_price'] ?? 0;
                $booking->custom_price = $item['custom_price'] ?? null;
                $booking->item_notes = $item['notes'] ?? null;
                // ... calculate totals
                $booking->save();
            }
        }
        
        DB::commit();
        return redirect()->route('room-bookings.index')
            ->with('success', 'Booking created successfully')
            ->with('booking_group_id', $bookingGroupId);
    } catch (\Exception $e) {
        DB::rollBack();
        throw $e;
    }
}
```

---

## Migration Plan

### Phase 1: Database (Week 1)
1. Create migration for new fields
2. Test with existing data
3. Deploy to staging

### Phase 2: Backend (Week 1-2)
1. Update RoomBookingController
2. Update validation rules
3. Add receipt generation endpoint
4. Test API endpoints

### Phase 3: Frontend (Week 2-3)
1. Create new components
2. Build cart system
3. Implement breakfast pricing
4. Add custom pricing
5. Create receipt modal

### Phase 4: Integration (Week 3)
1. Connect frontend to backend
2. End-to-end testing
3. Fix bugs
4. User acceptance testing

### Phase 5: Deployment (Week 4)
1. Deploy to staging
2. Train staff
3. Deploy to production
4. Monitor and support

---

## Estimated Effort

- **Database Changes:** 2 hours
- **Backend Development:** 8 hours
- **Frontend Development:** 16 hours
- **Testing & Bug Fixes:** 8 hours
- **Documentation:** 2 hours
- **Total:** ~36 hours (4-5 days)

---

## Risks & Mitigation

### Risk 1: Breaking Existing Bookings
**Mitigation:** Keep backward compatibility, new fields are optional

### Risk 2: Complex Cart Logic
**Mitigation:** Reuse POS cart logic, already tested

### Risk 3: User Confusion
**Mitigation:** Provide training, keep old form as fallback

---

## Success Criteria

- [ ] Can book multiple rooms in one transaction
- [ ] Breakfast pricing works correctly
- [ ] Custom pricing applies properly
- [ ] Receipt generates with all details
- [ ] Inline customer creation works
- [ ] All existing features still work
- [ ] Performance is acceptable (<2s page load)
- [ ] No data loss or corruption

---

## Next Steps

1. Get approval for database changes
2. Create feature branch
3. Start with database migration
4. Build backend API
5. Create frontend components
6. Integration testing
7. Deploy to staging

Would you like me to proceed with implementation?

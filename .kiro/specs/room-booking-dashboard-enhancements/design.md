# Room Booking Dashboard Enhancements - Design Document

## Overview

This design transforms the Room Booking Dashboard from a single-room booking interface into a comprehensive cart-based booking system. The enhancement enables staff to book multiple rooms in a single transaction, add breakfast options with automatic pricing, apply custom rates per room, attach item-specific notes, generate printable receipts, and create customers inline without leaving the booking page.

The design reuses proven patterns from the existing POS cart implementation while maintaining backward compatibility with existing bookings.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (React/Inertia)                 │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────────┐         ┌──────────────────────────┐  │
│  │  Room Selection  │         │     Cart Sidebar         │  │
│  │  - Grid View     │◄───────►│  - Cart Items            │  │
│  │  - Filters       │         │  - Price Editing         │  │
│  │  - Search        │         │  - Notes                 │  │
│  └──────────────────┘         │  - Breakfast Toggle      │  │
│                                │  - Guest Count           │  │
│  ┌──────────────────┐         │  - Totals Summary        │  │
│  │ Customer Modal   │         └──────────────────────────┘  │
│  │ - Inline Create  │                                        │
│  └──────────────────┘         ┌──────────────────────────┐  │
│                                │   Receipt Modal          │  │
│                                │  - Print/Download/Email  │  │
│                                └──────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                Backend (Laravel Controllers)                 │
├─────────────────────────────────────────────────────────────┤
│  RoomBookingController                                       │
│  - getAvailableRooms()                                       │
│  - store() [Enhanced for cart]                               │
│  - storeCustomer()                                           │
│  - generateReceipt()                                         │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Database Layer                            │
├─────────────────────────────────────────────────────────────┤
│  room_bookings (Enhanced)                                    │
│  - booking_group_id (NEW)                                    │
│  - item_notes (NEW)                                          │
│  - custom_price (NEW)                                        │
│  - breakfast_price (NEW)                                     │
│  - includes_breakfast (NEW)                                  │
└─────────────────────────────────────────────────────────────┘
```

### Component Interaction Flow

1. **Room Selection Flow**
   - User selects warehouse and date range
   - System fetches available rooms via API
   - User clicks "Add to Cart" on room card
   - Room added to cart state with default values

2. **Cart Management Flow**
   - User modifies guest count, breakfast, notes, price
   - Cart state updates immediately (React state)
   - Totals recalculate automatically

3. **Checkout Flow**
   - User clicks "Complete Booking"
   - System validates cart items
   - Backend creates multiple room_bookings with same booking_group_id
   - Revenue entries created for financial integration
   - Receipt modal displayed with booking details

4. **Customer Creation Flow**
   - User clicks "Add New Customer" button
   - Modal opens with customer form
   - Form submitted via API
   - New customer auto-selected in booking form
   - Modal closes, booking continues

## Components and Interfaces

### Frontend Components

#### 1. RoomBookingCreate Component (Enhanced)

**Location:** `packages/workdo/Pos/src/Resources/js/Pages/RoomBookings/Create.tsx`

**State Management:**
```typescript
interface CartItem {
    id: number;
    room_id: number;
    room_number: string;
    room_type_name: string;
    price_per_night: number;
    quantity: number; // nights
    number_of_guests: number;
    includes_breakfast: boolean;
    breakfast_price: number;
    custom_price?: number;
    item_notes?: string;
    check_in_date: string;
    check_out_date: string;
}

const [cart, setCart] = useState<CartItem[]>([]);
const [selectedWarehouse, setSelectedWarehouse] = useState('');
const [selectedCustomer, setSelectedCustomer] = useState('');
const [discountAmount, setDiscountAmount] = useState(0);
const [availableRooms, setAvailableRooms] = useState<Room[]>([]);
```

**Key Functions:**
- `addToCart(room: Room)` - Adds room to cart with default values
- `updateCartItem(id: number, updates: Partial<CartItem>)` - Updates cart item properties
- `removeFromCart(id: number)` - Removes item from cart
- `calculateSubtotal()` - Sum of all room prices × nights
- `calculateBreakfastTotal()` - Sum of breakfast charges
- `calculateTaxAmount()` - 16% of subtotal
- `calculateTotal()` - Subtotal + breakfast + tax - discount
- `handleCheckout()` - Submits cart to backend

#### 2. CartSidebar Component (New)

**Purpose:** Displays cart items with inline editing capabilities

**Features:**
- List of cart items with room details
- Inline price editing (click to edit)
- Inline notes editing (click to edit)
- Guest count input
- Breakfast checkbox with price breakdown
- Remove item button
- Totals summary section

#### 3. CustomerModal Component (New)

**Purpose:** Inline customer creation without leaving booking page

**Form Fields:**
- Name (required)
- Email (required)
- Phone (optional)

**Validation:**
- Email format validation
- Duplicate email check
- Required field validation

#### 4. ReceiptModal Component (New)

**Purpose:** Display and print booking confirmation

**Content:**
- Company header (logo, name, address)
- Booking group number
- Customer information
- List of booked rooms with details
- Pricing breakdown
- Payment information
- Footer with thank you message

**Actions:**
- Print receipt
- Download as PDF
- Email to customer
- Close and return to bookings list

### Backend Components

#### 1. RoomBookingController (Enhanced)

**New/Modified Methods:**

```php
public function store(Request $request)
{
    // Validate cart items
    $validated = $request->validate([
        'customer_id' => 'nullable|exists:users,id',
        'warehouse_id' => 'required|exists:warehouses,id',
        'items' => 'required|array|min:1',
        'items.*.room_id' => 'required|exists:rooms,id',
        'items.*.check_in_date' => 'required|date',
        'items.*.check_out_date' => 'required|date|after:items.*.check_in_date',
        'items.*.number_of_guests' => 'required|integer|min:1',
        'items.*.includes_breakfast' => 'boolean',
        'items.*.breakfast_price' => 'nullable|numeric|min:0',
        'items.*.custom_price' => 'nullable|numeric|min:0',
        'items.*.item_notes' => 'nullable|string|max:500',
        'discount' => 'nullable|numeric|min:0',
        'payment_method' => 'required|in:cash,card,bank_transfer,mobile_money',
        'bank_account_id' => 'nullable|exists:bank_accounts,id',
    ]);

    DB::beginTransaction();
    try {
        // Generate unique booking group ID
        $bookingGroupId = 'BG-' . time() . '-' . Str::random(6);
        
        $totalAmount = 0;
        $bookings = [];
        
        // Create booking for each cart item
        foreach ($validated['items'] as $item) {
            $room = Room::findOrFail($item['room_id']);
            
            // Check availability
            if (!$room->isAvailable($item['check_in_date'], $item['check_out_date'])) {
                throw new \Exception("Room {$room->room_number} is not available");
            }
            
            // Calculate amounts
            $checkIn = Carbon::parse($item['check_in_date']);
            $checkOut = Carbon::parse($item['check_out_date']);
            $totalNights = $checkIn->diffInDays($checkOut);
            
            $pricePerNight = $item['custom_price'] ?? $room->price_per_night;
            $subtotal = $pricePerNight * $totalNights;
            
            $breakfastTotal = 0;
            if ($item['includes_breakfast']) {
                $breakfastPrice = $item['breakfast_price'] ?? 5000;
                $breakfastTotal = $breakfastPrice * $item['number_of_guests'] * $totalNights;
            }
            
            $taxAmount = $subtotal * 0.16;
            $itemTotal = $subtotal + $breakfastTotal + $taxAmount;
            
            // Create booking
            $booking = new RoomBooking();
            $booking->booking_group_id = $bookingGroupId;
            $booking->room_id = $item['room_id'];
            $booking->customer_id = $validated['customer_id'] ?? null;
            $booking->warehouse_id = $validated['warehouse_id'];
            $booking->check_in_date = $item['check_in_date'];
            $booking->check_out_date = $item['check_out_date'];
            $booking->total_nights = $totalNights;
            $booking->number_of_guests = $item['number_of_guests'];
            $booking->includes_breakfast = $item['includes_breakfast'] ?? false;
            $booking->breakfast_price = $item['breakfast_price'] ?? null;
            $booking->subtotal = $subtotal;
            $booking->custom_price = $item['custom_price'] ?? null;
            $booking->tax_amount = $taxAmount;
            $booking->discount = 0; // Discount applied to group total
            $booking->total_amount = $itemTotal;
            $booking->item_notes = $item['item_notes'] ?? null;
            $booking->status = 'confirmed';
            $booking->creator_id = Auth::id();
            $booking->created_by = creatorId();
            $booking->save();
            
            $bookings[] = $booking;
            $totalAmount += $itemTotal;
            
            // Update room status
            $room->status = 'reserved';
            $room->save();
        }
        
        // Apply group discount
        if ($validated['discount'] > 0) {
            $discountPerBooking = $validated['discount'] / count($bookings);
            foreach ($bookings as $booking) {
                $booking->discount = $discountPerBooking;
                $booking->total_amount -= $discountPerBooking;
                $booking->save();
            }
            $totalAmount -= $validated['discount'];
        }
        
        // Create single payment record for the group
        $payment = new RoomBookingPayment();
        $payment->booking_id = $bookings[0]->id; // Link to first booking
        $payment->booking_group_id = $bookingGroupId;
        $payment->bank_account_id = $validated['bank_account_id'] ?? null;
        $payment->payment_method = $validated['payment_method'];
        $payment->amount_paid = $totalAmount;
        $payment->payment_date = now();
        $payment->creator_id = Auth::id();
        $payment->created_by = creatorId();
        $payment->save();
        
        // Create revenue entry
        $this->createRevenueEntry($bookings, $totalAmount, $validated);
        
        DB::commit();
        
        return redirect()->route('room-bookings.receipt', ['group_id' => $bookingGroupId])
            ->with('success', __('Booking created successfully.'));
            
    } catch (\Exception $e) {
        DB::rollBack();
        return redirect()->back()
            ->with('error', __('Booking failed: ') . $e->getMessage())
            ->withInput();
    }
}

public function storeCustomer(Request $request)
{
    $validated = $request->validate([
        'name' => 'required|string|max:255',
        'email' => 'required|email|unique:users,email',
        'phone' => 'nullable|string|max:20',
    ]);
    
    DB::beginTransaction();
    try {
        $customer = new User();
        $customer->name = $validated['name'];
        $customer->email = $validated['email'];
        $customer->phone = $validated['phone'] ?? null;
        $customer->password = bcrypt(Str::random(16));
        $customer->type = 'client';
        $customer->created_by = creatorId();
        $customer->save();
        $customer->assignRole('client');
        
        DB::commit();
        
        return response()->json([
            'success' => true,
            'message' => __('Customer created successfully'),
            'customer' => $customer
        ]);
    } catch (\Exception $e) {
        DB::rollBack();
        return response()->json([
            'success' => false,
            'message' => __('Failed to create customer: ') . $e->getMessage()
        ], 422);
    }
}

public function receipt($groupId)
{
    $bookings = RoomBooking::with([
        'room.roomType',
        'customer',
        'warehouse',
        'payment'
    ])
    ->where('booking_group_id', $groupId)
    ->where('created_by', creatorId())
    ->get();
    
    if ($bookings->isEmpty()) {
        return redirect()->route('room-bookings.index')
            ->with('error', __('Booking not found'));
    }
    
    return Inertia::render('Pos/RoomBookings/Receipt', [
        'bookings' => $bookings,
        'groupId' => $groupId,
        'totalAmount' => $bookings->sum('total_amount'),
        'payment' => $bookings->first()->payment,
    ]);
}
```

#### 2. RoomBooking Model (Enhanced)

**New Fields:**
- `booking_group_id` - Links multiple rooms in one transaction
- `item_notes` - Room-specific notes
- `custom_price` - Override price for this room
- `breakfast_price` - Price per person per night
- `includes_breakfast` - Boolean flag

**New Methods:**
```php
public function bookingGroup()
{
    return $this->hasMany(RoomBooking::class, 'booking_group_id', 'booking_group_id');
}

public static function generateBookingGroupId()
{
    return 'BG-' . time() . '-' . Str::random(6);
}
```

## Data Models

### Database Schema Changes

#### Migration: Add Cart-Based Booking Fields

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('room_bookings', function (Blueprint $table) {
            $table->string('booking_group_id', 50)->nullable()->after('booking_number');
            $table->text('item_notes')->nullable()->after('notes');
            $table->decimal('custom_price', 10, 2)->nullable()->after('subtotal');
            $table->decimal('breakfast_price', 10, 2)->nullable()->after('custom_price');
            $table->boolean('includes_breakfast')->default(false)->after('breakfast_price');
            
            $table->index('booking_group_id');
        });
    }

    public function down(): void
    {
        Schema::table('room_bookings', function (Blueprint $table) {
            $table->dropIndex(['booking_group_id']);
            $table->dropColumn([
                'booking_group_id',
                'item_notes',
                'custom_price',
                'breakfast_price',
                'includes_breakfast'
            ]);
        });
    }
};
```

#### Migration: Add Booking Group ID to Payments

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('room_booking_payments', function (Blueprint $table) {
            $table->string('booking_group_id', 50)->nullable()->after('booking_id');
            $table->index('booking_group_id');
        });
    }

    public function down(): void
    {
        Schema::table('room_booking_payments', function (Blueprint $table) {
            $table->dropIndex(['booking_group_id']);
            $table->dropColumn('booking_group_id');
        });
    }
};
```

### Data Validation Rules

**Cart Item Validation:**
- `check_in_date`: Cannot be in the past
- `check_out_date`: Must be after check_in_date
- `number_of_guests`: Must be ≤ room max_occupancy
- `custom_price`: Must be ≥ 0
- `breakfast_price`: Must be ≥ 0
- `item_notes`: Max 500 characters

**Booking Group Validation:**
- All rooms must belong to same warehouse
- All rooms must have same customer
- At least 1 room required in cart
- Maximum 10 rooms per booking group

## Error Handling

### Frontend Error Handling

**Validation Errors:**
- Display inline error messages below form fields
- Highlight invalid fields with red border
- Show toast notification for general errors

**API Errors:**
- Network errors: Show retry button
- 422 Validation errors: Display field-specific messages
- 500 Server errors: Show generic error message with support contact

**Cart Errors:**
- Room no longer available: Remove from cart, show notification
- Price changed: Update cart, show notification
- Stock/availability conflict: Prevent checkout, show message

### Backend Error Handling

**Transaction Rollback:**
```php
DB::beginTransaction();
try {
    // Create bookings
    // Create payments
    // Update room status
    DB::commit();
} catch (\Exception $e) {
    DB::rollBack();
    Log::error('Booking failed', [
        'error' => $e->getMessage(),
        'trace' => $e->getTraceAsString()
    ]);
    throw $e;
}
```

**Validation Errors:**
- Return 422 status with detailed error messages
- Include field names for frontend mapping

**Business Logic Errors:**
- Room not available: Return specific error message
- Insufficient permissions: Return 403 status
- Resource not found: Return 404 status

## Testing Strategy

This feature involves UI interactions, database transactions, and integration with existing systems. Property-based testing is not applicable for the following reasons:

1. **UI Rendering and Interactions**: Cart display, modal interactions, and receipt generation are UI concerns best tested with snapshot tests and integration tests
2. **Database Transactions**: Multi-record creation with rollback logic requires integration testing against a real database
3. **External System Integration**: Revenue module and payment system integration requires mock-based testing
4. **Configuration and Setup**: Customer creation and warehouse selection are one-time setup operations

### Testing Approach

**Unit Tests:**
- Cart calculation functions (subtotal, tax, breakfast, total)
- Price formatting and currency display
- Date range validation
- Guest count validation
- Booking number generation

**Integration Tests:**
- Complete booking flow with multiple rooms
- Customer creation and auto-selection
- Receipt generation with correct data
- Database transaction rollback on error
- Revenue entry creation
- Room status updates

**End-to-End Tests:**
- Full user journey: select rooms → add to cart → modify items → checkout → view receipt
- Inline customer creation flow
- Custom pricing application
- Breakfast addition and calculation
- Discount application

**Manual Testing Scenarios:**
1. Book 3 rooms with different guest counts and breakfast options
2. Apply custom pricing to specific rooms
3. Add notes to each room
4. Create new customer inline
5. Complete booking and verify receipt
6. Verify all database records created correctly
7. Test backward compatibility with existing bookings

### Test Data Requirements

- Multiple warehouses with rooms
- Various room types with different prices
- Customer accounts
- Bank accounts for payment
- Test date ranges (past, present, future)
- Edge cases: max occupancy, minimum nights, maximum booking duration

## Deployment Considerations

### Database Migration Strategy

1. Run migrations in staging environment first
2. Verify existing bookings remain accessible
3. Test new booking creation
4. Run migrations in production during low-traffic period
5. Monitor for errors

### Rollback Plan

If issues arise:
1. Revert code deployment
2. Run down migrations to remove new columns
3. Restore from database backup if necessary
4. Investigate and fix issues in staging
5. Re-deploy when ready

### Performance Considerations

- Index `booking_group_id` for fast group queries
- Eager load relationships to avoid N+1 queries
- Cache available rooms for short duration
- Optimize cart state updates (debounce inputs)
- Limit cart size to 10 rooms maximum

### Backward Compatibility

- Existing bookings without `booking_group_id` continue to work
- Single-room bookings still supported
- Old receipt format still accessible
- API endpoints remain compatible

## Security Considerations

### Input Validation

- Sanitize all user inputs (notes, customer data)
- Validate numeric inputs (prices, guest counts)
- Prevent SQL injection via parameterized queries
- Validate date ranges server-side

### Authorization

- Check user permissions for booking creation
- Verify warehouse access rights
- Ensure users can only view their own bookings
- Validate customer ownership

### Data Protection

- Mask sensitive customer information in logs
- Use HTTPS for all API calls
- Implement CSRF protection
- Rate limit customer creation endpoint

## Monitoring and Logging

### Key Metrics

- Average booking time
- Cart abandonment rate
- Breakfast attachment rate
- Custom pricing usage
- Inline customer creation rate
- Receipt generation success rate

### Logging

```php
Log::info('Booking group created', [
    'booking_group_id' => $bookingGroupId,
    'room_count' => count($bookings),
    'total_amount' => $totalAmount,
    'customer_id' => $customerId,
    'warehouse_id' => $warehouseId
]);

Log::error('Booking failed', [
    'error' => $e->getMessage(),
    'cart_items' => $cartItems,
    'user_id' => Auth::id()
]);
```

### Alerts

- Failed booking transactions
- Payment processing errors
- Revenue entry creation failures
- Room availability conflicts

## Future Enhancements

### Phase 2 Features

- Add products/services to booking (spa, tours, meals)
- Package templates (honeymoon, family, business)
- Loyalty program integration
- Dynamic pricing based on demand
- Multi-currency support

### Phase 3 Features

- Online booking portal for guests
- Calendar view for room selection
- Drag-and-drop room assignment
- Automated email confirmations
- SMS notifications
- Integration with channel managers (Booking.com, Airbnb)

## Appendix

### API Endpoints

**GET /room-bookings/available-rooms**
- Query params: warehouse_id, check_in_date, check_out_date, room_type_id (optional)
- Returns: Array of available rooms

**POST /room-bookings/store**
- Body: Cart items, customer_id, warehouse_id, payment details
- Returns: Redirect to receipt page

**POST /room-bookings/customers/store**
- Body: name, email, phone
- Returns: JSON with new customer data

**GET /room-bookings/receipt/{group_id}**
- Returns: Receipt page with booking details

### Configuration

**Default Breakfast Price:** 5,000 Fr (configurable in settings)
**Tax Rate:** 16% (configurable in settings)
**Max Cart Size:** 10 rooms
**Max Booking Duration:** 365 nights
**Min Booking Duration:** 1 night

### Dependencies

- Laravel 10+
- Inertia.js
- React 18+
- TypeScript
- Tailwind CSS
- Existing UI component library
- PDF generation library (for receipts)
- Email service (for receipt delivery)

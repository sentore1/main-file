# Cancelled Bookings Fix - Revenue Calculation

## Problem
When a booking was cancelled, it was still included in:
- Daily/weekly/monthly revenue reports
- PDF report totals
- Summary statistics on the bookings page

This meant cancelled bookings were counted as revenue even though they were refunded.

## Solution
Modified `RoomBookingController.php` to exclude cancelled bookings by default from all reports and listings.

### Changes Made

**File:** `packages/workdo/Pos/src/Http/Controllers/RoomBookingController.php`

**Methods Updated:**
1. `index()` - Main bookings listing page
2. `downloadReport()` - PDF report generation

**Logic Added:**
```php
if ($request->filled('status')) {
    $query->where('status', $request->get('status'));
} else {
    // Exclude cancelled bookings by default unless specifically filtered
    $query->where('status', '!=', 'cancelled');
}
```

## Behavior After Fix

### Default Behavior (No Status Filter)
- ✅ Cancelled bookings are **hidden** from the list
- ✅ Cancelled bookings are **excluded** from revenue totals
- ✅ Cancelled bookings are **excluded** from PDF reports
- ✅ Summary statistics only count active bookings

### When Status Filter = "Cancelled"
- ✅ Only cancelled bookings are shown
- ✅ Totals reflect cancelled booking amounts
- ✅ PDF reports show only cancelled bookings

### When Status Filter = Any Other Status
- ✅ Only bookings with that specific status are shown
- ✅ Cancelled bookings remain excluded

## Impact on Revenue Tracking

**Before Fix:**
- Cancel a 45,000 Fr booking → Still shows in today's revenue
- Total Revenue: Includes cancelled amounts ❌
- Reports misleading for financial tracking ❌

**After Fix:**
- Cancel a 45,000 Fr booking → Removed from revenue calculations
- Total Revenue: Only active bookings ✅
- Reports accurate for financial tracking ✅
- Refund entry still created in accounting system ✅

## Testing Checklist

- [ ] View bookings page - cancelled bookings should not appear
- [ ] Check summary totals - should exclude cancelled amounts
- [ ] Download PDF report - should not include cancelled bookings
- [ ] Filter by status "Cancelled" - should show only cancelled bookings
- [ ] Filter by status "Checked In" - should show only checked-in bookings
- [ ] Clear all filters - should exclude cancelled bookings again

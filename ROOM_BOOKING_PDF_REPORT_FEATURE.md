# Room Booking PDF Report Download Feature

## Feature Added

Added a **"Download Report"** button to the Room Bookings list page that generates a comprehensive PDF report of all bookings with their payment details.

---

## What It Does

### Button Location
The "Download Report" button is located in the top-right section of the Room Bookings page, next to the "Calendar View" and "New Booking" buttons.

### Report Contents
The PDF report includes:

1. **Company Header**
   - Company logo
   - Report title: "Room Bookings Report"
   - Generation date
   - Date range filter (if applied)

2. **Booking Details Table**
   | Column | Description |
   |--------|-------------|
   | Booking # | Booking number (e.g., #BOOK00484) |
   | Customer | Customer name (or "Walk-in") + breakfast icon 🍳 if included |
   | Room | Room number + room type |
   | Check-in | Check-in date |
   | Check-out | Check-out date |
   | Nights | Number of nights |
   | Total | Total booking amount |
   | Paid | Amount paid |
   | Balance | Outstanding balance |
   | Status | Booking status |

3. **Summary Totals**
   - Total Bookings count
   - Total Revenue (sum of all booking amounts)
   - Total Collected (sum of all payments)
   - Outstanding Balance (total receivables)

---

## How to Use

### Step 1: Apply Filters (Optional)
```
1. Go to: POS → Room Bookings
2. Apply filters:
   - Search by booking number, customer, or room
   - Filter by warehouse
   - Filter by status
   - (Date filters coming soon)
```

### Step 2: Download Report
```
3. Click "Download Report" button (top-right)
4. PDF generates automatically
5. File downloads as: room-bookings-report-2026-05-15.pdf
6. Report window closes automatically
```

### Example Use Cases

**Use Case 1: Monthly Revenue Report**
```
Filter: All bookings
Result: Complete list of all bookings with total revenue
```

**Use Case 2: Outstanding Balances Report**
```
Filter: Status = "Confirmed" or "Checked In"
Result: List of bookings with unpaid balances
```

**Use Case 3: Warehouse-Specific Report**
```
Filter: Warehouse = "East Gate Kigali"
Result: All bookings for that specific location
```

---

## Files Created/Modified

### Frontend Files

**1. Room Bookings Index Page**
- **File:** `packages/workdo/Pos/src/Resources/js/Pages/RoomBookings/Index.tsx`
- **Changes:**
  - Added `Download` icon import
  - Added "Download Report" button with click handler
  - Button builds URL with current filters and opens in new window

**2. Room Bookings Report View** (NEW)
- **File:** `packages/workdo/Pos/src/Resources/js/Pages/RoomBookings/Report.tsx`
- **Purpose:** Renders the PDF report layout
- **Features:**
  - Company logo and header
  - Filterable booking table
  - Summary totals
  - Auto-download PDF on load
  - Loading indicator during generation

### Backend Files

**3. Room Booking Controller**
- **File:** `packages/workdo/Pos/src/Http/Controllers/RoomBookingController.php`
- **Method Added:** `downloadReport(Request $request)`
- **Functionality:**
  - Fetches bookings with filters
  - Calculates totals (amount, paid, balance)
  - Returns Inertia view with data

**4. Routes**
- **File:** `packages/workdo/Pos/src/Routes/web.php`
- **Route Added:** `GET /room-bookings-report/download`
- **Name:** `room-bookings.download-report`

---

## Technical Details

### PDF Generation
- **Library:** html2pdf.js
- **Format:** A4 Landscape
- **Quality:** High (scale: 2, quality: 0.98)
- **Margins:** 0.25 inches

### Report Calculations

```php
// Total Amount
$totalAmount = $bookings->sum('total_amount');

// Total Paid
$totalPaid = $bookings->sum(function($booking) {
    return $booking->payment ? $booking->payment->amount_paid : 0;
});

// Total Balance
$totalBalance = $totalAmount - $totalPaid;
```

### Filter Support
The report respects all current filters:
- ✅ Search (booking number, customer, room)
- ✅ Warehouse filter
- ✅ Status filter
- ⏳ Date range filter (backend ready, frontend to be added)

---

## Visual Example

### Report Header
```
┌─────────────────────────────────────────────┐
│         [Company Logo]                       │
│                                              │
│      Room Bookings Report                    │
│   Generated on: May 15, 2026                 │
│                                              │
└─────────────────────────────────────────────┘
```

### Report Table
```
┌──────────┬──────────┬─────────┬──────────┬──────────┬────────┬──────────┬──────────┬──────────┬──────────┐
│ Booking# │ Customer │ Room    │ Check-in │ Check-out│ Nights │ Total    │ Paid     │ Balance  │ Status   │
├──────────┼──────────┼─────────┼──────────┼──────────┼────────┼──────────┼──────────┼──────────┼──────────┤
│ #BOOK484 │ Jean 🍳  │ Room 011│ 05-15    │ 05-16    │ 1      │ 40,000Fr │ 20,000Fr │ 20,000Fr │ Confirmed│
│          │          │ Mini Ex │          │          │        │          │          │          │          │
├──────────┼──────────┼─────────┼──────────┼──────────┼────────┼──────────┼──────────┼──────────┼──────────┤
│ #BOOK483 │ Niyonsh  │ Room 101│ 05-14    │ 05-15    │ 1      │ 35,000Fr │ 35,000Fr │ -        │ Checked  │
│          │          │ Standard│          │          │        │          │          │          │ In       │
└──────────┴──────────┴─────────┴──────────┴──────────┴────────┴──────────┴──────────┴──────────┴──────────┘
                                                        Total:    75,000Fr   55,000Fr   20,000Fr
```

### Report Footer
```
Total Bookings: 2                    Total Collected: 55,000 Fr
Total Revenue: 75,000 Fr             Outstanding Balance: 20,000 Fr
```

---

## Benefits

### 1. **Financial Reporting**
- Quick overview of total revenue
- See outstanding balances at a glance
- Track payment collection

### 2. **Audit Trail**
- Printable record of all bookings
- Date-stamped reports
- Filter-specific reports

### 3. **Management Insights**
- Identify bookings with unpaid balances
- Track booking trends
- Warehouse-specific performance

### 4. **Professional Documentation**
- Company-branded reports
- Clean, organized layout
- Easy to share with stakeholders

---

## Comparison with POS Orders Report

| Feature | POS Orders | Room Bookings |
|---------|------------|---------------|
| Download Button | ✅ Yes | ✅ Yes |
| PDF Generation | ✅ Yes | ✅ Yes |
| Company Logo | ✅ Yes | ✅ Yes |
| Filter Support | ✅ Yes | ✅ Yes |
| Payment Details | ✅ Total/Paid/Balance | ✅ Total/Paid/Balance |
| Summary Totals | ✅ Yes | ✅ Yes |
| Breakfast Indicator | ❌ No | ✅ Yes (🍳 icon) |
| Room Type Display | ❌ No | ✅ Yes |
| Nights Count | ❌ No | ✅ Yes |

---

## Future Enhancements

### 1. **Date Range Picker**
Add date range filter to frontend:
```tsx
<DateRangePicker 
    from={filters.date_from}
    to={filters.date_to}
    onChange={(range) => setFilters({...filters, ...range})}
/>
```

### 2. **Export to Excel**
Add Excel export option alongside PDF:
```tsx
<Button onClick={exportToExcel}>
    <FileSpreadsheet className="h-4 w-4 mr-2" />
    Export to Excel
</Button>
```

### 3. **Email Report**
Send report directly via email:
```tsx
<Button onClick={emailReport}>
    <Mail className="h-4 w-4 mr-2" />
    Email Report
</Button>
```

### 4. **Scheduled Reports**
Auto-generate and email reports:
```
- Daily summary at 6 AM
- Weekly report every Monday
- Monthly report on 1st of month
```

### 5. **Chart Visualizations**
Add charts to report:
- Revenue trend line chart
- Booking status pie chart
- Payment collection bar chart

---

## Testing Checklist

- [ ] Click "Download Report" button
- [ ] Verify PDF downloads automatically
- [ ] Check company logo appears in PDF
- [ ] Verify all bookings are listed
- [ ] Check totals are calculated correctly
- [ ] Test with search filter applied
- [ ] Test with warehouse filter applied
- [ ] Test with status filter applied
- [ ] Verify breakfast icon (🍳) shows correctly
- [ ] Check room type displays under room number
- [ ] Verify balance shows "-" when fully paid
- [ ] Test with no bookings (empty report)
- [ ] Check PDF filename includes date
- [ ] Verify report window closes after download

---

## Troubleshooting

### Issue: PDF doesn't download
**Solution:** Check browser popup blocker settings

### Issue: Logo doesn't appear
**Solution:** Verify company logo is set in Settings → Company Settings

### Issue: Totals are incorrect
**Solution:** Check that payment relationships are loaded correctly

### Issue: Report is blank
**Solution:** Verify user has "manage-room-bookings" permission

---

## Summary

The Room Booking PDF Report feature provides a professional, comprehensive way to export booking data with payment details. It matches the functionality of the POS Orders report while adding room-specific details like breakfast indicators and room types.

**Key Features:**
- ✅ One-click PDF download
- ✅ Company-branded reports
- ✅ Filter support
- ✅ Payment tracking (Total/Paid/Balance)
- ✅ Summary totals
- ✅ Professional layout

This feature completes the Room Booking management system by providing essential reporting capabilities for financial tracking and business insights.

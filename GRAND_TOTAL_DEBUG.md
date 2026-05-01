# Grand Total Showing 0.00Fr - Debugging Guide

## Current Issue

The Grand Total on the room booking show page displays as "$ 0.00Fr" instead of the correct sum (100,000Fr + 500Fr = 100,500Fr).

## Changes Made

### 1. Backend - RoomBookingController.php

Added explicit type casting and logging:

```php
$totalAmount = $pos->payment ? (float) $pos->payment->discount_amount : 0;
$paidAmount = $pos->payment ? (float) $pos->payment->paid_amount : 0;
$balanceDue = $pos->payment ? (float) $pos->payment->balance_due : 0;

\Log::info('POS Invoice Data', [
    'sale_number' => $pos->sale_number,
    'total_amount' => $totalAmount,
    'paid_amount' => $paidAmount,
    'balance_due' => $balanceDue
]);
```

### 2. Frontend - Show.tsx

Added explicit Number() conversion and debug logging:

```typescript
const totalConsumption = posInvoices?.reduce((sum, invoice) => {
    const amount = Number(invoice.total_amount) || 0;
    return sum + amount;
}, 0) || 0;

const bookingTotal = Number(booking.total_amount) || 0;
const grandTotal = bookingTotal + totalConsumption;

console.log('=== Grand Total Debug ===');
console.log('Booking Total:', bookingTotal, typeof bookingTotal);
console.log('Total Consumption:', totalConsumption, typeof totalConsumption);
console.log('Grand Total:', grandTotal, typeof grandTotal);
console.log('POS Invoices:', posInvoices);
```

## How to Debug

### Step 1: Check Browser Console

1. Open the room booking page that shows 0.00Fr
2. Press F12 to open Developer Tools
3. Click on the "Console" tab
4. Look for the debug output starting with "=== Grand Total Debug ==="

You should see something like:
```
=== Grand Total Debug ===
Booking Total: 100000 number
Total Consumption: 500 number
Grand Total: 100500 number
POS Invoices: Array(1) [...]
```

### Step 2: Check Laravel Logs

Check `storage/logs/laravel.log` for entries like:
```
[timestamp] local.INFO: POS Invoice Data {"sale_number":"#POS00096","total_amount":500,"paid_amount":0,"balance_due":500}
```

## Possible Causes

### 1. Type Conversion Issue
- `booking.total_amount` might be a string "100000" instead of number 100000
- `invoice.total_amount` might be a string "500" instead of number 500
- Solution: Use `Number()` to convert (already implemented)

### 2. Null/Undefined Values
- `posInvoices` might be null or undefined
- `booking.total_amount` might be null
- Solution: Use optional chaining and fallback to 0 (already implemented)

### 3. Data Not Being Passed from Backend
- Backend might not be sending the correct data structure
- Solution: Check Laravel logs and network tab

### 4. React Re-render Issue
- Component might not be re-rendering with new data
- Solution: Check if useEffect or state management is needed

## Expected Console Output

If working correctly, you should see:
```
=== Grand Total Debug ===
Booking Total: 100000 "number"
Total Consumption: 500 "number"
Grand Total: 100500 "number"
POS Invoices: [{
    id: 96,
    sale_number: "#POS00096",
    total_amount: 500,
    balance_due: 500,
    ...
}]
```

If broken, you might see:
```
=== Grand Total Debug ===
Booking Total: NaN "number"
Total Consumption: 0 "number"
Grand Total: NaN "number"
POS Invoices: []
```

## Next Steps

1. **Refresh the page** and check the console output
2. **Share the console output** so I can see what values are being calculated
3. **Check Laravel logs** at `storage/logs/laravel.log` for the POS Invoice Data entries
4. **Check Network tab** (F12 → Network) to see what data is being sent from the server

## Quick Fix to Try

If the issue persists, try this temporary fix to see the raw values:

Replace the Grand Total display with:
```tsx
<span className="text-xl font-bold text-blue-600">
    {bookingTotal} + {totalConsumption} = {grandTotal}
</span>
```

This will show you the raw numbers being calculated.

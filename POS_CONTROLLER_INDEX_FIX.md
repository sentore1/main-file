# POS Controller Index Method - Quick Fix

## Current Issue:
POS Orders list doesn't show:
- Order status (partial/completed)
- Paid amount
- Balance due

## Fix Required in PosController.php

### Location: Line ~75-80 (in index method)

### Current Code:
```php
$sales->getCollection()->transform(function($sale) {
    $sale->total = $sale->payment ? $sale->payment->discount_amount : 0;
    return $sale;
});
```

### Updated Code:
```php
$sales->getCollection()->transform(function($sale) {
    $sale->total = $sale->payment ? $sale->payment->discount_amount : 0;
    $sale->paid_amount = $sale->payment ? $sale->payment->paid_amount : 0;
    $sale->balance_due = $sale->payment ? $sale->payment->balance_due : 0;
    // Status is already in the model, no need to add
    return $sale;
});
```

## This Will Make Available in Frontend:
- `sale.status` - 'completed', 'partial', 'pending', 'cancelled'
- `sale.paid_amount` - Amount customer paid
- `sale.balance_due` - Outstanding balance
- `sale.total` - Total amount (already working)

## Apply This Fix:
Open: `packages/workdo/Pos/src/Http/Controllers/PosController.php`
Find the transform function around line 75-80
Add the two new lines for paid_amount and balance_due

# POS System - Critical Fixes Required

## Issues Identified:

### Issue 1: Phone Column Missing in Users Table ❌
**Error:** `Column not found: 1054 Unknown column 'phone' in 'INSERT INTO'`

**Cause:** The `users` table doesn't have a `phone` column, but the customer creation tries to insert it.

**Fix:** Remove phone from customer creation OR add phone column to users table.

---

### Issue 2: Notes Not Showing on Print/PDF ❌
**Problem:** Item notes are saved but not displayed on receipts.

**Cause:** 
- Controller doesn't load `notes` field
- Print page doesn't display notes

---

### Issue 3: Partial Payment Not Showing on Print/PDF ❌
**Problem:** Partial payment info (paid amount, balance due) not displayed.

**Cause:**
- Controller doesn't load `paid_amount` and `balance_due`
- Print page doesn't display partial payment info

---

## Files That Need Updates:

1. ✅ `PosController.php` - Load notes and partial payment fields
2. ✅ `PosController.php` - Remove phone from customer creation
3. ✅ `Print.tsx` - Display notes on print page
4. ✅ `Print.tsx` - Display partial payment info

---

## Detailed Fixes:

### Fix 1: Remove Phone from Customer Creation
**File:** `packages/workdo/Pos/src/Http/Controllers/PosController.php`

**Current Code (Line ~570):**
```php
$customer->phone = $request->phone;
```

**Fix:** Remove this line since users table doesn't have phone column.

---

### Fix 2: Load Notes in Controller
**File:** `packages/workdo/Pos/src/Http/Controllers/PosController.php`

**Current Code (Line ~485 in show method):**
```php
'items:id,pos_id,product_id,quantity,price,subtotal,tax_ids,tax_amount,total_amount',
```

**Fix:** Add `notes` field:
```php
'items:id,pos_id,product_id,quantity,price,subtotal,tax_ids,tax_amount,total_amount,notes',
```

**Same fix needed in print method (Line ~546)**

---

### Fix 3: Load Partial Payment Fields
**File:** `packages/workdo/Pos/src/Http/Controllers/PosController.php`

**Current Code (Line ~488 in show method):**
```php
'payment:pos_id,discount,amount,discount_amount'
```

**Fix:** Add partial payment fields:
```php
'payment:pos_id,discount,amount,discount_amount,paid_amount,balance_due'
```

**Same fix needed in print method (Line ~549)**

---

### Fix 4: Display Notes on Print Page
**File:** `packages/workdo/Pos/src/Resources/js/Pages/PosOrder/Print.tsx`

**Current Code (Line ~130):**
```tsx
<td className="py-4">
    <div className="font-semibold">{item.product?.name}</div>
    {item.product?.sku && (
        <div className="text-xs text-gray-500">{t('SKU')}: {item.product.sku}</div>
    )}
</td>
```

**Fix:** Add notes display:
```tsx
<td className="py-4">
    <div className="font-semibold">{item.product?.name}</div>
    {item.product?.sku && (
        <div className="text-xs text-gray-500">{t('SKU')}: {item.product.sku}</div>
    )}
    {item.notes && (
        <div className="text-xs text-blue-600 italic mt-1">📝 {item.notes}</div>
    )}
</td>
```

---

### Fix 5: Display Partial Payment on Print Page
**File:** `packages/workdo/Pos/src/Resources/js/Pages/PosOrder/Print.tsx`

**Current Code (Line ~160):**
```tsx
<div className="border-t border-gray-400 pt-2 mt-2">
    <div className="flex justify-between font-bold text-lg">
        <span>{t('TOTAL')}:</span>
        <span>{formatCurrency(sale.total_amount || 0)}</span>
    </div>
</div>
```

**Fix:** Add partial payment info:
```tsx
<div className="border-t border-gray-400 pt-2 mt-2">
    <div className="flex justify-between font-bold text-lg">
        <span>{t('TOTAL')}:</span>
        <span>{formatCurrency(sale.total_amount || 0)}</span>
    </div>
</div>
{sale.payment?.paid_amount !== undefined && sale.payment?.balance_due > 0 && (
    <>
        <div className="flex justify-between text-green-600 font-semibold mt-2">
            <span>{t('Paid')}:</span>
            <span>{formatCurrency(sale.payment.paid_amount)}</span>
        </div>
        <div className="flex justify-between text-orange-600 font-semibold">
            <span>{t('Balance Due')}:</span>
            <span>{formatCurrency(sale.payment.balance_due)}</span>
        </div>
    </>
)}
```

---

## Quick Fix Summary:

### Controller Changes (2 locations):
1. Remove `$customer->phone = $request->phone;`
2. Add `notes` to items loading (2 places)
3. Add `paid_amount,balance_due` to payment loading (2 places)

### Print Page Changes:
1. Add notes display in item row
2. Add partial payment display in summary section

---

## Testing After Fixes:

### Test 1: Customer Creation
- Click + button
- Fill name and email (no phone)
- Should create successfully

### Test 2: Notes on Print
- Create order with notes
- View/Print order
- Notes should appear below product name with 📝 icon

### Test 3: Partial Payment on Print
- Create order with partial payment
- View/Print order
- Should show: Total, Paid, Balance Due

---

## Files to Update:
1. `packages/workdo/Pos/src/Http/Controllers/PosController.php`
2. `packages/workdo/Pos/src/Resources/js/Pages/PosOrder/Print.tsx`

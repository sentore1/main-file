# Payment Methods & Pay Balance Button Fix

## Summary
Added "Bank" and "Check" payment methods to the POS system and fixed the "Pay Balance" button to show for all orders with unpaid balances.

## Changes Made

### 1. New Payment Methods Added
Added two new payment methods:
- **Bank**
- **Check**

### 2. Files Updated

#### Database Migration
- `packages/workdo/Pos/src/Database/Migrations/2026_05_23_000002_add_payment_method_to_pos_payments.php`
  - Added 'bank' and 'check' to enum values

#### Backend Validation
- `packages/workdo/Pos/src/Http/Requests/UpdatePosRequest.php`
- `packages/workdo/Pos/src/Http/Requests/StorePosRequest.php`
- `packages/workdo/Pos/src/Http/Controllers/PosController.php`
  - Updated validation rules to accept 'bank' and 'check'

#### Frontend Components
- `packages/workdo/Pos/src/Resources/js/Pages/Pos/Create.tsx`
  - Added Bank and Check radio buttons in payment modal
  
- `packages/workdo/Pos/src/Resources/js/Pages/PosOrder/Index.tsx`
  - Added 'bank' and 'check' to payment method labels
  - **FIXED**: Pay Balance button now shows for 'pending' status orders
  
- `packages/workdo/Pos/src/Resources/js/Pages/PosOrder/Report.tsx`
- `packages/workdo/Pos/src/Resources/js/Pages/PosOrder/Print.tsx`
- `packages/workdo/Pos/src/Resources/js/Pages/PosOrder/Show.tsx`
  - Added 'bank' and 'check' to payment method labels
  
- `packages/workdo/Pos/src/Resources/js/Pages/PosOrder/PaymentDialog.tsx`
  - Added Bank and Check options to payment method dropdown

### 3. Pay Balance Button Fix

**Before:**
```typescript
{sale.status === 'partial' && sale.balance_due > 0 && ...}
```
- Button only showed for orders with status 'partial'
- Orders with status 'pending' didn't show the button

**After:**
```typescript
{(sale.status === 'partial' || sale.status === 'pending') && sale.balance_due > 0 && ...}
```
- Button now shows for BOTH 'partial' and 'pending' status
- Any order with unpaid balance will show the orange $ button

## Complete Payment Methods List

1. Cash
2. Card
3. Bank Transfer
4. Mobile Money
5. MTN Mobile Money
6. Airtel Money
7. **Bank** (NEW)
8. **Check** (NEW)
9. Charge to Room (conditional - only for guests with active bookings)

## How to Apply Changes

Run the deployment script:
```bash
bash add_bank_check_payment_methods.sh
```

This will:
1. Rollback and re-run the migration
2. Clear all caches
3. Rebuild frontend assets

## Testing

### Test New Payment Methods
1. Go to: https://pryro.eastgatehotel.rw/pos/create
2. Add items to cart
3. Click "Checkout"
4. Verify "Bank" and "Check" options appear in payment methods

### Test Pay Balance Button
1. Go to: https://pryro.eastgatehotel.rw/pos/pos-orders
2. Find an order with:
   - Status: "Pending" or "Partial Payment"
   - Balance > 0
3. Verify orange $ button appears in Actions column
4. Click the $ button
5. Payment dialog should open with all payment methods including Bank and Check

## Balance Display Logic

| Scenario | Balance Column | Pay Button |
|----------|---------------|------------|
| Fully paid (balance = 0) | Gray dash "-" | Hidden |
| Partial payment (balance > 0, status = 'partial') | Orange amount | **Shown** |
| No payment (balance = total, status = 'pending') | Orange amount | **Shown** (FIXED) |

## Notes

- The Pay Balance button requires 'manage-pos' permission
- Currency symbol (Fr) is automatically added by formatCurrency()
- Payment dialog validates amount cannot exceed balance due

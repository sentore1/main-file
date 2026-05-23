# Payment Methods - Complete Guide

## Overview
The POS system now supports 9 payment methods including the newly added **Bank** and **Check** options.

## Available Payment Methods

1. **Cash** - Traditional cash payment
2. **Card** - Credit/Debit card payment
3. **Bank Transfer** - Direct bank transfer
4. **Mobile Money** - Generic mobile money
5. **MTN Mobile Money** - MTN MoMo specific
6. **Airtel Money** - Airtel Money specific
7. **Bank** ✨ NEW
8. **Check** ✨ NEW
9. **Charge to Room** - For hotel guests (conditional)

## Where Payment Methods Are Used

### 1. POS Create Page (`/pos/create`)
**Location:** Payment modal during checkout

**Features:**
- Radio button selection for payment method
- Shows all 9 payment methods
- "Charge to Room" only appears when customer has an active room booking
- Amount paid input field
- Balance due calculation in real-time

**File:** `packages/workdo/Pos/src/Resources/js/Pages/Pos/Create.tsx`

### 2. POS Orders List (`/pos/orders`)
**Location:** Main orders table

**Features:**
- "Payment Mode" column shows the payment method used
- Color-coded badges for each payment method
- "Balance" column shows unpaid amounts in orange
- Shows "-" (gray dash) when fully paid
- **"Pay Balance" button** (💰 icon) appears for partial payments

**File:** `packages/workdo/Pos/src/Resources/js/Pages/PosOrder/Index.tsx`

### 3. Payment Dialog (Add Payment Modal)
**Location:** Triggered by "Pay Balance" button in orders list

**Features:**
- Opens when clicking the 💰 icon on orders with balance due
- Shows order summary (Total, Paid, Balance Due)
- Dropdown to select payment method (includes Bank & Check)
- Input field for payment amount (max = balance due)
- Validates and processes additional payments

**File:** `packages/workdo/Pos/src/Resources/js/Pages/PosOrder/PaymentDialog.tsx`

### 4. POS Order Details (`/pos/orders/{id}`)
**Location:** Order detail view

**Features:**
- Displays payment method used
- Shows payment breakdown
- Balance due highlighted if unpaid

**File:** `packages/workdo/Pos/src/Resources/js/Pages/PosOrder/Show.tsx`

### 5. POS Order Print/Receipt
**Location:** Print view for receipts

**Features:**
- Shows payment method on printed receipt
- Displays balance due if applicable

**File:** `packages/workdo/Pos/src/Resources/js/Pages/PosOrder/Print.tsx`

### 6. POS Reports
**Location:** Sales reports

**Features:**
- Payment method column in reports
- Filterable by payment method

**File:** `packages/workdo/Pos/src/Resources/js/Pages/PosOrder/Report.tsx`

## Balance Due Display Logic

### In Orders List:
```typescript
balance_due > 0 ? 
  <span className="text-orange-600">{formatCurrency(balance_due)}</span> 
  : 
  <span className="text-gray-400">-</span>
```

**Examples:**
| Scenario | Total | Paid | Balance | Display |
|----------|-------|------|---------|---------|
| Fully paid | 10,000 Fr | 10,000 Fr | 0 Fr | `-` (gray) |
| Partial payment | 10,000 Fr | 3,000 Fr | 7,000 Fr | `7,000.00Fr` (orange) |
| Not paid at all | 10,000 Fr | 0 Fr | 10,000 Fr | `10,000.00Fr` (orange) |

### Pay Balance Button:
- **Shows:** When `status === 'partial'` AND `balance_due > 0`
- **Permission:** Requires `manage-pos` permission
- **Icon:** 💰 (DollarSign icon in orange)
- **Action:** Opens PaymentDialog modal

## Backend Validation

### Database Migration
**File:** `packages/workdo/Pos/src/Database/Migrations/2026_05_23_000002_add_payment_method_to_pos_payments.php`

```php
$table->enum('payment_method', [
    'cash', 
    'card', 
    'bank_transfer', 
    'mobile_money', 
    'mtn_momo', 
    'airtel_money', 
    'bank',        // NEW
    'check',       // NEW
    'charge_to_room'
])->default('cash');
```

### Request Validation
**Files:**
- `packages/workdo/Pos/src/Http/Requests/StorePosRequest.php`
- `packages/workdo/Pos/src/Http/Requests/UpdatePosRequest.php`
- `packages/workdo/Pos/src/Http/Controllers/PosController.php`

```php
'payment_method' => 'nullable|in:cash,card,bank_transfer,mobile_money,mtn_momo,airtel_money,bank,check,charge_to_room'
```

## Installation Steps

Run the deployment script:

```bash
bash add_bank_check_payment_methods.sh
```

This script will:
1. Rollback the payment method migration
2. Run the updated migration with new payment methods
3. Clear all caches
4. Rebuild frontend assets

## Testing

### Test Scenario 1: Create POS Order with New Payment Methods
1. Go to `/pos/create`
2. Add items to cart
3. Click "Checkout"
4. Select "Bank" or "Check" as payment method
5. Enter amount paid
6. Complete the order
7. Verify payment method shows correctly in orders list

### Test Scenario 2: Pay Remaining Balance
1. Create an order with partial payment (e.g., pay 3,000 Fr on 10,000 Fr order)
2. Go to `/pos/orders`
3. Find the order with "Partial Payment" status
4. Click the 💰 icon in the Actions column
5. Payment dialog opens showing balance due
6. Select "Bank" or "Check" from dropdown
7. Enter remaining amount
8. Submit payment
9. Verify order status changes to "Completed"

### Test Scenario 3: Unpaid Order
1. Create an order with 0 Fr paid (full balance due)
2. Verify balance column shows full amount in orange
3. Verify 💰 icon appears
4. Click to add payment using new payment methods

## Files Modified

### Frontend (React/TypeScript):
1. `packages/workdo/Pos/src/Resources/js/Pages/Pos/Create.tsx` - Added Bank & Check radio buttons
2. `packages/workdo/Pos/src/Resources/js/Pages/PosOrder/Index.tsx` - Updated payment method labels
3. `packages/workdo/Pos/src/Resources/js/Pages/PosOrder/Report.tsx` - Updated payment method labels
4. `packages/workdo/Pos/src/Resources/js/Pages/PosOrder/Print.tsx` - Updated payment method labels
5. `packages/workdo/Pos/src/Resources/js/Pages/PosOrder/Show.tsx` - Updated payment method labels
6. `packages/workdo/Pos/src/Resources/js/Pages/PosOrder/PaymentDialog.tsx` - Added Bank & Check options

### Backend (PHP/Laravel):
1. `packages/workdo/Pos/src/Database/Migrations/2026_05_23_000002_add_payment_method_to_pos_payments.php` - Added enum values
2. `packages/workdo/Pos/src/Http/Requests/StorePosRequest.php` - Updated validation
3. `packages/workdo/Pos/src/Http/Requests/UpdatePosRequest.php` - Updated validation
4. `packages/workdo/Pos/src/Http/Controllers/PosController.php` - Updated validation

## Currency Symbol

The system uses **"Fr" (Rwandan Franc)** as the currency symbol, configured in company settings:
- Symbol: `Fr`
- Position: After amount (e.g., `10,000.00Fr`)
- Decimal places: 2
- Thousands separator: `,`

## Permissions

- **Create POS orders:** Any user with POS access
- **View POS orders:** `view-pos-orders` permission
- **Add payments (Pay Balance):** `manage-pos` permission

## Notes

- The "Charge to Room" payment method only appears when a customer with an active room booking is selected
- When "Charge to Room" is selected, paid_amount is automatically set to 0
- Balance due is calculated as: `total_amount - paid_amount`
- Orders with balance_due > 0 have status "partial"
- Orders with balance_due = 0 have status "completed"

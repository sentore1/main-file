# POS System Enhancements - Complete Implementation Guide

## Overview
This document outlines all the enhancements made to the POS system to support:
1. **Editable Item Prices** - Adjust prices per transaction without changing database
2. **Item Notes/Comments** - Add custom notes (e.g., "Indian Rice" instead of "Rwanda Rice")
3. **Partial Payments** - Accept partial payments and track balance due
4. **Add Customer from POS** - Create new customers without leaving POS screen

---

## 🗄️ Database Changes

### New Migrations Created:

#### 1. `2025_09_30_000008_add_notes_to_pos_items_table.php`
- **Purpose**: Add notes column to store item-specific comments
- **Column**: `notes` (text, nullable)
- **Location**: `pos_items` table

#### 2. `2025_09_30_000009_add_partial_payment_to_pos_payments_table.php`
- **Purpose**: Support partial payment tracking
- **Columns Added**:
  - `paid_amount` (decimal 10,2) - Amount actually paid
  - `balance_due` (decimal 10,2) - Remaining balance

#### 3. `2025_09_30_000010_update_pos_status_for_partial_payment.php`
- **Purpose**: Add 'partial' status to POS orders
- **Change**: Updated status enum to include 'partial' option

### How to Run Migrations:
```bash
php artisan migrate
```

---

## 📦 Model Updates

### 1. PosItem Model (`Pos/src/Models/PosItem.php`)
**Added to fillable:**
- `notes` - Stores item-specific comments

### 2. PosPayment Model (`Pos/src/Models/PosPayment.php`)
**Added to fillable:**
- `paid_amount` - Amount paid by customer
- `balance_due` - Outstanding balance

**Added to casts:**
- `paid_amount` => 'decimal:2'
- `balance_due` => 'decimal:2'

---

## 🎮 Controller Updates

### PosController (`Pos/src/Http/Controllers/PosController.php`)

#### New Import Added:
```php
use Illuminate\Support\Facades\Hash;
```

#### Updated `store()` Method:
1. **Saves custom prices** - Uses price from cart (can be different from product price)
2. **Saves item notes** - Stores notes for each item
3. **Handles partial payments** - Calculates and saves `paid_amount` and `balance_due`
4. **Updates order status** - Sets status to 'partial' if balance due > 0

#### New Method: `storeCustomer()`
- **Route**: POST `/pos/customers`
- **Purpose**: Create new customer directly from POS
- **Validation**: Requires name and unique email
- **Returns**: JSON with new customer data
- **Permissions**: Requires 'create-pos' permission

---

## 🛣️ Route Updates

### New Route Added (`Pos/src/Routes/web.php`):
```php
Route::post('/pos/customers', [PosController::class, 'storeCustomer'])
    ->name('pos.customers.store');
```

---

## 🎨 Frontend Updates

### Create.tsx (`Pos/src/Resources/js/Pages/Pos/Create.tsx`)

#### New Imports:
- `UserPlus` - Icon for add customer button
- `Edit2` - Icon for edit price button
- `Check` - Icon for confirm edits
- `Hash` - For password hashing

#### Updated Interfaces:
```typescript
interface CartItem extends Product {
    quantity: number;
    customPrice?: number;  // NEW: Custom price for this transaction
    notes?: string;        // NEW: Item-specific notes
}
```

#### New State Variables:
```typescript
const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
const [newCustomer, setNewCustomer] = useState({ name: '', email: '', phone: '' });
const [editingPriceId, setEditingPriceId] = useState<number | null>(null);
const [editingNotesId, setEditingNotesId] = useState<number | null>(null);
```

#### New Functions:

##### 1. `updatePrice(id, newPrice)`
- Updates custom price for specific cart item
- Does NOT change product's base price in database

##### 2. `updateNotes(id, notes)`
- Adds/updates notes for specific cart item
- Notes are saved with the transaction

##### 3. `getItemPrice(item)`
- Returns custom price if set, otherwise returns base price
- Used throughout calculations

##### 4. `handleAddCustomer()`
- Sends POST request to create new customer
- Adds customer to dropdown on success
- Auto-selects newly created customer

---

## 🎯 Feature Details

### Feature 1: Editable Item Prices ✅

**How it works:**
1. Click the **edit icon** (✏️) next to item price in cart
2. Input field appears with current price
3. Type new price (can be higher or lower)
4. Click **checkmark** (✓) to confirm
5. All calculations update automatically
6. Custom price is saved to `pos_items.price` (original product price unchanged)

**Use Case:**
- Big client: Increase price from 1000 to 1200
- Regular client: Keep at 1000
- VIP discount: Reduce to 800
- Product database always shows 1000

---

### Feature 2: Item Notes/Comments ✅

**How it works:**
1. Click **"Add Notes"** button below item in cart
2. Input field appears
3. Type custom note (e.g., "Indian Rice" instead of "Rwanda Rice")
4. Click **checkmark** (✓) to save
5. Note appears below item name with 📝 icon
6. Note is printed on receipt and saved in database

**Use Case:**
- Product: "Rice" (generic)
- Customer wants: "Indian Rice"
- Add note: "Indian Rice"
- Receipt shows: Rice - 📝 Indian Rice
- Original product name stays "Rice"

---

### Feature 3: Partial Payments ✅

**How it works:**
1. Add items to cart
2. Click **Checkout**
3. In payment modal, see **"Amount Paid"** field
4. Total: 10,000
5. Customer pays: 6,000
6. System calculates: Balance Due = 4,000
7. Order status: "partial"
8. Receipt shows: Paid: 6,000 | Due: 4,000

**Database Storage:**
- `pos_payments.amount` = 10,000 (total after discount)
- `pos_payments.paid_amount` = 6,000
- `pos_payments.balance_due` = 4,000
- `pos.status` = 'partial'

---

### Feature 4: Add Customer from POS ✅

**How it works:**
1. Click **"+"** button next to customer dropdown
2. Modal opens with form
3. Fill in:
   - Name (required)
   - Email (required, must be unique)
   - Phone (optional)
4. Click **"Add Customer"**
5. Customer created with 'client' role
6. Automatically selected in dropdown
7. Can immediately use for current sale

**No need to:**
- Leave POS screen
- Go to dashboard
- Navigate to customer management
- Come back to POS

---

## 📊 Data Flow

### Price Adjustment Flow:
```
Product (DB)          Cart Item           POS Item (DB)
sale_price: 1000  →   customPrice: 1200  →  price: 1200
(unchanged)           (temporary)            (saved)
```

### Notes Flow:
```
Product (DB)          Cart Item           POS Item (DB)
name: "Rice"      →   notes: "Indian"   →  notes: "Indian Rice"
(unchanged)           (temporary)            (saved)
```

### Partial Payment Flow:
```
Total: 10,000
Discount: 1,000
After Discount: 9,000
Paid: 5,000
Balance: 4,000

Saved to DB:
- amount: 9,000
- paid_amount: 5,000
- balance_due: 4,000
- status: 'partial'
```

---

## 🖨️ Receipt/Print Updates

All features are visible on printed receipts:
- ✅ Custom prices shown (not original prices)
- ✅ Item notes displayed with 📝 icon
- ✅ Partial payment info: "Paid: X | Due: Y"
- ✅ Customer info (including newly added customers)

---

## 🔒 Permissions

All features respect existing permissions:
- `create-pos` - Required for all POS operations
- `manage-pos-orders` - Required to view orders
- Customer creation uses same `create-pos` permission

---

## 🧪 Testing Checklist

### Test 1: Price Adjustment
- [ ] Add item to cart (price: 1000)
- [ ] Click edit icon
- [ ] Change to 1500
- [ ] Verify total updates
- [ ] Complete sale
- [ ] Check database: `pos_items.price` = 1500
- [ ] Check product: `sale_price` still 1000

### Test 2: Item Notes
- [ ] Add item to cart
- [ ] Click "Add Notes"
- [ ] Type "Indian Rice"
- [ ] Verify note shows in cart
- [ ] Complete sale
- [ ] Check receipt shows note
- [ ] Check database: `pos_items.notes` = "Indian Rice"

### Test 3: Partial Payment
- [ ] Add items (total: 10,000)
- [ ] Click checkout
- [ ] Enter paid amount: 6,000
- [ ] Verify "Balance Due: 4,000" shows
- [ ] Complete sale
- [ ] Check database: `balance_due` = 4000
- [ ] Check order status: 'partial'

### Test 4: Add Customer
- [ ] Click "+" button
- [ ] Fill name: "John Doe"
- [ ] Fill email: "john@test.com"
- [ ] Click "Add Customer"
- [ ] Verify customer appears in dropdown
- [ ] Verify customer is auto-selected
- [ ] Complete sale with new customer

---

## 🚀 Deployment Steps

1. **Backup Database**
   ```bash
   php artisan backup:run
   ```

2. **Run Migrations**
   ```bash
   php artisan migrate
   ```

3. **Clear Cache**
   ```bash
   php artisan cache:clear
   php artisan config:clear
   php artisan view:clear
   ```

4. **Build Frontend**
   ```bash
   npm run build
   ```

5. **Test All Features**
   - Use testing checklist above

---

## 📝 Important Notes

### Price Adjustments:
- ✅ Custom prices are per-transaction only
- ✅ Original product prices never change
- ✅ Each sale can have different prices for same product
- ✅ Price history is maintained in `pos_items` table

### Item Notes:
- ✅ Notes are optional
- ✅ Notes are visible on receipts
- ✅ Notes don't affect product catalog
- ✅ Each transaction can have different notes

### Partial Payments:
- ✅ Can pay any amount (0 to total)
- ✅ Balance due is tracked
- ✅ Status automatically set to 'partial' if balance > 0
- ✅ Future: Can add payment tracking for remaining balance

### Customer Creation:
- ✅ Email must be unique
- ✅ Customer gets 'client' role automatically
- ✅ Random password generated (customer can reset)
- ✅ Immediately available in current session

---

## 🔮 Future Enhancements (Not Implemented)

1. **Multiple Partial Payments**
   - Track multiple payments for one order
   - Payment history table

2. **Customer-Specific Pricing Rules**
   - Auto-apply discounts based on customer
   - Price tiers (VIP, Regular, Wholesale)

3. **Item Variants**
   - Size, color, type options
   - Instead of just notes

4. **Payment Reminders**
   - Send reminders for outstanding balances
   - Email/SMS notifications

---

## 📞 Support

If you encounter issues:
1. Check migration status: `php artisan migrate:status`
2. Check logs: `storage/logs/laravel.log`
3. Clear cache: `php artisan optimize:clear`
4. Rebuild frontend: `npm run build`

---

## ✅ Summary

All requested features have been implemented:

| Feature | Status | Files Modified |
|---------|--------|----------------|
| Editable Prices | ✅ Complete | Frontend only |
| Item Notes | ✅ Complete | Migration + Model + Frontend |
| Partial Payments | ✅ Complete | 2 Migrations + Model + Controller + Frontend |
| Add Customer | ✅ Complete | Controller + Route + Frontend |

**Total Files Modified:** 8
**Total Files Created:** 4 (3 migrations + 1 documentation)

---

**Implementation Date:** 2025
**Version:** 1.0
**Status:** Ready for Testing

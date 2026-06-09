# Daily Financial Report - Hardcoded Items Analysis

**Report URL**: `https://pryro.eastgatehotel.rw/pos/reports/daily-financial`

---

## ❌ HARDCODED ITEMS (Not Connected to Database)

### **1. OPENING BALANCE ON (+)** - Section I
```tsx
// Frontend: DailyFinancial.tsx
<td className="px-3 py-1 text-right">-</td>
```
**Status**: ❌ **HARDCODED** - Returns dash "-"

**What it should be**: 
- Cash balance from the previous day's closing
- Should pull from `opening_balances` table or previous day's closing balance

**Fix Required**:
```php
// Get previous day's closing balance
$previousDate = Carbon::parse($date)->subDay();
$previousClosing = $this->getClosingBalanceForDate($previousDate);
```

---

### **2. OPENING CREDIT (+)** - Section II
```tsx
// Frontend: DailyFinancial.tsx
<td className="px-3 py-1 text-right">-</td>
```
**Status**: ❌ **HARDCODED** - Returns dash "-"

**What it should be**: 
- Outstanding credit/receivables from previous day
- Should track customer credits that carried over

**Fix Required**:
- Create a table to track daily credit balances
- Or calculate from `pos` table where `charged_to_room = true` and unpaid

---

### **3. CASH DEPOSIT SECTION** - Section IV

#### **3.1 MOMO FROM MD**
```php
// Controller: PosReportController.php line 393
'momo_from_md' => 0, // This would come from a separate cash deposit table
```
**Status**: ❌ **HARDCODED** - Always returns 0

**What it should be**: 
- Mobile Money transfers received from Managing Director
- Requires new table: `cash_deposits`

#### **3.2 ADVANCE FROM SPORT CENTER**
```php
'advance_from_sport_center' => 0,
```
**Status**: ❌ **HARDCODED** - Always returns 0

**What it should be**: 
- Advance payments received from sport center operations
- Requires new table or expense category tracking

#### **3.3 CASH COLLECTION**
```php
'cash_collection' => 0,
```
**Status**: ❌ **HARDCODED** - Always returns 0

**What it should be**: 
- Additional cash collected (e.g., from previous credits being paid)
- Should track payments received against outstanding credits

#### **3.4 RECOVERY** ✅
```php
'recovery' => $totalRecovery,  // ✅ CALCULATED from sales
```
**Status**: ✅ **DYNAMIC** - Calculated from sales payment methods

---

## ✅ DYNAMIC DATA (Connected to Database)

### **1. SALES SECTION** - Section III
**Status**: ✅ **FULLY DYNAMIC**

**Data Sources**:
```php
// All department sales pulled from:
- pos table (main sales)
- pos_items table (line items)
- room_bookings table (room sales)
- product_service_items table (products)
- categories table (department classification)
- bank_accounts table (payment methods)
```

**Department Categories**:
1. ✅ RESTAURANT SALES - `categories` with 'Restaurant', 'Food', 'Beverage'
2. ✅ BAR SALES - `categories` with 'Bar', 'Drink', 'Alcohol'
3. ✅ ROOM SALES - `room_bookings` table
4. ✅ COFFEE SHOP SALES - `categories` with 'Coffee', 'Cafe'
5. ✅ SALLE SALES - `categories` with 'Hall', 'Event', 'Salle'
6. ✅ SAUNA & MASSAGE SALES - `categories` with 'Spa', 'Massage', 'Sauna', 'Facility'
7. ✅ SWIMMING POOL/CLOTHES SALES - `categories` with 'Pool', 'Swimming', 'Clothes'
8. ✅ GYM SALES - `categories` with 'Gym', 'Fitness'
9. ✅ POOL SALES (Billiards) - `categories` with 'Pool', 'Billiard', 'Snooker'
10. ✅ SERVICES AND OTHERS - Catch-all for unmatched categories

**Payment Methods** (All Dynamic):
- ✅ CASH
- ✅ MOMO (Mobile Money)
- ✅ CREDIT (Room charges)
- ✅ POS BANK (Card payments)
- ✅ VISACARD
- ✅ ADVANCE
- ✅ COMPLEMENTARY
- ✅ RECOVERY
- ✅ EXCEDENT
- ✅ BREAKFAST ROOM

---

### **2. PURCHASES SECTION** - Section V
**Status**: ✅ **FULLY DYNAMIC**

**Data Source**:
```php
// Controller: getPurchasesForDate()
$purchaseInvoices = \App\Models\PurchaseInvoice::where('created_by', $creatorId)
    ->whereDate('invoice_date', $date)
    ->with('items.product.category')
    ->get();
```

**Categories**:
- ✅ Bar Purchases (Paid & Credit)
- ✅ Resto Purchases (Paid & Credit)
- ✅ Maintenance/Office/Reception (Paid & Credit)
- ✅ Coffee Shop (Paid & Credit)
- ✅ Sport Center (Paid & Credit)
- ✅ House Keeping (Paid & Credit)

---

### **3. OTHER EXPENSES SECTION** - Section VI
**Status**: ✅ **FULLY DYNAMIC**

**Data Source**:
```php
// Controller: getOtherExpensesForDate()
$expenseRecords = \Workdo\Account\Models\Expense::where('created_by', $creatorId)
    ->whereDate('expense_date', $date)
    ->get();
```

**Tracks**:
- ✅ Paid Expenses
- ✅ Credit Expenses

**Expense Model Fields**:
- `expense_number`
- `expense_date`
- `category_id` (links to `expense_categories` table)
- `bank_account_id`
- `chart_of_account_id`
- `amount`
- `description`
- `reference_number`
- `status` (determines if paid or credit)

---

### **4. CLOSING BALANCE**
**Status**: ✅ **PARTIALLY DYNAMIC**

**Calculation**:
```php
$totalCashAvailable = $totalCash + $cashDeposit['total'];
$totalPurchases = $purchases['total'];
$totalOtherExpenses = $otherExpenses['total'];
$closingBalance = $totalCashAvailable - $totalPurchases - $totalOtherExpenses;
```

**Issue**: 
- ⚠️ Since `cashDeposit['total']` is hardcoded to 0, the closing balance calculation is incomplete
- ⚠️ Does not consider opening balance

---

## 🔍 PETTY CASH ANALYSIS

### **Q: Does the system have Petty Cash functionality?**

**Answer**: ❌ **NO DEDICATED PETTY CASH MODULE**, but petty cash can be tracked through:

#### **Option 1: Through Expense Module** ✅ (Currently Available)
```
Expenses Table:
- expense_number
- expense_date
- category_id → Can create "Petty Cash" category
- bank_account_id → Can create "Petty Cash" account
- amount
- status (paid/unpaid)
```

**How to use for Petty Cash**:
1. Create expense category: "Petty Cash"
2. Create bank account: "Petty Cash Fund"
3. Record all petty cash transactions as expenses with this category
4. They will appear in "OTHER EXPENSES" section

#### **Option 2: Through Chart of Accounts** ✅ (Available in DoubleEntry module)
```
Chart of Accounts → Current Assets → Petty Cash Account
Opening Balances → Track daily petty cash opening balance
Journal Entries → Record petty cash disbursements
```

---

## 📊 COMPLETE FINANCIAL STATEMENT COMPARISON

### **What the Daily Financial Report SHOULD Include**:

| Section | Current Status | Database Source | Notes |
|---------|---------------|-----------------|-------|
| **Opening Balance** | ❌ Hardcoded "-" | `opening_balances` or previous day's closing | Need to implement |
| **Opening Credit** | ❌ Hardcoded "-" | Calculate from unpaid credits | Need to implement |
| **Sales** | ✅ Dynamic | `pos`, `pos_items`, `room_bookings` | **Working** |
| **Cash Deposit - MOMO from MD** | ❌ Returns 0 | Need `cash_deposits` table | Need to create |
| **Cash Deposit - Advance from Sport** | ❌ Returns 0 | Need `cash_deposits` table | Need to create |
| **Cash Deposit - Cash Collection** | ❌ Returns 0 | Calculate from credit payments | Need to implement |
| **Cash Deposit - Recovery** | ✅ Dynamic | Calculated from sales | **Working** |
| **Purchases** | ✅ Dynamic | `purchase_invoices` | **Working** |
| **Other Expenses** | ✅ Dynamic | `expenses` table | **Working** |
| **Petty Cash** | ❌ Not tracked separately | Can use `expenses` with category | Manual workaround |
| **Closing Balance** | ⚠️ Partial | Calculation incomplete | Missing opening + deposits |

---

## 🛠️ RECOMMENDED FIXES

### **Priority 1: Critical for Accurate Reporting**

#### **1. Create Cash Deposits Table**
```sql
CREATE TABLE cash_deposits (
    id BIGINT PRIMARY KEY,
    deposit_date DATE,
    deposit_type VARCHAR(50), -- 'momo_from_md', 'sport_center_advance', 'cash_collection'
    amount DECIMAL(10,2),
    description TEXT,
    reference_number VARCHAR(100),
    bank_account_id BIGINT,
    warehouse_id BIGINT,
    created_by BIGINT,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

#### **2. Track Opening Balances**
```php
// Add to controller
private function getOpeningBalanceForDate($date)
{
    $previousDate = Carbon::parse($date)->subDay()->toDateString();
    
    // Option A: Get from opening_balances table
    $openingBalance = OpeningBalance::whereDate('effective_date', $date)
        ->where('created_by', creatorId())
        ->first();
    
    if ($openingBalance) {
        return $openingBalance->opening_balance;
    }
    
    // Option B: Calculate from previous day's closing
    return $this->getClosingBalanceForDate($previousDate);
}
```

#### **3. Track Opening Credits**
```php
private function getOpeningCreditForDate($date)
{
    $previousDate = Carbon::parse($date)->subDay()->toDateString();
    
    // Get all unpaid credits from before this date
    return Pos::where('charged_to_room', true)
        ->whereDate('pos_date', '<', $date)
        ->whereDoesntHave('payment', function($q) use ($date) {
            $q->whereDate('payment_date', '<', $date);
        })
        ->sum('total_amount');
}
```

---

### **Priority 2: Enhance Reporting**

#### **4. Add Petty Cash Tracking**
```php
// Create dedicated petty cash expense category
private function getPettyCashForDate($date)
{
    return Expense::whereDate('expense_date', $date)
        ->where('created_by', creatorId())
        ->whereHas('category', function($q) {
            $q->where('name', 'Petty Cash');
        })
        ->sum('amount');
}
```

#### **5. Separate Petty Cash Section in Report**
Add new section between "Other Expenses" and "Closing Balance":
```
VII. PETTY CASH DISBURSEMENTS
    - Office Supplies
    - Transportation
    - Miscellaneous
    - TOTAL PETTY CASH
```

---

## 📋 SUMMARY

### **Hardcoded Items** (Need Database Implementation):
1. ❌ Opening Balance ON (+)
2. ❌ Opening Credit (+)
3. ❌ MOMO FROM MD
4. ❌ ADVANCE FROM SPORT CENTER
5. ❌ CASH COLLECTION
6. ❌ Petty Cash (not tracked separately)

### **Dynamic Items** (Working Correctly):
1. ✅ All Sales by Department
2. ✅ All Payment Methods (CASH, MOMO, CREDIT, POS, etc.)
3. ✅ Purchases by Category
4. ✅ Other Expenses
5. ✅ Recovery (from sales)

### **Partially Working**:
1. ⚠️ Closing Balance (calculation exists but incomplete due to missing opening balance and cash deposits)

---

## 🎯 NEXT STEPS

To make the Daily Financial Report fully functional:

1. **Create `cash_deposits` table and migration**
2. **Create `CashDeposit` model and controller**
3. **Build UI to record cash deposits**
4. **Implement opening balance logic**
5. **Add petty cash category to expenses**
6. **Update closing balance calculation to include all components**
7. **Add validation to ensure opening balance matches previous closing**

Would you like me to implement any of these fixes?

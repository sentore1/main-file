# Payment Method Detection - Technical Explanation

## 🔍 How Payment Methods Are Determined

The payment methods shown in the Daily Financial Report are **SEMI-DYNAMIC** - they use a smart detection system based on bank account names.

---

## 📊 Current System Architecture

### **1. Data Storage (Database)**

When a POS sale is made, the system stores:

```php
pos table:
- id
- sale_number
- customer_id
- warehouse_id
- pos_date
- bank_account_id    ← KEY FIELD (nullable)
- charged_to_room    ← KEY FIELD (boolean)
- waiter_name
- created_by

pos_payments table:
- id
- pos_id
- discount_amount    ← Final amount paid
- paid_amount
- balance_due
```

### **2. Payment Method Detection Logic**

The report uses this decision tree to determine payment method:

```
FOR EACH SALE:
  │
  ├─ Is charged_to_room = true?
  │   └─ YES → Payment Method = CREDIT (Room Charge)
  │   
  ├─ Is bank_account_id set?
  │   ├─ YES → Look up bank account name
  │   │   │
  │   │   ├─ Account name contains "momo" or "mobile"?
  │   │   │   └─ YES → Payment Method = MOMO
  │   │   │
  │   │   ├─ Account name contains "pos" or "card"?
  │   │   │   └─ YES → Payment Method = POS CARD
  │   │   │
  │   │   ├─ Account name contains "visa"?
  │   │   │   └─ YES → Payment Method = VISACARD
  │   │   │
  │   │   └─ Otherwise → Payment Method = CASH
  │   │
  │   └─ NO → Payment Method = CASH (default)
  │
  └─ If no bank_account_id → Payment Method = CASH
```

---

## 💻 Code Implementation

### **Location:** `PosReportController.php` → `groupSalesByPaymentMethod()`

```php
if ($sale->charged_to_room) {
    // Customer charged to room - will pay later
    $result['credit'] += $amount;
    
} elseif ($sale->bank_account_id) {
    // Payment went through a bank account
    $bankAccount = \Workdo\Account\Models\BankAccount::find($sale->bank_account_id);
    
    if ($bankAccount) {
        $accountName = strtolower($bankAccount->account_name);
        
        // Check account name for keywords
        if (str_contains($accountName, 'momo') || str_contains($accountName, 'mobile')) {
            $result['momo'] += $amount;  // Mobile Money
            
        } elseif (str_contains($accountName, 'pos') || str_contains($accountName, 'card')) {
            $result['pos_bank'] += $amount;  // POS Card
            
        } elseif (str_contains($accountName, 'visa')) {
            $result['visacard'] += $amount;  // Visa Card
            
        } else {
            $result['cash'] += $amount;  // Other accounts = Cash
        }
    } else {
        $result['cash'] += $amount;  // Account not found = Cash
    }
    
} else {
    // No bank account selected = Cash payment
    $result['cash'] += $amount;
}
```

---

## 🎯 What IS Dynamic vs What IS Hardcoded

### ✅ **DYNAMIC (Pulled from Database):**

1. **Transaction Amounts** - Real amounts from `pos_payments.discount_amount`
2. **Transaction Counts** - Actual number of transactions
3. **Bank Account Names** - Retrieved from `bank_accounts` table
4. **Payment Method Categories** - Determined by bank account name matching
5. **Date Filtering** - Only shows transactions for selected date
6. **Branch Filtering** - Only shows transactions for selected warehouse

### ⚠️ **SEMI-HARDCODED (Fixed Categories with Dynamic Detection):**

The **payment method categories** are fixed in code:
- Cash
- MOMO (Mobile Money)
- POS Card
- Visa Card
- Credit (Room Charge)

But the **detection** is dynamic based on bank account names.

### ❌ **HARDCODED (Fixed in Code):**

1. **Payment Method Labels** - "MOMO", "POS CARD", "VISACARD", "CREDIT", "CASH"
2. **Detection Keywords** - "momo", "mobile", "pos", "card", "visa"
3. **Default Behavior** - No bank account = Cash

---

## 🔧 How to Set Up Bank Accounts

### **Step 1: Create Bank Accounts**

Go to: **Accounting → Bank Accounts**

Create accounts with these names (case-insensitive):

```
✅ Cash Account              → Detected as: CASH
✅ Mobile Money (MOMO)       → Detected as: MOMO
✅ MTN Mobile Money          → Detected as: MOMO
✅ Airtel Money              → Detected as: MOMO
✅ POS Card Machine          → Detected as: POS CARD
✅ Card Payment              → Detected as: POS CARD
✅ Visa Card Terminal        → Detected as: VISACARD
✅ Visa Payments             → Detected as: VISACARD
✅ Bank Transfer             → Detected as: CASH (no keywords)
```

### **Step 2: Configure POS to Use Accounts**

When cashier makes a sale, they select the bank account:
- Cash Register → Cash
- Mobile Money Account → MOMO
- Card Terminal → POS Card
- etc.

### **Step 3: For Room Charges**

Check the "Charge to Room" option → Automatically detected as CREDIT

---

## 📋 Examples

### **Example 1: Cash Sale**

```
Sale:
- bank_account_id = NULL
- charged_to_room = false

Detection:
→ No bank account
→ Not charged to room
→ Payment Method = CASH ✅
```

### **Example 2: Mobile Money Sale**

```
Sale:
- bank_account_id = 5
- charged_to_room = false

Bank Account #5:
- account_name = "MTN Mobile Money"

Detection:
→ Has bank account
→ Account name contains "mobile"
→ Payment Method = MOMO ✅
```

### **Example 3: Card Sale**

```
Sale:
- bank_account_id = 7
- charged_to_room = false

Bank Account #7:
- account_name = "POS Card Terminal"

Detection:
→ Has bank account
→ Account name contains "pos" and "card"
→ Payment Method = POS CARD ✅
```

### **Example 4: Room Charge**

```
Sale:
- bank_account_id = NULL
- charged_to_room = true

Detection:
→ charged_to_room = true
→ Payment Method = CREDIT ✅
```

### **Example 5: Visa Card**

```
Sale:
- bank_account_id = 9
- charged_to_room = false

Bank Account #9:
- account_name = "Visa Card Payments"

Detection:
→ Has bank account
→ Account name contains "visa"
→ Payment Method = VISACARD ✅
```

---

## 🚨 Potential Issues

### **Issue 1: Wrong Bank Account Selected**

**Problem:**
```
Cashier receives CASH but selects "MTN Mobile Money" account
→ Report shows as MOMO payment
→ Cash count won't match!
```

**Solution:**
- Train staff to select correct account
- Create clear account names
- Label accounts in POS interface

### **Issue 2: Ambiguous Account Names**

**Problem:**
```
Bank Account Name: "Main Account"
→ Doesn't contain any keywords
→ Detected as CASH
```

**Solution:**
- Rename to be specific: "Main Cash Account"
- Or: "Main Bank Account - Card Payments"

### **Issue 3: Multiple Keywords**

**Problem:**
```
Bank Account Name: "Mobile POS Card"
→ Contains both "mobile" and "pos"
→ Which one wins?
```

**Solution:**
- System checks in order: momo/mobile → pos/card → visa
- First match wins
- Use clear names: "Mobile Money Only" or "POS Card Only"

---

## 🔄 Making It Fully Dynamic

If you want to make payment methods **completely dynamic** (not relying on name matching), you would need:

### **Option 1: Add Payment Method Field to POS Table**

```php
Migration:
Schema::table('pos', function (Blueprint $table) {
    $table->enum('payment_method', [
        'cash',
        'momo',
        'pos_card',
        'visa',
        'credit'
    ])->nullable();
});
```

### **Option 2: Add Method to Bank Accounts**

```php
Migration:
Schema::table('bank_accounts', function (Blueprint $table) {
    $table->enum('payment_type', [
        'cash',
        'mobile_money',
        'card',
        'bank_transfer'
    ])->default('cash');
});
```

### **Option 3: Create Payment Methods Table**

```php
create_payment_methods_table:
- id
- name (e.g., "Mobile Money")
- code (e.g., "momo")
- is_active
- icon
- color

Then link:
pos.payment_method_id → payment_methods.id
```

---

## ✅ Recommended Setup

### **For Your Hotel, Create These Accounts:**

```
1. Cash Register
   - Type: Cash
   - Detection: Default

2. MTN Mobile Money
   - Type: Mobile Money
   - Detection: Contains "mobile" or "momo"

3. Airtel Money
   - Type: Mobile Money
   - Detection: Contains "mobile"

4. POS Card Machine
   - Type: Card
   - Detection: Contains "pos" or "card"

5. Visa Terminal
   - Type: Card
   - Detection: Contains "visa"

6. Bank Transfer (Optional)
   - Type: Bank
   - Detection: None (falls to cash)
```

### **Special: Room Charges**

- Don't need bank account
- Just check "Charge to Room"
- Automatically detected as CREDIT

---

## 📊 Current Detection Summary

| **Scenario** | **bank_account_id** | **charged_to_room** | **Account Name** | **Detected As** |
|--------------|---------------------|---------------------|------------------|-----------------|
| Cash payment | NULL | false | - | CASH |
| Cash via account | 1 | false | "Cash Register" | CASH |
| Mobile Money | 2 | false | "MTN MOMO" | MOMO |
| Card payment | 3 | false | "POS Card" | POS CARD |
| Visa payment | 4 | false | "Visa Terminal" | VISACARD |
| Room charge | NULL | true | - | CREDIT |
| Bank transfer | 5 | false | "Bank Account" | CASH * |

*Bank transfers without keywords default to CASH

---

## 🎓 Training Points for Staff

1. **Always select correct account** when making sale
2. **Cash = No account** or "Cash Register" account
3. **MOMO = Mobile Money** accounts
4. **Card = Card terminals**
5. **Room Charge = Check** "Charge to Room" box
6. **Wrong selection = Wrong report** = Cash won't balance!

---

## 🔍 How to Verify Detection

### **Method 1: Check Database**

```sql
SELECT 
    p.id,
    p.sale_number,
    p.bank_account_id,
    p.charged_to_room,
    ba.account_name,
    pp.discount_amount
FROM pos p
LEFT JOIN bank_accounts ba ON p.bank_account_id = ba.id
LEFT JOIN pos_payments pp ON p.id = pp.pos_id
WHERE DATE(p.pos_date) = '2026-06-10';
```

### **Method 2: Check Report**

1. Generate Daily Financial Report
2. Look at "Payment Method Breakdown" section
3. Verify counts and amounts match expectations

### **Method 3: Test Each Payment Type**

Make test sales:
- 1 Cash sale
- 1 MOMO sale
- 1 Card sale
- 1 Room charge

Generate report → Should show:
- Cash: 1 trans
- MOMO: 1 trans
- POS Card: 1 trans
- Credit: 1 trans

---

## ✨ Benefits of Current System

1. **Flexible** - No code changes needed for new accounts
2. **Simple** - Just name accounts correctly
3. **Automatic** - Detection happens automatically
4. **Accurate** - Based on actual database records
5. **Traceable** - Can see which account was used

---

## 🚀 Future Enhancements

1. **Admin UI** - Configure payment method keywords
2. **Payment Method Master** - Dedicated payment methods table
3. **Icon Support** - Visual icons for each method
4. **Custom Categories** - Add your own payment types
5. **Multi-language** - Payment method names in different languages

---

**Document Version:** 1.0  
**Last Updated:** June 10, 2026  
**Technical Contact:** System Administrator

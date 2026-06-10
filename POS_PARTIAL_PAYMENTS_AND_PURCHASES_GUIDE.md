# POS Partial Payments & Purchase Viewing Guide

---

## 📋 QUESTION 1: Can POS Orders Record Partial Payments and Unpaid Orders?

### **Answer: YES! ✅**

The POS system has **full support** for partial payments and tracking unpaid orders.

---

## 💰 HOW PARTIAL PAYMENTS WORK

### **1. Payment Fields in Database**

Every POS order has these payment tracking fields in `pos_payments` table:

```php
- amount              // Total before discount
- discount            // Discount applied
- discount_amount     // Total after discount (amount - discount)
- paid_amount         // How much customer has paid
- balance_due         // Remaining unpaid (discount_amount - paid_amount)
- payment_method      // How they paid (cash, MOMO, card, etc.)
```

### **2. Order Status Based on Payment**

The system automatically assigns status based on payment completion:

| Status | Condition | Meaning |
|--------|-----------|---------|
| **`completed`** | `balance_due = 0` | Fully paid |
| **`partial`** | `balance_due > 0` AND `paid_amount > 0` | Partially paid |
| **`pending`** | `paid_amount = 0` | Nothing paid yet (full credit) |
| **`charged_to_room`** | `charged_to_room = true` | Added to room bill |

### **3. Example Scenarios**

#### **Scenario A: Full Payment**
```
Order Total: 10,000 RWF
Discount: 0
Amount Due: 10,000
Paid: 10,000
Balance: 0
Status: completed ✅
```

#### **Scenario B: Partial Payment**
```
Order Total: 10,000 RWF
Discount: 0
Amount Due: 10,000
Paid: 5,000
Balance: 5,000
Status: partial 🟠
```

#### **Scenario C: No Payment (Credit)**
```
Order Total: 10,000 RWF
Discount: 0
Amount Due: 10,000
Paid: 0
Balance: 10,000
Status: pending 🔴
```

#### **Scenario D: Charged to Room**
```
Order Total: 10,000 RWF
Discount: 0
Amount Due: 10,000
Paid: 10,000 (via room charge)
Balance: 0
Status: completed ✅ (charged_to_room flag = true)
Note: Amount added to guest's room bill
```

---

## 🔍 VIEWING UNPAID & PARTIALLY PAID ORDERS

### **On the `/pos/orders` Page:**

The table shows these key columns:

| Sale Number | Customer | Total | Paid | Balance | Status | Actions |
|-------------|----------|-------|------|---------|--------|---------|
| #POS00001 | John Doe | 10,000 | 10,000 | 0 | Completed ✅ | View |
| #POS00002 | Jane Smith | 15,000 | 7,500 | 7,500 | Partial Payment 🟠 | View • **Pay Balance** |
| #POS00003 | Walk-in | 5,000 | 0 | 5,000 | Pending 🔴 | View • **Pay Balance** |

### **Key Features:**

1. **Balance Column** - Shows remaining unpaid amount (in orange if > 0)
2. **Status Badge** - Color-coded status:
   - ✅ Green = Completed (fully paid)
   - 🟠 Orange = Partial Payment
   - 🟡 Yellow = Pending (unpaid)
3. **Pay Balance Button** (💰) - Appears for orders with `balance_due > 0`

---

## 💳 ADDING PAYMENT TO UNPAID/PARTIAL ORDERS

### **Method 1: Via "Pay Balance" Button**

1. Go to `/pos/orders`
2. Find the order with outstanding balance
3. Click the **💰 Pay Balance** button
4. Payment dialog opens:
   ```
   Order: #POS00002
   Total Amount: 15,000
   Already Paid: 7,500
   Balance Due: 7,500
   
   [Enter Payment Amount: ______]
   [Payment Method: Cash ▼]
   
   [Submit Payment]
   ```
5. Enter amount (can be full balance or another partial payment)
6. System updates:
   - `paid_amount` increases
   - `balance_due` decreases
   - Status changes to `completed` if fully paid, stays `partial` if still has balance

### **Method 2: Via Edit Order Page**

1. Go to `/pos/orders/{id}/edit`
2. Update the `paid_amount` field
3. Save changes
4. System recalculates `balance_due` and updates status

---

## 📊 FILTERING UNPAID ORDERS

### **Filter Options Available:**

On `/pos/orders` page, click the **Filter** button and use:

1. **Status Filter:**
   - `All Status` - Shows everything
   - `Completed` - Only fully paid orders
   - `Partial Payment` - Only partially paid orders ⭐
   - `Pending` - Only unpaid orders ⭐

2. **Search Filter:**
   - Search by order number, customer name, or warehouse

3. **Date Range Filter:**
   - Filter by specific date range to find old unpaid orders

### **Quick Reports:**

**Find All Unpaid Orders:**
```
Filter: Status = "Pending" OR "Partial Payment"
Result: List of all orders with balance_due > 0
```

**Find Old Unpaid Orders (Overdue Credits):**
```
Filter: Status = "Pending" OR "Partial Payment"
Date Range: > 30 days ago
Result: Orders that haven't been paid for over 30 days
```

---

## 📈 TRACKING IN DAILY FINANCIAL REPORT

### **How Partial/Unpaid Orders Appear:**

In the Daily Financial Report (`/pos/reports/daily-financial`):

#### **Sales Section (Section III):**
```
RESTAURANT SALES
  CASH: 50,000          ← Only includes paid_amount for cash orders
  MOMO: 30,000          ← Only paid_amount
  CREDIT: 120,000       ← Includes charged_to_room orders + unpaid balances
  POS BANK: 25,000      ← Only paid_amount
  TOTAL: 225,000        ← Sum of ALL orders (regardless of payment status)
```

⚠️ **Important:** The "CREDIT" line includes:
- Orders marked as `charged_to_room = true` (added to room bill)
- Orders with `balance_due > 0` (unpaid or partial)

#### **Opening Credit (Section II):**
```
OPENING CREDIT (+)
Amount: 50,000         ← Unpaid credits carried forward from previous days
```

This should show:
- All orders from BEFORE today that still have `balance_due > 0`
- These are outstanding receivables

---

## 🛠️ DATABASE QUERIES FOR TRACKING

### **Query 1: Find All Unpaid Orders**
```php
$unpaidOrders = Pos::whereHas('payment', function($q) {
    $q->where('balance_due', '>', 0);
})
->with(['customer', 'payment'])
->orderBy('pos_date', 'asc')
->get();
```

### **Query 2: Find Partial Payments**
```php
$partialPayments = Pos::where('status', 'partial')
    ->with(['customer', 'payment'])
    ->get();
```

### **Query 3: Total Unpaid Amount (Receivables)**
```php
$totalReceivables = PosPayment::where('balance_due', '>', 0)
    ->sum('balance_due');
```

### **Query 4: Unpaid Orders for a Specific Customer**
```php
$customerUnpaid = Pos::where('customer_id', $customerId)
    ->whereHas('payment', function($q) {
        $q->where('balance_due', '>', 0);
    })
    ->with('payment')
    ->get();
```

### **Query 5: Old Unpaid Orders (> 30 days)**
```php
$overdueOrders = Pos::whereDate('pos_date', '<', now()->subDays(30))
    ->whereHas('payment', function($q) {
        $q->where('balance_due', '>', 0);
    })
    ->with(['customer', 'payment'])
    ->get();
```

---

## 📋 QUESTION 2: Can We See All Purchases?

### **Answer: YES! ✅**

There is a dedicated **Purchase Invoices** module.

---

## 🛒 VIEWING ALL PURCHASES

### **Purchase Invoice Page:**

**URL:** `/purchase-invoices`

**Route Name:** `purchase-invoices.index`

### **What It Shows:**

The Purchase Invoices page displays:

| Invoice # | Vendor | Warehouse | Invoice Date | Due Date | Subtotal | Tax | Total | Balance | Status | Actions |
|-----------|--------|-----------|--------------|----------|----------|-----|-------|---------|--------|---------|
| INV-001 | ABC Suppliers | Main | 10/06/26 | 20/06/26 | 100,000 | 18,000 | 118,000 | 0 | Posted | View • Print |
| INV-002 | XYZ Traders | Restaurant | 09/06/26 | 19/06/26 | 50,000 | 9,000 | 59,000 | 29,500 | Partial | View • Pay |
| INV-003 | Food Ltd | Bar | 08/06/26 | 18/06/26 | 200,000 | 36,000 | 236,000 | 236,000 | Posted | View |

---

## 🔍 PURCHASE INVOICE DETAILS

### **Database Tables:**

1. **`purchase_invoices`** (Main table)
   ```php
   - invoice_number
   - vendor_id (supplier)
   - warehouse_id (destination)
   - invoice_date
   - due_date
   - subtotal
   - tax_amount
   - total_amount
   - balance_amount (unpaid amount)
   - status (draft, posted, partial, cancelled)
   - created_by, creator_id
   ```

2. **`purchase_invoice_items`** (Line items)
   ```php
   - purchase_invoice_id
   - product_id
   - quantity
   - price
   - subtotal
   - tax_amount
   - total_amount
   ```

---

## 📊 PURCHASE FILTERS AVAILABLE

On the `/purchase-invoices` page, you can filter by:

1. **Vendor** - Which supplier
2. **Warehouse** - Which branch/location
3. **Status:**
   - Draft - Not yet posted
   - Posted - Finalized
   - Partial - Partially paid
   - Overdue - Past due date with balance
4. **Search** - By invoice number
5. **Date Range** - Filter by invoice date

---

## 📈 PURCHASES IN DAILY FINANCIAL REPORT

### **Purchase Section (Section V):**

In the Daily Financial Report, purchases are categorized:

```
V. PURCHASES

BAR PURCHASES
  Paid:     50,000
  Credit:   20,000

RESTO PURCHASES
  Paid:     80,000
  Credit:   30,000

MAINTENANCE/OFFICE/RECEPTION
  Paid:     15,000
  Credit:   5,000

COFFEE SHOP
  Paid:     12,000
  Credit:   0

SPORT CENTER
  Paid:     8,000
  Credit:   0

HOUSE KEEPING
  Paid:     10,000
  Credit:   0

TOTAL PURCHASES: 230,000 (Only Paid)
```

### **How It Works:**

```php
// From PosReportController.php
$purchaseInvoices = \App\Models\PurchaseInvoice::where('created_by', $creatorId)
    ->whereDate('invoice_date', $date)
    ->with('items.product.category')
    ->get();

foreach ($purchaseInvoices as $invoice) {
    $amount = $invoice->total_amount;
    $isPaid = $invoice->status === 'posted';
    
    // Categorize by product category
    if (str_contains($category, 'bar')) {
        $purchases['bar'][$isPaid ? 'paid' : 'credit'] += $amount;
    } elseif (str_contains($category, 'restaurant')) {
        $purchases['resto'][$isPaid ? 'paid' : 'credit'] += $amount;
    }
    // ... etc.
}
```

---

## 🛠️ PURCHASE TRACKING QUERIES

### **Query 1: All Purchases for a Date**
```php
$dailyPurchases = PurchaseInvoice::whereDate('invoice_date', $date)
    ->with(['vendor', 'items.product'])
    ->get();
```

### **Query 2: Unpaid Purchases (Payables)**
```php
$unpaidPurchases = PurchaseInvoice::where('balance_amount', '>', 0)
    ->where('status', '!=', 'draft')
    ->with('vendor')
    ->get();
```

### **Query 3: Total Payables**
```php
$totalPayables = PurchaseInvoice::where('balance_amount', '>', 0)
    ->sum('balance_amount');
```

### **Query 4: Purchases by Vendor**
```php
$vendorPurchases = PurchaseInvoice::where('vendor_id', $vendorId)
    ->orderBy('invoice_date', 'desc')
    ->get();
```

### **Query 5: Purchases by Warehouse**
```php
$warehousePurchases = PurchaseInvoice::where('warehouse_id', $warehouseId)
    ->whereDate('invoice_date', $date)
    ->get();
```

---

## 📋 SUMMARY

### **✅ POS Orders - Partial Payments:**

| Feature | Status | Details |
|---------|--------|---------|
| Track partial payments | ✅ Yes | Via `paid_amount` and `balance_due` fields |
| Track unpaid orders | ✅ Yes | Orders with `status = 'pending'` |
| View balance due | ✅ Yes | Shown in orders table |
| Add payment later | ✅ Yes | Via "Pay Balance" button |
| Filter by status | ✅ Yes | Filter: Completed, Partial, Pending |
| Track charged to room | ✅ Yes | Via `charged_to_room` flag |

### **✅ Purchase Invoices - View All Purchases:**

| Feature | Status | Details |
|---------|--------|---------|
| View all purchases | ✅ Yes | `/purchase-invoices` page |
| Filter by vendor | ✅ Yes | Dropdown filter |
| Filter by warehouse | ✅ Yes | Dropdown filter |
| Filter by status | ✅ Yes | Draft, Posted, Partial, Overdue |
| Filter by date | ✅ Yes | Date range filter |
| Track unpaid purchases | ✅ Yes | Via `balance_amount` field |
| See purchase details | ✅ Yes | Click to view line items |
| Print purchase invoice | ✅ Yes | Print button available |

---

## 🎯 RECOMMENDATIONS FOR BETTER TRACKING

### **For POS Unpaid Orders:**

1. **Create a Receivables Report**
   - Show all customers with outstanding balances
   - Group by customer
   - Show aging (30 days, 60 days, 90+ days)

2. **Add Payment Reminders**
   - Send automatic reminders for orders > 7 days unpaid
   - Email or SMS notifications

3. **Add to Daily Report**
   - Show "Outstanding Receivables" section
   - Track new credits vs collections

4. **Customer Credit Limit**
   - Set maximum credit limit per customer
   - Block new orders if limit exceeded

### **For Purchase Tracking:**

1. **Payables Dashboard**
   - Total amount owed to suppliers
   - Aging analysis (due soon, overdue)
   - By vendor summary

2. **Purchase Analytics**
   - Top vendors by volume
   - Purchase trends by category
   - Cost analysis per department

3. **Stock vs Purchase Reconciliation**
   - Verify purchased items entered warehouse
   - Track purchase vs stock discrepancies

---

## 💡 QUICK ACCESS LINKS

**POS Orders:** `/pos/orders`
- Filter by status to see partial/unpaid orders
- Use "Pay Balance" button for collections

**Purchase Invoices:** `/purchase-invoices`
- View all purchases from suppliers
- Filter by vendor, warehouse, or status

**Daily Financial Report:** `/pos/reports/daily-financial`
- See daily sales and purchases
- Track cash vs credit transactions

---

Would you like me to:
1. Create a dedicated "Receivables Report" to track unpaid POS orders?
2. Create a "Payables Report" to track unpaid purchases?
3. Add an "Aging Analysis" feature to see how old unpaid orders are?
4. Improve the Daily Financial Report to show outstanding balances?

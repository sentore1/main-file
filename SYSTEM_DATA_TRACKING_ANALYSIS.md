# Complete System Data Tracking Analysis

## 🎯 OVERVIEW: How Your System Records Everything

This document explains **exactly** how your system tracks:
1. Sales (POS, Rooms, Items)
2. Purchases (What you owe suppliers)
3. Receivables (Who owes you money)
4. Stock/Inventory (What you have and its value)
5. Department-wise tracking per branch

---

## 📊 1. SALES TRACKING

### **A. POS Sales (Restaurant, Bar, Coffee Shop, etc.)**

**Tables Used:**
```
pos (main sale record)
  ├─> pos_items (individual products sold)
  ├─> pos_payment (payment information)
  └─> warehouse_id (which branch)
```

**How It Works:**
```php
// When a sale is made:
1. Create record in `pos` table:
   - sale_number: #POS00123
   - customer_id: Who bought
   - warehouse_id: Ngoma Branch / Gatsibo Branch / Kigali Branch
   - pos_date: Date of sale
   - charged_to_room: TRUE if customer will pay later (CREDIT)
   - bank_account_id: Payment method

2. Create records in `pos_items` table (one per product):
   - product_id: Links to product
   - quantity: How many sold
   - price: Selling price
   - total_amount: quantity × price
   - Product has category (Restaurant, Bar, Coffee, etc.)

3. Create record in `pos_payment` table:
   - total_amount: Total to pay
   - discount_amount: Any discounts
   - Payment determines: CASH, MOMO, CREDIT, POS BANK, etc.
```

**Key Fields for Branch & Department Tracking:**
- `pos.warehouse_id` → **Which Branch** (Ngoma, Gatsibo, Kigali)
- `pos_items.product_id` → `product_service_items.category_id` → **Which Department** (Restaurant, Bar, Coffee, etc.)

**Tracking Who Owes Money (Receivables):**
```sql
-- Customers who haven't paid (charged to room)
SELECT 
    p.sale_number,
    c.name as customer_name,
    w.name as branch,
    SUM(pi.total_amount) as amount_owed,
    p.pos_date
FROM pos p
JOIN pos_items pi ON p.id = pi.pos_id
JOIN users c ON p.customer_id = c.id
JOIN warehouses w ON p.warehouse_id = w.id
WHERE p.charged_to_room = 1
  AND p.id NOT IN (
      SELECT pos_id FROM pos_payments WHERE payment_status = 'paid'
  )
GROUP BY p.id, c.name, w.name, p.pos_date;
```

---

### **B. Room Bookings (Accommodation Sales)**

**Tables Used:**
```
room_bookings (booking record)
  ├─> room_id (which room)
  ├─> room_booking_payment (payment info)
  └─> warehouse_id (which hotel branch)
```

**How It Works:**
```php
// When a room is booked:
1. Create record in `room_bookings` table:
   - booking_number: #BOOK00013
   - room_id: Which room
   - customer_id: Guest
   - warehouse_id: Ngoma Hotel / Gatsibo Hotel
   - check_in_date / check_out_date
   - total_nights
   - total_amount: Room cost
   - status: confirmed / checked_in / checked_out

2. Create record in `room_booking_payment` table:
   - amount_paid: What they paid
   - payment_method: CASH / MOMO / CREDIT / POS
   - balance_due: Remaining amount
```

**Tracking Who Owes Money (Room Receivables):**
```sql
-- Guests who haven't fully paid for rooms
SELECT 
    rb.booking_number,
    c.name as guest_name,
    w.name as branch,
    r.room_number,
    rb.total_amount,
    COALESCE(rbp.amount_paid, 0) as paid,
    (rb.total_amount - COALESCE(rbp.amount_paid, 0)) as balance_owed
FROM room_bookings rb
JOIN rooms r ON rb.room_id = r.id
JOIN users c ON rb.customer_id = c.id
JOIN warehouses w ON rb.warehouse_id = w.id
LEFT JOIN room_booking_payments rbp ON rb.id = rbp.booking_id
WHERE (rb.total_amount - COALESCE(rbp.amount_paid, 0)) > 0;
```

---

### **C. Room Charges (Additional Services Charged to Room)**

**Tables Used:**
```
room_booking_charges
  └─> booking_id (links to room booking)
```

**Purpose:** When a guest buys food/drinks and charges it to their room instead of paying immediately.

```sql
-- What guests have charged to their rooms (not yet paid)
SELECT 
    rb.booking_number,
    c.name as guest_name,
    rbc.description,
    rbc.amount,
    rbc.created_at as charge_date
FROM room_booking_charges rbc
JOIN room_bookings rb ON rbc.booking_id = rb.id
JOIN users c ON rb.customer_id = c.id
WHERE rbc.status != 'paid';
```

---

## 💰 2. PURCHASES TRACKING (What You Owe Suppliers)

### **Tables Used:**
```
purchase_invoices (main purchase record)
  ├─> purchase_invoice_items (items purchased)
  ├─> vendor_payment_allocations (payments made)
  └─> warehouse_id (which branch received goods)
```

**How It Works:**
```php
// When you buy from supplier:
1. Create record in `purchase_invoices` table:
   - invoice_number: PI-2026-06-001
   - vendor_id: Supplier
   - warehouse_id: Which branch received items
   - invoice_date: Date of purchase
   - due_date: When payment is due
   - total_amount: Total cost
   - paid_amount: How much you've paid
   - balance_amount: What you still owe
   - status: draft / posted / paid / overdue

2. Create records in `purchase_invoice_items` table:
   - product_id: What was purchased
   - quantity: How many
   - price: Cost per unit
   - total_amount: Total cost
   - Product has category (Bar supplies, Restaurant supplies, etc.)
```

**Tracking What You Owe Suppliers (Payables):**
```sql
-- All unpaid purchases showing what you owe
SELECT 
    pi.invoice_number,
    v.name as supplier_name,
    w.name as branch,
    pi.invoice_date,
    pi.due_date,
    pi.total_amount,
    pi.paid_amount,
    pi.balance_amount as amount_owed,
    CASE 
        WHEN pi.due_date < CURDATE() THEN 'OVERDUE'
        ELSE 'DUE'
    END as status
FROM purchase_invoices pi
JOIN users v ON pi.vendor_id = v.id
JOIN warehouses w ON pi.warehouse_id = w.id
WHERE pi.balance_amount > 0
ORDER BY pi.due_date ASC;
```

**Purchases by Department & Branch:**
```sql
-- What each branch bought for each department
SELECT 
    w.name as branch,
    c.name as department,
    SUM(pii.quantity) as total_qty,
    SUM(pii.total_amount) as total_cost,
    SUM(CASE WHEN pi.balance_amount > 0 THEN pii.total_amount ELSE 0 END) as unpaid
FROM purchase_invoices pi
JOIN purchase_invoice_items pii ON pi.id = pii.invoice_id
JOIN product_service_items psi ON pii.product_id = psi.id
JOIN categories c ON psi.category_id = c.id
JOIN warehouses w ON pi.warehouse_id = w.id
WHERE pi.invoice_date >= '2026-06-01'
GROUP BY w.name, c.name
ORDER BY w.name, total_cost DESC;
```

---

## 📦 3. STOCK/INVENTORY TRACKING

### **Tables Used:**
```
warehouse_stocks (current stock levels)
  ├─> product_id (which product)
  ├─> warehouse_id (which branch)
  └─> quantity (how many in stock)

stock_reports (periodic stock counts)
  ├─> warehouse_id
  ├─> report_date
  └─> status (draft / finalized)

product_service_items (product details)
  ├─> purchase_price (what you paid)
  └─> sale_price (what you sell for)
```

**How Stock Is Tracked:**

```php
// Stock movements:

1. PURCHASE → Stock INCREASES
   - When purchase_invoice status = 'posted'
   - Adds to warehouse_stocks.quantity

2. SALE → Stock DECREASES
   - When POS sale is made
   - Reduces warehouse_stocks.quantity

3. TRANSFER → Stock MOVES between branches
   - Reduces stock at source warehouse
   - Increases stock at destination warehouse

4. STOCK ADJUSTMENT → Manual corrections
   - Used for physical stock counts
   - Updates warehouse_stocks.quantity
```

**Stock Value Calculation:**

```sql
-- Total stock value per branch
SELECT 
    w.name as branch,
    c.name as department,
    SUM(ws.quantity) as total_quantity,
    SUM(ws.quantity * psi.purchase_price) as stock_value_at_cost,
    SUM(ws.quantity * psi.sale_price) as stock_value_at_selling_price
FROM warehouse_stocks ws
JOIN product_service_items psi ON ws.product_id = psi.id
JOIN categories c ON psi.category_id = c.id
JOIN warehouses w ON ws.warehouse_id = w.id
WHERE ws.quantity > 0
GROUP BY w.name, c.name
ORDER BY w.name, stock_value_at_cost DESC;
```

**Stock Report Structure:**
```sql
-- What the stock report shows
SELECT 
    sr.report_number,
    sr.report_date,
    w.name as branch,
    sr.status,
    sri.product_id,
    p.name as product_name,
    sri.opening_stock,
    sri.purchases,
    sri.sales,
    sri.transfers_in,
    sri.transfers_out,
    sri.adjustments,
    sri.closing_stock,
    (sri.closing_stock * p.purchase_price) as closing_value
FROM stock_reports sr
JOIN stock_report_items sri ON sr.id = sri.stock_report_id
JOIN product_service_items p ON sri.product_id = p.id
JOIN warehouses w ON sr.warehouse_id = w.id
WHERE sr.report_date = '2026-06-09';
```

---

## 🏢 4. BRANCH & DEPARTMENT STRUCTURE

### **How Your System Organizes Data:**

```
BRANCH (Warehouse)
└─> DEPARTMENTS (Product Categories)
    └─> PRODUCTS
        └─> SALES TRANSACTIONS
```

**Example Structure:**

```
NGOMA BRANCH (warehouse_id = 1)
├─> Restaurant Department (category: "Restaurant")
│   ├─> Brochette (product_id = 10)
│   ├─> Fish Fillet (product_id = 11)
│   └─> Chips (product_id = 12)
│       └─> Sales today: 15 orders, 45,000 FRW
│
├─> Bar Department (category: "Bar")
│   ├─> Primus Beer (product_id = 20)
│   ├─> Skol Beer (product_id = 21)
│   └─> Wine (product_id = 22)
│       └─> Sales today: 30 bottles, 75,000 FRW
│
├─> Sauna Department (category: "Spa")
│   ├─> Massage Service (product_id = 30)
│   └─> Sauna Session (product_id = 31)
│       └─> Sales today: 5 sessions, 25,000 FRW
│
└─> Room Department (separate: room_bookings)
    ├─> Room 101 (room_id = 1)
    └─> Room 102 (room_id = 2)
        └─> Bookings today: 2 rooms, 80,000 FRW

GATSIBO BRANCH (warehouse_id = 2)
├─> Restaurant Department
├─> Bar Department
└─> Coffee Shop Department

KIGALI BRANCH (warehouse_id = 3)
├─> Restaurant Department
├─> Bar Department
├─> Coffee Shop Department
└─> Gym Department
```

---

## ✅ 5. CAN THE DAILY FINANCIAL REPORT DO ALL THIS?

### **Current Capabilities:** ✅ YES (Partially)

The Daily Financial Report **ALREADY TRACKS** most of what you need:

#### **✅ What It DOES Track:**
1. ✅ Sales by Department (Restaurant, Bar, Coffee, etc.)
2. ✅ Sales by Branch (via warehouse_id filter)
3. ✅ Payment Methods (CASH, MOMO, CREDIT, POS)
4. ✅ Room Sales (separate section)
5. ✅ Purchases by Department (in Purchases section)

#### **❌ What It DOESN'T Track (But Should):**
1. ❌ Who owes you money (Receivables aging)
2. ❌ What you owe suppliers (Payables aging)
3. ❌ Stock value at closing
4. ❌ Multi-branch comparison side-by-side
5. ❌ Department breakdown per branch
6. ❌ Unpaid purchase amounts

---

## 🚀 6. SOLUTION: ENHANCED DAILY FINANCIAL REPORT

### **What Needs to Be Added:**

#### **A. Receivables Section (Who Owes You)**

Add to the report:
```
IV. ACCOUNTS RECEIVABLE (CUSTOMERS WHO OWE US)
    
    Ngoma Branch:
      - Room Bookings Unpaid: 150,000 FRW (3 guests)
      - Charged to Room (Food/Drinks): 85,000 FRW (5 customers)
      Total Receivable - Ngoma: 235,000 FRW
    
    Gatsibo Branch:
      - Room Bookings Unpaid: 220,000 FRW (4 guests)
      - Charged to Room: 45,000 FRW (2 customers)
      Total Receivable - Gatsibo: 265,000 FRW
    
    TOTAL RECEIVABLES: 500,000 FRW
```

**Code to Add:**
```php
// In PosReportController.php
private function getReceivablesForDate($date)
{
    $creatorId = creatorId();
    
    // Room bookings unpaid
    $roomReceivables = RoomBooking::where('created_by', $creatorId)
        ->whereDate('check_in_date', '<=', $date)
        ->with(['payment', 'warehouse'])
        ->get()
        ->map(function($booking) {
            $paid = $booking->payment->amount_paid ?? 0;
            $balance = $booking->total_amount - $paid;
            return [
                'branch' => $booking->warehouse->name,
                'type' => 'Room Booking',
                'booking_number' => $booking->booking_number,
                'customer' => $booking->customer->name,
                'amount' => $balance,
            ];
        })
        ->where('amount', '>', 0);
    
    // POS sales charged to room (credit)
    $posReceivables = Pos::where('created_by', $creatorId)
        ->where('charged_to_room', true)
        ->whereDate('pos_date', '<=', $date)
        ->with(['items', 'warehouse', 'customer'])
        ->get()
        ->map(function($sale) {
            $total = $sale->items->sum('total_amount');
            return [
                'branch' => $sale->warehouse->name,
                'type' => 'Charged to Room',
                'sale_number' => $sale->sale_number,
                'customer' => $sale->customer->name,
                'amount' => $total,
            ];
        });
    
    return [
        'details' => $roomReceivables->merge($posReceivables),
        'total' => $roomReceivables->sum('amount') + $posReceivables->sum('amount'),
        'by_branch' => $roomReceivables->merge($posReceivables)
            ->groupBy('branch')
            ->map(fn($items) => $items->sum('amount')),
    ];
}
```

---

#### **B. Payables Section (What You Owe Suppliers)**

Add to the report:
```
V. ACCOUNTS PAYABLE (WHAT WE OWE SUPPLIERS)
    
    By Department:
      Bar Supplies: 450,000 FRW (3 invoices due)
      Restaurant Supplies: 820,000 FRW (5 invoices due)
      Coffee Shop Supplies: 120,000 FRW (1 invoice due)
      Housekeeping Supplies: 85,000 FRW (2 invoices due)
    
    TOTAL PAYABLES: 1,475,000 FRW
    
    Overdue Invoices: 230,000 FRW ⚠️
```

**Code to Add:**
```php
// In PosReportController.php
private function getPayablesForDate($date)
{
    $creatorId = creatorId();
    
    $unpaidInvoices = PurchaseInvoice::where('created_by', $creatorId)
        ->where('balance_amount', '>', 0)
        ->whereDate('invoice_date', '<=', $date)
        ->with(['items.product.category', 'vendor', 'warehouse'])
        ->get();
    
    $payablesByDepartment = [];
    $overdueTotal = 0;
    
    foreach ($unpaidInvoices as $invoice) {
        foreach ($invoice->items as $item) {
            $category = $item->product->category->name ?? 'Other';
            
            if (!isset($payablesByDepartment[$category])) {
                $payablesByDepartment[$category] = [
                    'amount' => 0,
                    'count' => 0,
                ];
            }
            
            $itemBalance = ($invoice->balance_amount / $invoice->total_amount) * $item->total_amount;
            $payablesByDepartment[$category]['amount'] += $itemBalance;
            $payablesByDepartment[$category]['count']++;
        }
        
        if ($invoice->due_date < now()) {
            $overdueTotal += $invoice->balance_amount;
        }
    }
    
    return [
        'by_department' => $payablesByDepartment,
        'total' => $unpaidInvoices->sum('balance_amount'),
        'overdue' => $overdueTotal,
        'count' => $unpaidInvoices->count(),
    ];
}
```

---

#### **C. Stock Value Section**

Add to the report:
```
VI. CLOSING STOCK VALUE
    
    Ngoma Branch:
      Restaurant Stock: 1,250,000 FRW
      Bar Stock: 3,450,000 FRW
      Coffee Shop Stock: 480,000 FRW
      Housekeeping Stock: 220,000 FRW
      Total - Ngoma: 5,400,000 FRW
    
    Gatsibo Branch:
      Restaurant Stock: 850,000 FRW
      Bar Stock: 1,200,000 FRW
      Total - Gatsibo: 2,050,000 FRW
    
    TOTAL STOCK VALUE: 7,450,000 FRW
```

**Code to Add:**
```php
// In PosReportController.php
private function getStockValueForDate($date, $warehouseId = null)
{
    $creatorId = creatorId();
    
    $query = WarehouseStock::where('created_by', $creatorId)
        ->with(['product.category', 'warehouse'])
        ->where('quantity', '>', 0);
    
    if ($warehouseId) {
        $query->where('warehouse_id', $warehouseId);
    }
    
    $stocks = $query->get();
    
    $stockByBranchAndDept = [];
    $totalValue = 0;
    
    foreach ($stocks as $stock) {
        $branch = $stock->warehouse->name;
        $dept = $stock->product->category->name ?? 'Other';
        $value = $stock->quantity * $stock->product->purchase_price;
        
        if (!isset($stockByBranchAndDept[$branch])) {
            $stockByBranchAndDept[$branch] = [];
        }
        
        if (!isset($stockByBranchAndDept[$branch][$dept])) {
            $stockByBranchAndDept[$branch][$dept] = 0;
        }
        
        $stockByBranchAndDept[$branch][$dept] += $value;
        $totalValue += $value;
    }
    
    return [
        'by_branch_and_department' => $stockByBranchAndDept,
        'total_value' => $totalValue,
    ];
}
```

---

#### **D. Multi-Branch Department Breakdown**

Add comparison table:
```
VII. SALES BY BRANCH AND DEPARTMENT

Department      | Ngoma Branch | Gatsibo Branch | Kigali Branch | TOTAL
----------------|--------------|----------------|---------------|--------
Restaurant      | 920,800      | 650,000        | 1,200,000     | 2,770,800
Bar             | 450,600      | 380,000        | 750,000       | 1,580,600
Coffee Shop     | 123,400      | 95,000         | 180,000       | 398,400
Sauna & Massage | 85,000       | 65,000         | 0             | 150,000
Rooms           | 580,000      | 420,000        | 980,000       | 1,980,000
----------------|--------------|----------------|---------------|--------
TOTAL           | 2,159,800    | 1,610,000      | 3,110,000     | 6,879,800
```

---

## 📋 7. COMPLETE SQL QUERIES FOR YOUR SYSTEM

### **Query 1: All Sales by Branch and Department (Today)**
```sql
SELECT 
    w.name as branch,
    c.name as department,
    COUNT(DISTINCT p.id) as transactions,
    SUM(pi.quantity) as items_sold,
    SUM(pi.total_amount) as revenue
FROM pos p
JOIN pos_items pi ON p.id = pi.pos_id
JOIN product_service_items psi ON pi.product_id = psi.id
JOIN categories c ON psi.category_id = c.id
JOIN warehouses w ON p.warehouse_id = w.id
WHERE p.pos_date = CURDATE()
GROUP BY w.name, c.name
ORDER BY w.name, revenue DESC;
```

### **Query 2: Who Owes You Money (Receivables)**
```sql
-- Room bookings unpaid
SELECT 
    'Room Booking' as type,
    w.name as branch,
    rb.booking_number,
    c.name as customer,
    rb.total_amount - COALESCE(rbp.amount_paid, 0) as amount_owed,
    rb.check_in_date,
    DATEDIFF(CURDATE(), rb.check_in_date) as days_outstanding
FROM room_bookings rb
JOIN users c ON rb.customer_id = c.id
JOIN warehouses w ON rb.warehouse_id = w.id
LEFT JOIN room_booking_payments rbp ON rb.id = rbp.booking_id
WHERE (rb.total_amount - COALESCE(rbp.amount_paid, 0)) > 0

UNION ALL

-- POS sales charged to room
SELECT 
    'Charged to Room' as type,
    w.name as branch,
    p.sale_number,
    c.name as customer,
    SUM(pi.total_amount) as amount_owed,
    p.pos_date,
    DATEDIFF(CURDATE(), p.pos_date) as days_outstanding
FROM pos p
JOIN pos_items pi ON p.id = pi.pos_id
JOIN users c ON p.customer_id = c.id
JOIN warehouses w ON p.warehouse_id = w.id
WHERE p.charged_to_room = 1
GROUP BY p.id, w.name, p.sale_number, c.name, p.pos_date
HAVING amount_owed > 0
ORDER BY days_outstanding DESC;
```

### **Query 3: What You Owe Suppliers (Payables)**
```sql
SELECT 
    pi.invoice_number,
    v.name as supplier,
    w.name as branch,
    c.name as department,
    pi.invoice_date,
    pi.due_date,
    pi.total_amount,
    pi.paid_amount,
    pi.balance_amount as amount_owed,
    DATEDIFF(CURDATE(), pi.due_date) as days_overdue,
    CASE 
        WHEN pi.due_date < CURDATE() THEN '⚠️ OVERDUE'
        WHEN DATEDIFF(pi.due_date, CURDATE()) <= 7 THEN '⚡ DUE SOON'
        ELSE 'OK'
    END as urgency
FROM purchase_invoices pi
JOIN users v ON pi.vendor_id = v.id
JOIN warehouses w ON pi.warehouse_id = w.id
JOIN purchase_invoice_items pii ON pi.id = pii.invoice_id
JOIN product_service_items psi ON pii.product_id = psi.id
JOIN categories c ON psi.category_id = c.id
WHERE pi.balance_amount > 0
GROUP BY pi.id, v.name, w.name, c.name, pi.invoice_date, pi.due_date, 
         pi.total_amount, pi.paid_amount, pi.balance_amount
ORDER BY days_overdue DESC, urgency, pi.due_date ASC;
```

### **Query 4: Stock Value by Branch and Department**
```sql
SELECT 
    w.name as branch,
    c.name as department,
    COUNT(DISTINCT ws.product_id) as products_in_stock,
    SUM(ws.quantity) as total_quantity,
    SUM(ws.quantity * psi.purchase_price) as stock_value_cost,
    SUM(ws.quantity * psi.sale_price) as stock_value_selling
FROM warehouse_stocks ws
JOIN product_service_items psi ON ws.product_id = psi.id
JOIN categories c ON psi.category_id = c.id
JOIN warehouses w ON ws.warehouse_id = w.id
WHERE ws.quantity > 0
GROUP BY w.name, c.name
ORDER BY w.name, stock_value_cost DESC;
```

---

## ✅ FINAL ANSWER: YES, Your System CAN Track Everything!

### **Summary:**

| What You Asked | Where It's Tracked | Is It In Daily Financial Report? |
|----------------|-------------------|-----------------------------------|
| ✅ Sales from items (Restaurant, Bar, etc.) | `pos` + `pos_items` | ✅ YES - Shows by department |
| ✅ Room bookings | `room_bookings` | ✅ YES - Separate section |
| ✅ Sales amount | `pos_items.total_amount` | ✅ YES - Calculated totals |
| ✅ Which branch | `pos.warehouse_id`, `room_bookings.warehouse_id` | ✅ YES - Can filter by branch |
| ✅ Which department | `product_service_items.category_id` | ✅ YES - Shows Restaurant, Bar, etc. |
| ❌ Who owes us money | `room_bookings`, `pos.charged_to_room` | ❌ NO - **Need to add** |
| ❌ What we owe suppliers | `purchase_invoices.balance_amount` | ❌ NO - **Need to add** |
| ❌ Stock value at closing | `warehouse_stocks` × `purchase_price` | ❌ NO - **Need to add** |
| ⚠️ All branches side-by-side | Data exists, but not displayed | ⚠️ PARTIAL - **Need to improve** |

---

## 🚀 RECOMMENDATION: Enhanced Financial Report

**Add these 4 sections to make it complete:**

1. **Receivables Aging** - Show who owes you money by branch
2. **Payables Aging** - Show what you owe suppliers by department
3. **Stock Value** - Show closing stock value by branch & department
4. **Multi-Branch Comparison** - Side-by-side view of all branches

**Would you like me to implement these enhancements?**

The data is already there in your system - we just need to pull it into the report!

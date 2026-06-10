# POS Orders - Record Explanation

**URL**: `https://pryro.eastgatehotel.rw/pos/orders`

---

## 📋 OVERVIEW

The `/pos/orders` page displays and manages **Point of Sale (POS) transactions** made across different branches/warehouses of Eastgate Hotel. It's essentially a **sales order management system** that tracks all purchases made by customers, whether walk-in customers or hotel guests.

---

## 🗄️ DATABASE TABLES USED

### **1. `pos` Table (Main Order Record)**

This is the **master table** that stores each POS sale/order.

**Structure:**
```php
- id (Primary Key)
- sale_number (e.g., "#POS00001", "#POS00002")
- customer_id (FK to users table - can be NULL for walk-in customers)
- room_booking_id (FK to room_bookings - if order is charged to a room)
- charged_to_room (boolean - if TRUE, amount is added to room bill)
- warehouse_id (FK to warehouses - which branch/location made the sale)
- pos_date (Date of the sale)
- status (enum: 'completed', 'pending', 'cancelled')
- bank_account_id (FK to bank_accounts - payment destination account)
- waiter_name (Name of the waiter/cashier who processed the sale)
- creator_id (FK to users - who created the order)
- created_by (FK to users - company/organization owner)
- created_at, updated_at (timestamps)
```

**What it represents:**
- Each row = One complete POS transaction/order
- Contains ORDER HEADER information (customer, date, location, payment method)
- Does NOT contain individual product details (those are in `pos_items`)

---

### **2. `pos_items` Table (Order Line Items)**

This table stores the **individual products or rooms sold** in each POS order.

**Structure:**
```php
- id (Primary Key)
- pos_id (FK to pos table - links to the parent order)
- product_id (FK to product_service_items OR rooms table)
- item_type (enum: 'product' or 'room')
- quantity (How many units sold)
- price (Unit price - can be custom/edited price)
- subtotal (quantity × price)
- tax_ids (JSON array of tax IDs applied)
- tax_amount (Total tax calculated)
- total_amount (subtotal + tax_amount)
- notes (Optional notes about the item)
- creator_id, created_by
- created_at, updated_at
```

**What it represents:**
- Each row = One product/room in a POS order
- A single POS order can have multiple items (1 order → many items relationship)
- Stores WHAT was sold, HOW MUCH, and at WHAT PRICE

**Example:**
```
POS Order #POS00001 might have:
  - Item 1: Coca Cola (quantity: 2, price: 500, total: 1000)
  - Item 2: Beef Pizza (quantity: 1, price: 5000, total: 5000)
  - Item 3: Room 101 (quantity: 3 nights, price: 50000, total: 150000)
```

---

### **3. `pos_payments` Table (Payment Information)**

This table stores the **payment details** for each POS order.

**Structure:**
```php
- id (Primary Key)
- pos_id (FK to pos table - ONE-TO-ONE relationship)
- discount (Discount amount in RWF)
- amount (Total before discount)
- discount_amount (Total after discount = amount - discount)
- payment_method (e.g., 'cash', 'momo', 'card', 'pos_bank', 'credit')
- paid_amount (How much customer actually paid)
- balance_due (Remaining unpaid = discount_amount - paid_amount)
- creator_id, created_by
- created_at, updated_at
```

**What it represents:**
- Each row = Payment information for ONE POS order
- Tracks discounts, payment method, and outstanding balance
- Used to identify PAID vs UNPAID orders

**Payment Scenarios:**

| Scenario | paid_amount | balance_due | Notes |
|----------|-------------|-------------|-------|
| **Full Payment** | 10,000 | 0 | Customer paid everything |
| **Partial Payment** | 5,000 | 5,000 | Customer paid half, owes half |
| **Charged to Room** | 10,000 | 0 | Added to room bill (considered "paid" from POS perspective) |
| **Credit Sale** | 0 | 10,000 | Customer took on credit, nothing paid yet |

---

## 📊 WHAT DATA IS DISPLAYED ON `/pos/orders`

When you visit `https://pryro.eastgatehotel.rw/pos/orders`, the page displays:

### **Order List View:**
```
+---------------+------------------+-------------+----------+-----------------+--------+
| Sale Number   | Customer         | Warehouse   | Date     | Payment Method  | Amount |
+---------------+------------------+-------------+----------+-----------------+--------+
| #POS00001     | John Doe         | Main Branch | 10/06/26 | Cash            | 15,000 |
| #POS00002     | Walk-in Customer | Bar         | 10/06/26 | MOMO            | 8,500  |
| #POS00003     | Jane Smith       | Restaurant  | 09/06/26 | Charged to Room | 45,000 |
+---------------+------------------+-------------+----------+-----------------+--------+
```

### **Individual Order Details (when you click on an order):**
```
Order #POS00001
Customer: John Doe
Date: June 10, 2026
Warehouse: Main Branch
Waiter: Alice Mukamana

Items:
  1. Coca Cola × 2         @ 500   = 1,000
  2. Beef Pizza × 1        @ 5,000 = 5,000
  3. Chicken Wings × 2     @ 4,000 = 8,000
                           ----------------
                           Subtotal: 14,000
                           Tax (18%): 2,520
                           Total: 16,520
                           Discount: 1,520
                           ----------------
                           Final Total: 15,000
                           
Payment Method: Cash
Paid: 15,000
Balance Due: 0
Status: Completed
```

---

## 🔍 WHAT RECORDS ARE TRACKED

### **1. Sales Transactions**
- ✅ Every sale made through the POS system (restaurant, bar, coffee shop, etc.)
- ✅ Both product sales AND room bookings (when booked via POS)
- ✅ Walk-in customers AND registered customers
- ✅ All payment methods (cash, MOMO, card, credit, charged to room)

### **2. Customer Information**
- ✅ Who purchased (customer name, email)
- ✅ Customer type:
  - Registered customers (from `users` table with role 'client')
  - Hotel guests with room bookings
  - Walk-in customers (customer_id = NULL)

### **3. Sales Location**
- ✅ Which branch/warehouse made the sale
- ✅ Multiple branches can be tracked:
  - Main Hotel
  - Restaurant
  - Bar
  - Coffee Shop
  - Sport Center
  - Reception
  - etc.

### **4. Product/Service Details**
- ✅ What was sold (product name, SKU)
- ✅ Quantity sold
- ✅ Price at time of sale (can differ from current product price)
- ✅ Taxes applied
- ✅ Individual item totals

### **5. Payment Information**
- ✅ How payment was made (cash, MOMO, POS card, etc.)
- ✅ Which bank account received the payment
- ✅ Discount applied
- ✅ Amount paid vs amount due
- ✅ Outstanding balance (if any)

### **6. Room Charge Integration**
- ✅ If `charged_to_room = TRUE`:
  - The order is linked to a room booking (`room_booking_id`)
  - The amount is added to the guest's room bill
  - Payment is tracked separately in `room_booking_payments` table
- ✅ This allows hotel guests to charge meals, drinks, etc., to their room

### **7. Staff/Waiter Information**
- ✅ Who processed the sale (`waiter_name` field)
- ✅ Useful for:
  - Commission tracking
  - Performance monitoring
  - Accountability
  - Sales per waiter reports

---

## 🎯 HOW IT'S USED IN DAILY FINANCIAL REPORT

The **Daily Financial Report** (`/pos/reports/daily-financial`) uses data from these `pos` tables:

### **Sales by Department:**
```php
// Example: Restaurant Sales
$restaurantSales = Pos::whereDate('pos_date', $date)
    ->whereHas('items.product.category', function($cat) {
        $cat->where('name', 'LIKE', '%Restaurant%');
    })
    ->get();

// Calculate totals by payment method
- Cash: Sum of all orders paid with cash
- MOMO: Sum of all orders paid with mobile money
- Credit: Sum of all orders with charged_to_room = TRUE
- POS Bank: Sum of all orders paid with card
```

### **What the report shows:**
```
III. SALES
  RESTAURANT SALES
    - CASH: 150,000
    - MOMO: 80,000
    - CREDIT (Charged to Room): 200,000
    - POS BANK: 45,000
    - TOTAL: 475,000
    
  BAR SALES
    - CASH: 90,000
    - MOMO: 30,000
    - CREDIT: 120,000
    - TOTAL: 240,000
```

---

## 📈 RELATIONSHIP WITH OTHER MODULES

### **1. Accommodation (Room Bookings)**
```
When a POS order is charged to a room:
  pos.charged_to_room = TRUE
  pos.room_booking_id = [booking ID]
  
The amount is added to the room bill, and the guest pays when checking out.
```

### **2. Inventory Management**
```
When a product is sold via POS:
  - Stock is deducted from warehouse_stocks table
  - Stock reports show sales movement
  - Product quantities are updated automatically
```

### **3. Accounting/Revenue**
```
Each POS sale can generate:
  - Revenue entry (in revenues table)
  - Chart of Accounts entry (double-entry accounting)
  - Bank account deposit record
```

### **4. Customer Management**
```
POS orders are linked to customers:
  - Track customer purchase history
  - Calculate customer lifetime value
  - Identify top customers by spending
```

---

## 💡 KEY DIFFERENCES: POS Orders vs Room Bookings

| Feature | POS Orders | Room Bookings |
|---------|-----------|---------------|
| **Purpose** | Selling products/services (food, drinks, items) | Booking accommodation |
| **Table** | `pos`, `pos_items`, `pos_payments` | `room_bookings`, `room_booking_payments` |
| **Can Include Rooms?** | ✅ Yes (via POS interface) | ✅ Yes (primary purpose) |
| **Can Include Products?** | ✅ Yes (primary purpose) | ❌ No (only rooms) |
| **Charged to Room?** | ✅ Optional (guest can charge meals to room) | N/A (room IS the booking) |
| **Payment Timing** | Immediate (or credit) | Advance + Balance at checkout |
| **Used in Daily Report?** | ✅ Yes (Sales section) | ✅ Yes (Room Sales section) |

---

## 🔧 FILTERS AVAILABLE ON `/pos/orders`

The POS Orders page allows filtering by:

1. **Search** (sale number, customer name, warehouse name)
2. **Customer** (specific customer or walk-in)
3. **Warehouse** (which branch)
4. **Status** (completed, pending, cancelled)
5. **Date Range** (start date to end date)
6. **Sort** (by sale number, total, created date)
7. **Per Page** (10, 25, 50, 100 orders per page)

---

## 📝 EXAMPLE QUERIES

### **Get all POS orders for a specific date:**
```php
$orders = Pos::whereDate('pos_date', '2026-06-10')
    ->with(['customer', 'warehouse', 'items', 'payment'])
    ->get();
```

### **Get total sales for a date by payment method:**
```php
$cashSales = Pos::whereDate('pos_date', '2026-06-10')
    ->whereHas('payment', function($q) {
        $q->where('payment_method', 'cash');
    })
    ->sum('pos_payments.discount_amount');
```

### **Get orders charged to rooms:**
```php
$roomCharges = Pos::whereDate('pos_date', '2026-06-10')
    ->where('charged_to_room', true)
    ->with('roomBooking')
    ->get();
```

### **Get top customers by spending:**
```php
$topCustomers = Pos::with('customer')
    ->whereNotNull('customer_id')
    ->groupBy('customer_id')
    ->selectRaw('customer_id, SUM(total_amount) as total_spent')
    ->orderByDesc('total_spent')
    ->limit(10)
    ->get();
```

---

## ✅ SUMMARY

### **The `/pos/orders` page keeps records of:**

1. ✅ **Every sale transaction** made through the POS system
2. ✅ **All products/items sold** with quantities, prices, and taxes
3. ✅ **Payment information** (method, amount paid, balance due)
4. ✅ **Customer information** (registered customers, walk-ins, hotel guests)
5. ✅ **Sales location** (which branch/warehouse)
6. ✅ **Waiter/cashier** who processed the sale
7. ✅ **Room charges** (when guests charge to their room)
8. ✅ **Transaction dates** and timestamps
9. ✅ **Order status** (completed, pending, cancelled)

### **It DOES NOT track:**
- ❌ Inventory stock levels (tracked separately in `warehouse_stocks`)
- ❌ Purchase invoices from suppliers (tracked in `purchase_invoices`)
- ❌ Expenses (tracked in `expenses` table)
- ❌ Opening/closing balances (need separate tracking)
- ❌ Cash deposits (need separate `cash_deposits` table)

---

## 🎯 RECOMMENDED IMPROVEMENTS FOR ACCURACY

To make the Daily Financial Report more accurate, you should:

1. **Ensure all POS sales are recorded** - Train staff to use POS for ALL sales
2. **Verify payment methods are correct** - Cash vs MOMO vs Card must be accurate
3. **Track charged-to-room orders** - Ensure `charged_to_room` flag is set correctly
4. **Add transaction counts** - Track number of transactions per department
5. **Validate waiter names** - Ensure waiter field is always filled
6. **Check for orphaned items** - Ensure every `pos_item` has a valid parent `pos` record
7. **Monitor balance_due** - Track and follow up on unpaid orders

---

Would you like me to:
1. Create a report to verify POS data integrity?
2. Add missing fields to improve tracking?
3. Implement validation rules to ensure data accuracy?
4. Show you how to query specific POS data for analysis?

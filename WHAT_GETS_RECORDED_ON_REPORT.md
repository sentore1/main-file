# What Gets Recorded on the Daily Financial Report

## ✅ YES - Everything Is Automatically Recorded!

The Daily Financial Report **automatically tracks and displays** all financial transactions entered into your system. Here's exactly what gets recorded:

---

## 💰 SALES (Revenue) - Automatically Recorded

### **What Gets Recorded:**
Every sale made through the POS system

### **When It's Recorded:**
- Cashier enters items in POS
- Selects payment method (Cash, MOMO, Card, Check, Bank, Room Charge)
- Completes transaction
- **Instantly saved to database**

### **What The Report Shows:**

#### **1. Total Sales Amount**
```
SALES TODAY: 1,950,000 Fr
```
**Source:** All POS transactions for selected date

#### **2. Sales by Department**
```
RESTAURANT SALES:     780,000 Fr
BAR SALES:            487,500 Fr
ROOM SALES:           390,000 Fr
COFFEE SHOP:          195,000 Fr
GYM:                   97,500 Fr
```
**Source:** Grouped by product categories

#### **3. Payment Method Breakdown**
```
Payment Method               # Trans | Amount      | %
─────────────────────────────────────────────────────
CASH                        45 trans | 780,000 Fr  | 40%
MOBILE MONEY (MTN/Airtel)   28 trans | 487,500 Fr  | 25%
CARD PAYMENT                15 trans | 292,500 Fr  | 15%
BANK TRANSFER                5 trans | 97,500 Fr   | 5%
CHECK                        2 trans | 97,500 Fr   | 5%
ROOM CHARGES (Credit)       12 trans | 195,000 Fr  | 10%
```
**Source:** Each transaction's payment method

#### **4. Sales Summary**
```
Cash Collected: 780,000 Fr (goes to register)
Electronic Payments: 877,500 Fr (goes to bank)
Room Charges: 195,000 Fr (not yet collected)
```

---

## 🛒 PURCHASES - Automatically Recorded

### **What Gets Recorded:**
All purchases from suppliers entered as Purchase Invoices

### **When It's Recorded:**
- Staff creates Purchase Invoice
- Enters supplier, items, amounts
- Marks as "Paid" or "Credit"
- Saves invoice
- **Instantly saved to database**

### **What The Report Shows:**

#### **Purchases by Department**
```
Department              Paid        | Credit
────────────────────────────────────────────
Bar                     120,000 Fr  | 50,000 Fr
Restaurant              180,000 Fr  | 30,000 Fr
Coffee Shop             40,000 Fr   | 0 Fr
Housekeeping            30,000 Fr   | 0 Fr
Maintenance/Office      25,000 Fr   | 15,000 Fr
────────────────────────────────────────────
TOTAL PURCHASES         395,000 Fr  | 95,000 Fr
```

**Paid** = Supplier was paid immediately (cash went out)  
**Credit** = Will pay supplier later (still owe money)

---

## 💳 UNPAID ITEMS - Automatically Tracked

The report tracks TWO types of unpaid items:

### **1. ACCOUNTS RECEIVABLE (Who Owes YOU Money)**

#### **What Gets Recorded:**
- **Room Charges** - Sales charged to customer's room
- **Unpaid Room Bookings** - Room reservations not fully paid

#### **When It's Recorded:**
- Cashier selects "Charge to Room" when making sale
- Room booking created but not fully paid
- **Automatically tracked**

#### **What The Report Shows:**
```
VI. ACCOUNTS RECEIVABLE (Who Owes Us)

Total Outstanding:          758,000 Fr
Number of Customers:        20
Overdue (>30 days):         23,000 Fr
```

**Detailed Breakdown:**
```
Customer Name    | Type          | Amount      | Days Old
─────────────────────────────────────────────────────────
John Doe         | Room Booking  | 150,000 Fr  | 5 days
Jane Smith       | Room Charge   | 45,000 Fr   | 2 days
ABC Company      | Room Charge   | 230,000 Fr  | 35 days (OVERDUE!)
...
```

**This means:**
- Customers owe you 758,000 Fr total
- 23,000 Fr is overdue (>30 days) - need to chase payment!

---

### **2. ACCOUNTS PAYABLE (Who YOU Owe Money)**

#### **What Gets Recorded:**
- **Unpaid Purchase Invoices** - Purchases marked as "Credit"
- **Outstanding Supplier Bills** - Invoices not yet paid

#### **When It's Recorded:**
- Staff creates Purchase Invoice
- Marks as "Credit" (not paid yet)
- **Automatically tracked until paid**

#### **What The Report Shows:**
```
VII. ACCOUNTS PAYABLE (Who We Owe)

Total Outstanding:          12,105,044.92 Fr
Number of Suppliers:        31
OVERDUE - PAY NOW!:         12,105,044.92 Fr
```

**Detailed Breakdown:**
```
Supplier Name    | Invoice    | Amount          | Due Date   | Status
─────────────────────────────────────────────────────────────────────
Beer Supplier    | INV-001    | 5,500,000 Fr   | 2026-05-15 | OVERDUE!
Food Supplier    | INV-002    | 3,200,000 Fr   | 2026-05-20 | OVERDUE!
Cleaning Co.     | INV-003    | 1,405,044.92Fr | 2026-06-01 | OVERDUE!
...
```

**This means:**
- You owe suppliers 12,105,044.92 Fr total
- ALL of it is overdue - need to pay urgently!

---

## 📊 COMPLETE DATA FLOW EXAMPLE

### **Scenario 1: Customer Buys with CASH**

```
1. ACTION: Customer buys 3 beers at bar
   - Cashier enters in POS
   - Selects payment method: CASH
   - Customer pays 9,000 Fr cash
   
2. RECORDED IN DATABASE:
   ✓ pos table: sale_number, date, warehouse, etc.
   ✓ pos_items: 3 beers, prices, category (Bar)
   ✓ pos_payments: payment_method='cash', amount=9,000
   
3. SHOWS ON REPORT:
   ✓ SALES TODAY: +9,000 Fr
   ✓ BAR SALES: +9,000 Fr
   ✓ CASH: 1 trans | 9,000 Fr
   ✓ Cash Collected: +9,000 Fr
   ✓ Closing Balance: +9,000 Fr
```

---

### **Scenario 2: Customer Charges to Room**

```
1. ACTION: Guest in Room 205 buys dinner
   - Cashier enters meal items
   - Selects: "Charge to Room"
   - Enters Room 205
   - No cash collected
   
2. RECORDED IN DATABASE:
   ✓ pos: charged_to_room=true, room_booking_id
   ✓ pos_items: food items, category (Restaurant)
   ✓ pos_payments: payment_method='charge_to_room', amount=45,000
   
3. SHOWS ON REPORT:
   ✓ SALES TODAY: +45,000 Fr
   ✓ RESTAURANT SALES: +45,000 Fr
   ✓ ROOM CHARGES (Credit): 1 trans | 45,000 Fr
   ✓ ACCOUNTS RECEIVABLE: +45,000 Fr
   ✓ Room Charges: 45,000 Fr (not yet collected)
   ✓ Closing Balance: NO CHANGE (no cash received)
```

---

### **Scenario 3: Buy Beer from Supplier (Paid)**

```
1. ACTION: Receive 50 cases of beer, pay supplier
   - Staff creates Purchase Invoice
   - Supplier: ABC Beverages
   - Amount: 500,000 Fr
   - Category: Bar
   - Status: PAID (paid immediately)
   
2. RECORDED IN DATABASE:
   ✓ purchase_invoices: amount, date, status='posted'
   ✓ purchase_invoice_items: products, categories
   
3. SHOWS ON REPORT:
   ✓ PURCHASES TODAY: +500,000 Fr
   ✓ Bar: 500,000 Fr Paid | 0 Fr Credit
   ✓ Purchases Paid (Cash): +500,000 Fr
   ✓ Closing Balance: -500,000 Fr (cash went out)
```

---

### **Scenario 4: Buy Food from Supplier (Credit)**

```
1. ACTION: Receive food supplies, will pay later
   - Staff creates Purchase Invoice
   - Supplier: Food Distributor Ltd
   - Amount: 300,000 Fr
   - Category: Restaurant
   - Status: CREDIT (not paid yet)
   
2. RECORDED IN DATABASE:
   ✓ purchase_invoices: amount, date, status='pending'
   ✓ purchase_invoice_items: products, categories
   
3. SHOWS ON REPORT:
   ✓ PURCHASES TODAY: +300,000 Fr
   ✓ Restaurant: 0 Fr Paid | 300,000 Fr Credit
   ✓ ACCOUNTS PAYABLE: +300,000 Fr
   ✓ Number of Suppliers: +1
   ✓ Closing Balance: NO CHANGE (didn't pay yet)
```

---

## 🔄 AUTOMATIC TRACKING SUMMARY

### **✅ Sales - Automatically Recorded:**
- Every POS transaction
- All payment methods
- All departments
- Transaction counts
- Amounts and percentages

### **✅ Purchases - Automatically Recorded:**
- All purchase invoices
- Paid vs Credit status
- By department/category
- Supplier information
- Due dates

### **✅ Unpaid Sales - Automatically Tracked:**
- Room charges (customers owe you)
- Unpaid room bookings
- How long outstanding
- Overdue amounts
- Customer names

### **✅ Unpaid Purchases - Automatically Tracked:**
- Credit purchase invoices (you owe suppliers)
- Outstanding balances
- Due dates
- Overdue amounts
- Supplier names

### **✅ Cash Flow - Automatically Calculated:**
- Opening balance
- Cash collected
- Cash paid out
- Closing balance
- Verification amount

---

## 📋 WHAT STAFF MUST DO

### **For Sales to Appear on Report:**
1. Enter sale in POS system
2. Select correct payment method
3. Complete transaction
4. **Done! Automatically on report**

### **For Purchases to Appear on Report:**
1. Go to Purchase Invoices
2. Create new invoice
3. Enter details and amount
4. Mark as Paid or Credit
5. Save
6. **Done! Automatically on report**

### **For Unpaid Items to Be Tracked:**
**Nothing extra!** The system automatically:
- Tracks room charges as receivables
- Tracks credit purchases as payables
- Calculates overdue amounts
- Counts days outstanding

---

## 🎯 KEY POINTS

1. **Everything is automatic** - Just enter transactions correctly
2. **Sales include ALL payment methods** - Cash, MOMO, Cards, Checks, Bank, Room Charges
3. **Purchases split by payment status** - Paid (cash out) vs Credit (owe money)
4. **Unpaid sales tracked as Receivables** - Who owes YOU
5. **Unpaid purchases tracked as Payables** - Who YOU owe
6. **Report updates instantly** - As soon as transaction is saved
7. **No manual entry in report** - All data comes from transactions
8. **Historical data preserved** - Can view any past date

---

## ✅ VERIFICATION

To verify everything is recorded:

1. **Make a test sale** → Check it appears in Sales section
2. **Create test purchase** → Check it appears in Purchases section
3. **Charge to room** → Check it appears in Receivables
4. **Create credit purchase** → Check it appears in Payables
5. **Count physical cash** → Should match Closing Balance

---

## 🎉 CONCLUSION

**YES!** The Daily Financial Report automatically records:

✅ **ALL SALES** - Every POS transaction  
✅ **ALL PURCHASES** - Every purchase invoice  
✅ **UNPAID SALES** - Room charges and unpaid bookings (Receivables)  
✅ **UNPAID PURCHASES** - Credit purchases and outstanding bills (Payables)  
✅ **ALL PAYMENT METHODS** - Cash, MOMO, Cards, Checks, Bank Transfers, Room Charges  
✅ **CASH FLOW** - Complete tracking from opening to closing  

**Nothing is missed. Everything is recorded. The report is complete!** 🎯

---

**Document Created:** June 10, 2026  
**Report Location:** POS → Reports → Daily Financial Report

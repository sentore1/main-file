# Daily Financial Report - User Guide

## 📊 How the Report Works

The Daily Financial Report **automatically tracks** all financial transactions that are entered into the system throughout the day. Here's how everything is recorded:

---

## 🔄 What Gets Tracked Automatically

### **1. SALES (Revenue)**

#### **Where Sales Come From:**
- **POS Orders** - All sales made through the POS system (`/pos/orders`)
- **Room Bookings** - Hotel room reservations and payments
- **Each Department** - Restaurant, Bar, Coffee Shop, Gym, Pool, etc.

#### **How Sales Are Recorded:**
1. **Staff makes a sale** → Enters items in POS system
2. **Customer pays** → Staff selects payment method:
   - Cash
   - Mobile Money (MOMO)
   - POS Card
   - Visa Card
   - Room Charge (Credit - customer pays later)
3. **System records automatically** → Transaction saved with:
   - Date
   - Time
   - Amount
   - Payment method
   - Department/Category
   - Branch/Warehouse
4. **Report updates** → Next time report is opened, this sale appears

#### **Example:**
```
Customer buys drinks at Bar:
- 3 Beers = 9,000 Fr
- Staff enters in POS
- Customer pays with MOMO
- System records: "Bar Sale, 9,000 Fr, MOMO, Date: 2026-06-10"
- Report shows under "BAR SALES" → "MOMO: 9,000 Fr"
```

---

### **2. PURCHASES (What You Buy)**

#### **Where Purchases Come From:**
- **Purchase Invoices** - When you buy supplies from vendors (`/purchase-invoices`)

#### **How Purchases Are Recorded:**
1. **Receive goods from supplier** → Create purchase invoice in system
2. **Enter details:**
   - Supplier name
   - Items purchased (Beer, Food, Cleaning supplies, etc.)
   - Total amount
   - Category (Bar, Restaurant, Housekeeping, etc.)
3. **Mark payment status:**
   - **Paid** → If you paid supplier immediately (cash/bank transfer)
   - **Credit** → If you will pay supplier later (on account)
4. **System calculates** → Totals by department

#### **Example:**
```
Buy beer from supplier:
- 50 cases of beer = 500,000 Fr
- Category: Bar
- Payment: Credit (pay in 30 days)
- Report shows: "Purchases → Bar: 0 Fr Paid | 500,000 Fr Credit"
```

---

### **3. OTHER EXPENSES**

#### **Where Expenses Come From:**
- **Expense Records** - General operating expenses (`/expenses`)

#### **What Expenses Include:**
- Electricity bills
- Water bills
- Staff salaries
- Rent
- Maintenance
- Office supplies
- Transportation
- Any other business expense

#### **How Expenses Are Recorded:**
1. **Pay an expense** → Create expense record in system
2. **Enter details:**
   - What was paid for
   - Amount
   - Payment method
3. **Mark status:**
   - **Paid** → Money was paid today
   - **Credit** → Will pay later
4. **System tracks** → Totals automatically

---

## 💰 How Cash Flow Works

### **Opening Balance**
- **What it is:** Amount of cash in register at start of day
- **How it's calculated:** Previous day's closing balance
- **First day:** Manually count cash and that becomes opening balance

### **Cash In (During Day)**
- All **CASH payments** from customers
- Does NOT include:
  - MOMO payments (goes to mobile money account)
  - Card payments (goes to bank)
  - Room charges (customer hasn't paid yet)

### **Cash Out (During Day)**
- Purchases paid in **CASH**
- Expenses paid in **CASH**

### **Closing Balance**
```
Opening Balance:        500,000 Fr
+ Cash Collected:       780,000 Fr
= Total Available:    1,280,000 Fr
- Cash Paid Out:        695,000 Fr
= Closing Balance:      585,000 Fr
```

**At end of day:** Count physical cash in register → Should match closing balance!

---

## 📋 Daily Workflow for Staff

### **Morning (Start of Day)**

1. **Count cash in register**
   - Count all bills and coins
   - Record the amount
   - This is your Opening Balance

2. **Open Daily Financial Report**
   - Go to: POS → Reports → Daily Financial Report
   - Verify Opening Balance matches your count
   - If different, investigate why

### **During the Day**

**For Every Sale:**
1. Enter items in POS system
2. Select correct payment method:
   - Cash → Customer gives you money
   - MOMO → Customer pays by mobile money
   - Card → Customer uses credit/debit card
   - Room Charge → Add to customer's room bill
3. Complete transaction
4. System automatically records everything

**For Every Purchase:**
1. Go to Purchase Invoices
2. Create new invoice
3. Enter supplier, items, amounts
4. Select category (Bar, Restaurant, etc.)
5. Mark as Paid or Credit
6. Save

**For Every Expense:**
1. Go to Expenses
2. Create new expense
3. Enter what was paid, amount
4. Mark as Paid or Credit
5. Save

### **Evening (End of Day)**

1. **Generate Report**
   - Go to: POS → Reports → Daily Financial Report
   - Select today's date
   - Select your branch

2. **Verify Sales**
   - Check each department's sales
   - Verify payment methods breakdown
   - Confirm transaction counts

3. **Count Physical Cash**
   - Count all cash in register
   - Compare with "Closing Cash Balance" on report
   - Should match exactly!

4. **Investigate Differences**
   - **More cash than report?** → Maybe sale not recorded
   - **Less cash than report?** → Maybe wrong payment method selected
   - **Fix errors** and recount

5. **Review Outstanding Items**
   - Check Accounts Receivable (who owes you)
   - Check Accounts Payable (who you owe)
   - Follow up on overdue amounts

6. **Download/Print Report**
   - Click "Download PDF"
   - Keep for records
   - Manager/accountant reviews

---

## 🎯 Report Sections Explained

### **I. OPENING BALANCE**
- Cash in register at start of day
- Should match physical count

### **II. SALES TODAY**
- **A. Sales by Department:** Total revenue per department
- **B. Payment Method Breakdown:** How customers paid
  - Shows count of transactions
  - Shows amount per payment method
  - Shows percentage

**Example:**
```
CASH:                  45 trans | 780,000 Fr | 40%
MOMO:                  28 trans | 487,500 Fr | 25%
POS CARD:              15 trans | 292,500 Fr | 15%
ROOM CHARGES:          12 trans | 390,000 Fr | 20%
```

### **III. PURCHASES TODAY**
- What you bought from suppliers
- Shows Paid vs Credit
- Organized by department

### **IV. OTHER EXPENSES TODAY**
- Operating expenses
- Shows Paid vs Credit

### **V. CASH FLOW SUMMARY**
- Most important section!
- Shows cash movement:
  - Started with (Opening)
  - Collected (Cash In)
  - Available (Total)
  - Spent (Cash Out)
  - Remaining (Closing)
- **VERIFICATION:** Count physical cash → should match closing

### **VI. ACCOUNTS RECEIVABLE**
- Customers who owe you money
- Room charges not yet paid
- Shows overdue amounts (>30 days)

### **VII. ACCOUNTS PAYABLE**
- Suppliers you owe money to
- Purchase invoices not yet paid
- Shows overdue amounts

### **VIII. PERFORMANCE vs YESTERDAY**
- Compares today to yesterday
- Shows increase/decrease

---

## ✅ Best Practices

### **1. Record EVERYTHING**
- Every sale, no matter how small
- Every purchase
- Every expense
- Never skip transactions!

### **2. Choose Correct Payment Method**
- Be accurate when selecting payment method
- Cash = Physical money received
- MOMO = Mobile money transfer
- Card = Credit/debit card payment
- Room Charge = Add to customer's bill

### **3. Daily Reconciliation**
- ALWAYS count cash at end of day
- Compare with report closing balance
- Investigate any differences immediately

### **4. Category Correctly**
- Bar items → Bar category
- Restaurant items → Restaurant category
- Room supplies → Housekeeping category
- This ensures accurate department reporting

### **5. Mark Payment Status**
- Purchases: Paid vs Credit
- Expenses: Paid vs Credit
- Accurate status = accurate cash flow

---

## 🚨 Common Problems & Solutions

### **Problem: Cash count doesn't match report**

**Possible Causes:**
1. Sale recorded but money not collected
2. Cash sale marked as MOMO/Card by mistake
3. Transaction entered twice
4. Money taken out but not recorded as expense
5. Money added but not recorded as sale

**Solution:**
- Check all transactions for the day
- Verify payment methods on each sale
- Look for duplicate entries
- Account for all cash movements

### **Problem: Opening balance is wrong**

**Cause:**
- Yesterday's closing wasn't counted correctly

**Solution:**
- Adjust opening balance manually if needed
- Contact accountant/manager
- Be more careful with daily counts

### **Problem: Departments show zero sales**

**Cause:**
- Products not categorized correctly
- Sales entered without category

**Solution:**
- Check product categories in system
- Ensure all products have correct category
- Update product settings

### **Problem: Purchases not showing**

**Cause:**
- Purchase invoice not created
- Wrong date on purchase invoice

**Solution:**
- Go to Purchase Invoices
- Create invoice for today's date
- Enter all purchase details

---

## 📞 Who to Contact

**For System Issues:**
- IT Support / System Administrator

**For Financial Questions:**
- Accountant / Finance Manager

**For Training:**
- Department Manager / Supervisor

---

## 📝 Summary Checklist

**Daily Tasks:**
- [ ] Count opening cash
- [ ] Record all sales in POS
- [ ] Record all purchases
- [ ] Record all expenses
- [ ] Use correct payment methods
- [ ] Generate daily report
- [ ] Count closing cash
- [ ] Verify cash matches report
- [ ] Download/print report
- [ ] Review with manager

**Weekly Tasks:**
- [ ] Review accounts receivable
- [ ] Follow up on overdue payments
- [ ] Review accounts payable
- [ ] Pay urgent supplier invoices

**Monthly Tasks:**
- [ ] Reconcile all accounts
- [ ] Archive reports
- [ ] Review department performance
- [ ] Adjust processes as needed

---

## 🎓 Training Checklist

**New staff should learn:**
- [ ] How to make POS sale
- [ ] How to select payment method
- [ ] How to charge to room
- [ ] How to create purchase invoice
- [ ] How to record expense
- [ ] How to generate report
- [ ] How to count cash
- [ ] How to verify closing balance
- [ ] Who to contact for help

---

## ✨ Benefits of Using This System

1. **Accurate Financial Data** - Know exactly how much money you have
2. **No Missing Transactions** - Everything is recorded
3. **Easy Cash Reconciliation** - Count once, verify instantly
4. **Department Performance** - See which departments are profitable
5. **Payment Insights** - Know how customers prefer to pay
6. **Credit Control** - Track who owes you money
7. **Supplier Management** - Track what you owe suppliers
8. **Trend Analysis** - Compare day to day, week to week
9. **Management Reporting** - Professional reports for owners
10. **Audit Trail** - Complete record of all transactions

---

## 🎯 Key Takeaways

1. **System tracks automatically** - Just enter transactions correctly
2. **Cash must balance daily** - Count and verify every day
3. **Payment method matters** - Choose correctly for accurate tracking
4. **Everything gets recorded** - Sales, purchases, expenses
5. **Report is real-time** - Shows actual data from database
6. **No manual calculations** - System does all the math
7. **Trust but verify** - Always count physical cash
8. **Follow up matters** - Chase overdue payments
9. **Consistent process** - Same routine every day
10. **Team effort** - Everyone must record accurately

---

**Document Version:** 1.0  
**Last Updated:** June 10, 2026  
**Report Location:** POS → Reports → Daily Financial Report

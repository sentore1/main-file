# DAILY FINANCIAL REPORT - SYSTEM DIAGRAM
## Visual Overview of Data Flow and Architecture

---

## 🏗️ SYSTEM ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────────────┐
│                         DAILY FINANCIAL REPORT                       │
│                         Version 2.0 - Production                     │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                          USER INTERFACE (React)                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐             │
│  │ Date Picker  │  │Branch Filter │  │ Search Box   │              │
│  └──────────────┘  └──────────────┘  └──────────────┘              │
│                                                                       │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │ Report Display (9 Sections)                                 │    │
│  │ I.   Opening Balance                    [Download PDF] 📥   │    │
│  │ II.  Sales Today (A: Dept | B: Payment)                     │    │
│  │ III. Purchases Today                                        │    │
│  │ IV.  Other Expenses                                         │    │
│  │ V.   Cash Flow Summary ⭐                                   │    │
│  │ VI.  Accounts Receivable                                    │    │
│  │ VII. Accounts Payable                                       │    │
│  │ VIII. Performance vs Yesterday                              │    │
│  │ IX.  Top Selling Products                                   │    │
│  └────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    BACKEND CONTROLLER (Laravel)                      │
│                  PosReportController::dailyFinancial()               │
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ Main Processing Methods                                       │  │
│  │ • groupSalesByPaymentMethod() - Categorize sales             │  │
│  │ • getPurchasesForDate() - Get purchase data                  │  │
│  │ • getOtherExpensesForDate() - Get expense data               │  │
│  │ • getReceivablesForDate() - Calculate who owes you           │  │
│  │ • getPayablesForDate() - Calculate who you owe               │  │
│  │ • getOpeningBalance() - Calculate opening cash               │  │
│  │ • getTopPerformers() - Identify best sellers                 │  │
│  │ • getHistoricalComparisons() - Compare with past             │  │
│  └──────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         DATABASE (MySQL)                             │
│                                                                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐             │
│  │    pos       │  │  pos_items   │  │ pos_payments │              │
│  │              │  │              │  │              │              │
│  │ • sale_id    │  │ • pos_id     │  │ • pos_id     │              │
│  │ • pos_date   │  │ • product_id │  │ • payment_   │              │
│  │ • warehouse  │  │ • quantity   │  │   method ⭐  │              │
│  │ • customer   │  │ • total_amt  │  │ • amount     │              │
│  └──────────────┘  └──────────────┘  └──────────────┘              │
│                                                                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐             │
│  │room_bookings │  │  purchase_   │  │  expenses    │              │
│  │              │  │  invoices    │  │              │              │
│  │ • booking_no │  │ • invoice_no │  │ • expense_   │              │
│  │ • check_in   │  │ • invoice_   │  │   date       │              │
│  │ • total_amt  │  │   date       │  │ • amount     │              │
│  │ • payment    │  │ • balance    │  │ • status     │              │
│  └──────────────┘  └──────────────┘  └──────────────┘              │
│                                                                       │
│  ┌──────────────┐  ┌──────────────┐                                │
│  │  products    │  │ warehouses   │                                 │
│  │              │  │              │                                 │
│  │ • name       │  │ • name       │                                 │
│  │ • sku        │  │ • city       │                                 │
│  │ • category   │  │ • is_active  │                                 │
│  └──────────────┘  └──────────────┘                                 │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🔄 DATA FLOW DIAGRAM

```
STAFF ACTIONS                DATABASE                 REPORT
─────────────────────────────────────────────────────────────────

1. Make POS Sale          →  pos table              →  Section II
   Select Payment         →  pos_payments           →  Payment Breakdown
   Method: CASH/MOMO/    →  payment_method field   →  Transaction Count
   CARD/BANK/CHECK       →  pos_items              →  Department Sales

2. Create Room Booking    →  room_bookings         →  Room Sales
   Record Payment         →  room_booking_          →  Or Receivables
                             payments                  (if unpaid)

3. Charge to Room         →  pos (charged_to_      →  Section VI
   (Restaurant/Bar)       →  room = true)          →  Receivables

4. Record Purchase        →  purchase_invoices     →  Section III
   Mark Paid/Credit       →  status field          →  Purchases

5. Record Expense         →  expenses              →  Section IV
   Mark Paid/Credit       →  status field          →  Other Expenses

6. End of Day            →  Calculate Previous     →  Section I
                            Day's Closing          →  Opening Balance

                         →  Calculate All Sales    →  Section V
                            - Purchases - Expenses →  Cash Flow

                         →  Compare with           →  Section VIII
                            Yesterday              →  Performance

                         →  Aggregate Sales        →  Section IX
                            by Product             →  Top Performers
```

---

## 💳 PAYMENT METHOD MAPPING

```
POS FORM SELECTION           DATABASE FIELD             REPORT DISPLAY
──────────────────────────────────────────────────────────────────────

Cash                    →    payment_method = 'cash'        →    CASH
Card                    →    payment_method = 'card'        →    POS CARD
MTN MOMO               →    payment_method = 'mtn_momo'    →    MOBILE MONEY
Airtel Money           →    payment_method = 'airtel_money'→    MOBILE MONEY
Bank                   →    payment_method = 'bank'        →    BANK TRANSFER ✅
Check                  →    payment_method = 'check'       →    CHECK ✅
Charge to Room         →    payment_method = 'charge_to_   →    ROOM CHARGES
                             room'                               (Credit)

KEY IMPROVEMENT: Now reads directly from payment_method field
                 Previously guessed from bank account name ❌
```

---

## 🏦 CASH FLOW CALCULATION

```
┌─────────────────────────────────────────────────────────────┐
│                  CASH FLOW SUMMARY                          │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ OPENING CASH BALANCE                                        │
│ Source: Previous day's cash sales                           │
│ Query: pos_payments where payment_method='cash'             │
│        AND pos_date = yesterday                             │
│        AND NOT charged_to_room                              │
│        AND NOT bank_account_id                              │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ + CASH COLLECTED TODAY                                      │
│ Source: Today's cash sales                                  │
│ Query: pos_payments where payment_method='cash'             │
│        AND pos_date = today                                 │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ = TOTAL CASH AVAILABLE                                      │
│ Calculation: Opening + Cash Collected                       │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ - PURCHASES PAID (CASH)                                     │
│ Source: Purchase invoices paid today                        │
│ Query: purchase_invoices where status='posted'              │
│        AND invoice_date = today                             │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ - EXPENSES PAID (CASH)                                      │
│ Source: Expenses paid today                                 │
│ Query: expenses where status='posted'                       │
│        AND expense_date = today                             │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ = CLOSING CASH BALANCE                                      │
│ This MUST match physical cash count! ⭐                     │
│ If mismatch → investigate immediately                       │
└─────────────────────────────────────────────────────────────┘
```

---

## 📊 DEPARTMENT CATEGORIZATION

```
PRODUCT CATEGORY             REPORT SECTION              QUERY FILTER
──────────────────────────────────────────────────────────────────────

Food, Beverage          →    RESTAURANT SALES       →    category LIKE 
                                                          '%Restaurant%' OR
                                                          '%Food%' OR
                                                          '%Beverage%'

Bar, Drink, Alcohol     →    BAR SALES              →    category LIKE
                                                          '%Bar%' OR
                                                          '%Drink%' OR
                                                          '%Alcohol%'

Room Booking            →    ROOM SALES             →    room_bookings
                                                          table

Coffee, Cafe            →    COFFEE SHOP SALES      →    category LIKE
                                                          '%Coffee%' OR
                                                          '%Cafe%'

Hall, Event, Salle      →    SALLE SALES            →    category LIKE
                                                          '%Hall%' OR
                                                          '%Event%'

Spa, Massage, Sauna     →    SAUNA & MASSAGE        →    category LIKE
                                                          '%Spa%' OR
                                                          '%Massage%'

Pool, Swimming          →    SWIMMING POOL/CLOTHES  →    category LIKE
                                                          '%Pool%' OR
                                                          '%Swimming%'

Gym, Fitness            →    GYM                    →    category LIKE
                                                          '%Gym%' OR
                                                          '%Fitness%'

Billiards, Snooker      →    POOL SALES             →    category LIKE
                                                          '%Billiard%'

Others                  →    SERVICES AND OTHERS    →    All products not
                                                          matching above
```

---

## 🎨 UI COLOR CODING

```
SECTION                 COLOR           PURPOSE
──────────────────────────────────────────────────────────────

Opening Balance         Blue            Starting point
Sales                   Green           Revenue (positive)
Purchases               Orange          Cost (neutral)
Expenses                Red             Cost (negative)
Cash Flow               Blue            Critical verification
Receivables             Green           Money coming in
Payables                Red             Money going out
Performance +           Green           Improvement
Performance -           Red             Decline
Overdue Items           Red             Urgent attention
Verification Note       Yellow          Important info
Top Products            Yellow          Highlights
```

---

## 🔐 ERROR HANDLING FLOW

```
┌─────────────────────────────────────────────────────────────┐
│ Request Daily Financial Report                              │
│ Parameters: date, warehouse_id                              │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ Check Module Existence                                      │
│ if (class_exists('\App\Models\PurchaseInvoice'))           │
│    → Query purchase data                                    │
│ else                                                        │
│    → Return empty array                                     │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ Check Column Existence                                      │
│ if (Schema::hasColumn('expenses', 'warehouse_id'))          │
│    → Filter by warehouse                                    │
│ else                                                        │
│    → Skip warehouse filter                                  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ Try-Catch Wrapper                                           │
│ try {                                                       │
│    $expenses = Expense::where(...)->get();                  │
│ } catch (\Exception $e) {                                   │
│    Log::error('Expense Error: ' . $e->getMessage());        │
│    return empty result;                                     │
│ }                                                           │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ Return Data or Safe Defaults                                │
│ • Never crash                                               │
│ • Always show something                                     │
│ • Log errors for review                                     │
└─────────────────────────────────────────────────────────────┘
```

---

## 📈 DATA AGGREGATION FLOW

```
RAW TRANSACTIONS              AGGREGATION                DISPLAY
────────────────────────────────────────────────────────────────

pos_items                →   SUM(total_amount)      →   Total Sales
+ pos_payments           →   GROUP BY payment_      →   Payment
                             method                     Breakdown

pos_items                →   SUM(quantity)          →   Transaction
+ pos table              →   COUNT(DISTINCT pos_id) →   Counts

purchase_invoices        →   SUM WHERE status=      →   Purchases
+ status field           →   'posted'                   Paid vs Credit
                             vs
                             SUM WHERE status !=
                             'posted'

room_bookings            →   SUM(total_amount -     →   Accounts
WHERE unpaid             →   amount_paid)               Receivable

purchase_invoices        →   SUM(balance_amount)    →   Accounts
WHERE balance > 0        →                              Payable

pos_items                →   SUM(total_amount)      →   Top Products
GROUP BY product_id      →   ORDER BY DESC          →   (Top 5)
                             LIMIT 5

Yesterday's Sales        →   Today - Yesterday      →   Performance
vs Today's Sales         →   Calculate % change         Comparison
```

---

## 🔄 WORKFLOW DIAGRAM

```
MORNING                    DURING DAY                EVENING
──────────────────────────────────────────────────────────────

1. Open Report         →   2. Process Sales      →   6. Open Report
   Check Opening          Select Payment            Review All
   Balance                Method ⭐                 Sections
   
   ↓                       ↓                        ↓
   
   Count Cash             Record Purchases          Count Physical
   Verify Match           Record Expenses           Cash
   
   ↓                       ↓                        ↓
   
   If OK:                 Update Real-Time          Compare with
   Start Operations                                 Closing Balance
   
   If NOT OK:                                       ↓
   Investigate!                                     
                                                    If Match:
                                                    ✅ Good!
                                                    Print & Sign
                                                    
                                                    If NOT Match:
                                                    ❌ Problem!
                                                    Investigate!
```

---

## 🎯 KEY SUCCESS FACTORS

```
1. ACCURATE DATA ENTRY
   └─ Staff select correct payment method
      └─ Training ✅
      └─ Verification ✅
      └─ Supervision ✅

2. TIMELY RECORDING
   └─ Purchases recorded immediately
   └─ Expenses recorded immediately
   └─ No delays ✅

3. DAILY VERIFICATION
   └─ Physical cash count
      └─ Matches closing balance
         └─ If NOT → Investigate
            └─ Find issue
               └─ Fix before closing

4. REGULAR REVIEW
   └─ Daily by Accountant
   └─ Weekly by Manager
   └─ Monthly by Management
```

---

## 🏆 SYSTEM BENEFITS

```
FOR ACCOUNTANTS:
✅ Accurate financial tracking
✅ No manual calculations
✅ Easy verification
✅ Professional reports
✅ PDF export for records

FOR MANAGERS:
✅ Real-time financial visibility
✅ Performance tracking
✅ Department comparison
✅ Receivables monitoring
✅ Payables monitoring

FOR OPERATIONS:
✅ Cash control
✅ Theft detection
✅ Error identification
✅ Staff accountability
✅ Audit trail

FOR BUSINESS:
✅ Financial transparency
✅ Better decision making
✅ Trend analysis
✅ Problem identification
✅ Growth tracking
```

---

## 📚 DOCUMENT RELATIONSHIP

```
                    README_DAILY_FINANCIAL_REPORT.md
                              (START HERE)
                                   │
                    ┌──────────────┼──────────────┐
                    │              │              │
                    ▼              ▼              ▼
        Quick Reference     User Guide      Technical Verification
        (Daily Use)         (Training)      (IT/Developers)
                    │              │              │
                    └──────────────┼──────────────┘
                                   │
                    ┌──────────────┼──────────────┐
                    │              │              │
                    ▼              ▼              ▼
              Payment Methods  What Gets       Test Script
              Explanation     Recorded         (SSH Testing)
                                   │
                                   ▼
                        Support & Troubleshooting
```

---

## 🎓 LEARNING PATH

```
FOR NEW USERS:
1. Read Quick Reference ⭐
2. Shadow experienced staff
3. Practice with test data
4. Review past reports
5. Get hands-on training

FOR DEVELOPERS:
1. Read Technical Verification ⭐
2. Review code in controller
3. Check database tables
4. Run test script
5. Review error logs
```

---

## 🔗 INTEGRATION POINTS

```
DAILY FINANCIAL REPORT
         │
         ├─── POS System (Sales)
         │     └─ Processes sales
         │     └─ Records payments
         │
         ├─── Room Booking System
         │     └─ Tracks bookings
         │     └─ Records payments
         │
         ├─── Purchase Management
         │     └─ Records purchases
         │     └─ Tracks payments
         │
         ├─── Expense Management
         │     └─ Records expenses
         │     └─ Tracks payments
         │
         └─── Product Catalog
               └─ Categories
               └─ Pricing
```

---

## 📊 REPORT OUTPUT EXAMPLE

```
═══════════════════════════════════════════════════════════
              EAST GATE HOTEL
           DAILY FINANCIAL REPORT
               June 10, 2026
═══════════════════════════════════════════════════════════

I. OPENING BALANCE                         150,000.00 RWF
───────────────────────────────────────────────────────────

II. SALES TODAY                            450,000.00 RWF
   
   A. Sales by Department
      RESTAURANT SALES                     200,000.00 RWF
      BAR SALES                             80,000.00 RWF
      ROOM SALES                           150,000.00 RWF
      COFFEE SHOP SALES                     20,000.00 RWF
   
   B. Payment Method Breakdown
      CASH                   15 trans | 120,000.00 | 26.7%
      MOBILE MONEY          10 trans | 100,000.00 | 22.2%
      CARD PAYMENT           8 trans |  80,000.00 | 17.8%
      BANK TRANSFER          3 trans |  50,000.00 | 11.1%
      ROOM CHARGES          12 trans | 100,000.00 | 22.2%
      ─────────────────────────────────────────────────────
      TOTAL                 48 trans | 450,000.00 | 100%

───────────────────────────────────────────────────────────

III. PURCHASES TODAY                        80,000.00 RWF
     Paid: 60,000 | Credit: 20,000

IV. OTHER EXPENSES                          30,000.00 RWF
    Paid: 25,000 | Credit: 5,000

───────────────────────────────────────────────────────────

V. CASH FLOW SUMMARY
   Opening Cash Balance                    150,000.00
   + Cash Collected Today                  120,000.00
   = Total Cash Available                  270,000.00
   - Purchases Paid                         60,000.00
   - Expenses Paid                          25,000.00
   ─────────────────────────────────────────────────────
   = CLOSING CASH BALANCE                  185,000.00

   ⚠️  COUNT CASH: Should have 185,000.00 RWF

───────────────────────────────────────────────────────────
```

---

**Last Updated**: June 10, 2026  
**Version**: 2.0  
**Status**: Production Ready ✅

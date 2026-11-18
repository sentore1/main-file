# DAILY FINANCIAL REPORT - QUICK REFERENCE GUIDE
## One-Page Summary for Daily Use

---

## 🚀 QUICK START

### Access the Report:
1. Login to POS system
2. Go to **POS → Reports → Daily Financial Report**
3. Select date and branch (or "All Branches")
4. Report loads automatically

---

## 📊 WHAT THE REPORT SHOWS

### **I. OPENING BALANCE**
💰 Cash you started the day with (from yesterday's closing)

### **II. SALES TODAY**
📈 All sales made today, broken down by:
- **Department** (Restaurant, Bar, Rooms, Coffee Shop, etc.)
- **Payment Method** (Cash, MOMO, Card, Bank Transfer, Check, Room Charges)

Shows:
- Number of transactions per payment method
- Percentage of each payment method
- Cash collected (goes to register)
- Electronic payments (goes to bank)
- Room charges (not yet collected)

### **III. PURCHASES TODAY**
🛒 Items/supplies you bought today, by department
- Shows what was **PAID** (cash out)
- Shows what's on **CREDIT** (owe supplier)

### **IV. OTHER EXPENSES TODAY**
💸 Other expenses like salaries, utilities, repairs
- Shows what was **PAID** (cash out)
- Shows what's on **CREDIT** (owe later)

### **V. CASH FLOW SUMMARY**
💵 The most important section!

```
Opening Cash Balance         XXX
+ Cash Collected Today      XXX
= Total Cash Available      XXX
- Purchases Paid (Cash)     XXX
- Expenses Paid (Cash)      XXX
= CLOSING CASH BALANCE      XXX  ← COUNT YOUR CASH - SHOULD MATCH THIS!
```

### **VI. ACCOUNTS RECEIVABLE**
👥 Who owes YOU money (unpaid room bookings, unpaid room charges)

### **VII. ACCOUNTS PAYABLE**
🏢 Who YOU owe money to (suppliers, unpaid invoices)

### **VIII. PERFORMANCE vs YESTERDAY**
📊 How today compares to yesterday
- Green = Better than yesterday
- Red = Lower than yesterday

### **IX. TOP SELLING PRODUCTS**
🌟 Your 5 best-selling items today

---

## ⚠️ CRITICAL: PAYMENT METHOD SELECTION

### When Making a Sale in POS:
**ALWAYS select the correct payment method!**

Available options:
- **Cash** - Customer paid with physical money
- **Card** - Customer paid with debit/credit card
- **MTN MOMO** - Mobile money (MTN)
- **Airtel Money** - Mobile money (Airtel)
- **Bank** - Bank transfer
- **Check** - Customer paid by check
- **Charge to Room** - Guest charges to their room (paid later)

**Why it matters:**
The report reads this field directly to show payment breakdown. If you select the wrong method, the report will be inaccurate!

---

## 📅 DAILY WORKFLOW

### ☀️ MORNING (Start of Day):
1. Open Daily Financial Report for today
2. Check **Opening Balance** matches yesterday's **Closing Balance**
3. If mismatch → investigate before starting operations
4. Count physical cash in register → should match Opening Balance

### 🌞 DURING THE DAY:
1. Process all sales through POS
2. **SELECT CORRECT PAYMENT METHOD** for each sale
3. Record all purchases immediately (create purchase invoice)
4. Record all expenses immediately
5. For room bookings, record payments received

### 🌙 EVENING (End of Day):
1. Open Daily Financial Report for today
2. Review all 9 sections
3. **COUNT PHYSICAL CASH in register**
4. Verify it matches **Section V: CLOSING CASH BALANCE**
5. If mismatch:
   - Review all transactions from today
   - Check if any sales recorded with wrong payment method
   - Check if any cash expenses not recorded
6. Download PDF
7. Print and sign (Accountant + Operations Manager)
8. Note the closing balance → this becomes tomorrow's opening balance

---

## 🔍 TROUBLESHOOTING

### Problem: Opening Balance is Wrong
**Cause**: Yesterday's closing wasn't calculated correctly  
**Fix**: Review yesterday's report, verify all transactions recorded

### Problem: Closing Balance Doesn't Match Physical Cash
**Possible causes**:
1. ❌ Sales recorded with wrong payment method (said "Cash" but customer paid by card)
2. ❌ Cash expense not recorded in system
3. ❌ Cash purchase not recorded
4. ❌ Physical cash taken out but not recorded
5. ❌ Physical cash added but not recorded

**How to fix**:
- Review all today's transactions one by one
- Check payment methods are correct
- Verify all expenses recorded
- Look for any manual cash movements

### Problem: Payment Method Breakdown Looks Wrong
**Cause**: Sales recorded with wrong payment method  
**Fix**: 
1. Find the incorrect sale(s)
2. Edit the sale
3. Correct the payment method
4. Refresh the report

### Problem: Missing Purchases or Expenses
**Cause**: Not recorded in system  
**Fix**: 
1. Go to Purchase Invoices or Expenses module
2. Create the missing records
3. Refresh the report

---

## 📱 FEATURES

### Filters:
- **Date Picker** - View any past date
- **Branch Dropdown** - View specific branch or all branches
- **Search Box** - Quick search for branch name

### Actions:
- **Download PDF** - Print or save report
- **Auto-refresh** - Updates when you change date/branch

### Visual Indicators:
- 🔵 Blue = Opening balance, Cash flow
- 🟢 Green = Sales, Receivables, Performance increase
- 🟠 Orange = Purchases
- 🔴 Red = Expenses, Payables, Performance decrease, Overdue items
- 🟡 Yellow = Verification notes, Top products

---

## ✅ QUICK CHECKLIST

**Every Morning:**
- [ ] Open today's report
- [ ] Verify opening balance
- [ ] Count cash in register

**Every Evening:**
- [ ] Open today's report
- [ ] Review all 9 sections
- [ ] Count physical cash
- [ ] Verify matches closing balance
- [ ] Download and print PDF
- [ ] Sign report (Accountant + Manager)
- [ ] File for records

**Every Transaction:**
- [ ] Select correct payment method
- [ ] Record purchases immediately
- [ ] Record expenses immediately

---

## 🆘 NEED HELP?

### View Test Script Results:
```bash
cd /home/pryro.eastgatehotel.rw/public_html
php test-daily-financial-report.php
```

### Check Logs:
```bash
tail -n 100 storage/logs/laravel.log
```

### Contact Support:
If you see errors or unexpected results, contact IT support with:
1. Screenshot of the report
2. Date and branch selected
3. Description of what's wrong

---

## 📚 RELATED DOCUMENTS

- **DAILY_FINANCIAL_REPORT_FINAL_VERIFICATION.md** - Complete technical details
- **DAILY_FINANCIAL_REPORT_USER_GUIDE.md** - Full user guide with examples
- **test-daily-financial-report.php** - Testing script for verification
- **WHAT_GETS_RECORDED_ON_REPORT.md** - What data appears and how
- **PAYMENT_METHOD_DETECTION_EXPLAINED.md** - How payment tracking works

---

## 🎯 REMEMBER

**The Daily Financial Report is only as accurate as the data you enter!**

✅ Always select correct payment methods  
✅ Record all purchases and expenses immediately  
✅ Count physical cash daily  
✅ Investigate mismatches immediately  

**If the closing balance doesn't match your physical cash, something is wrong - find it before closing the day!**

---

**Last Updated**: June 10, 2026  
**Version**: 2.0 (Quick Reference)

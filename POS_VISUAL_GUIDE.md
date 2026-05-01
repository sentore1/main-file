# POS System - Visual Changes Guide

## 🎨 What You'll See (Before & After)

---

## 1. CART ITEM - Price Editing

### BEFORE:
```
┌─────────────────────────────────────┐
│ 🖼️  Chips                           │
│     1,000 RWF each                  │
│                                     │
│  [-]  2  [+]        2,000 RWF      │
└─────────────────────────────────────┘
```

### AFTER:
```
┌─────────────────────────────────────┐
│ 🖼️  Chips                           │
│     1,000 RWF each  ✏️ [Edit]       │  ← NEW: Edit button
│                                     │
│  [-]  2  [+]        2,000 RWF      │
│  [📝 Add Notes]                     │  ← NEW: Notes button
└─────────────────────────────────────┘
```

### WHEN EDITING PRICE:
```
┌─────────────────────────────────────┐
│ 🖼️  Chips                           │
│     [1500] ✓                        │  ← NEW: Input + Confirm
│                                     │
│  [-]  2  [+]        3,000 RWF      │  ← Auto-updated
│  [📝 Add Notes]                     │
└─────────────────────────────────────┘
```

### WHEN ADDING NOTES:
```
┌─────────────────────────────────────┐
│ 🖼️  Chips                           │
│     1,500 RWF each  ✏️              │
│     📝 Extra crispy                 │  ← NEW: Note displayed
│  [-]  2  [+]        3,000 RWF      │
│  [Type note here...] ✓             │  ← NEW: Note input
└─────────────────────────────────────┘
```

---

## 2. CUSTOMER SELECTION

### BEFORE:
```
┌────────────────────────────────────────┐
│ [Select Customer ▼]                    │
│  - John Doe                            │
│  - Jane Smith                          │
└────────────────────────────────────────┘
```

### AFTER:
```
┌────────────────────────────────────────┐
│ [Select Customer ▼]  [+ Add]          │  ← NEW: Add button
│  - John Doe                            │
│  - Jane Smith                          │
└────────────────────────────────────────┘
```

### WHEN CLICKED:
```
┌─────────────────────────────────────┐
│  ➕ Add New Customer                │
│                                     │
│  Name: [________________]           │
│  Email: [________________]          │
│  Phone: [________________]          │
│                                     │
│  [Cancel]  [Add Customer]           │
└─────────────────────────────────────┘
```

---

## 3. PAYMENT MODAL

### BEFORE:
```
┌─────────────────────────────────────┐
│  Process Payment                    │
├─────────────────────────────────────┤
│  Subtotal:        10,000 RWF       │
│  Tax:              1,800 RWF       │
│  Discount:        -1,000 RWF       │
│  ─────────────────────────         │
│  Total:           10,800 RWF       │
│                                     │
│  [Cancel]  [Complete Sale]          │
└─────────────────────────────────────┘
```

### AFTER:
```
┌─────────────────────────────────────┐
│  Process Payment                    │
├─────────────────────────────────────┤
│  Subtotal:        10,000 RWF       │
│  Tax:              1,800 RWF       │
│  Discount:        -1,000 RWF       │
│  ─────────────────────────         │
│  Total:           10,800 RWF       │
│  ─────────────────────────         │
│  Amount Paid: [6000]               │  ← NEW: Editable field
│  Balance Due:  4,800 RWF           │  ← NEW: Auto-calculated
│                                     │
│  [Cancel]  [Complete Sale]          │
└─────────────────────────────────────┘
```

---

## 4. PAYMENT MODAL - PRODUCT TABLE

### BEFORE:
```
┌──────────────────────────────────────────────────────┐
│ Product    │ Qty │ Price │ Tax    │ Tax Amt │ Total │
├──────────────────────────────────────────────────────┤
│ Chips      │  2  │ 1,000 │ VAT 18%│   360   │ 2,360 │
│ SKU: CH001 │     │       │        │         │       │
└──────────────────────────────────────────────────────┘
```

### AFTER:
```
┌──────────────────────────────────────────────────────┐
│ Product    │ Qty │ Price │ Tax    │ Tax Amt │ Total │
├──────────────────────────────────────────────────────┤
│ Chips      │  2  │ 1,500 │ VAT 18%│   540   │ 3,540 │
│ SKU: CH001 │     │       │        │         │       │
│ 📝 Extra crispy                                      │  ← NEW: Notes shown
└──────────────────────────────────────────────────────┘
```

---

## 5. COMPLETE WORKFLOW EXAMPLE

### Scenario: VIP Customer wants custom order

```
STEP 1: Select/Add Customer
┌─────────────────────────────────┐
│ [VIP Client ▼]  [+ Add]        │
└─────────────────────────────────┘

STEP 2: Add Product to Cart
┌─────────────────────────────────┐
│ 🖼️  Rice                        │
│     1,000 RWF each  ✏️          │
└─────────────────────────────────┘

STEP 3: Edit Price (VIP gets higher quality)
┌─────────────────────────────────┐
│ 🖼️  Rice                        │
│     [1500] ✓  ← Changed         │
└─────────────────────────────────┘

STEP 4: Add Note (Specify type)
┌─────────────────────────────────┐
│ 🖼️  Rice                        │
│     1,500 RWF each  ✏️          │
│     📝 Indian Basmati           │  ← Added
│  [-]  5  [+]        7,500 RWF  │
│  [Edit Notes] ✓                 │
└─────────────────────────────────┘

STEP 5: Checkout with Partial Payment
┌─────────────────────────────────┐
│  Total:        7,500 RWF       │
│  Amount Paid:  [5000]          │  ← Customer pays partial
│  Balance Due:   2,500 RWF      │  ← System calculates
│                                 │
│  [Complete Sale]                │
└─────────────────────────────────┘

STEP 6: Receipt Shows Everything
┌─────────────────────────────────┐
│  RECEIPT #POS00123              │
│  Customer: VIP Client           │
│  ─────────────────────          │
│  Rice (5 kg)                    │
│  📝 Indian Basmati              │  ← Note printed
│  1,500 × 5 = 7,500 RWF        │  ← Custom price
│  ─────────────────────          │
│  Total:      7,500 RWF         │
│  Paid:       5,000 RWF         │  ← Partial payment
│  Balance:    2,500 RWF         │  ← Due amount
└─────────────────────────────────┘
```

---

## 6. BUTTON LOCATIONS MAP

```
┌─────────────────────────────────────────────────────────────┐
│  [🏠] [Search...] [Customer ▼][+] [Warehouse ▼] [SKU...]   │  ← Add Customer button
│                                    ↑                         │
│                              NEW BUTTON                      │
├─────────────────────────────────────────────────────────────┤
│  Products Grid                │  Shopping Cart               │
│                               │  ┌─────────────────────────┐│
│  [Product Cards...]           │  │ 🖼️ Item Name           ││
│                               │  │    Price ✏️  ← Edit     ││  ← Price edit button
│                               │  │    📝 Note              ││
│                               │  │  [-] Qty [+]  Total     ││
│                               │  │  [📝 Add Notes]         ││  ← Notes button
│                               │  └─────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

---

## 7. COLOR CODING

### Visual Indicators:
- 🟢 **Green** - Prices and totals
- 🔵 **Blue** - Edit buttons and actions
- 🟠 **Orange** - Balance due / Partial payment
- ⚫ **Gray** - Regular text
- 🔴 **Red** - Delete/Remove actions

### Icons Used:
- ✏️ **Edit** - Price editing
- 📝 **Notes** - Item notes
- ➕ **Plus** - Add customer
- ✓ **Check** - Confirm changes
- 🗑️ **Trash** - Remove item

---

## 8. MOBILE VIEW

### Cart Item on Mobile:
```
┌─────────────────────────┐
│ 🖼️ Chips                │
│                         │
│ 1,000 RWF  ✏️           │  ← Edit button
│ 📝 Extra crispy         │  ← Note
│                         │
│ [-]  2  [+]             │
│                         │
│ Total: 2,000 RWF       │
│                         │
│ [📝 Add Notes]          │  ← Full width button
└─────────────────────────┘
```

---

## 9. STATUS INDICATORS

### Order Status Display:

#### Completed (Full Payment):
```
┌─────────────────────────┐
│ Order #POS00123         │
│ Status: ✅ Completed    │
│ Paid: 10,000 RWF       │
└─────────────────────────┘
```

#### Partial Payment:
```
┌─────────────────────────┐
│ Order #POS00123         │
│ Status: 🟠 Partial      │  ← NEW status
│ Paid: 6,000 RWF        │
│ Due: 4,000 RWF         │  ← NEW field
└─────────────────────────┘
```

---

## 10. KEYBOARD SHORTCUTS (Future Enhancement)

```
Alt + P  → Edit Price
Alt + N  → Add Notes
Alt + C  → Add Customer
Enter    → Confirm Edit
Escape   → Cancel Edit
```

---

## 📱 RESPONSIVE BEHAVIOR

### Desktop (1920px):
- All buttons visible
- Side-by-side layout
- Full modals

### Tablet (768px):
- Stacked layout
- Touch-friendly buttons
- Scrollable modals

### Mobile (375px):
- Single column
- Large touch targets
- Full-screen modals

---

## 🎯 QUICK REFERENCE

| Action | Button | Location |
|--------|--------|----------|
| Edit Price | ✏️ | Next to price in cart |
| Add Notes | 📝 Add Notes | Below item in cart |
| Add Customer | ➕ | Next to customer dropdown |
| Partial Payment | Amount Paid field | Payment modal |
| Confirm Edit | ✓ | Next to input field |

---

## ✨ ANIMATION EFFECTS

- ✅ Smooth transitions when editing
- ✅ Fade in/out for modals
- ✅ Highlight on hover
- ✅ Pulse effect on new items
- ✅ Slide down for notes input

---

**All changes are intuitive and follow existing design patterns!**

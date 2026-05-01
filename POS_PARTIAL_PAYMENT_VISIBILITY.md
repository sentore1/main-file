# POS Partial Payments - Complete Guide

## Current Status: Where Partial Payments Appear

### ✅ Where It DOES Show:
1. **Database** - `pos_payments` table
   - `paid_amount` - Amount paid
   - `balance_due` - Outstanding balance
   
2. **Order Status** - `pos` table
   - `status` = 'partial' (when balance > 0)
   - `status` = 'completed' (when fully paid)

3. **Print/PDF Receipt** - After our fix
   - Shows "Paid: X"
   - Shows "Balance Due: Y"

### ❌ Where It DOESN'T Show (YET):
1. **POS Orders List** (`/pos/orders`)
   - No status badge
   - No paid amount
   - No balance due
   - Only shows total

2. **Dashboard** 
   - Doesn't distinguish partial vs full payment

---

## What Needs to Be Added:

### 1. POS Orders List Should Show:
```
┌─────────────────────────────────────────────────────────────┐
│ Sale Number │ Customer │ Warehouse │ Status  │ Total │ Paid │ Due │
├─────────────────────────────────────────────────────────────┤
│ #POS00123   │ John Doe │ Kigali    │ ✅ Paid │ 10,000│10,000│  0  │
│ #POS00124   │ Jane     │ Kigali    │ ⚠️ Part │  5,000│ 3,000│2,000│
│ #POS00125   │ Walk-in  │ Ngoma     │ ✅ Paid │  8,000│ 8,000│  0  │
└─────────────────────────────────────────────────────────────┘
```

### 2. Status Badges:
- 🟢 **Completed** - Full payment (green badge)
- 🟠 **Partial** - Partial payment (orange badge)
- 🔴 **Cancelled** - Cancelled order (red badge)
- ⚪ **Pending** - Not yet processed (gray badge)

### 3. Grid View Cards Should Show:
```
┌─────────────────────────┐
│ 🛒 #POS00124           │
│ ⚠️ Partial Payment      │
│                         │
│ Customer: Jane Smith    │
│ Warehouse: Kigali       │
│                         │
│ Total:    5,000 RWF    │
│ Paid:     3,000 RWF ✅ │
│ Due:      2,000 RWF ⚠️ │
└─────────────────────────┘
```

---

## How to Access Partial Payment Orders:

### Current Way:
1. Go to **POS** menu
2. Click **POS Orders**
3. Click on any order
4. View details
5. Click **Print** to see payment info

### After Update (Better Way):
1. Go to **POS Orders**
2. See status badge immediately
3. See paid/due amounts in list
4. Filter by status (Partial/Completed)
5. Click to view full details

---

## Database Query to See Partial Payments:

```sql
-- See all partial payment orders
SELECT 
    p.id,
    p.sale_number,
    p.status,
    u.name as customer_name,
    w.name as warehouse_name,
    pp.amount as total,
    pp.paid_amount,
    pp.balance_due,
    p.created_at
FROM pos p
LEFT JOIN users u ON p.customer_id = u.id
LEFT JOIN warehouses w ON p.warehouse_id = w.id
LEFT JOIN pos_payments pp ON p.id = pp.pos_id
WHERE p.status = 'partial'
ORDER BY p.created_at DESC;
```

---

## What Gets Updated:

### File: PosOrder/Index.tsx

#### Add to Interface:
```typescript
interface PosSale {
    id: number;
    sale_number: string;
    status: 'completed' | 'partial' | 'pending' | 'cancelled';  // ADD THIS
    customer?: {
        name: string;
        email: string;
    };
    warehouse?: {
        name: string;
    };
    payment?: {                                                  // ADD THIS
        paid_amount: number;
        balance_due: number;
        discount_amount: number;
    };
    total: number;
    created_at: string;
}
```

#### Add Status Column:
```typescript
{
    key: 'status',
    header: t('Status'),
    render: (_: any, sale: PosSale) => {
        const statusConfig = {
            completed: { label: t('Completed'), color: 'bg-green-100 text-green-800' },
            partial: { label: t('Partial'), color: 'bg-orange-100 text-orange-800' },
            pending: { label: t('Pending'), color: 'bg-gray-100 text-gray-800' },
            cancelled: { label: t('Cancelled'), color: 'bg-red-100 text-red-800' }
        };
        const config = statusConfig[sale.status] || statusConfig.pending;
        return (
            <Badge className={config.color}>
                {config.label}
            </Badge>
        );
    }
}
```

#### Add Paid Amount Column:
```typescript
{
    key: 'paid_amount',
    header: t('Paid'),
    render: (_: any, sale: PosSale) => (
        <span className="text-green-600 font-medium">
            {formatCurrency(sale.payment?.paid_amount || 0)}
        </span>
    )
}
```

#### Add Balance Due Column:
```typescript
{
    key: 'balance_due',
    header: t('Balance Due'),
    render: (_: any, sale: PosSale) => {
        const balance = sale.payment?.balance_due || 0;
        return balance > 0 ? (
            <span className="text-orange-600 font-semibold">
                {formatCurrency(balance)}
            </span>
        ) : (
            <span className="text-gray-400">-</span>
        );
    }
}
```

---

## Updated Grid View Card:

```typescript
<Card key={sale.id} className="border border-gray-200">
    <div className="p-4">
        <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-primary/10 rounded-lg">
                <ShoppingCart className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
                <h3 className="font-semibold text-base">{sale.sale_number}</h3>
                {/* ADD STATUS BADGE */}
                <Badge className={
                    sale.status === 'completed' ? 'bg-green-100 text-green-800' :
                    sale.status === 'partial' ? 'bg-orange-100 text-orange-800' :
                    'bg-gray-100 text-gray-800'
                }>
                    {sale.status === 'completed' ? t('Paid') : 
                     sale.status === 'partial' ? t('Partial') : 
                     t('Pending')}
                </Badge>
            </div>
        </div>

        <div className="space-y-2">
            <div>
                <p className="text-xs text-gray-600">{t('Customer')}</p>
                <p className="text-sm">{sale.customer?.name || t('Walk-in')}</p>
            </div>
            <div>
                <p className="text-xs text-gray-600">{t('Total')}</p>
                <p className="text-sm font-semibold">{formatCurrency(sale.total)}</p>
            </div>
            
            {/* ADD PAYMENT INFO */}
            {sale.status === 'partial' && (
                <>
                    <div>
                        <p className="text-xs text-gray-600">{t('Paid')}</p>
                        <p className="text-sm text-green-600 font-medium">
                            {formatCurrency(sale.payment?.paid_amount || 0)}
                        </p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-600">{t('Balance Due')}</p>
                        <p className="text-sm text-orange-600 font-semibold">
                            {formatCurrency(sale.payment?.balance_due || 0)}
                        </p>
                    </div>
                </>
            )}
        </div>
    </div>
</Card>
```

---

## Filter by Status:

Add status filter to the filters section:

```typescript
<div>
    <label className="block text-sm font-medium text-gray-700 mb-2">
        {t('Status')}
    </label>
    <Select
        value={filters.status}
        onValueChange={(value) => setFilters({...filters, status: value})}
    >
        <SelectTrigger>
            <SelectValue placeholder={t('All Statuses')} />
        </SelectTrigger>
        <SelectContent>
            <SelectItem value="all">{t('All Statuses')}</SelectItem>
            <SelectItem value="completed">{t('Completed')}</SelectItem>
            <SelectItem value="partial">{t('Partial Payment')}</SelectItem>
            <SelectItem value="pending">{t('Pending')}</SelectItem>
            <SelectItem value="cancelled">{t('Cancelled')}</SelectItem>
        </SelectContent>
    </Select>
</div>
```

---

## Controller Update Needed:

The controller already loads payment data in index method (we fixed it):

```php
// Line ~30 in PosController.php
$query = Pos::with([
    'customer:id,name,email', 
    'warehouse:id,name', 
    'payment:pos_id,discount,amount,discount_amount,paid_amount,balance_due'  // ✅ Already fixed
])
```

But we need to add status to the transform:

```php
$sales->getCollection()->transform(function($sale) {
    $sale->total = $sale->payment ? $sale->payment->discount_amount : 0;
    $sale->paid_amount = $sale->payment ? $sale->payment->paid_amount : 0;      // ADD
    $sale->balance_due = $sale->payment ? $sale->payment->balance_due : 0;      // ADD
    return $sale;
});
```

---

## Summary of Changes Needed:

### Backend (Controller):
1. ✅ Already loading payment data
2. ⚠️ Need to add paid_amount and balance_due to transform

### Frontend (Index.tsx):
1. ⚠️ Add status column to table
2. ⚠️ Add paid amount column
3. ⚠️ Add balance due column
4. ⚠️ Update grid cards to show payment info
5. ⚠️ Add status filter
6. ⚠️ Update TypeScript interfaces

---

## Visual Example:

### Before (Current):
```
POS Orders
┌────────────┬──────────┬───────────┬────────┐
│ Sale #     │ Customer │ Warehouse │ Total  │
├────────────┼──────────┼───────────┼────────┤
│ #POS00123  │ John Doe │ Kigali    │ 10,000 │
│ #POS00124  │ Jane     │ Kigali    │  5,000 │  ← Can't tell it's partial!
└────────────┴──────────┴───────────┴────────┘
```

### After (Updated):
```
POS Orders
┌────────────┬──────────┬───────────┬─────────┬────────┬───────┬──────┐
│ Sale #     │ Customer │ Warehouse │ Status  │ Total  │ Paid  │ Due  │
├────────────┼──────────┼───────────┼─────────┼────────┼───────┼──────┤
│ #POS00123  │ John Doe │ Kigali    │ ✅ Paid │ 10,000 │10,000 │   0  │
│ #POS00124  │ Jane     │ Kigali    │ ⚠️ Part │  5,000 │ 3,000 │2,000 │  ← Clear!
└────────────┴──────────┴───────────┴─────────┴────────┴───────┴──────┘
```

---

## Next Steps:

1. Update PosController index method transform
2. Update Index.tsx interface
3. Add status, paid, and due columns
4. Update grid view cards
5. Add status filter
6. Test with partial payment orders

Would you like me to create the updated Index.tsx file with all these changes?

# Where to Find the Edit Button

## Location

The **Edit** button will appear in the **POS Orders** list page.

### How to Access:

1. **Navigate to**: POS → POS Orders (or visit `/pos/orders`)
2. **Look in the Actions column** (rightmost column in the table)
3. You'll see action buttons for each order:
   - 🟢 **Eye icon** (Green) - View order details
   - 🔵 **Edit icon** (Blue) - Edit the order ← **THIS IS THE NEW BUTTON**
   - 🟠 **Dollar icon** (Orange) - Pay balance (only shows for partial payments)

## Visual Layout

```
┌─────────────────────────────────────────────────────────────┐
│ Sale Number │ Date │ Customer │ Warehouse │ ... │ Actions   │
├─────────────────────────────────────────────────────────────┤
│ #POS00001   │ ...  │ John     │ Main      │ ... │ 👁️ ✏️ 💵  │
│ #POS00002   │ ...  │ Jane     │ Branch    │ ... │ 👁️ ✏️     │
└─────────────────────────────────────────────────────────────┘
```

## Button Details

### Edit Button (✏️)
- **Color**: Blue
- **Icon**: Pencil/Edit icon
- **Tooltip**: "Edit" (shows on hover)
- **Permission Required**: `edit-pos`
- **Action**: Opens the edit page for that specific order

## Who Can See It?

Only users with the `edit-pos` permission will see the Edit button. By default, this includes:
- Users with the `company` role
- Any custom roles that have been granted the `edit-pos` permission

## What Happens When Clicked?

When you click the Edit button:
1. You'll be redirected to `/pos/orders/{order_id}/edit`
2. The edit page will load with:
   - Current order details pre-filled
   - Product selection grid
   - Shopping cart with existing items
   - Ability to add/remove/modify items
3. Make your changes and click "Update Sale"

## Important Notes

⚠️ **Cannot Edit Room Bookings**: If an order contains room bookings, you'll see an error message when trying to save. Room bookings require special handling and cannot be edited through the regular POS edit interface.

✅ **Inventory Management**: When you edit an order, the system automatically:
- Restores stock for removed/reduced items
- Deducts stock for new/increased items
- Validates stock availability before saving

## Testing the Button

After running the migration:
```bash
php artisan migrate
php artisan cache:clear
```

1. Go to `/pos/orders`
2. Look for the blue Edit icon (✏️) in the Actions column
3. Click it to edit any order
4. Make changes and save

## Troubleshooting

**If you don't see the Edit button:**

1. ✅ Check you ran the migration: `php artisan migrate`
2. ✅ Clear cache: `php artisan cache:clear`
3. ✅ Verify your user has the `edit-pos` permission
4. ✅ Check you're on the POS Orders page (`/pos/orders`)
5. ✅ Refresh your browser (Ctrl+F5 or Cmd+Shift+R)

**If the button appears but doesn't work:**

1. Check browser console for JavaScript errors (F12)
2. Verify the route exists: `php artisan route:list | grep pos.edit`
3. Check Laravel logs: `storage/logs/laravel.log`

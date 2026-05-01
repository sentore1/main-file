# Visual Configuration Guide

## 🎯 Goal
Show different company headers on invoices based on which warehouse is selected.

---

## 📊 Before vs After

### BEFORE (All invoices showed the same header)
```
Invoice from Warehouse A:
┌─────────────────────────┐
│ ABC Company             │
│ 123 Main Street         │
│ New York, NY 10001      │
└─────────────────────────┘

Invoice from Warehouse B:
┌─────────────────────────┐
│ ABC Company             │  ← Same header!
│ 123 Main Street         │
│ New York, NY 10001      │
└─────────────────────────┘
```

### AFTER (Each warehouse shows its own header)
```
Invoice from Warehouse A:
┌─────────────────────────┐
│ ABC Company - East      │
│ 123 Main Street         │
│ New York, NY 10001      │
│ east@abc.com            │
└─────────────────────────┘

Invoice from Warehouse B:
┌─────────────────────────┐
│ ABC Company - West      │  ← Different header!
│ 456 Pacific Ave         │
│ Los Angeles, CA 90001   │
│ west@abc.com            │
└─────────────────────────┘
```

---

## 🔧 Configuration Example

### Step 1: Find Your Warehouse IDs

Go to your database and check the `warehouses` table:

```
| id | name           | location      |
|----|----------------|---------------|
| 1  | Main Warehouse | New York      |
| 2  | West Warehouse | Los Angeles   |
| 3  | East Warehouse | Boston        |
```

### Step 2: Configure Headers

Open `resources/js/utils/warehouseHeaders.ts`:

```typescript
const warehouseHeaders: Record<number, WarehouseHeader> = {
    // Warehouse ID 1 - Main Warehouse
    1: {
        company_name: 'ABC Company - Main Branch',
        company_address: '123 Main Street',
        company_city: 'New York',
        company_state: 'NY',
        company_zipcode: '10001',
        company_country: 'United States',
        company_telephone: '+1 (555) 100-0001',
        company_email: 'main@abccompany.com',
        registration_number: 'REG-MAIN-001'
    },
    
    // Warehouse ID 2 - West Warehouse
    2: {
        company_name: 'ABC Company - West Coast',
        company_address: '456 Pacific Avenue',
        company_city: 'Los Angeles',
        company_state: 'CA',
        company_zipcode: '90001',
        company_country: 'United States',
        company_telephone: '+1 (555) 200-0002',
        company_email: 'west@abccompany.com',
        registration_number: 'REG-WEST-002'
    },
    
    // Warehouse ID 3 - East Warehouse
    3: {
        company_name: 'ABC Company - East Coast',
        company_address: '789 Atlantic Road',
        company_city: 'Boston',
        company_state: 'MA',
        company_zipcode: '02101',
        company_country: 'United States',
        company_telephone: '+1 (555) 300-0003',
        company_email: 'east@abccompany.com',
        registration_number: 'REG-EAST-003'
    }
};
```

### Step 3: Build and Test

```bash
npm run build
```

---

## 🎨 Real-World Example

### Scenario: Multi-Branch Retail Company

**Company**: "Fashion Forward Inc."
**Branches**: 3 retail locations

#### Configuration:

```typescript
const warehouseHeaders: Record<number, WarehouseHeader> = {
    // Downtown Store (ID: 1)
    1: {
        company_name: 'Fashion Forward - Downtown',
        company_address: '100 Fashion Avenue',
        company_city: 'Manhattan',
        company_state: 'NY',
        company_zipcode: '10018',
        company_telephone: '+1 (212) 555-0100',
        company_email: 'downtown@fashionforward.com',
        registration_number: 'NY-FF-001'
    },
    
    // Mall Store (ID: 2)
    2: {
        company_name: 'Fashion Forward - Westfield Mall',
        company_address: '200 Mall Plaza, Suite 150',
        company_city: 'Los Angeles',
        company_state: 'CA',
        company_zipcode: '90045',
        company_telephone: '+1 (310) 555-0200',
        company_email: 'mall@fashionforward.com',
        registration_number: 'CA-FF-002'
    },
    
    // Outlet Store (ID: 3)
    3: {
        company_name: 'Fashion Forward - Outlet Center',
        company_address: '300 Outlet Drive',
        company_city: 'Orlando',
        company_state: 'FL',
        company_zipcode: '32819',
        company_telephone: '+1 (407) 555-0300',
        company_email: 'outlet@fashionforward.com',
        registration_number: 'FL-FF-003'
    }
};
```

#### Result:

When a customer buys from the Downtown store:
```
┌────────────────────────────────────┐
│ Fashion Forward - Downtown         │
│ 100 Fashion Avenue                 │
│ Manhattan, NY 10018                │
│ Phone: +1 (212) 555-0100          │
│ Email: downtown@fashionforward.com │
│ Registration: NY-FF-001            │
└────────────────────────────────────┘
```

When a customer buys from the Mall store:
```
┌────────────────────────────────────┐
│ Fashion Forward - Westfield Mall   │
│ 200 Mall Plaza, Suite 150          │
│ Los Angeles, CA 90045              │
│ Phone: +1 (310) 555-0200          │
│ Email: mall@fashionforward.com     │
│ Registration: CA-FF-002            │
└────────────────────────────────────┘
```

---

## 🌍 International Example

### Scenario: Global Distribution Company

**Company**: "Global Logistics Ltd."
**Warehouses**: USA, UK, Germany

```typescript
const warehouseHeaders: Record<number, WarehouseHeader> = {
    // USA Warehouse (ID: 10)
    10: {
        company_name: 'Global Logistics USA Inc.',
        company_address: '500 Logistics Parkway',
        company_city: 'Chicago',
        company_state: 'IL',
        company_zipcode: '60601',
        company_country: 'United States',
        company_telephone: '+1 (312) 555-1000',
        company_email: 'usa@globallogistics.com',
        registration_number: 'US-GL-10'
    },
    
    // UK Warehouse (ID: 20)
    20: {
        company_name: 'Global Logistics UK Ltd.',
        company_address: '25 Warehouse Lane',
        company_city: 'London',
        company_state: '',
        company_zipcode: 'E14 5AB',
        company_country: 'United Kingdom',
        company_telephone: '+44 20 7123 4567',
        company_email: 'uk@globallogistics.com',
        registration_number: 'UK-GL-20'
    },
    
    // Germany Warehouse (ID: 30)
    30: {
        company_name: 'Global Logistics Deutschland GmbH',
        company_address: 'Lagerstraße 15',
        company_city: 'Hamburg',
        company_state: '',
        company_zipcode: '20095',
        company_country: 'Germany',
        company_telephone: '+49 40 1234 5678',
        company_email: 'de@globallogistics.com',
        registration_number: 'DE-GL-30'
    }
};
```

---

## ✅ Quick Checklist

Before you start:
- [ ] I know my warehouse IDs
- [ ] I have the correct information for each warehouse
- [ ] I have access to edit TypeScript files
- [ ] I can run `npm run build`

Configuration:
- [ ] Opened `resources/js/utils/warehouseHeaders.ts`
- [ ] Added my warehouse configurations
- [ ] Saved the file
- [ ] Ran `npm run build`

Testing:
- [ ] Created a test invoice
- [ ] Selected a configured warehouse
- [ ] Downloaded PDF
- [ ] Verified correct header appears

---

## 🎓 Pro Tips

1. **Start Small**: Configure one warehouse first, test it, then add more
2. **Copy Format**: Use the example as a template
3. **Check IDs**: Double-check warehouse IDs match your database
4. **Optional Fields**: Leave out fields you don't need
5. **Backup**: Keep a copy of your configuration

---

## 🚨 Common Mistakes

❌ **Wrong warehouse ID**
```typescript
5: { ... }  // But warehouse ID is actually 3
```

❌ **Missing comma**
```typescript
1: { ... }
2: { ... }  // Missing comma after previous entry
```

❌ **Typo in field name**
```typescript
company_nam: 'ABC'  // Should be company_name
```

✅ **Correct format**
```typescript
1: {
    company_name: 'ABC Company',
    company_address: '123 Main St',
},
2: {
    company_name: 'XYZ Company',
    company_address: '456 Oak Ave',
}
```

---

## 📱 Mobile-Friendly

The headers work perfectly on:
- 📄 PDF downloads
- 🖨️ Print previews
- 💻 Desktop views
- 📱 Mobile views

---

**Ready to configure? Open `resources/js/utils/warehouseHeaders.ts` and start!**

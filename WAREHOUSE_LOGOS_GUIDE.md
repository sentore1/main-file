# Adding Warehouse Logos - Quick Guide

## ✅ Logo Support Added

Each warehouse can now have its own logo displayed on invoices and quotations.

## 📐 Logo Specifications

- **Height**: 37px
- **Width**: 100px
- **Format**: Any web-compatible image (PNG, JPG, SVG recommended)

## 🔧 Configuration

### Step 1: Upload Your Logos

Place your logo files in the `public` folder:
```
public/
  └── images/
      └── warehouses/
          ├── warehouse-1-logo.png
          ├── warehouse-2-logo.png
          └── warehouse-3-logo.png
```

### Step 2: Configure in warehouseHeaders.ts

```typescript
const warehouseHeaders: Record<number, WarehouseHeader> = {
    1: {
        logo_url: '/images/warehouses/warehouse-1-logo.png',
        company_name: 'Main Branch',
        company_address: '123 Main St',
        // ... other fields
    },
    2: {
        logo_url: '/images/warehouses/warehouse-2-logo.png',
        company_name: 'West Branch',
        company_address: '456 West Ave',
        // ... other fields
    }
};
```

### Step 3: Build and Test

```bash
npm run build
```

## 💡 How It Works

- **With Logo**: Shows the logo image (37px × 100px)
- **Without Logo**: Shows company name as text (fallback)

## 📝 Example Configuration

```typescript
const warehouseHeaders: Record<number, WarehouseHeader> = {
    // Warehouse with logo
    1: {
        logo_url: '/images/warehouses/main-logo.png',
        company_address: '123 Main Street',
        company_city: 'New York',
        company_telephone: '+1 555-0001',
        company_email: 'main@company.com',
    },
    
    // Warehouse without logo (shows company name)
    2: {
        company_name: 'West Branch',
        company_address: '456 West Avenue',
        company_city: 'Los Angeles',
        company_telephone: '+1 555-0002',
        company_email: 'west@company.com',
    }
};
```

## 🎨 Logo Tips

1. **Transparent Background**: Use PNG with transparent background for best results
2. **High Resolution**: Use 2x size (74px × 200px) for crisp display on high-DPI screens
3. **File Size**: Keep under 100KB for fast loading
4. **Format**: PNG or SVG recommended

## 🌐 Using External URLs

You can also use external URLs:

```typescript
logo_url: 'https://yourdomain.com/logos/warehouse-1.png'
```

## ✅ Testing

1. Create invoice/quotation
2. Select warehouse with logo configured
3. Download PDF
4. Verify logo appears at 37px × 100px

---

**Note**: If `logo_url` is provided, it will display the logo instead of the company name text.

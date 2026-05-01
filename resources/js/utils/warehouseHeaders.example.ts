import { getCompanySetting } from '@/utils/helpers';

export interface WarehouseHeader {
    company_name?: string;
    company_address?: string;
    company_city?: string;
    company_state?: string;
    company_zipcode?: string;
    company_country?: string;
    company_telephone?: string;
    company_email?: string;
    registration_number?: string;
    logo_url?: string;
}

// ============================================
// CONFIGURE YOUR WAREHOUSE HEADERS HERE
// ============================================
// Replace the example data below with your actual warehouse information
// The key (number) should match your warehouse ID from the database

const warehouseHeaders: Record<number, WarehouseHeader> = {
    // Example Warehouse 1 - Main Branch (with logo)
    1: {
        logo_url: '/images/warehouses/main-logo.png',
        company_address: '123 Main Street',
        company_city: 'New York',
        company_state: 'NY',
        company_zipcode: '10001',
        company_country: 'United States',
        company_telephone: '+1 (555) 123-4567',
        company_email: 'main@abccompany.com',
        registration_number: 'REG-001'
    },
    
    // Example Warehouse 2 - West Branch (with logo)
    2: {
        logo_url: '/images/warehouses/west-logo.png',
        company_address: '456 Pacific Avenue',
        company_city: 'Los Angeles',
        company_state: 'CA',
        company_zipcode: '90001',
        company_country: 'United States',
        company_telephone: '+1 (555) 987-6543',
        company_email: 'west@abccompany.com',
        registration_number: 'REG-002'
    },
    
    // Example Warehouse 3 - East Branch (without logo, shows company name)
    3: {
        company_name: 'East Branch - ABC Company',
        company_address: '789 Atlantic Road',
        company_city: 'Boston',
        company_state: 'MA',
        company_zipcode: '02101',
        company_country: 'United States',
        company_telephone: '+1 (555) 456-7890',
        company_email: 'east@abccompany.com',
        registration_number: 'REG-003'
    },
    
    // Add more warehouses below following the same pattern
    // WAREHOUSE_ID: {
    //     logo_url: '/images/warehouses/your-logo.png',  // Optional: Add logo (37px × 100px)
    //     company_name: 'Your Branch Name',              // Optional: Shows if no logo
    //     company_address: 'Your Address',
    //     company_city: 'Your City',
    //     company_state: 'Your State',
    //     company_zipcode: 'Your ZIP',
    //     company_country: 'Your Country',
    //     company_telephone: 'Your Phone',
    //     company_email: 'Your Email',
    //     registration_number: 'Your Registration Number'
    // },
};

/**
 * Get warehouse-specific header information
 * Falls back to default company settings if warehouse not configured
 */
export function getWarehouseHeader(warehouseId?: number): WarehouseHeader {
    if (warehouseId && warehouseHeaders[warehouseId]) {
        return warehouseHeaders[warehouseId];
    }
    
    // Return default company settings
    return {
        company_name: getCompanySetting('company_name'),
        company_address: getCompanySetting('company_address'),
        company_city: getCompanySetting('company_city'),
        company_state: getCompanySetting('company_state'),
        company_zipcode: getCompanySetting('company_zipcode'),
        company_country: getCompanySetting('company_country'),
        company_telephone: getCompanySetting('company_telephone'),
        company_email: getCompanySetting('company_email'),
        registration_number: getCompanySetting('registration_number')
    };
}

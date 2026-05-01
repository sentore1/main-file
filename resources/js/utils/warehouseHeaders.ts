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

// Configure warehouse-specific headers here
const warehouseHeaders: Record<number, WarehouseHeader> = {
    // Kirehe branches (1, 10-14)
    1: { company_email: 'eastgatehotelkirehe@gmail.com', company_telephone: '0783861599 / 0782804340', company_city: 'Kirehe' },
    10: { company_email: 'eastgatehotelkirehe@gmail.com', company_telephone: '0783861599 / 0782804340', company_city: 'Kirehe' },
    11: { company_email: 'eastgatehotelkirehe@gmail.com', company_telephone: '0783861599 / 0782804340', company_city: 'Kirehe' },
    12: { company_email: 'eastgatehotelkirehe@gmail.com', company_telephone: '0783861599 / 0782804340', company_city: 'Kirehe' },
    13: { company_email: 'eastgatehotelkirehe@gmail.com', company_telephone: '0783861599 / 0782804340', company_city: 'Kirehe' },
    14: { company_email: 'eastgatehotelkirehe@gmail.com', company_telephone: '0783861599 / 0782804340', company_city: 'Kirehe' },
    
    // Gatsibo branches (2, 15-19)
    2: { company_email: 'eastgatehotelgatsibo@gmail.com', company_telephone: '0785413360 / 0784822953', company_city: 'Gatsibo' },
    15: { company_email: 'eastgatehotelgatsibo@gmail.com', company_telephone: '0785413360 / 0784822953', company_city: 'Gatsibo' },
    16: { company_email: 'eastgatehotelgatsibo@gmail.com', company_telephone: '0785413360 / 0784822953', company_city: 'Gatsibo' },
    17: { company_email: 'eastgatehotelgatsibo@gmail.com', company_telephone: '0785413360 / 0784822953', company_city: 'Gatsibo' },
    18: { company_email: 'eastgatehotelgatsibo@gmail.com', company_telephone: '0785413360 / 0784822953', company_city: 'Gatsibo' },
    19: { company_email: 'eastgatehotelgatsibo@gmail.com', company_telephone: '0785413360 / 0784822953', company_city: 'Gatsibo' },
    
    // Ngoma branches (3, 5-9)
    3: { company_email: 'eastgatehotel2020@gmail.com', company_telephone: '0787584969 / 0781431477', company_city: 'Ngoma' },
    5: { company_email: 'eastgatehotel2020@gmail.com', company_telephone: '0787584969 / 0781431477', company_city: 'Ngoma' },
    6: { company_email: 'eastgatehotel2020@gmail.com', company_telephone: '0787584969 / 0781431477', company_city: 'Ngoma' },
    7: { company_email: 'eastgatehotel2020@gmail.com', company_telephone: '0787584969 / 0781431477', company_city: 'Ngoma' },
    8: { company_email: 'eastgatehotel2020@gmail.com', company_telephone: '0787584969 / 0781431477', company_city: 'Ngoma' },
    9: { company_email: 'eastgatehotel2020@gmail.com', company_telephone: '0787584969 / 0781431477', company_city: 'Ngoma' },
    
    // Kigali branches (4, 20-23)
    4: { company_email: 'eastgatehotelkigali@gmail.com', company_telephone: '0785584664', company_city: 'Kigali' },
    20: { company_email: 'eastgatehotelkigali@gmail.com', company_telephone: '0785584664', company_city: 'Kigali' },
    21: { company_email: 'eastgatehotelkigali@gmail.com', company_telephone: '0785584664', company_city: 'Kigali' },
    22: { company_email: 'eastgatehotelkigali@gmail.com', company_telephone: '0785584664', company_city: 'Kigali' },
    23: { company_email: 'eastgatehotelkigali@gmail.com', company_telephone: '0785584664', company_city: 'Kigali' },
};

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

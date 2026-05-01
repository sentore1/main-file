export interface BankAccount {
    bank_name: string;
    account_number: string;
}

export interface ContactPerson {
    title: string;
    phone: string;
}

export interface WarehouseFooterDetails {
    main_bank: BankAccount;
    other_banks: BankAccount[];
    contacts: ContactPerson[];
    tin: string;
    email: string;
    website: string;
    youtube?: string;
}

// Common "Other Banks" for all branches
const commonOtherBanks: BankAccount[] = [
    { bank_name: 'I&M BANK/FRW', account_number: '20087994001' },
    { bank_name: 'BPR BANK/FRW', account_number: '4410630040' },
    { bank_name: 'EQUITY BANK/USD-EGH', account_number: '4035200050925' },
    { bank_name: 'EQUITY BANK/USD', account_number: '4035200052984' },
];

// Configure warehouse-specific footer details here
const warehouseFooterDetails: Record<number, WarehouseFooterDetails> = {
    // Kirehe branches (1, 10-14)
    1: { 
        main_bank: { bank_name: 'EQUITY BANK/FRW', account_number: '4035200050923' }, 
        other_banks: commonOtherBanks,
        contacts: [
            { title: 'Manager', phone: '0783861599' },
            { title: 'Reception', phone: '0782804340' }
        ],
        tin: '108229033',
        email: 'eastgatehotelkirehe@gmail.com',
        website: 'http://www.eastgatehotel.rw',
        youtube: 'EAST GATE HOTEL RWANDA'
    },
    10: { main_bank: { bank_name: 'EQUITY BANK/FRW', account_number: '4035200050923' }, other_banks: commonOtherBanks, contacts: [{ title: 'Manager', phone: '0783861599' }, { title: 'Reception', phone: '0782804340' }], tin: '108229033', email: 'eastgatehotelkirehe@gmail.com', website: 'http://www.eastgatehotel.rw', youtube: 'EAST GATE HOTEL RWANDA' },
    11: { main_bank: { bank_name: 'EQUITY BANK/FRW', account_number: '4035200050923' }, other_banks: commonOtherBanks, contacts: [{ title: 'Manager', phone: '0783861599' }, { title: 'Reception', phone: '0782804340' }], tin: '108229033', email: 'eastgatehotelkirehe@gmail.com', website: 'http://www.eastgatehotel.rw', youtube: 'EAST GATE HOTEL RWANDA' },
    12: { main_bank: { bank_name: 'EQUITY BANK/FRW', account_number: '4035200050923' }, other_banks: commonOtherBanks, contacts: [{ title: 'Manager', phone: '0783861599' }, { title: 'Reception', phone: '0782804340' }], tin: '108229033', email: 'eastgatehotelkirehe@gmail.com', website: 'http://www.eastgatehotel.rw', youtube: 'EAST GATE HOTEL RWANDA' },
    13: { main_bank: { bank_name: 'EQUITY BANK/FRW', account_number: '4035200050923' }, other_banks: commonOtherBanks, contacts: [{ title: 'Manager', phone: '0783861599' }, { title: 'Reception', phone: '0782804340' }], tin: '108229033', email: 'eastgatehotelkirehe@gmail.com', website: 'http://www.eastgatehotel.rw', youtube: 'EAST GATE HOTEL RWANDA' },
    14: { main_bank: { bank_name: 'EQUITY BANK/FRW', account_number: '4035200050923' }, other_banks: commonOtherBanks, contacts: [{ title: 'Manager', phone: '0783861599' }, { title: 'Reception', phone: '0782804340' }], tin: '108229033', email: 'eastgatehotelkirehe@gmail.com', website: 'http://www.eastgatehotel.rw', youtube: 'EAST GATE HOTEL RWANDA' },
    
    // Gatsibo branches (2, 15-19)
    2: { 
        main_bank: { bank_name: 'I&M BANK/FRW', account_number: '20087996001' }, 
        other_banks: commonOtherBanks,
        contacts: [
            { title: 'Manager', phone: '0785413360' },
            { title: 'Accountant', phone: '0785584664' },
            { title: 'Reception', phone: '0784822953' }
        ],
        tin: '108229033',
        email: 'eastgatehotelgatsibo@gmail.com',
        website: 'www.eastgatehotelrwanda.com',
        youtube: 'EAST GATE HOTEL RWANDA'
    },
    15: { main_bank: { bank_name: 'I&M BANK/FRW', account_number: '20087996001' }, other_banks: commonOtherBanks, contacts: [{ title: 'Manager', phone: '0785413360' }, { title: 'Accountant', phone: '0785584664' }, { title: 'Reception', phone: '0784822953' }], tin: '108229033', email: 'eastgatehotelgatsibo@gmail.com', website: 'www.eastgatehotelrwanda.com', youtube: 'EAST GATE HOTEL RWANDA' },
    16: { main_bank: { bank_name: 'I&M BANK/FRW', account_number: '20087996001' }, other_banks: commonOtherBanks, contacts: [{ title: 'Manager', phone: '0785413360' }, { title: 'Accountant', phone: '0785584664' }, { title: 'Reception', phone: '0784822953' }], tin: '108229033', email: 'eastgatehotelgatsibo@gmail.com', website: 'www.eastgatehotelrwanda.com', youtube: 'EAST GATE HOTEL RWANDA' },
    17: { main_bank: { bank_name: 'I&M BANK/FRW', account_number: '20087996001' }, other_banks: commonOtherBanks, contacts: [{ title: 'Manager', phone: '0785413360' }, { title: 'Accountant', phone: '0785584664' }, { title: 'Reception', phone: '0784822953' }], tin: '108229033', email: 'eastgatehotelgatsibo@gmail.com', website: 'www.eastgatehotelrwanda.com', youtube: 'EAST GATE HOTEL RWANDA' },
    18: { main_bank: { bank_name: 'I&M BANK/FRW', account_number: '20087996001' }, other_banks: commonOtherBanks, contacts: [{ title: 'Manager', phone: '0785413360' }, { title: 'Accountant', phone: '0785584664' }, { title: 'Reception', phone: '0784822953' }], tin: '108229033', email: 'eastgatehotelgatsibo@gmail.com', website: 'www.eastgatehotelrwanda.com', youtube: 'EAST GATE HOTEL RWANDA' },
    19: { main_bank: { bank_name: 'I&M BANK/FRW', account_number: '20087996001' }, other_banks: commonOtherBanks, contacts: [{ title: 'Manager', phone: '0785413360' }, { title: 'Accountant', phone: '0785584664' }, { title: 'Reception', phone: '0784822953' }], tin: '108229033', email: 'eastgatehotelgatsibo@gmail.com', website: 'www.eastgatehotelrwanda.com', youtube: 'EAST GATE HOTEL RWANDA' },
    
    // Ngoma branches (3, 5-9)
    3: { 
        main_bank: { bank_name: 'BPR BANK/FRW', account_number: '4493647590' }, 
        other_banks: commonOtherBanks,
        contacts: [
            { title: 'Manager', phone: '0787584969' },
            { title: 'Accountant', phone: '0783554653' },
            { title: 'Reception', phone: '0781431477' }
        ],
        tin: '108229033',
        email: 'eastgatehotel2020@gmail.com',
        website: 'www.eastgatehotelrwanda.com'
    },
    5: { main_bank: { bank_name: 'BPR BANK/FRW', account_number: '4493647590' }, other_banks: commonOtherBanks, contacts: [{ title: 'Manager', phone: '0787584969' }, { title: 'Accountant', phone: '0783554653' }, { title: 'Reception', phone: '0781431477' }], tin: '108229033', email: 'eastgatehotel2020@gmail.com', website: 'www.eastgatehotelrwanda.com' },
    6: { main_bank: { bank_name: 'BPR BANK/FRW', account_number: '4493647590' }, other_banks: commonOtherBanks, contacts: [{ title: 'Manager', phone: '0787584969' }, { title: 'Accountant', phone: '0783554653' }, { title: 'Reception', phone: '0781431477' }], tin: '108229033', email: 'eastgatehotel2020@gmail.com', website: 'www.eastgatehotelrwanda.com' },
    7: { main_bank: { bank_name: 'BPR BANK/FRW', account_number: '4493647590' }, other_banks: commonOtherBanks, contacts: [{ title: 'Manager', phone: '0787584969' }, { title: 'Accountant', phone: '0783554653' }, { title: 'Reception', phone: '0781431477' }], tin: '108229033', email: 'eastgatehotel2020@gmail.com', website: 'www.eastgatehotelrwanda.com' },
    8: { main_bank: { bank_name: 'BPR BANK/FRW', account_number: '4493647590' }, other_banks: commonOtherBanks, contacts: [{ title: 'Manager', phone: '0787584969' }, { title: 'Accountant', phone: '0783554653' }, { title: 'Reception', phone: '0781431477' }], tin: '108229033', email: 'eastgatehotel2020@gmail.com', website: 'www.eastgatehotelrwanda.com' },
    9: { main_bank: { bank_name: 'BPR BANK/FRW', account_number: '4493647590' }, other_banks: commonOtherBanks, contacts: [{ title: 'Manager', phone: '0787584969' }, { title: 'Accountant', phone: '0783554653' }, { title: 'Reception', phone: '0781431477' }], tin: '108229033', email: 'eastgatehotel2020@gmail.com', website: 'www.eastgatehotelrwanda.com' },
    
    // Kigali branches (4, 20-23)
    4: { 
        main_bank: { bank_name: 'I&M BANK/FRW', account_number: '20087996001' }, 
        other_banks: commonOtherBanks,
        contacts: [
            { title: 'Receptionist', phone: '+250788470070' },
            { title: 'Manager', phone: '+250785584664' }
        ],
        tin: '108229033',
        email: 'eastgatehotelkigali@gmail.com',
        website: 'www.eastgatehotel.rw',
        youtube: 'EAST GATE HOTEL RWANDA'
    },
    20: { main_bank: { bank_name: 'I&M BANK/FRW', account_number: '20087996001' }, other_banks: commonOtherBanks, contacts: [{ title: 'Receptionist', phone: '+250788470070' }, { title: 'Manager', phone: '+250785584664' }], tin: '108229033', email: 'eastgatehotelkigali@gmail.com', website: 'www.eastgatehotel.rw', youtube: 'EAST GATE HOTEL RWANDA' },
    21: { main_bank: { bank_name: 'I&M BANK/FRW', account_number: '20087996001' }, other_banks: commonOtherBanks, contacts: [{ title: 'Receptionist', phone: '+250788470070' }, { title: 'Manager', phone: '+250785584664' }], tin: '108229033', email: 'eastgatehotelkigali@gmail.com', website: 'www.eastgatehotel.rw', youtube: 'EAST GATE HOTEL RWANDA' },
    22: { main_bank: { bank_name: 'I&M BANK/FRW', account_number: '20087996001' }, other_banks: commonOtherBanks, contacts: [{ title: 'Receptionist', phone: '+250788470070' }, { title: 'Manager', phone: '+250785584664' }], tin: '108229033', email: 'eastgatehotelkigali@gmail.com', website: 'www.eastgatehotel.rw', youtube: 'EAST GATE HOTEL RWANDA' },
    23: { main_bank: { bank_name: 'I&M BANK/FRW', account_number: '20087996001' }, other_banks: commonOtherBanks, contacts: [{ title: 'Receptionist', phone: '+250788470070' }, { title: 'Manager', phone: '+250785584664' }], tin: '108229033', email: 'eastgatehotelkigali@gmail.com', website: 'www.eastgatehotel.rw', youtube: 'EAST GATE HOTEL RWANDA' },
};

export function getWarehouseFooterDetails(warehouseId?: number): WarehouseFooterDetails {
    if (warehouseId && warehouseFooterDetails[warehouseId]) {
        return warehouseFooterDetails[warehouseId];
    }
    
    // Return default (Kigali) footer details
    return {
        main_bank: { bank_name: 'I&M BANK/FRW', account_number: '20087996001' },
        other_banks: commonOtherBanks,
        contacts: [
            { title: 'Receptionist', phone: '+250788470070' },
            { title: 'Manager', phone: '+250785584664' }
        ],
        tin: '108229033',
        email: 'eastgatehotelkigali@gmail.com',
        website: 'www.eastgatehotel.rw',
        youtube: 'EAST GATE HOTEL RWANDA'
    };
}

export function getBranchName(warehouseId?: number): string {
    if (!warehouseId) return 'Kigali';
    
    if ([1, 10, 11, 12, 13, 14].includes(warehouseId)) return 'Kirehe';
    if ([2, 15, 16, 17, 18, 19].includes(warehouseId)) return 'Gatsibo';
    if ([3, 5, 6, 7, 8, 9].includes(warehouseId)) return 'Ngoma';
    
    return 'Kigali';
}

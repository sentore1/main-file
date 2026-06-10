import React, { useState } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, Calendar, Search } from 'lucide-react';
import { formatCurrency, formatDate, getCompanySetting, getImagePath } from '@/utils/helpers';
import AuthenticatedLayout from '@/layouts/authenticated-layout';
import html2pdf from 'html2pdf.js';

interface DepartmentSales {
    momo: number;
    credit: number;
    pos_bank: number;
    advance: number;
    cash: number;
    complementary: number;
    recovery: number;
    excedent: number;
    visacard: number;
    breakfast_room: number;
    total: number;
    transaction_count?: number;
    average_transaction?: number;
    items_sold?: number;
}

interface PaymentMethodData {
    amount: number;
    count: number;
    percentage: number;
}

interface Props {
    date: string;
    warehouseId?: number;
    warehouses: Array<{ id: number; name: string }>;
    openingBalance: {
        amount: number;
        source: string;
        note: string;
    };
    salesByDepartment: Record<string, DepartmentSales>;
    paymentMethodSummary: Record<string, PaymentMethodData>;
    totals: DepartmentSales & {
        transaction_count: number;
        cash_collected: number;
        electronic_payments: number;
    };
    purchases: {
        bar: { paid: number; credit: number };
        resto: { paid: number; credit: number };
        maintenance_office_reception: { paid: number; credit: number };
        cofe_shop: { paid: number; credit: number };
        sport_center: { paid: number; credit: number };
        house_keeping: { paid: number; credit: number };
        total_paid: number;
        total_credit: number;
        total: number;
    };
    otherExpenses: {
        paid: number;
        credit: number;
        total_paid: number;
        total_credit: number;
        total: number;
    };
    receivables?: {
        details: Array<any>;
        total: number;
        count: number;
        overdue: number;
    };
    payables?: {
        details: Array<any>;
        total: number;
        count: number;
        overdue: number;
    };
    comparisons?: {
        previous_day: {
            date: string;
            sales: number;
            difference: number;
            percentage: number;
        };
    };
    topPerformers?: {
        top_products: Array<any>;
    };
    cashFlow: {
        opening: number;
        cash_in: number;
        total_available: number;
        cash_out: number;
        closing: number;
    };
}

export default function DailyFinancial() {
    const { t } = useTranslation();
    const { 
        date, 
        warehouseId, 
        warehouses, 
        openingBalance,
        salesByDepartment, 
        paymentMethodSummary,
        totals, 
        purchases, 
        otherExpenses,
        receivables,
        payables,
        comparisons,
        topPerformers,
        cashFlow
    } = usePage<Props>().props;
    const [selectedDate, setSelectedDate] = useState(date);
    const [selectedWarehouse, setSelectedWarehouse] = useState(warehouseId?.toString() || 'all');
    const [searchQuery, setSearchQuery] = useState('');
    const [isDownloading, setIsDownloading] = useState(false);

    const handleSearch = () => {
        if (!searchQuery.trim()) return;
        
        // Find warehouse that matches search query
        const matchedWarehouse = warehouses.find(w => 
            w.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
        
        if (matchedWarehouse) {
            handleWarehouseChange(matchedWarehouse.id.toString());
            setSearchQuery(''); // Clear search after finding
        } else {
            alert(t('No branch found matching') + ': ' + searchQuery);
        }
    };

    const handleSearchKeyPress = (e: any) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    const logoUrl = getCompanySetting('logo_dark') || getCompanySetting('logo_light') || getCompanySetting('company_logo');
    const companyName = getCompanySetting('company_name') || 'EAST GATE HOTEL';

    const handleDateChange = (newDate: string) => {
        setSelectedDate(newDate);
        const params: any = { date: newDate };
        if (selectedWarehouse !== 'all') {
            params.warehouse_id = selectedWarehouse;
        }
        router.get(route('pos.reports.daily-financial'), params, {
            preserveState: true,
            replace: true
        });
    };

    const handleWarehouseChange = (newWarehouse: string) => {
        setSelectedWarehouse(newWarehouse);
        const params: any = { date: selectedDate };
        if (newWarehouse !== 'all') {
            params.warehouse_id = newWarehouse;
        }
        router.get(route('pos.reports.daily-financial'), params, {
            preserveState: true,
            replace: true
        });
    };

    const downloadPDF = async () => {
        setIsDownloading(true);

        const reportContent = document.querySelector('.report-container');
        if (reportContent) {
            const opt = {
                margin: 0.25,
                filename: `daily-financial-report-${date}.pdf`,
                image: { type: 'jpeg' as const, quality: 0.98 },
                html2canvas: { scale: 2 },
                jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' as const }
            };

            try {
                await html2pdf().set(opt).from(reportContent as HTMLElement).save();
            } catch (error) {
                console.error('PDF generation failed:', error);
            }
        }

        setIsDownloading(false);
    };

    const renderPaymentRow = (label: string, data: DepartmentSales) => (
        <React.Fragment>
            <tr className="border-b">
                <td className="px-3 py-1 font-semibold bg-gray-50" colSpan={2}>{label}</td>
                <td className="px-3 py-1 text-right">{formatCurrency(data.total)}</td>
            </tr>
            {data.momo > 0 && (
                <tr className="border-b">
                    <td className="px-3 py-1"></td>
                    <td className="px-3 py-1">MOMO</td>
                    <td className="px-3 py-1 text-right">{formatCurrency(data.momo)}</td>
                </tr>
            )}
            {data.credit > 0 && (
                <tr className="border-b">
                    <td className="px-3 py-1"></td>
                    <td className="px-3 py-1">CREDIT</td>
                    <td className="px-3 py-1 text-right">{formatCurrency(data.credit)}</td>
                </tr>
            )}
            {data.pos_bank > 0 && (
                <tr className="border-b">
                    <td className="px-3 py-1"></td>
                    <td className="px-3 py-1">POS BANK</td>
                    <td className="px-3 py-1 text-right">{formatCurrency(data.pos_bank)}</td>
                </tr>
            )}
            {data.advance > 0 && (
                <tr className="border-b">
                    <td className="px-3 py-1"></td>
                    <td className="px-3 py-1">ADVANCE</td>
                    <td className="px-3 py-1 text-right">{formatCurrency(data.advance)}</td>
                </tr>
            )}
            {data.cash > 0 && (
                <tr className="border-b">
                    <td className="px-3 py-1"></td>
                    <td className="px-3 py-1">CASH</td>
                    <td className="px-3 py-1 text-right">{formatCurrency(data.cash)}</td>
                </tr>
            )}
            {data.complementary > 0 && (
                <tr className="border-b">
                    <td className="px-3 py-1"></td>
                    <td className="px-3 py-1">COMPLEMENTARY</td>
                    <td className="px-3 py-1 text-right">{formatCurrency(data.complementary)}</td>
                </tr>
            )}
            {data.recovery > 0 && (
                <tr className="border-b">
                    <td className="px-3 py-1"></td>
                    <td className="px-3 py-1">RECOVERY</td>
                    <td className="px-3 py-1 text-right">{formatCurrency(data.recovery)}</td>
                </tr>
            )}
            {data.excedent > 0 && (
                <tr className="border-b">
                    <td className="px-3 py-1"></td>
                    <td className="px-3 py-1">EXCEDENT</td>
                    <td className="px-3 py-1 text-right">{formatCurrency(data.excedent)}</td>
                </tr>
            )}
            {data.visacard > 0 && (
                <tr className="border-b">
                    <td className="px-3 py-1"></td>
                    <td className="px-3 py-1">VISACARD</td>
                    <td className="px-3 py-1 text-right">{formatCurrency(data.visacard)}</td>
                </tr>
            )}
            {data.breakfast_room > 0 && (
                <tr className="border-b">
                    <td className="px-3 py-1"></td>
                    <td className="px-3 py-1">BREAKFAST ROOM</td>
                    <td className="px-3 py-1 text-right">{formatCurrency(data.breakfast_room)}</td>
                </tr>
            )}
        </React.Fragment>
    );

    return (
        <AuthenticatedLayout
            breadcrumbs={[
                { label: t('POS'), url: route('pos.index') },
                { label: t('Reports'), url: route('pos.reports.sales') },
                { label: t('Daily Financial Report') }
            ]}
            pageTitle={t('Daily Financial Report')}
            pageActions={
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                        <Input
                            type="text"
                            placeholder={t('Search branch...')}
                            value={searchQuery}
                            onChange={(e: any) => setSearchQuery(e.target.value)}
                            onKeyPress={handleSearchKeyPress}
                            className="w-48"
                        />
                        <Button 
                            onClick={handleSearch} 
                            variant="outline" 
                            size="sm"
                            disabled={!searchQuery.trim()}
                        >
                            <Search className="h-4 w-4" />
                        </Button>
                    </div>
                    <div className="flex items-center gap-2">
                        <label className="text-sm font-medium text-gray-700">{t('Branch')}:</label>
                        <select
                            value={selectedWarehouse}
                            onChange={(e: any) => handleWarehouseChange(e.target.value)}
                            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="all">{t('All Branches')}</option>
                            {warehouses.map((warehouse) => (
                                <option key={warehouse.id} value={warehouse.id}>
                                    {warehouse.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <Input
                            type="date"
                            value={selectedDate}
                            onChange={(e: any) => handleDateChange(e.target.value)}
                            className="w-auto"
                        />
                    </div>
                    <Button onClick={downloadPDF} disabled={isDownloading}>
                        <Download className="h-4 w-4 mr-2" />
                        {isDownloading ? t('Generating...') : t('Download PDF')}
                    </Button>
                </div>
            }
        >
            <Head title={t('Daily Financial Report')} />

            <Card>
                <CardContent className="p-6">
                    <div className="report-container bg-white">
                        {/* Header */}
                        <div className="text-center mb-6">
                            {logoUrl && (
                                <img src={getImagePath(logoUrl)} alt="Logo" className="mx-auto mb-3" style={{ height: '60px', width: 'auto', objectFit: 'contain' }} />
                            )}
                            <h1 className="text-2xl font-bold mb-1">{companyName}</h1>
                            <p className="text-sm text-gray-600 mb-2">TEL: {getCompanySetting('company_phone') || ''}</p>
                            {selectedWarehouse !== 'all' && (
                                <p className="text-sm font-semibold text-blue-600">
                                    {t('Branch')}: {warehouses.find(w => w.id.toString() === selectedWarehouse)?.name}
                                </p>
                            )}
                            <p className="text-sm font-semibold">DATE: {formatDate(date)}</p>
                            <h2 className="text-lg font-bold mt-2">DAILY FINANCIAL REPORT</h2>
                        </div>

                        {/* Sales Table */}
                        <table className="w-full border-collapse border border-gray-300 text-sm mb-4">
                            <thead>
                                <tr className="bg-gray-100">
                                    <th className="border border-gray-300 px-3 py-2 text-left">NO</th>
                                    <th className="border border-gray-300 px-3 py-2 text-left">DAILY FINANCIAL REPORT</th>
                                    <th className="border border-gray-300 px-3 py-2 text-right">AMOUNT</th>
                                </tr>
                            </thead>
                            <tbody>
                                {/* I. Opening Balance */}
                                <tr className="border-b bg-blue-50">
                                    <td className="px-3 py-2 font-semibold">I.</td>
                                    <td className="px-3 py-2 font-semibold">OPENING BALANCE</td>
                                    <td className="px-3 py-2 text-right font-semibold">{formatCurrency(openingBalance?.amount || 0)}</td>
                                </tr>
                                
                                {/* II. Sales Today */}
                                <tr className="border-b bg-green-50">
                                    <td className="px-3 py-2 font-semibold">II.</td>
                                    <td className="px-3 py-2 font-semibold">SALES TODAY</td>
                                    <td className="px-3 py-2 text-right font-semibold">{formatCurrency(totals.total)}</td>
                                </tr>
                                
                                {/* A. Sales by Department */}
                                <tr className="bg-gray-50">
                                    <td className="px-3 py-1"></td>
                                    <td className="px-3 py-1 font-semibold italic">A. Sales by Department</td>
                                    <td className="px-3 py-1"></td>
                                </tr>
                                
                                {/* Department Sales */}
                                {Object.entries(salesByDepartment).map(([dept, data], index) => (
                                    data.total > 0 && (
                                        <tr key={index} className="border-b">
                                            <td className="px-3 py-1"></td>
                                            <td className="px-3 py-1 pl-6">{dept}</td>
                                            <td className="px-3 py-1 text-right">{formatCurrency(data.total)}</td>
                                        </tr>
                                    )
                                ))}

                                {/* B. Payment Method Breakdown */}
                                <tr className="bg-gray-50 border-t-2">
                                    <td className="px-3 py-2"></td>
                                    <td className="px-3 py-2 font-semibold italic">B. Payment Method Breakdown (How Customers Paid)</td>
                                    <td className="px-3 py-2"></td>
                                </tr>
                                <tr className="bg-gray-100 text-xs">
                                    <td className="px-3 py-1"></td>
                                    <td className="px-3 py-1 font-semibold">Payment Method</td>
                                    <td className="px-3 py-1 text-right font-semibold"># Trans | Amount | %</td>
                                </tr>
                                
                                {paymentMethodSummary && Object.entries(paymentMethodSummary).map(([method, data], idx) => (
                                    data.amount > 0 && (
                                        <tr key={idx} className="border-b">
                                            <td className="px-3 py-1"></td>
                                            <td className="px-3 py-1 pl-6">
                                                {method === 'cash' && 'CASH'}
                                                {method === 'momo' && 'MOMO (Mobile Money)'}
                                                {method === 'pos_bank' && 'POS CARD'}
                                                {method === 'visacard' && 'VISACARD'}
                                                {method === 'credit' && 'ROOM CHARGES (Credit)'}
                                            </td>
                                            <td className="px-3 py-1 text-right text-xs">
                                                {data.count} trans | {formatCurrency(data.amount)} | {data.percentage.toFixed(1)}%
                                            </td>
                                        </tr>
                                    )
                                ))}
                                
                                <tr className="bg-blue-50 border-t-2">
                                    <td className="px-3 py-2"></td>
                                    <td className="px-3 py-2 font-semibold pl-6">TOTAL</td>
                                    <td className="px-3 py-2 text-right font-semibold">{totals.transaction_count || 0} trans | {formatCurrency(totals.total)}</td>
                                </tr>
                                
                                {/* Summary */}
                                <tr className="bg-green-50">
                                    <td className="px-3 py-1"></td>
                                    <td className="px-3 py-1 text-sm italic pl-6">Cash Collected: {formatCurrency(totals.cash_collected || totals.cash)}</td>
                                    <td className="px-3 py-1 text-right text-sm">(goes to register)</td>
                                </tr>
                                <tr className="bg-green-50">
                                    <td className="px-3 py-1"></td>
                                    <td className="px-3 py-1 text-sm italic pl-6">Electronic Payments: {formatCurrency(totals.electronic_payments || 0)}</td>
                                    <td className="px-3 py-1 text-right text-sm">(goes to bank)</td>
                                </tr>
                                <tr className="bg-yellow-50">
                                    <td className="px-3 py-1"></td>
                                    <td className="px-3 py-1 text-sm italic pl-6">Room Charges: {formatCurrency(totals.credit)}</td>
                                    <td className="px-3 py-1 text-right text-sm">(not yet collected)</td>
                                </tr>

                                {/* Purchases */}
                                <tr className="border-b bg-orange-50 border-t-2">
                                    <td className="px-3 py-2 font-semibold">III.</td>
                                    <td className="px-3 py-2 font-semibold">PURCHASES TODAY</td>
                                    <td className="px-3 py-2 text-right font-semibold">{formatCurrency(purchases.total)}</td>
                                </tr>
                                <tr className="bg-gray-100 text-xs">
                                    <td className="px-3 py-1"></td>
                                    <td className="px-3 py-1 font-semibold">Department</td>
                                    <td className="px-3 py-1 text-right font-semibold">Paid | Credit</td>
                                </tr>
                                {purchases.bar.paid + purchases.bar.credit > 0 && (
                                    <tr className="border-b">
                                        <td className="px-3 py-1"></td>
                                        <td className="px-3 py-1 pl-6">Bar</td>
                                        <td className="px-3 py-1 text-right text-xs">{formatCurrency(purchases.bar.paid)} | {formatCurrency(purchases.bar.credit)}</td>
                                    </tr>
                                )}
                                {purchases.resto.paid + purchases.resto.credit > 0 && (
                                    <tr className="border-b">
                                        <td className="px-3 py-1"></td>
                                        <td className="px-3 py-1 pl-6">Restaurant</td>
                                        <td className="px-3 py-1 text-right text-xs">{formatCurrency(purchases.resto.paid)} | {formatCurrency(purchases.resto.credit)}</td>
                                    </tr>
                                )}
                                {purchases.cofe_shop.paid + purchases.cofe_shop.credit > 0 && (
                                    <tr className="border-b">
                                        <td className="px-3 py-1"></td>
                                        <td className="px-3 py-1 pl-6">Coffee Shop</td>
                                        <td className="px-3 py-1 text-right text-xs">{formatCurrency(purchases.cofe_shop.paid)} | {formatCurrency(purchases.cofe_shop.credit)}</td>
                                    </tr>
                                )}
                                {purchases.house_keeping.paid + purchases.house_keeping.credit > 0 && (
                                    <tr className="border-b">
                                        <td className="px-3 py-1"></td>
                                        <td className="px-3 py-1 pl-6">Housekeeping</td>
                                        <td className="px-3 py-1 text-right text-xs">{formatCurrency(purchases.house_keeping.paid)} | {formatCurrency(purchases.house_keeping.credit)}</td>
                                    </tr>
                                )}
                                {purchases.maintenance_office_reception.paid + purchases.maintenance_office_reception.credit > 0 && (
                                    <tr className="border-b">
                                        <td className="px-3 py-1"></td>
                                        <td className="px-3 py-1 pl-6">Maintenance/Office</td>
                                        <td className="px-3 py-1 text-right text-xs">{formatCurrency(purchases.maintenance_office_reception.paid)} | {formatCurrency(purchases.maintenance_office_reception.credit)}</td>
                                    </tr>
                                )}
                                <tr className="bg-orange-100 font-semibold">
                                    <td className="px-3 py-2"></td>
                                    <td className="px-3 py-2">TOTAL PURCHASES</td>
                                    <td className="px-3 py-2 text-right">{formatCurrency(purchases.total_paid)} | {formatCurrency(purchases.total_credit)}</td>
                                </tr>

                                {/* Other Expenses */}
                                <tr className="border-b bg-red-50 border-t-2">
                                    <td className="px-3 py-2 font-semibold">IV.</td>
                                    <td className="px-3 py-2 font-semibold">OTHER EXPENSES TODAY</td>
                                    <td className="px-3 py-2 text-right font-semibold">{formatCurrency(otherExpenses.total)}</td>
                                </tr>
                                <tr className="border-b">
                                    <td className="px-3 py-1"></td>
                                    <td className="px-3 py-1 pl-6">Expenses Paid</td>
                                    <td className="px-3 py-1 text-right">{formatCurrency(otherExpenses.paid)}</td>
                                </tr>
                                <tr className="border-b">
                                    <td className="px-3 py-1"></td>
                                    <td className="px-3 py-1 pl-6">Credit Expenses</td>
                                    <td className="px-3 py-1 text-right">{formatCurrency(otherExpenses.credit)}</td>
                                </tr>

                                {/* Cash Flow Summary */}
                                <tr className="border-b bg-blue-50 border-t-2">
                                    <td className="px-3 py-2 font-semibold">V.</td>
                                    <td className="px-3 py-2 font-semibold">CASH FLOW SUMMARY</td>
                                    <td className="px-3 py-2"></td>
                                </tr>
                                <tr className="border-b">
                                    <td className="px-3 py-1"></td>
                                    <td className="px-3 py-1 pl-6">Opening Cash Balance</td>
                                    <td className="px-3 py-1 text-right">{formatCurrency(cashFlow.opening)}</td>
                                </tr>
                                <tr className="border-b">
                                    <td className="px-3 py-1"></td>
                                    <td className="px-3 py-1 pl-6">+ Cash Collected Today</td>
                                    <td className="px-3 py-1 text-right">{formatCurrency(cashFlow.cash_in)}</td>
                                </tr>
                                <tr className="bg-gray-100 font-semibold">
                                    <td className="px-3 py-1"></td>
                                    <td className="px-3 py-1 pl-6">= Total Cash Available</td>
                                    <td className="px-3 py-1 text-right">{formatCurrency(cashFlow.total_available)}</td>
                                </tr>
                                <tr className="border-b">
                                    <td className="px-3 py-1"></td>
                                    <td className="px-3 py-1 pl-6">- Purchases Paid (Cash)</td>
                                    <td className="px-3 py-1 text-right">{formatCurrency(purchases.total_paid)}</td>
                                </tr>
                                <tr className="border-b">
                                    <td className="px-3 py-1"></td>
                                    <td className="px-3 py-1 pl-6">- Expenses Paid (Cash)</td>
                                    <td className="px-3 py-1 text-right">{formatCurrency(otherExpenses.total_paid)}</td>
                                </tr>
                                <tr className="bg-blue-100 font-bold text-lg">
                                    <td className="px-3 py-2"></td>
                                    <td className="px-3 py-2 pl-6">= CLOSING CASH BALANCE</td>
                                    <td className="px-3 py-2 text-right">{formatCurrency(cashFlow.closing)}</td>
                                </tr>
                                <tr className="bg-yellow-50">
                                    <td className="px-3 py-2" colSpan={3}>
                                        <div className="text-center text-sm">
                                            <strong>VERIFICATION:</strong> Count cash in register. Should have <strong>{formatCurrency(cashFlow.closing)}</strong>
                                        </div>
                                    </td>
                                </tr>
                                
                                {/* Receivables (if available) */}
                                {receivables && receivables.total > 0 && (
                                    <>
                                        <tr className="border-b bg-green-50 border-t-2">
                                            <td className="px-3 py-2 font-semibold">VI.</td>
                                            <td className="px-3 py-2 font-semibold">ACCOUNTS RECEIVABLE (Who Owes Us)</td>
                                            <td className="px-3 py-2 text-right font-semibold">{formatCurrency(receivables.total)}</td>
                                        </tr>
                                        <tr className="border-b">
                                            <td className="px-3 py-1"></td>
                                            <td className="px-3 py-1 pl-6">Total Outstanding</td>
                                            <td className="px-3 py-1 text-right">{formatCurrency(receivables.total)}</td>
                                        </tr>
                                        <tr className="border-b">
                                            <td className="px-3 py-1"></td>
                                            <td className="px-3 py-1 pl-6">Number of Customers</td>
                                            <td className="px-3 py-1 text-right">{receivables.count}</td>
                                        </tr>
                                        {receivables.overdue > 0 && (
                                            <tr className="bg-red-50">
                                                <td className="px-3 py-1"></td>
                                                <td className="px-3 py-1 pl-6 text-red-600">Overdue (&gt;30 days)</td>
                                                <td className="px-3 py-1 text-right text-red-600 font-semibold">{formatCurrency(receivables.overdue)}</td>
                                            </tr>
                                        )}
                                    </>
                                )}
                                
                                {/* Payables (if available) */}
                                {payables && payables.total > 0 && (
                                    <>
                                        <tr className="border-b bg-red-50 border-t-2">
                                            <td className="px-3 py-2 font-semibold">VII.</td>
                                            <td className="px-3 py-2 font-semibold">ACCOUNTS PAYABLE (Who We Owe)</td>
                                            <td className="px-3 py-2 text-right font-semibold">{formatCurrency(payables.total)}</td>
                                        </tr>
                                        <tr className="border-b">
                                            <td className="px-3 py-1"></td>
                                            <td className="px-3 py-1 pl-6">Total Outstanding</td>
                                            <td className="px-3 py-1 text-right">{formatCurrency(payables.total)}</td>
                                        </tr>
                                        <tr className="border-b">
                                            <td className="px-3 py-1"></td>
                                            <td className="px-3 py-1 pl-6">Number of Suppliers</td>
                                            <td className="px-3 py-1 text-right">{payables.count}</td>
                                        </tr>
                                        {payables.overdue > 0 && (
                                            <tr className="bg-red-100">
                                                <td className="px-3 py-1"></td>
                                                <td className="px-3 py-1 pl-6 text-red-700">OVERDUE - PAY NOW!</td>
                                                <td className="px-3 py-1 text-right text-red-700 font-bold">{formatCurrency(payables.overdue)}</td>
                                            </tr>
                                        )}
                                    </>
                                )}
                                
                                {/* Performance Comparison (if available) */}
                                {comparisons && comparisons.previous_day && (
                                    <>
                                        <tr className="border-b bg-purple-50 border-t-2">
                                            <td className="px-3 py-2 font-semibold">VIII.</td>
                                            <td className="px-3 py-2 font-semibold">PERFORMANCE vs YESTERDAY</td>
                                            <td className="px-3 py-2"></td>
                                        </tr>
                                        <tr className="border-b">
                                            <td className="px-3 py-1"></td>
                                            <td className="px-3 py-1 pl-6">Yesterday's Sales</td>
                                            <td className="px-3 py-1 text-right">{formatCurrency(comparisons.previous_day.sales)}</td>
                                        </tr>
                                        <tr className="border-b">
                                            <td className="px-3 py-1"></td>
                                            <td className="px-3 py-1 pl-6">Today's Sales</td>
                                            <td className="px-3 py-1 text-right">{formatCurrency(totals.total)}</td>
                                        </tr>
                                        <tr className={comparisons.previous_day.difference >= 0 ? "bg-green-50" : "bg-red-50"}>
                                            <td className="px-3 py-1"></td>
                                            <td className="px-3 py-1 pl-6 font-semibold">
                                                {comparisons.previous_day.difference >= 0 ? 'Increase' : 'Decrease'}
                                            </td>
                                            <td className="px-3 py-1 text-right font-semibold">
                                                {comparisons.previous_day.difference >= 0 ? '+' : ''}{formatCurrency(comparisons.previous_day.difference)} ({comparisons.previous_day.percentage.toFixed(1)}%)
                                            </td>
                                        </tr>
                                    </>
                                )}
                                
                                {/* Top Products (if available) */}
                                {topPerformers && topPerformers.top_products && topPerformers.top_products.length > 0 && (
                                    <>
                                        <tr className="border-b bg-yellow-50 border-t-2">
                                            <td className="px-3 py-2 font-semibold" colSpan={3}>IX. TOP SELLING PRODUCTS TODAY</td>
                                        </tr>
                                        {topPerformers.top_products.slice(0, 5).map((product, idx) => (
                                            <tr key={idx} className="border-b">
                                                <td className="px-3 py-1"></td>
                                                <td className="px-3 py-1 pl-6 text-xs">
                                                    {idx + 1}. {product.name} ({product.quantity} sold)
                                                </td>
                                                <td className="px-3 py-1 text-right text-xs">{formatCurrency(product.revenue)}</td>
                                            </tr>
                                        ))}
                                    </>
                                )}
                            </tbody>
                        </table>

                        {/* Signatures */}
                        <div className="grid grid-cols-2 gap-8 mt-8">
                            <div>
                                <p className="font-semibold mb-2">PREPARED BY:</p>
                                <p className="text-sm">NAMES: ___________________</p>
                                <p className="text-sm">POSITION: ACCOUNTANT</p>
                                <p className="text-sm mt-4">Signature: ___________________</p>
                            </div>
                            <div>
                                <p className="font-semibold mb-2">APPROVED BY:</p>
                                <p className="text-sm">NAMES: ___________________</p>
                                <p className="text-sm">POSITION: OPERATION</p>
                                <p className="text-sm mt-4">Signature: ___________________</p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </AuthenticatedLayout>
    );
}

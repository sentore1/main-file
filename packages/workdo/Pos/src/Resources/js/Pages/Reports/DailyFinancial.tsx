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
}

interface Props {
    date: string;
    warehouseId?: number;
    warehouses: Array<{ id: number; name: string }>;
    salesByDepartment: Record<string, DepartmentSales>;
    totals: DepartmentSales;
    cashDeposit: {
        momo_from_md: number;
        advance_from_sport_center: number;
        cash_collection: number;
        recovery: number;
        total: number;
    };
    purchases: {
        bar: { paid: number; credit: number };
        resto: { paid: number; credit: number };
        maintenance_office_reception: { paid: number; credit: number };
        cofe_shop: { paid: number; credit: number };
        sport_center: { paid: number; credit: number };
        house_keeping: { paid: number; credit: number };
        total: number;
    };
    otherExpenses: {
        paid: number;
        credit: number;
        total: number;
    };
    closingBalance: number;
}

export default function DailyFinancial() {
    const { t } = useTranslation();
    const { date, warehouseId, warehouses, salesByDepartment, totals, cashDeposit, purchases, otherExpenses, closingBalance } = usePage<Props>().props;
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
                                <tr className="border-b">
                                    <td className="px-3 py-1 font-semibold">I.</td>
                                    <td className="px-3 py-1 font-semibold">OPENING BALANCE ON (+)</td>
                                    <td className="px-3 py-1 text-right">-</td>
                                </tr>
                                <tr className="border-b">
                                    <td className="px-3 py-1 font-semibold">II.</td>
                                    <td className="px-3 py-1 font-semibold">OPENING CREDIT(+)</td>
                                    <td className="px-3 py-1 text-right">-</td>
                                </tr>
                                <tr className="border-b">
                                    <td className="px-3 py-1 font-semibold">III.</td>
                                    <td className="px-3 py-1 font-semibold">SALES</td>
                                    <td className="px-3 py-1 text-right font-semibold">{formatCurrency(totals.total)}</td>
                                </tr>
                                
                                {/* Department Sales */}
                                {Object.entries(salesByDepartment).map(([dept, data], index) => (
                                    data.total > 0 && renderPaymentRow(dept, data)
                                ))}

                                {/* Totals */}
                                <tr className="bg-gray-100 font-bold border-b">
                                    <td className="px-3 py-2"></td>
                                    <td className="px-3 py-2">TOTAL SALES</td>
                                    <td className="px-3 py-2 text-right">{formatCurrency(totals.total)}</td>
                                </tr>
                                <tr className="bg-gray-100 font-bold border-b">
                                    <td className="px-3 py-2"></td>
                                    <td className="px-3 py-2">TOTAL MOMO SALES</td>
                                    <td className="px-3 py-2 text-right">{formatCurrency(totals.momo)}</td>
                                </tr>
                                <tr className="bg-gray-100 font-bold border-b">
                                    <td className="px-3 py-2"></td>
                                    <td className="px-3 py-2">TOTAL CREDIT</td>
                                    <td className="px-3 py-2 text-right">{formatCurrency(totals.credit)}</td>
                                </tr>
                                <tr className="bg-gray-100 font-bold border-b">
                                    <td className="px-3 py-2"></td>
                                    <td className="px-3 py-2">ADVANCE</td>
                                    <td className="px-3 py-2 text-right">{formatCurrency(totals.advance)}</td>
                                </tr>
                                <tr className="bg-gray-100 font-bold border-b">
                                    <td className="px-3 py-2"></td>
                                    <td className="px-3 py-2">RECOVERY</td>
                                    <td className="px-3 py-2 text-right">{formatCurrency(totals.recovery)}</td>
                                </tr>
                                <tr className="bg-gray-100 font-bold border-b">
                                    <td className="px-3 py-2"></td>
                                    <td className="px-3 py-2">EXCEDENT</td>
                                    <td className="px-3 py-2 text-right">{formatCurrency(totals.excedent)}</td>
                                </tr>
                                <tr className="bg-gray-100 font-bold border-b">
                                    <td className="px-3 py-2"></td>
                                    <td className="px-3 py-2">VISACARD</td>
                                    <td className="px-3 py-2 text-right">{formatCurrency(totals.visacard)}</td>
                                </tr>
                                <tr className="bg-gray-100 font-bold border-b">
                                    <td className="px-3 py-2"></td>
                                    <td className="px-3 py-2">POS</td>
                                    <td className="px-3 py-2 text-right">{formatCurrency(totals.pos_bank)}</td>
                                </tr>
                                <tr className="bg-gray-100 font-bold border-b">
                                    <td className="px-3 py-2"></td>
                                    <td className="px-3 py-2">COMPLEMENTARY</td>
                                    <td className="px-3 py-2 text-right">{formatCurrency(totals.complementary)}</td>
                                </tr>
                                <tr className="bg-gray-100 font-bold border-b">
                                    <td className="px-3 py-2"></td>
                                    <td className="px-3 py-2">BREAKFAST ROOM</td>
                                    <td className="px-3 py-2 text-right">{formatCurrency(totals.breakfast_room)}</td>
                                </tr>
                                <tr className="bg-gray-100 font-bold border-b">
                                    <td className="px-3 py-2"></td>
                                    <td className="px-3 py-2">TOTAL CASH SALES</td>
                                    <td className="px-3 py-2 text-right">{formatCurrency(totals.cash)}</td>
                                </tr>

                                {/* Cash Deposit */}
                                <tr className="border-b">
                                    <td className="px-3 py-1 font-semibold">IV.</td>
                                    <td className="px-3 py-1 font-semibold">CASH DEPOSIT</td>
                                    <td className="px-3 py-1 text-right font-semibold">{formatCurrency(cashDeposit.total)}</td>
                                </tr>
                                <tr className="border-b">
                                    <td className="px-3 py-1"></td>
                                    <td className="px-3 py-1">MOMO FROM MD</td>
                                    <td className="px-3 py-1 text-right">{formatCurrency(cashDeposit.momo_from_md)}</td>
                                </tr>
                                <tr className="border-b">
                                    <td className="px-3 py-1"></td>
                                    <td className="px-3 py-1">ADVANCE FROM SPORT CENTER</td>
                                    <td className="px-3 py-1 text-right">{formatCurrency(cashDeposit.advance_from_sport_center)}</td>
                                </tr>
                                <tr className="border-b">
                                    <td className="px-3 py-1"></td>
                                    <td className="px-3 py-1">CASH COLLECTION</td>
                                    <td className="px-3 py-1 text-right">{formatCurrency(cashDeposit.cash_collection)}</td>
                                </tr>
                                <tr className="border-b">
                                    <td className="px-3 py-1"></td>
                                    <td className="px-3 py-1">RECOVERY</td>
                                    <td className="px-3 py-1 text-right">{formatCurrency(cashDeposit.recovery)}</td>
                                </tr>
                                <tr className="bg-gray-100 font-bold border-b">
                                    <td className="px-3 py-2"></td>
                                    <td className="px-3 py-2">Total cash Deposit</td>
                                    <td className="px-3 py-2 text-right">{formatCurrency(cashDeposit.total)}</td>
                                </tr>
                                <tr className="bg-gray-100 font-bold border-b">
                                    <td className="px-3 py-2"></td>
                                    <td className="px-3 py-2">TOTAL Cash Available (opening bal +cash sales +cash deposit)</td>
                                    <td className="px-3 py-2 text-right">{formatCurrency(totals.cash + cashDeposit.total)}</td>
                                </tr>

                                {/* Purchases */}
                                <tr className="border-b">
                                    <td className="px-3 py-1 font-semibold">V.</td>
                                    <td className="px-3 py-1 font-semibold">Purchases</td>
                                    <td className="px-3 py-1 text-right"></td>
                                </tr>
                                <tr className="border-b">
                                    <td className="px-3 py-1"></td>
                                    <td className="px-3 py-1">Bar</td>
                                    <td className="px-3 py-1 text-right"></td>
                                </tr>
                                <tr className="border-b">
                                    <td className="px-3 py-1"></td>
                                    <td className="px-3 py-1 pl-6">Purchases Paid</td>
                                    <td className="px-3 py-1 text-right">{formatCurrency(purchases.bar.paid)}</td>
                                </tr>
                                <tr className="border-b">
                                    <td className="px-3 py-1"></td>
                                    <td className="px-3 py-1 pl-6">Credit Purchases</td>
                                    <td className="px-3 py-1 text-right">{formatCurrency(purchases.bar.credit)}</td>
                                </tr>
                                <tr className="border-b">
                                    <td className="px-3 py-1"></td>
                                    <td className="px-3 py-1 pl-6">sub-Total</td>
                                    <td className="px-3 py-1 text-right">{formatCurrency(purchases.bar.paid)}</td>
                                </tr>
                                <tr className="border-b">
                                    <td className="px-3 py-1"></td>
                                    <td className="px-3 py-1">Resto</td>
                                    <td className="px-3 py-1 text-right"></td>
                                </tr>
                                <tr className="border-b">
                                    <td className="px-3 py-1"></td>
                                    <td className="px-3 py-1 pl-6">Purchases Paid</td>
                                    <td className="px-3 py-1 text-right">{formatCurrency(purchases.resto.paid)}</td>
                                </tr>
                                <tr className="border-b">
                                    <td className="px-3 py-1"></td>
                                    <td className="px-3 py-1 pl-6">Credit Purchases</td>
                                    <td className="px-3 py-1 text-right">{formatCurrency(purchases.resto.credit)}</td>
                                </tr>
                                <tr className="border-b">
                                    <td className="px-3 py-1"></td>
                                    <td className="px-3 py-1 pl-6">sub-Total</td>
                                    <td className="px-3 py-1 text-right">{formatCurrency(purchases.resto.paid)}</td>
                                </tr>
                                <tr className="bg-gray-100 font-bold border-b">
                                    <td className="px-3 py-2"></td>
                                    <td className="px-3 py-2">Total Purchases Paid</td>
                                    <td className="px-3 py-2 text-right">{formatCurrency(purchases.total)}</td>
                                </tr>

                                {/* Other Expenses */}
                                <tr className="border-b">
                                    <td className="px-3 py-1 font-semibold">VI.</td>
                                    <td className="px-3 py-1 font-semibold">OTHER EXPENSES(breakdown)</td>
                                    <td className="px-3 py-1 text-right"></td>
                                </tr>
                                <tr className="border-b">
                                    <td className="px-3 py-1"></td>
                                    <td className="px-3 py-1">Other expenses Paid</td>
                                    <td className="px-3 py-1 text-right">{formatCurrency(otherExpenses.paid)}</td>
                                </tr>
                                <tr className="border-b">
                                    <td className="px-3 py-1"></td>
                                    <td className="px-3 py-1">Credit Purchases</td>
                                    <td className="px-3 py-1 text-right">{formatCurrency(otherExpenses.credit)}</td>
                                </tr>
                                <tr className="bg-gray-100 font-bold border-b">
                                    <td className="px-3 py-2"></td>
                                    <td className="px-3 py-2">Total Other expenses</td>
                                    <td className="px-3 py-2 text-right">{formatCurrency(otherExpenses.total)}</td>
                                </tr>

                                {/* Closing Balance */}
                                <tr className="bg-blue-100 font-bold border-b">
                                    <td className="px-3 py-2"></td>
                                    <td className="px-3 py-2">Closing balance of Cash ( Total cash availables-Total Purchases paid-total other expenses paid</td>
                                    <td className="px-3 py-2 text-right">{formatCurrency(closingBalance)}</td>
                                </tr>
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

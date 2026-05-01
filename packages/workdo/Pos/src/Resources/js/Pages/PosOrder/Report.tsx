import React, { useEffect, useState } from 'react';
import { Head, usePage } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import html2pdf from 'html2pdf.js';
import { formatCurrency, formatDate, getCompanySetting, getImagePath } from '@/utils/helpers';

interface PosSale {
    id: number;
    sale_number: string;
    customer?: {
        name: string;
    };
    warehouse?: {
        name: string;
    };
    status: string;
    total: number;
    paid_amount: number;
    balance_due: number;
    pos_date: string;
}

interface ReportProps {
    sales: PosSale[];
    filters: any;
    [key: string]: any;
}

export default function Report() {
    const { t } = useTranslation();
    const { sales, filters } = usePage<ReportProps>().props;
    const [isDownloading, setIsDownloading] = useState(false);

    const logoUrl = getCompanySetting('logo_dark') || getCompanySetting('logo_light') || getCompanySetting('company_logo');

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('download') === 'pdf') {
            downloadPDF();
        }
    }, []);

    const downloadPDF = async () => {
        setIsDownloading(true);

        const reportContent = document.querySelector('.report-container');
        if (reportContent) {
            const opt = {
                margin: 0.25,
                filename: `pos-orders-report-${new Date().toISOString().split('T')[0]}.pdf`,
                image: { type: 'jpeg' as const, quality: 0.98 },
                html2canvas: { scale: 2 },
                jsPDF: { unit: 'in', format: 'a4', orientation: 'landscape' as const }
            };

            try {
                await html2pdf().set(opt).from(reportContent as HTMLElement).save();
                setTimeout(() => window.close(), 1000);
            } catch (error) {
                console.error('PDF generation failed:', error);
            }
        }

        setIsDownloading(false);
    };

    const totalAmount = sales.reduce((sum, sale) => sum + (Number(sale.total) || 0), 0);
    const totalPaid = sales.reduce((sum, sale) => sum + (Number(sale.paid_amount) || 0), 0);
    const totalBalance = sales.reduce((sum, sale) => sum + (Number(sale.balance_due) || 0), 0);

    return (
        <div className="min-h-screen bg-white">
            <Head title={t('POS Orders Report')} />

            {isDownloading && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-lg">
                        <div className="flex items-center space-x-3">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                            <p className="text-lg font-semibold text-gray-700">{t('Generating PDF...')}</p>
                        </div>
                    </div>
                </div>
            )}

            <div className="report-container bg-white max-w-7xl mx-auto p-8">
                <div className="text-center mb-8">
                    {logoUrl && (
                        <img src={getImagePath(logoUrl)} alt="Logo" className="mx-auto mb-4" style={{ height: '80px', width: 'auto', objectFit: 'contain' }} />
                    )}
                    <h1 className="text-3xl font-bold mb-2">{t('POS Orders Report')}</h1>
                    <p className="text-gray-600">{t('Generated on')}: {formatDate(new Date().toISOString())}</p>
                    {filters.date_range && (
                        <p className="text-gray-600 mt-1">{t('Period')}: {filters.date_range}</p>
                    )}
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-gray-300">
                        <thead>
                            <tr className="bg-gray-100">
                                <th className="border border-gray-300 px-4 py-2 text-left">{t('Sale #')}</th>
                                <th className="border border-gray-300 px-4 py-2 text-left">{t('Customer')}</th>
                                <th className="border border-gray-300 px-4 py-2 text-left">{t('Warehouse')}</th>
                                <th className="border border-gray-300 px-4 py-2 text-left">{t('Date')}</th>
                                <th className="border border-gray-300 px-4 py-2 text-right">{t('Total')}</th>
                                <th className="border border-gray-300 px-4 py-2 text-right">{t('Paid')}</th>
                                <th className="border border-gray-300 px-4 py-2 text-right">{t('Balance')}</th>
                                <th className="border border-gray-300 px-4 py-2 text-center">{t('Status')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sales.map((sale) => (
                                <tr key={sale.id}>
                                    <td className="border border-gray-300 px-4 py-2">{sale.sale_number}</td>
                                    <td className="border border-gray-300 px-4 py-2">{sale.customer?.name || t('Walk-in Customer')}</td>
                                    <td className="border border-gray-300 px-4 py-2">{sale.warehouse?.name || '-'}</td>
                                    <td className="border border-gray-300 px-4 py-2">{formatDate(sale.pos_date)}</td>
                                    <td className="border border-gray-300 px-4 py-2 text-right">{formatCurrency(sale.total)}</td>
                                    <td className="border border-gray-300 px-4 py-2 text-right">{formatCurrency(sale.paid_amount)}</td>
                                    <td className="border border-gray-300 px-4 py-2 text-right">{formatCurrency(sale.balance_due)}</td>
                                    <td className="border border-gray-300 px-4 py-2 text-center capitalize">{sale.status}</td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr className="bg-gray-100 font-bold">
                                <td colSpan={4} className="border border-gray-300 px-4 py-2 text-right">{t('Total')}:</td>
                                <td className="border border-gray-300 px-4 py-2 text-right">{formatCurrency(totalAmount)}</td>
                                <td className="border border-gray-300 px-4 py-2 text-right">{formatCurrency(totalPaid)}</td>
                                <td className="border border-gray-300 px-4 py-2 text-right">{formatCurrency(totalBalance)}</td>
                                <td className="border border-gray-300 px-4 py-2"></td>
                            </tr>
                        </tfoot>
                    </table>
                </div>

                <div className="mt-8 text-sm text-gray-600">
                    <p>{t('Total Orders')}: {sales.length}</p>
                </div>
            </div>
        </div>
    );
}

import React, { useEffect, useState } from 'react';
import { Head, usePage } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import html2pdf from 'html2pdf.js';
import { formatCurrency, formatDate, getCompanySetting, getImagePath } from '@/utils/helpers';

interface StockRequisitionItem {
    id: number;
    product_id: number;
    quantity_requested: string;
    quantity_approved: string | null;
    quantity_fulfilled: string;
    notes: string | null;
    product?: {
        id: number;
        name: string;
        sku: string;
        unit: string;
    };
}

interface StockRequisition {
    id: number;
    requisition_number: string;
    requisition_date: string;
    required_date: string;
    status: string;
    priority: string;
    department: string;
    purpose: string;
    notes: string | null;
    warehouse_id: number;
    warehouse?: {
        id: number;
        name: string;
        address: string;
        city: string;
        phone: string;
    };
    requested_by_user?: {
        id: number;
        name: string;
        email: string;
    };
    approved_by_user?: {
        id: number;
        name: string;
    };
    approved_at: string | null;
    fulfilled_by_user?: {
        id: number;
        name: string;
    };
    fulfilled_at: string | null;
    items: StockRequisitionItem[];
}

interface PrintProps {
    requisition: StockRequisition;
}

export default function Print() {
    const { t } = useTranslation();
    const { requisition } = usePage<PrintProps>().props;
    const [isDownloading, setIsDownloading] = useState(false);

    // Get logo from brand settings
    const logoUrl = getCompanySetting('logo_dark') || getCompanySetting('logo_light') || getCompanySetting('company_logo');
    const companyName = getCompanySetting('company_name') || 'East Gate Hotel';
    const companyAddress = getCompanySetting('company_address');
    const companyPhone = getCompanySetting('company_telephone');
    const companyEmail = getCompanySetting('company_email');

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('download') === 'pdf') {
            downloadPDF();
        } else {
            // Auto-trigger print dialog
            window.print();
        }
    }, []);

    const downloadPDF = async () => {
        setIsDownloading(true);

        const printContent = document.querySelector('.requisition-container');
        if (printContent) {
            const opt = {
                margin: 0.25,
                filename: `stock-requisition-${requisition.requisition_number}.pdf`,
                image: { type: 'jpeg' as const, quality: 0.98 },
                html2canvas: { scale: 2 },
                jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' as const }
            };

            try {
                await html2pdf().set(opt).from(printContent as HTMLElement).save();
                setTimeout(() => window.close(), 1000);
            } catch (error) {
                console.error('PDF generation failed:', error);
            }
        }

        setIsDownloading(false);
    };

    const getStatusBadge = (status: string) => {
        const statusColors: Record<string, string> = {
            draft: 'bg-gray-100 text-gray-800',
            pending: 'bg-yellow-100 text-yellow-800',
            approved: 'bg-green-100 text-green-800',
            rejected: 'bg-red-100 text-red-800',
            fulfilled: 'bg-blue-100 text-blue-800',
            cancelled: 'bg-gray-100 text-gray-800',
        };
        return statusColors[status] || 'bg-gray-100 text-gray-800';
    };

    const getPriorityBadge = (priority: string) => {
        const priorityColors: Record<string, string> = {
            low: 'bg-blue-100 text-blue-800',
            normal: 'bg-gray-100 text-gray-800',
            high: 'bg-orange-100 text-orange-800',
            urgent: 'bg-red-100 text-red-800',
        };
        return priorityColors[priority] || 'bg-gray-100 text-gray-800';
    };

    return (
        <div className="min-h-screen bg-white">
            <Head title={t('Stock Requisition')} />

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

            <div className="requisition-container bg-white max-w-4xl mx-auto p-12">
                {/* Header */}
                <div className="flex justify-between items-start mb-12">
                    <div className="w-1/2">
                        {logoUrl ? (
                            <img 
                                src={getImagePath(logoUrl)} 
                                alt="Logo" 
                                className="mb-4" 
                                style={{ height: '120px', width: 'auto', objectFit: 'contain' }} 
                            />
                        ) : (
                            <h1 className="text-2xl font-bold mb-4">{companyName}</h1>
                        )}
                        <div className="text-sm space-y-1">
                            {companyAddress && <p>{companyAddress}</p>}
                            {companyPhone && <p>{t('Phone')}: {companyPhone}</p>}
                            {companyEmail && <p>{t('Email')}: {companyEmail}</p>}
                        </div>
                    </div>
                    <div className="text-right w-1/2">
                        <h2 className="text-2xl font-bold mb-2">{t('STOCK REQUISITION')}</h2>
                        <p className="text-lg font-semibold">#{requisition.requisition_number}</p>
                        <div className="text-sm mt-2 space-y-1">
                            <p>{t('Date')}: {formatDate(requisition.requisition_date)}</p>
                            <p>{t('Required Date')}: {formatDate(requisition.required_date)}</p>
                            <div className="mt-2">
                                <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${getStatusBadge(requisition.status)}`}>
                                    {requisition.status.toUpperCase()}
                                </span>
                                <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ml-2 ${getPriorityBadge(requisition.priority)}`}>
                                    {requisition.priority.toUpperCase()}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Requisition Details */}
                <div className="grid grid-cols-2 gap-8 mb-12">
                    <div>
                        <h3 className="font-bold mb-3">{t('REQUESTED BY')}</h3>
                        <div className="text-sm space-y-1">
                            <p className="font-semibold">{requisition.requested_by_user?.name}</p>
                            <p>{requisition.requested_by_user?.email}</p>
                            <p className="mt-2"><strong>{t('Department')}:</strong> {requisition.department}</p>
                        </div>
                    </div>
                    <div>
                        <h3 className="font-bold mb-3">{t('WAREHOUSE')}</h3>
                        <div className="text-sm space-y-1">
                            <p className="font-semibold">{requisition.warehouse?.name}</p>
                            {requisition.warehouse?.address && <p>{requisition.warehouse.address}</p>}
                            {requisition.warehouse?.city && <p>{requisition.warehouse.city}</p>}
                            {requisition.warehouse?.phone && <p>{t('Phone')}: {requisition.warehouse.phone}</p>}
                        </div>
                    </div>
                </div>

                {/* Purpose */}
                {requisition.purpose && (
                    <div className="mb-8">
                        <h3 className="font-bold mb-2">{t('PURPOSE')}</h3>
                        <p className="text-sm">{requisition.purpose}</p>
                    </div>
                )}

                {/* Items Table */}
                <div className="mb-8">
                    <table className="w-full table-fixed">
                        <thead>
                            <tr className="border-b-2 border-gray-300">
                                <th className="text-left py-3 font-bold">{t('ITEM')}</th>
                                <th className="text-center py-3 font-bold">{t('REQUESTED')}</th>
                                {requisition.status === 'approved' && (
                                    <th className="text-center py-3 font-bold">{t('APPROVED')}</th>
                                )}
                                {requisition.status === 'fulfilled' && (
                                    <th className="text-center py-3 font-bold">{t('FULFILLED')}</th>
                                )}
                                <th className="text-left py-3 font-bold">{t('NOTES')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {requisition.items?.map((item, index) => (
                                <tr key={index} className="border-b border-gray-200 page-break-inside-avoid">
                                    <td className="py-4">
                                        <div className="font-semibold">{item.product?.name}</div>
                                        {item.product?.sku && (
                                            <div className="text-xs text-gray-500">{t('SKU')}: {item.product.sku}</div>
                                        )}
                                    </td>
                                    <td className="text-center py-4">
                                        {item.quantity_requested} {item.product?.unit}
                                    </td>
                                    {requisition.status === 'approved' && (
                                        <td className="text-center py-4">
                                            {item.quantity_approved || '-'} {item.quantity_approved ? item.product?.unit : ''}
                                        </td>
                                    )}
                                    {requisition.status === 'fulfilled' && (
                                        <td className="text-center py-4">
                                            {item.quantity_fulfilled} {item.product?.unit}
                                        </td>
                                    )}
                                    <td className="py-4 text-sm">{item.notes || '-'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Notes */}
                {requisition.notes && (
                    <div className="mb-8">
                        <h3 className="font-bold mb-2">{t('NOTES')}</h3>
                        <p className="text-sm">{requisition.notes}</p>
                    </div>
                )}

                {/* Approval/Fulfillment Info */}
                {(requisition.approved_by_user || requisition.fulfilled_by_user) && (
                    <div className="border-t border-gray-300 pt-6 mt-8">
                        <div className="grid grid-cols-2 gap-8">
                            {requisition.approved_by_user && (
                                <div>
                                    <h3 className="font-bold mb-2">{t('APPROVED BY')}</h3>
                                    <p className="text-sm">{requisition.approved_by_user.name}</p>
                                    <p className="text-xs text-gray-500">{formatDate(requisition.approved_at!)}</p>
                                </div>
                            )}
                            {requisition.fulfilled_by_user && (
                                <div>
                                    <h3 className="font-bold mb-2">{t('FULFILLED BY')}</h3>
                                    <p className="text-sm">{requisition.fulfilled_by_user.name}</p>
                                    <p className="text-xs text-gray-500">{formatDate(requisition.fulfilled_at!)}</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Signatures */}
                <div className="mt-12 pt-8 border-t border-gray-300">
                    <div className="grid grid-cols-3 gap-8">
                        <div className="text-center">
                            <div className="border-t border-gray-400 pt-2 mt-16">
                                <p className="text-sm font-semibold">{t('Requested By')}</p>
                            </div>
                        </div>
                        <div className="text-center">
                            <div className="border-t border-gray-400 pt-2 mt-16">
                                <p className="text-sm font-semibold">{t('Approved By')}</p>
                            </div>
                        </div>
                        <div className="text-center">
                            <div className="border-t border-gray-400 pt-2 mt-16">
                                <p className="text-sm font-semibold">{t('Received By')}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                body {
                    -webkit-print-color-adjust: exact;
                    color-adjust: exact;
                    font-family: Arial, sans-serif;
                }

                @page {
                    margin: 0.2in;
                    size: A4;
                }

                .requisition-container {
                    max-width: 100%;
                    margin: 0;
                    box-shadow: none;
                    padding: 0.5rem !important;
                }

                .page-break-inside-avoid {
                    page-break-inside: avoid;
                    break-inside: avoid;
                }

                @media print {
                    body {
                        background: white;
                    }

                    .requisition-container {
                        box-shadow: none;
                        padding: 0.5rem !important;
                    }
                    
                    .mt-8 {
                        margin-top: 1rem !important;
                    }
                    
                    .mb-8 {
                        margin-bottom: 1rem !important;
                    }
                    
                    .mb-12 {
                        margin-bottom: 1rem !important;
                    }
                }
            `}</style>
        </div>
    );
}

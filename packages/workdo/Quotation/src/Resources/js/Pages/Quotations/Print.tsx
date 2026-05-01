import React, { useEffect, useState } from 'react';
import { Head, usePage } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import html2pdf from 'html2pdf.js';
import { formatCurrency, formatDate, getCompanySetting, getImagePath } from '@/utils/helpers';
import { getWarehouseHeader } from '@/utils/warehouseHeaders';
import { getWarehouseFooterDetails, getBranchName, BankAccount, ContactPerson } from '@/utils/warehouseBankDetails';
import { Quotation } from './types';

interface PrintProps {
    quotation: Quotation;
    [key: string]: any;
}

export default function Print() {
    const { t } = useTranslation();
    const { quotation } = usePage<PrintProps>().props;
    const [isDownloading, setIsDownloading] = useState(false);

    const header = getWarehouseHeader(quotation.warehouse_id);
    const footerDetails = getWarehouseFooterDetails(quotation.warehouse_id);
    const branchName = getBranchName(quotation.warehouse_id);

    // Get logo from brand settings
    const logoUrl = getCompanySetting('logo_dark') || getCompanySetting('logo_light') || getCompanySetting('company_logo');

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('download') === 'pdf') {
            downloadPDF();
        }
    }, []);

    const downloadPDF = async () => {
        setIsDownloading(true);

        const printContent = document.querySelector('.quotation-container');
        if (printContent) {
            const opt = {
                margin: 0.25,
                filename: `quotation-${quotation.quotation_number}.pdf`,
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

    return (
        <div className="min-h-screen bg-white">
            <Head title={t('Quotation')} />

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

            <div className="quotation-container bg-white max-w-4xl mx-auto p-12">
                <div className="flex justify-between items-start mb-12">
                    <div className="w-1/2">
                        {logoUrl ? (
                            <img src={getImagePath(logoUrl)} alt="Logo" className="mb-4" style={{ height: '120px', width: 'auto', objectFit: 'contain' }} />
                        ) : (
                            <h1 className="text-2xl font-bold mb-4">{header.company_name || getCompanySetting('company_name') || 'YOUR COMPANY'}</h1>
                        )}
                        <div className="text-sm space-y-1">
                            {header.company_address && <p>{header.company_address}</p>}
                            {(header.company_city || header.company_state || header.company_zipcode) && (
                                <p>
                                    {header.company_city}{header.company_state && `, ${header.company_state}`} {header.company_zipcode}
                                </p>
                            )}
                            {header.company_country && <p>{header.company_country}</p>}
                            {header.company_telephone && <p>{t('Phone')}: {header.company_telephone}</p>}
                            {header.company_email && <p>{t('Email')}: {header.company_email}</p>}
                            {header.registration_number && <p>{t('Registration')}: {header.registration_number}</p>}
                        </div>
                    </div>
                    <div className="text-right w-1/2">
                        <h2 className="text-2xl font-bold mb-2">{t('QUOTATION')}</h2>
                        <p className="text-lg font-semibold">#{quotation.quotation_number}</p>
                        <div className="text-sm mt-2 space-y-1">
                            <p>{t('Date')}: {formatDate(quotation.quotation_date)}</p>
                            <p>{t('Due Date')}: {formatDate(quotation.due_date)}</p>
                        </div>
                    </div>
                </div>

                <div className="flex justify-between mb-12">
                    <div className="w-1/2">
                        <h3 className="font-bold mb-3">{t('QUOTE TO')}</h3>
                        <div className="text-sm space-y-1">
                            <p className="font-semibold">{quotation.customer?.name}</p>
                            <p>{quotation.customer?.email}</p>
                            {quotation.customer_details?.billing_address && (
                                <>
                                    <p>{quotation.customer_details.billing_address.name}</p>
                                    <p>{quotation.customer_details.billing_address.address_line_1}</p>
                                    <p>{quotation.customer_details.billing_address.city}, {quotation.customer_details.billing_address.state} {quotation.customer_details.billing_address.zip_code}</p>
                                </>
                            )}
                        </div>
                    </div>
                    <div className="text-right w-1/2">
                        <h3 className="font-bold mb-3">{t('SHIP TO')}</h3>
                        <div className="text-sm space-y-1">
                            {quotation.customer_details?.shipping_address ? (
                                <>
                                    <p className="font-semibold">{quotation.customer_details.shipping_address.name}</p>
                                    <p>{quotation.customer_details.shipping_address.address_line_1}</p>
                                    <p>{quotation.customer_details.shipping_address.city}, {quotation.customer_details.shipping_address.state} {quotation.customer_details.shipping_address.zip_code}</p>
                                </>
                            ) : (
                                <p className="text-gray-500">{t('Same as billing address')}</p>
                            )}
                        </div>
                    </div>
                </div>

                <div className="mb-8">
                    <table className="w-full table-fixed">
                        <thead>
                            <tr className="border-b border-gray-300">
                                <th className="text-left py-3 font-bold">{t('ITEM')}</th>
                                <th className="text-center py-3 font-bold">{t('QTY')}</th>
                                <th className="text-right py-3 font-bold">{t('PRICE')}</th>
                                <th className="text-right py-3 font-bold">{t('DISCOUNT')}</th>
                                <th className="text-right py-3 font-bold">{t('TAX')}</th>
                                <th className="text-right py-3 font-bold">{t('TOTAL')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {quotation.items?.map((item, index) => (
                                <tr key={index} className="page-break-inside-avoid">
                                    <td className="py-4">
                                        <div className="font-semibold">{item.product?.name}</div>
                                        {item.product?.sku && (
                                            <div className="text-xs text-gray-500">{t('SKU')}: {item.product.sku}</div>
                                        )}
                                    </td>
                                    <td className="text-center py-4">{item.quantity}</td>
                                    <td className="text-right py-4">{formatCurrency(item.unit_price)}</td>
                                    <td className="text-right py-4">
                                        {item.discount_percentage > 0 ? (
                                            <>
                                                <div className="text-sm">{item.discount_percentage}%</div>
                                                <div className="text-sm font-medium">-{formatCurrency(item.discount_amount)}</div>
                                            </>
                                        ) : (
                                            <div className="text-sm">0%</div>
                                        )}
                                    </td>
                                    <td className="text-right py-4">
                                        {item.taxes && item.taxes.length > 0 ? (
                                            <>
                                                {item.taxes.map((tax, taxIndex) => (
                                                    <div key={taxIndex} className="text-sm">{tax.tax_name} ({tax.tax_rate}%)</div>
                                                ))}
                                                <div className="text-sm font-medium">{formatCurrency(item.tax_amount)}</div>
                                            </>
                                        ) : item.tax_percentage > 0 ? (
                                            <>
                                                <div className="text-sm">{item.tax_percentage}%</div>
                                                <div className="text-sm font-medium">{formatCurrency(item.tax_amount)}</div>
                                            </>
                                        ) : (
                                            <div className="text-sm">0%</div>
                                        )}
                                    </td>
                                    <td className="text-right py-4 font-semibold">{formatCurrency(item.total_amount)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="flex justify-between items-end mb-8">
                    {/* Stamp Image */}
                    <div className="w-64">
                        <img src="/storage/media/eaststamp.png" alt="Company Stamp" style={{ width: '268px', height: '145px', objectFit: 'contain' }} />
                    </div>
                    
                    {/* Summary */}
                    <div className="w-80">
                        <div className="border border-gray-400 p-4">
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <span>{t('Subtotal')}:</span>
                                    <span>{formatCurrency(quotation.subtotal)}</span>
                                </div>
                                {quotation.discount_amount > 0 && (
                                    <div className="flex justify-between">
                                        <span>{t('Discount')}:</span>
                                        <span>-{formatCurrency(quotation.discount_amount)}</span>
                                    </div>
                                )}
                                {quotation.tax_amount > 0 && (
                                    <div className="flex justify-between">
                                        <span>{t('Tax')}:</span>
                                        <span>{formatCurrency(quotation.tax_amount)}</span>
                                    </div>
                                )}
                                <div className="border-t border-gray-400 pt-2 mt-2">
                                    <div className="flex justify-between font-bold text-lg">
                                        <span>{t('TOTAL')}:</span>
                                        <span>{formatCurrency(quotation.total_amount)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="border-t border-gray-400 pt-6 text-center">
                    <p className="font-semibold">{t('PAYMENT TERMS')}: {quotation.payment_terms || t('Net 30 Days')}</p>
                    <p className="text-sm mt-2">{t('Thank you for your business!')}</p>
                </div>

                {/* Footer with 4 columns */}
                <div className="mt-8 pt-6 border-t-2 border-gray-300">
                    <div className="grid grid-cols-4 gap-4 text-xs">
                        <div>
                            <h4 className="font-bold mb-2 text-[10px]">Main Bank {branchName}</h4>
                            <div className="space-y-0.5 text-[10px]">
                                <p><strong>{footerDetails.main_bank.bank_name}:</strong> {footerDetails.main_bank.account_number}</p>
                            </div>
                            <h4 className="font-bold mt-2 mb-1 text-[10px]">Other Banks</h4>
                            <div className="space-y-0.5 text-[10px]">
                                {footerDetails.other_banks.map((bank: BankAccount, index: number) => (
                                    <p key={index}><strong>{bank.bank_name}:</strong> {bank.account_number}</p>
                                ))}
                            </div>
                        </div>
                        <div>
                            <h4 className="font-bold mb-2">Contact Personnel</h4>
                            <div className="space-y-1">
                                {footerDetails.contacts.map((contact: ContactPerson, index: number) => (
                                    <p key={index}><strong>{contact.title}:</strong> {contact.phone}</p>
                                ))}
                            </div>
                        </div>
                        <div>
                            <h4 className="font-bold mb-2">Business Details</h4>
                            <p><strong>TIN:</strong> {footerDetails.tin}</p>
                        </div>
                        <div>
                            <h4 className="font-bold mb-2">Online & Social Media</h4>
                            <div className="space-y-1">
                                <p>Email: {footerDetails.email}</p>
                                <p>Website: {footerDetails.website}</p>
                                {footerDetails.youtube && <p>YouTube: {footerDetails.youtube}</p>}
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

                .quotation-container {
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

                    .quotation-container {
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
import React, { useEffect, useState } from 'react';
import { Head, usePage } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import html2pdf from 'html2pdf.js';
import { formatCurrency, formatDate, getCompanySetting, getImagePath } from '@/utils/helpers';

interface RoomBooking {
    id: number;
    booking_number: string;
    customer?: {
        name: string;
        email: string;
    };
    room: {
        room_number: string;
        room_type: {
            name: string;
        };
    };
    warehouse?: {
        name: string;
    };
    check_in_date: string;
    check_out_date: string;
    total_nights: number;
    number_of_guests: number;
    includes_breakfast: boolean;
    total_amount: number;
    status: string;
    payment?: {
        amount_paid: number;
        payment_method: string;
    };
}

interface ReportProps {
    bookings: RoomBooking[];
    filters: any;
    totals: {
        total_amount: number;
        total_paid: number;
        total_balance: number;
        count: number;
    };
    date_range_label?: string;
}

export default function Report() {
    const { t } = useTranslation();
    const { bookings, filters, totals, date_range_label } = usePage<ReportProps>().props;
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
                filename: `room-bookings-report-${new Date().toISOString().split('T')[0]}.pdf`,
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

    return (
        <div className="min-h-screen bg-white">
            <Head title={t('Room Bookings Report')} />

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

            <div className="report-container bg-white max-w-7xl mx-auto p-4">
                <div className="text-center mb-8">
                    {logoUrl && (
                        <img src={getImagePath(logoUrl)} alt="Logo" className="mx-auto mb-4" style={{ height: '80px', width: 'auto', objectFit: 'contain' }} />
                    )}
                    <h1 className="text-3xl font-bold mb-2">{t('Room Bookings Report')}</h1>
                    <p className="text-gray-600">{t('Generated on')}: {formatDate(new Date().toISOString())}</p>
                    {date_range_label && date_range_label !== 'All Time' && (
                        <p className="text-gray-600 mt-1 font-semibold">
                            {t('Period')}: {t(date_range_label)}
                        </p>
                    )}
                    {(filters.date_from || filters.date_to) && (
                        <p className="text-gray-600 mt-1">
                            {t('Custom Range')}: {
                                filters.date_from && filters.date_to 
                                    ? `${formatDate(filters.date_from)} - ${formatDate(filters.date_to)}`
                                    : filters.date_from 
                                        ? `${t('From')} ${formatDate(filters.date_from)}`
                                        : `${t('Until')} ${formatDate(filters.date_to)}`
                            }
                        </p>
                    )}
                </div>

                <div style={{ fontSize: '11px' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
                        <colgroup>
                            <col style={{ width: '11%' }} />
                            <col style={{ width: '14%' }} />
                            <col style={{ width: '10%' }} />
                            <col style={{ width: '9%' }} />
                            <col style={{ width: '9%' }} />
                            <col style={{ width: '5%' }} />
                            <col style={{ width: '10%' }} />
                            <col style={{ width: '10%' }} />
                            <col style={{ width: '10%' }} />
                            <col style={{ width: '10%' }} />
                            <col style={{ width: '8%' }} />
                        </colgroup>
                        <thead>
                            <tr style={{ backgroundColor: '#f3f4f6' }}>
                                <th style={{ border: '1px solid #d1d5db', padding: '6px 4px', textAlign: 'left' }}>{t('Booking #')}</th>
                                <th style={{ border: '1px solid #d1d5db', padding: '6px 4px', textAlign: 'left' }}>{t('Customer')}</th>
                                <th style={{ border: '1px solid #d1d5db', padding: '6px 4px', textAlign: 'left' }}>{t('Room')}</th>
                                <th style={{ border: '1px solid #d1d5db', padding: '6px 4px', textAlign: 'left' }}>{t('Check-in')}</th>
                                <th style={{ border: '1px solid #d1d5db', padding: '6px 4px', textAlign: 'left' }}>{t('Check-out')}</th>
                                <th style={{ border: '1px solid #d1d5db', padding: '6px 4px', textAlign: 'center' }}>{t('Nights')}</th>
                                <th style={{ border: '1px solid #d1d5db', padding: '6px 4px', textAlign: 'right' }}>{t('Total')}</th>
                                <th style={{ border: '1px solid #d1d5db', padding: '6px 4px', textAlign: 'right' }}>{t('Paid')}</th>
                                <th style={{ border: '1px solid #d1d5db', padding: '6px 4px', textAlign: 'right' }}>{t('Balance')}</th>
                                <th style={{ border: '1px solid #d1d5db', padding: '6px 4px', textAlign: 'left' }}>{t('Pay. Method')}</th>
                                <th style={{ border: '1px solid #d1d5db', padding: '6px 4px', textAlign: 'center' }}>{t('Status')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {bookings.map((booking) => {
                                const paidAmount = booking.payment?.amount_paid || 0;
                                const balance = booking.total_amount - paidAmount;
                                
                                return (
                                    <tr key={booking.id}>
                                        <td style={{ border: '1px solid #d1d5db', padding: '5px 4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{booking.booking_number}</td>
                                        <td style={{ border: '1px solid #d1d5db', padding: '5px 4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {booking.customer?.name || t('Walk-in')}
                                            {booking.includes_breakfast && <span style={{ color: '#ea580c', marginLeft: '2px' }}>🍳</span>}
                                        </td>
                                        <td style={{ border: '1px solid #d1d5db', padding: '5px 4px' }}>
                                            <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t('Room')} {booking.room.room_number}</div>
                                            <div style={{ fontSize: '10px', color: '#6b7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{booking.room.room_type.name}</div>
                                        </td>
                                        <td style={{ border: '1px solid #d1d5db', padding: '5px 4px', whiteSpace: 'nowrap' }}>{formatDate(booking.check_in_date)}</td>
                                        <td style={{ border: '1px solid #d1d5db', padding: '5px 4px', whiteSpace: 'nowrap' }}>{formatDate(booking.check_out_date)}</td>
                                        <td style={{ border: '1px solid #d1d5db', padding: '5px 4px', textAlign: 'center' }}>{booking.total_nights}</td>
                                        <td style={{ border: '1px solid #d1d5db', padding: '5px 4px', textAlign: 'right', whiteSpace: 'nowrap' }}>{formatCurrency(booking.total_amount)}</td>
                                        <td style={{ border: '1px solid #d1d5db', padding: '5px 4px', textAlign: 'right', whiteSpace: 'nowrap' }}>{formatCurrency(paidAmount)}</td>
                                        <td style={{ border: '1px solid #d1d5db', padding: '5px 4px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                                            {balance > 0 ? formatCurrency(balance) : '-'}
                                        </td>
                                        <td style={{ border: '1px solid #d1d5db', padding: '5px 4px', textTransform: 'capitalize', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {booking.payment?.payment_method
                                                ? booking.payment.payment_method.replace(/_/g, ' ')
                                                : '-'}
                                        </td>
                                        <td style={{ border: '1px solid #d1d5db', padding: '5px 4px', textAlign: 'center', textTransform: 'capitalize', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{booking.status}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                        <tfoot>
                            <tr style={{ backgroundColor: '#f3f4f6', fontWeight: 'bold' }}>
                                <td colSpan={6} style={{ border: '1px solid #d1d5db', padding: '6px 4px', textAlign: 'right' }}>{t('Total')}:</td>
                                <td style={{ border: '1px solid #d1d5db', padding: '6px 4px', textAlign: 'right', whiteSpace: 'nowrap' }}>{formatCurrency(totals.total_amount)}</td>
                                <td style={{ border: '1px solid #d1d5db', padding: '6px 4px', textAlign: 'right', whiteSpace: 'nowrap' }}>{formatCurrency(totals.total_paid)}</td>
                                <td style={{ border: '1px solid #d1d5db', padding: '6px 4px', textAlign: 'right', whiteSpace: 'nowrap' }}>{formatCurrency(totals.total_balance)}</td>
                                <td style={{ border: '1px solid #d1d5db', padding: '6px 4px' }}></td>
                                <td style={{ border: '1px solid #d1d5db', padding: '6px 4px' }}></td>
                            </tr>
                        </tfoot>
                    </table>
                </div>

                <div className="mt-8 grid grid-cols-2 gap-4 text-sm text-gray-600">
                    <div>
                        <p><strong>{t('Total Bookings')}:</strong> {totals.count}</p>
                        <p><strong>{t('Total Revenue')}:</strong> {formatCurrency(totals.total_amount)}</p>
                    </div>
                    <div>
                        <p><strong>{t('Total Collected')}:</strong> {formatCurrency(totals.total_paid)}</p>
                        <p><strong>{t('Outstanding Balance')}:</strong> {formatCurrency(totals.total_balance)}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

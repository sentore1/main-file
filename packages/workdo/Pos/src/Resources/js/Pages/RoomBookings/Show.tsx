import { Head, Link, router } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, LogIn, LogOut, XCircle, Calendar, User, Home as HomeIcon, DollarSign, Printer } from 'lucide-react';
import { useFavicon } from '@/hooks/use-favicon';
import { BrandProvider } from '@/contexts/brand-context';
import AuthenticatedLayout from '@/layouts/authenticated-layout';
import { formatCurrency, formatDate } from '@/utils/helpers';

interface Booking {
    id: number;
    booking_number: string;
    check_in_date: string;
    check_out_date: string;
    total_nights: number;
    number_of_guests: number;
    includes_breakfast: boolean;
    subtotal: number;
    tax_amount: number;
    discount: number;
    total_amount: number;
    notes: string;
    item_notes: string;
    status: string;
    room: {
        room_number: string;
        floor: string;
        max_occupancy: number;
        room_type: {
            name: string;
            color: string;
        };
        warehouse: {
            name: string;
            address: string;
        };
    };
    customer: {
        name: string;
        email: string;
    } | null;
    warehouse: {
        name: string;
    };
    payment: {
        payment_method: string;
        amount_paid: number;
        payment_date: string;
    } | null;
}

interface PosInvoice {
    id: number;
    sale_number: string;
    pos_date: string;
    items: Array<{
        product_name: string;
        quantity: number;
        unit_price: number;
        total_amount: number;
    }>;
    total_amount: number;
    paid_amount: number;
    balance_due: number;
    charged_to_room: boolean;
}

interface ShowProps {
    booking: Booking;
    posInvoices: PosInvoice[];
}

function ShowContent({ booking, posInvoices }: ShowProps) {
    const { t } = useTranslation();
    useFavicon();

    const getStatusBadge = (status: string) => {
        const variants: any = {
            pending: 'secondary',
            confirmed: 'default',
            checked_in: 'default',
            checked_out: 'secondary',
            cancelled: 'destructive',
        };
        return variants[status] || 'default';
    };

    const handleCheckIn = () => {
        if (confirm(t('Are you sure you want to check in this guest?'))) {
            router.post(route('room-bookings.check-in', booking.id));
        }
    };

    const handleCheckOut = () => {
        if (confirm(t('Are you sure you want to check out this guest?'))) {
            router.post(route('room-bookings.check-out', booking.id));
        }
    };

    const handleCancel = () => {
        if (confirm(t('Are you sure you want to cancel this booking?'))) {
            router.post(route('room-bookings.cancel', booking.id));
        }
    };

    // Calculate total consumption from POS invoices
    const totalConsumption = posInvoices?.reduce((sum, invoice) => {
        const amount = Number(invoice.total_amount) || 0;
        console.log(`POS Invoice ${invoice.sale_number}: amount=${invoice.total_amount}, converted=${amount}`);
        return sum + amount;
    }, 0) || 0;
    
    const totalPaid = Number(booking.payment?.amount_paid) || 0;
    
    const posBalances = posInvoices?.reduce((sum, invoice) => {
        const balance = Number(invoice.balance_due) || 0;
        return sum + balance;
    }, 0) || 0;
    
    const bookingTotal = Number(booking.total_amount) || 0;
    const grandTotal = bookingTotal + totalConsumption;
    const totalOutstanding = (bookingTotal - totalPaid) + posBalances;

    // Debug logging
    console.log('=== Grand Total Debug ===');
    console.log('Booking Total:', bookingTotal, typeof bookingTotal);
    console.log('Total Consumption:', totalConsumption, typeof totalConsumption);
    console.log('Grand Total:', grandTotal, typeof grandTotal);
    console.log('POS Invoices:', posInvoices);
    console.log('POS Invoices Count:', posInvoices?.length || 0);
    if (posInvoices && posInvoices.length > 0) {
        posInvoices.forEach((inv, idx) => {
            console.log(`  Invoice ${idx + 1}:`, {
                sale_number: inv.sale_number,
                total_amount: inv.total_amount,
                type: typeof inv.total_amount,
                items_count: inv.items?.length || 0
            });
        });
    }
    console.log('========================');

    return (
        <>
            <Head title={`${t('Booking')} ${booking.booking_number}`} />

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href={route('room-bookings.index')}>
                            <Button variant="outline" size="sm">
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                {t('Back')}
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">{booking.booking_number}</h1>
                            <p className="text-sm text-gray-500 mt-1">
                                <Badge variant={getStatusBadge(booking.status)}>
                                    {t(booking.status)}
                                </Badge>
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        {booking.status === 'confirmed' && (
                            <Button onClick={handleCheckIn}>
                                <LogIn className="h-4 w-4 mr-2" />
                                {t('Check In')}
                            </Button>
                        )}
                        {booking.status === 'checked_in' && (
                            <Button onClick={handleCheckOut} className="bg-green-600 hover:bg-green-700">
                                <LogOut className="h-4 w-4 mr-2" />
                                {t('Check Out')}
                            </Button>
                        )}
                        {(booking.status === 'confirmed' || booking.status === 'checked_in') && (
                            <Button onClick={handleCancel} variant="destructive">
                                <XCircle className="h-4 w-4 mr-2" />
                                {t('Cancel')}
                            </Button>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>{t('Booking Details')}</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-gray-500">{t('Check-in Date')}</p>
                                        <p className="font-medium flex items-center gap-2">
                                            <Calendar className="h-4 w-4" />
                                            {formatDate(booking.check_in_date)}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">{t('Check-out Date')}</p>
                                        <p className="font-medium flex items-center gap-2">
                                            <Calendar className="h-4 w-4" />
                                            {formatDate(booking.check_out_date)}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">{t('Total Nights')}</p>
                                        <p className="font-medium">{booking.total_nights}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">{t('Number of Guests')}</p>
                                        <p className="font-medium flex items-center gap-2">
                                            <User className="h-4 w-4" />
                                            {booking.number_of_guests}
                                        </p>
                                    </div>
                                </div>

                                {booking.includes_breakfast && (
                                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                                        <p className="text-sm font-medium text-orange-800 flex items-center gap-2">
                                            🍳 {t('Breakfast Included')}
                                        </p>
                                        <p className="text-xs text-orange-600 mt-1">
                                            {t('Complimentary breakfast for')} {booking.number_of_guests} {booking.number_of_guests === 1 ? t('guest') : t('guests')}
                                        </p>
                                    </div>
                                )}

                                {(booking.notes || booking.item_notes) && (
                                    <div>
                                        <p className="text-sm text-gray-500 mb-1">{t('Notes')}</p>
                                        <p className="text-sm bg-gray-50 p-3 rounded">{booking.item_notes || booking.notes}</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>{t('Room Information')}</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div
                                        className="w-4 h-4 rounded"
                                        style={{ backgroundColor: booking.room.room_type.color }}
                                    />
                                    <div>
                                        <p className="font-semibold">{t('Room')} {booking.room.room_number}</p>
                                        <p className="text-sm text-gray-500">{booking.room.room_type.name}</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <p className="text-gray-500">{t('Floor')}</p>
                                        <p className="font-medium">{booking.room.floor || '-'}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-500">{t('Max Occupancy')}</p>
                                        <p className="font-medium">{booking.room.max_occupancy} {t('guests')}</p>
                                    </div>
                                    <div className="col-span-2">
                                        <p className="text-gray-500 flex items-center gap-2">
                                            <HomeIcon className="h-4 w-4" />
                                            {t('Location')}
                                        </p>
                                        <p className="font-medium">{booking.room.warehouse.name}</p>
                                        {booking.room.warehouse.address && (
                                            <p className="text-sm text-gray-600">{booking.room.warehouse.address}</p>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {booking.payment && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>{t('Payment Information')}</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-2">
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">{t('Payment Method')}</span>
                                        <span className="font-medium capitalize">{booking.payment.payment_method.replace('_', ' ')}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">{t('Payment Date')}</span>
                                        <span className="font-medium">{formatDate(booking.payment.payment_date)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">{t('Amount Paid')}</span>
                                        <span className="font-medium text-green-600">{formatCurrency(booking.payment.amount_paid)}</span>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {posInvoices && posInvoices.length > 0 && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>{t('Additional Charges (POS)')}</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {posInvoices.map((invoice) => (
                                        <div key={invoice.id} className="border rounded-lg p-4 space-y-3">
                                            <div className="flex justify-between items-center">
                                                <div>
                                                    <p className="font-semibold text-sm">{invoice.sale_number}</p>
                                                    <p className="text-xs text-gray-500">{formatDate(invoice.pos_date)}</p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {invoice.charged_to_room && (
                                                        <Badge variant="secondary" className="text-xs">
                                                            {t('Charged to Room')}
                                                        </Badge>
                                                    )}
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => window.open(`/pos/orders/${invoice.id}/print`, '_blank')}
                                                        className="h-8"
                                                    >
                                                        <Printer className="h-3 w-3 mr-1" />
                                                        {t('Print')}
                                                    </Button>
                                                </div>
                                            </div>
                                            <div className="space-y-1">
                                                {invoice.items.map((item, idx) => (
                                                    <div key={idx} className="flex justify-between text-sm">
                                                        <span className="text-gray-600">
                                                            {item.quantity}x {item.product_name}
                                                        </span>
                                                        <span className="font-medium">{formatCurrency(item.total_amount)}</span>
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="border-t pt-2 flex justify-between items-center">
                                                <span className="text-sm font-medium">{t('Invoice Total')}</span>
                                                <span className="font-bold text-blue-600">{formatCurrency(invoice.total_amount)}</span>
                                            </div>
                                            {invoice.balance_due > 0 && (
                                                <div className="bg-orange-50 border border-orange-200 rounded p-2 flex justify-between items-center">
                                                    <span className="text-sm font-medium text-orange-800">{t('Balance Due')}</span>
                                                    <span className="font-bold text-orange-600">{formatCurrency(invoice.balance_due)}</span>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>{t('Customer')}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {booking.customer ? (
                                    <div className="space-y-2">
                                        <p className="font-semibold">{booking.customer.name}</p>
                                        <p className="text-sm text-gray-600">{booking.customer.email}</p>
                                    </div>
                                ) : (
                                    <p className="text-gray-500">{t('Walk-in Customer')}</p>
                                )}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>{t('Payment Summary')}</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">{t('Room Charges')}</span>
                                    <span>{formatCurrency(booking.subtotal)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">{t('Tax')}</span>
                                    <span>{formatCurrency(booking.tax_amount)}</span>
                                </div>
                                {booking.discount > 0 && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">{t('Discount')}</span>
                                        <span className="text-red-600">-{formatCurrency(booking.discount)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between text-sm font-medium border-t pt-2">
                                    <span className="text-gray-700">{t('Room Total')}</span>
                                    <span>{formatCurrency(booking.total_amount)}</span>
                                </div>
                                {totalConsumption > 0 && (
                                    <>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-500">{t('Additional Charges')}</span>
                                            <span className="text-orange-600">{formatCurrency(totalConsumption)}</span>
                                        </div>
                                        <div className="border-t pt-3">
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="font-semibold">{t('Grand Total')}</span>
                                                <span className="text-xl font-bold text-blue-600 flex items-center gap-1">
                                                    <DollarSign className="h-5 w-5" />
                                                    {formatCurrency(grandTotal)}
                                                </span>
                                            </div>
                                            <Button
                                                onClick={() => window.print()}
                                                className="w-full mt-2"
                                                variant="outline"
                                            >
                                                <Printer className="h-4 w-4 mr-2" />
                                                {t('Print Complete Invoice')}
                                            </Button>
                                            {totalOutstanding > 0 && (
                                                <div className="flex justify-between items-center bg-orange-50 p-2 rounded mt-2">
                                                    <span className="text-sm font-medium text-orange-800">{t('Total Outstanding')}</span>
                                                    <span className="text-lg font-bold text-orange-600">{formatCurrency(totalOutstanding)}</span>
                                                </div>
                                            )}
                                        </div>
                                    </>
                                )}
                                {totalConsumption === 0 && (
                                    <div className="border-t pt-3">
                                        <div className="flex justify-between items-center">
                                            <span className="font-semibold">{t('Total')}</span>
                                            <span className="text-xl font-bold text-green-600 flex items-center gap-1">
                                                <DollarSign className="h-5 w-5" />
                                                {formatCurrency(booking.total_amount)}
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </>
    );
}

export default function Show(props: ShowProps) {
    return (
        <BrandProvider>
            <AuthenticatedLayout>
                <ShowContent {...props} />
            </AuthenticatedLayout>
        </BrandProvider>
    );
}

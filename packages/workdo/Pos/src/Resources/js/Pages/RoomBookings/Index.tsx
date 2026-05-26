import { Head, router, Link } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, Home, Eye, Calendar, LogIn, LogOut, XCircle, Download } from 'lucide-react';
import { formatCurrency, formatDate } from '@/utils/helpers';
import { useFavicon } from '@/hooks/use-favicon';
import { BrandProvider } from '@/contexts/brand-context';
import AuthenticatedLayout from '@/layouts/authenticated-layout';
import LateCheckoutAlert from '../../components/LateCheckoutAlert';

interface Booking {
    id: number;
    booking_number: string;
    check_in_date: string;
    check_out_date: string;
    total_nights: number;
    total_amount: number;
    status: string;
    includes_breakfast: boolean;
    number_of_guests: number;
    room: {
        room_number: string;
        room_type: {
            name: string;
        };
    };
    customer: {
        name: string;
        email: string;
    } | null;
    warehouse: {
        name: string;
    };
    payment?: {
        amount_paid: number;
        payment_method: string;
    };
}

interface Warehouse {
    id: number;
    name: string;
}

interface IndexProps {
    bookings: {
        data: Booking[];
        current_page: number;
        last_page: number;
        total: number;
    };
    warehouses: Warehouse[];
    lateCheckouts: Array<{
        id: number;
        booking_number: string;
        check_out_date: string;
        days_late: number;
        customer?: { id: number; name: string };
        room?: { id: number; room_number: string };
        warehouse?: { id: number; name: string };
        status: string;
    }>;
    summary?: {
        total_bookings: number;
        total_revenue: number;
        total_paid: number;
        total_balance: number;
    };
}

function IndexContent({ bookings, warehouses, lateCheckouts, summary }: IndexProps) {
    const { t } = useTranslation();
    useFavicon();
    
    const [filters, setFilters] = useState({
        search: '',
        warehouse: '',
        status: '',
        date_range: 'all', // New: all, today, week, month, year
    });

    const handleFilter = () => {
        router.get(route('room-bookings.index'), filters, { preserveState: true });
    };

    const handleCheckIn = (bookingId: number) => {
        if (confirm(t('Are you sure you want to check in this guest?'))) {
            router.post(route('room-bookings.check-in', bookingId));
        }
    };

    const handleCheckOut = (bookingId: number) => {
        if (confirm(t('Are you sure you want to check out this guest?'))) {
            router.post(route('room-bookings.check-out', bookingId));
        }
    };

    const handleCancel = (bookingId: number) => {
        if (confirm(t('Are you sure you want to cancel this booking?'))) {
            router.post(route('room-bookings.cancel', bookingId));
        }
    };

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

    const getStatusLabel = (status: string) => {
        const labels: any = {
            pending: 'Pending',
            confirmed: 'Confirmed',
            checked_in: 'Checked In',
            checked_out: 'Checked Out',
            cancelled: 'Cancelled',
        };
        return labels[status] || status;
    };

    return (
        <>
            <Head title={t('Room Bookings')} />

            <div className="space-y-6">
                {/* Late Checkout Alert */}
                {lateCheckouts && lateCheckouts.length > 0 && (
                    <LateCheckoutAlert lateCheckouts={lateCheckouts} />
                )}

                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">{t('Room Bookings')}</h1>
                        <p className="text-sm text-gray-500 mt-1">
                            {t('Manage room reservations and bookings')}
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button 
                            variant="outline"
                            size="sm"
                            onClick={() => {
                                const params = new URLSearchParams();
                                if (filters.search) params.append('search', filters.search);
                                if (filters.warehouse) params.append('warehouse', filters.warehouse);
                                if (filters.status) params.append('status', filters.status);
                                if (filters.date_range && filters.date_range !== 'all') params.append('date_range', filters.date_range);
                                params.append('download', 'pdf');
                                window.open(route('room-bookings.download-report') + '?' + params.toString(), '_blank');
                            }}
                        >
                            <Download className="h-4 w-4 mr-2" />
                            {t('Download Report')}
                        </Button>
                        <Link href={route('room-bookings.calendar')}>
                            <Button variant="outline">
                                <Calendar className="h-4 w-4 mr-2" />
                                {t('Calendar View')}
                            </Button>
                        </Link>
                        <Link href={route('pos.index')}>
                            <Button variant="outline">
                                <Home className="h-4 w-4 mr-2" />
                                {t('Back to POS')}
                            </Button>
                        </Link>
                        <Link href={route('room-bookings.create')}>
                            <Button>
                                <Plus className="h-4 w-4 mr-2" />
                                {t('New Booking')}
                            </Button>
                        </Link>
                    </div>
                </div>

                <Card>
                    <CardContent className="pt-6">
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                            <div className="relative md:col-span-2">
                                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                <Input
                                    placeholder={t('Search bookings...')}
                                    value={filters.search}
                                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                                    className="pl-10"
                                />
                            </div>
                            <Select value={filters.warehouse || 'all'} onValueChange={(value) => setFilters({ ...filters, warehouse: value === 'all' ? '' : value })}>
                                <SelectTrigger>
                                    <SelectValue placeholder={t('All Warehouses')} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">{t('All Warehouses')}</SelectItem>
                                    {warehouses.map((warehouse) => (
                                        <SelectItem key={warehouse.id} value={warehouse.id.toString()}>
                                            {warehouse.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Select value={filters.date_range} onValueChange={(value) => setFilters({ ...filters, date_range: value })}>
                                <SelectTrigger>
                                    <SelectValue placeholder={t('Date Range')} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">{t('All Time')}</SelectItem>
                                    <SelectItem value="today">{t('Today')}</SelectItem>
                                    <SelectItem value="week">{t('This Week')}</SelectItem>
                                    <SelectItem value="month">{t('This Month')}</SelectItem>
                                    <SelectItem value="year">{t('This Year')}</SelectItem>
                                </SelectContent>
                            </Select>
                            <Button onClick={handleFilter}>{t('Filter')}</Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Summary Statistics */}
                {summary && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <Card>
                            <CardContent className="pt-6">
                                <div className="text-sm text-gray-500 mb-1">{t('Total Bookings')}</div>
                                <div className="text-2xl font-bold text-blue-600">{summary.total_bookings}</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="pt-6">
                                <div className="text-sm text-gray-500 mb-1">{t('Total Revenue')}</div>
                                <div className="text-2xl font-bold text-green-600">{formatCurrency(summary.total_revenue)}</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="pt-6">
                                <div className="text-sm text-gray-500 mb-1">{t('Total Collected')}</div>
                                <div className="text-2xl font-bold text-green-600">{formatCurrency(summary.total_paid)}</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="pt-6">
                                <div className="text-sm text-gray-500 mb-1">{t('Outstanding Balance')}</div>
                                <div className="text-2xl font-bold text-orange-600">{formatCurrency(summary.total_balance)}</div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                <Card>
                    <CardHeader>
                        <CardTitle>{t('All Bookings')} ({bookings.total})</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {bookings.data.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('Booking #')}</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('Customer')}</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('Room')}</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('Check-in')}</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('Check-out')}</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('Nights')}</th>
                                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">{t('Total')}</th>
                                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">{t('Paid')}</th>
                                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">{t('Balance')}</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('Payment Method')}</th>
                                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">{t('Status')}</th>
                                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">{t('Actions')}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {bookings.data.map((booking) => (
                                            <tr key={booking.id} className="hover:bg-gray-50">
                                                <td className="px-4 py-3">
                                                    <span className="font-medium text-blue-600">{booking.booking_number}</span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div>
                                                        <div className="font-medium">{booking.customer?.name || t('Walk-in')}</div>
                                                        {booking.customer?.email && (
                                                            <div className="text-sm text-gray-500">{booking.customer.email}</div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div>
                                                        <div className="font-medium">{t('Room')} {booking.room.room_number}</div>
                                                        <div className="text-sm text-gray-500">{booking.room.room_type.name}</div>
                                                        {booking.includes_breakfast && (
                                                            <div className="text-xs text-orange-600 font-medium mt-1">
                                                                🍳 {t('Breakfast included')}
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-sm">{formatDate(booking.check_in_date)}</td>
                                                <td className="px-4 py-3 text-sm">{formatDate(booking.check_out_date)}</td>
                                                <td className="px-4 py-3 text-sm">{booking.total_nights}</td>
                                                <td className="px-4 py-3 text-right font-semibold">
                                                    {formatCurrency(booking.total_amount)}
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <span className="font-medium text-green-600">
                                                        {formatCurrency(booking.payment?.amount_paid || 0)}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    {(() => {
                                                        const balance = booking.total_amount - (booking.payment?.amount_paid || 0);
                                                        return balance > 0 ? (
                                                            <span className="font-medium text-orange-600">
                                                                {formatCurrency(balance)}
                                                            </span>
                                                        ) : (
                                                            <span className="text-gray-400">-</span>
                                                        );
                                                    })()}
                                                </td>
                                                <td className="px-4 py-3 text-sm">
                                                    {booking.payment?.payment_method
                                                        ? <span className="capitalize">{booking.payment.payment_method.replace(/_/g, ' ')}</span>
                                                        : <span className="text-gray-400">-</span>
                                                    }
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <Badge variant={getStatusBadge(booking.status)}>
                                                        {t(getStatusLabel(booking.status))}
                                                    </Badge>
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <Link href={route('room-bookings.show', booking.id)}>
                                                            <Button variant="ghost" size="sm" title={t('View Details')}>
                                                                <Eye className="h-4 w-4" />
                                                            </Button>
                                                        </Link>
                                                        
                                                        {booking.status === 'confirmed' && (
                                                            <Button 
                                                                variant="default" 
                                                                size="sm"
                                                                onClick={() => handleCheckIn(booking.id)}
                                                                title={t('Check In')}
                                                            >
                                                                <LogIn className="h-4 w-4 mr-1" />
                                                                {t('Check In')}
                                                            </Button>
                                                        )}
                                                        
                                                        {booking.status === 'checked_in' && (
                                                            <Button 
                                                                variant="default" 
                                                                size="sm"
                                                                onClick={() => handleCheckOut(booking.id)}
                                                                className="bg-green-600 hover:bg-green-700"
                                                                title={t('Check Out')}
                                                            >
                                                                <LogOut className="h-4 w-4 mr-1" />
                                                                {t('Check Out')}
                                                            </Button>
                                                        )}
                                                        
                                                        {(booking.status === 'confirmed' || booking.status === 'checked_in') && (
                                                            <Button 
                                                                variant="destructive" 
                                                                size="sm"
                                                                onClick={() => handleCancel(booking.id)}
                                                                title={t('Cancel Booking')}
                                                            >
                                                                <XCircle className="h-4 w-4" />
                                                            </Button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="text-center py-12">
                                <div className="text-gray-400 mb-4">
                                    <Calendar className="mx-auto h-12 w-12" />
                                </div>
                                <h3 className="text-lg font-medium text-gray-900 mb-2">{t('No bookings found')}</h3>
                                <p className="text-gray-500 mb-4">{t('Start by creating your first booking')}</p>
                                <Link href={route('room-bookings.create')}>
                                    <Button>
                                        <Plus className="h-4 w-4 mr-2" />
                                        {t('New Booking')}
                                    </Button>
                                </Link>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {bookings.last_page > 1 && (
                    <div className="flex justify-center gap-2">
                        {Array.from({ length: bookings.last_page }, (_, i) => i + 1).map((page) => (
                            <Button
                                key={page}
                                variant={page === bookings.current_page ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => router.get(route('room-bookings.index', { page }))}
                            >
                                {page}
                            </Button>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}

export default function Index(props: IndexProps) {
    return (
        <BrandProvider>
            <AuthenticatedLayout>
                <IndexContent {...props} />
            </AuthenticatedLayout>
        </BrandProvider>
    );
}

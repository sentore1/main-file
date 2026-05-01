import { Head, usePage } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Coffee, User, Home, Calendar } from 'lucide-react';
import AuthenticatedLayout from '@/layouts/authenticated-layout';
import { formatDate } from '@/utils/helpers';

interface Booking {
    id: number;
    booking_number: string;
    number_of_guests: number;
    check_in_date: string;
    check_out_date: string;
    customer?: {
        id: number;
        name: string;
        email: string;
    };
    room?: {
        id: number;
        room_number: string;
    };
}

interface IndexProps {
    bookings: Booking[];
    today: string;
}

export default function BreakfastAlert() {
    const { t } = useTranslation();
    const { bookings, today } = usePage<IndexProps>().props;

    return (
        <AuthenticatedLayout
            breadcrumbs={[
                { label: t('POS'), url: route('pos.index') },
                { label: t('Breakfast Alert') }
            ]}
            pageTitle={t('Breakfast Alert')}
        >
            <Head title={t('Breakfast Alert')} />
            
            <Card>
                <CardHeader className="bg-gradient-to-r from-orange-50 to-yellow-50 border-b">
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-3">
                            <div className="p-2 bg-orange-100 rounded-lg">
                                <Coffee className="h-6 w-6 text-orange-600" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">{t('Guests with Breakfast Today')}</h2>
                                <p className="text-sm text-gray-600 font-normal mt-1">
                                    <Calendar className="h-4 w-4 inline mr-1" />
                                    {formatDate(today)}
                                </p>
                            </div>
                        </CardTitle>
                        <Badge className="bg-orange-600 text-white text-lg px-4 py-2">
                            {bookings.length} {t('Guests')}
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent className="p-6">
                    {bookings.length === 0 ? (
                        <div className="text-center py-12">
                            <Coffee className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500 text-lg">
                                {t('No breakfast bookings for today')}
                            </p>
                            <p className="text-gray-400 text-sm mt-2">
                                {t('Guests with breakfast included will appear here')}
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {bookings.map((booking) => (
                                <Card key={booking.id} className="border-2 border-orange-100 hover:border-orange-300 transition-colors">
                                    <CardContent className="p-4">
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Home className="h-5 w-5 text-orange-600" />
                                                    <span className="font-bold text-lg text-gray-900">
                                                        {t('Room')} {booking.room?.room_number}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2 text-gray-700">
                                                    <User className="h-4 w-4" />
                                                    <span className="font-semibold">
                                                        {booking.customer?.name || t('Walk-in Customer')}
                                                    </span>
                                                </div>
                                                {booking.customer?.email && (
                                                    <p className="text-xs text-gray-500 ml-6">
                                                        {booking.customer.email}
                                                    </p>
                                                )}
                                            </div>
                                            <Badge className="bg-orange-100 text-orange-800 border-orange-200">
                                                <Coffee className="h-3 w-3 mr-1" />
                                                {t('Breakfast')}
                                            </Badge>
                                        </div>
                                        
                                        <div className="border-t pt-3 mt-3 space-y-2">
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-600">{t('Booking')}:</span>
                                                <span className="font-medium text-gray-900">{booking.booking_number}</span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-600">{t('Guests')}:</span>
                                                <span className="font-medium text-gray-900">
                                                    {booking.number_of_guests} {booking.number_of_guests === 1 ? t('guest') : t('guests')}
                                                </span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-600">{t('Check-out')}:</span>
                                                <span className="font-medium text-gray-900">{formatDate(booking.check_out_date)}</span>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </AuthenticatedLayout>
    );
}

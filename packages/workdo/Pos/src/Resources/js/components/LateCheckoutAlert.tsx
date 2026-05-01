import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Clock, User, MapPin } from 'lucide-react';
import { Link } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { formatDate } from '@/utils/helpers';

interface LateCheckout {
    id: number;
    booking_number: string;
    check_out_date: string;
    days_late: number;
    customer?: { id: number; name: string };
    room?: { id: number; room_number: string };
    warehouse?: { id: number; name: string };
    status: string;
}

interface LateCheckoutAlertProps {
    lateCheckouts: LateCheckout[];
}

export default function LateCheckoutAlert({ lateCheckouts }: LateCheckoutAlertProps) {
    const { t } = useTranslation();

    if (!lateCheckouts || lateCheckouts.length === 0) {
        return null;
    }

    const getSeverityColor = (daysLate: number) => {
        if (daysLate >= 3) return 'destructive';
        if (daysLate >= 1) return 'warning';
        return 'default';
    };

    return (
        <Card className="border-red-200 bg-red-50/50">
            <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-red-700">
                    <AlertTriangle className="h-5 w-5 animate-pulse" />
                    {t('Late Checkout Alerts')}
                    <Badge variant="destructive" className="ml-auto">
                        {lateCheckouts.length}
                    </Badge>
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                    {lateCheckouts.map((booking) => (
                        <div
                            key={booking.id}
                            className="flex items-start justify-between p-4 bg-white border border-red-200 rounded-lg hover:shadow-md transition-all"
                        >
                            <div className="flex-1 space-y-2">
                                <div className="flex items-center gap-2">
                                    <h4 className="font-semibold text-gray-900">
                                        {booking.booking_number}
                                    </h4>
                                    <Badge 
                                        variant={getSeverityColor(booking.days_late)}
                                        className="text-xs"
                                    >
                                        {booking.days_late} {t('days late')}
                                    </Badge>
                                </div>

                                <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                                    <div className="flex items-center gap-1">
                                        <User className="h-4 w-4" />
                                        <span>{booking.customer?.name || t('Walk-in')}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <MapPin className="h-4 w-4" />
                                        <span>{t('Room')} {booking.room?.room_number}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Clock className="h-4 w-4" />
                                        <span>{t('Expected')}: {formatDate(booking.check_out_date)}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <MapPin className="h-4 w-4" />
                                        <span>{booking.warehouse?.name}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col gap-2 ml-4">
                                <Link href={`/room-bookings/${booking.id}`}>
                                    <Button size="sm" variant="outline">
                                        {t('View')}
                                    </Button>
                                </Link>
                                <Link href={`/room-bookings/${booking.id}`}>
                                    <Button size="sm" variant="default">
                                        {t('Checkout')}
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>

                {lateCheckouts.length > 3 && (
                    <div className="mt-4 text-center">
                        <Link href="/room-bookings?filter=late">
                            <Button variant="link" className="text-red-600">
                                {t('View All Late Checkouts')} ({lateCheckouts.length})
                            </Button>
                        </Link>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

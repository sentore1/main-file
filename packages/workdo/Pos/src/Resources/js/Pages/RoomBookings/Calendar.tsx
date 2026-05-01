import { Head, Link } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, List } from 'lucide-react';
import { useFavicon } from '@/hooks/use-favicon';
import { BrandProvider } from '@/contexts/brand-context';
import AuthenticatedLayout from '@/layouts/authenticated-layout';

interface Booking {
    id: number;
    title: string;
    start: string;
    end: string;
    status: string;
    booking_number: string;
}

interface Warehouse {
    id: number;
    name: string;
}

interface CalendarProps {
    bookings: Booking[];
    warehouses: Warehouse[];
}

function CalendarContent({ bookings }: CalendarProps) {
    const { t } = useTranslation();
    useFavicon();

    return (
        <>
            <Head title={t('Booking Calendar')} />

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
                            <h1 className="text-2xl font-bold text-gray-900">{t('Booking Calendar')}</h1>
                            <p className="text-sm text-gray-500 mt-1">
                                {t('View all bookings in calendar format')}
                            </p>
                        </div>
                    </div>
                    <Link href={route('room-bookings.index')}>
                        <Button variant="outline">
                            <List className="h-4 w-4 mr-2" />
                            {t('List View')}
                        </Button>
                    </Link>
                </div>

                <Card>
                    <CardContent className="p-6">
                        <div className="text-center py-12">
                            <p className="text-gray-500 mb-4">
                                {t('Calendar view requires a calendar library integration.')}
                            </p>
                            <p className="text-sm text-gray-400">
                                {t('Total bookings')}: {bookings.length}
                            </p>
                            <div className="mt-6">
                                <Link href={route('room-bookings.index')}>
                                    <Button>
                                        <List className="h-4 w-4 mr-2" />
                                        {t('View as List')}
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

export default function Calendar(props: CalendarProps) {
    return (
        <BrandProvider>
            <AuthenticatedLayout>
                <CalendarContent {...props} />
            </AuthenticatedLayout>
        </BrandProvider>
    );
}

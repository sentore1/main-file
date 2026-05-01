import { Head, Link } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Edit, MapPin, Users, DollarSign, Calendar } from 'lucide-react';
import { useFavicon } from '@/hooks/use-favicon';
import { BrandProvider } from '@/contexts/brand-context';
import AuthenticatedLayout from '@/layouts/authenticated-layout';
import { formatCurrency, getImagePath } from '@/utils/helpers';

interface RoomType {
    id: number;
    name: string;
    color: string;
}

interface Warehouse {
    id: number;
    name: string;
    address: string;
}

interface Booking {
    id: number;
    check_in_date: string;
    check_out_date: string;
    status: string;
    customer: {
        id: number;
        name: string;
        email: string;
    };
}

interface Room {
    id: number;
    room_number: string;
    floor: string;
    price_per_night: number;
    max_occupancy: number;
    amenities: string[];
    description: string;
    status: string;
    image: string;
    room_type: RoomType;
    warehouse: Warehouse;
    bookings: Booking[];
}

interface ShowProps {
    room: Room;
}

const AMENITY_LABELS: Record<string, string> = {
    wifi: 'WiFi',
    ac: 'Air Conditioning',
    tv: 'Television',
    minibar: 'Mini Bar',
    safe: 'Safe',
    balcony: 'Balcony',
    bathtub: 'Bathtub',
    shower: 'Shower',
    hairdryer: 'Hair Dryer',
    iron: 'Iron',
    coffee: 'Coffee Maker',
    desk: 'Work Desk',
};

function ShowContent({ room }: ShowProps) {
    const { t } = useTranslation();
    useFavicon();

    const getStatusBadge = (status: string) => {
        const variants: any = {
            available: 'default',
            occupied: 'destructive',
            maintenance: 'secondary',
            reserved: 'outline',
        };
        return variants[status] || 'default';
    };

    return (
        <>
            <Head title={`${t('Room')} ${room.room_number}`} />

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href={route('rooms.index')}>
                            <Button variant="outline" size="sm">
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                {t('Back')}
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">
                                {t('Room')} {room.room_number}
                            </h1>
                            <p className="text-sm text-gray-500 mt-1">{room.warehouse.name}</p>
                        </div>
                    </div>
                    <Link href={route('rooms.edit', room.id)}>
                        <Button>
                            <Edit className="h-4 w-4 mr-2" />
                            {t('Edit Room')}
                        </Button>
                    </Link>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                        <Card>
                            <CardContent className="p-0">
                                {room.image ? (
                                    <img
                                        src={getImagePath(room.image)}
                                        alt={room.room_number}
                                        className="w-full h-96 object-cover rounded-t-lg"
                                    />
                                ) : (
                                    <div className="w-full h-96 bg-gray-100 flex items-center justify-center rounded-t-lg">
                                        <svg className="w-24 h-24 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                        </svg>
                                    </div>
                                )}
                                <div className="p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div
                                                className="w-4 h-4 rounded"
                                                style={{ backgroundColor: room.room_type.color }}
                                            />
                                            <span className="text-lg font-semibold">{room.room_type.name}</span>
                                        </div>
                                        <Badge variant={getStatusBadge(room.status)}>
                                            {t(room.status)}
                                        </Badge>
                                    </div>

                                    {room.description && (
                                        <div className="mb-6">
                                            <h3 className="font-semibold mb-2">{t('Description')}</h3>
                                            <p className="text-gray-600">{room.description}</p>
                                        </div>
                                    )}

                                    {room.amenities && room.amenities.length > 0 && (
                                        <div>
                                            <h3 className="font-semibold mb-3">{t('Amenities')}</h3>
                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                                {room.amenities.map((amenity) => (
                                                    <div key={amenity} className="flex items-center gap-2 text-sm">
                                                        <div className="w-2 h-2 bg-green-500 rounded-full" />
                                                        {t(AMENITY_LABELS[amenity] || amenity)}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {room.bookings && room.bookings.length > 0 && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>{t('Active Bookings')}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {room.bookings.map((booking) => (
                                            <div key={booking.id} className="flex items-center justify-between p-4 border rounded-lg">
                                                <div>
                                                    <p className="font-semibold">{booking.customer.name}</p>
                                                    <p className="text-sm text-gray-500">{booking.customer.email}</p>
                                                    <div className="flex items-center gap-2 mt-2 text-sm">
                                                        <Calendar className="h-4 w-4" />
                                                        <span>{booking.check_in_date} - {booking.check_out_date}</span>
                                                    </div>
                                                </div>
                                                <Badge variant={booking.status === 'confirmed' ? 'default' : 'secondary'}>
                                                    {t(booking.status)}
                                                </Badge>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>{t('Room Details')}</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-start gap-3">
                                    <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                                    <div>
                                        <p className="text-sm text-gray-500">{t('Location')}</p>
                                        <p className="font-medium">{room.warehouse.name}</p>
                                        {room.warehouse.address && (
                                            <p className="text-sm text-gray-600">{room.warehouse.address}</p>
                                        )}
                                    </div>
                                </div>

                                {room.floor && (
                                    <div className="flex items-start gap-3">
                                        <div className="h-5 w-5 text-gray-400 mt-0.5 flex items-center justify-center">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                            </svg>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500">{t('Floor')}</p>
                                            <p className="font-medium">{room.floor}</p>
                                        </div>
                                    </div>
                                )}

                                <div className="flex items-start gap-3">
                                    <Users className="h-5 w-5 text-gray-400 mt-0.5" />
                                    <div>
                                        <p className="text-sm text-gray-500">{t('Maximum Occupancy')}</p>
                                        <p className="font-medium">{room.max_occupancy} {t('guests')}</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3 pt-4 border-t">
                                    <DollarSign className="h-5 w-5 text-green-600 mt-0.5" />
                                    <div>
                                        <p className="text-sm text-gray-500">{t('Price per Night')}</p>
                                        <p className="text-2xl font-bold text-green-600">
                                            {formatCurrency(room.price_per_night)}
                                        </p>
                                    </div>
                                </div>
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

import { Head, router, Link } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, Home, Eye, Edit, Trash2, MoreVertical } from 'lucide-react';
import { 
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatCurrency, getImagePath } from '@/utils/helpers';
import { useFavicon } from '@/hooks/use-favicon';
import { BrandProvider } from '@/contexts/brand-context';
import AuthenticatedLayout from '@/layouts/authenticated-layout';

interface Room {
    id: number;
    room_number: string;
    floor: string;
    price_per_night: number;
    max_occupancy: number;
    status: string;
    image: string;
    room_type: {
        id: number;
        name: string;
        color: string;
    };
    warehouse: {
        id: number;
        name: string;
    };
}

interface Warehouse {
    id: number;
    name: string;
}

interface RoomType {
    id: number;
    name: string;
}

interface IndexProps {
    rooms: {
        data: Room[];
        current_page: number;
        last_page: number;
        total: number;
    };
    warehouses: Warehouse[];
    roomTypes: RoomType[];
}

function IndexContent({ rooms, warehouses, roomTypes }: IndexProps) {
    const { t } = useTranslation();
    useFavicon();
    
    const [filters, setFilters] = useState({
        search: '',
        warehouse: '',
        room_type: '',
        status: '',
    });

    const handleFilter = () => {
        router.get(route('rooms.index'), filters, { preserveState: true });
    };

    const handleDelete = (id: number) => {
        if (confirm(t('Are you sure you want to delete this room?'))) {
            router.delete(route('rooms.destroy', id));
        }
    };

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
            <Head title={t('Rooms')} />

            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">{t('Rooms')}</h1>
                        <p className="text-sm text-gray-500 mt-1">
                            {t('Manage individual rooms and set specific prices')}
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Link href={route('room-types.index')}>
                            <Button variant="outline">
                                {t('Room Types')}
                            </Button>
                        </Link>
                        <Link href={route('pos.index')}>
                            <Button variant="outline">
                                <Home className="h-4 w-4 mr-2" />
                                {t('Back to POS')}
                            </Button>
                        </Link>
                        <Link href={route('rooms.create')}>
                            <Button>
                                <Plus className="h-4 w-4 mr-2" />
                                {t('Add Room')}
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
                                    placeholder={t('Search rooms...')}
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
                            <Select value={filters.room_type || 'all'} onValueChange={(value) => setFilters({ ...filters, room_type: value === 'all' ? '' : value })}>
                                <SelectTrigger>
                                    <SelectValue placeholder={t('All Types')} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">{t('All Types')}</SelectItem>
                                    {roomTypes.map((type) => (
                                        <SelectItem key={type.id} value={type.id.toString()}>
                                            {type.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Button onClick={handleFilter}>{t('Filter')}</Button>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>{t('All Rooms')} ({rooms.total})</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {rooms.data.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                {rooms.data.map((room) => (
                                    <Card key={room.id} className="overflow-hidden">
                                        <div className="aspect-video bg-gray-100 relative">
                                            {room.image ? (
                                                <img
                                                    src={getImagePath(room.image)}
                                                    alt={room.room_number}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="flex items-center justify-center h-full">
                                                    <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                                    </svg>
                                                </div>
                                            )}
                                            <Badge className="absolute top-2 right-2" variant={getStatusBadge(room.status)}>
                                                {t(room.status)}
                                            </Badge>
                                        </div>
                                        <CardContent className="p-4">
                                            <div className="flex items-start justify-between mb-2">
                                                <div>
                                                    <h3 className="font-bold text-lg">{t('Room')} {room.room_number}</h3>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <div
                                                            className="w-3 h-3 rounded"
                                                            style={{ backgroundColor: room.room_type.color }}
                                                        />
                                                        <span className="text-sm text-gray-600">{room.room_type.name}</span>
                                                    </div>
                                                </div>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="sm">
                                                            <MoreVertical className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem asChild>
                                                            <Link href={route('rooms.show', room.id)}>
                                                                <Eye className="h-4 w-4 mr-2" />
                                                                {t('View')}
                                                            </Link>
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem asChild>
                                                            <Link href={route('rooms.edit', room.id)}>
                                                                <Edit className="h-4 w-4 mr-2" />
                                                                {t('Edit')}
                                                            </Link>
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onClick={() => handleDelete(room.id)}
                                                            className="text-red-600"
                                                        >
                                                            <Trash2 className="h-4 w-4 mr-2" />
                                                            {t('Delete')}
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                            <div className="space-y-2 text-sm">
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">{t('Warehouse')}:</span>
                                                    <span className="font-medium">{room.warehouse.name}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">{t('Floor')}:</span>
                                                    <span className="font-medium">{room.floor || '-'}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">{t('Capacity')}:</span>
                                                    <span className="font-medium">{room.max_occupancy} {t('guests')}</span>
                                                </div>
                                                <div className="flex justify-between items-center pt-2 border-t">
                                                    <span className="text-gray-600">{t('Price')}:</span>
                                                    <span className="text-lg font-bold text-green-600">
                                                        {formatCurrency(room.price_per_night)}/night
                                                    </span>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12">
                                <div className="text-gray-400 mb-4">
                                    <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-medium text-gray-900 mb-2">{t('No rooms found')}</h3>
                                <p className="text-gray-500 mb-4">{t('Start by adding your first room')}</p>
                                <Link href={route('rooms.create')}>
                                    <Button>
                                        <Plus className="h-4 w-4 mr-2" />
                                        {t('Add Room')}
                                    </Button>
                                </Link>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {rooms.last_page > 1 && (
                    <div className="flex justify-center gap-2">
                        {Array.from({ length: rooms.last_page }, (_, i) => i + 1).map((page) => (
                            <Button
                                key={page}
                                variant={page === rooms.current_page ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => router.get(route('rooms.index', { page }))}
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

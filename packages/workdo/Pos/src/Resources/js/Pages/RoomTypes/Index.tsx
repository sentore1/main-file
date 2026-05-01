import { Head, router, Link } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
    Table, 
    TableBody, 
    TableCell, 
    TableHead, 
    TableHeader, 
    TableRow 
} from '@/components/ui/table';
import { 
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Plus, Search, MoreVertical, Edit, Trash2, Home } from 'lucide-react';
import { formatCurrency } from '@/utils/helpers';
import { useFavicon } from '@/hooks/use-favicon';
import { BrandProvider } from '@/contexts/brand-context';
import AuthenticatedLayout from '@/layouts/authenticated-layout';

interface RoomType {
    id: number;
    name: string;
    description: string;
    base_price: number;
    color: string;
    is_active: boolean;
    rooms_count: number;
    created_at: string;
}

interface IndexProps {
    roomTypes: {
        data: RoomType[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
}

function IndexContent({ roomTypes }: IndexProps) {
    const { t } = useTranslation();
    useFavicon();
    const [search, setSearch] = useState('');

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(route('room-types.index'), { search }, { preserveState: true });
    };

    const handleDelete = (id: number) => {
        if (confirm(t('Are you sure you want to delete this room type?'))) {
            router.delete(route('room-types.destroy', id));
        }
    };

    return (
        <>
            <Head title={t('Room Types')} />

            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">{t('Room Types')}</h1>
                        <p className="text-sm text-gray-500 mt-1">
                            {t('Manage room categories and set base prices')}
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Link href={route('pos.index')}>
                            <Button variant="outline">
                                <Home className="h-4 w-4 mr-2" />
                                {t('Back to POS')}
                            </Button>
                        </Link>
                        <Link href={route('room-types.create')}>
                            <Button>
                                <Plus className="h-4 w-4 mr-2" />
                                {t('Add Room Type')}
                            </Button>
                        </Link>
                    </div>
                </div>

                <Card>
                    <CardContent className="pt-6">
                        <form onSubmit={handleSearch} className="flex gap-2">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                <Input
                                    placeholder={t('Search room types...')}
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                            <Button type="submit">{t('Search')}</Button>
                        </form>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>
                            {t('All Room Types')} ({roomTypes.total})
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {roomTypes.data.length > 0 ? (
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>{t('Name')}</TableHead>
                                            <TableHead>{t('Description')}</TableHead>
                                            <TableHead>{t('Base Price')}</TableHead>
                                            <TableHead>{t('Rooms')}</TableHead>
                                            <TableHead>{t('Status')}</TableHead>
                                            <TableHead className="text-right">{t('Actions')}</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {roomTypes.data.map((roomType) => (
                                            <TableRow key={roomType.id}>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <div
                                                            className="w-4 h-4 rounded"
                                                            style={{ backgroundColor: roomType.color }}
                                                        />
                                                        <span className="font-medium">{roomType.name}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="max-w-xs truncate">
                                                    {roomType.description || '-'}
                                                </TableCell>
                                                <TableCell>
                                                    <span className="font-semibold text-green-600">
                                                        {formatCurrency(roomType.base_price)}/night
                                                    </span>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="secondary">
                                                        {roomType.rooms_count} {t('rooms')}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={roomType.is_active ? 'default' : 'secondary'}>
                                                        {roomType.is_active ? t('Active') : t('Inactive')}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="sm">
                                                                <MoreVertical className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem asChild>
                                                                <Link href={route('room-types.edit', roomType.id)}>
                                                                    <Edit className="h-4 w-4 mr-2" />
                                                                    {t('Edit')}
                                                                </Link>
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                onClick={() => handleDelete(roomType.id)}
                                                                className="text-red-600"
                                                            >
                                                                <Trash2 className="h-4 w-4 mr-2" />
                                                                {t('Delete')}
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        ) : (
                            <div className="text-center py-12">
                                <div className="text-gray-400 mb-4">
                                    <svg
                                        className="mx-auto h-12 w-12"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                                        />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-medium text-gray-900 mb-2">
                                    {t('No room types found')}
                                </h3>
                                <p className="text-gray-500 mb-4">
                                    {t('Get started by creating your first room type')}
                                </p>
                                <Link href={route('room-types.create')}>
                                    <Button>
                                        <Plus className="h-4 w-4 mr-2" />
                                        {t('Add Room Type')}
                                    </Button>
                                </Link>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {roomTypes.last_page > 1 && (
                    <div className="flex justify-center gap-2">
                        {Array.from({ length: roomTypes.last_page }, (_, i) => i + 1).map((page) => (
                            <Button
                                key={page}
                                variant={page === roomTypes.current_page ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => router.get(route('room-types.index', { page }))}
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

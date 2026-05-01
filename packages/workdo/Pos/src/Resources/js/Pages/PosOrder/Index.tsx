import { useState } from 'react';
import { Head, Link, usePage, router } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DataTable } from '@/components/ui/data-table';
import { SearchInput } from '@/components/ui/search-input';
import { PerPageSelector } from '@/components/ui/per-page-selector';
import { ListGridToggle } from '@/components/ui/list-grid-toggle';
import { FilterButton } from '@/components/ui/filter-button';
import { Pagination } from '@/components/ui/pagination';
import { Eye, ShoppingCart, DollarSign, Download } from 'lucide-react';
import { formatCurrency } from '@/utils/helpers';
import AuthenticatedLayout from '@/layouts/authenticated-layout';
import NoRecordsFound from '@/components/no-records-found';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { usePageButtons } from '@/hooks/usePageButtons';
import PaymentDialog from './PaymentDialog';

interface PosSale {
    id: number;
    sale_number: string;
    customer_id?: number;
    customer?: {
        name: string;
        email: string;
    };
    warehouse?: {
        name: string;
    };
    status: string;
    total: number;
    paid_amount: number;
    balance_due: number;
    tax_amount: number;
    pos_date: string;
    created_at: string;
    items_count: number;
    items?: Array<{
        total_amount: number;
    }>;
}

interface IndexProps {
    sales: {
        data: PosSale[];
        links: any[];
        meta: any;
    };
    auth: {
        user: {
            permissions: string[];
        };
    };
}

export default function Index() {
    const { t } = useTranslation();
    const pageProps = usePage<IndexProps>().props;
    const sales = pageProps.sales || { data: [], links: [], meta: {} };
    const auth = pageProps.auth;
    const urlParams = new URLSearchParams(window.location.search);
    
    // Payment dialog state
    const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
    const [selectedSale, setSelectedSale] = useState<PosSale | null>(null);
    
    // Debug: Log the sales data
    console.log('=== POS ORDERS DEBUG ===');
    console.log('Full pageProps:', pageProps);
    console.log('Sales object:', sales);
    console.log('Sales.data:', sales.data);
    console.log('Sales.data length:', sales.data?.length);
    console.log('Sales.data type:', typeof sales.data);
    console.log('Is Array?:', Array.isArray(sales.data));
    console.log('========================');
    
    const [filters, setFilters] = useState({
        search: urlParams.get('search') || '',
        customer: urlParams.get('customer') || '',
        warehouse: urlParams.get('warehouse') || '',
        status: urlParams.get('status') || 'all',
        date_range: urlParams.get('date_range') || ''
    });
    const [perPage] = useState(urlParams.get('per_page') || '10');
    const [sortField, setSortField] = useState(urlParams.get('sort') || '');
    const [sortDirection, setSortDirection] = useState(urlParams.get('direction') || 'desc');
    const [viewMode, setViewMode] = useState<'list' | 'grid'>(urlParams.get('view') as 'list' | 'grid' || 'list');
    const [showFilters, setShowFilters] = useState(false);

    const pageButtons = usePageButtons('googleDriveBtn', { module: 'POS Order', settingKey: 'GoogleDrive POS Order' });
    const oneDriveButtons = usePageButtons('oneDriveBtn', { module: 'POS Order', settingKey: 'OneDrive POS Order' });

    const handleFilter = () => {
        router.get(route('pos.orders'), {...filters, per_page: perPage, sort: sortField, direction: sortDirection, view: viewMode}, {
            preserveState: true,
            replace: true
        });
    };

    const clearFilters = () => {
        setFilters({ search: '', customer: '', warehouse: '', status: 'all' });
        router.get(route('pos.orders'), {per_page: perPage, view: viewMode});
    };

    const handleSort = (field: string) => {
        const direction = sortField === field && sortDirection === 'asc' ? 'desc' : 'asc';
        setSortField(field);
        setSortDirection(direction);
        router.get(route('pos.orders'), {...filters, per_page: perPage, sort: field, direction, view: viewMode}, {
            preserveState: true,
            replace: true
        });
    };

    const tableColumns = [
        {
            key: 'sale_number',
            header: t('Sale Number'),
            sortable: true,
            render: (value: string, sale: PosSale) =>
                auth.user?.permissions?.includes('view-pos-orders') ? (
                    <span className="text-blue-600 hover:text-blue-700 cursor-pointer" onClick={() => router.get(route('pos.show', sale.id))}>{value}</span>
                ) : (
                    value
                )
        },
        {
            key: 'created_at',
            header: t('Date'),
            sortable: true,
            render: (value: string) => new Date(value).toLocaleDateString()
        },
        {
            key: 'customer',
            header: t('Customer'),
            render: (_: any, sale: PosSale) => sale.customer?.name || t('Walk-in Customer')
        },
        {
            key: 'warehouse',
            header: t('Warehouse'),
            render: (_: any, sale: PosSale) => sale.warehouse?.name
        },
        {
            key: 'items_count',
            header: t('Items'),
            render: (value: number) => (
                <Badge variant="secondary" className="font-medium">{value}</Badge>
            )
        },
        {
            key: 'total',
            header: t('Total'),
            sortable: false,
            render: (_: any, sale: PosSale) => (
                <span className="font-semibold">
                    {formatCurrency(sale.total || 0)}
                </span>
            )
        },
        {
            key: 'paid_amount',
            header: t('Paid'),
            render: (_: any, sale: PosSale) => (
                <span className="text-green-600 font-medium">
                    {formatCurrency(sale.paid_amount || 0)}
                </span>
            )
        },
        {
            key: 'balance_due',
            header: t('Balance'),
            render: (_: any, sale: PosSale) => (
                sale.balance_due > 0 ? (
                    <span className="text-orange-600 font-medium">
                        {formatCurrency(sale.balance_due)}
                    </span>
                ) : (
                    <span className="text-gray-400">-</span>
                )
            )
        },
        {
            key: 'status',
            header: t('Status'),
            render: (value: string) => {
                const statusConfig = {
                    completed: { label: t('Completed'), className: 'bg-green-100 text-green-800 border-green-200' },
                    partial: { label: t('Partial Payment'), className: 'bg-orange-100 text-orange-800 border-orange-200' },
                    pending: { label: t('Pending'), className: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
                };
                const config = statusConfig[value as keyof typeof statusConfig] || statusConfig.pending;
                return (
                    <Badge variant="outline" className={`${config.className} font-medium`}>
                        {config.label}
                    </Badge>
                );
            }
        },
        ...(auth.user?.permissions?.includes('view-pos-orders') ? [{
            key: 'actions',
            header: t('Actions'),
            render: (_: any, sale: PosSale) => (
                <div className="flex gap-1">
                    <TooltipProvider>
                        <Tooltip delayDuration={0}>
                            <TooltipTrigger asChild>
                                <Button variant="ghost" size="sm" onClick={() => router.get(route('pos.show', sale.id))} className="h-8 w-8 p-0 text-green-600 hover:text-green-700">
                                    <Eye className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>{t('View')}</p>
                            </TooltipContent>
                        </Tooltip>
                        {sale.status === 'partial' && sale.balance_due > 0 && auth.user?.permissions?.includes('manage-pos') && (
                            <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                    <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        onClick={() => {
                                            setSelectedSale(sale);
                                            setPaymentDialogOpen(true);
                                        }} 
                                        className="h-8 w-8 p-0 text-orange-600 hover:text-orange-700"
                                    >
                                        <DollarSign className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{t('Pay Balance')}</p>
                                </TooltipContent>
                            </Tooltip>
                        )}
                    </TooltipProvider>
                </div>
            )
        }] : [])
    ];

    return (
        <AuthenticatedLayout
            breadcrumbs={[
                { label: t('POS'), url: route('pos.index') },
                { label: t('POS Orders')}
            ]}
            pageTitle={t('POS Orders')}
            pageActions={
                <div className="flex items-center gap-2">
                    <TooltipProvider>
                        {auth.user?.permissions?.includes('view-pos-orders') && (
                            <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                    <Button 
                                        size="sm" 
                                        variant="outline"
                                        onClick={() => {
                                            const params = new URLSearchParams();
                                            if (filters.customer) params.append('customer', filters.customer);
                                            if (filters.warehouse) params.append('warehouse', filters.warehouse);
                                            if (filters.status && filters.status !== 'all') params.append('status', filters.status);
                                            if (filters.date_range) params.append('date_range', filters.date_range);
                                            if (filters.search) params.append('search', filters.search);
                                            params.append('download', 'pdf');
                                            window.open(route('pos-orders.download-report') + '?' + params.toString(), '_blank');
                                        }}
                                    >
                                        <Download className="h-4 w-4 mr-2" />
                                        {t('Download Report')}
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{t('Download PDF report of filtered orders')}</p>
                                </TooltipContent>
                            </Tooltip>
                        )}
                    </TooltipProvider>
                    {pageButtons.map((button) => (
                        <div key={button.id} >
                            {button.component}
                        </div>
                    ))}
                    {oneDriveButtons.map((button) => (
                        <div key={button.id} >
                            {button.component}
                        </div>
                    ))}
                </div>
            }
        >
            <Head title={t('POS Orders')} /> 
            <Card className="shadow-sm">
                <CardContent className="p-6 border-b bg-gray-50/50">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex-1 max-w-md">
                            <SearchInput
                                value={filters.search}
                                onChange={(value) => setFilters({...filters, search: value})}
                                onSearch={handleFilter}
                                placeholder={t('Search by order number, customer, warehouse...')}
                            />
                        </div>
                        <div className="flex items-center gap-3">
                            <ListGridToggle
                                currentView={viewMode}
                                routeName="pos.orders"
                                filters={{...filters, per_page: perPage}}
                            />
                            <PerPageSelector
                                routeName="pos.orders"
                                filters={{...filters, view: viewMode}}
                            />
                            <div className="relative">
                                <FilterButton
                                    showFilters={showFilters}
                                    onToggle={() => setShowFilters(!showFilters)}
                                />
                                {(() => {
                                    const activeFilters = [filters.customer, filters.warehouse, filters.status !== 'all' ? filters.status : ''].filter(Boolean).length;
                                    return activeFilters > 0 && (
                                        <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                                            {activeFilters}
                                        </span>
                                    );
                                })()}
                            </div>
                        </div>
                    </div>
                </CardContent>

                {/* Advanced Filters */}
                {showFilters && (
                    <CardContent className="p-6 bg-blue-50/30 border-b">
                        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">{t('Customer')}</label>
                                <Input
                                    placeholder={t('Filter by customer')}
                                    value={filters.customer}
                                    onChange={(e) => setFilters({...filters, customer: e.target.value})}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">{t('Warehouse')}</label>
                                <Input
                                    placeholder={t('Filter by warehouse')}
                                    value={filters.warehouse}
                                    onChange={(e) => setFilters({...filters, warehouse: e.target.value})}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">{t('Status')}</label>
                                <Select value={filters.status} onValueChange={(value) => setFilters({...filters, status: value})}>
                                    <SelectTrigger>
                                        <SelectValue placeholder={t('All Status')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">{t('All Status')}</SelectItem>
                                        <SelectItem value="completed">{t('Completed')}</SelectItem>
                                        <SelectItem value="partial">{t('Partial Payment')}</SelectItem>
                                        <SelectItem value="pending">{t('Pending')}</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex items-end gap-2">
                                <Button onClick={handleFilter} size="sm">{t('Apply')}</Button>
                                <Button variant="outline" onClick={clearFilters} size="sm">{t('Clear')}</Button>
                            </div>
                        </div>
                    </CardContent>
                )}

                <CardContent className="p-0">
                    {/* Debug Info */}
                    {process.env.NODE_ENV === 'development' && (
                        <div className="p-4 bg-yellow-50 border-b">
                            <p className="text-xs">Debug: Sales count = {sales.data?.length || 0}</p>
                            <p className="text-xs">View Mode: {viewMode}</p>
                        </div>
                    )}
                    
                    {viewMode === 'list' ? (
                        <div className="overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100 max-h-[70vh] rounded-none w-full">
                            <div className="min-w-[1200px]">
                                {sales.data && sales.data.length > 0 ? (
                                    <DataTable
                                        data={sales.data}
                                        columns={tableColumns}
                                        onSort={handleSort}
                                        sortKey={sortField}
                                        sortDirection={sortDirection as 'asc' | 'desc'}
                                        className="rounded-none"
                                        emptyState={
                                            <NoRecordsFound
                                                icon={ShoppingCart}
                                                title={t('No orders found')}
                                                description={t('Get started by creating your first POS order.')}
                                                hasFilters={!!(filters.search || filters.customer || filters.warehouse || filters.status !== 'all')}
                                                onClearFilters={clearFilters}
                                                createPermission="manage-pos"
                                                onCreateClick={() => router.visit(route('pos.create'))}
                                                createButtonText={t('Create Order')}
                                                className="h-auto"
                                            />
                                        }
                                    />
                                ) : (
                                    <NoRecordsFound
                                        icon={ShoppingCart}
                                        title={t('No orders found')}
                                        description={t('Get started by creating your first POS order.')}
                                        hasFilters={!!(filters.search || filters.customer || filters.warehouse || filters.status !== 'all')}
                                        onClearFilters={clearFilters}
                                        createPermission="manage-pos"
                                        onCreateClick={() => router.visit(route('pos.create'))}
                                        createButtonText={t('Create Order')}
                                        className="h-auto"
                                    />
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="overflow-auto max-h-[70vh] p-4">
                            {sales.data.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                                    {sales.data.map((sale) => (
                                        <Card key={sale.id} className="border border-gray-200 hover:shadow-md transition-shadow">
                                            <div className="p-4">
                                                <div className="flex items-center gap-3 mb-3">
                                                    <div className="p-2 bg-primary/10 rounded-lg">
                                                        <ShoppingCart className="h-5 w-5 text-primary" />
                                                    </div>
                                                    <div className="flex-1">
                                                        {auth.user?.permissions?.includes('view-pos-orders') ? (
                                                            <h3 className="font-semibold text-base text-blue-600 hover:text-blue-700 cursor-pointer" onClick={() => router.get(route('pos.show', sale.id))}>{sale.sale_number}</h3>
                                                        ) : (
                                                            <h3 className="font-semibold text-base text-gray-900">{sale.sale_number}</h3>
                                                        )}
                                                        <p className="text-xs text-gray-500">{new Date(sale.created_at).toLocaleDateString()}</p>
                                                    </div>
                                                    {auth.user?.permissions?.includes('view-pos-orders') && (
                                                        <TooltipProvider>
                                                            <Tooltip delayDuration={300}>
                                                                <TooltipTrigger asChild>
                                                                    <Button variant="ghost" size="sm" onClick={() => router.get(route('pos.show', sale.id))} className="h-8 w-8 p-0 text-green-600">
                                                                        <Eye className="h-4 w-4" />
                                                                    </Button>
                                                                </TooltipTrigger>
                                                                <TooltipContent>
                                                                    <p>{t('View')}</p>
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        </TooltipProvider>
                                                    )}
                                                </div>

                                                {/* Status Badge */}
                                                <div className="mb-3">
                                                    {(() => {
                                                        const statusConfig = {
                                                            completed: { label: t('Completed'), className: 'bg-green-100 text-green-800 border-green-200' },
                                                            partial: { label: t('Partial Payment'), className: 'bg-orange-100 text-orange-800 border-orange-200' },
                                                            pending: { label: t('Pending'), className: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
                                                        };
                                                        const config = statusConfig[sale.status as keyof typeof statusConfig] || statusConfig.pending;
                                                        return (
                                                            <Badge variant="outline" className={`${config.className} font-medium text-xs`}>
                                                                {config.label}
                                                            </Badge>
                                                        );
                                                    })()}
                                                </div>

                                                <div className="space-y-2 mb-3">
                                                    <div>
                                                        <p className="text-xs font-medium text-gray-600 mb-1">{t('Customer')}</p>
                                                        <p className="text-xs text-gray-900 truncate">{sale.customer?.name || t('Walk-in Customer')}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-medium text-gray-600 mb-1">{t('Warehouse')}</p>
                                                        <p className="text-xs text-gray-900 truncate">{sale.warehouse?.name}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-medium text-gray-600 mb-1">{t('Items')}</p>
                                                        <Badge variant="secondary" className="text-xs">{sale.items_count}</Badge>
                                                    </div>
                                                </div>

                                                {/* Payment Info */}
                                                <div className="border-t pt-3 space-y-2">
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-xs font-medium text-gray-600">{t('Total')}:</span>
                                                        <span className="text-sm font-bold text-gray-900">{formatCurrency(sale.total || 0)}</span>
                                                    </div>
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-xs font-medium text-gray-600">{t('Paid')}:</span>
                                                        <span className="text-sm font-semibold text-green-600">{formatCurrency(sale.paid_amount || 0)}</span>
                                                    </div>
                                                    {sale.balance_due > 0 && (
                                                        <div className="flex justify-between items-center">
                                                            <span className="text-xs font-medium text-gray-600">{t('Balance Due')}:</span>
                                                            <span className="text-sm font-semibold text-orange-600">{formatCurrency(sale.balance_due)}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </Card>
                                    ))}
                                </div>
                            ) : (
                                <NoRecordsFound
                                    icon={ShoppingCart}
                                    title={t('No orders found')}
                                    description={t('Get started by creating your first POS order.')}
                                    hasFilters={!!(filters.search || filters.customer || filters.warehouse)}
                                    onClearFilters={clearFilters}
                                    createPermission="manage-pos"
                                    onCreateClick={() => router.visit(route('pos.create'))}
                                    createButtonText={t('Create Order')}
                                />
                            )}
                        </div>
                    )}
                </CardContent>

                <CardContent className="px-4 py-2 border-t bg-gray-50/30">
                    <Pagination
                        data={sales}
                        routeName="pos.orders"
                        filters={{...filters, per_page: perPage, view: viewMode}}
                    />
                </CardContent>
            </Card>

            {/* Payment Dialog */}
            {selectedSale && (
                <PaymentDialog
                    open={paymentDialogOpen}
                    onClose={() => {
                        setPaymentDialogOpen(false);
                        setSelectedSale(null);
                    }}
                    sale={selectedSale}
                />
            )}
        </AuthenticatedLayout>
    );
}
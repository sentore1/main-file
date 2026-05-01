import { useState, useMemo } from 'react';
import { Head, usePage, router } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { useDeleteHandler } from '@/hooks/useDeleteHandler';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PerPageSelector } from '@/components/ui/per-page-selector';
import AuthenticatedLayout from "@/layouts/authenticated-layout";
import { Button } from '@/components/ui/button';
import { Card, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { Plus, FileText, Eye, Trash2, Printer } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { FilterButton } from '@/components/ui/filter-button';
import { Pagination } from "@/components/ui/pagination";
import NoRecordsFound from '@/components/no-records-found';
import { Input } from '@/components/ui/input';

export default function Index() {
    const { t } = useTranslation();
    const { reports, warehouses, auth } = usePage<any>().props;
    const urlParams = useMemo(() => new URLSearchParams(window.location.search), []);

    const [filters, setFilters] = useState({
        report_date: urlParams.get('report_date') || '',
        report_type: urlParams.get('report_type') || '',
        warehouse_id: urlParams.get('warehouse_id') || ''
    });

    const [perPage] = useState(urlParams.get('per_page') || '10');
    const [showFilters, setShowFilters] = useState(false);

    const { deleteState, openDeleteDialog, closeDeleteDialog, confirmDelete } = useDeleteHandler({
        routeName: 'product-service.stock-reports.destroy',
        defaultMessage: t('Are you sure you want to delete this stock report?')
    });

    const handleFilter = () => {
        router.get(route('product-service.stock-reports.index'), {...filters, per_page: perPage}, {
            preserveState: true,
            replace: true
        });
    };

    const clearFilters = () => {
        setFilters({ report_date: '', report_type: '', warehouse_id: '' });
        router.get(route('product-service.stock-reports.index'), {per_page: perPage});
    };

    const tableColumns = [
        {
            key: 'report_date',
            header: t('Date'),
            render: (value: string) => new Date(value).toLocaleDateString()
        },
        {
            key: 'report_type',
            header: t('Type'),
            render: (value: string) => (
                <span className={`px-2 py-1 rounded-full text-sm capitalize ${
                    value === 'opening' ? 'bg-blue-100 text-blue-800' : 'bg-orange-100 text-orange-800'
                }`}>
                    {t(value === 'opening' ? 'Opening Stock' : 'Closing Stock')}
                </span>
            )
        },
        {
            key: 'items_count',
            header: t('Items Count'),
            render: (value: number) => value || 0
        },
        {
            key: 'total_quantity',
            header: t('Total Quantity'),
            render: (value: number) => Math.floor(value) || 0
        },
        {
            key: 'warehouse',
            header: t('Warehouse'),
            render: (value: any) => value?.name || t('All Warehouses')
        },
        {
            key: 'recorded_by',
            header: t('Recorded By'),
            render: (value: any) => value?.name || '-'
        },
        ...(auth.user?.permissions?.some((p: string) => ['view-stock-report', 'delete-stock-report'].includes(p)) ? [{
            key: 'actions',
            header: t('Actions'),
            render: (_: any, report: any) => (
                <div className="flex gap-1">
                    <TooltipProvider>
                        {auth.user?.permissions?.includes('view-stock-report') && (
                            <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                    <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        onClick={() => router.visit(route('product-service.stock-reports.show', {date: report.report_date, type: report.report_type}))} 
                                        className="h-8 w-8 p-0 text-green-600 hover:text-green-700"
                                    >
                                        <Eye className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent><p>{t('View')}</p></TooltipContent>
                            </Tooltip>
                        )}
                        {auth.user?.permissions?.includes('view-stock-report') && (
                            <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                    <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        onClick={() => router.visit(route('product-service.stock-reports.print', {date: report.report_date, type: report.report_type}))} 
                                        className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700"
                                    >
                                        <Printer className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent><p>{t('Print')}</p></TooltipContent>
                            </Tooltip>
                        )}
                    </TooltipProvider>
                </div>
            )
        }] : [])
    ];

    return (
        <TooltipProvider>
            <AuthenticatedLayout
                breadcrumbs={[
                    {label: t('Product & Service')},
                    {label: t('Stock Reports')}
                ]}
                pageTitle={t('Stock Reports')}
                pageActions={
                    auth.user?.permissions?.includes('create-stock-report') && (
                        <Tooltip delayDuration={0}>
                            <TooltipTrigger asChild>
                                <Button size="sm" onClick={() => router.visit(route('product-service.stock-reports.create'))}>
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent><p>{t('Create Report')}</p></TooltipContent>
                        </Tooltip>
                    )
                }
            >
                <Head title={t('Stock Reports')} />

                <Card className="shadow-sm">
                    <CardContent className="p-6 border-b bg-gray-50/50">
                        <div className="flex items-center justify-between gap-4">
                            <div className="flex-1" />
                            <div className="flex items-center gap-3">
                                <PerPageSelector
                                    routeName="product-service.stock-reports.index"
                                    filters={filters}
                                />
                                <div className="relative">
                                    <FilterButton
                                        showFilters={showFilters}
                                        onToggle={() => setShowFilters(!showFilters)}
                                    />
                                    {(() => {
                                        const activeFilters = [filters.report_date, filters.report_type, filters.warehouse_id].filter(Boolean).length;
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

                    {showFilters && (
                        <CardContent className="p-6 bg-blue-50/30 border-b">
                            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">{t('Date')}</label>
                                    <Input 
                                        type="date" 
                                        value={filters.report_date} 
                                        onChange={(e) => setFilters({...filters, report_date: e.target.value})} 
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">{t('Report Type')}</label>
                                    <Select value={filters.report_type} onValueChange={(value) => setFilters({...filters, report_type: value})}>
                                        <SelectTrigger>
                                            <SelectValue placeholder={t('Select type')} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="opening">{t('Opening Stock')}</SelectItem>
                                            <SelectItem value="closing">{t('Closing Stock')}</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">{t('Warehouse')}</label>
                                    <Select value={filters.warehouse_id} onValueChange={(value) => setFilters({...filters, warehouse_id: value})}>
                                        <SelectTrigger>
                                            <SelectValue placeholder={t('All Warehouses')} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="">{t('All Warehouses')}</SelectItem>
                                            {warehouses.map((warehouse: any) => (
                                                <SelectItem key={warehouse.id} value={warehouse.id.toString()}>
                                                    {warehouse.name}
                                                </SelectItem>
                                            ))}
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
                        <div className="overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100 max-h-[70vh] rounded-none w-full">
                            <div className="min-w-[800px]">
                                <DataTable
                                    data={reports.data}
                                    columns={tableColumns}
                                    className="rounded-none"
                                    emptyState={
                                        <NoRecordsFound
                                            icon={FileText}
                                            title={t('No stock reports found')}
                                            description={t('Create your first stock report to track inventory.')}
                                            hasFilters={!!(filters.report_date || filters.report_type || filters.warehouse_id)}
                                            onClearFilters={clearFilters}
                                            createPermission="create-stock-report"
                                            onCreateClick={() => router.visit(route('product-service.stock-reports.create'))}
                                            createButtonText={t('Create Report')}
                                            className="h-auto"
                                        />
                                    }
                                />
                            </div>
                        </div>
                    </CardContent>

                    {reports.data.length > 0 && (
                        <CardContent className="p-4 border-t">
                            <Pagination 
                                data={reports}
                                routeName="product-service.stock-reports.index"
                                filters={{...filters, per_page: perPage}}
                            />
                        </CardContent>
                    )}
                </Card>

                <ConfirmationDialog
                    open={deleteState.isOpen}
                    onClose={closeDeleteDialog}
                    onConfirm={confirmDelete}
                    title={t('Delete Stock Report')}
                    description={deleteState.message}
                    isLoading={deleteState.isDeleting}
                />
            </AuthenticatedLayout>
        </TooltipProvider>
    );
}

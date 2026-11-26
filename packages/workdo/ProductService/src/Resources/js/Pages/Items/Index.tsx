import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Head, usePage, router } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { useDeleteHandler } from '@/hooks/useDeleteHandler';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PerPageSelector } from '@/components/ui/per-page-selector';
import AuthenticatedLayout from "@/layouts/authenticated-layout";
import { Button } from '@/components/ui/button';
import { Card, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Package, Edit, Trash2, Eye, Image, Download, Upload, FileDown, AlertTriangle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { FilterButton } from '@/components/ui/filter-button';
import { Pagination } from "@/components/ui/pagination";
import { SearchInput } from "@/components/ui/search-input";
import { ListGridToggle } from '@/components/ui/list-grid-toggle';
import NoRecordsFound from '@/components/no-records-found';
import { formatCurrency, getImagePath } from '@/utils/helpers';
import { Item, ItemsIndexProps, ItemFilters } from './types';
import { usePageButtons } from '@/hooks/usePageButtons';

export default function Index() {
    const { t } = useTranslation();
    const { items, categories, auth } = usePage<ItemsIndexProps>().props;
    const urlParams = useMemo(() => new URLSearchParams(window.location.search), []);

    // Item types same as Create page
    const itemTypes = ['product', 'service', 'part'];

    const [filters, setFilters] = useState<ItemFilters>({
        name: urlParams.get('name') || '',
        type: urlParams.get('type') || '',
        category_id: urlParams.get('category_id') || ''
    });

    const [perPage] = useState(urlParams.get('per_page') || '10');
    const [sortField, setSortField] = useState(urlParams.get('sort') || '');
    const [sortDirection, setSortDirection] = useState(urlParams.get('direction') || 'asc');


    const [viewMode, setViewMode] = useState<'list' | 'grid'>(urlParams.get('view') as 'list' | 'grid' || 'list');
    const [showFilters, setShowFilters] = useState(false);
    const importFileRef = useRef<HTMLInputElement>(null);
    const [importing, setImporting] = useState(false);

    // --- Conflict resolution modal state ---
    type ConflictRow = {
        row: number;
        name: string; sku: string; type: string;
        sale_price: string; purchase_price: string;
        description: string; unit: string; category_name: string;
        quantity: string; warehouse_id: string;
        existing_id: number; existing_name: string; existing_sku: string;
        existing_sale: string; existing_purchase: string;
        existing_unit: string; existing_category: string; existing_quantity: number;
        resolution: 'skip' | 'update';
    };
    const [pendingFile, setPendingFile]       = useState<File | null>(null);
    const [conflicts, setConflicts]           = useState<ConflictRow[]>([]);
    const [newRowCount, setNewRowCount]       = useState(0);
    const [showConflictModal, setShowConflictModal] = useState(false);
    const [confirmingImport, setConfirmingImport]   = useState(false);

    const pageButtons = usePageButtons('googleDriveBtn', { module: 'Products', settingKey: 'GoogleDrive Products' });
    const oneDriveButtons = usePageButtons('oneDriveBtn', { module: 'Products', settingKey: 'OneDrive Products' });
    const hubspotButtons = usePageButtons('hubspotBtn', { module: 'Products', settingKey: 'HubSpot Products' });
    const dropboxBtn = usePageButtons('dropboxBtn', { module: 'Product & Service Products', settingKey: 'Dropbox Product & Service Products' });

    const { deleteState, openDeleteDialog, closeDeleteDialog, confirmDelete } = useDeleteHandler({
        routeName: 'product-service.items.destroy',
        defaultMessage: t('Are you sure you want to delete this item?')
    });
    const handleFilter = () => {
        router.get(route('product-service.items.index'), {...filters, per_page: perPage, sort: sortField, direction: sortDirection, view: viewMode}, {
            preserveState: true,
            replace: true
        });
    };

    const handleSort = (field: string) => {
        const direction = sortField === field && sortDirection === 'asc' ? 'desc' : 'asc';
        setSortField(field);
        setSortDirection(direction);
        router.get(route('product-service.items.index'), {...filters, per_page: perPage, sort: field, direction, view: viewMode}, {
            preserveState: true,
            replace: true
        });
    };

    const clearFilters = () => {
        setFilters({ name: '', type: '', category_id: '' });
        router.get(route('product-service.items.index'), {per_page: perPage, view: viewMode});
    };

    const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        // Reset input so the same file can be re-selected later
        if (importFileRef.current) importFileRef.current.value = '';

        setImporting(true);

        try {
            const csrf = (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content ?? '';
            const formData = new FormData();
            formData.append('file', file);

            const res = await fetch(route('product-service.items.preview-import'), {
                method: 'POST',
                headers: { 'X-CSRF-TOKEN': csrf, 'X-Requested-With': 'XMLHttpRequest', 'Accept': 'application/json' },
                body: formData,
            });

            const json = await res.json();

            if (!res.ok) {
                // Validation / permission error
                alert(json.error ?? t('Import failed. Please check the file format.'));
                setImporting(false);
                return;
            }

            const conflictRows: ConflictRow[] = (json.conflicts ?? []).map((c: any) => ({
                ...c,
                resolution: 'skip' as const,
            }));

            if (conflictRows.length > 0) {
                // Show the modal so the user can decide what to do with each conflict
                setPendingFile(file);
                setConflicts(conflictRows);
                setNewRowCount((json.new_rows ?? []).length);
                setImporting(false);
                setShowConflictModal(true);
            } else {
                // No conflicts — import directly
                const fd = new FormData();
                fd.append('file', file);
                router.post(route('product-service.items.bulk-import'), fd, {
                    forceFormData: true,
                    onFinish: () => setImporting(false),
                });
            }
        } catch {
            alert(t('Network error. Please try again.'));
            setImporting(false);
        }
    };

    const setConflictResolution = (row: number, resolution: 'skip' | 'update') => {
        setConflicts(prev => prev.map(c => c.row === row ? { ...c, resolution } : c));
    };

    const setAllConflictResolutions = (resolution: 'skip' | 'update') => {
        setConflicts(prev => prev.map(c => ({ ...c, resolution })));
    };

    const handleConfirmImport = () => {
        if (!pendingFile) return;
        setConfirmingImport(true);
        const fd = new FormData();
        fd.append('file', pendingFile);
        fd.append('conflict_resolutions', JSON.stringify(
            conflicts.map(c => ({ row: c.row, existing_id: c.existing_id, resolution: c.resolution }))
        ));
        router.post(route('product-service.items.bulk-import'), fd, {
            forceFormData: true,
            onFinish: () => {
                setConfirmingImport(false);
                setShowConflictModal(false);
                setPendingFile(null);
                setConflicts([]);
            },
        });
    };



    const tableColumns = [
        {
            key: 'image',
            header: t('Image'),
            render: (value: string) => {
                if (!value) {
                    return (
                        <div className="w-12 h-12 bg-gray-100 rounded-md border flex items-center justify-center">
                            <Image className="w-6 h-6 text-gray-400" />
                        </div>
                    );
                }
                const isImage = /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(value);
                let imageUrl = getImagePath(value);
                return isImage ? (
                    <div className="relative w-12 h-12">
                        <img
                            src={imageUrl}
                            alt="Image"
                            className="w-12 h-12 object-cover rounded-md border hover:scale-110 transition-transform cursor-pointer"
                            onClick={() => window.open(imageUrl, '_blank')}
                            onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                const fallback = target.nextElementSibling as HTMLElement;
                                if (fallback) fallback.classList.remove('hidden');
                            }}
                        />
                        <div className="hidden w-12 h-12 bg-gray-100 rounded-md border flex items-center justify-center">
                            <Image className="w-6 h-6 text-gray-400" />
                        </div>
                    </div>
                ) : (
                    <div className="w-12 h-12 bg-gray-100 rounded-md border flex items-center justify-center cursor-pointer hover:bg-gray-200 transition-colors" onClick={() => {
                        const link = document.createElement('a');
                        link.href = getImagePath(value);
                        link.download = value.split('/').pop() || 'file';
                        link.click();
                    }}>
                        <Download className="w-6 h-6 text-gray-600" />
                    </div>
                );
            }
        },
        {
            key: 'name',
            header: t('Name'),
            sortable: true
        },
        {
            key: 'sku',
            header: t('SKU'),
            sortable: true
        },
        {
            key: 'sale_price',
            header: t('Sale Price'),
            sortable: true,
            render: (value: number) => value ? formatCurrency(value) : '-'
        },
        {
            key: 'purchase_price',
            header: t('Purchase Price'),
            sortable: true,
            render: (value: number) => value ? formatCurrency(value) : '-'
        },
        {
            key: 'category_id',
            header: t('Category'),
            render: (value: number, item: Item) => item.category?.name || '-'
        },
        {
            key: 'unit',
            header: t('Unit'),
            render: (value: string, item: Item) => item.unit_relation?.unit_name || '-'
        },
        {
            key: 'total_quantity',
            header: t('Quantity'),
            sortable: false,
            render: (value: number) => Math.floor(value) || 0
        },
        {
            key: 'type',
            header: t('Type'),
            sortable: true,
            render: (value: string) => (
                <span className="px-2 py-1 rounded-full text-sm bg-green-100 text-green-800 capitalize">
                    {t(value)}
                </span>
            )
        },
        ...(auth.user?.permissions?.some((p: string) => ['view-product-service-item', 'edit-product-service-item', 'delete-product-service-item'].includes(p)) ? [{
            key: 'actions',
            header: t('Actions'),
            render: (_: any, item: Item) => (
                <div className="flex gap-1">
                    <TooltipProvider>
                        {auth.user?.permissions?.includes('view-product-service-item') && (
                            <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="sm" onClick={() => router.visit(route('product-service.items.show', item.id))} className="h-8 w-8 p-0 text-green-600 hover:text-green-700">
                                        <Eye className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{t('View')}</p>
                                </TooltipContent>
                            </Tooltip>
                        )}
                        {auth.user?.permissions?.includes('edit-product-service-item') && (
                            <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="sm" onClick={() => router.visit(route('product-service.items.edit', item.id))} className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700">
                                        <Edit className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{t('Edit')}</p>
                                </TooltipContent>
                            </Tooltip>
                        )}
                        {auth.user?.permissions?.includes('delete-product-service-item') && (
                            <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => openDeleteDialog(item.id)}
                                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{t('Delete')}</p>
                                </TooltipContent>
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
                    {label: t('Items')}
                ]}
                pageTitle={t('Manage Items')}
                pageActions={
                    <div className="flex gap-2">
                        {pageButtons.map((button) => (
                            <div key={button.id}>{button.component}</div>
                        ))}
                        {oneDriveButtons.map((button) => (
                            <div key={button.id}>{button.component}</div>
                        ))}
                        {dropboxBtn.map((button) => (
                            <div key={button.id}>{button.component}</div>
                        ))}
                        {hubspotButtons.map((button) => (
                            <div key={button.id}>{button.component}</div>
                        ))}
                        {auth.user?.permissions?.includes('manage-stock') && (
                            <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                    <Button variant="outline" size="sm" onClick={() => router.visit(route('product-service.stock.index'))}>
                                        <Package className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{t('Add Stock')}</p>
                                </TooltipContent>
                            </Tooltip>
                        )}
                        {auth.user?.permissions?.includes('create-product-service-item') && (
                            <>
                                {/* Hidden file input for CSV import */}
                                <input
                                    ref={importFileRef}
                                    type="file"
                                    accept=".csv,text/csv"
                                    className="hidden"
                                    onChange={handleImportFile}
                                />
                                {/* Download Template */}
                                <Tooltip delayDuration={0}>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => window.location.href = route('product-service.items.import-template')}
                                        >
                                            <FileDown className="h-4 w-4" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>{t('Download Import Template')}</p>
                                    </TooltipContent>
                                </Tooltip>
                                {/* Import CSV */}
                                <Tooltip delayDuration={0}>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            disabled={importing}
                                            onClick={() => importFileRef.current?.click()}
                                        >
                                            <Upload className="h-4 w-4" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>{importing ? t('Importing...') : t('Import from CSV')}</p>
                                    </TooltipContent>
                                </Tooltip>
                            </>
                        )}
                        {auth.user?.permissions?.includes('create-product-service-item') && (
                            <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                    <Button size="sm" onClick={() => router.visit(route('product-service.items.create'))}>
                                        <Plus className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{t('Create')}</p>
                                </TooltipContent>
                            </Tooltip>
                        )}
                    </div>
                }
            >
            <Head title={t('Items')} />

            <Card className="shadow-sm">
                {/* Search & Controls Header */}
                <CardContent className="p-6 border-b bg-gray-50/50">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex-1 max-w-md">
                            <SearchInput
                                value={filters.name}
                                onChange={(value) => setFilters({...filters, name: value})}
                                onSearch={handleFilter}
                                placeholder={t('Search items...')}
                            />
                        </div>
                        <div className="flex items-center gap-3">
                            <ListGridToggle
                                currentView={viewMode}
                                routeName="product-service.items.index"
                                filters={{...filters, per_page: perPage}}
                            />
                            <PerPageSelector
                                routeName="product-service.items.index"
                                filters={{...filters, view: viewMode}}
                            />
                            <div className="relative">
                                <FilterButton
                                    showFilters={showFilters}
                                    onToggle={() => setShowFilters(!showFilters)}
                                />
                                {(() => {
                                    const activeFilters = [filters.type, filters.category_id].filter(Boolean).length;
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
                                <label className="block text-sm font-medium text-gray-700 mb-2">{t('Item Type')}</label>
                                <Select value={filters.type} onValueChange={(value) => setFilters({...filters, type: value})}>
                                    <SelectTrigger>
                                        <SelectValue placeholder={t('Filter by item type')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {itemTypes.map((type) => (
                                            <SelectItem key={type} value={type}>
                                                {t(type)}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">{t('Category')}</label>
                                <Select value={filters.category_id} onValueChange={(value) => setFilters({...filters, category_id: value})}>
                                    <SelectTrigger>
                                        <SelectValue placeholder={t('Filter by category')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {categories.map((category) => (
                                            <SelectItem key={category.id} value={category.id.toString()}>
                                                {category.name}
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

                {/* Table Content */}
                <CardContent className="p-0">
                    {viewMode === 'list' ? (
                        <div className="overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100 max-h-[70vh] rounded-none w-full">
                            <div className="min-w-[800px]">
                                <DataTable
                                    data={items.data}
                                    columns={tableColumns}
                                    onSort={handleSort}
                                    sortKey={sortField}
                                    sortDirection={sortDirection as 'asc' | 'desc'}
                                    className="rounded-none"
                                    emptyState={
                                        <NoRecordsFound
                                            icon={Package}
                                            title={t('No items found')}
                                            description={t('Get started by creating your first item.')}
                                            hasFilters={!!(filters.name || filters.type || filters.category_id)}
                                            onClearFilters={clearFilters}
                                            createPermission="create-product-service-item"
                                            onCreateClick={() => router.visit(route('product-service.items.create'))}
                                            createButtonText={t('Create Item')}
                                            className="h-auto"
                                        />
                                    }
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="overflow-auto max-h-[70vh] p-6">
                            {items.data.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                                    {items.data.map((item) => (
                                        <Card key={item.id} className="border border-gray-200 h-full flex flex-col">
                                            <div className="p-4 flex flex-col flex-1">
                                                <div className="flex items-center gap-3 mb-3">
                                                {item.image ? (
                                                    <div className="relative w-12 h-12">
                                                        <img
                                                            src={getImagePath(item.image)}
                                                            alt={item.name}
                                                            className="w-12 h-12 object-cover rounded cursor-pointer hover:scale-110 transition-transform"
                                                            onClick={() => window.open(getImagePath(item.image), '_blank')}
                                                            onError={(e) => {
                                                                const target = e.target as HTMLImageElement;
                                                                target.style.display = 'none';
                                                                const fallback = target.nextElementSibling as HTMLElement;
                                                                if (fallback) fallback.classList.remove('hidden');
                                                            }}
                                                        />
                                                        <div className="hidden w-12 h-12 bg-gray-100 rounded-md border flex items-center justify-center">
                                                            <Image className="w-6 h-6 text-gray-400" />
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="w-12 h-12 bg-gray-100 rounded-md border flex items-center justify-center">
                                                        <Image className="w-6 h-6 text-gray-400" />
                                                    </div>
                                                )}
                                                    <div className="flex-1">
                                                        <h3 className="font-semibold text-base text-gray-900">{item.name}</h3>
                                                    </div>
                                                </div>

                                                <div className="space-y-2 mb-3 flex-1">
                                                    {item.sku && (
                                                        <div className="flex justify-between">
                                                            <span className="text-sm text-gray-600">{t('SKU')}</span>
                                                            <span className="text-sm font-medium">{item.sku}</span>
                                                        </div>
                                                    )}
                                                    {item.sale_price && (
                                                        <div className="flex justify-between">
                                                            <span className="text-sm text-gray-600">{t('Sale Price')}</span>
                                                            <span className="text-sm font-medium">{formatCurrency(item.sale_price)}</span>
                                                        </div>
                                                    )}
                                                    {item.purchase_price && (
                                                        <div className="flex justify-between">
                                                            <span className="text-sm text-gray-600">{t('Purchase Price')}</span>
                                                            <span className="text-sm font-medium">{formatCurrency(item.purchase_price)}</span>
                                                        </div>
                                                    )}
                                                    <div className="flex justify-between">
                                                        <span className="text-sm text-gray-600">{t('Quantity')}</span>
                                                        <span className="text-sm font-medium">{Math.floor(item.total_quantity) || 0}</span>
                                                    </div>
                                                    {item.category && (
                                                        <div className="flex justify-between">
                                                            <span className="text-sm text-gray-600">{t('Category')}</span>
                                                            <span className="text-sm font-medium">{item.category.name}</span>
                                                        </div>
                                                    )}
                                                    {item.unit_relation && (
                                                        <div className="flex justify-between">
                                                            <span className="text-sm text-gray-600">{t('Unit')}</span>
                                                            <span className="text-sm font-medium">{item.unit_relation.unit_name}</span>
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="flex items-center justify-between pt-3 border-t">
                                                    <span className="px-2 py-1 rounded-full text-sm bg-green-100 text-green-800 capitalize">
                                                        {t(item.type)}
                                                    </span>
                                                    <div className="flex gap-1">
                                                <TooltipProvider>
                                                    {auth.user?.permissions?.includes('view-product-service-item') && (
                                                        <Tooltip delayDuration={300}>
                                                            <TooltipTrigger asChild>
                                                                <Button variant="ghost" size="sm" onClick={() => router.visit(route('product-service.items.show', item.id))} className="h-9 w-9 p-0 text-green-600 hover:text-green-700 hover:bg-green-50">
                                                                    <Eye className="h-4 w-4" />
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent><p>{t('View')}</p></TooltipContent>
                                                        </Tooltip>
                                                    )}
                                                    {auth.user?.permissions?.includes('edit-product-service-item') && (
                                                        <Tooltip delayDuration={300}>
                                                            <TooltipTrigger asChild>
                                                                <Button variant="ghost" size="sm" onClick={() => router.visit(route('product-service.items.edit', item.id))} className="h-9 w-9 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                                                                    <Edit className="h-4 w-4" />
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent><p>{t('Edit')}</p></TooltipContent>
                                                        </Tooltip>
                                                    )}
                                                    {auth.user?.permissions?.includes('delete-product-service-item') && (
                                                        <Tooltip delayDuration={300}>
                                                            <TooltipTrigger asChild>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => openDeleteDialog(item.id)}
                                                                    className="h-9 w-9 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent><p>{t('Delete')}</p></TooltipContent>
                                                        </Tooltip>
                                                    )}
                                                        </TooltipProvider>
                                                    </div>
                                                </div>
                                            </div>
                                        </Card>
                                    ))}
                                </div>
                            ) : (
                                <NoRecordsFound
                                    icon={Package}
                                    title={t('No items found')}
                                    description={t('Get started by creating your first item.')}
                                    hasFilters={!!(filters.name || filters.type || filters.category_id)}
                                    onClearFilters={clearFilters}
                                    createPermission="create-product-service-item"
                                    onCreateClick={() => router.visit(route('product-service.items.create'))}
                                    createButtonText={t('Create Item')}
                                    className="h-auto"
                                />
                            )}
                        </div>
                    )}
                </CardContent>

                {/* Pagination Footer */}
                <CardContent className="px-4 py-2 border-t bg-gray-50/30">
                    <Pagination
                        data={items}
                        routeName="product-service.items.index"
                        filters={{...filters, per_page: perPage, view: viewMode}}
                    />
                </CardContent>
            </Card>

            <ConfirmationDialog
                open={deleteState.isOpen}
                onOpenChange={closeDeleteDialog}
                title={t('Delete Item')}
                message={deleteState.message}
                confirmText={t('Delete')}
                onConfirm={confirmDelete}
                variant="destructive"
            />

            {/* ── Conflict Resolution Modal ── */}
            <Dialog open={showConflictModal} onOpenChange={(open) => !confirmingImport && setShowConflictModal(open)}>
                <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-orange-600">
                            <AlertTriangle className="h-5 w-5" />
                            {t('Duplicate Items Found')}
                        </DialogTitle>
                    </DialogHeader>

                    <div className="text-sm text-muted-foreground px-1">
                        <p>
                            {newRowCount > 0 && <span className="text-green-600 font-medium">{newRowCount} {t('new item(s) will be created.')}</span>}
                            {newRowCount > 0 && conflicts.length > 0 && ' '}
                            {conflicts.length > 0 && (
                                <span className="text-orange-600 font-medium">
                                    {conflicts.length} {t('item(s) already exist. Choose what to do with each:')}
                                </span>
                            )}
                        </p>
                    </div>

                    {/* Global actions */}
                    <div className="flex items-center gap-2 px-1 py-2 border-b">
                        <span className="text-xs text-muted-foreground mr-2">{t('Apply to all')}:</span>
                        <Button size="sm" variant="outline" onClick={() => setAllConflictResolutions('skip')}>
                            {t('Skip All')}
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setAllConflictResolutions('update')}>
                            {t('Update All')}
                        </Button>
                    </div>

                    {/* Conflicts table */}
                    <div className="overflow-y-auto flex-1 px-1">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 sticky top-0">
                                <tr>
                                    <th className="text-left px-2 py-2 font-medium text-gray-600">#</th>
                                    <th className="text-left px-2 py-2 font-medium text-gray-600">{t('Field')}</th>
                                    <th className="text-left px-2 py-2 font-medium text-gray-600">{t('CSV Value')}</th>
                                    <th className="text-left px-2 py-2 font-medium text-gray-600">{t('Current Value')}</th>
                                    <th className="text-center px-2 py-2 font-medium text-gray-600">{t('Action')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {conflicts.map((c, ci) => (
                                    <React.Fragment key={c.row}>
                                        {/* Row header */}
                                        <tr className={ci > 0 ? 'border-t-2 border-gray-300' : ''}>
                                            <td className="px-2 pt-3 pb-1 text-gray-400 text-xs align-top" rowSpan={6}>#{c.row}</td>
                                            <td className="px-2 pt-3 pb-1 text-gray-500">{t('Name / SKU')}</td>
                                            <td className="px-2 pt-3 pb-1 font-medium">
                                                {c.name}
                                                {c.sku && <span className="ml-1 text-xs text-gray-400">({c.sku})</span>}
                                            </td>
                                            <td className="px-2 pt-3 pb-1 text-gray-600">
                                                {c.existing_name}
                                                {c.existing_sku && <span className="ml-1 text-xs text-gray-400">({c.existing_sku})</span>}
                                            </td>
                                            <td className="px-2 pt-3 pb-1 text-center align-top" rowSpan={6}>
                                                <div className="flex flex-col gap-1 items-center">
                                                    <button
                                                        onClick={() => setConflictResolution(c.row, 'skip')}
                                                        className={`px-3 py-1 rounded text-xs font-medium transition-colors w-16 ${
                                                            c.resolution === 'skip'
                                                                ? 'bg-gray-600 text-white'
                                                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                        }`}
                                                    >{t('Skip')}</button>
                                                    <button
                                                        onClick={() => setConflictResolution(c.row, 'update')}
                                                        className={`px-3 py-1 rounded text-xs font-medium transition-colors w-16 ${
                                                            c.resolution === 'update'
                                                                ? 'bg-blue-600 text-white'
                                                                : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                                                        }`}
                                                    >{t('Update')}</button>
                                                </div>
                                            </td>
                                        </tr>
                                        <tr className={c.resolution === 'update' ? 'bg-blue-50/40' : ''}>
                                            <td className="px-2 py-1 text-gray-500">{t('Sale Price')}</td>
                                            <td className="px-2 py-1 font-medium">{formatCurrency(parseFloat(c.sale_price) || 0)}</td>
                                            <td className="px-2 py-1 text-gray-600">{formatCurrency(parseFloat(c.existing_sale) || 0)}</td>
                                        </tr>
                                        <tr className={c.resolution === 'update' ? 'bg-blue-50/40' : ''}>
                                            <td className="px-2 py-1 text-gray-500">{t('Category')}</td>
                                            <td className="px-2 py-1 font-medium">{c.category_name || <span className="text-gray-300">—</span>}</td>
                                            <td className="px-2 py-1 text-gray-600">{c.existing_category || <span className="text-gray-300">—</span>}</td>
                                        </tr>
                                        <tr className={c.resolution === 'update' ? 'bg-blue-50/40' : ''}>
                                            <td className="px-2 py-1 text-gray-500">{t('Unit')}</td>
                                            <td className="px-2 py-1 font-medium">{c.unit || <span className="text-gray-300">—</span>}</td>
                                            <td className="px-2 py-1 text-gray-600">{c.existing_unit || <span className="text-gray-300">—</span>}</td>
                                        </tr>
                                        <tr className={c.resolution === 'update' ? 'bg-blue-50/40' : ''}>
                                            <td className="px-2 py-1 text-gray-500">{t('Quantity')}</td>
                                            <td className="px-2 py-1 font-medium">{c.quantity !== '' ? c.quantity : <span className="text-gray-300">—</span>}</td>
                                            <td className="px-2 py-1 text-gray-600">{c.existing_quantity ?? 0}</td>
                                        </tr>
                                        <tr className={c.resolution === 'update' ? 'bg-blue-50/40' : ''}>
                                            <td className="px-2 pb-3 pt-1 text-gray-500">{t('Description')}</td>
                                            <td className="px-2 pb-3 pt-1 font-medium text-xs text-gray-600 max-w-[160px] truncate">{c.description || <span className="text-gray-300">—</span>}</td>
                                            <td className="px-2 pb-3 pt-1 text-gray-500 text-xs">—</td>
                                        </tr>
                                    </React.Fragment>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <DialogFooter className="border-t pt-4 gap-2">
                        <Button
                            variant="outline"
                            onClick={() => { setShowConflictModal(false); setPendingFile(null); setConflicts([]); }}
                            disabled={confirmingImport}
                        >
                            {t('Cancel')}
                        </Button>
                        <Button onClick={handleConfirmImport} disabled={confirmingImport}>
                            {confirmingImport ? t('Importing...') : t('Confirm Import')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            </AuthenticatedLayout>
        </TooltipProvider>
    );
}

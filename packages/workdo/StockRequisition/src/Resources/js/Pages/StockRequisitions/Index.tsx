import React from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import AuthenticatedLayout from '@/layouts/authenticated-layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/ui/data-table';
import { formatDate } from '@/utils/helpers';
import { Plus, Eye, Edit, Trash, CheckCircle, XCircle } from 'lucide-react';

interface StockRequisition {
    id: number;
    requisition_number: string;
    requisition_date: string;
    required_date: string;
    requested_by: { id: number; name: string };
    warehouse: { id: number; name: string };
    department: string;
    priority: 'low' | 'normal' | 'urgent';
    status: 'draft' | 'pending' | 'approved' | 'rejected' | 'fulfilled' | 'cancelled';
    items_count: number;
}

interface IndexProps {
    requisitions: {
        data: StockRequisition[];
        links: any;
        meta: any;
    };
    warehouses: Array<{id: number; name: string}>;
    filters: any;
}

export default function Index({ requisitions, warehouses, filters }: IndexProps) {
    const { t } = useTranslation();

    const getStatusBadge = (status: string) => {
        const variants: Record<string, any> = {
            draft: 'secondary',
            pending: 'warning',
            approved: 'info',
            rejected: 'destructive',
            fulfilled: 'success',
            cancelled: 'secondary'
        };
        return <Badge variant={variants[status] || 'default'}>{t(status)}</Badge>;
    };

    const getPriorityBadge = (priority: string) => {
        const variants: Record<string, any> = {
            low: 'secondary',
            normal: 'default',
            urgent: 'destructive'
        };
        return <Badge variant={variants[priority] || 'default'}>{t(priority)}</Badge>;
    };

    const columns = [
        {
            key: 'requisition_number',
            header: t('Requisition #'),
            render: (value: string, row: StockRequisition) => (
                <Link href={route('stock-requisitions.show', row.id)} className="text-primary hover:underline font-medium">
                    {row.requisition_number}
                </Link>
            )
        },
        {
            key: 'requisition_date',
            header: t('Date'),
            render: (value: string) => formatDate(value)
        },
        {
            key: 'required_date',
            header: t('Required By'),
            render: (value: string) => formatDate(value)
        },
        {
            key: 'requested_by',
            header: t('Requested By'),
            render: (value: any) => value?.name || '-'
        },
        {
            key: 'warehouse',
            header: t('Warehouse'),
            render: (value: any) => value?.name || '-'
        },
        {
            key: 'department',
            header: t('Department'),
            render: (value: string) => value || '-'
        },
        {
            key: 'priority',
            header: t('Priority'),
            render: (value: string) => getPriorityBadge(value)
        },
        {
            key: 'status',
            header: t('Status'),
            render: (value: string) => getStatusBadge(value)
        },
        {
            key: 'items_count',
            header: t('Items'),
            render: (value: number) => <span className="text-muted-foreground">{value}</span>
        },
        {
            key: 'actions',
            header: t('Actions'),
            render: (value: any, row: StockRequisition) => (
                <div className="flex gap-2">
                    <Button size="sm" variant="ghost" asChild>
                        <Link href={route('stock-requisitions.show', row.id)}>
                            <Eye className="h-4 w-4" />
                        </Link>
                    </Button>
                    {['draft', 'pending'].includes(row.status) && (
                        <Button size="sm" variant="ghost" asChild>
                            <Link href={route('stock-requisitions.edit', row.id)}>
                                <Edit className="h-4 w-4" />
                            </Link>
                        </Button>
                    )}
                </div>
            )
        }
    ];

    return (
        <AuthenticatedLayout
            breadcrumbs={[{label: t('Stock Requisitions')}]}
            pageTitle={t('Stock Requisitions')}
            pageActions={
                <Button asChild>
                    <Link href={route('stock-requisitions.create')}>
                        <Plus className="h-4 w-4 mr-2" />
                        {t('New Requisition')}
                    </Link>
                </Button>
            }
        >
            <Head title={t('Stock Requisitions')} />

            <DataTable
                columns={columns}
                data={requisitions.data}
                pagination={requisitions}
                searchable
                searchPlaceholder={t('Search requisitions...')}
            />
        </AuthenticatedLayout>
    );
}

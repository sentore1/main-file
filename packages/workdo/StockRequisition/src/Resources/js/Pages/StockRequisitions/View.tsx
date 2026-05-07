import React from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import AuthenticatedLayout from '@/layouts/authenticated-layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDate, formatCurrency } from '@/utils/helpers';
import { Edit, CheckCircle, XCircle, Package, Calendar, User, Building } from 'lucide-react';

interface ViewProps {
    requisition: any;
    permissions: {
        canApprove: boolean;
        canEdit: boolean;
        canFulfill: boolean;
        canCancel: boolean;
    };
}

export default function View({ requisition, permissions }: ViewProps) {
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

    const handleApprove = () => {
        if (confirm(t('Are you sure you want to approve this requisition?'))) {
            router.post(route('stock-requisitions.approve', requisition.id));
        }
    };

    const handleReject = () => {
        const reason = prompt(t('Please provide a reason for rejection:'));
        if (reason) {
            router.post(route('stock-requisitions.reject', requisition.id), {
                rejection_reason: reason
            });
        }
    };

    const handleFulfill = () => {
        if (confirm(t('Mark this requisition as fulfilled?'))) {
            router.post(route('stock-requisitions.fulfill', requisition.id), {
                items: requisition.items.map((item: any) => ({
                    id: item.id,
                    quantity_fulfilled: item.quantity_approved || item.quantity_requested
                }))
            });
        }
    };

    return (
        <AuthenticatedLayout
            breadcrumbs={[
                {label: t('Stock Requisitions'), url: route('stock-requisitions.index')},
                {label: requisition.requisition_number}
            ]}
            pageTitle={t('Requisition Details')}
            pageActions={
                <div className="flex gap-2">
                    <Button 
                        variant="outline"
                        onClick={() => window.open(route('stock-requisitions.show', requisition.id) + '?download=pdf', '_blank')}
                    >
                        {t('Download PDF')}
                    </Button>
                    {requisition.status === 'pending' && permissions.canApprove && (
                        <>
                            <Button onClick={handleApprove} variant="default">
                                <CheckCircle className="h-4 w-4 mr-2" />
                                {t('Approve')}
                            </Button>
                            <Button onClick={handleReject} variant="destructive">
                                <XCircle className="h-4 w-4 mr-2" />
                                {t('Reject')}
                            </Button>
                        </>
                    )}
                    {requisition.status === 'approved' && permissions.canFulfill && (
                        <Button onClick={handleFulfill} variant="default">
                            <Package className="h-4 w-4 mr-2" />
                            {t('Mark as Fulfilled')}
                        </Button>
                    )}
                    {['draft', 'pending'].includes(requisition.status) && permissions.canEdit && (
                        <Button asChild variant="outline">
                            <Link href={route('stock-requisitions.edit', requisition.id)}>
                                <Edit className="h-4 w-4 mr-2" />
                                {t('Edit')}
                            </Link>
                        </Button>
                    )}
                </div>
            }
        >
            <Head title={requisition.requisition_number} />

            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle>{t('Requisition Information')}</CardTitle>
                            {getStatusBadge(requisition.status)}
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <div>
                                <div className="text-sm text-muted-foreground mb-1">{t('Requisition Number')}</div>
                                <div className="font-medium">{requisition.requisition_number}</div>
                            </div>
                            <div>
                                <div className="text-sm text-muted-foreground mb-1">{t('Requisition Date')}</div>
                                <div className="font-medium">{formatDate(requisition.requisition_date)}</div>
                            </div>
                            <div>
                                <div className="text-sm text-muted-foreground mb-1">{t('Required Date')}</div>
                                <div className="font-medium">{formatDate(requisition.required_date)}</div>
                            </div>
                            <div>
                                <div className="text-sm text-muted-foreground mb-1">{t('Requested By')}</div>
                                <div className="font-medium">{requisition.requested_by?.name}</div>
                            </div>
                            <div>
                                <div className="text-sm text-muted-foreground mb-1">{t('Warehouse')}</div>
                                <div className="font-medium">{requisition.warehouse?.name}</div>
                            </div>
                            <div>
                                <div className="text-sm text-muted-foreground mb-1">{t('Department')}</div>
                                <div className="font-medium">{requisition.department || '-'}</div>
                            </div>
                            <div>
                                <div className="text-sm text-muted-foreground mb-1">{t('Priority')}</div>
                                <Badge variant={requisition.priority === 'urgent' ? 'destructive' : 'default'}>
                                    {t(requisition.priority)}
                                </Badge>
                            </div>
                            {requisition.approved_by && (
                                <>
                                    <div>
                                        <div className="text-sm text-muted-foreground mb-1">{t('Approved By')}</div>
                                        <div className="font-medium">{requisition.approved_by?.name}</div>
                                    </div>
                                    <div>
                                        <div className="text-sm text-muted-foreground mb-1">{t('Approved At')}</div>
                                        <div className="font-medium">{formatDate(requisition.approved_at)}</div>
                                    </div>
                                </>
                            )}
                            {requisition.fulfilled_by && (
                                <>
                                    <div>
                                        <div className="text-sm text-muted-foreground mb-1">{t('Fulfilled By')}</div>
                                        <div className="font-medium">{requisition.fulfilled_by?.name}</div>
                                    </div>
                                    <div>
                                        <div className="text-sm text-muted-foreground mb-1">{t('Fulfilled At')}</div>
                                        <div className="font-medium">{formatDate(requisition.fulfilled_at)}</div>
                                    </div>
                                </>
                            )}
                        </div>

                        {requisition.purpose && (
                            <div className="mt-6">
                                <div className="text-sm text-muted-foreground mb-1">{t('Purpose')}</div>
                                <div className="text-sm">{requisition.purpose}</div>
                            </div>
                        )}

                        {requisition.notes && (
                            <div className="mt-4">
                                <div className="text-sm text-muted-foreground mb-1">{t('Notes')}</div>
                                <div className="text-sm">{requisition.notes}</div>
                            </div>
                        )}

                        {requisition.rejection_reason && (
                            <div className="mt-4 p-4 bg-destructive/10 rounded-lg">
                                <div className="text-sm font-medium text-destructive mb-1">{t('Rejection Reason')}</div>
                                <div className="text-sm">{requisition.rejection_reason}</div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Package className="h-5 w-5" />
                            {t('Requisition Items')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b">
                                        <th className="text-left py-3 px-4">{t('Product')}</th>
                                        <th className="text-left py-3 px-4">{t('SKU')}</th>
                                        <th className="text-right py-3 px-4">{t('Requested')}</th>
                                        {requisition.status !== 'pending' && (
                                            <th className="text-right py-3 px-4">{t('Approved')}</th>
                                        )}
                                        {requisition.status === 'fulfilled' && (
                                            <th className="text-right py-3 px-4">{t('Fulfilled')}</th>
                                        )}
                                        <th className="text-left py-3 px-4">{t('Unit')}</th>
                                        <th className="text-left py-3 px-4">{t('Notes')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {requisition.items?.map((item: any) => (
                                        <tr key={item.id} className="border-b">
                                            <td className="py-3 px-4">{item.product?.name}</td>
                                            <td className="py-3 px-4 text-muted-foreground">{item.product?.sku}</td>
                                            <td className="py-3 px-4 text-right">{item.quantity_requested}</td>
                                            {requisition.status !== 'pending' && (
                                                <td className="py-3 px-4 text-right">{item.quantity_approved || '-'}</td>
                                            )}
                                            {requisition.status === 'fulfilled' && (
                                                <td className="py-3 px-4 text-right">{item.quantity_fulfilled || '-'}</td>
                                            )}
                                            <td className="py-3 px-4">{item.product?.unit}</td>
                                            <td className="py-3 px-4 text-muted-foreground text-sm">{item.notes || '-'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AuthenticatedLayout>
    );
}

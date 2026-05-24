import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import AuthenticatedLayout from '@/layouts/authenticated-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Product {
    product_id: number;
    product_name: string;
    sku: string;
    category: string;
    opening_stock: number;
    received_stock: number;
    issued_stock: number;
    closing_stock: number;
}

interface Warehouse {
    id: number;
    name: string;
}

interface Props {
    reportData: Record<string, Product[]>;
    startDate: string;
    endDate: string;
    warehouse: Warehouse | null;
    warehouses: Warehouse[];
}

export default function Comprehensive({ reportData, startDate, endDate, warehouse, warehouses }: Props) {
    const { t } = useTranslation();
    const [filters, setFilters] = useState({
        start_date: startDate,
        end_date: endDate,
        warehouse_id: warehouse?.id?.toString() || '',
    });

    const handleFilterChange = (key: string, value: string) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const handleApplyFilters = () => {
        router.get(route('product-service.stock-reports.comprehensive'), filters);
    };

    const calculateCategoryTotals = (products: Product[]) => {
        return products.reduce(
            (acc, product) => ({
                opening: acc.opening + product.opening_stock,
                received: acc.received + product.received_stock,
                issued: acc.issued + product.issued_stock,
                closing: acc.closing + product.closing_stock,
            }),
            { opening: 0, received: 0, issued: 0, closing: 0 }
        );
    };

    const calculateGrandTotals = () => {
        return Object.values(reportData).flat().reduce(
            (acc, product) => ({
                opening: acc.opening + product.opening_stock,
                received: acc.received + product.received_stock,
                issued: acc.issued + product.issued_stock,
                closing: acc.closing + product.closing_stock,
            }),
            { opening: 0, received: 0, issued: 0, closing: 0 }
        );
    };

    const grandTotals = calculateGrandTotals();

    return (
        <AuthenticatedLayout
            breadcrumbs={[
                { label: t('Product & Service') },
                { label: t('Stock Reports'), href: route('product-service.stock-reports.index') },
                { label: t('Comprehensive Report') }
            ]}
            pageTitle={t('Comprehensive Stock Report')}
        >
            <Head title={t('Comprehensive Stock Report')} />

            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <Button onClick={() => window.print()}>{t('Print Report')}</Button>
                </div>

                {/* Filters */}
                <Card>
                    <CardHeader>
                        <CardTitle>{t('Filters')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div>
                                <Label htmlFor="start_date">{t('Start Date')}</Label>
                                <Input
                                    id="start_date"
                                    type="date"
                                    value={filters.start_date}
                                    onChange={(e) => handleFilterChange('start_date', e.target.value)}
                                />
                            </div>
                            <div>
                                <Label htmlFor="end_date">{t('End Date')}</Label>
                                <Input
                                    id="end_date"
                                    type="date"
                                    value={filters.end_date}
                                    onChange={(e) => handleFilterChange('end_date', e.target.value)}
                                />
                            </div>
                            <div>
                                <Label htmlFor="warehouse">{t('Warehouse')}</Label>
                                <Select
                                    value={filters.warehouse_id}
                                    onValueChange={(value) => handleFilterChange('warehouse_id', value)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder={t('All Warehouses')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="">{t('All Warehouses')}</SelectItem>
                                        {warehouses.map((wh) => (
                                            <SelectItem key={wh.id} value={wh.id.toString()}>
                                                {wh.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex items-end">
                                <Button onClick={handleApplyFilters} className="w-full">
                                    {t('Apply Filters')}
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Report Summary */}
                <Card>
                    <CardHeader>
                        <CardTitle>{t('Report Summary')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="text-center p-4 bg-blue-50 rounded">
                                <div className="text-sm text-gray-600">{t('Opening Stock')}</div>
                                <div className="text-2xl font-bold">{grandTotals.opening.toFixed(2)}</div>
                            </div>
                            <div className="text-center p-4 bg-green-50 rounded">
                                <div className="text-sm text-gray-600">{t('Received')}</div>
                                <div className="text-2xl font-bold text-green-600">
                                    +{grandTotals.received.toFixed(2)}
                                </div>
                            </div>
                            <div className="text-center p-4 bg-red-50 rounded">
                                <div className="text-sm text-gray-600">{t('Issued/Sold')}</div>
                                <div className="text-2xl font-bold text-red-600">
                                    -{grandTotals.issued.toFixed(2)}
                                </div>
                            </div>
                            <div className="text-center p-4 bg-purple-50 rounded">
                                <div className="text-sm text-gray-600">{t('Closing Stock')}</div>
                                <div className="text-2xl font-bold">{grandTotals.closing.toFixed(2)}</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Detailed Report by Category */}
                {Object.entries(reportData).map(([category, products]) => {
                    const categoryTotals = calculateCategoryTotals(products);
                    return (
                        <Card key={category}>
                            <CardHeader>
                                <CardTitle>{category}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>{t('Product')}</TableHead>
                                            <TableHead>{t('SKU')}</TableHead>
                                            <TableHead className="text-right">{t('Opening')}</TableHead>
                                            <TableHead className="text-right">{t('Received')}</TableHead>
                                            <TableHead className="text-right">{t('Issued')}</TableHead>
                                            <TableHead className="text-right">{t('Closing')}</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {products.map((product) => (
                                            <TableRow key={product.product_id}>
                                                <TableCell>{product.product_name}</TableCell>
                                                <TableCell>{product.sku}</TableCell>
                                                <TableCell className="text-right">
                                                    {product.opening_stock.toFixed(2)}
                                                </TableCell>
                                                <TableCell className="text-right text-green-600">
                                                    {product.received_stock.toFixed(2)}
                                                </TableCell>
                                                <TableCell className="text-right text-red-600">
                                                    {product.issued_stock.toFixed(2)}
                                                </TableCell>
                                                <TableCell className="text-right font-semibold">
                                                    {product.closing_stock.toFixed(2)}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        <TableRow className="bg-gray-50 font-semibold">
                                            <TableCell colSpan={2}>{t('Category Total')}</TableCell>
                                            <TableCell className="text-right">
                                                {categoryTotals.opening.toFixed(2)}
                                            </TableCell>
                                            <TableCell className="text-right text-green-600">
                                                {categoryTotals.received.toFixed(2)}
                                            </TableCell>
                                            <TableCell className="text-right text-red-600">
                                                {categoryTotals.issued.toFixed(2)}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {categoryTotals.closing.toFixed(2)}
                                            </TableCell>
                                        </TableRow>
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        </AuthenticatedLayout>
    );
}

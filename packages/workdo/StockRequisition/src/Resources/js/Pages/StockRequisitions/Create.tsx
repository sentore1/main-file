import React, { useState } from 'react';
import { Head, useForm, usePage } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import AuthenticatedLayout from '@/layouts/authenticated-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { InputError } from '@/components/ui/input-error';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
import { Package, Plus, Trash } from 'lucide-react';

interface CreateProps {
    warehouses: Array<{id: number; name: string; address: string}>;
}

export default function Create() {
    const { t } = useTranslation();
    const { warehouses } = usePage<CreateProps>().props;
    const [availableProducts, setAvailableProducts] = useState([]);

    const { data, setData, post, processing, errors } = useForm({
        requisition_date: new Date().toISOString().split('T')[0],
        required_date: '',
        warehouse_id: '',
        department: '',
        priority: 'normal',
        purpose: '',
        notes: '',
        items: [{
            product_id: 0,
            quantity: 1,
            notes: ''
        }]
    });

    const handleWarehouseChange = async (warehouseId: string) => {
        setData('warehouse_id', warehouseId);

        if (warehouseId) {
            try {
                const url = route('stock-requisitions.warehouse-products') + `?warehouse_id=${warehouseId}`;
                const response = await fetch(url);
                
                let text = await response.text();
                
                // Remove any script tags that might be injected by proxies/extensions
                text = text.replace(/<script[^>]*>.*?<\/script>/gi, '');
                
                // Find the JSON array start
                const jsonStart = text.indexOf('[');
                if (jsonStart !== -1) {
                    text = text.substring(jsonStart);
                }
                
                const products = JSON.parse(text);
                setAvailableProducts(products);
            } catch (error) {
                console.error('Failed to fetch products:', error);
                setAvailableProducts([]);
            }
        } else {
            setAvailableProducts([]);
        }

        // Reset items when warehouse changes
        setData('items', [{
            product_id: 0,
            quantity: 1,
            notes: ''
        }]);
    };

    const addItem = () => {
        setData('items', [...data.items, { product_id: 0, quantity: 1, notes: '' }]);
    };

    const removeItem = (index: number) => {
        const newItems = data.items.filter((_, i) => i !== index);
        setData('items', newItems);
    };

    const updateItem = (index: number, field: string, value: any) => {
        const newItems = [...data.items];
        newItems[index] = { ...newItems[index], [field]: value };
        setData('items', newItems);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('stock-requisitions.store'));
    };

    return (
        <AuthenticatedLayout
            breadcrumbs={[
                {label: t('Stock Requisitions'), url: route('stock-requisitions.index')},
                {label: t('Create Requisition')}
            ]}
            pageTitle={t('Create Stock Requisition')}
        >
            <Head title={t('Create Stock Requisition')} />

            <form onSubmit={handleSubmit} className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>{t('Requisition Details')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div>
                                <Label htmlFor="requisition_date" required>{t('Requisition Date')}</Label>
                                <DatePicker
                                    id="requisition_date"
                                    value={data.requisition_date}
                                    onChange={(value) => setData('requisition_date', value)}
                                    required
                                />
                                <InputError message={errors.requisition_date} />
                            </div>

                            <div>
                                <Label htmlFor="required_date" required>{t('Required Date')}</Label>
                                <DatePicker
                                    id="required_date"
                                    value={data.required_date}
                                    onChange={(value) => setData('required_date', value)}
                                    required
                                />
                                <InputError message={errors.required_date} />
                            </div>

                            <div>
                                <Label htmlFor="warehouse_id" required>{t('Warehouse')}</Label>
                                <Select value={data.warehouse_id} onValueChange={handleWarehouseChange}>
                                    <SelectTrigger>
                                        <SelectValue placeholder={t('Select Warehouse')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {warehouses.map((warehouse) => (
                                            <SelectItem key={warehouse.id} value={warehouse.id.toString()}>
                                                {warehouse.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <InputError message={errors.warehouse_id} />
                            </div>

                            <div>
                                <Label htmlFor="department">{t('Department')}</Label>
                                <Input
                                    id="department"
                                    value={data.department}
                                    onChange={(e) => setData('department', e.target.value)}
                                    placeholder={t('e.g., Production')}
                                />
                                <InputError message={errors.department} />
                            </div>

                            <div>
                                <Label htmlFor="priority" required>{t('Priority')}</Label>
                                <Select value={data.priority} onValueChange={(value) => setData('priority', value)}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="low">{t('Low')}</SelectItem>
                                        <SelectItem value="normal">{t('Normal')}</SelectItem>
                                        <SelectItem value="urgent">{t('Urgent')}</SelectItem>
                                    </SelectContent>
                                </Select>
                                <InputError message={errors.priority} />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                            <div>
                                <Label htmlFor="purpose">{t('Purpose')}</Label>
                                <Textarea
                                    id="purpose"
                                    value={data.purpose}
                                    onChange={(e) => setData('purpose', e.target.value)}
                                    rows={3}
                                    placeholder={t('Purpose of requisition...')}
                                />
                            </div>

                            <div>
                                <Label htmlFor="notes">{t('Notes')}</Label>
                                <Textarea
                                    id="notes"
                                    value={data.notes}
                                    onChange={(e) => setData('notes', e.target.value)}
                                    rows={3}
                                    placeholder={t('Additional notes...')}
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle className="flex items-center gap-2">
                                <Package className="h-5 w-5" />
                                {t('Items')}
                            </CardTitle>
                            <Button type="button" onClick={addItem} variant="default" size="sm">
                                <Plus className="h-4 w-4 mr-2" />
                                {t('Add Item')}
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {data.items.map((item, index) => (
                                <div key={index} className="flex gap-4 items-start border p-4 rounded-lg">
                                    <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
                                            <Label required>{t('Product')}</Label>
                                            <Select
                                                value={item.product_id.toString()}
                                                onValueChange={(value) => updateItem(index, 'product_id', parseInt(value))}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder={t('Select Product')} />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {availableProducts.map((product: any) => (
                                                        <SelectItem key={product.id} value={product.id.toString()}>
                                                            {product.name} ({product.sku}) - Stock: {product.stock_quantity}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div>
                                            <Label required>{t('Quantity')}</Label>
                                            <Input
                                                type="number"
                                                min="0.01"
                                                step="0.01"
                                                value={item.quantity}
                                                onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value))}
                                            />
                                        </div>

                                        <div>
                                            <Label>{t('Notes')}</Label>
                                            <Input
                                                value={item.notes}
                                                onChange={(e) => updateItem(index, 'notes', e.target.value)}
                                                placeholder={t('Item notes...')}
                                            />
                                        </div>
                                    </div>

                                    {data.items.length > 1 && (
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => removeItem(index)}
                                            className="mt-6"
                                        >
                                            <Trash className="h-4 w-4 text-destructive" />
                                        </Button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <div className="flex justify-end gap-3">
                    <Button type="button" variant="outline" onClick={() => window.history.back()}>
                        {t('Cancel')}
                    </Button>
                    <Button type="submit" disabled={processing || data.items.length === 0}>
                        {processing ? t('Creating...') : t('Create Requisition')}
                    </Button>
                </div>
            </form>
        </AuthenticatedLayout>
    );
}

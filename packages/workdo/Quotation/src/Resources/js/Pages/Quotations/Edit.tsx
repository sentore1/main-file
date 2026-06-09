import React, { useState, useEffect } from 'react';
import { Head, useForm, usePage } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { Quotation, QuotationItem } from './types';
import AuthenticatedLayout from '@/layouts/authenticated-layout';
import QuotationItemsTable from './components/QuotationItemsTable';
import { useTaxCalculator, calculateLineItemAmounts } from './components/TaxCalculator';
import { formatCurrency } from '@/utils/helpers';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { InputError } from '@/components/ui/input-error';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { DatePicker } from '@/components/ui/date-picker';
import { Separator } from '@/components/ui/separator';
import { CalendarDays, Package } from 'lucide-react';

interface EditProps {
    quotation: Quotation;
    customers: Array<{id: number; name: string; email: string}>;
    warehouses: Array<{id: number; name: string; address: string}>;
    [key: string]: any;
}

export default function Edit() {
    const { t } = useTranslation();
    const { quotation, customers, warehouses } = usePage<EditProps>().props;
    const [availableProducts, setAvailableProducts] = useState([]);

    const { data, setData, put, processing, errors } = useForm({
        invoice_date: quotation.quotation_date,
        due_date: quotation.due_date,
        customer_id: quotation.customer_id.toString(),
        warehouse_id: quotation.warehouse_id?.toString() || '',
        type: quotation.type || 'product',
        payment_terms: quotation.payment_terms || '',
        notes: quotation.notes || '',
        items: (quotation.items || []).map(item => {
            const calculations = calculateLineItemAmounts(
                item.quantity,
                item.unit_price,
                item.discount_percentage,
                item.tax_percentage
            );
            return {
                ...item,
                taxes: item.taxes || [],
                discount_amount: calculations.discountAmount,
                tax_amount: calculations.taxAmount,
                total_amount: calculations.totalAmount
            };
        }) as QuotationItem[]
    });

    useEffect(() => {
        if (data.warehouse_id) {
            if (data.type === 'service') {
                handleWarehouseChangeForServices(data.warehouse_id);
            } else {
                handleWarehouseChange(data.warehouse_id);
            }
        }
    }, []);

    const handleWarehouseChange = async (warehouseId: string) => {
        setData('warehouse_id', warehouseId);
        
        if (warehouseId && data.type === 'product') {
            try {
                const response = await fetch(route('quotations.warehouse.products') + `?warehouse_id=${warehouseId}`);
                let text = await response.text();
                text = text.replace(/<script[^>]*>.*?<\/script>/gi, '');
                const jsonStart = text.indexOf('[');
                if (jsonStart !== -1) {
                    text = text.substring(jsonStart);
                }
                const warehouseProducts = JSON.parse(text);
                setAvailableProducts(warehouseProducts);
                console.log('Loaded products:', warehouseProducts.length);
            } catch (error) {
                console.error('Failed to fetch warehouse products:', error);
                setAvailableProducts([]);
            }
        } else {
            setAvailableProducts([]);
        }
    };

    const handleTypeChange = async (type: string) => {
        setData('type', type);

        if (type === 'service') {
            setAvailableProducts([]);
        } else {
            setAvailableProducts([]);
            setData('warehouse_id', '');
        }

        setData('items', [{
            product_id: 0,
            quantity: 1,
            unit_price: 0,
            discount_percentage: 0,
            discount_amount: 0,
            tax_percentage: 0,
            tax_amount: 0,
            total_amount: 0,
            taxes: []
        }]);
    };

    const handleWarehouseChangeForServices = async (warehouseId: string) => {
        setData('warehouse_id', warehouseId);

        if (warehouseId && data.type === 'service') {
            try {
                const url = route('quotations.services') + `?warehouse_id=${warehouseId}`;
                console.log('Fetching services from:', url);
                const response = await fetch(url);
                
                if (!response.ok) {
                    console.error('Response not OK:', response.status, response.statusText);
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                let text = await response.text();
                console.log('Raw response length:', text.length);
                
                text = text.replace(/<script[^>]*>.*?<\/script>/gi, '');
                
                const jsonStart = text.indexOf('[');
                const jsonEnd = text.lastIndexOf(']') + 1;
                
                if (jsonStart >= 0 && jsonEnd > jsonStart) {
                    const jsonText = text.substring(jsonStart, jsonEnd);
                    const services = JSON.parse(jsonText);
                    console.log('Services parsed:', services.length, 'items');
                    console.log('First service:', services[0]);
                    
                    setAvailableProducts(services);
                } else {
                    console.error('Could not find JSON array in response');
                    setAvailableProducts([]);
                }
            } catch (error) {
                console.error('Error fetching services:', error);
                setAvailableProducts([]);
            }
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(route('quotations.update', quotation.id));
    };

    const totals = useTaxCalculator(data.items);

    return (
        <AuthenticatedLayout
            breadcrumbs={[
                {label: t('Quotations'), url: route('quotations.index')},
                {label: t('Edit Quotation')}
            ]}
            pageTitle={t('Edit Quotation')}
        >
            <Head title={t('Edit Quotation')} />

            <div>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <CalendarDays className="h-5 w-5" />
                                    {t('Quotation Details')}
                                </CardTitle>
                                <div className="flex items-center gap-2">
                                    <RadioGroup value={data.type} onValueChange={handleTypeChange} className="flex gap-4">
                                        <div className="flex items-center gap-2">
                                            <RadioGroupItem value="product" id="type-product" />
                                            <Label htmlFor="type-product" className="cursor-pointer font-normal">{t('Product Wise')}</Label>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <RadioGroupItem value="service" id="type-service" />
                                            <Label htmlFor="type-service" className="cursor-pointer font-normal">{t('Service Wise')}</Label>
                                        </div>
                                    </RadioGroup>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                <div>
                                    <Label htmlFor="invoice_date" required>
                                        {t('Quotation Date')}
                                    </Label>
                                    <DatePicker
                                        id="invoice_date"
                                        value={data.invoice_date}
                                        onChange={(value) => setData('invoice_date', value)}
                                        required
                                    />
                                    <InputError message={errors.invoice_date} />
                                </div>

                                <div>
                                    <Label htmlFor="due_date" required>
                                        {t('Due Date')}
                                    </Label>
                                    <DatePicker
                                        id="due_date"
                                        value={data.due_date}
                                        onChange={(value) => setData('due_date', value)}
                                        required
                                    />
                                    <InputError message={errors.due_date} />
                                </div>

                                <div>
                                    <Label htmlFor="customer_id" required>
                                        {t('Customer')}
                                    </Label>
                                    <Select value={data.customer_id} onValueChange={(value) => setData('customer_id', value)}>
                                        <SelectTrigger>
                                            <SelectValue placeholder={t('Select Customer')} />
                                        </SelectTrigger>
                                        <SelectContent searchable>
                                            {customers.map((customer) => (
                                                <SelectItem key={customer.id} value={customer.id.toString()}>
                                                    {customer.name} - {customer.email}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <InputError message={errors.customer_id} />
                                </div>

                                {data.type === 'product' && (
                                    <div>
                                        <Label htmlFor="warehouse_id" required>
                                            {t('Warehouse')}
                                        </Label>
                                        <Select value={data.warehouse_id} onValueChange={handleWarehouseChange}>
                                            <SelectTrigger>
                                                <SelectValue placeholder={t('Select Warehouse')} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {warehouses.map((warehouse) => (
                                                    <SelectItem key={warehouse.id} value={warehouse.id.toString()}>
                                                        {warehouse.name} - {warehouse.address}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <InputError message={errors.warehouse_id} />
                                    </div>
                                )}

                                {data.type === 'service' && (
                                    <div>
                                        <Label htmlFor="warehouse_id" required>
                                            {t('Warehouse')}
                                        </Label>
                                        <Select value={data.warehouse_id} onValueChange={handleWarehouseChangeForServices}>
                                            <SelectTrigger>
                                                <SelectValue placeholder={t('Select Warehouse')} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {warehouses.map((warehouse) => (
                                                    <SelectItem key={warehouse.id} value={warehouse.id.toString()}>
                                                        {warehouse.name} - {warehouse.address}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <InputError message={errors.warehouse_id} />
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                <div>
                                    <Label htmlFor="payment_terms">
                                        {t('Payment Terms')}
                                    </Label>
                                    <Input
                                        id="payment_terms"
                                        value={data.payment_terms}
                                        onChange={(e) => setData('payment_terms', e.target.value)}
                                        placeholder={t('e.g., Net 30')}
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="notes">
                                        {t('Notes')}
                                    </Label>
                                    <Textarea
                                        id="notes"
                                        value={data.notes}
                                        onChange={(e) => setData('notes', e.target.value)}
                                        rows={2}
                                        placeholder={t('Additional notes...')}
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <Package className="h-5 w-5" />
                                    {t('Quotation Items')}
                                </CardTitle>
                                <Button
                                    type="button"
                                    onClick={() => {
                                        const newItem = {
                                            product_id: 0,
                                            quantity: 1,
                                            unit_price: 0,
                                            discount_percentage: 0,
                                            discount_amount: 0,
                                            tax_percentage: 0,
                                            tax_amount: 0,
                                            total_amount: 0,
                                            taxes: []
                                        };
                                        setData('items', [...data.items, newItem]);
                                    }}
                                    variant="default"
                                    size="sm"
                                >
                                    + {t('Add Item')}
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <QuotationItemsTable
                                items={data.items}
                                onChange={(items) => setData('items', items)}
                                errors={errors}
                                products={availableProducts}
                                showAddButton={false}
                                quotationType={data.type}
                            />

                            <div className="mt-6 flex justify-end">
                                <div className="w-80 bg-muted/30 rounded-lg p-4">
                                    <h3 className="font-semibold mb-3">{t('Quotation Summary')}</h3>
                                    <div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">{t('Subtotal')}</span>
                                            <span className="font-medium">{formatCurrency(totals.subtotal)}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">{t('Discount')}</span>
                                            <span className="font-medium text-red-600">-{formatCurrency(totals.discountAmount)}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">{t('Tax')}</span>
                                            <span className="font-medium">{formatCurrency(totals.taxAmount)}</span>
                                        </div>
                                        <Separator className="my-2" />
                                        <div className="flex justify-between">
                                            <span className="font-semibold">{t('Total')}</span>
                                            <span className="font-bold text-lg">{formatCurrency(totals.total)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="flex justify-between items-center">
                        <div className="text-sm text-muted-foreground">
                            {data.items.length} {t('items added')}
                        </div>
                        <div className="flex gap-3">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => window.history.back()}
                            >
                                {t('Cancel')}
                            </Button>
                            <Button
                                type="submit"
                                disabled={processing || data.items.length === 0}
                            >
                                {processing ? t('Updating...') : t('Update')}
                            </Button>
                        </div>
                    </div>
                </form>
            </div>
        </AuthenticatedLayout>
    );
}
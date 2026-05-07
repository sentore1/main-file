import { useState } from 'react';
import { Head, usePage, router } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import AuthenticatedLayout from "@/layouts/authenticated-layout";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Minus, Plus } from 'lucide-react';

export default function Create() {
    const { t } = useTranslation();
    const { categories, warehouses } = usePage<any>().props;

    // Debug: log the first product's stock structure so we can verify the data shape
    if (categories?.length > 0 && categories[0]?.items?.length > 0) {
        console.log('[StockReport] First product data:', categories[0].items[0]);
    }

    const [formData, setFormData] = useState({
        report_date: new Date().toISOString().split('T')[0],
        report_type: 'opening',
        warehouse_id: undefined as string | undefined,
        notes: '',
        items: [] as Array<{ product_id: number; product_name: string; quantity: number; category: string }>
    });

    const [selectedCategory, setSelectedCategory] = useState<string | undefined>(undefined);
    const [searchQuery, setSearchQuery] = useState('');
    const [errors, setErrors] = useState<any>({});

    const getStocks = (product: any) => product.warehouse_stocks ?? product.warehouseStocks ?? [];

    const handleAddItem = (product: any) => {
        const exists = formData.items.find(item => item.product_id === product.id);
        if (!exists) {
            const stocks = getStocks(product);
            // Calculate quantity based on selected warehouse or all warehouses
            let quantity = 0;
            if (formData.warehouse_id) {
                // Get quantity from selected warehouse only
                const warehouseStock = stocks.find(
                    (stock: any) => String(stock.warehouse_id) === String(formData.warehouse_id)
                );
                quantity = warehouseStock ? parseFloat(warehouseStock.quantity) : 0;
            } else {
                // Get total quantity from all warehouses
                quantity = stocks.reduce((sum: number, stock: any) => sum + parseFloat(stock.quantity), 0) || 0;
            }
            
            setFormData({
                ...formData,
                items: [...formData.items, {
                    product_id: product.id,
                    product_name: product.name,
                    quantity: quantity,
                    category: product.category?.name || 'Uncategorized'
                }]
            });
        }
    };

    const handleRemoveItem = (productId: number) => {
        setFormData({
            ...formData,
            items: formData.items.filter(item => item.product_id !== productId)
        });
    };

    const handleQuantityChange = (productId: number, quantity: number) => {
        setFormData({
            ...formData,
            items: formData.items.map(item =>
                item.product_id === productId ? { ...item, quantity } : item
            )
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (formData.items.length === 0) {
            setErrors({ items: 'Please add at least one item to the report' });
            return;
        }

        router.post(route('product-service.stock-reports.store'), formData, {
            onError: (errors) => setErrors(errors),
        });
    };

    const groupedItems = formData.items.reduce((acc, item) => {
        const category = item.category;
        if (!acc[category]) acc[category] = [];
        acc[category].push(item);
        return acc;
    }, {} as Record<string, typeof formData.items>);

    return (
        <AuthenticatedLayout
            breadcrumbs={[
                { label: t('Product & Service') },
                { label: t('Stock Reports'), href: route('product-service.stock-reports.index') },
                { label: t('Create') }
            ]}
            pageTitle={t('Create Stock Report')}
        >
            <Head title={t('Create Stock Report')} />

            <form onSubmit={handleSubmit} className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>{t('Report Details')}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <Label htmlFor="report_date">{t('Report Date')}</Label>
                                <Input
                                    id="report_date"
                                    type="date"
                                    value={formData.report_date}
                                    onChange={(e) => setFormData({ ...formData, report_date: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <Label htmlFor="report_type">{t('Report Type')}</Label>
                                <Select value={formData.report_type} onValueChange={(value) => setFormData({ ...formData, report_type: value })}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="opening">{t('Opening Stock')}</SelectItem>
                                        <SelectItem value="closing">{t('Closing Stock')}</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label htmlFor="warehouse_id">{t('Warehouse (Optional)')}</Label>
                                <Select value={formData.warehouse_id || undefined} onValueChange={(value) => setFormData({ ...formData, warehouse_id: value })}>
                                    <SelectTrigger>
                                        <SelectValue placeholder={t('All Warehouses')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {warehouses.map((warehouse: any) => (
                                            <SelectItem key={warehouse.id} value={warehouse.id.toString()}>
                                                {warehouse.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div>
                            <Label htmlFor="notes">{t('Notes (Optional)')}</Label>
                            <Textarea
                                id="notes"
                                value={formData.notes}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                rows={3}
                            />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>{t('Add Items')}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <Label>{t('Select Category')}</Label>
                            <Select value={selectedCategory || undefined} onValueChange={setSelectedCategory}>
                                <SelectTrigger>
                                    <SelectValue placeholder={t('Choose a category')} />
                                </SelectTrigger>
                                <SelectContent>
                                    {categories.map((category: any) => {
                                        // Calculate filtered item count based on selected warehouse
                                        const filteredCount = formData.warehouse_id
                                            ? category.items?.filter((product: any) => {
                                                const stocks = getStocks(product);
                                                return stocks.some(
                                                    (stock: any) => String(stock.warehouse_id) === String(formData.warehouse_id)
                                                );
                                            }).length || 0
                                            : category.items?.length || 0;

                                        return (
                                            <SelectItem key={category.id} value={category.id.toString()}>
                                                {category.name} ({filteredCount} items)
                                            </SelectItem>
                                        );
                                    })}
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label>{t('Search Items')}</Label>
                            <Input
                                type="text"
                                placeholder={t('Search by name or SKU...')}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>

                        {selectedCategory && (() => {
                            const categoryItems = categories
                                .find((c: any) => c.id.toString() === selectedCategory)
                                ?.items?.filter((product: any) => {
                                    // Filter by warehouse
                                    if (formData.warehouse_id) {
                                        const stocks = getStocks(product);
                                        const hasStock = stocks.some(
                                            (stock: any) => String(stock.warehouse_id) === String(formData.warehouse_id)
                                        );
                                        if (!hasStock) return false;
                                    }
                                    
                                    // Filter by search query
                                    if (searchQuery.trim()) {
                                        const query = searchQuery.toLowerCase();
                                        const matchesName = product.name?.toLowerCase().includes(query);
                                        const matchesSku = product.sku?.toLowerCase().includes(query);
                                        return matchesName || matchesSku;
                                    }
                                    
                                    return true;
                                }) || [];

                            return (
                                <div className="border rounded-lg p-4 max-h-60 overflow-y-auto">
                                    {categoryItems.length === 0 ? (
                                        <p className="text-center text-gray-500 py-4">
                                            {formData.warehouse_id 
                                                ? t('No items found in this warehouse for the selected category')
                                                : t('No items found in this category')
                                            }
                                        </p>
                                    ) : (
                                        <div className="space-y-2">
                                            {categoryItems.map((product: any) => (
                                                <div key={product.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                                                    <div>
                                                        <p className="font-medium">{product.name}</p>
                                                        <p className="text-sm text-gray-500">{product.sku}</p>
                                                    </div>
                                                    <Button
                                                        type="button"
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => handleAddItem(product)}
                                                        disabled={formData.items.some(item => item.product_id === product.id)}
                                                    >
                                                        <Plus className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })()}
                        {errors.items && <p className="text-sm text-red-600">{errors.items}</p>}
                    </CardContent>
                </Card>

                {formData.items.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle>{t('Report Items')}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {Object.entries(groupedItems).map(([category, items]) => (
                                <div key={category} className="mb-6">
                                    <h3 className="font-semibold text-lg mb-3 text-gray-700">{category}</h3>
                                    <div className="space-y-2">
                                        {items.map((item) => (
                                            <div key={item.product_id} className="flex items-center gap-4 p-3 border rounded-lg">
                                                <div className="flex-1">
                                                    <p className="font-medium">{item.product_name}</p>
                                                </div>
                                                <div className="w-32">
                                                    <Input
                                                        type="number"
                                                        min="0"
                                                        step="0.01"
                                                        value={item.quantity}
                                                        onChange={(e) => handleQuantityChange(item.product_id, parseFloat(e.target.value) || 0)}
                                                        className="text-center"
                                                    />
                                                </div>
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => handleRemoveItem(item.product_id)}
                                                    className="text-red-600 hover:text-red-700"
                                                >
                                                    <Minus className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="mt-2 text-right">
                                        <span className="font-semibold">{t('Category Total')}: {items.reduce((sum, item) => sum + item.quantity, 0).toFixed(2)}</span>
                                    </div>
                                </div>
                            ))}
                            <div className="border-t pt-4 mt-4">
                                <div className="text-right">
                                    <span className="text-xl font-bold">{t('Grand Total')}: {formData.items.reduce((sum, item) => sum + item.quantity, 0).toFixed(2)}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                <div className="flex justify-end gap-3">
                    <Button type="button" variant="outline" onClick={() => router.visit(route('product-service.stock-reports.index'))}>
                        {t('Cancel')}
                    </Button>
                    <Button type="submit">{t('Create Report')}</Button>
                </div>
            </form>
        </AuthenticatedLayout>
    );
}

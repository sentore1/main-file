import { Head, router, usePage } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ShoppingCart, Plus, Minus, X, ArrowLeft, Download } from 'lucide-react';
import { getImagePath, formatCurrency } from '@/utils/helpers';
import { useFavicon } from '@/hooks/use-favicon';
import { BrandProvider } from '@/contexts/brand-context';

declare global {
    function route(name: string, params?: any): string;
}

interface Customer {
    id: number;
    name: string;
    email: string;
}

interface WarehouseType {
    id: number;
    name: string;
    address: string;
}

interface Category {
    id: number;
    name: string;
    color: string;
}

interface Product {
    id: number;
    name: string;
    sku: string;
    price: number;
    stock: number;
    category?: string;
    image?: string;
    taxes?: Array<{
        id: number;
        name: string;
        rate: number;
    }>;
}

interface SaleItem {
    id: number;
    product_id: number;
    quantity: number;
    price: number;
    subtotal: number;
    tax_amount: number;
    total_amount: number;
    notes?: string;
    product?: {
        id: number;
        name: string;
        sku: string;
    };
    product_name?: string;
    product_sku?: string;
    product_image?: string;
    taxes?: Array<{
        id: number;
        name: string;
        rate: number;
    }>;
}

interface Sale {
    id: number;
    sale_number: string;
    customer_id?: number;
    warehouse_id: number;
    pos_date: string;
    status: string;
    items: SaleItem[];
    payment?: {
        discount: number;
        amount: number;
        discount_amount: number;
        paid_amount: number;
        balance_due: number;
    };
}

interface CartItem extends Product {
    quantity: number;
    customPrice?: number;
    notes?: string;
}

interface EditProps {
    sale: Sale;
    customers: Customer[];
    warehouses: WarehouseType[];
    categories: Category[];
}

function EditContent({ sale, customers = [], warehouses = [], categories = [] }: EditProps) {
    const { t } = useTranslation();
    const { adminAllSetting, companyAllSetting, auth } = usePage().props as any;
    // useFavicon(); // Removed - will be called in the wrapper component

    const isSuperAdmin = auth?.user?.roles?.includes('superadmin');
    const globalSettings = isSuperAdmin ? adminAllSetting : companyAllSetting;

    const [selectedCustomer, setSelectedCustomer] = useState(sale.customer_id?.toString() || '');
    const [selectedWarehouse, setSelectedWarehouse] = useState(sale.warehouse_id.toString());
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [products, setProducts] = useState<Product[]>([]);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [discount, setDiscount] = useState(sale.payment?.discount || 0);
    const [paidAmount, setPaidAmount] = useState(sale.payment?.paid_amount || 0);
    const [downloadingBond, setDownloadingBond] = useState(false);

    // Initialize cart from sale items
    useEffect(() => {
        const initialCart: CartItem[] = sale.items.map(item => ({
            id: item.product_id,
            name: item.product_name || item.product?.name || 'Unknown Product',
            sku: item.product_sku || item.product?.sku || '',
            price: item.price,
            stock: 999, // We don't have stock info for existing items
            quantity: item.quantity,
            customPrice: item.price,
            notes: item.notes,
            image: item.product_image,
            taxes: item.taxes || [],
        }));
        setCart(initialCart);
    }, [sale]);

    // Fetch products when warehouse or category changes
    useEffect(() => {
        if (selectedWarehouse) {
            setLoading(true);
            const params = new URLSearchParams({ warehouse_id: selectedWarehouse });
            if (selectedCategory && selectedCategory !== 'all') {
                params.append('category_id', selectedCategory);
            }

            fetch(route('pos.products') + '?' + params.toString(), {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
                credentials: 'same-origin'
            })
                .then(res => {
                    if (!res.ok) {
                        throw new Error(`HTTP error! status: ${res.status}`);
                    }
                    return res.json();
                })
                .then(data => {
                    setProducts(Array.isArray(data) ? data : []);
                    setLoading(false);
                })
                .catch(err => {
                    console.error('Error fetching products:', err);
                    setProducts([]);
                    setLoading(false);
                });
        }
    }, [selectedWarehouse, selectedCategory]);

    const addToCart = (product: Product) => {
        const existingItem = cart.find(item => item.id === product.id);
        if (existingItem) {
            updateQuantity(product.id, existingItem.quantity + 1);
        } else {
            setCart([...cart, { ...product, quantity: 1, customPrice: product.price }]);
        }
    };

    const updateQuantity = (productId: number, newQuantity: number) => {
        if (newQuantity <= 0) {
            removeFromCart(productId);
            return;
        }
        setCart(cart.map(item =>
            item.id === productId ? { ...item, quantity: newQuantity } : item
        ));
    };

    const updatePrice = (productId: number, newPrice: number) => {
        setCart(cart.map(item =>
            item.id === productId ? { ...item, customPrice: newPrice } : item
        ));
    };

    const updateNotes = (productId: number, notes: string) => {
        setCart(cart.map(item =>
            item.id === productId ? { ...item, notes } : item
        ));
    };

    const removeFromCart = (productId: number) => {
        setCart(cart.filter(item => item.id !== productId));
    };

    const calculateItemTotal = (item: CartItem) => {
        const price = item.customPrice || item.price;
        const subtotal = price * item.quantity;
        let taxAmount = 0;
        
        if (item.taxes && item.taxes.length > 0) {
            item.taxes.forEach(tax => {
                taxAmount += subtotal * (tax.rate / 100);
            });
        }
        
        return subtotal + taxAmount;
    };

    const calculateSubtotal = () => {
        return cart.reduce((sum, item) => {
            const price = item.customPrice || item.price;
            return sum + (price * item.quantity);
        }, 0);
    };

    const calculateTax = () => {
        return cart.reduce((sum, item) => {
            const price = item.customPrice || item.price;
            const subtotal = price * item.quantity;
            let taxAmount = 0;
            
            if (item.taxes && item.taxes.length > 0) {
                item.taxes.forEach(tax => {
                    taxAmount += subtotal * (tax.rate / 100);
                });
            }
            
            return sum + taxAmount;
        }, 0);
    };

    const calculateTotal = () => {
        const subtotal = calculateSubtotal();
        const tax = calculateTax();
        return subtotal + tax - discount;
    };

    const handleSubmit = () => {
        if (submitting) {
            console.log('Already submitting, ignoring click');
            return;
        }

        console.log('=== UPDATE SALE CLICKED ===');
        console.log('Cart:', cart);
        console.log('Discount:', discount);
        console.log('Paid Amount:', paidAmount);
        console.log('Sale ID:', sale.id);
        
        if (cart.length === 0) {
            alert(t('Please add at least one item to the cart'));
            return;
        }

        if (!selectedWarehouse) {
            alert(t('Please select a warehouse'));
            return;
        }

        const formData = {
            customer_id: selectedCustomer && selectedCustomer !== 'walk-in' ? parseInt(selectedCustomer) : null,
            warehouse_id: parseInt(selectedWarehouse),
            pos_date: sale.pos_date,
            items: cart.map(item => ({
                id: item.id,
                quantity: parseFloat(item.quantity.toString()),
                price: parseFloat((item.customPrice || item.price).toString()),
                notes: item.notes || null,
            })),
            discount: parseFloat(discount.toString()) || 0,
            paid_amount: parseFloat(paidAmount.toString()) || 0,
        };

        console.log('Submitting update with data:', formData);
        console.log('Route URL:', route('pos.update', sale.id));

        setSubmitting(true);

        try {
            router.put(route('pos.update', sale.id), formData, {
                onBefore: () => {
                    console.log('onBefore triggered');
                },
                onStart: () => {
                    console.log('onStart triggered - Request sent');
                },
                onSuccess: (page) => {
                    console.log('Update successful', page);
                    setSubmitting(false);
                },
                onError: (errors) => {
                    console.error('Update errors:', errors);
                    const errorMsg = typeof errors === 'object' ? JSON.stringify(errors, null, 2) : errors;
                    alert('Update failed:\n' + errorMsg);
                    setSubmitting(false);
                },
                onFinish: () => {
                    console.log('onFinish triggered');
                    setSubmitting(false);
                },
                preserveState: false,
                preserveScroll: false,
            });
            console.log('router.put called successfully');
        } catch (error) {
            console.error('Exception during router.put:', error);
            alert('Error: ' + (error as Error).message);
            setSubmitting(false);
        }
    };

    const handleDownloadBond = async () => {
        if (downloadingBond) {
            return;
        }

        if (cart.length === 0) {
            alert(t('Please add at least one item to the cart'));
            return;
        }

        if (!selectedWarehouse) {
            alert(t('Please select a warehouse'));
            return;
        }

        setDownloadingBond(true);

        try {
            const formData = {
                customer_id: selectedCustomer && selectedCustomer !== 'walk-in' ? parseInt(selectedCustomer) : null,
                warehouse_id: parseInt(selectedWarehouse),
                waiter_name: null,
                items: cart.map(item => ({
                    id: item.id,
                    quantity: parseFloat(item.quantity.toString()),
                    price: parseFloat((item.customPrice || item.price).toString()),
                    notes: item.notes || null,
                })),
                discount: parseFloat(discount.toString()) || 0,
                paid_amount: parseFloat(paidAmount.toString()) || 0,
            };

            const response = await fetch(route('pos.preview-bond'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'text/html',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify(formData),
            });

            if (!response.ok) {
                throw new Error('Failed to generate bond preview');
            }

            const html = await response.text();
            const newWindow = window.open('', '_blank', 'width=400,height=600');
            if (newWindow) {
                newWindow.document.write(html);
                newWindow.document.close();
            } else {
                alert(t('Please allow popups to view the bond preview'));
            }

        } catch (error) {
            console.error('Error downloading bond:', error);
            alert(t('Failed to download bond preview'));
        } finally {
            setDownloadingBond(false);
        }
    };

    const filteredProducts = products.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.sku.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <>
            <Head title={t('Edit POS Sale')} />
            <div className="min-h-screen bg-gray-50">
                <div className="flex h-screen">
                    {/* Left Panel - Products */}
                    <div className="flex-1 flex flex-col overflow-hidden">
                        {/* Header */}
                        <div className="bg-white border-b p-4">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-4">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => router.visit(route('pos.orders'))}
                                    >
                                        <ArrowLeft className="h-4 w-4 mr-2" />
                                        {t('Back to Orders')}
                                    </Button>
                                    <h1 className="text-2xl font-bold">{t('Edit Sale')} {sale.sale_number}</h1>
                                </div>
                            </div>

                            {/* Filters */}
                            <div className="grid grid-cols-3 gap-4">
                                <Select value={selectedWarehouse} onValueChange={setSelectedWarehouse}>
                                    <SelectTrigger>
                                        <SelectValue placeholder={t('Select Warehouse')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {warehouses.map(warehouse => (
                                            <SelectItem key={warehouse.id} value={warehouse.id.toString()}>
                                                {warehouse.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                                    <SelectTrigger>
                                        <SelectValue placeholder={t('All Categories')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">{t('All Categories')}</SelectItem>
                                        {categories.map(category => (
                                            <SelectItem key={category.id} value={category.id.toString()}>
                                                {category.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                <Input
                                    placeholder={t('Search products...')}
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Products Grid */}
                        <div className="flex-1 overflow-y-auto p-4">
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                {filteredProducts.map(product => (
                                    <Card
                                        key={product.id}
                                        className="cursor-pointer hover:shadow-lg transition-shadow"
                                        onClick={() => addToCart(product)}
                                    >
                                        <CardContent className="p-4">
                                            {product.image && (
                                                <img
                                                    src={getImagePath(product.image)}
                                                    alt={product.name}
                                                    className="w-full h-32 object-cover rounded mb-2"
                                                />
                                            )}
                                            <h3 className="font-semibold text-sm mb-1 truncate">{product.name}</h3>
                                            <p className="text-xs text-gray-500 mb-2">{product.sku}</p>
                                            <div className="flex justify-between items-center">
                                                <span className="font-bold">{formatCurrency(product.price, globalSettings)}</span>
                                                <span className="text-xs text-gray-500">{t('Stock')}: {product.stock}</span>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right Panel - Cart */}
                    <div className="w-96 bg-white border-l flex flex-col">
                        {/* Cart Header */}
                        <div className="p-4 border-b">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-bold flex items-center gap-2">
                                    <ShoppingCart className="h-5 w-5" />
                                    {t('Cart')} ({cart.length})
                                </h2>
                            </div>

                            <Select value={selectedCustomer || "walk-in"} onValueChange={(value) => setSelectedCustomer(value === "walk-in" ? "" : value)}>
                                <SelectTrigger>
                                    <SelectValue placeholder={t('Walk-in Customer')} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="walk-in">{t('Walk-in Customer')}</SelectItem>
                                    {customers.map(customer => (
                                        <SelectItem key={customer.id} value={customer.id.toString()}>
                                            {customer.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Cart Items */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-2">
                            {cart.map(item => (
                                <Card key={item.id}>
                                    <CardContent className="p-3">
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex-1">
                                                <h4 className="font-semibold text-sm">{item.name}</h4>
                                                <p className="text-xs text-gray-500">{item.sku}</p>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => removeFromCart(item.id)}
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>

                                        <div className="flex items-center gap-2 mb-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                            >
                                                <Minus className="h-3 w-3" />
                                            </Button>
                                            <Input
                                                type="number"
                                                value={item.quantity}
                                                onChange={(e) => updateQuantity(item.id, parseFloat(e.target.value) || 0)}
                                                className="w-16 text-center"
                                            />
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                            >
                                                <Plus className="h-3 w-3" />
                                            </Button>
                                            <Input
                                                type="number"
                                                value={item.customPrice || item.price}
                                                onChange={(e) => updatePrice(item.id, parseFloat(e.target.value) || 0)}
                                                className="w-24"
                                                step="0.01"
                                            />
                                        </div>

                                        <Input
                                            placeholder={t('Notes (optional)')}
                                            value={item.notes || ''}
                                            onChange={(e) => updateNotes(item.id, e.target.value)}
                                            className="text-xs"
                                        />

                                        <div className="mt-2 text-right font-semibold">
                                            {formatCurrency(calculateItemTotal(item), globalSettings)}
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>

                        {/* Cart Summary */}
                        <div className="p-4 border-t space-y-3">
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span>{t('Subtotal')}:</span>
                                    <span>{formatCurrency(calculateSubtotal(), globalSettings)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span>{t('Tax')}:</span>
                                    <span>{formatCurrency(calculateTax(), globalSettings)}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span>{t('Discount')}:</span>
                                    <Input
                                        type="number"
                                        value={discount}
                                        onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                                        className="w-24 h-8"
                                        step="0.01"
                                    />
                                </div>
                                <Separator />
                                <div className="flex justify-between text-lg font-bold">
                                    <span>{t('Total')}:</span>
                                    <span>{formatCurrency(calculateTotal(), globalSettings)}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span>{t('Paid Amount')}:</span>
                                    <Input
                                        type="number"
                                        value={paidAmount}
                                        onChange={(e) => setPaidAmount(parseFloat(e.target.value) || 0)}
                                        className="w-24 h-8"
                                        step="0.01"
                                    />
                                </div>
                                <div className="flex justify-between text-sm font-semibold text-red-600">
                                    <span>{t('Balance Due')}:</span>
                                    <span>{formatCurrency(calculateTotal() - paidAmount, globalSettings)}</span>
                                </div>
                            </div>

                            <Button
                                className="w-full mb-2"
                                size="lg"
                                variant="outline"
                                onClick={handleDownloadBond}
                                disabled={cart.length === 0 || downloadingBond}
                            >
                                <Download className="h-4 w-4 mr-2" />
                                {downloadingBond ? t('Generating...') : t('Download Bond')}
                            </Button>

                            <Button
                                className="w-full"
                                size="lg"
                                onClick={handleSubmit}
                                disabled={cart.length === 0 || submitting}
                            >
                                {submitting ? t('Updating...') : t('Update Sale')}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

function EditWrapper(props: EditProps) {
    useFavicon(); // Call useFavicon inside BrandProvider
    return <EditContent {...props} />;
}

export default function Edit(props: EditProps) {
    return (
        <BrandProvider>
            <EditWrapper {...props} />
        </BrandProvider>
    );
}

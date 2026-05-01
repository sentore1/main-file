/**
 * POS Create Page - Debugging Guide
 * 
 * If products are not showing:
 * 1. Open browser console (F12) and check for:
 *    - "Fetching products from: /pos/products?warehouse_id=X"
 *    - "Products response status: 200"
 *    - "Products data received: [...]"
 *    - "Number of products: X"
 * 
 * 2. Check Laravel logs at storage/logs/laravel.log for:
 *    - "POS getProducts Request" - shows warehouse_id and category_id
 *    - "POS getProducts Response" - shows count and first product
 * 
 * 3. Common issues:
 *    - No warehouse selected: Check "Initial warehouse" in console
 *    - No products in stock: Backend only returns products with quantity > 0
 *    - Wrong creator_id: Products must belong to current user/company
 *    - Products are inactive: Only is_active=true products are returned
 *    - Products are services: type != 'service' filter is applied
 * 
 * 4. Test the API directly:
 *    - Visit: https://pryro.eastgatehotel.rw/pos/products?warehouse_id=1
 *    - Should return JSON array of products
 */
import { Head, router, usePage, Link } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ShoppingCart, Search, CreditCard, Plus, Minus, Trash2, X, Home, Printer, FileText, Image, Package, Barcode, UserPlus, Edit2, Check } from 'lucide-react';
import { getImagePath, formatCurrency,formatDate } from '@/utils/helpers';
import { useFavicon } from '@/hooks/use-favicon';
import { useFormFields } from '@/hooks/useFormFields';
import { BrandProvider } from '@/contexts/brand-context';
import ReceiptModal from './ReceiptModal';

// Declare global route function
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
    is_room?: boolean;
    floor?: number;
    max_occupancy?: number;
    room_type_color?: string;
    room_type_name?: string;
    taxes?: Array<{
        id: number;
        name: string;
        rate: number;
    }>;
}

interface CartItem extends Product {
    quantity: number;
    customPrice?: number;
    notes?: string;
    includes_breakfast?: boolean;
    number_of_guests?: number;
    breakfast_price?: number;
}

interface CreateProps {
    customers: Customer[];
    warehouses: WarehouseType[];
    categories: Category[];
}

function CreateContent({ customers = [], warehouses = [], categories = [] }: CreateProps) {
    const { t } = useTranslation();
    const { adminAllSetting, companyAllSetting, auth } = usePage().props as any;
    useFavicon();

    const isSuperAdmin = auth?.user?.roles?.includes('superadmin');
    const globalSettings = isSuperAdmin ? adminAllSetting : companyAllSetting;

    const [selectedCustomer, setSelectedCustomer] = useState('');
    const [selectedWarehouse, setSelectedWarehouse] = useState(() => {
        const saved = sessionStorage.getItem('pos_selected_warehouse');
        const initial = saved || (warehouses.length > 0 ? warehouses[0].id.toString() : '');
        console.log('Initial warehouse:', initial, 'Warehouses:', warehouses);
        return initial;
    });
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [skuInput, setSkuInput] = useState('');
    const [products, setProducts] = useState<Product[]>([]);
    const [rooms, setRooms] = useState<Product[]>([]);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
    const [newCustomer, setNewCustomer] = useState({ name: '', email: '', phone: '' });
    const [editingPriceId, setEditingPriceId] = useState<number | null>(null);
    const [editingNotesId, setEditingNotesId] = useState<number | null>(null);
    const [selectedRoomType, setSelectedRoomType] = useState<string>('all');
    const [roomTypes, setRoomTypes] = useState<Array<{id: number; name: string; color: string}>>([]);
    const [checkInDate, setCheckInDate] = useState('');
    const [checkOutDate, setCheckOutDate] = useState('');

    // Debug: Log component mount and initial state
    useEffect(() => {
        console.log('=== POS Create Component Mounted ===');
        console.log('Warehouses:', warehouses);
        console.log('Categories:', categories);
        console.log('Initial selectedWarehouse:', selectedWarehouse);
        console.log('Initial selectedCategory:', selectedCategory);
    }, []);

    useEffect(() => {
        if (selectedWarehouse) {
            setLoading(true);
            
            if (selectedCategory === 'rooms') {
                const params = new URLSearchParams({ warehouse_id: selectedWarehouse });
                if (selectedRoomType && selectedRoomType !== 'all') {
                    params.append('room_type_id', selectedRoomType);
                }
                
                const url = `/pos/rooms?${params}`;
                console.log('Fetching rooms from:', url);
                
                fetch(url, {
                    headers: {
                        'Accept': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest'
                    }
                })
                    .then(response => {
                        console.log('Rooms response status:', response.status);
                        if (!response.ok) {
                            throw new Error(`HTTP error! status: ${response.status}`);
                        }
                        return response.json();
                    })
                    .then(data => {
                        console.log('Rooms data received:', data);
                        setRooms(data);
                        setProducts([]);
                    })
                    .catch(error => {
                        console.error('Error fetching rooms:', error);
                        setRooms([]);
                        setProducts([]);
                    })
                    .finally(() => setLoading(false));
            } else {
                const params = new URLSearchParams({ warehouse_id: selectedWarehouse });
                if (selectedCategory && selectedCategory !== 'all') {
                    params.append('category_id', selectedCategory);
                }
                
                const url = `/pos/products?${params}`;
                console.log('Fetching products from:', url);
                console.log('Selected warehouse:', selectedWarehouse);
                console.log('Selected category:', selectedCategory);
                
                fetch(url, {
                    headers: {
                        'Accept': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest'
                    }
                })
                    .then(response => {
                        console.log('Products response status:', response.status);
                        console.log('Products response headers:', response.headers);
                        if (!response.ok) {
                            return response.text().then(text => {
                                console.error('Error response body:', text);
                                throw new Error(`HTTP error! status: ${response.status}`);
                            });
                        }
                        return response.json();
                    })
                    .then(data => {
                        console.log('Products data received:', data);
                        console.log('Number of products:', Array.isArray(data) ? data.length : 'not an array');
                        setProducts(data);
                        setRooms([]);
                    })
                    .catch(error => {
                        console.error('Error fetching products:', error);
                        setProducts([]);
                        setRooms([]);
                    })
                    .finally(() => setLoading(false));
            }
        }
    }, [selectedWarehouse, selectedCategory, selectedRoomType]);

    // Clear cart only when warehouse changes
    useEffect(() => {
        setCart([]);
    }, [selectedWarehouse]);

    // Fetch room types when warehouse is selected
    useEffect(() => {
        if (selectedWarehouse && selectedCategory === 'rooms') {
            fetch(`/pos/room-types?warehouse_id=${selectedWarehouse}`, {
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                }
            })
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    return response.json();
                })
                .then(data => setRoomTypes(data))
                .catch(error => {
                    console.error('Error fetching room types:', error);
                    setRoomTypes([]);
                });
        }
    }, [selectedWarehouse, selectedCategory]);

    const handleSkuInput = (value: string) => {
        setSkuInput(value);
        if (value.trim() && selectedWarehouse) {
            const allItems = [...products, ...rooms];
            const matchedProduct = allItems.find(product =>
                product.sku === value
            );
            if (matchedProduct) {
                addToCart(matchedProduct);
                setSkuInput('');
            }
        }
    };

    const addToCart = (product: Product) => {
        setCart(prev => {
            const existing = prev.find(item => item.id === product.id);
            if (existing) {
                return prev.map(item =>
                    item.id === product.id
                        ? { ...item, quantity: Math.min(item.quantity + 1, product.stock) }
                        : item
                );
            }
            
            // For rooms (accommodation), calculate nights from check-in/check-out dates
            let quantity = 1;
            if (product.is_room && checkInDate && checkOutDate) {
                const checkIn = new Date(checkInDate);
                const checkOut = new Date(checkOutDate);
                const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
                quantity = nights > 0 ? nights : 1;
            }
            
            return [...prev, { 
                ...product, 
                quantity: quantity,
                breakfast_price: 0, // Breakfast is free/complimentary
                includes_breakfast: false,
                number_of_guests: product.is_room ? 1 : undefined
            }];
        });
    };

    const updateQuantity = (id: number, quantity: number) => {
        if (quantity <= 0) {
            setCart(prev => prev.filter(item => item.id !== id));
        } else {
            setCart(prev => prev.map(item =>
                item.id === id ? { ...item, quantity } : item
            ));
        }
    };

    const updatePrice = (id: number, newPrice: number) => {
        setCart(prev => prev.map(item =>
            item.id === id ? { ...item, customPrice: newPrice } : item
        ));
    };

    const updateNotes = (id: number, notes: string) => {
        setCart(prev => prev.map(item =>
            item.id === id ? { ...item, notes } : item
        ));
    };

    const getItemPrice = (item: CartItem) => {
        return item.customPrice !== undefined ? item.customPrice : item.price;
    };

    const getSubtotal = () => cart.reduce((sum, item) => sum + (getItemPrice(item) * item.quantity), 0);
    
    const getBreakfastTotal = () => {
        // Breakfast is complimentary - no charge
        return 0;
    };
    
    const getTaxAmount = () => {
        let totalTax = 0;
        cart.forEach(item => {
            const itemSubtotal = getItemPrice(item) * item.quantity;
            if (item.taxes && item.taxes.length > 0) {
                item.taxes.forEach(tax => {
                    totalTax += (itemSubtotal * tax.rate) / 100;
                });
            }
        });
        return totalTax;
    };

    const getTaxBreakdown = () => {
        const taxBreakdown: { [key: string]: { name: string; amount: number } } = {};
        cart.forEach(item => {
            const itemSubtotal = getItemPrice(item) * item.quantity;
            if (item.taxes && item.taxes.length > 0) {
                item.taxes.forEach(tax => {
                    const taxAmount = (itemSubtotal * tax.rate) / 100;
                    const taxKey = `${tax.name}_${tax.rate}`;
                    if (taxBreakdown[taxKey]) {
                        taxBreakdown[taxKey].amount += taxAmount;
                    } else {
                        taxBreakdown[taxKey] = {
                            name: `${tax.name} (${tax.rate}%)`,
                            amount: taxAmount
                        };
                    }
                });
            }
        });
        return Object.values(taxBreakdown);
    };
    const getTotal = () => getSubtotal() + getTaxAmount() + getBreakfastTotal() - discountAmount;

    const [discountAmount, setDiscountAmount] = useState(0);
    const [waiterName, setWaiterName] = useState('');
    const [processing, setProcessing] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [showReceiptModal, setShowReceiptModal] = useState(false);
    const [completedSale, setCompletedSale] = useState<any>(null);
    const [paidAmount, setPaidAmount] = useState('0');
    const [paymentMethod, setPaymentMethod] = useState('cash');
    const [selectedRoomBooking, setSelectedRoomBooking] = useState<any>(null);
    const [nextPosNumber, setNextPosNumber] = useState('');

    // Detect if selected customer has an active room booking
    useEffect(() => {
        if (selectedCustomer) {
            const customer = customers.find(c => c.id.toString() === selectedCustomer);
            if (customer && (customer.roomBookings || customer.room_bookings)) {
                // Handle both camelCase and snake_case
                const bookings = customer.roomBookings || customer.room_bookings;
                if (bookings && bookings.length > 0) {
                    // Get the first active booking
                    setSelectedRoomBooking(bookings[0]);
                    console.log('Selected room booking:', bookings[0]);
                } else {
                    setSelectedRoomBooking(null);
                }
            } else {
                setSelectedRoomBooking(null);
            }
        } else {
            setSelectedRoomBooking(null);
        }
    }, [selectedCustomer, customers]);
    const [data, setData] = useState(() => {
        const savedBankAccount = sessionStorage.getItem('pos_selected_bank_account');
        return {
            bank_account_id: savedBankAccount || ''
        };
    });
    const [errors, setErrors] = useState({});


    // Custom setData function to persist bank account selection
    const handleSetData = (key: string, value: any) => {
        if (key === 'bank_account_id') {
            sessionStorage.setItem('pos_selected_bank_account', value);
        }
        setData(prev => ({ ...prev, [key]: value }));
    };

    const bankAccountField = useFormFields('bankAccountField', data, handleSetData, errors);

    useEffect(() => {
        // Fetch next POS number from backend
        fetch('/pos/pos-number', {
            headers: {
                'Accept': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            }
        })
            .then(response => response.json())
            .then(data => setNextPosNumber(data.pos_number))
            .catch(error => {
                // Fallback to generated number
                const randomCount = Math.floor(Math.random() * 100) + 1;
                setNextPosNumber('#POS' + String(randomCount).padStart(5, '0'));
            });
    }, []);

    const handlePayment = () => {
        setProcessing(true);
        
        // Get current bank account ID from sessionStorage
        const currentBankAccountId = data.bank_account_id || sessionStorage.getItem('pos_selected_bank_account');

        const formData = {
            customer_id: selectedCustomer || null,
            room_booking_id: paymentMethod === 'charge_to_room' && selectedRoomBooking ? selectedRoomBooking.id : null,
            charged_to_room: paymentMethod === 'charge_to_room',
            warehouse_id: selectedWarehouse,
            bank_account_id: currentBankAccountId || null,
            waiter_name: waiterName || null,
            items: cart.map(item => ({
                id: item.id,
                quantity: item.quantity,
                price: getItemPrice(item),
                notes: item.notes || null,
                is_room: item.is_room || false,
                includes_breakfast: item.includes_breakfast || false,
            })),
            discount: discountAmount,
            tax_amount: getTaxAmount(),
            payment_method: paymentMethod,
            // If charging to room, paid_amount should be 0
            paid_amount: paymentMethod === 'charge_to_room' ? 0 : parseFloat(paidAmount || '0'),
            pos_number: nextPosNumber,
            check_in_date: new Date().toISOString().split('T')[0]
        };

        router.post('/pos/store', formData, {
            onSuccess: (page) => {
                setProcessing(false);
                
                // Check if we got sale data back
                if (page.props && page.props.sale) {
                    const saleData = page.props.sale;
                    setCompletedSale({
                        pos_number: saleData.sale_number,
                        items: cart,
                        subtotal: saleData.subtotal || getSubtotal(),
                        tax: saleData.tax_amount || getTaxAmount(),
                        discount: saleData.discount_amount || discountAmount,
                        total: saleData.total_amount || getTotal(),
                        customer: selectedCustomer ? customers.find(c => c.id.toString() === selectedCustomer) : null,
                        warehouse: warehouses.find(w => w.id.toString() === selectedWarehouse),
                        payment_method: paymentMethod,
                        paid_amount: saleData.paid_amount || parseFloat(paidAmount || '0'),
                        balance_due: saleData.balance_due || (getTotal() - parseFloat(paidAmount || '0')),
                        waiter_name: waiterName
                    });
                    // Close payment modal first, then show receipt
                    setShowPaymentModal(false);
                    setTimeout(() => {
                        setShowReceiptModal(true);
                        // Clear cart after showing receipt
                        setCart([]);
                        setWaiterName('');
                        setPaidAmount('0');
                    }, 100);
                    return;
                }
                
                // Fallback: Show receipt modal with current data
                setCompletedSale({
                    pos_number: nextPosNumber,
                    items: cart,
                    subtotal: getSubtotal(),
                    tax: getTaxAmount(),
                    discount: discountAmount,
                    total: getTotal(),
                    customer: selectedCustomer ? customers.find(c => c.id.toString() === selectedCustomer) : null,
                    warehouse: warehouses.find(w => w.id.toString() === selectedWarehouse),
                    payment_method: paymentMethod,
                    paid_amount: parseFloat(paidAmount || '0'),
                    balance_due: getTotal() - parseFloat(paidAmount || '0'),
                    waiter_name: waiterName
                });
                // Close payment modal first, then show receipt
                setShowPaymentModal(false);
                setTimeout(() => {
                    setShowReceiptModal(true);
                    // Clear cart
                    setCart([]);
                    setWaiterName('');
                    setPaidAmount('0');
                }, 100);
            },
            onError: (errors) => {
                setProcessing(false);
                console.error('Payment failed:', errors);
                alert(t('Payment failed. Please try again. If the problem persists, please refresh the page.'));
            },
            preserveState: true,
            preserveScroll: true,
            onFinish: () => {
                setProcessing(false);
            }
        });
    };

    const handlePaymentComplete = () => {
        setShowReceiptModal(false);
        setCart([]);
        setSelectedCustomer('');
        setDiscountAmount(0);
        setCompletedSale(null);
        // Refresh POS number for next transaction
        fetch('/pos/pos-number', {
            headers: {
                'Accept': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            }
        })
            .then(response => response.json())
            .then(data => setNextPosNumber(data.pos_number))
            .catch(error => console.error('Error fetching new POS number:', error));
    };

    const handleAddCustomer = () => {
        if (!newCustomer.name || !newCustomer.email) {
            alert(t('Please fill in name and email'));
            return;
        }

        fetch('/pos/customers', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
            },
            body: JSON.stringify(newCustomer)
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Add new customer to the list
                customers.push(data.customer);
                setSelectedCustomer(data.customer.id.toString());
                setShowAddCustomerModal(false);
                setNewCustomer({ name: '', email: '', phone: '' });
                alert(data.message);
            } else {
                alert(data.message);
            }
        })
        .catch(error => {
            console.error('Error creating customer:', error);
            alert(t('Failed to create customer'));
        });
    };

    const filteredProducts = selectedCategory === 'rooms' 
        ? rooms.filter(room =>
            room.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            room.sku.toLowerCase().includes(searchTerm.toLowerCase())
        )
        : products.filter(product =>
            product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.sku.toLowerCase().includes(searchTerm.toLowerCase())
        );

    // Debug: Log filtered products
    useEffect(() => {
        console.log('=== Products State ===');
        console.log('selectedCategory:', selectedCategory);
        console.log('products array:', products);
        console.log('rooms array:', rooms);
        console.log('searchTerm:', searchTerm);
        console.log('filteredProducts:', filteredProducts);
        console.log('filteredProducts.length:', filteredProducts.length);
    }, [products, rooms, filteredProducts, selectedCategory, searchTerm]);

    return (
        <>
            <Head title={t('POS')} />

            <div className="h-screen bg-gray-50 flex flex-col">
                <div className="flex flex-col lg:flex-row flex-1 overflow-hidden p-2 sm:p-4 gap-2 sm:gap-4 min-h-0">
                    {/* Products Section Card */}
                    <Card className="flex-1 flex flex-col min-w-0 order-2 lg:order-1">
                        <CardContent className="p-3 sm:p-6 flex flex-col h-full overflow-hidden">
                        {/* Controls */}
                        <div className="mb-4 sm:mb-6 space-y-2 sm:space-y-4 flex-shrink-0">
                            <div className="flex flex-col lg:flex-row gap-2 items-stretch lg:items-center">
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Link href="/pos">
                                                <Button variant="outline" className="h-10 px-3 w-full lg:w-auto">
                                                    <Home className="h-4 w-4" />
                                                </Button>
                                            </Link>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>{t('Home')}</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>

                                <div className="relative flex-1 lg:w-80">
                                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                    <Input
                                        placeholder={t('Search products...')}
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-10 h-10"
                                    />
                                </div>

                                <div className="flex gap-2 w-full lg:w-80">
                                    <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
                                        <SelectTrigger className="h-10 flex-1">
                                            <SelectValue placeholder={t('Walk-in Customer')} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {customers.map(customer => (
                                                <SelectItem key={customer.id} value={customer.id.toString()}>
                                                    {customer.name} - {customer.email}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button 
                                                    variant="outline" 
                                                    className="h-10 px-3"
                                                    onClick={() => setShowAddCustomerModal(true)}
                                                >
                                                    <UserPlus className="h-4 w-4" />
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>{t('Add New Customer')}</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                </div>

                                <Select value={selectedWarehouse} onValueChange={(value) => {
                                    setSelectedWarehouse(value);
                                    sessionStorage.setItem('pos_selected_warehouse', value);
                                }}>
                                    <SelectTrigger className="h-10 w-full lg:w-96">
                                        <SelectValue placeholder={t('Select Warehouse')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {warehouses.map(warehouse => (
                                            <SelectItem key={warehouse.id} value={warehouse.id.toString()}>
                                                {warehouse.name} - {warehouse.address}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <div className="relative lg:w-72">
                                                <Barcode className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                                <Input
                                                    placeholder={t('Add To Cart by SKU')}
                                                    className="pl-10 h-10"
                                                    value={skuInput}
                                                    onChange={(e) => handleSkuInput(e.target.value)}
                                                />
                                            </div>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>{t('Enter SKU to add product to cart.')}</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            </div>

                            <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 hover:scrollbar-thumb-gray-400">
                                <Button
                                    variant={selectedCategory === 'all' ? 'default' : 'outline'}
                                    onClick={() => {
                                        setSelectedCategory('all');
                                        setSelectedRoomType('all');
                                    }}
                                >
                                    {t('All')}
                                </Button>
                                <Button
                                    variant={selectedCategory === 'rooms' ? 'default' : 'outline'}
                                    onClick={() => {
                                        setSelectedCategory('rooms');
                                        setSelectedRoomType('all');
                                    }}
                                    className="bg-blue-50 hover:bg-blue-100 border-blue-200"
                                >
                                    🏨 {t('Accommodation')}
                                </Button>
                                {categories.map(category => (
                                    <Button
                                        key={category.id}
                                        variant={selectedCategory === category.id.toString() ? 'default' : 'outline'}
                                        onClick={() => {
                                            setSelectedCategory(category.id.toString());
                                            setSelectedRoomType('all');
                                        }}
                                    >
                                        {category.name}
                                    </Button>
                                ))}
                            </div>
                            
                            {/* Room Type Filter - Only show when Accommodation is selected */}
                            {selectedCategory === 'rooms' && roomTypes.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-2 p-2 bg-blue-50 rounded-lg border border-blue-200">
                                    <span className="text-sm font-medium text-blue-900 self-center">{t('Room Type')}:</span>
                                    <Button
                                        size="sm"
                                        variant={selectedRoomType === 'all' ? 'default' : 'outline'}
                                        onClick={() => setSelectedRoomType('all')}
                                    >
                                        {t('All Types')}
                                    </Button>
                                    {roomTypes.map(type => (
                                        <Button
                                            key={type.id}
                                            size="sm"
                                            variant={selectedRoomType === type.id.toString() ? 'default' : 'outline'}
                                            onClick={() => setSelectedRoomType(type.id.toString())}
                                            style={{
                                                backgroundColor: selectedRoomType === type.id.toString() ? type.color : 'transparent',
                                                borderColor: type.color,
                                                color: selectedRoomType === type.id.toString() ? 'white' : type.color
                                            }}
                                        >
                                            {type.name}
                                        </Button>
                                    ))}
                                </div>
                            )}
                            
                            {/* Check-in/Check-out Dates - Only show when Accommodation is selected */}
                            {selectedCategory === 'rooms' && (
                                <div className="flex gap-4 mt-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                                    <div className="flex-1">
                                        <label className="block text-sm font-medium text-blue-900 mb-1">
                                            {t('Check-in Date')}
                                        </label>
                                        <Input
                                            type="date"
                                            value={checkInDate}
                                            onChange={(e) => setCheckInDate(e.target.value)}
                                            className="h-9"
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <label className="block text-sm font-medium text-blue-900 mb-1">
                                            {t('Check-out Date')}
                                        </label>
                                        <Input
                                            type="date"
                                            value={checkOutDate}
                                            onChange={(e) => setCheckOutDate(e.target.value)}
                                            className="h-9"
                                        />
                                    </div>
                                    {checkInDate && checkOutDate && (
                                        <div className="flex items-end">
                                            <div className="text-sm font-semibold text-blue-900 bg-white px-3 py-2 rounded border border-blue-300">
                                                {Math.ceil((new Date(checkOutDate).getTime() - new Date(checkInDate).getTime()) / (1000 * 60 * 60 * 24))} {t('nights')}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Products Grid */}
                        <div className="flex-1 overflow-y-auto min-h-0">
                        {loading ? (
                            <div className="text-center py-12">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                                <p className="mt-2 text-gray-500">{t('Loading products...')}</p>
                            </div>
                        ) : filteredProducts.length > 0 ? (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-4">
                                {filteredProducts.map(product => (
                                    <Card
                                        key={product.id}
                                        className={`cursor-pointer hover:shadow-md transition-all ${product.is_room ? 'border-2' : ''}`}
                                        style={product.is_room && product.room_type_color ? { borderColor: product.room_type_color } : {}}
                                        onClick={() => addToCart(product)}
                                    >
                                        <CardContent className="p-4">
                                            {/* Room Type Badge for Rooms */}
                                            {product.is_room && product.room_type_name && (
                                                <div className="mb-2">
                                                    <Badge 
                                                        className="text-xs"
                                                        style={{ 
                                                            backgroundColor: product.room_type_color || '#3B82F6',
                                                            color: 'white'
                                                        }}
                                                    >
                                                        {product.room_type_name}
                                                    </Badge>
                                                </div>
                                            )}
                                            
                                            <div className="aspect-square bg-gray-100 rounded mb-3 flex items-center justify-center relative">
                                                {product.image ? (
                                                    <img
                                                        src={getImagePath(product.image)}
                                                        alt={product.name}
                                                        className="w-full h-full object-cover rounded"
                                                        onError={(e) => {
                                                            const target = e.target as HTMLImageElement;
                                                            target.style.display = 'none';
                                                            const parent = target.parentElement;
                                                            if (parent) {
                                                                parent.innerHTML = '<div class="flex items-center justify-center w-full h-full"><svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg></div>';
                                                            }
                                                        }}
                                                    />
                                                ) : (
                                                    <Image className="w-8 h-8 text-gray-400" />
                                                )}
                                                
                                                {/* Floor indicator for rooms */}
                                                {product.is_room && product.floor && (
                                                    <div className="absolute top-1 right-1 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                                                        Floor {product.floor}
                                                    </div>
                                                )}
                                            </div>
                                            
                                            <h3 className="font-medium truncate">{product.name}</h3>
                                            <p className="text-sm text-gray-500">{product.sku}</p>
                                            
                                            {/* Room-specific info */}
                                            {product.is_room && product.max_occupancy && (
                                                <div className="flex items-center gap-1 text-xs text-gray-600 mt-1">
                                                    <span>👥</span>
                                                    <span>Max {product.max_occupancy} guests</span>
                                                </div>
                                            )}
                                            
                                            <div className="flex justify-between items-center mt-2">
                                                <span className="font-bold text-green-600">
                                                    {formatCurrency(product.price)}{product.is_room ? '/night' : ''}
                                                </span>
                                                <Badge variant={product.stock > 0 ? "secondary" : "destructive"}>
                                                    {Math.floor(product.stock)}
                                                </Badge>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12">
                                <Package className="h-12 w-12 text-gray-400 mb-2 mx-auto" />
                                <p className="text-gray-500">{t('No products available')}</p>
                            </div>
                        )}
                        </div>
                        </CardContent>
                    </Card>

                    {/* Cart Sidebar Card */}
                    <Card className="w-full lg:w-80 xl:w-96 flex flex-col flex-shrink-0 min-h-0 order-1 lg:order-2 max-h-[40vh] lg:max-h-none">
                        <CardContent className="p-3 sm:p-4 xl:p-6 border-b flex-shrink-0">
                            {bankAccountField.map((field) => (
                                <div key={field.id}>{field.component}</div>
                            ))}
                            <div className="flex items-center justify-between mt-4">
                                <h3 className="text-lg font-bold text-gray-800 flex items-center">
                                    <ShoppingCart className="h-5 w-5 mr-2 text-gray-600" />
                                    {t('Shopping Cart')}
                                </h3>
                                <div className="flex items-center space-x-2">
                                    <Badge variant="secondary">
                                        {cart.length}
                                    </Badge>
                                    {cart.length > 0 && (
                                        <X
                                            className="h-4 w-4 text-red-500 cursor-pointer hover:text-red-700"
                                            onClick={() => setCart([])}
                                        />
                                    )}
                                </div>
                            </div>
                        </CardContent>

                        <CardContent className="flex-1 overflow-auto p-2 sm:p-3 xl:p-4 min-h-0">
                            {cart.length === 0 ? (
                                <div className="text-center py-12">
                                    <div className="bg-gray-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                                        <ShoppingCart className="h-10 w-10 text-gray-400" />
                                    </div>
                                    <h3 className="text-lg font-medium text-gray-600 mb-2">{t('Your cart is empty')}</h3>
                                    <p className="text-sm text-gray-500">{t('Add products to get started')}</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {cart.map(item => (
                                        <div key={item.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:shadow-md transition-shadow">
                                            <div className="flex items-center space-x-3 mb-3">
                                                <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center flex-shrink-0">
                                                    {item.image ? (
                                                        <img
                                                            src={getImagePath(item.image)}
                                                            alt={item.name}
                                                            className="w-full h-full object-cover rounded"
                                                            onError={(e) => {
                                                                const target = e.target as HTMLImageElement;
                                                                target.style.display = 'none';
                                                                const parent = target.parentElement;
                                                                if (parent) {
                                                                    parent.innerHTML = '<svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>';
                                                                }
                                                            }}
                                                        />
                                                    ) : (
                                                        <Image className="w-4 h-4 text-gray-400" />
                                                    )}
                                                </div>
                                <div className="flex-1 min-w-0">
                                                    <h4 className="font-semibold text-gray-900 text-sm truncate">{item.name}</h4>
                                                    <div className="flex items-center gap-2">
                                                        {editingPriceId === item.id ? (
                                                            <div className="flex items-center gap-1">
                                                                <Input
                                                                    type="number"
                                                                    value={getItemPrice(item)}
                                                                    onChange={(e) => updatePrice(item.id, parseFloat(e.target.value) || 0)}
                                                                    className="h-6 w-20 text-xs"
                                                                    step="0.01"
                                                                    min="0"
                                                                />
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => setEditingPriceId(null)}
                                                                    className="h-6 w-6 p-0"
                                                                >
                                                                    <Check className="h-3 w-3 text-green-600" />
                                                                </Button>
                                                            </div>
                                                        ) : (
                                                            <div className="flex items-center gap-1">
                                                                <p className="text-sm font-medium text-green-600">
                                                                    {formatCurrency(getItemPrice(item))} {t('each')}
                                                                </p>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => setEditingPriceId(item.id)}
                                                                    className="h-5 w-5 p-0 hover:bg-blue-50"
                                                                >
                                                                    <Edit2 className="h-3 w-3 text-blue-600" />
                                                                </Button>
                                                            </div>
                                                        )}
                                                    </div>
                                                    {item.notes && (
                                                        <p className="text-xs text-gray-500 italic mt-1">📝 {item.notes}</p>
                                                    )}
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => updateQuantity(item.id, 0)}
                                                    className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center space-x-3">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                                        className="h-7 w-7 p-0 border-gray-300"
                                                    >
                                                        <Minus className="h-3 w-3" />
                                                    </Button>
                                                    <span className="w-8 text-center font-semibold text-sm">{item.quantity}</span>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                        className="h-7 w-7 p-0 border-gray-300"
                                                        disabled={item.quantity >= item.stock}
                                                    >
                                                        <Plus className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-lg font-bold text-gray-900">
                                                        {formatCurrency(getItemPrice(item) * item.quantity)}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="mt-2">
                                                {editingNotesId === item.id ? (
                                                    <div className="flex gap-1">
                                                        <Input
                                                            type="text"
                                                            placeholder={t('Add notes (e.g., Indian Rice)')}
                                                            value={item.notes || ''}
                                                            onChange={(e) => updateNotes(item.id, e.target.value)}
                                                            className="h-7 text-xs flex-1"
                                                        />
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => setEditingNotesId(null)}
                                                            className="h-7 px-2"
                                                        >
                                                            <Check className="h-3 w-3 text-green-600" />
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => setEditingNotesId(item.id)}
                                                        className="h-7 text-xs w-full"
                                                    >
                                                        <FileText className="h-3 w-3 mr-1" />
                                                        {item.notes ? t('Edit Notes') : t('Add Notes')}
                                                    </Button>
                                                )}
                                            </div>
                                            
                                            {/* Room-specific fields */}
                                            {item.is_room && (
                                                <div className="mt-2 space-y-2">
                                                    {/* Number of Guests */}
                                                    <div className="flex items-center gap-2 p-2 bg-blue-50 rounded border border-blue-200">
                                                        <label className="text-xs font-medium text-blue-800 flex-shrink-0">
                                                            👥 {t('Guests')}:
                                                        </label>
                                                        <Input
                                                            type="number"
                                                            min={1}
                                                            max={item.max_occupancy || 10}
                                                            value={item.number_of_guests || 1}
                                                            onChange={(e) => {
                                                                setCart(prev => prev.map(cartItem =>
                                                                    cartItem.id === item.id
                                                                        ? { ...cartItem, number_of_guests: parseInt(e.target.value) || 1 }
                                                                        : cartItem
                                                                ));
                                                            }}
                                                            className="h-7 w-16 text-xs"
                                                        />
                                                        <span className="text-xs text-blue-600">
                                                            (Max: {item.max_occupancy || 'N/A'})
                                                        </span>
                                                    </div>
                                                    
                                                    {/* Breakfast Option */}
                                                    <div className="p-2 bg-orange-50 rounded border border-orange-200">
                                                        <div className="flex items-center gap-2">
                                                            <input
                                                                type="checkbox"
                                                                id={`breakfast-${item.id}`}
                                                                checked={item.includes_breakfast || false}
                                                                onChange={(e) => {
                                                                    setCart(prev => prev.map(cartItem =>
                                                                        cartItem.id === item.id
                                                                            ? { 
                                                                                ...cartItem, 
                                                                                includes_breakfast: e.target.checked,
                                                                                breakfast_price: 0 // Breakfast is complimentary
                                                                            }
                                                                            : cartItem
                                                                    ));
                                                                }}
                                                                className="rounded border-orange-300 text-orange-600 focus:ring-orange-500"
                                                            />
                                                            <label htmlFor={`breakfast-${item.id}`} className="text-xs font-medium text-orange-800 cursor-pointer flex-1">
                                                                {t('Include Breakfast (Complimentary)')}
                                                            </label>
                                                        </div>
                                                        {item.includes_breakfast && (
                                                            <div className="mt-2 text-xs text-orange-700 space-y-1">
                                                                <div className="flex justify-between">
                                                                    <span>{t('Price per person')}:</span>
                                                                    <span className="font-medium">{formatCurrency(item.breakfast_price || 0)}</span>
                                                                </div>
                                                                <div className="flex justify-between">
                                                                    <span>{t('Guests')}:</span>
                                                                    <span className="font-medium">{item.number_of_guests || 1}</span>
                                                                </div>
                                                                <div className="flex justify-between">
                                                                    <span>{t('Nights')}:</span>
                                                                    <span className="font-medium">{item.quantity}</span>
                                                                </div>
                                                                <div className="flex justify-between border-t border-orange-300 pt-1 font-bold">
                                                                    <span>{t('Breakfast Total')}:</span>
                                                                    <span>{formatCurrency((item.breakfast_price || 0) * (item.number_of_guests || 1) * item.quantity)}</span>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                            {/* Breakfast Checkbox for Room Items - OLD VERSION TO REMOVE */}
                                            {false && item.is_room && (
                                                <div className="mt-2 flex items-center gap-2 p-2 bg-orange-50 rounded border border-orange-200">
                                                    <input
                                                        type="checkbox"
                                                        id={`breakfast-${item.id}`}
                                                        checked={item.includes_breakfast || false}
                                                        onChange={(e) => {
                                                            setCart(prev => prev.map(cartItem =>
                                                                cartItem.id === item.id
                                                                    ? { ...cartItem, includes_breakfast: e.target.checked }
                                                                    : cartItem
                                                            ));
                                                        }}
                                                        className="rounded border-orange-300 text-orange-600 focus:ring-orange-500"
                                                    />
                                                    <label htmlFor={`breakfast-${item.id}`} className="text-xs font-medium text-orange-800 cursor-pointer">
                                                        {t('Include Breakfast')}
                                                    </label>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>

                        {cart.length > 0 && (
                            <CardContent className="p-2 sm:p-3 xl:p-4 border-t flex-shrink-0">
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center py-0.5">
                                        <span className="text-xs text-gray-600">{t('Subtotal')}</span>
                                        <span className="text-xs text-gray-900">
                                            {formatCurrency(getSubtotal())}
                                        </span>
                                    </div>
                                    {getTaxBreakdown().length > 0 ? (
                                        getTaxBreakdown().map((tax, index) => (
                                            <div key={index} className="flex justify-between items-center py-0.5">
                                                <span className="text-xs text-gray-600">{tax.name}</span>
                                                <span className="text-xs text-gray-900">
                                                    {formatCurrency(tax.amount)}
                                                </span>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="flex justify-between items-center py-0.5">
                                            <span className="text-xs text-gray-600">{t('Tax')}</span>
                                            <span className="text-xs text-gray-900">
                                                {formatCurrency(getTaxAmount())}
                                            </span>
                                        </div>
                                    )}
                                    {getBreakfastTotal() > 0 && (
                                        <div className="flex justify-between items-center py-0.5 bg-orange-50 px-2 rounded">
                                            <span className="text-xs text-orange-700 font-medium">🍳 {t('Breakfast')}</span>
                                            <span className="text-xs text-orange-900 font-medium">
                                                {formatCurrency(getBreakfastTotal())}
                                            </span>
                                        </div>
                                    )}
                                    <div className="flex justify-between items-center py-0.5">
                                        <span className="text-xs text-gray-600">{t('Discount')}</span>
                                        <Input
                                            type="number"
                                            value={discountAmount}
                                            onChange={(e) => setDiscountAmount(Number(e.target.value) || 0)}
                                            className="w-16 h-6 text-right text-xs"
                                            min="0"
                                            max={getSubtotal() + getTaxAmount()}
                                        />
                                    </div>

                                    <div className="flex justify-between items-center py-1 border-t border-gray-200">
                                        <span className="text-lg font-bold text-gray-900">{t('Total')}</span>
                                        <span className="text-xl font-bold text-green-600">
                                            {formatCurrency(getTotal())}
                                        </span>
                                    </div>
                                    <Button
                                        className="w-full h-10 text-sm font-semibold bg-blue-600 hover:bg-blue-700"
                                        onClick={() => {
                                            // If charging to room, set paid amount to 0
                                            if (paymentMethod === 'charge_to_room') {
                                                setPaidAmount('0');
                                            } else {
                                                setPaidAmount(getTotal().toString());
                                            }
                                            setShowPaymentModal(true);
                                        }}
                                        disabled={cart.length === 0 || !selectedWarehouse}
                                    >
                                        <CreditCard className="h-4 w-4 mr-2" />
                                        {t('Checkout')}
                                    </Button>

                                </div>
                            </CardContent>
                        )}
                    </Card>
                </div>
            </div>

            {/* Payment Modal */}
            <Dialog open={showPaymentModal} onOpenChange={(open) => !processing && setShowPaymentModal(open)}>
                <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto backdrop-blur-none" aria-describedby="payment-modal-description">
                    <DialogHeader className="pb-4 border-b">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-lg">
                                <CreditCard className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <DialogTitle className="text-xl font-semibold">{t('Process Payment')}</DialogTitle>
                                <p id="payment-modal-description" className="sr-only">{t('Review and complete your payment')}</p>
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="overflow-y-auto flex-1 p-4">
                        {/* Header Info */}
                        <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6">
                            {/* Left Side - POS Details */}
                            <div className="space-y-2 text-sm">
                                <div>
                                    <span className="font-medium">{t('POS Number')}: </span>
                                    <span>{nextPosNumber}</span>
                                </div>
                                <div>
                                    <span className="font-medium">{t('Date')}: </span>
                                    <span>{formatDate(new Date())}</span>
                                </div>
                                <div>
                                    <span className="font-medium">{t('Customer')}: </span>
                                    <span>{selectedCustomer ? customers.find(c => c.id.toString() === selectedCustomer)?.name : t('Walk-in Customer')}</span>
                                    {selectedRoomBooking && (
                                        <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800">
                                            🏨 Room {selectedRoomBooking.room?.room_number} ({selectedRoomBooking.status})
                                        </span>
                                    )}
                                </div>
                                <div>
                                    <span className="font-medium">{t('Warehouse')}: </span>
                                    <span>{warehouses.find(w => w.id.toString() === selectedWarehouse)?.name}</span>
                                </div>
                            </div>

                            {/* Right Side - Company Details */}
                            <div className="text-right space-y-1 text-sm">
                                <h2 className="text-lg font-bold">{globalSettings?.company_name || 'Company Name'}</h2>
                                <p>{globalSettings?.company_address || 'Company Address'}</p>
                                <p>{globalSettings?.company_city || 'City'}, {globalSettings?.company_state || 'State'}</p>
                                <p>{globalSettings?.company_country || 'Country'} - {globalSettings?.company_zipcode || 'Zipcode'}</p>
                            </div>
                        </div>

                        {/* Products Table */}
                        <Card className="mb-4">
                            <CardContent className="p-0 overflow-x-auto">
                                <table className="w-full min-w-[600px]">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('Product')}</th>
                                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">{t('Qty')}</th>
                                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">{t('Price')}</th>
                                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">{t('Taxes')}</th>
                                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">{t('Tax Amount')}</th>
                                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">{t('Total')}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {cart.map((item) => {
                                            const itemPrice = getItemPrice(item);
                                            const itemSubtotal = itemPrice * item.quantity;
                                            let itemTaxAmount = 0;
                                            let taxDisplay = '';
                                            if (item.taxes && item.taxes.length > 0) {
                                                const taxNames = item.taxes.map(tax => {
                                                    itemTaxAmount += (itemSubtotal * tax.rate) / 100;
                                                    return `${tax.name} (${tax.rate}%)`;
                                                });
                                                taxDisplay = taxNames.join(', ');
                                            } else {
                                                taxDisplay = 'No Tax';
                                            }
                                            return (
                                                <tr key={item.id}>
                                                    <td className="px-4 py-3">
                                                        <div>
                                                            <p className="text-sm font-medium text-gray-900">{item.name}</p>
                                                            <p className="text-xs text-gray-500">{item.sku}</p>
                                                            {item.notes && (
                                                                <p className="text-xs text-blue-600 italic mt-1">📝 {item.notes}</p>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 text-center text-sm">{item.quantity}</td>
                                                    <td className="px-4 py-3 text-right text-sm">{formatCurrency(itemPrice)}</td>
                                                    <td className="px-4 py-3 text-center text-sm">
                                                        <div className="text-xs">{taxDisplay}</div>
                                                    </td>
                                                    <td className="px-4 py-3 text-right text-sm">{formatCurrency(itemTaxAmount)}</td>
                                                    <td className="px-4 py-3 text-right text-sm font-medium">{formatCurrency(itemSubtotal + itemTaxAmount)}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </CardContent>
                        </Card>

                        {/* Totals */}
                        <Card>
                            <CardContent className="p-4">
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span>{t('Subtotal')}:</span>
                                        <span>{formatCurrency(getSubtotal())}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span>{t('Tax')}:</span>
                                        <span>{formatCurrency(getTaxAmount())}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span>{t('Discount')}:</span>
                                        <span>-{formatCurrency(discountAmount)}</span>
                                    </div>
                                    <Separator className="my-2" />
                                    <div className="flex justify-between font-bold text-lg">
                                        <span>{t('Total')}:</span>
                                        <span className="text-green-600">{formatCurrency(getTotal())}</span>
                                    </div>
                                    <Separator className="my-2" />
                                    
                                    {/* Payment Method Selection */}
                                    <div className="space-y-3 mb-4">
                                        <label className="text-sm font-medium">{t('Payment Method')}:</label>
                                        <div className="space-y-2">
                                            <label className="flex items-center space-x-2 cursor-pointer">
                                                <input
                                                    type="radio"
                                                    name="paymentMethod"
                                                    value="cash"
                                                    checked={paymentMethod === 'cash'}
                                                    onChange={(e) => setPaymentMethod(e.target.value)}
                                                    className="w-4 h-4"
                                                />
                                                <span className="text-sm">{t('Cash')}</span>
                                            </label>
                                            <label className="flex items-center space-x-2 cursor-pointer">
                                                <input
                                                    type="radio"
                                                    name="paymentMethod"
                                                    value="card"
                                                    checked={paymentMethod === 'card'}
                                                    onChange={(e) => setPaymentMethod(e.target.value)}
                                                    className="w-4 h-4"
                                                />
                                                <span className="text-sm">{t('Card')}</span>
                                            </label>
                                            <label className="flex items-center space-x-2 cursor-pointer">
                                                <input
                                                    type="radio"
                                                    name="paymentMethod"
                                                    value="mtn_momo"
                                                    checked={paymentMethod === 'mtn_momo'}
                                                    onChange={(e) => setPaymentMethod(e.target.value)}
                                                    className="w-4 h-4"
                                                />
                                                <span className="text-sm">{t('MTN Mobile Money')}</span>
                                            </label>
                                            <label className="flex items-center space-x-2 cursor-pointer">
                                                <input
                                                    type="radio"
                                                    name="paymentMethod"
                                                    value="airtel_money"
                                                    checked={paymentMethod === 'airtel_money'}
                                                    onChange={(e) => setPaymentMethod(e.target.value)}
                                                    className="w-4 h-4"
                                                />
                                                <span className="text-sm">{t('Airtel Money')}</span>
                                            </label>
                                            {selectedRoomBooking && (
                                                <label className="flex items-center space-x-2 cursor-pointer bg-orange-50 p-2 rounded border border-orange-200">
                                                    <input
                                                        type="radio"
                                                        name="paymentMethod"
                                                        value="charge_to_room"
                                                        checked={paymentMethod === 'charge_to_room'}
                                                        onChange={(e) => setPaymentMethod(e.target.value)}
                                                        className="w-4 h-4"
                                                    />
                                                    <span className="text-sm font-medium text-orange-700">
                                                        🏨 {t('Charge to Room')} {selectedRoomBooking.room?.room_number}
                                                    </span>
                                                </label>
                                            )}
                                        </div>
                                        {paymentMethod === 'charge_to_room' && selectedRoomBooking && (
                                            <div className="bg-blue-50 p-3 rounded text-sm text-blue-800">
                                                <p>✓ {t('Items will be added to Room')} {selectedRoomBooking.room?.room_number} {t('invoice')}</p>
                                                <p>✓ {t('Guest will pay at checkout')}</p>
                                                <p className="text-xs mt-1 text-blue-600">{t('Booking')}: {selectedRoomBooking.booking_number}</p>
                                            </div>
                                        )}
                                    </div>
                                    
                                    <Separator className="my-2" />
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">{t('Amount Paid')}:</label>
                                        <Input
                                            type="number"
                                            value={paidAmount}
                                            onChange={(e) => setPaidAmount(e.target.value)}
                                            className="h-10"
                                            step="0.01"
                                            min="0"
                                            max={getTotal()}
                                            disabled={paymentMethod === 'charge_to_room'}
                                        />
                                        {paymentMethod === 'charge_to_room' && (
                                            <div className="flex justify-between text-sm text-blue-600 font-medium bg-blue-50 p-2 rounded">
                                                <span>{t('Will be charged to room')}:</span>
                                                <span>{formatCurrency(getTotal())}</span>
                                            </div>
                                        )}
                                        {paymentMethod !== 'charge_to_room' && parseFloat(paidAmount || '0') < getTotal() && (
                                            <div className="flex justify-between text-sm text-orange-600 font-medium">
                                                <span>{t('Balance Due')}:</span>
                                                <span>{formatCurrency(getTotal() - parseFloat(paidAmount || '0'))}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Waiter Name Field */}
                        <div className="mt-4">
                            <label className="text-sm font-medium block mb-2">{t('Waiter Name')} <span className="text-gray-400">({t('Optional')})</span></label>
                            <Input
                                type="text"
                                value={waiterName}
                                onChange={(e) => setWaiterName(e.target.value)}
                                placeholder={t('Enter waiter name')}
                                className="h-10"
                            />
                        </div>

                        {/* Action Buttons */}
                        <div className="flex justify-end gap-2 mt-6">
                            <Button type="button" variant="outline" onClick={() => setShowPaymentModal(false)}>
                                {t('Cancel')}
                            </Button>
                            <Button onClick={handlePayment} disabled={processing}>
                                {processing ? t('Processing...') : t('Complete Sale')}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <ReceiptModal
                isOpen={showReceiptModal}
                onClose={handlePaymentComplete}
                completedSale={completedSale}
                globalSettings={globalSettings}
            />

            {/* Add Customer Modal */}
            <Dialog open={showAddCustomerModal} onOpenChange={setShowAddCustomerModal}>
                <DialogContent className="max-w-md" aria-describedby="add-customer-modal-description">
                    <DialogHeader>
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-lg">
                                <UserPlus className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <DialogTitle className="text-xl font-semibold">{t('Add New Customer')}</DialogTitle>
                                <p id="add-customer-modal-description" className="sr-only">{t('Create a new customer account')}</p>
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="space-y-4 p-4">
                        <div>
                            <label className="text-sm font-medium mb-1 block">{t('Name')} *</label>
                            <Input
                                type="text"
                                placeholder={t('Customer Name')}
                                value={newCustomer.name}
                                onChange={(e) => setNewCustomer({...newCustomer, name: e.target.value})}
                                className="h-10"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium mb-1 block">{t('Email')} *</label>
                            <Input
                                type="email"
                                placeholder={t('customer@example.com')}
                                value={newCustomer.email}
                                onChange={(e) => setNewCustomer({...newCustomer, email: e.target.value})}
                                className="h-10"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium mb-1 block">{t('Phone')}</label>
                            <Input
                                type="text"
                                placeholder={t('Phone Number')}
                                value={newCustomer.phone}
                                onChange={(e) => setNewCustomer({...newCustomer, phone: e.target.value})}
                                className="h-10"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 p-4 border-t">
                        <Button 
                            type="button" 
                            variant="outline" 
                            onClick={() => {
                                setShowAddCustomerModal(false);
                                setNewCustomer({ name: '', email: '', phone: '' });
                            }}
                        >
                            {t('Cancel')}
                        </Button>
                        <Button onClick={handleAddCustomer}>
                            {t('Add Customer')}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}

export default function Create(props: CreateProps) {
    return (
        <BrandProvider>
            <CreateContent {...props} />
        </BrandProvider>
    );
}

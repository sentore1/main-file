import { Head, router, Link, usePage } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ArrowLeft, Save, Plus, Trash2, ShoppingCart, Edit2, Check, X, UserPlus } from 'lucide-react';
import { useFavicon } from '@/hooks/use-favicon';
import { BrandProvider } from '@/contexts/brand-context';
import AuthenticatedLayout from '@/layouts/authenticated-layout';
import { useFormFields } from '@/hooks/useFormFields';
import { useEffect } from 'react';

// Declare global route function
declare global {
    function route(name: string, params?: any): string;
}

interface Customer {
    id: number;
    name: string;
    email: string;
}

interface Warehouse {
    id: number;
    name: string;
    address: string;
}

interface RoomType {
    id: number;
    name: string;
    color: string;
    base_price: number;
}

interface Room {
    id: number;
    room_number: string;
    price_per_night: number;
    max_occupancy: number;
    floor: string;
    room_type: {
        name: string;
        color: string;
    };
}

interface CartItem {
    id: number;
    room_id: number;
    room_number: string;
    room_type_name: string;
    price_per_night: number;
    quantity: number; // nights
    number_of_guests: number;
    includes_breakfast: boolean;
    breakfast_price: number;
    custom_price?: number;
    item_notes?: string;
    check_in_date: string;
    check_out_date: string;
}

interface CreateProps {
    customers: Customer[];
    warehouses: Warehouse[];
    roomTypes: RoomType[];
}

function CreateContent({ customers, warehouses, roomTypes }: CreateProps) {
    const { t } = useTranslation();
    const { flash } = usePage().props as any;
    useFavicon();

    // Show flash messages
    useEffect(() => {
        if (flash?.success) {
            toast.success(flash.success);
        }
        if (flash?.error) {
            toast.error(flash.error);
        }
    }, [flash]);

    const [cart, setCart] = useState<CartItem[]>([]);
    const [cartIdCounter, setCartIdCounter] = useState(1);
    const [selectedWarehouse, setSelectedWarehouse] = useState('');
    const [selectedCustomer, setSelectedCustomer] = useState('');
    const [checkInDate, setCheckInDate] = useState('');
    const [checkOutDate, setCheckOutDate] = useState('');
    const [roomTypeFilter, setRoomTypeFilter] = useState('');
    const [discountAmount, setDiscountAmount] = useState(0);
    const [paymentMethod, setPaymentMethod] = useState('cash');
    const [bankAccountId, setBankAccountId] = useState('');
    
    const [errors, setErrors] = useState<any>({});
    const [processing, setProcessing] = useState(false);
    const [availableRooms, setAvailableRooms] = useState<Room[]>([]);
    const [loadingRooms, setLoadingRooms] = useState(false);
    const [editingPriceId, setEditingPriceId] = useState<number | null>(null);
    const [editingPriceValue, setEditingPriceValue] = useState('');
    const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
    const [newCustomer, setNewCustomer] = useState({ name: '', email: '', phone: '' });
    const [customersList, setCustomersList] = useState<Customer[]>(customers);

    const handleSetData = (key: string, value: any) => {
        if (key === 'bank_account_id') setBankAccountId(value);
    };

    const bankAccountField = useFormFields('bankAccountField', { bank_account_id: bankAccountId }, handleSetData, errors);

    // Cart functions
    const addToCart = (room: Room) => {
        if (!checkInDate || !checkOutDate) {
            alert(t('Please select check-in and check-out dates'));
            return;
        }

        const checkIn = new Date(checkInDate);
        const checkOut = new Date(checkOutDate);
        const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));

        const newItem: CartItem = {
            id: cartIdCounter,
            room_id: room.id,
            room_number: room.room_number,
            room_type_name: room.room_type.name,
            price_per_night: parseFloat(room.price_per_night as any),
            quantity: nights,
            number_of_guests: 1,
            includes_breakfast: false,
            breakfast_price: 0, // Breakfast is complimentary
            check_in_date: checkInDate,
            check_out_date: checkOutDate,
        };

        setCart([...cart, newItem]);
        setCartIdCounter(cartIdCounter + 1);
    };

    const removeFromCart = (id: number) => {
        setCart(cart.filter(item => item.id !== id));
    };

    const updateCartItem = (id: number, updates: Partial<CartItem>) => {
        setCart(cart.map(item => item.id === id ? { ...item, ...updates } : item));
    };

    const clearCart = () => {
        setCart([]);
    };

    // Calculation functions
    const calculateSubtotal = () => {
        return cart.reduce((sum, item) => {
            const price = parseFloat((item.custom_price ?? item.price_per_night) as any);
            return sum + (price * item.quantity);
        }, 0);
    };

    const calculateBreakfastTotal = () => {
        // Breakfast is complimentary - no charge
        return 0;
    };

    const calculateTaxAmount = () => {
        // Tax is optional - set to 0 for now (can be configured later)
        return 0;
    };

    const calculateTotal = () => {
        return calculateSubtotal() + calculateBreakfastTotal() + calculateTaxAmount() - discountAmount;
    };

    const fetchAvailableRooms = () => {
        if (!selectedWarehouse || !checkInDate || !checkOutDate) {
            toast.error(t('Please select warehouse, check-in and check-out dates'));
            return;
        }

        // Validate that check-out is after check-in
        const checkIn = new Date(checkInDate);
        const checkOut = new Date(checkOutDate);
        
        if (checkOut <= checkIn) {
            toast.error(t('Check-out date must be after check-in date'));
            return;
        }

        setLoadingRooms(true);
        const params = new URLSearchParams({
            warehouse_id: selectedWarehouse,
            check_in_date: checkInDate,
            check_out_date: checkOutDate,
            ...(roomTypeFilter && { room_type_id: roomTypeFilter }),
        });

        const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
        
        // Build the URL - use window.location.origin as fallback if route() fails
        let url;
        try {
            url = `${route('room-bookings.available-rooms')}?${params}`;
        } catch (e) {
            console.error('Route helper failed:', e);
            url = `${window.location.origin}/room-bookings/available-rooms?${params}`;
        }
        
        console.log('Fetching available rooms from:', url);

        fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
                ...(csrfToken && { 'X-CSRF-TOKEN': csrfToken }),
            },
            credentials: 'same-origin',
        })
            .then(async response => {
                console.log('Response status:', response.status);
                console.log('Response headers:', Object.fromEntries(response.headers.entries()));
                
                const contentType = response.headers.get('content-type');
                if (!contentType || !contentType.includes('application/json')) {
                    const text = await response.text();
                    console.error('Server returned non-JSON response:', text.substring(0, 500));
                    console.error('Response status:', response.status);
                    console.error('Response URL:', response.url);
                    throw new Error('Server returned an invalid response. Please check if you are logged in.');
                }
                
                if (!response.ok) {
                    const errorData = await response.json();
                    if (errorData.details) {
                        // Show validation errors
                        const errorMessages = Object.values(errorData.details).flat().join(', ');
                        throw new Error(errorMessages);
                    }
                    throw new Error(errorData.message || 'Failed to fetch rooms');
                }
                
                return response.json();
            })
            .then(data => {
                console.log('Received rooms data:', data);
                setAvailableRooms(data);
                setLoadingRooms(false);
                if (data.length === 0) {
                    toast.info(t('No rooms available for the selected dates'));
                } else {
                    toast.success(t('Found {count} available rooms', { count: data.length }));
                }
            })
            .catch(error => {
                console.error('Error fetching rooms:', error);
                toast.error(error.message || t('Failed to fetch available rooms'));
                setLoadingRooms(false);
            });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (cart.length === 0) {
            toast.error(t('Please add at least one room to cart'));
            return;
        }

        setProcessing(true);

        const formData = {
            customer_id: selectedCustomer || null,
            warehouse_id: selectedWarehouse,
            items: cart.map(item => ({
                room_id: item.room_id,
                check_in_date: item.check_in_date,
                check_out_date: item.check_out_date,
                number_of_guests: item.number_of_guests,
                includes_breakfast: item.includes_breakfast,
                breakfast_price: item.breakfast_price,
                custom_price: item.custom_price,
                item_notes: item.item_notes,
            })),
            discount: discountAmount,
            payment_method: paymentMethod,
            bank_account_id: bankAccountId || null,
        };

        router.post(route('room-bookings.store'), formData, {
            onSuccess: (page) => {
                setProcessing(false);
                const successMessage = (page.props.flash as any)?.success;
                if (successMessage) {
                    toast.success(successMessage);
                }
            },
            onError: (errors) => {
                setErrors(errors);
                setProcessing(false);
                toast.error(t('Booking failed. Please check your input and try again.'));
            },
            onFinish: () => {
                setProcessing(false);
            },
        });
    };

    const startEditingPrice = (id: number, currentPrice: number) => {
        setEditingPriceId(id);
        setEditingPriceValue(currentPrice.toString());
    };

    const saveEditedPrice = (id: number) => {
        const newPrice = parseFloat(editingPriceValue);
        if (!isNaN(newPrice) && newPrice >= 0) {
            updateCartItem(id, { custom_price: newPrice });
        }
        setEditingPriceId(null);
    };

    const cancelEditingPrice = () => {
        setEditingPriceId(null);
    };

    const handleAddCustomer = () => {
        if (!newCustomer.name || !newCustomer.email) {
            alert(t('Please fill in name and email'));
            return;
        }

        fetch(route('room-bookings.customers.store'), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
            },
            body: JSON.stringify(newCustomer)
        })
        .then(async response => {
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                const text = await response.text();
                console.error('Server returned non-JSON response:', text.substring(0, 500));
                throw new Error('Server returned an invalid response. Please check if you are logged in.');
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                // Add new customer to the list (same as POS)
                customersList.push(data.customer);
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
            alert(t('Failed to create customer') + ': ' + error.message);
        });
    };

    return (
        <>
            <Head title={t('New Booking')} />

            <div className="flex gap-6">
                {/* Left side - Room Selection */}
                <div className="flex-1 space-y-6">
                    <div className="flex items-center gap-4">
                        <Link href={route('room-bookings.index')}>
                            <Button variant="outline" size="sm">
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                {t('Back')}
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">{t('New Room Booking')}</h1>
                            <p className="text-sm text-gray-500 mt-1">
                                {t('Add rooms to cart and complete booking')}
                            </p>
                        </div>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>{t('Search Rooms')}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="warehouse_id">
                                        {t('Warehouse/Branch')} <span className="text-red-500">*</span>
                                    </Label>
                                    <Select value={selectedWarehouse} onValueChange={setSelectedWarehouse}>
                                        <SelectTrigger>
                                            <SelectValue placeholder={t('Select warehouse')} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {warehouses.map((warehouse) => (
                                                <SelectItem key={warehouse.id} value={warehouse.id.toString()}>
                                                    {warehouse.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="customer_id">{t('Customer')}</Label>
                                    <div className="flex gap-2">
                                        <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
                                            <SelectTrigger className="flex-1">
                                                <SelectValue placeholder={t('Walk-in Customer')} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {customersList.map((customer) => (
                                                    <SelectItem key={customer.id} value={customer.id.toString()}>
                                                        {customer.name} - {customer.email}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="icon"
                                            onClick={() => setShowAddCustomerModal(true)}
                                            title={t('Add New Customer')}
                                        >
                                            <UserPlus className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="check_in_date">
                                        {t('Check-in Date')} <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        id="check_in_date"
                                        type="date"
                                        value={checkInDate}
                                        min={new Date().toISOString().split('T')[0]}
                                        onChange={(e) => {
                                            setCheckInDate(e.target.value);
                                            // Clear check-out if it's before the new check-in
                                            if (checkOutDate && e.target.value >= checkOutDate) {
                                                setCheckOutDate('');
                                            }
                                        }}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="check_out_date">
                                        {t('Check-out Date')} <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        id="check_out_date"
                                        type="date"
                                        value={checkOutDate}
                                        min={checkInDate ? new Date(new Date(checkInDate).getTime() + 86400000).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]}
                                        onChange={(e) => setCheckOutDate(e.target.value)}
                                        disabled={!checkInDate}
                                    />
                                    {!checkInDate && (
                                        <p className="text-sm text-muted-foreground">{t('Please select check-in date first')}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="room_type_id">{t('Room Type (Optional)')}</Label>
                                    <Select value={roomTypeFilter} onValueChange={setRoomTypeFilter}>
                                        <SelectTrigger>
                                            <SelectValue placeholder={t('All room types')} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {roomTypes.map((type) => (
                                                <SelectItem key={type.id} value={type.id.toString()}>
                                                    {type.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <Button type="button" onClick={fetchAvailableRooms} disabled={loadingRooms}>
                                {loadingRooms ? t('Loading...') : t('Search Available Rooms')}
                            </Button>
                        </CardContent>
                    </Card>

                    {availableRooms.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle>{t('Available Rooms')} ({availableRooms.length})</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {availableRooms.map((room) => (
                                        <div
                                            key={room.id}
                                            className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                                            style={{ borderColor: room.room_type.color }}
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <h3 className="font-semibold text-lg">Room {room.room_number}</h3>
                                                    <span
                                                        className="inline-block px-2 py-1 text-xs rounded"
                                                        style={{
                                                            backgroundColor: room.room_type.color + '20',
                                                            color: room.room_type.color
                                                        }}
                                                    >
                                                        {room.room_type.name}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="space-y-1 text-sm text-gray-600 mb-3">
                                                {room.floor && <p>Floor: {room.floor}</p>}
                                                <p>Capacity: {room.max_occupancy} guests</p>
                                                <p className="font-semibold text-green-600">
                                                    {parseFloat(room.price_per_night as any).toFixed(2)} Fr/night
                                                </p>
                                            </div>
                                            <Button
                                                type="button"
                                                size="sm"
                                                className="w-full"
                                                onClick={() => addToCart(room)}
                                            >
                                                <Plus className="h-4 w-4 mr-2" />
                                                {t('Add to Cart')}
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Right side - Cart */}
                <div className="w-96 space-y-4">
                    <Card className="sticky top-4">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="flex items-center gap-2">
                                <ShoppingCart className="h-5 w-5" />
                                {t('Cart')} ({cart.length})
                            </CardTitle>
                            {cart.length > 0 && (
                                <Button variant="ghost" size="sm" onClick={clearCart}>
                                    {t('Clear')}
                                </Button>
                            )}
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {cart.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">
                                    <ShoppingCart className="h-12 w-12 mx-auto mb-2 opacity-50" />
                                    <p>{t('Cart is empty')}</p>
                                    <p className="text-sm">{t('Add rooms to get started')}</p>
                                </div>
                            ) : (
                                <>
                                    <div className="space-y-3 max-h-96 overflow-y-auto">
                                        {cart.map((item) => (
                                            <div key={item.id} className="border rounded-lg p-3 space-y-2">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <h4 className="font-semibold">Room {item.room_number}</h4>
                                                        <p className="text-xs text-gray-500">{item.room_type_name}</p>
                                                        <p className="text-xs text-gray-500">{item.quantity} nights</p>
                                                    </div>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => removeFromCart(item.id)}
                                                    >
                                                        <Trash2 className="h-4 w-4 text-red-500" />
                                                    </Button>
                                                </div>

                                                <div className="space-y-2">
                                                    <div className="flex items-center gap-2">
                                                        <Label className="text-xs">Guests:</Label>
                                                        <Input
                                                            type="number"
                                                            min="1"
                                                            value={item.number_of_guests}
                                                            onChange={(e) => updateCartItem(item.id, { number_of_guests: parseInt(e.target.value) || 1 })}
                                                            className="h-8 w-20"
                                                        />
                                                    </div>

                                                    <div className="flex items-center gap-2">
                                                        <Checkbox
                                                            checked={item.includes_breakfast}
                                                            onCheckedChange={(checked) => updateCartItem(item.id, { includes_breakfast: checked as boolean })}
                                                        />
                                                        <Label className="text-xs">
                                                            Include Breakfast (Complimentary)
                                                        </Label>
                                                    </div>

                                                    <div className="space-y-1">
                                                        <Label className="text-xs">Price per night:</Label>
                                                        {editingPriceId === item.id ? (
                                                            <div className="flex gap-1">
                                                                <Input
                                                                    type="number"
                                                                    step="0.01"
                                                                    value={editingPriceValue}
                                                                    onChange={(e) => setEditingPriceValue(e.target.value)}
                                                                    className="h-8"
                                                                />
                                                                <Button size="sm" onClick={() => saveEditedPrice(item.id)} className="h-8 w-8 p-0">
                                                                    <Check className="h-4 w-4" />
                                                                </Button>
                                                                <Button size="sm" variant="ghost" onClick={cancelEditingPrice} className="h-8 w-8 p-0">
                                                                    <X className="h-4 w-4" />
                                                                </Button>
                                                            </div>
                                                        ) : (
                                                            <div className="flex items-center gap-2">
                                                                {item.custom_price ? (
                                                                    <>
                                                                        <span className="text-xs line-through text-gray-400">{parseFloat(item.price_per_night as any).toFixed(2)} Fr</span>
                                                                        <span className="text-sm font-semibold text-green-600">{parseFloat(item.custom_price as any).toFixed(2)} Fr</span>
                                                                    </>
                                                                ) : (
                                                                    <span className="text-sm font-semibold">{parseFloat(item.price_per_night as any).toFixed(2)} Fr</span>
                                                                )}
                                                                <Button
                                                                    size="sm"
                                                                    variant="ghost"
                                                                    onClick={() => startEditingPrice(item.id, item.custom_price ?? parseFloat(item.price_per_night as any))}
                                                                    className="h-6 w-6 p-0"
                                                                >
                                                                    <Edit2 className="h-3 w-3" />
                                                                </Button>
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="space-y-1">
                                                        <Label className="text-xs">Notes:</Label>
                                                        <Textarea
                                                            value={item.item_notes || ''}
                                                            onChange={(e) => updateCartItem(item.id, { item_notes: e.target.value })}
                                                            placeholder="e.g., extra pillows, ground floor"
                                                            className="h-16 text-xs"
                                                            maxLength={500}
                                                        />
                                                    </div>

                                                    <div className="text-right font-semibold text-green-600">
                                                        Subtotal: {((parseFloat((item.custom_price ?? item.price_per_night) as any)) * item.quantity).toFixed(2)} Fr
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="border-t pt-4 space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span>{t('Subtotal')}:</span>
                                            <span>{calculateSubtotal().toFixed(2)} Fr</span>
                                        </div>
                                        {calculateBreakfastTotal() > 0 && (
                                            <div className="flex justify-between text-sm bg-orange-50 px-2 py-1 rounded">
                                                <span className="text-orange-700">🍳 {t('Breakfast')}:</span>
                                                <span className="text-orange-900 font-medium">{calculateBreakfastTotal().toFixed(2)} Fr</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between items-center text-sm">
                                            <span>{t('Discount')}:</span>
                                            <Input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                value={discountAmount}
                                                onChange={(e) => setDiscountAmount(parseFloat(e.target.value) || 0)}
                                                className="h-8 w-24 text-right"
                                            />
                                        </div>
                                        <div className="flex justify-between text-lg font-bold border-t pt-2">
                                            <span>{t('Total')}:</span>
                                            <span className="text-green-600">{calculateTotal().toFixed(2)} Fr</span>
                                        </div>
                                    </div>

                                    <div className="space-y-3 border-t pt-4">
                                        <div className="space-y-2">
                                            <Label>{t('Payment Method')} <span className="text-red-500">*</span></Label>
                                            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="cash">{t('Cash')}</SelectItem>
                                                    <SelectItem value="card">{t('Card')}</SelectItem>
                                                    <SelectItem value="bank_transfer">{t('Bank Transfer')}</SelectItem>
                                                    <SelectItem value="mobile_money">{t('Mobile Money')}</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        {bankAccountField.map((field) => (
                                            <div key={field.id}>{field.component}</div>
                                        ))}

                                        <Button
                                            type="button"
                                            className="w-full"
                                            onClick={handleSubmit}
                                            disabled={processing || cart.length === 0}
                                        >
                                            <Save className="h-4 w-4 mr-2" />
                                            {processing ? t('Creating...') : t('Complete Booking')}
                                        </Button>
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Add Customer Modal */}
            <Dialog open={showAddCustomerModal} onOpenChange={setShowAddCustomerModal}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-lg">
                                <UserPlus className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <DialogTitle className="text-xl font-semibold">{t('Add New Customer')}</DialogTitle>
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
                                onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                                className="h-10"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium mb-1 block">{t('Email')} *</label>
                            <Input
                                type="email"
                                placeholder={t('customer@example.com')}
                                value={newCustomer.email}
                                onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                                className="h-10"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium mb-1 block">{t('Phone')}</label>
                            <Input
                                type="text"
                                placeholder={t('Phone Number')}
                                value={newCustomer.phone}
                                onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
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
            <AuthenticatedLayout>
                <CreateContent {...props} />
            </AuthenticatedLayout>
        </BrandProvider>
    );
}

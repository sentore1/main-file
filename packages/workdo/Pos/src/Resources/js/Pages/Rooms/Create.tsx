import { Head, router, Link } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, Save, Upload } from 'lucide-react';
import { useFavicon } from '@/hooks/use-favicon';
import { BrandProvider } from '@/contexts/brand-context';
import AuthenticatedLayout from '@/layouts/authenticated-layout';

interface Warehouse {
    id: number;
    name: string;
    address: string;
}

interface RoomType {
    id: number;
    name: string;
    base_price: number;
    color: string;
}

interface CreateProps {
    warehouses: Warehouse[];
    roomTypes: RoomType[];
}

const AMENITIES = [
    { id: 'wifi', label: 'WiFi' },
    { id: 'ac', label: 'Air Conditioning' },
    { id: 'tv', label: 'Television' },
    { id: 'minibar', label: 'Mini Bar' },
    { id: 'safe', label: 'Safe' },
    { id: 'balcony', label: 'Balcony' },
    { id: 'bathtub', label: 'Bathtub' },
    { id: 'shower', label: 'Shower' },
    { id: 'hairdryer', label: 'Hair Dryer' },
    { id: 'iron', label: 'Iron' },
    { id: 'coffee', label: 'Coffee Maker' },
    { id: 'desk', label: 'Work Desk' },
];

function CreateContent({ warehouses, roomTypes }: CreateProps) {
    const { t } = useTranslation();
    useFavicon();

    const [formData, setFormData] = useState({
        room_number: '',
        room_type_id: '',
        warehouse_id: '',
        floor: '',
        price_per_night: '',
        max_occupancy: '2',
        amenities: [] as string[],
        description: '',
        image: null as File | null,
    });

    const [errors, setErrors] = useState<any>({});
    const [processing, setProcessing] = useState(false);
    const [imagePreview, setImagePreview] = useState<string>('');

    const selectedRoomType = roomTypes.find(rt => rt.id.toString() === formData.room_type_id);

    const handleRoomTypeChange = (value: string) => {
        const roomType = roomTypes.find(rt => rt.id.toString() === value);
        setFormData({
            ...formData,
            room_type_id: value,
            price_per_night: roomType ? roomType.base_price.toString() : '',
        });
    };

    const handleAmenityToggle = (amenityId: string) => {
        setFormData({
            ...formData,
            amenities: formData.amenities.includes(amenityId)
                ? formData.amenities.filter(a => a !== amenityId)
                : [...formData.amenities, amenityId],
        });
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setFormData({ ...formData, image: file });
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setProcessing(true);

        const submitData: any = {
            room_number: formData.room_number,
            room_type_id: parseInt(formData.room_type_id),
            warehouse_id: parseInt(formData.warehouse_id),
            floor: formData.floor || null,
            price_per_night: parseFloat(formData.price_per_night),
            max_occupancy: parseInt(formData.max_occupancy),
            amenities: formData.amenities,
            description: formData.description || null,
        };

        if (formData.image) {
            submitData.image = formData.image;
        }

        router.post(route('rooms.store'), submitData, {
            forceFormData: true,
            onError: (errors) => {
                console.log('Validation Errors:', errors);
                setErrors(errors);
                setProcessing(false);
            },
            onSuccess: () => {
                console.log('Room created successfully!');
            },
            onFinish: () => {
                setProcessing(false);
            },
        });
    };

    return (
        <>
            <Head title={t('Add Room')} />

            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <Link href={route('rooms.index')}>
                        <Button variant="outline" size="sm">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            {t('Back')}
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">{t('Add New Room')}</h1>
                        <p className="text-sm text-gray-500 mt-1">
                            {t('Create a new room and set its specific price')}
                        </p>
                    </div>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>{t('Basic Information')}</CardTitle>
                                <CardDescription>
                                    {t('Enter the room details and location')}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="room_number">
                                            {t('Room Number')} <span className="text-red-500">*</span>
                                        </Label>
                                        <Input
                                            id="room_number"
                                            placeholder={t('e.g., 101, 202, Suite-A')}
                                            value={formData.room_number}
                                            onChange={(e) => setFormData({ ...formData, room_number: e.target.value })}
                                            className={errors.room_number ? 'border-red-500' : ''}
                                        />
                                        {errors.room_number && (
                                            <p className="text-sm text-red-500">{errors.room_number}</p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="warehouse_id">
                                            {t('Warehouse/Branch')} <span className="text-red-500">*</span>
                                        </Label>
                                        <Select value={formData.warehouse_id} onValueChange={(value) => setFormData({ ...formData, warehouse_id: value })}>
                                            <SelectTrigger className={errors.warehouse_id ? 'border-red-500' : ''}>
                                                <SelectValue placeholder={t('Select warehouse')} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {warehouses.map((warehouse) => (
                                                    <SelectItem key={warehouse.id} value={warehouse.id.toString()}>
                                                        {warehouse.name} - {warehouse.address}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {errors.warehouse_id && (
                                            <p className="text-sm text-red-500">{errors.warehouse_id}</p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="room_type_id">
                                            {t('Room Type')} <span className="text-red-500">*</span>
                                        </Label>
                                        <Select value={formData.room_type_id} onValueChange={handleRoomTypeChange}>
                                            <SelectTrigger className={errors.room_type_id ? 'border-red-500' : ''}>
                                                <SelectValue placeholder={t('Select room type')} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {roomTypes.map((type) => (
                                                    <SelectItem key={type.id} value={type.id.toString()}>
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-3 h-3 rounded" style={{ backgroundColor: type.color }} />
                                                            {type.name}
                                                        </div>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {errors.room_type_id && (
                                            <p className="text-sm text-red-500">{errors.room_type_id}</p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="floor">{t('Floor')}</Label>
                                        <Input
                                            id="floor"
                                            placeholder={t('e.g., 1st Floor, Ground Floor')}
                                            value={formData.floor}
                                            onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>{t('Pricing & Capacity')}</CardTitle>
                                <CardDescription>
                                    {t('Set the room price and maximum occupancy')}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="price_per_night">
                                            {t('Price per Night')} <span className="text-red-500">*</span>
                                        </Label>
                                        <Input
                                            id="price_per_night"
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            placeholder={t('e.g., 100.00')}
                                            value={formData.price_per_night}
                                            onChange={(e) => setFormData({ ...formData, price_per_night: e.target.value })}
                                            className={errors.price_per_night ? 'border-red-500' : ''}
                                        />
                                        {selectedRoomType && (
                                            <p className="text-xs text-gray-500">
                                                {t('Base price for')} {selectedRoomType.name}: ${selectedRoomType.base_price}
                                            </p>
                                        )}
                                        {errors.price_per_night && (
                                            <p className="text-sm text-red-500">{errors.price_per_night}</p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="max_occupancy">
                                            {t('Maximum Occupancy')} <span className="text-red-500">*</span>
                                        </Label>
                                        <Input
                                            id="max_occupancy"
                                            type="number"
                                            min="1"
                                            placeholder={t('Number of guests')}
                                            value={formData.max_occupancy}
                                            onChange={(e) => setFormData({ ...formData, max_occupancy: e.target.value })}
                                            className={errors.max_occupancy ? 'border-red-500' : ''}
                                        />
                                        {errors.max_occupancy && (
                                            <p className="text-sm text-red-500">{errors.max_occupancy}</p>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>{t('Amenities')}</CardTitle>
                                <CardDescription>
                                    {t('Select the amenities available in this room')}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {AMENITIES.map((amenity) => (
                                        <div key={amenity.id} className="flex items-center space-x-2">
                                            <Checkbox
                                                id={amenity.id}
                                                checked={formData.amenities.includes(amenity.id)}
                                                onCheckedChange={() => handleAmenityToggle(amenity.id)}
                                            />
                                            <Label htmlFor={amenity.id} className="cursor-pointer">
                                                {t(amenity.label)}
                                            </Label>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>{t('Additional Details')}</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-2">
                                    <Label htmlFor="description">{t('Description')}</Label>
                                    <Textarea
                                        id="description"
                                        placeholder={t('Describe the room features, view, etc...')}
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        rows={4}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="image">{t('Room Image')}</Label>
                                    <div className="flex items-center gap-4">
                                        <Input
                                            id="image"
                                            type="file"
                                            accept="image/*"
                                            onChange={handleImageChange}
                                            className="hidden"
                                        />
                                        <Label htmlFor="image" className="cursor-pointer">
                                            <div className="flex items-center gap-2 px-4 py-2 border rounded-md hover:bg-gray-50">
                                                <Upload className="h-4 w-4" />
                                                {t('Upload Image')}
                                            </div>
                                        </Label>
                                        {imagePreview && (
                                            <img src={imagePreview} alt="Preview" className="h-20 w-20 object-cover rounded" />
                                        )}
                                    </div>
                                    {errors.image && (
                                        <p className="text-sm text-red-500">{errors.image}</p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        <div className="flex justify-end gap-3">
                            <Link href={route('rooms.index')}>
                                <Button type="button" variant="outline">
                                    {t('Cancel')}
                                </Button>
                            </Link>
                            <Button type="submit" disabled={processing}>
                                <Save className="h-4 w-4 mr-2" />
                                {processing ? t('Saving...') : t('Save Room')}
                            </Button>
                        </div>
                    </div>
                </form>
            </div>
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

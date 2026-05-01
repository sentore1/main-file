import { Head, router, Link } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowLeft, Save } from 'lucide-react';
import { useFavicon } from '@/hooks/use-favicon';
import { BrandProvider } from '@/contexts/brand-context';
import AuthenticatedLayout from '@/layouts/authenticated-layout';

const COLORS = [
    { name: 'Blue', value: '#3B82F6' },
    { name: 'Green', value: '#10B981' },
    { name: 'Purple', value: '#8B5CF6' },
    { name: 'Pink', value: '#EC4899' },
    { name: 'Orange', value: '#F59E0B' },
    { name: 'Red', value: '#EF4444' },
    { name: 'Indigo', value: '#6366F1' },
    { name: 'Teal', value: '#14B8A6' },
];

interface RoomType {
    id: number;
    name: string;
    description: string;
    base_price: number;
    color: string;
    is_active: boolean;
}

interface EditProps {
    roomType: RoomType;
}

function EditContent({ roomType }: EditProps) {
    const { t } = useTranslation();
    useFavicon();

    const [formData, setFormData] = useState({
        name: roomType.name,
        description: roomType.description || '',
        base_price: roomType.base_price.toString(),
        color: roomType.color,
        is_active: roomType.is_active,
    });

    const [errors, setErrors] = useState<any>({});
    const [processing, setProcessing] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setProcessing(true);

        router.put(route('room-types.update', roomType.id), formData, {
            onError: (errors) => {
                setErrors(errors);
                setProcessing(false);
            },
            onSuccess: () => {
                setProcessing(false);
            },
        });
    };

    return (
        <>
            <Head title={t('Edit Room Type')} />

            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <Link href={route('room-types.index')}>
                        <Button variant="outline" size="sm">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            {t('Back')}
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">{t('Edit Room Type')}</h1>
                        <p className="text-sm text-gray-500 mt-1">
                            {t('Update room type details and pricing')}
                        </p>
                    </div>
                </div>

                <form onSubmit={handleSubmit}>
                    <Card>
                        <CardHeader>
                            <CardTitle>{t('Room Type Details')}</CardTitle>
                            <CardDescription>
                                {t('Modify the room type information. Changes will affect all rooms of this type.')}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="name">
                                        {t('Room Type Name')} <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        id="name"
                                        placeholder={t('e.g., Standard Room, Deluxe Suite')}
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className={errors.name ? 'border-red-500' : ''}
                                    />
                                    {errors.name && (
                                        <p className="text-sm text-red-500">{errors.name}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="base_price">
                                        {t('Base Price per Night')} <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        id="base_price"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        placeholder={t('e.g., 100.00')}
                                        value={formData.base_price}
                                        onChange={(e) => setFormData({ ...formData, base_price: e.target.value })}
                                        className={errors.base_price ? 'border-red-500' : ''}
                                    />
                                    {errors.base_price && (
                                        <p className="text-sm text-red-500">{errors.base_price}</p>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">{t('Description')}</Label>
                                <Textarea
                                    id="description"
                                    placeholder={t('Describe the room type, amenities, and features...')}
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    rows={4}
                                    className={errors.description ? 'border-red-500' : ''}
                                />
                                {errors.description && (
                                    <p className="text-sm text-red-500">{errors.description}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label>{t('Color')}</Label>
                                <div className="flex flex-wrap gap-3">
                                    {COLORS.map((color) => (
                                        <button
                                            key={color.value}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, color: color.value })}
                                            className={`w-10 h-10 rounded-lg border-2 transition-all ${
                                                formData.color === color.value
                                                    ? 'border-gray-900 scale-110'
                                                    : 'border-gray-200 hover:border-gray-400'
                                            }`}
                                            style={{ backgroundColor: color.value }}
                                            title={color.name}
                                        />
                                    ))}
                                </div>
                            </div>

                            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                <div>
                                    <Label htmlFor="is_active" className="text-base">
                                        {t('Active Status')}
                                    </Label>
                                    <p className="text-sm text-gray-500">
                                        {t('Inactive room types cannot be assigned to new rooms')}
                                    </p>
                                </div>
                                <Switch
                                    id="is_active"
                                    checked={formData.is_active}
                                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t">
                                <Link href={route('room-types.index')}>
                                    <Button type="button" variant="outline">
                                        {t('Cancel')}
                                    </Button>
                                </Link>
                                <Button type="submit" disabled={processing}>
                                    <Save className="h-4 w-4 mr-2" />
                                    {processing ? t('Updating...') : t('Update Room Type')}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </form>
            </div>
        </>
    );
}

export default function Edit(props: EditProps) {
    return (
        <BrandProvider>
            <AuthenticatedLayout>
                <EditContent {...props} />
            </AuthenticatedLayout>
        </BrandProvider>
    );
}

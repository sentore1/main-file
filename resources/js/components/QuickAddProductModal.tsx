import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import InputError from '@/components/ui/input-error';
import { PackagePlus } from 'lucide-react';

interface Tax        { id: number; tax_name: string; rate: number }
interface Category   { id: number; name: string }
interface Unit       { id: number; unit_name: string }
interface Warehouse  { id: number; name: string }

interface CreatedItem {
    id: number;
    name: string;
    sku: string;
    type: string;
    sale_price: number;
    purchase_price: number;
    unit?: string;
    taxes: Tax[];
    item_type: string;
    stock_quantity: number;
}

interface Props {
    open: boolean;
    onClose: () => void;
    /** Called with the newly created item so the parent can add it to its product list */
    onCreated: (item: CreatedItem) => void;
    /** Pre-select the type (purchase pages pass 'product', quotation/sales can pass either) */
    defaultType?: 'product' | 'service';
    /** Warehouse id already selected on the parent form — pre-fills the stock warehouse */
    defaultWarehouseId?: string;
}

const EMPTY_FORM = {
    name: '',
    type: 'product' as 'product' | 'service',
    sale_price: '',
    purchase_price: '',
    category_id: '',
    unit: '',
    tax_ids: [] as number[],
    warehouse_id: '',
    quantity: '',
};

export default function QuickAddProductModal({
    open,
    onClose,
    onCreated,
    defaultType = 'product',
    defaultWarehouseId = '',
}: Props) {
    const { t } = useTranslation();

    const [form, setForm]       = useState({ ...EMPTY_FORM, type: defaultType, warehouse_id: defaultWarehouseId });
    const [errors, setErrors]   = useState<Record<string, string>>({});
    const [saving, setSaving]   = useState(false);
    const [taxes, setTaxes]     = useState<Tax[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [units, setUnits]     = useState<Unit[]>([]);
    const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
    const [metaLoaded, setMetaLoaded] = useState(false);

    // Load meta (taxes, categories, units, warehouses) once when modal opens
    useEffect(() => {
        if (!open || metaLoaded) return;
        fetch('/product-service/items/meta', {
            headers: { 'Accept': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
        })
            .then(r => r.json())
            .then(data => {
                setTaxes(data.taxes ?? []);
                setCategories(data.categories ?? []);
                setUnits(data.units ?? []);
                setWarehouses(data.warehouses ?? []);
                setMetaLoaded(true);
            })
            .catch(() => setMetaLoaded(true));
    }, [open, metaLoaded]);

    // Reset form whenever modal opens
    useEffect(() => {
        if (open) {
            setForm({ ...EMPTY_FORM, type: defaultType, warehouse_id: defaultWarehouseId });
            setErrors({});
        }
    }, [open, defaultType, defaultWarehouseId]);

    const set = (key: keyof typeof EMPTY_FORM, value: any) =>
        setForm(prev => ({ ...prev, [key]: value }));

    const toggleTax = (id: number) => {
        setForm(prev => ({
            ...prev,
            tax_ids: prev.tax_ids.includes(id)
                ? prev.tax_ids.filter(t => t !== id)
                : [...prev.tax_ids, id],
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrors({});
        setSaving(true);

        try {
            const csrf = (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content ?? '';
            const res = await fetch('/product-service/items/quick-add', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': csrf,
                    'X-Requested-With': 'XMLHttpRequest',
                },
                body: JSON.stringify({
                    ...form,
                    sale_price:     parseFloat(form.sale_price as string) || 0,
                    purchase_price: parseFloat(form.purchase_price as string) || 0,
                    quantity:       form.quantity !== '' ? parseInt(form.quantity as string) : undefined,
                    category_id:    form.category_id || null,
                    unit:           form.unit || null,
                    warehouse_id:   form.warehouse_id || null,
                }),
            });

            const json = await res.json();

            if (!res.ok) {
                // Laravel validation errors come as { errors: { field: ['msg'] } }
                if (json.errors) {
                    const flat: Record<string, string> = {};
                    Object.entries(json.errors).forEach(([k, v]) => {
                        flat[k] = Array.isArray(v) ? (v as string[])[0] : String(v);
                    });
                    setErrors(flat);
                } else {
                    setErrors({ name: json.message ?? t('Something went wrong') });
                }
                return;
            }

            onCreated(json.item);
            onClose();
        } catch {
            setErrors({ name: t('Network error. Please try again.') });
        } finally {
            setSaving(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <PackagePlus className="h-5 w-5 text-primary" />
                        {t('Quick Add Product / Service')}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 pt-1">
                    {/* Type toggle */}
                    <div className="flex gap-2">
                        {(['product', 'service'] as const).map(tp => (
                            <button
                                key={tp}
                                type="button"
                                onClick={() => set('type', tp)}
                                className={`flex-1 py-2 rounded-md border text-sm font-medium transition-colors ${
                                    form.type === tp
                                        ? 'bg-primary text-primary-foreground border-primary'
                                        : 'bg-background border-input hover:bg-muted'
                                }`}
                            >
                                {tp === 'product' ? t('Product') : t('Service')}
                            </button>
                        ))}
                    </div>

                    {/* Name */}
                    <div>
                        <Label htmlFor="qa_name">{t('Name')} *</Label>
                        <Input
                            id="qa_name"
                            value={form.name}
                            onChange={e => set('name', e.target.value)}
                            placeholder={t('e.g. Laptop, Consulting')}
                            required
                        />
                        <InputError message={errors.name} />
                    </div>

                    {/* Prices */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <Label htmlFor="qa_sale_price">{t('Sale Price')} *</Label>
                            <Input
                                id="qa_sale_price"
                                type="number"
                                min="0"
                                step="any"
                                value={form.sale_price}
                                onChange={e => set('sale_price', e.target.value)}
                                placeholder="0"
                                required
                            />
                            <InputError message={errors.sale_price} />
                        </div>
                        <div>
                            <Label htmlFor="qa_purchase_price">{t('Purchase Price')} *</Label>
                            <Input
                                id="qa_purchase_price"
                                type="number"
                                min="0"
                                step="any"
                                value={form.purchase_price}
                                onChange={e => set('purchase_price', e.target.value)}
                                placeholder="0"
                                required
                            />
                            <InputError message={errors.purchase_price} />
                        </div>
                    </div>

                    {/* Category + Unit */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <Label>{t('Category')}</Label>
                            <Select value={form.category_id} onValueChange={v => set('category_id', v)}>
                                <SelectTrigger className="h-9">
                                    <SelectValue placeholder={t('Select...')} />
                                </SelectTrigger>
                                <SelectContent>
                                    {categories.map(c => (
                                        <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <InputError message={errors.category_id} />
                        </div>
                        <div>
                            <Label>{t('Unit')}</Label>
                            <Select value={form.unit} onValueChange={v => set('unit', v)}>
                                <SelectTrigger className="h-9">
                                    <SelectValue placeholder={t('Select...')} />
                                </SelectTrigger>
                                <SelectContent>
                                    {units.map(u => (
                                        <SelectItem key={u.id} value={u.unit_name}>{u.unit_name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Taxes */}
                    {taxes.length > 0 && (
                        <div>
                            <Label>{t('Taxes')}</Label>
                            <div className="mt-1 flex flex-wrap gap-3 p-3 border rounded-md bg-muted/30">
                                {taxes.map(tax => (
                                    <label key={tax.id} className="flex items-center gap-1.5 cursor-pointer text-sm">
                                        <Checkbox
                                            checked={form.tax_ids.includes(tax.id)}
                                            onCheckedChange={() => toggleTax(tax.id)}
                                        />
                                        {tax.tax_name} ({tax.rate}%)
                                    </label>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Warehouse + Initial Stock — only for products */}
                    {form.type === 'product' && (
                        <div className="grid grid-cols-2 gap-3 p-3 bg-blue-50 rounded-md border border-blue-200">
                            <div>
                                <Label>{t('Warehouse')}</Label>
                                <Select value={form.warehouse_id} onValueChange={v => set('warehouse_id', v)}>
                                    <SelectTrigger className="h-9">
                                        <SelectValue placeholder={t('Select...')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {warehouses.map(w => (
                                            <SelectItem key={w.id} value={w.id.toString()}>{w.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <InputError message={errors.warehouse_id} />
                            </div>
                            <div>
                                <Label htmlFor="qa_qty">{t('Initial Stock')}</Label>
                                <Input
                                    id="qa_qty"
                                    type="number"
                                    min="0"
                                    value={form.quantity}
                                    onChange={e => set('quantity', e.target.value)}
                                    placeholder="0"
                                />
                                <InputError message={errors.quantity} />
                            </div>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex justify-end gap-2 pt-2 border-t">
                        <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
                            {t('Cancel')}
                        </Button>
                        <Button type="submit" disabled={saving}>
                            {saving ? t('Saving...') : t('Create & Select')}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}

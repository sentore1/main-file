import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/utils/helpers';
import { Plus } from 'lucide-react';
import QuickAddProductModal from '@/components/QuickAddProductModal';

interface Product {
    id: number;
    name: string;
    sale_price: number;
    unit?: string;
    type?: string;
    item_type?: string;
    stock_quantity?: number;
    taxes?: Array<{id: number; tax_name: string; rate: number}>;
}

interface Props {
    products: Product[];
    value: number;
    onChange: (productId: number, product?: Product) => void;
    onProductAdded?: (product: Product) => void;
    defaultWarehouseId?: string;
    invoiceType?: string;
}

export default function ProductSelector({
    products,
    value,
    onChange,
    onProductAdded,
    defaultWarehouseId = '',
    invoiceType = 'product',
}: Props) {
    const { t } = useTranslation();
    const [showModal, setShowModal] = useState(false);

    const handleChange = (productId: string) => {
        const id = parseInt(productId);
        const product = products.find(p => p.id === id);
        onChange(id, product);
    };

    const handleCreated = (item: any) => {
        const newProduct: Product = {
            id:             item.id,
            name:           item.name,
            sale_price:     item.sale_price,
            unit:           item.unit,
            type:           item.type,
            item_type:      item.item_type,
            stock_quantity: item.stock_quantity ?? 0,
            taxes:          item.taxes,
        };
        onProductAdded?.(newProduct);
        onChange(newProduct.id, newProduct);
    };

    return (
        <div className="flex gap-1.5 items-center w-full">
            <div className="flex-1 min-w-0">
                <Select value={value.toString()} onValueChange={handleChange}>
                    <SelectTrigger className="w-full">
                        <SelectValue placeholder={t('Select Item')} />
                    </SelectTrigger>
                    <SelectContent searchable>
                        {products.length > 0 ? (
                            products.map((product) => (
                                <SelectItem key={product.id} value={product.id.toString()}>
                                    {product.name} - {formatCurrency(product.sale_price || 0)}
                                </SelectItem>
                            ))
                        ) : (
                            <div className="px-2 py-6 text-center text-sm text-muted-foreground">
                                {t('No items available')}
                            </div>
                        )}
                    </SelectContent>
                </Select>
            </div>

            <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9 w-9 p-0 flex-shrink-0 text-primary border-primary hover:bg-primary hover:text-primary-foreground"
                onClick={() => setShowModal(true)}
                title={t('Quick add new product / service')}
            >
                <Plus className="h-4 w-4" />
            </Button>

            <QuickAddProductModal
                open={showModal}
                onClose={() => setShowModal(false)}
                onCreated={handleCreated}
                defaultType={invoiceType === 'service' ? 'service' : 'product'}
                defaultWarehouseId={defaultWarehouseId}
            />
        </div>
    );
}

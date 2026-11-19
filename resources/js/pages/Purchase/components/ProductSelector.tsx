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
    purchase_price: number;
    unit?: string;
    taxes?: Array<{id: number; tax_name: string; rate: number}>;
}

interface Props {
    products: Product[];
    value: number;
    onChange: (productId: number, product?: Product) => void;
    onProductAdded?: (product: Product) => void;
    defaultWarehouseId?: string;
}

export default function ProductSelector({ products, value, onChange, onProductAdded, defaultWarehouseId = '' }: Props) {
    const { t } = useTranslation();
    const [showModal, setShowModal] = useState(false);

    const handleChange = (productId: string) => {
        const id = parseInt(productId);
        const product = products.find(p => p.id === id);
        onChange(id, product);
    };

    const handleCreated = (item: any) => {
        // Normalise to purchase shape (use purchase_price)
        const newProduct: Product = {
            id:             item.id,
            name:           item.name,
            purchase_price: item.purchase_price,
            unit:           item.unit,
            taxes:          item.taxes,
        };
        // Tell parent to append to its products list
        onProductAdded?.(newProduct);
        // Auto-select the new product
        onChange(newProduct.id, newProduct);
    };

    return (
        <div className="flex gap-1.5 items-center w-full">
            <div className="flex-1 min-w-0">
                <Select value={value.toString()} onValueChange={handleChange}>
                    <SelectTrigger className="w-full">
                        <SelectValue placeholder={t('Select Product')} />
                    </SelectTrigger>
                    <SelectContent searchable>
                        {products.map((product) => (
                            <SelectItem key={product.id} value={product.id.toString()}>
                                {product.name} - {formatCurrency(product.purchase_price || 0)}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9 w-9 p-0 flex-shrink-0 text-primary border-primary hover:bg-primary hover:text-primary-foreground"
                onClick={() => setShowModal(true)}
                title={t('Quick add new product')}
            >
                <Plus className="h-4 w-4" />
            </Button>

            <QuickAddProductModal
                open={showModal}
                onClose={() => setShowModal(false)}
                onCreated={handleCreated}
                defaultType="product"
                defaultWarehouseId={defaultWarehouseId}
            />
        </div>
    );
}

import React from 'react';
import { useTranslation } from 'react-i18next';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatCurrency } from '@/utils/helpers';

interface Product {
    id: number;
    name: string;
    sale_price: number;
    unit?: string;
    type?: string;
    item_type?: string;
    taxes?: Array<{id: number; tax_name: string; rate: number}>;
}

interface Props {
    products: Product[];
    value: number;
    onChange: (productId: number, product?: Product) => void;
    itemTypeFilter?: 'all' | 'product' | 'service' | 'room';
}

export default function ProductSelector({ products, value, onChange, itemTypeFilter = 'all' }: Props) {
    const { t } = useTranslation();

    const handleChange = (productId: string) => {
        const id = parseInt(productId);
        const product = products.find(p => p.id === id);
        onChange(id, product);
    };

    // Filter products based on selected item type
    const filteredProducts = itemTypeFilter === 'all' 
        ? products 
        : products.filter(p => {
            if (itemTypeFilter === 'product') {
                return !p.item_type || p.item_type === 'product';
            }
            return p.item_type === itemTypeFilter;
        });

    // Debug logging
    console.log('ProductSelector - Filter:', itemTypeFilter);
    console.log('ProductSelector - Total products:', products.length);
    console.log('ProductSelector - Filtered products:', filteredProducts.length);
    console.log('ProductSelector - Sample product:', products[0]);

    return (
        <Select value={value.toString()} onValueChange={handleChange}>
            <SelectTrigger className="w-full">
                <SelectValue placeholder={t('Select Item')} />
            </SelectTrigger>
            <SelectContent searchable>
                {filteredProducts.length > 0 ? (
                    filteredProducts.map((product) => (
                        <SelectItem key={product.id} value={product.id.toString()}>
                            {product.name} - {formatCurrency(product.sale_price || 0)}
                        </SelectItem>
                    ))
                ) : (
                    <div className="px-2 py-6 text-center text-sm text-muted-foreground">
                        {t('No items available for')} {itemTypeFilter}
                    </div>
                )}
            </SelectContent>
        </Select>
    );
}
import { Package } from 'lucide-react';

declare global {
    function route(name: string): string;
}

export const productServiceCompanyMenu = (t: (key: string) => string) => [
    {
        title: t('Product & Service'),
        icon: Package,
        permission: 'manage-product-service-item',
        order: 5,
        children: [
            {
                title: t('Items'),
                href: route('product-service.items.index'),
                permission: 'manage-product-service-item',
                order: 1
            },
            {
                title: t('Stock'),
                href: route('product-service.stock.index'),
                permission: 'manage-stock',
                order: 2
            },
            {
                title: t('Stock Reports'),
                href: route('product-service.stock-reports.index'),
                permission: 'manage-stock-report',
                order: 3
            },
            {
                title: t('Stock Requisitions'),
                href: route('stock-requisitions.index'),
                permission: 'manage-stock-requisitions',
                order: 4
            }
        ]
    }
];

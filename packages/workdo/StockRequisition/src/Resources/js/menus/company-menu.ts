import { ClipboardList } from 'lucide-react';

declare global {
    function route(name: string): string;
}

export const stockRequisitionCompanyMenu = (t: (key: string) => string) => [
    {
        title: t('Stock Requisitions'),
        href: route('stock-requisitions.index'),
        permission: 'manage-stock-requisitions',
        order: 4,
        icon: ClipboardList
    }
];

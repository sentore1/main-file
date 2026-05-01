import { useEffect } from 'react';
import { Head, usePage } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';

export default function Print() {
    const { t } = useTranslation();
    const { date, type, categories } = usePage<any>().props;

    useEffect(() => {
        window.print();
    }, []);

    const groupedCategories = Object.entries(categories).map(([categoryName, items]: [string, any]) => ({
        name: categoryName || 'Uncategorized',
        items: items,
        total: items.reduce((sum: number, item: any) => sum + parseFloat(item.quantity), 0)
    }));

    const grandTotal = groupedCategories.reduce((sum, cat) => sum + cat.total, 0);

    return (
        <>
            <Head title={t('Print Stock Report')} />
            <div className="print-container p-8 bg-white">
                <style>{`
                    @media print {
                        body { margin: 0; padding: 0; }
                        .print-container { padding: 20px; }
                        @page { margin: 1cm; }
                    }
                    table { border-collapse: collapse; width: 100%; }
                    th, td { border: 1px solid #ddd; padding: 8px; }
                    th { background-color: #f3f4f6; }
                `}</style>

                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold mb-2">{t('Stock Report')}</h1>
                    <p className="text-lg">
                        {t(type === 'opening' ? 'Opening Stock Report' : 'Closing Stock Report')}
                    </p>
                    <p className="text-gray-600">{t('Date')}: {new Date(date).toLocaleDateString()}</p>
                </div>

                {groupedCategories.map((category) => (
                    <div key={category.name} className="mb-8">
                        <h2 className="text-xl font-semibold mb-4 pb-2 border-b-2 border-gray-800">
                            {category.name}
                        </h2>
                        <table>
                            <thead>
                                <tr>
                                    <th className="text-left">{t('Product Name')}</th>
                                    <th className="text-left">{t('SKU')}</th>
                                    <th className="text-left">{t('Warehouse')}</th>
                                    <th className="text-right">{t('Quantity')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {category.items.map((item: any, index: number) => (
                                    <tr key={index}>
                                        <td>{item.product.name}</td>
                                        <td>{item.product.sku}</td>
                                        <td>{item.warehouse?.name || t('All')}</td>
                                        <td className="text-right">{Math.floor(item.quantity)}</td>
                                    </tr>
                                ))}
                                <tr className="font-semibold bg-gray-100">
                                    <td colSpan={3} className="text-right">{t('Category Total')}:</td>
                                    <td className="text-right">{Math.floor(category.total)}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                ))}

                <div className="mt-8 pt-4 border-t-2 border-gray-800">
                    <div className="flex justify-between items-center">
                        <div>
                            <p className="text-sm text-gray-600">{t('Printed on')}: {new Date().toLocaleString()}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-2xl font-bold">{t('Grand Total')}: {Math.floor(grandTotal)}</p>
                        </div>
                    </div>
                </div>

                <div className="mt-12 pt-8 border-t">
                    <div className="grid grid-cols-2 gap-8">
                        <div>
                            <p className="mb-2">{t('Prepared By')}:</p>
                            <div className="border-b border-gray-400 pb-1 mb-2" style={{ width: '200px' }}></div>
                            <p className="text-sm text-gray-600">{t('Signature')}</p>
                        </div>
                        <div>
                            <p className="mb-2">{t('Verified By')}:</p>
                            <div className="border-b border-gray-400 pb-1 mb-2" style={{ width: '200px' }}></div>
                            <p className="text-sm text-gray-600">{t('Signature')}</p>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

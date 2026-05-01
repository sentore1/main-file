import { Head, usePage, router } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import AuthenticatedLayout from "@/layouts/authenticated-layout";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Printer, ArrowLeft } from 'lucide-react';

export default function Show() {
    const { t } = useTranslation();
    const { reportData } = usePage<any>().props;

    const handlePrint = () => {
        router.visit(route('product-service.stock-reports.print', [reportData.date, reportData.type]));
    };

    return (
        <AuthenticatedLayout
            breadcrumbs={[
                { label: t('Product & Service') },
                { label: t('Stock Reports'), href: route('product-service.stock-reports.index') },
                { label: t('View Report') }
            ]}
            pageTitle={`${t(reportData.type === 'opening' ? 'Opening Stock' : 'Closing Stock')} - ${new Date(reportData.date).toLocaleDateString()}`}
            pageActions={
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => router.visit(route('product-service.stock-reports.index'))}>
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        {t('Back')}
                    </Button>
                    <Button size="sm" onClick={handlePrint}>
                        <Printer className="h-4 w-4 mr-2" />
                        {t('Print')}
                    </Button>
                </div>
            }
        >
            <Head title={t('Stock Report')} />

            <Card>
                <CardHeader className="border-b">
                    <div className="flex justify-between items-center">
                        <CardTitle>{t('Stock Report Details')}</CardTitle>
                        <div className="text-right">
                            <p className="text-sm text-gray-600">{t('Date')}: {new Date(reportData.date).toLocaleDateString()}</p>
                            <p className="text-sm">
                                <span className={`px-2 py-1 rounded-full text-sm capitalize ${
                                    reportData.type === 'opening' ? 'bg-blue-100 text-blue-800' : 'bg-orange-100 text-orange-800'
                                }`}>
                                    {t(reportData.type === 'opening' ? 'Opening Stock' : 'Closing Stock')}
                                </span>
                            </p>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-6">
                    {Object.entries(reportData.categories).map(([categoryName, categoryData]: [string, any]) => (
                        <div key={categoryName} className="mb-8">
                            <h3 className="text-lg font-semibold mb-4 pb-2 border-b-2 border-gray-300">
                                {categoryData.name}
                            </h3>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="bg-gray-50">
                                            <th className="px-4 py-2 text-left text-sm font-semibold">{t('Product Name')}</th>
                                            <th className="px-4 py-2 text-left text-sm font-semibold">{t('SKU')}</th>
                                            <th className="px-4 py-2 text-left text-sm font-semibold">{t('Warehouse')}</th>
                                            <th className="px-4 py-2 text-right text-sm font-semibold">{t('Quantity')}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {categoryData.items.map((item: any, index: number) => (
                                            <tr key={index} className="border-b hover:bg-gray-50">
                                                <td className="px-4 py-3">{item.product_name}</td>
                                                <td className="px-4 py-3 text-gray-600">{item.sku}</td>
                                                <td className="px-4 py-3 text-gray-600">{item.warehouse || t('All')}</td>
                                                <td className="px-4 py-3 text-right font-medium">{Math.floor(item.quantity)}</td>
                                            </tr>
                                        ))}
                                        <tr className="bg-gray-100 font-semibold">
                                            <td colSpan={3} className="px-4 py-3 text-right">{t('Category Total')}:</td>
                                            <td className="px-4 py-3 text-right">{Math.floor(categoryData.total_quantity)}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ))}

                    <div className="mt-6 pt-6 border-t-2 border-gray-400">
                        <div className="flex justify-end">
                            <div className="text-right">
                                <p className="text-2xl font-bold">
                                    {t('Grand Total')}: {Math.floor(Object.values(reportData.categories).reduce((sum: number, cat: any) => sum + cat.total_quantity, 0))}
                                </p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </AuthenticatedLayout>
    );
}

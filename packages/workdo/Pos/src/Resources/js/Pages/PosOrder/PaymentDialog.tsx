import { useState } from 'react';
import { useForm } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatCurrency } from '@/utils/helpers';
import { DollarSign } from 'lucide-react';

interface PaymentDialogProps {
    open: boolean;
    onClose: () => void;
    sale: {
        id: number;
        sale_number: string;
        balance_due: number;
        total: number;
        paid_amount: number;
    };
}

export default function PaymentDialog({ open, onClose, sale }: PaymentDialogProps) {
    const { t } = useTranslation();
    const { data, setData, post, processing, errors, reset } = useForm({
        amount: sale.balance_due.toString(),
        payment_method: 'cash',
        bank_account_id: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('pos.add-payment', sale.id), {
            onSuccess: () => {
                reset();
                onClose();
            },
        });
    };

    const handleClose = () => {
        reset();
        onClose();
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <DollarSign className="h-5 w-5 text-orange-600" />
                        {t('Add Payment')}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit}>
                    <div className="space-y-4 py-4">
                        {/* Order Info */}
                        <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                            <div className="flex justify-between">
                                <span className="text-sm text-gray-600">{t('Order')}:</span>
                                <span className="text-sm font-semibold">{sale.sale_number}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-sm text-gray-600">{t('Total')}:</span>
                                <span className="text-sm font-semibold">{formatCurrency(sale.total)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-sm text-gray-600">{t('Paid')}:</span>
                                <span className="text-sm font-semibold text-green-600">{formatCurrency(sale.paid_amount)}</span>
                            </div>
                            <div className="flex justify-between border-t pt-2">
                                <span className="text-sm font-medium text-gray-900">{t('Balance Due')}:</span>
                                <span className="text-base font-bold text-orange-600">{formatCurrency(sale.balance_due)}</span>
                            </div>
                        </div>

                        {/* Payment Amount */}
                        <div>
                            <Label htmlFor="amount">{t('Payment Amount')}</Label>
                            <Input
                                id="amount"
                                type="number"
                                step="0.01"
                                min="0.01"
                                max={sale.balance_due}
                                value={data.amount}
                                onChange={(e) => setData('amount', e.target.value)}
                                className={errors.amount ? 'border-red-500' : ''}
                                required
                            />
                            {errors.amount && (
                                <p className="text-sm text-red-500 mt-1">{errors.amount}</p>
                            )}
                        </div>

                        {/* Payment Method */}
                        <div>
                            <Label htmlFor="payment_method">{t('Payment Method')}</Label>
                            <Select
                                value={data.payment_method}
                                onValueChange={(value) => setData('payment_method', value)}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="cash">{t('Cash')}</SelectItem>
                                    <SelectItem value="card">{t('Card')}</SelectItem>
                                    <SelectItem value="bank_transfer">{t('Bank Transfer')}</SelectItem>
                                    <SelectItem value="mtn_momo">{t('MTN Mobile Money')}</SelectItem>
                                    <SelectItem value="airtel_money">{t('Airtel Money')}</SelectItem>
                                </SelectContent>
                            </Select>
                            {errors.payment_method && (
                                <p className="text-sm text-red-500 mt-1">{errors.payment_method}</p>
                            )}
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={handleClose} disabled={processing}>
                            {t('Cancel')}
                        </Button>
                        <Button type="submit" disabled={processing}>
                            {processing ? t('Processing...') : t('Add Payment')}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

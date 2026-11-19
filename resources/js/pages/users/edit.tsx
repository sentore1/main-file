import { useState } from 'react';
import { DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useForm, router } from "@inertiajs/react";
import { useTranslation } from 'react-i18next';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import InputError from "@/components/ui/input-error";
import { PhoneInputComponent } from "@/components/ui/phone-input";
import { EditUserProps, EditUserFormData, Warehouse } from './types';
import { Building2, User as UserIcon } from 'lucide-react';

export default function Edit({ user, onSuccess, roles = {}, warehouses = [] }: EditUserProps) {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState<'details' | 'access'>('details');
    const [savingAccess, setSavingAccess] = useState(false);

    // --- User details form ---
    const { data, setData, put, processing, errors } = useForm<EditUserFormData>({
        name: user.name,
        email: user.email,
        mobile_no: user.mobile_no,
        is_enable_login: user.is_enable_login,
    });

    // --- Warehouse selection state ---
    const [selectedWarehouseIds, setSelectedWarehouseIds] = useState<number[]>(
        user.warehouse_ids ?? []
    );

    const submitDetails = (e: React.FormEvent) => {
        e.preventDefault();
        put(route('users.update', user.id), { onSuccess });
    };

    const toggleWarehouse = (id: number) => {
        setSelectedWarehouseIds(prev =>
            prev.includes(id) ? prev.filter(w => w !== id) : [...prev, id]
        );
    };

    const toggleBranch = (branchIds: number[], allSelected: boolean) => {
        if (allSelected) {
            setSelectedWarehouseIds(prev => prev.filter(id => !branchIds.includes(id)));
        } else {
            setSelectedWarehouseIds(prev => [...new Set([...prev, ...branchIds])]);
        }
    };

    const saveAccess = () => {
        setSavingAccess(true);
        router.post(
            route('users.warehouses', user.id),
            { warehouse_ids: selectedWarehouseIds },
            {
                preserveState: true,
                onFinish: () => setSavingAccess(false),
                onSuccess: () => onSuccess(),
            }
        );
    };

    // Group warehouses by address (branch)
    const branches: Record<string, Warehouse[]> = {};
    warehouses.forEach(w => {
        const key = w.address || 'Other';
        if (!branches[key]) branches[key] = [];
        branches[key].push(w);
    });

    const tabClass = (tab: 'details' | 'access') =>
        `flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === tab
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700'
        }`;

    return (
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
                <DialogTitle>{t('Edit User')}: {user.name}</DialogTitle>
            </DialogHeader>

            {/* Tabs */}
            <div className="flex border-b mb-4">
                <button className={tabClass('details')} onClick={() => setActiveTab('details')}>
                    <UserIcon className="h-4 w-4" />
                    {t('User Details')}
                </button>
                <button className={tabClass('access')} onClick={() => setActiveTab('access')}>
                    <Building2 className="h-4 w-4" />
                    {t('Branch Access')}
                    {selectedWarehouseIds.length > 0 && (
                        <span className="ml-1 bg-primary text-primary-foreground text-xs rounded-full px-1.5 py-0.5 leading-none">
                            {selectedWarehouseIds.length}
                        </span>
                    )}
                </button>
            </div>

            {/* ── Tab: User Details ── */}
            {activeTab === 'details' && (
                <form onSubmit={submitDetails} className="space-y-4">
                    <div>
                        <Label htmlFor="edit_name">{t('Name')}</Label>
                        <Input
                            id="edit_name"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            placeholder={t('Enter full name')}
                            required
                        />
                        <InputError message={errors.name} />
                    </div>
                    <div>
                        <Label htmlFor="edit_email">{t('Email')}</Label>
                        <Input
                            id="edit_email"
                            type="email"
                            value={data.email}
                            onChange={(e) => setData('email', e.target.value)}
                            placeholder={t('Enter email address')}
                            required
                        />
                        <InputError message={errors.email} />
                    </div>
                    <div>
                        <PhoneInputComponent
                            label={t('Mobile Number')}
                            value={data.mobile_no}
                            onChange={(value) => setData('mobile_no', value)}
                            placeholder="+1234567890"
                            error={errors.mobile_no}
                        />
                    </div>
                    <div>
                        <Label htmlFor="edit_is_enable_login">{t('Login Status')}</Label>
                        <Select
                            value={data.is_enable_login ? "1" : "0"}
                            onValueChange={(value) => setData('is_enable_login', value === "1")}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="1">{t('Enabled')}</SelectItem>
                                <SelectItem value="0">{t('Disabled')}</SelectItem>
                            </SelectContent>
                        </Select>
                        <InputError message={errors.is_enable_login} />
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                        <Button type="button" variant="outline" onClick={onSuccess}>
                            {t('Cancel')}
                        </Button>
                        <Button type="submit" disabled={processing}>
                            {processing ? t('Updating...') : t('Save Details')}
                        </Button>
                    </div>
                </form>
            )}

            {/* ── Tab: Branch Access ── */}
            {activeTab === 'access' && (
                <div className="space-y-4">
                    <p className="text-sm text-gray-500">
                        {t('Select the branches this user can access in the POS. Leave all unchecked to grant access to every branch.')}
                    </p>

                    {warehouses.length === 0 ? (
                        <p className="text-sm text-gray-400 italic">{t('No warehouses found.')}</p>
                    ) : (
                        <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                            {Object.entries(branches).map(([branch, bWarehouses]) => {
                                const branchIds = bWarehouses.map(w => w.id);
                                const allSelected = branchIds.every(id => selectedWarehouseIds.includes(id));
                                const someSelected = branchIds.some(id => selectedWarehouseIds.includes(id));

                                return (
                                    <div key={branch} className="border rounded-lg overflow-hidden">
                                        {/* Branch header row */}
                                        <div
                                            className="flex items-center gap-2 px-3 py-2 bg-blue-50 border-b cursor-pointer select-none"
                                            onClick={() => toggleBranch(branchIds, allSelected)}
                                        >
                                            <Checkbox
                                                checked={allSelected}
                                                ref={(el: any) => { if (el) el.indeterminate = someSelected && !allSelected; }}
                                                onCheckedChange={() => toggleBranch(branchIds, allSelected)}
                                                onClick={(e) => e.stopPropagation()}
                                            />
                                            <Building2 className="h-4 w-4 text-blue-600" />
                                            <span className="text-sm font-semibold text-blue-900">{branch}</span>
                                            <span className="ml-auto text-xs text-blue-600">
                                                {branchIds.filter(id => selectedWarehouseIds.includes(id)).length}/{bWarehouses.length}
                                            </span>
                                        </div>

                                        {/* Warehouse rows */}
                                        <div className="divide-y">
                                            {bWarehouses.map(w => (
                                                <label
                                                    key={w.id}
                                                    className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 cursor-pointer"
                                                >
                                                    <Checkbox
                                                        checked={selectedWarehouseIds.includes(w.id)}
                                                        onCheckedChange={() => toggleWarehouse(w.id)}
                                                    />
                                                    <span className="text-sm">{w.name}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    <div className="flex justify-between items-center pt-2 border-t">
                        <button
                            type="button"
                            className="text-xs text-gray-400 hover:text-gray-600"
                            onClick={() => setSelectedWarehouseIds([])}
                        >
                            {t('Clear all (grant full access)')}
                        </button>
                        <div className="flex gap-2">
                            <Button type="button" variant="outline" onClick={onSuccess}>
                                {t('Cancel')}
                            </Button>
                            <Button onClick={saveAccess} disabled={savingAccess}>
                                {savingAccess ? t('Saving...') : t('Save Access')}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </DialogContent>
    );
}

import { useForm } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import InputError from '@/components/ui/input-error';

interface EmployerContributionType {
    id: number;
    name: string;
}

interface EditProps {
    employercontributiontype: EmployerContributionType;
    onSuccess: () => void;
}

export default function Edit({ employercontributiontype, onSuccess }: EditProps) {
    const { t } = useTranslation();
    
    if (!employercontributiontype) {
        return null;
    }
    
    const { data, setData, put, processing, errors } = useForm({
        name: employercontributiontype.name || '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(route('hrm.employer-contribution-types.update', employercontributiontype.id), {
            onSuccess: () => {
                onSuccess();
            }
        });
    };

    return (
        <DialogContent className="max-w-md">
            <DialogHeader>
                <DialogTitle>{t('Edit Employer Contribution Type')}</DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <Label htmlFor="name" required>{t('Name')}</Label>
                    <Input
                        id="name"
                        value={data.name}
                        onChange={(e) => setData('name', e.target.value)}
                        placeholder={t('Enter name')}
                        required
                    />
                    <InputError message={errors.name} />
                </div>

                <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={onSuccess}>
                        {t('Cancel')}
                    </Button>
                    <Button type="submit" disabled={processing}>
                        {processing ? t('Updating...') : t('Update')}
                    </Button>
                </div>
            </form>
        </DialogContent>
    );
}

import { useForm } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import InputError from '@/components/ui/input-error';
import { Download, Upload, FileSpreadsheet } from 'lucide-react';
import { useState } from 'react';

interface ImportUsersProps {
    onSuccess: () => void;
}

export default function ImportUsers({ onSuccess }: ImportUsersProps) {
    const { t } = useTranslation();
    const [fileName, setFileName] = useState<string>('');

    const { data, setData, post, processing, errors, reset } = useForm({
        file: null as File | null,
    });

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setData('file', file);
            setFileName(file.name);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('users.import'), {
            forceFormData: true,
            onSuccess: () => {
                reset();
                setFileName('');
                onSuccess();
            },
        });
    };

    const downloadTemplate = () => {
        window.location.href = route('users.import.template');
    };

    return (
        <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
                <DialogTitle>{t('Import Users')}</DialogTitle>
                <DialogDescription>
                    {t('Upload an Excel file to import multiple users at once.')}
                </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Download Template Section */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                        <FileSpreadsheet className="h-5 w-5 text-blue-600 mt-0.5" />
                        <div className="flex-1">
                            <h4 className="font-medium text-sm text-blue-900 mb-1">
                                {t('Download Template')}
                            </h4>
                            <p className="text-xs text-blue-700 mb-3">
                                {t('Download the Excel template with sample data and required format.')}
                            </p>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={downloadTemplate}
                                className="border-blue-300 text-blue-700 hover:bg-blue-100"
                            >
                                <Download className="h-4 w-4 mr-2" />
                                {t('Download Template')}
                            </Button>
                        </div>
                    </div>
                </div>

                {/* File Upload Section */}
                <div>
                    <Label htmlFor="file" required>{t('Upload Excel File')}</Label>
                    <div className="mt-2">
                        <div className="flex items-center gap-2">
                            <label
                                htmlFor="file"
                                className="flex-1 flex items-center justify-center px-4 py-8 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-primary hover:bg-gray-50 transition-colors"
                            >
                                <div className="text-center">
                                    <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                                    {fileName ? (
                                        <p className="text-sm font-medium text-gray-900">{fileName}</p>
                                    ) : (
                                        <>
                                            <p className="text-sm text-gray-600">
                                                {t('Click to upload or drag and drop')}
                                            </p>
                                            <p className="text-xs text-gray-500 mt-1">
                                                {t('Excel files only (XLSX, XLS)')}
                                            </p>
                                        </>
                                    )}
                                </div>
                                <Input
                                    id="file"
                                    type="file"
                                    accept=".xlsx,.xls"
                                    onChange={handleFileChange}
                                    className="hidden"
                                />
                            </label>
                        </div>
                        <InputError message={errors.file} />
                    </div>
                </div>

                {/* Instructions */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <h4 className="font-medium text-sm text-gray-900 mb-2">
                        {t('Import Instructions')}
                    </h4>
                    <ul className="text-xs text-gray-600 space-y-1 list-disc list-inside">
                        <li>{t('Download the template and fill in user details')}</li>
                        <li>{t('Required columns: Name, Email, Password, Role')}</li>
                        <li>{t('Role must match existing roles (e.g., staff, admin)')}</li>
                        <li>{t('Enable Login: use "yes" or "no"')}</li>
                        <li>{t('Email addresses must be unique')}</li>
                    </ul>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                            reset();
                            setFileName('');
                            onSuccess();
                        }}
                        disabled={processing}
                    >
                        {t('Cancel')}
                    </Button>
                    <Button type="submit" disabled={processing || !data.file}>
                        {processing ? t('Importing...') : t('Import Users')}
                    </Button>
                </div>
            </form>
        </DialogContent>
    );
}

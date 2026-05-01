import { Head, useForm, usePage } from "@inertiajs/react";
import { useTranslation } from 'react-i18next';
import AuthenticatedLayout from "@/layouts/authenticated-layout";
import { Button } from "@/components/ui/button";
import { Label } from '@/components/ui/label';
import InputError from '@/components/ui/input-error';
import { Input } from '@/components/ui/input';
import { DatePicker } from '@/components/ui/date-picker';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { PhoneInputComponent } from '@/components/ui/phone-input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trash2, Upload, Download } from 'lucide-react';
import { CreateEmployeeFormData } from './types';
import { useEffect, useState } from 'react';
import { useFormFields } from '@/hooks/useFormFields';

export default function Create() {
    const { users, branches, departments, designations, shifts, documentTypes, generatedEmployeeId, referenceData } = usePage<any>().props;
    const [activeTab, setActiveTab] = useState('personal');
    const [filteredBranches, setFilteredBranches] = useState(branches || []);
    const [filteredDepartments, setFilteredDepartments] = useState(departments || []);
    const [filteredDesignations, setFilteredDesignations] = useState(designations || []);
    const [showBulkUpload, setShowBulkUpload] = useState(false);
    const [showReferenceGuide, setShowReferenceGuide] = useState(false);
    const { t } = useTranslation();


    const { data, setData, post, processing, errors } = useForm<CreateEmployeeFormData>({
        employee_id: generatedEmployeeId,
        biometric_id: '',
        card_uid: '',
        date_of_birth: '',
        gender: 'Male',
        shift_id: '',
        date_of_joining: '',
        employment_type: 'Full Time',
        address_line_1: '',
        address_line_2: '',
        city: '',
        state: '',
        country: '',
        postal_code: '',
        emergency_contact_name: '',
        emergency_contact_relationship: '',
        emergency_contact_number: '',
        bank_name: '',
        account_holder_name: '',
        account_number: '',
        bank_identifier_code: '',
        bank_branch: '',
        tax_payer_id: '',
        basic_salary: '',
        hours_per_day: '',
        days_per_week: '',
        rate_per_hour: '',
        user_id: '',
        branch_id: '',
        department_id: '',
        designation_id: '',
        documents: [{ document_type_id: '', file: '' }],
    });

    const bulkForm = useForm({
        file: null as File | null,
    });

    useEffect(() => {
        setFilteredBranches(branches || []);
        if (!data.user_id) {
            setData('branch_id', '');
        }
    }, [data.user_id]);

    useEffect(() => {
        if (data.branch_id) {
            const branchDepartments = departments.filter(dept => dept.branch_id.toString() === data.branch_id);
            setFilteredDepartments(branchDepartments);
            if (data.department_id && !branchDepartments.find(dept => dept.id.toString() === data.department_id)) {
                setData('department_id', '');
                setData('designation_id', '');
            }
        } else {
            setFilteredDepartments([]);
            setData('department_id', '');
            setData('designation_id', '');
        }
    }, [data.branch_id]);

    useEffect(() => {
        if (data.department_id) {
            const departmentDesignations = designations.filter(desig => desig.department_id.toString() === data.department_id);
            setFilteredDesignations(departmentDesignations);
            if (data.designation_id && !departmentDesignations.find(desig => desig.id.toString() === data.designation_id)) {
                setData('designation_id', '');
            }
        } else {
            setFilteredDesignations([]);
            setData('designation_id', '');
        }
    }, [data.department_id]);

    const validatePersonalTab = () => {
        return data.employee_id.trim() !== '' &&
            data.date_of_birth !== '' &&
            data.gender !== '';
    };

    const validateEmploymentTab = () => {
        return data.user_id !== '' &&
            data.employment_type !== '' &&
            data.shift_id !== '' &&
            data.branch_id !== '' &&
            data.department_id !== '' &&
            data.designation_id !== '';
    };

    const validateContactTab = () => {
        return data.address_line_1.trim() !== '' &&
            data.city.trim() !== '' &&
            data.state.trim() !== '' &&
            data.country.trim() !== '' &&
            data.postal_code.trim() !== '' &&
            data.emergency_contact_name.trim() !== '' &&
            data.emergency_contact_relationship.trim() !== '' &&
            data.emergency_contact_number.trim() !== '';
    };

    const validateBankingTab = () => {
        return data.bank_name.trim() !== '' &&
            data.account_holder_name.trim() !== '' &&
            data.account_number.trim() !== '' &&
            data.bank_identifier_code.trim() !== '' &&
            data.bank_branch.trim() !== '';
    };

    const validateHoursTab = () => {
        return data.basic_salary?.trim() !== '' &&
            data.hours_per_day?.trim() !== '' &&
            data.days_per_week?.trim() !== '' &&
            data.rate_per_hour?.trim() !== '';
    };

    const addDocument = () => {
        setData('documents', [...data.documents, { document_type_id: '', file: '' }]);
    };

    const removeDocument = (index: number) => {
        const newDocuments = data.documents.filter((_, i) => i !== index);
        setData('documents', newDocuments);
    };

    const updateDocument = (index: number, field: string, value: any) => {
        const newDocuments = [...data.documents];
        newDocuments[index] = { ...newDocuments[index], [field]: value };
        setData('documents', newDocuments);
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        
        const formData = new FormData();
        
        // Add all form fields
        Object.keys(data).forEach(key => {
            if (key !== 'documents') {
                formData.append(key, data[key]);
            }
        });
        
        // Add documents with files
        data.documents.forEach((document, index) => {
            if (document.document_type_id) {
                formData.append(`documents[${index}][document_type_id]`, document.document_type_id);
            }
            if (document.file) {
                formData.append(`documents[${index}][file]`, document.file);
            }
        });
        
        post(route('hrm.employees.store'), {
            data: formData,
            forceFormData: true,
        });
    };

    const submitBulkUpload = (e: React.FormEvent) => {
        e.preventDefault();
        if (!bulkForm.data.file) return;

        bulkForm.post(route('hrm.employees.bulk-import'), {
            forceFormData: true,
            onSuccess: () => {
                bulkForm.reset();
            },
        });
    };

    return (
        <AuthenticatedLayout
            breadcrumbs={[
                { label: t('Hrm'), url: route('hrm.index') },
                { label: t('Employees'), url: route('hrm.employees.index') },
                { label: t('Create') }
            ]}
            pageTitle={t('Create Employee')}
        >
            <Head title={t('Create Employee')} />

            <div className="flex justify-end mb-4">
                <Button
                    type="button"
                    variant={showBulkUpload ? "outline" : "default"}
                    onClick={() => setShowBulkUpload(!showBulkUpload)}
                >
                    <Upload className="h-4 w-4 mr-2" />
                    {showBulkUpload ? t('Manual Entry') : t('Bulk Upload')}
                </Button>
            </div>

            {showBulkUpload ? (
                <Card className="shadow-sm">
                    <CardContent className="pt-6">
                        <form onSubmit={submitBulkUpload} className="space-y-6">
                            <div>
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-lg font-medium">{t('Bulk Upload Employees')}</h3>
                                    <div className="flex gap-2">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => setShowReferenceGuide(!showReferenceGuide)}
                                        >
                                            {showReferenceGuide ? t('Hide Reference') : t('Show ID Reference')}
                                        </Button>
                                        <a
                                            href={route('hrm.employees.download-template')}
                                            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                                        >
                                            <Download className="h-4 w-4 mr-2" />
                                            {t('Download Template')}
                                        </a>
                                    </div>
                                </div>

                                {showReferenceGuide && referenceData && (
                                    <div className="bg-gray-50 border border-gray-200 rounded-md p-4 mb-4 max-h-96 overflow-y-auto">
                                        <h4 className="font-medium text-gray-900 mb-3">{t('ID Reference Guide')}</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                            <div>
                                                <h5 className="font-semibold text-gray-700 mb-2">{t('Available Users')}</h5>
                                                <div className="space-y-1">
                                                    {referenceData.users?.map((user: any) => (
                                                        <div key={user.id} className="flex justify-between">
                                                            <span className="text-gray-600">{user.name}</span>
                                                            <span className="font-mono text-blue-600">ID: {user.id}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                            <div>
                                                <h5 className="font-semibold text-gray-700 mb-2">{t('Branches')}</h5>
                                                <div className="space-y-1">
                                                    {referenceData.branches?.map((branch: any) => (
                                                        <div key={branch.id} className="flex justify-between">
                                                            <span className="text-gray-600">{branch.branch_name}</span>
                                                            <span className="font-mono text-blue-600">ID: {branch.id}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                            <div>
                                                <h5 className="font-semibold text-gray-700 mb-2">{t('Departments')}</h5>
                                                <div className="space-y-1">
                                                    {referenceData.departments?.map((dept: any) => (
                                                        <div key={dept.id} className="flex justify-between">
                                                            <span className="text-gray-600">{dept.department_name}</span>
                                                            <span className="font-mono text-blue-600">ID: {dept.id}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                            <div>
                                                <h5 className="font-semibold text-gray-700 mb-2">{t('Designations')}</h5>
                                                <div className="space-y-1">
                                                    {referenceData.designations?.map((desig: any) => (
                                                        <div key={desig.id} className="flex justify-between">
                                                            <span className="text-gray-600">{desig.designation_name}</span>
                                                            <span className="font-mono text-blue-600">ID: {desig.id}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                            <div>
                                                <h5 className="font-semibold text-gray-700 mb-2">{t('Shifts')}</h5>
                                                <div className="space-y-1">
                                                    {referenceData.shifts?.map((shift: any) => (
                                                        <div key={shift.id} className="flex justify-between">
                                                            <span className="text-gray-600">{shift.shift_name}</span>
                                                            <span className="font-mono text-blue-600">ID: {shift.id}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-4">
                                    <h4 className="font-medium text-blue-900 mb-2">{t('Template Instructions:')}</h4>
                                    <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                                        <li>{t('Download the template CSV file above')}</li>
                                        <li>{t('Fill in employee data following the sample row format')}</li>
                                        <li>{t('Delete the instruction row (row 3) before uploading')}</li>
                                        <li>{t('Employee ID will be auto-generated (format: EMP20250001) - leave blank or provide custom')}</li>
                                        <li>{t('Required fields: user_id, date_of_birth, gender, shift_id, employment_type, branch_id, department_id, designation_id, basic_salary')}</li>
                                        <li>{t('Date format: YYYY-MM-DD (e.g., 2024-01-15)')}</li>
                                        <li>{t('Gender options: Male, Female, Other')}</li>
                                        <li>{t('Employment type: Full Time, Part Time, Temporary, Contract')}</li>
                                        <li>{t('Phone format: +250XXXXXXXXX (include country code)')}</li>
                                    </ul>
                                </div>
                                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-4">
                                    <h4 className="font-medium text-yellow-900 mb-2">{t('Important Notes:')}</h4>
                                    <ul className="text-sm text-yellow-800 space-y-1 list-disc list-inside">
                                        <li>{t('All required columns must be present in the file')}</li>
                                        <li>{t('Duplicate employees (same user_id) will be skipped')}</li>
                                        <li>{t('Empty rows will be ignored')}</li>
                                        <li>{t('Invalid data will skip that row and continue with others')}</li>
                                        <li>{t('You will receive a detailed report after upload')}</li>
                                    </ul>
                                </div>
                                <Label htmlFor="bulk_file">{t('Select CSV File')}</Label>
                                <Input
                                    id="bulk_file"
                                    type="file"
                                    accept=".csv"
                                    onChange={(e) => bulkForm.setData('file', e.target.files?.[0] || null)}
                                    required
                                />
                                {bulkForm.data.file && (
                                    <p className="text-sm text-muted-foreground mt-2">
                                        {bulkForm.data.file.name}
                                    </p>
                                )}
                                <InputError message={bulkForm.errors.file} />
                            </div>
                            <div className="flex gap-2">
                                <Button type="button" variant="outline" onClick={() => window.history.back()}>
                                    {t('Cancel')}
                                </Button>
                                <Button type="submit" disabled={bulkForm.processing || !bulkForm.data.file}>
                                    {bulkForm.processing ? t('Uploading...') : t('Upload')}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            ) : (
            <Card className="shadow-sm">
                <CardContent>
                    <form onSubmit={submit} className="pt-5">
                        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                            <TabsList className="grid w-full grid-cols-6">
                                <TabsTrigger value="personal">{t('Personal')}</TabsTrigger>
                                <TabsTrigger value="employment">{t('Employment')}</TabsTrigger>
                                <TabsTrigger value="contact">{t('Contact')}</TabsTrigger>
                                <TabsTrigger value="banking">{t('Banking')}</TabsTrigger>
                                <TabsTrigger value="hours">{t('Hours & Rates')}</TabsTrigger>
                                <TabsTrigger value="documents">{t('Documents')}</TabsTrigger>
                            </TabsList>

                            <TabsContent value="personal" className="space-y-6 mt-6">
                                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                    <div>
                                        <Label htmlFor="employee_id">{t('Employee Id')}</Label>
                                        <Input
                                            id="employee_id"
                                            type="text"
                                            value={data.employee_id}
                                            placeholder={t('Auto Generated')}
                                            readOnly
                                            className="bg-gray-50"
                                        />
                                        <InputError message={errors.employee_id} />
                                    </div>

                                    <div>
                                        <Label required>{t('Date Of Birth')}</Label>
                                        <DatePicker
                                            value={data.date_of_birth}
                                            onChange={(date) => setData('date_of_birth', date)}
                                            placeholder={t('Select Date Of Birth')}
                                            required
                                        />
                                        <InputError message={errors.date_of_birth} />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                    <div>
                                        <Label>{t('Gender')}</Label>
                                        <RadioGroup value={data.gender || 'Male'} onValueChange={(value) => setData('gender', value)} className="flex gap-6 mt-2">
                                            <div className="flex items-center space-x-2">
                                                <RadioGroupItem value="Male" id="gender_male" />
                                                <Label htmlFor="gender_male" className="cursor-pointer">{t('Male')}</Label>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <RadioGroupItem value="Female" id="gender_female" />
                                                <Label htmlFor="gender_female" className="cursor-pointer">{t('Female')}</Label>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <RadioGroupItem value="Other" id="gender_other" />
                                                <Label htmlFor="gender_other" className="cursor-pointer">{t('Other')}</Label>
                                            </div>
                                        </RadioGroup>
                                        <InputError message={errors.gender} />
                                    </div>

                                    <div>
                                        <Label htmlFor="biometric_id">{t('Biometric ID')}</Label>
                                        <Input
                                            id="biometric_id"
                                            type="text"
                                            value={data.biometric_id}
                                            onChange={(e) => setData('biometric_id', e.target.value)}
                                            placeholder={t('Enter Fingerprint Device ID')}
                                        />
                                        <InputError message={errors.biometric_id} />
                                    </div>
                                    <div>
                                        <Label htmlFor="card_uid">{t('Card UID')}</Label>
                                        <Input
                                            id="card_uid"
                                            type="text"
                                            value={data.card_uid}
                                            onChange={(e) => setData('card_uid', e.target.value)}
                                            placeholder={t('Enter RFID Card UID')}
                                        />
                                        <InputError message={errors.card_uid} />
                                    </div>
                                </div>
                                <div className="flex justify-end">
                                    <Button
                                        type="button"
                                        onClick={() => setActiveTab('employment')}
                                        disabled={!validatePersonalTab()}
                                    >
                                        {t('Next')}
                                    </Button>
                                </div>
                            </TabsContent>

                            <TabsContent value="employment" className="space-y-6 mt-6">
                                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                    <div>
                                        <Label htmlFor="user_id" required>{t('User')}</Label>
                                        <Select value={data.user_id?.toString() || ''} onValueChange={(value) => setData('user_id', value)} required>
                                            <SelectTrigger>
                                                <SelectValue placeholder={t('Select User')} />
                                            </SelectTrigger>
                                            <SelectContent searchable={true}>
                                                {users.map((item: any) => (
                                                    <SelectItem key={item.id} value={item.id.toString()}>
                                                        {item.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <p className="text-sm text-muted-foreground mt-1">{t('Note: Company users will be applicable for create employee.')}</p>
                                        <InputError message={errors.user_id} />
                                    </div>


                                    <div>
                                        <Label htmlFor="shift_id" required>{t('Shift')}</Label>
                                        <Select value={data.shift_id?.toString() || ''} onValueChange={(value) => setData('shift_id', value)} required>
                                            <SelectTrigger>
                                                <SelectValue placeholder={t('Select Shift')} />
                                            </SelectTrigger>
                                            <SelectContent searchable={true}>
                                                {shifts?.map((item: any) => (
                                                    <SelectItem key={item.id} value={item.id.toString()}>
                                                        {item.shift_name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <InputError message={errors.shift_id} />
                                    </div>



                                    <div>
                                        <Label>{t('Date Of Joining')}</Label>
                                        <DatePicker
                                            value={data.date_of_joining}
                                            onChange={(date) => setData('date_of_joining', date)}
                                            placeholder={t('Select Date Of Joining')}
                                            required
                                        />
                                        <InputError message={errors.date_of_joining} />
                                    </div>

                                    <div>
                                        <Label htmlFor="employment_type" required>{t('Employment Type')}</Label>
                                        <Select value={data.employment_type || 'Full Time'} onValueChange={(value) => setData('employment_type', value)} required>
                                            <SelectTrigger>
                                                <SelectValue placeholder={t('Select Employment Type')} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Full Time">{t('Full Time')}</SelectItem>
                                                <SelectItem value="Part Time">{t('Part Time')}</SelectItem>
                                                <SelectItem value="Temporary">{t('Temporary')}</SelectItem>
                                                <SelectItem value="Contract">{t('Contract')}</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <InputError message={errors.employment_type} />
                                    </div>


                                    <div>
                                        <Label htmlFor="branch_id" required>{t('Branch')}</Label>
                                        <Select
                                            value={data.branch_id?.toString() || ''}
                                            onValueChange={(value) => setData('branch_id', value)}
                                            disabled={!data.user_id}
                                            required
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder={data.user_id ? t('Select Branch') : t('Select User first')} />
                                            </SelectTrigger>
                                            <SelectContent searchable={true}>
                                                {filteredBranches?.map((item: any) => (
                                                    <SelectItem key={item.id} value={item.id.toString()}>
                                                        {item.branch_name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <InputError message={errors.branch_id} />
                                    </div>

                                    <div>
                                        <Label htmlFor="department_id" required>{t('Department')}</Label>
                                        <Select
                                            value={data.department_id?.toString() || ''}
                                            onValueChange={(value) => setData('department_id', value)}
                                            disabled={!data.branch_id}
                                            required
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder={data.branch_id ? t('Select Department') : t('Select Branch first')} />
                                            </SelectTrigger>
                                            <SelectContent searchable={true}>
                                                {filteredDepartments?.map((item: any) => (
                                                    <SelectItem key={item.id} value={item.id.toString()}>
                                                        {item.department_name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <InputError message={errors.department_id} />
                                    </div>

                                    <div>
                                        <Label htmlFor="designation_id" required>{t('Designation')}</Label>
                                        <Select
                                            value={data.designation_id?.toString() || ''}
                                            onValueChange={(value) => setData('designation_id', value)}
                                            disabled={!data.department_id}
                                            required
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder={data.department_id ? t('Select Designation') : t('Select Department first')} />
                                            </SelectTrigger>
                                            <SelectContent searchable={true}>
                                                {filteredDesignations?.map((item: any) => (
                                                    <SelectItem key={item.id} value={item.id.toString()}>
                                                        {item.designation_name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <InputError message={errors.designation_id} />
                                    </div>
                                </div>

                                <div className="flex justify-between">
                                    <Button type="button" variant="outline" onClick={() => setActiveTab('personal')}>
                                        {t('Previous')}
                                    </Button>
                                    <Button
                                        type="button"
                                        onClick={() => setActiveTab('contact')}
                                        disabled={!validateEmploymentTab()}
                                    >
                                        {t('Next')}
                                    </Button>
                                </div>
                            </TabsContent>

                            <TabsContent value="contact" className="space-y-6 mt-6">
                                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                    <div>
                                        <Label htmlFor="address_line_1">{t('Address Line 1')}</Label>
                                        <Input
                                            id="address_line_1"
                                            type="text"
                                            value={data.address_line_1}
                                            onChange={(e) => setData('address_line_1', e.target.value)}
                                            placeholder={t('Enter Address Line 1')}
                                            required
                                        />
                                        <InputError message={errors.address_line_1} />
                                    </div>

                                    <div>
                                        <Label htmlFor="address_line_2">{t('Address Line 2')}</Label>
                                        <Input
                                            id="address_line_2"
                                            type="text"
                                            value={data.address_line_2}
                                            onChange={(e) => setData('address_line_2', e.target.value)}
                                            placeholder={t('Enter Address Line 2')}
                                        />
                                        <InputError message={errors.address_line_2} />
                                    </div>

                                    <div>
                                        <Label htmlFor="city">{t('City')}</Label>
                                        <Input
                                            id="city"
                                            type="text"
                                            value={data.city}
                                            onChange={(e) => setData('city', e.target.value)}
                                            placeholder={t('Enter City')}
                                            required
                                        />
                                        <InputError message={errors.city} />
                                    </div>

                                    <div>
                                        <Label htmlFor="state">{t('State')}</Label>
                                        <Input
                                            id="state"
                                            type="text"
                                            value={data.state}
                                            onChange={(e) => setData('state', e.target.value)}
                                            placeholder={t('Enter State')}
                                            required
                                        />
                                        <InputError message={errors.state} />
                                    </div>

                                    <div>
                                        <Label htmlFor="country">{t('Country')}</Label>
                                        <Input
                                            id="country"
                                            type="text"
                                            value={data.country}
                                            onChange={(e) => setData('country', e.target.value)}
                                            placeholder={t('Enter Country')}
                                            required
                                        />
                                        <InputError message={errors.country} />
                                    </div>

                                    <div>
                                        <Label htmlFor="postal_code">{t('Postal Code')}</Label>
                                        <Input
                                            id="postal_code"
                                            type="text"
                                            value={data.postal_code}
                                            onChange={(e) => setData('postal_code', e.target.value)}
                                            placeholder={t('Enter Postal Code')}
                                            required
                                        />
                                        <InputError message={errors.postal_code} />
                                    </div>

                                    <div>
                                        <Label htmlFor="emergency_contact_name">{t('Emergency Contact Name')}</Label>
                                        <Input
                                            id="emergency_contact_name"
                                            type="text"
                                            value={data.emergency_contact_name}
                                            onChange={(e) => setData('emergency_contact_name', e.target.value)}
                                            placeholder={t('Enter Emergency Contact Name')}
                                            required
                                        />
                                        <InputError message={errors.emergency_contact_name} />
                                    </div>

                                    <div>
                                        <Label htmlFor="emergency_contact_relationship">{t('Emergency Contact Relationship')}</Label>
                                        <Input
                                            id="emergency_contact_relationship"
                                            type="text"
                                            value={data.emergency_contact_relationship}
                                            onChange={(e) => setData('emergency_contact_relationship', e.target.value)}
                                            placeholder={t('Enter Emergency Contact Relationship')}
                                            required
                                        />
                                        <InputError message={errors.emergency_contact_relationship} />
                                    </div>
                                </div>

                                <div>
                                    <PhoneInputComponent
                                        label={t('Emergency Contact Number')}
                                        value={data.emergency_contact_number}
                                        onChange={(value) => setData('emergency_contact_number', value || '')}
                                        error={errors.emergency_contact_number}
                                        required
                                    />
                                </div>

                                <div className="flex justify-between">
                                    <Button type="button" variant="outline" onClick={() => setActiveTab('employment')}>
                                        {t('Previous')}
                                    </Button>
                                    <Button
                                        type="button"
                                        onClick={() => setActiveTab('banking')}
                                        disabled={!validateContactTab()}
                                    >
                                        {t('Next')}
                                    </Button>
                                </div>
                            </TabsContent>

                            <TabsContent value="banking" className="space-y-6 mt-6">
                                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                    <div>
                                        <Label htmlFor="bank_name">{t('Bank Name')}</Label>
                                        <Input
                                            id="bank_name"
                                            type="text"
                                            value={data.bank_name}
                                            onChange={(e) => setData('bank_name', e.target.value)}
                                            placeholder={t('Enter Bank Name')}
                                            required
                                        />
                                        <InputError message={errors.bank_name} />
                                    </div>

                                    <div>
                                        <Label htmlFor="account_holder_name">{t('Account Holder Name')}</Label>
                                        <Input
                                            id="account_holder_name"
                                            type="text"
                                            value={data.account_holder_name}
                                            onChange={(e) => setData('account_holder_name', e.target.value)}
                                            placeholder={t('Enter Account Holder Name')}
                                            required
                                        />
                                        <InputError message={errors.account_holder_name} />
                                    </div>

                                    <div>
                                        <Label htmlFor="account_number">{t('Account Number')}</Label>
                                        <Input
                                            id="account_number"
                                            type="text"
                                            value={data.account_number}
                                            onChange={(e) => setData('account_number', e.target.value)}
                                            placeholder={t('Enter Account Number')}
                                            required
                                        />
                                        <InputError message={errors.account_number} />
                                    </div>

                                    <div>
                                        <Label htmlFor="bank_identifier_code">{t('Bank Identifier Code')}</Label>
                                        <Input
                                            id="bank_identifier_code"
                                            type="text"
                                            value={data.bank_identifier_code}
                                            onChange={(e) => setData('bank_identifier_code', e.target.value)}
                                            placeholder={t('Enter Bank Identifier Code')}
                                            required
                                        />
                                        <InputError message={errors.bank_identifier_code} />
                                    </div>

                                    <div>
                                        <Label htmlFor="bank_branch">{t('Bank Branch')}</Label>
                                        <Input
                                            id="bank_branch"
                                            type="text"
                                            value={data.bank_branch}
                                            onChange={(e) => setData('bank_branch', e.target.value)}
                                            placeholder={t('Enter Bank Branch')}
                                            required
                                        />
                                        <InputError message={errors.bank_branch} />
                                    </div>

                                    <div>
                                        <Label htmlFor="tax_payer_id">{t('Tax Payer Id')}</Label>
                                        <Input
                                            id="tax_payer_id"
                                            type="text"
                                            value={data.tax_payer_id}
                                            onChange={(e) => setData('tax_payer_id', e.target.value)}
                                            placeholder={t('Enter Tax Payer Id')}
                                        />
                                        <InputError message={errors.tax_payer_id} />
                                    </div>
                                </div>

                                <div className="flex justify-between">
                                    <Button type="button" variant="outline" onClick={() => setActiveTab('contact')}>
                                        {t('Previous')}
                                    </Button>
                                    <Button
                                        type="button"
                                        onClick={() => setActiveTab('hours')}
                                        disabled={!validateBankingTab()}
                                    >
                                        {t('Next')}
                                    </Button>
                                </div>
                            </TabsContent>

                            <TabsContent value="hours" className="space-y-6 mt-6">
                                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                                    <div>
                                        <Label htmlFor="basic_salary" required>{t('Basic Salary')}</Label>
                                        <Input
                                            id="basic_salary"
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={data.basic_salary}
                                            onChange={(e) => setData('basic_salary', e.target.value)}
                                            placeholder={t('Enter Basic Salary')}
                                            required
                                        />
                                        <InputError message={errors.basic_salary} />
                                    </div>

                                    <div>
                                        <Label htmlFor="hours_per_day" required>{t('Hours Per Day')}</Label>
                                        <Input
                                            id="hours_per_day"
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            max="24"
                                            value={data.hours_per_day}
                                            onChange={(e) => setData('hours_per_day', e.target.value)}
                                            placeholder={t('Enter Hours Per Day')}
                                            required
                                        />
                                        <InputError message={errors.hours_per_day} />
                                    </div>

                                    <div>
                                        <Label htmlFor="days_per_week" required>{t('Days Per Week')}</Label>
                                        <Input
                                            id="days_per_week"
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            max="7"
                                            value={data.days_per_week}
                                            onChange={(e) => setData('days_per_week', e.target.value)}
                                            placeholder={t('Enter Days Per Week')}
                                            required
                                        />
                                        <InputError message={errors.days_per_week} />
                                    </div>

                                    <div>
                                        <Label htmlFor="rate_per_hour" required>{t('Rate Per Hour')}</Label>
                                        <Input
                                            id="rate_per_hour"
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={data.rate_per_hour}
                                            onChange={(e) => setData('rate_per_hour', e.target.value)}
                                            placeholder={t('Enter Rate Per Hour')}
                                            required
                                        />
                                        <InputError message={errors.rate_per_hour} />
                                    </div>
                                </div>

                                <div className="flex justify-between">
                                    <Button type="button" variant="outline" onClick={() => setActiveTab('banking')}>
                                        {t('Previous')}
                                    </Button>
                                    <Button
                                        type="button"
                                        onClick={() => setActiveTab('documents')}
                                        disabled={!validateHoursTab()}
                                    >
                                        {t('Next')}
                                    </Button>
                                </div>
                            </TabsContent>

                            <TabsContent value="documents" className="space-y-6 mt-6">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-lg font-medium">{t('Employee Documents')}</h3>
                                    <Button type="button" onClick={addDocument} variant="outline">
                                        {t('Add Document')}
                                    </Button>
                                </div>

                                {data.documents.map((document: any, index: number) => (
                                    <Card key={index} className="p-4">
                                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                            <div>
                                                <Label required>{t('Document Type')}</Label>
                                                <Select
                                                    value={document.document_type_id?.toString() || ''}
                                                    onValueChange={(value) => updateDocument(index, 'document_type_id', value)}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder={t('Select Document Type')} />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {documentTypes?.map((type: any) => (
                                                            <SelectItem key={type.id} value={type.id.toString()}>
                                                                {type.document_name} {type.is_required && '*'}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <InputError message={errors[`documents.${index}.document_type_id`]} />
                                            </div>
                                            <div>
                                                <Label required>{t('Document File')}</Label>
                                                <Input
                                                    type="file"
                                                    onChange={(e) => {
                                                        const file = e.target.files?.[0];
                                                        updateDocument(index, 'file', file);
                                                    }}                                                    
                                                />
                                                {document.file && (
                                                    <p className="text-sm text-muted-foreground mt-1">
                                                        {document.file.name}
                                                    </p>
                                                )}
                                                <InputError message={errors[`documents.${index}.file`]} />
                                            </div>
                                        </div>
                                        <div className="flex justify-end mt-4">
                                            <Button
                                                type="button"
                                                variant="destructive"
                                                size="sm"
                                                onClick={() => removeDocument(index)}
                                            >
                                                <Trash2 className="h-4 w-4 mr-2" />
                                                {t('Remove')}
                                            </Button>
                                        </div>
                                    </Card>
                                ))}



                                <div className="flex justify-between">
                                    <Button type="button" variant="outline" onClick={() => setActiveTab('hours')}>
                                        {t('Previous')}
                                    </Button>
                                    <div className="flex gap-2">
                                        <Button type="button" variant="outline" onClick={() => window.history.back()}>
                                            {t('Cancel')}
                                        </Button>
                                        <Button type="submit" disabled={processing}>
                                            {processing ? t('Creating...') : t('Create')}
                                        </Button>
                                    </div>
                                </div>
                            </TabsContent>
                        </Tabs>
                    </form>
                </CardContent>
            </Card>
            )}
        </AuthenticatedLayout>
    );
}
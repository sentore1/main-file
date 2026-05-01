import { useState } from 'react';
import { Head, usePage } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { useDeleteHandler } from '@/hooks/useDeleteHandler';
import AuthenticatedLayout from "@/layouts/authenticated-layout";
import { Button } from '@/components/ui/button';
import { Card, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { Dialog } from "@/components/ui/dialog";
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { Plus, Edit, Trash2, DollarSign } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

import Create from './Create';
import Edit from './Edit';
import NoRecordsFound from '@/components/no-records-found';
import SystemSetupSidebar from "../SystemSetupSidebar";

interface EmployerContributionType {
    id: number;
    name: string;
}

interface EmployerContributionTypesIndexProps {
    employercontributiontypes: EmployerContributionType[];
    auth: any;
}

export default function Index() {
    const { t } = useTranslation();
    const { employercontributiontypes = [], auth } = usePage<EmployerContributionTypesIndexProps>().props;

    const [modalState, setModalState] = useState<{
        isOpen: boolean;
        mode: string;
        data: EmployerContributionType | null;
    }>({
        isOpen: false,
        mode: '',
        data: null
    });

    const { deleteState, openDeleteDialog, closeDeleteDialog, confirmDelete } = useDeleteHandler({
        routeName: 'hrm.employer-contribution-types.destroy',
        defaultMessage: t('Are you sure you want to delete this Employer Contribution Type?')
    });

    const openModal = (mode: 'add' | 'edit', data: EmployerContributionType | null = null) => {
        setModalState({ isOpen: true, mode, data });
    };

    const closeModal = () => {
        setModalState({ isOpen: false, mode: '', data: null });
    };

    const tableColumns = [
        {
            key: 'name',
            header: t('Name'),
            sortable: false
        },
        {
            key: 'actions',
            header: t('Action'),
            render: (_: any, type: EmployerContributionType) => (
                <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => openModal('edit', type)} className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700">
                        <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openDeleteDialog(type.id)}
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            )
        }
    ];

    return (
        <TooltipProvider>
            <AuthenticatedLayout
                breadcrumbs={[
                    { label: t('Hrm'), url: route('hrm.index') },
                    {label: t('System Setup')},
                    {label: t('Employer Contribution Types')}
                ]}
                pageTitle={t('System Setup')}
            >
                <Head title={t('Employer Contribution Types')} />

                <div className="flex flex-col md:flex-row gap-8">
                    <div className="md:w-64 flex-shrink-0">
                        <SystemSetupSidebar activeItem="employer-contribution-types" />
                    </div>

                    <div className="flex-1">
                        <Card className="shadow-sm">
                            <CardContent className="p-6">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-lg font-medium">{t('Employer Contribution Types')}</h3>
                                    <Tooltip delayDuration={0}>
                                        <TooltipTrigger asChild>
                                            <Button size="sm" onClick={() => openModal('add')}>
                                                <Plus className="h-4 w-4" />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>{t('Create')}</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </div>
                                <div className="overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100 max-h-[75vh] rounded-none w-full">
                                    <div className="min-w-[600px]">
                                        <DataTable
                                            data={employercontributiontypes}
                                            columns={tableColumns}
                                            className="rounded-none"
                                            emptyState={
                                                <NoRecordsFound
                                                    icon={DollarSign}
                                                    title={t('No Employer Contribution Types found')}
                                                    description={t('Get started by creating your first Employer Contribution Type.')}
                                                    onCreateClick={() => openModal('add')}
                                                    createButtonText={t('Create Employer Contribution Type')}
                                                    className="h-auto"
                                                />
                                            }
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                <Dialog open={modalState.isOpen} onOpenChange={closeModal}>
                    {modalState.mode === 'add' && (
                        <Create onSuccess={closeModal} />
                    )}
                    {modalState.mode === 'edit' && modalState.data && (
                        <Edit
                            employercontributiontype={modalState.data}
                            onSuccess={closeModal}
                        />
                    )}
                </Dialog>

                <ConfirmationDialog
                    open={deleteState.isOpen}
                    onOpenChange={closeDeleteDialog}
                    title={t('Delete Employer Contribution Type')}
                    message={deleteState.message}
                    confirmText={t('Delete')}
                    onConfirm={confirmDelete}
                    variant="destructive"
                />
            </AuthenticatedLayout>
        </TooltipProvider>
    );
}

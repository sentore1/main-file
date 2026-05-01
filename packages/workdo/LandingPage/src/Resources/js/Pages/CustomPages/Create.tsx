import { Head } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { useEffect } from 'react';
import AuthenticatedLayout from "@/layouts/authenticated-layout";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Save } from 'lucide-react';
import { useForm } from '@inertiajs/react';
import { RichTextEditor } from '@/components/ui/rich-text-editor';

export default function Create() {
    const { t } = useTranslation();
    
    const { data, setData, post, processing, errors } = useForm({
        title: '',
        slug: '',
        content: '',
        meta_title: '',
        meta_description: '',
        is_active: true
    });

    // Auto-generate slug from title
    useEffect(() => {
        if (data.title && !data.slug) {
            const slug = data.title
                .toLowerCase()
                .replace(/[^a-z0-9\s-]/g, '')
                .replace(/\s+/g, '-')
                .replace(/-+/g, '-')
                .trim();
            setData('slug', slug);
        }
    }, [data.title]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('custom-pages.store'), {
            onSuccess: () => {
                // Success handled by redirect
            },
            onError: () => {
                // Scroll to first error
                const firstError = document.querySelector('.text-red-600');
                if (firstError) {
                    firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }
        });
    };

    return (
        <AuthenticatedLayout
            breadcrumbs={[
                { label: t('Custom Pages'), url: route('custom-pages.index') },
                { label: t('Create Page') }
            ]}
            pageTitle={t('Create Custom Page')}
            pageActions={
                <Button 
                    onClick={handleSubmit}
                    disabled={processing}
                    className="text-white"
                    style={{ backgroundColor: 'hsl(var(--primary))' }}
                >
                    <Save className="h-4 w-4 mr-2" />
                    {processing ? t('Saving...') : t('Save Page')}
                </Button>
            }
        >
            <Head title={t('Create Custom Page')} />
            
            <form onSubmit={handleSubmit} className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>{t('Page Details')}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="title">{t('Page Title')}</Label>
                                <Input
                                    id="title"
                                    value={data.title}
                                    onChange={(e) => setData('title', e.target.value)}
                                    placeholder={t('Enter page title (e.g., About Us, Privacy Policy)')}
                                    error={errors.title}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="slug">{t('URL Slug')}</Label>
                                <Input
                                    id="slug"
                                    value={data.slug}
                                    onChange={(e) => setData('slug', e.target.value)}
                                    placeholder={t('URL-friendly name (e.g., about-us, privacy-policy)')}
                                    error={errors.slug}
                                />
                                <p className="text-xs text-gray-500">{t('Auto-generated from title. You can customize it.')}</p>
                            </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                            <Switch
                                id="is_active"
                                checked={data.is_active}
                                onCheckedChange={(checked) => setData('is_active', checked)}
                            />
                            <Label htmlFor="is_active">{t('Active')}</Label>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>{t('Page Content')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            <Label>{t('Page Content')}</Label>
                            <RichTextEditor
                                content={data.content}
                                onChange={(value) => setData('content', value)}
                                placeholder={t('Write your page content here. You can use rich text formatting, add images, links, and more.')}
                                required
                            />
                            {errors.content && <p className="text-sm text-red-600 mt-1">{errors.content}</p>}
                            <p className="text-xs text-gray-500">{t('Use the toolbar above to format your content with headings, lists, links, and images.')}</p>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>{t('SEO Settings')}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="meta_title">{t('Meta Title')}</Label>
                            <Input
                                id="meta_title"
                                value={data.meta_title}
                                onChange={(e) => setData('meta_title', e.target.value)}
                                placeholder={t('SEO title for search engines (50-60 characters)')}
                                error={errors.meta_title}
                                maxLength={60}
                            />
                            <p className="text-xs text-gray-500">{data.meta_title.length}/60 {t('characters')}</p>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="meta_description">{t('Meta Description')}</Label>
                            <Input
                                id="meta_description"
                                value={data.meta_description}
                                onChange={(e) => setData('meta_description', e.target.value)}
                                placeholder={t('Brief description for search results (150-160 characters)')}
                                error={errors.meta_description}
                                maxLength={160}
                            />
                            <p className="text-xs text-gray-500">{data.meta_description.length}/160 {t('characters')}</p>
                        </div>
                    </CardContent>
                </Card>
            </form>
        </AuthenticatedLayout>
    );
}
<?php

namespace Workdo\LandingPage\Database\Seeders;

use Illuminate\Database\Seeder;
use Workdo\LandingPage\Models\LandingPageSetting;
use Illuminate\Support\Facades\Log;

class LandingPageSettingSeeder extends Seeder
{
    public function run()
    {
        if (LandingPageSetting::exists()) {
            return;
        }

        try {
            LandingPageSetting::create($this->getDefaultSettings());
        } catch (\Exception $e) {
            Log::error('Failed to seed landing page settings: ' . $e->getMessage());
            throw $e;
        }
    }

    private function getDefaultSettings(): array
    {
        return [
            'company_name' => 'ERPGo',
            'contact_email' => 'support@erpgo.com',
            'contact_phone' => '+1 (555) 123-4567',
            'contact_address' => '123 Business Ave, City, State 12345',
            'config_sections' => $this->getDefaultConfigSections()
        ];
    }

    private function getDefaultConfigSections(): array
    {
        return [
            'sections' => $this->getDefaultSections(),
            'section_visibility' => $this->getDefaultVisibility(),
            'section_order' => $this->getDefaultOrder(),
            'colors' => $this->getDefaultColors()
        ];
    }

    private function getDefaultSections(): array
    {
        return [
            'hero' => [
                'variant' => 'hero1',
                'title' => 'The Complete ERP Solution for Your Business',
                'subtitle' => 'Streamline your entire business operation, from finance to HR, with ERPGo. A powerful, self-hosted platform designed for your unique needs.',
                'primary_button_text' => 'Login',
                'primary_button_link' => route('login'),
                'secondary_button_text' => 'Contact Us',
                'secondary_button_link' => '#contact',
                'highlight_text' => 'ERPGo',
                'image' => 'packages/workdo/LandingPage/src/Resources/assets/img/hero.png'
            ],
            'header' => [
                'variant' => 'header1',
                'company_name' => 'ERPGo',
                'cta_text' => 'Login',
                'enable_pricing_link' => false,
                'navigation_items' => [
                    ['text' => 'Home', 'href' => route('landing.page')]
                ]
            ],
            'stats' => [
                'variant' => 'stats1',
                'stats' => [
                    ['label' => 'Businesses Trust Us', 'value' => '10,000+'],
                    ['label' => 'Uptime Guarantee', 'value' => '99.9%'],
                    ['label' => 'Customer Support', 'value' => '24/7'],
                    ['label' => 'Countries Worldwide', 'value' => '50+']
                ]
            ],
            'features' => [
                'variant' => 'features1',
                'title' => 'Powerful Features',
                'subtitle' => 'Everything your business needs in one integrated platform',
                'features' => $this->getDefaultFeatures()
            ],
            'modules' => [
                'variant' => 'modules1',
                'title' => 'Complete Business Modules',
                'subtitle' => 'Deploy our comprehensive modules to streamline every aspect of your daily operations',
                'modules' => [
                    [
                        'key' => 'hrm',
                        'label' => 'Human Resources',
                        'title' => 'HRM System',
                        'description' => 'Transform your human resource operations with a comprehensive suite for the entire employee lifecycle. Efficiently manage recruitment, onboarding, attendance, and payroll processing while ensuring compliance. foster a positive workplace culture with performance tracking and self-service portals that empower your workforce to thrive.',
                        'image' => 'packages/workdo/LandingPage/src/Resources/assets/img/hrm.png'
                    ],
                    [
                        'key' => 'account',
                        'label' => 'Accounting & Finance',
                        'title' => 'Accounting System',
                        'description' => 'Take command of your financial data with an advanced double-entry accounting system designed for accuracy and speed. Automate complex billing cycles, reconcile bank transactions in seconds, and generate insightful financial reports that give you a clear picture of your profitability. Securely manage assets, liabilities, and equity with enterprise-grade precision.',
                        'image' => 'packages/workdo/LandingPage/src/Resources/assets/img/accounting.png'
                    ],
                    [
                        'key' => 'taskly',
                        'label' => 'Project Management',
                        'title' => 'Task & Project System',
                        'description' => 'Deliver projects on time and within budget using our robust project management tools. Visualize workflows with interactive Kanban boards and Gantt charts, enabling seamless collaboration among teams. Track milestones, allocate resources effectively, and monitor productivity in real-time to ensure every project is a success story.',
                        'image' => 'packages/workdo/LandingPage/src/Resources/assets/img/project.png'
                    ],
                    [
                        'key' => 'crm',
                        'label' => 'CRM & Sales',
                        'title' => 'CRM System',
                        'description' => 'Supercharge your sales engine with a customer relationship management (CRM) system that turns leads into loyal clients. Track every interaction, manage sales pipelines with drag-and-drop ease, and automate follow-ups to never miss an opportunity. Analyze customer behavior to tailor your strategies and close deals faster than ever before.',
                        'image' => 'packages/workdo/LandingPage/src/Resources/assets/img/crm.png'
                    ],
                    [
                        'key' => 'pos',
                        'label' => 'Point of Sale',
                        'title' => 'POS System',
                        'description' => 'Revolutionize your retail operations with a lightning-fast Point of Sale (POS) system that keeps your business moving. synchronize inventory across multiple warehouses in real-time, process transactions securely, and manage customer loyalty programs effortlessly. From the checkout counter to the back office, ensure smooth, error-free operations.',
                        'image' => 'packages/workdo/LandingPage/src/Resources/assets/img/pos.png'
                    ]
                ]
            ],
            'benefits' => [
                'variant' => 'benefits1',
                'title' => 'Why Choose ERPGo?',
                'benefits' => [
                    ['title' => 'Centralized Business Hub', 'description' => 'Eliminate data silos. Our integrated modules for HRM, Accounting, CRM, Projects, and POS work together to provide a single source of truth for your business.'],
                    ['title' => 'Efficient Workforce Management', 'description' => 'Streamline your team management. Handle recruitment, attendance, and payroll ensuring compliance and empowering your staff with self-service tools.'],
                    ['title' => 'Financial Clarity & Precision', 'description' => 'Gain absolute control over finances. Automate billing, reconcile transactions, and view enterprise-grade reports for a clear picture of your financial health.'],
                    ['title' => 'Streamlined Project Execution', 'description' => 'Execute projects with precision. Use Kanban boards and Gantt charts to track progress, allocate resources, and ensure timely delivery of your internal goals.'],
                    ['title' => 'Growth-Oriented Sales Tools', 'description' => 'Accelerate revenue growth. Manage detailed customer profiles, track sales pipelines, and optimize retail operations to maximize your business potential.'],
                    ['title' => 'Actionable Insights', 'description' => 'Make data-driven decisions. Access real-time reports across all departments to visualize performance trends and drive strategic improvements.']
                ]
            ],
            'gallery' => [
                'variant' => 'gallery1',
                'title' => 'See ERPGo in Action',
                'subtitle' => 'Experience the intuitive interface designed to optimize your business workflows from day one',
                'images' => [
                    'packages/workdo/LandingPage/src/Resources/assets/img/gallery1.jpeg',
                    'packages/workdo/LandingPage/src/Resources/assets/img/gallery2.jpeg',
                    'packages/workdo/LandingPage/src/Resources/assets/img/gallery3.jpeg',
                    'packages/workdo/LandingPage/src/Resources/assets/img/gallery4.jpeg',
                    'packages/workdo/LandingPage/src/Resources/assets/img/gallery5.jpeg',
                    'packages/workdo/LandingPage/src/Resources/assets/img/gallery6.jpeg',
                    'packages/workdo/LandingPage/src/Resources/assets/img/gallery7.jpeg'
                ]
            ],
            'cta' => [
                'variant' => 'cta1',
                'title' => 'Ready to Transform Your Business?',
                'subtitle' => 'Join thousands of businesses already using ERPGo to streamline their operations.',
                'primary_button' => 'Login',
                'secondary_button' => 'Contact Us'
            ],
            'pricing' => [
                'title' => 'Flexible Pricing Plans',
                'subtitle' => 'Choose the perfect subscription plan for your business needs',
                'default_subscription_type' => 'pre-package',
                'default_price_type' => 'monthly',
                'show_pre_package' => true,
                'show_monthly_yearly_toggle' => true,
                'empty_message' => 'No plans available. Check back later for new pricing plans.'
            ],
            'footer' => [
                'variant' => 'footer1',
                'description' => 'The complete business management solution for modern enterprises.',
                'email' => 'support@erpgo.com',
                'phone' => '+1 (555) 123-4567',
                'newsletter_title' => 'Join Our Community',
                'newsletter_description' => 'Subscribe to our newsletter for the latest business insights and updates.',
                'newsletter_button_text' => 'Subscribe',
                'copyright_text' => '',
                'navigation_sections' => [
                    [
                        'title' => 'Product',
                        'links' => [
                            ['text' => 'Features', 'href' => '#features'],
                            ['text' => 'Demo', 'href' => '#demo']
                        ]
                    ],
                    [
                        'title' => 'Company',
                        'links' => [
                            ['text' => 'About', 'href' => '#about'],
                            ['text' => 'Contact', 'href' => '#contact'],
                            ['text' => 'Support', 'href' => '#support']
                        ]
                    ]
                ]
            ]
        ];
    }

    private function getDefaultFeatures(): array
    {
        return [
            ['title' => 'ERP System', 'description' => 'Streamline resources and operations with comprehensive enterprise resource planning.', 'icon' => 'Building2'],
            ['title' => 'Accounting System', 'description' => 'Manage finances with ease and accuracy through automated accounting tools.', 'icon' => 'Calculator'],
            ['title' => 'CRM System', 'description' => 'Strengthen customer relationships and improve sales with powerful CRM tools.', 'icon' => 'Users'],
            ['title' => 'POS System', 'description' => 'Fast and reliable point-of-sale solution for retail and service businesses.', 'icon' => 'CreditCard'],
            ['title' => 'HRM System', 'description' => 'Simplify employee management and payroll with integrated HR tools.', 'icon' => 'UserCheck'],
            ['title' => 'Project System', 'description' => 'Organize and track projects efficiently with comprehensive project management.', 'icon' => 'FolderOpen']
        ];
    }

    private function getDefaultVisibility(): array
    {
        return [
            'header' => true,
            'hero' => true,
            'stats' => true,
            'features' => true,
            'modules' => true,
            'benefits' => true,
            'gallery' => true,
            'cta' => true,
            'footer' => true,
            'pricing' => false
        ];
    }

    private function getDefaultOrder(): array
    {
        return ['header', 'hero', 'stats', 'features', 'modules', 'benefits', 'gallery', 'cta', 'footer'];
    }

    private function getDefaultColors(): array
    {
        return [
            'primary' => '#10b77f',
            'secondary' => '#059669',
            'accent' => '#065f46'
        ];
    }
}
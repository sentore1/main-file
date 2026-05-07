<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "=== Debugging Logo Settings ===\n\n";

$settings = getCompanyAllSetting();

echo "Available logo settings:\n";
echo "------------------------\n";

if (isset($settings['logo_dark'])) {
    echo "logo_dark: " . $settings['logo_dark'] . "\n";
    echo "  Full URL: " . url('storage/' . ltrim($settings['logo_dark'], '/')) . "\n\n";
}

if (isset($settings['logo_light'])) {
    echo "logo_light: " . $settings['logo_light'] . "\n";
    echo "  Full URL: " . url('storage/' . ltrim($settings['logo_light'], '/')) . "\n\n";
}

if (isset($settings['company_logo'])) {
    echo "company_logo: " . $settings['company_logo'] . "\n";
    echo "  Full URL: " . url('storage/' . ltrim($settings['company_logo'], '/')) . "\n\n";
}

// Check which one would be used
$logoSetting = $settings['logo_dark'] ?? $settings['logo_light'] ?? $settings['company_logo'] ?? null;

if ($logoSetting) {
    echo "Selected logo: $logoSetting\n";
    $logoPath = ltrim($logoSetting, '/');
    $fullUrl = url('storage/' . $logoPath);
    echo "Full URL that will be used: $fullUrl\n\n";
    
    // Check if file exists
    $filePath = storage_path('app/public/' . $logoPath);
    echo "File path: $filePath\n";
    echo "File exists: " . (file_exists($filePath) ? 'YES' : 'NO') . "\n";
    
    if (file_exists($filePath)) {
        echo "File size: " . filesize($filePath) . " bytes\n";
    }
} else {
    echo "No logo setting found!\n";
}

echo "\n=== Test in browser ===\n";
if ($logoSetting) {
    echo "Visit this URL to test if logo loads:\n";
    echo url('storage/' . ltrim($logoSetting, '/')) . "\n";
}

<?php
// Run this from the project root: php debug-debit-notes.php
require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);
$app->boot();

echo "=== Testing DebitNoteController ===\n";

try {
    $controller = $app->make(\Workdo\Account\Http\Controllers\DebitNoteController::class);
    echo "✓ DebitNoteController instantiated OK\n";
} catch (\Throwable $e) {
    echo "✗ DebitNoteController FAILED: " . $e->getMessage() . "\n";
    echo "  File: " . $e->getFile() . ":" . $e->getLine() . "\n";
}

echo "\n=== Testing Models ===\n";

$models = [
    \Workdo\Account\Models\DebitNote::class,
    \App\Models\PurchaseReturn::class,
    \Workdo\Account\Services\JournalService::class,
];

foreach ($models as $class) {
    try {
        $ref = new ReflectionClass($class);
        echo "✓ $class OK\n";
    } catch (\Throwable $e) {
        echo "✗ $class FAILED: " . $e->getMessage() . "\n";
    }
}

echo "\n=== Testing DB Query ===\n";
try {
    $count = \Workdo\Account\Models\DebitNote::count();
    echo "✓ DebitNote::count() = $count\n";
} catch (\Throwable $e) {
    echo "✗ DB Query FAILED: " . $e->getMessage() . "\n";
}

echo "\n=== Testing Eager Loads ===\n";
try {
    $notes = \Workdo\Account\Models\DebitNote::with(['vendor', 'purchaseReturn', 'approvedBy'])->limit(1)->get();
    echo "✓ Eager load OK, got " . $notes->count() . " records\n";
} catch (\Throwable $e) {
    echo "✗ Eager load FAILED: " . $e->getMessage() . "\n";
    echo "  File: " . $e->getFile() . ":" . $e->getLine() . "\n";
}

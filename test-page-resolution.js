// Test script to simulate how Inertia resolves StockRequisition pages
// Run this in browser console on the stock-requisitions page

console.log('=== Testing Page Resolution ===');

// Simulate the resolver logic from resources/js/app.tsx
const testPageName = 'StockRequisition/StockRequisitions/Index';

console.log('1. Testing page name:', testPageName);

// Split the name
const [packageName, ...pagePath] = testPageName.split('/');
console.log('2. Package name:', packageName);
console.log('3. Page path:', pagePath.join('/'));

// Build the expected path
const expectedPath = `../../packages/workdo/${packageName}/src/Resources/js/Pages/${pagePath.join('/')}.tsx`;
console.log('4. Expected file path:', expectedPath);

// Check if window.page exists (Inertia props)
if (window.page) {
    console.log('5. ✓ Inertia page props exist');
    console.log('   Component:', window.page.component);
    console.log('   Props keys:', Object.keys(window.page.props || {}));
} else {
    console.log('5. ✗ Inertia page props missing');
}

// Check if app div exists
const appDiv = document.getElementById('app');
if (appDiv) {
    console.log('6. ✓ App div exists');
    console.log('   Has data-page:', appDiv.hasAttribute('data-page'));
    if (appDiv.hasAttribute('data-page')) {
        try {
            const pageData = JSON.parse(appDiv.getAttribute('data-page'));
            console.log('   Page component:', pageData.component);
        } catch (e) {
            console.log('   Error parsing data-page:', e.message);
        }
    }
} else {
    console.log('6. ✗ App div missing - THIS IS THE PROBLEM!');
}

console.log('=== Test Complete ===');

// Node.js script to validate the test page
const http = require('http');
const fs = require('fs');

function validateTestPage() {
    console.log('🧪 Testing Google Maps Autocomplete Implementation');
    console.log('📍 Test page created: test-autocomplete.html');
    console.log('🌐 Please open: http://localhost:3001/test-autocomplete.html');
    console.log('');
    console.log('✅ Expected behavior:');
    console.log('  1. Page loads without errors');
    console.log('  2. Status shows "Google Maps API loaded"');
    console.log('  3. Status shows either "Using new PlaceAutocompleteElement" or "Using legacy Autocomplete"');
    console.log('  4. Input field shows placeholder text');
    console.log('  5. Typing shows autocomplete suggestions');
    console.log('  6. Selecting a suggestion:');
    console.log('     - Shows "Place selected" in status');
    console.log('     - Updates map with marker');
    console.log('     - Shows location details in results section');
    console.log('');
    console.log('🔍 Test steps:');
    console.log('  1. Type "Sydney Opera House" in the search box');
    console.log('  2. Select from dropdown suggestions');
    console.log('  3. Verify map shows marker in Sydney');
    console.log('  4. Check that all status messages are green/blue (no red errors)');
    console.log('');
    
    // Check if our main app is running
    const options = {
        hostname: 'localhost',
        port: 3001,
        path: '/calendar',
        method: 'GET',
        timeout: 5000
    };
    
    const req = http.request(options, (res) => {
        if (res.statusCode === 200) {
            console.log('✅ Main app is running on localhost:3001');
            console.log('🔗 Test the fixed LocationPicker at: http://localhost:3001/calendar');
            console.log('   - Click the "+" button to create an event');
            console.log('   - Try the location search field');
        } else {
            console.log('⚠️  Main app returned status:', res.statusCode);
        }
    });
    
    req.on('error', (e) => {
        console.log('❌ Main app not accessible:', e.message);
        console.log('💡 Make sure "npm run dev" is running');
    });
    
    req.on('timeout', () => {
        console.log('⏱️  Request timed out - app might be starting up');
    });
    
    req.end();
}

validateTestPage();
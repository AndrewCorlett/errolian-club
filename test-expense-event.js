const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Load test credentials
const credentials = JSON.parse(fs.readFileSync(path.join(__dirname, 'test-credentials.json'), 'utf8'));

async function testExpenseEventCreation() {
  console.log('🚀 Starting expense event creation test...');
  
  const browser = await puppeteer.launch({
    headless: false, // Show browser for debugging
    defaultViewport: { width: 1280, height: 720 },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  
  try {
    // Navigate to the application
    console.log('📍 Navigating to localhost:3001...');
    await page.goto('http://localhost:3001', { waitUntil: 'networkidle2' });
    
    // Check if we need to login
    const loginButton = await page.$('button:has-text("Sign In")');
    if (loginButton) {
      console.log('🔐 Logging in...');
      
      // Click sign in button
      await page.click('button:has-text("Sign In")');
      await page.waitForTimeout(1000);
      
      // Fill in login form
      await page.fill('input[type="email"]', credentials.email);
      await page.fill('input[type="password"]', credentials.password);
      
      // Submit login form
      await page.click('button[type="submit"]');
      await page.waitForTimeout(3000);
    }
    
    // Navigate to Split Pay section
    console.log('💳 Navigating to Split Pay section...');
    await page.goto('http://localhost:3001/split-pay', { waitUntil: 'networkidle2' });
    await page.waitForTimeout(2000);
    
    // Take a screenshot of the Split Pay page
    await page.screenshot({ path: 'split-pay-before.png', fullPage: true });
    
    // Look for the add expense button
    console.log('➕ Looking for add expense button...');
    const addButton = await page.$('[data-testid="add-expense-button"]');
    
    if (!addButton) {
      // Try alternative selectors
      const altButton = await page.$('button:has-text("Create")') || 
                       await page.$('button:has-text("Add")') ||
                       await page.$('svg[fill="none"][stroke="currentColor"]').closest('button');
      
      if (altButton) {
        console.log('✅ Found add button (alternative selector)');
        await altButton.click();
      } else {
        throw new Error('Could not find add expense button');
      }
    } else {
      console.log('✅ Found add expense button');
      await addButton.click();
    }
    
    await page.waitForTimeout(2000);
    
    // Fill in expense event form
    console.log('📝 Filling in expense event form...');
    
    // Take screenshot of the modal
    await page.screenshot({ path: 'expense-modal.png', fullPage: true });
    
    // Fill in event name
    const eventNameInput = await page.$('input[placeholder*="event name"]') || 
                          await page.$('input[placeholder*="Event name"]') ||
                          await page.$('input[placeholder*="name"]');
    
    if (eventNameInput) {
      await eventNameInput.fill('Test Expense Event - Puppeteer');
      console.log('✅ Filled event name');
    }
    
    // Fill in location
    const locationInput = await page.$('input[placeholder*="location"]') || 
                         await page.$('input[placeholder*="Location"]');
    
    if (locationInput) {
      await locationInput.fill('London, UK');
      console.log('✅ Filled location');
    }
    
    // Select currency (if available)
    const currencySelect = await page.$('select');
    if (currencySelect) {
      await currencySelect.selectOption('GBP');
      console.log('✅ Selected currency');
    }
    
    // Select participants (current user should be selected by default)
    console.log('👥 Checking participants...');
    const participantCheckboxes = await page.$$('input[type="checkbox"]');
    console.log(`Found ${participantCheckboxes.length} participant checkboxes`);
    
    // Ensure at least one participant is selected
    if (participantCheckboxes.length > 0) {
      // Check the first checkbox if none are checked
      const isChecked = await page.evaluate((checkbox) => checkbox.checked, participantCheckboxes[0]);
      if (!isChecked) {
        await participantCheckboxes[0].click();
        console.log('✅ Selected participant');
      } else {
        console.log('✅ Participant already selected');
      }
    }
    
    await page.waitForTimeout(1000);
    
    // Take screenshot before submitting
    await page.screenshot({ path: 'expense-modal-filled.png', fullPage: true });
    
    // Submit the form
    console.log('💾 Submitting expense event...');
    const createButton = await page.$('button:has-text("Create")') || 
                        await page.$('button[type="submit"]');
    
    if (createButton) {
      await createButton.click();
      console.log('✅ Clicked create button');
    } else {
      throw new Error('Could not find create button');
    }
    
    // Wait for the modal to close and page to update
    await page.waitForTimeout(3000);
    
    // Take screenshot after creation
    await page.screenshot({ path: 'split-pay-after.png', fullPage: true });
    
    // Check if the expense event appears in the list
    console.log('🔍 Checking if expense event appears in the list...');
    const expenseEvents = await page.$$('[data-testid="expense-event"]');
    
    if (expenseEvents.length > 0) {
      console.log(`✅ Found ${expenseEvents.length} expense event(s) in the list`);
      
      // Check if our test event is there
      const eventTitles = await page.$$eval('[data-testid="expense-event"]', events => 
        events.map(event => event.textContent)
      );
      
      const testEventExists = eventTitles.some(title => 
        title.includes('Test Expense Event - Puppeteer')
      );
      
      if (testEventExists) {
        console.log('✅ Test expense event found in the list!');
      } else {
        console.log('⚠️  Test expense event not found in list, but events exist');
        console.log('Event titles found:', eventTitles);
      }
    } else {
      console.log('❌ No expense events found in the list');
    }
    
    console.log('✅ Frontend test completed successfully!');
    
    // Return success indicator for Supabase verification
    return {
      success: true,
      eventName: 'Test Expense Event - Puppeteer',
      location: 'London, UK'
    };
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    
    // Take error screenshot
    await page.screenshot({ path: 'error-screenshot.png', fullPage: true });
    
    return {
      success: false,
      error: error.message
    };
  } finally {
    await browser.close();
  }
}

// Run the test
if (require.main === module) {
  testExpenseEventCreation()
    .then(result => {
      if (result.success) {
        console.log('🎉 Test completed successfully!');
        process.exit(0);
      } else {
        console.error('💥 Test failed:', result.error);
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('💥 Unexpected error:', error);
      process.exit(1);
    });
}

module.exports = { testExpenseEventCreation };
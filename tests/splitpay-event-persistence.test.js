const puppeteer = require('puppeteer');

describe('Split Pay Event Persistence Tests', () => {
  let browser;
  let page;
  
  beforeAll(async () => {
    browser = await puppeteer.launch({
      headless: false, // Set to true for CI
      defaultViewport: { width: 400, height: 800 }
    });
  });

  afterAll(async () => {
    await browser.close();
  });

  beforeEach(async () => {
    page = await browser.newPage();
    
    // Set up console error logging
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.error('Console Error:', msg.text());
      }
    });
    
    page.on('pageerror', error => {
      console.error('Page Error:', error.message);
    });
  });

  afterEach(async () => {
    await page.close();
  });

  test('Create event, edit settings, and verify persistence', async () => {
    // Navigate to Split Pay page
    await page.goto('http://localhost:3002/split-pay', { waitUntil: 'networkidle0' });
    
    // Wait for page to load
    await page.waitForSelector('[data-testid="add-expense-button"]', { timeout: 10000 });
    
    // Step 1: Create a new expense event
    console.log('Step 1: Creating new expense event...');
    await page.click('[data-testid="add-expense-button"]');
    
    // Wait for modal to appear
    await page.waitForSelector('input[placeholder="E.g. Dinner in Glasgow"]', { visible: true });
    
    // Fill in event details
    const eventName = `Test Event ${Date.now()}`;
    await page.type('input[placeholder="E.g. Dinner in Glasgow"]', eventName);
    await page.type('input[placeholder="E.g. Glasgow, Scotland"]', 'Test Location');
    
    // Select currency
    await page.select('select', 'GBP');
    
    // Toggle some participants
    const participantToggles = await page.$$('.space-y-2 > div');
    if (participantToggles.length > 1) {
      // Toggle off the second participant
      await participantToggles[1].click();
      await page.waitForTimeout(300);
    }
    
    // Create the event
    await page.click('button:has-text("Create")');
    await page.waitForTimeout(2000);
    
    // Look for the created event
    await page.waitForSelector('[data-testid="expense-event"]', { timeout: 10000 });
    
    // Click into the event
    const eventElements = await page.$$('[data-testid="expense-event"]');
    let targetEvent = null;
    
    for (const element of eventElements) {
      const text = await element.evaluate(el => el.textContent);
      if (text.includes(eventName)) {
        targetEvent = element;
        break;
      }
    }
    
    if (!targetEvent) {
      throw new Error('Created event not found');
    }
    
    await targetEvent.click();
    await page.waitForTimeout(1000);
    
    // Step 2: Edit event settings
    console.log('Step 2: Editing event settings...');
    
    // Click three-dot menu
    await page.waitForSelector('button[aria-label="Event menu"]', { visible: true });
    await page.click('button[aria-label="Event menu"]');
    
    // Wait for dropdown and click Event Settings
    await page.waitForSelector('button:has-text("Event Settings")', { visible: true });
    await page.click('button:has-text("Event Settings")');
    
    // Wait for settings modal
    await page.waitForSelector('h2:has-text("Event Settings")', { visible: true });
    await page.waitForTimeout(500);
    
    // Edit event name
    const newEventName = `${eventName} - Edited`;
    const nameInput = await page.$('input[value*="Test Event"]');
    if (nameInput) {
      await nameInput.click({ clickCount: 3 }); // Select all
      await nameInput.type(newEventName);
    }
    
    // Toggle more participants
    const settingsParticipants = await page.$$('.space-y-2 > div');
    if (settingsParticipants.length > 2) {
      // Toggle on the third participant
      await settingsParticipants[2].click();
      await page.waitForTimeout(300);
    }
    
    // Save settings
    await page.click('button:has-text("Save")');
    await page.waitForTimeout(2000);
    
    // Step 3: Verify event name persisted
    console.log('Step 3: Verifying event name persistence...');
    await page.waitForSelector('h1', { visible: true });
    const headerText = await page.$eval('h1', el => el.textContent);
    
    if (!headerText.includes(newEventName)) {
      console.error(`Expected header to contain "${newEventName}", but got "${headerText}"`);
    }
    
    // Step 4: Add an expense
    console.log('Step 4: Adding an expense...');
    await page.click('[data-testid="add-expense-button"]');
    
    // Wait for add expense modal
    await page.waitForSelector('h2:has-text("Add Expense")', { visible: true });
    await page.waitForTimeout(500);
    
    // Fill expense details
    await page.type('input[placeholder="E.g. Drinks"]', 'Test Expense');
    await page.type('input[placeholder="0.00"]', '100');
    
    // Check if paid by dropdown is visible
    const paidBySelect = await page.$('select');
    if (paidBySelect) {
      const isVisible = await paidBySelect.evaluate(el => {
        const rect = el.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
      });
      
      if (!isVisible) {
        console.error('Paid By dropdown is not visible - possible z-index issue');
      }
    }
    
    // Check split participants
    const expenseParticipants = await page.$$('.space-y-3 > div');
    console.log(`Found ${expenseParticipants.length} participants in expense split`);
    
    // Submit expense
    await page.click('button:has-text("Add")');
    await page.waitForTimeout(2000);
    
    // Step 5: Hard refresh and verify persistence
    console.log('Step 5: Hard refreshing to verify persistence...');
    await page.reload({ waitUntil: 'networkidle0' });
    await page.waitForTimeout(2000);
    
    // Verify event name still shows edited version
    const refreshedHeader = await page.$eval('h1', el => el.textContent);
    if (!refreshedHeader.includes(newEventName)) {
      throw new Error(`Event name did not persist after refresh. Expected "${newEventName}", got "${refreshedHeader}"`);
    }
    
    // Verify expense exists
    await page.waitForSelector('[data-testid="expense-item"]', { timeout: 10000 });
    const expenseItems = await page.$$('[data-testid="expense-item"]');
    
    let foundTestExpense = false;
    for (const item of expenseItems) {
      const text = await item.evaluate(el => el.textContent);
      if (text.includes('Test Expense')) {
        foundTestExpense = true;
        break;
      }
    }
    
    if (!foundTestExpense) {
      throw new Error('Test expense not found after refresh');
    }
    
    console.log('✅ All tests passed successfully!');
  }, 60000); // 60 second timeout

  test('Verify z-index issues are fixed', async () => {
    // Navigate to an existing event
    await page.goto('http://localhost:3002/split-pay', { waitUntil: 'networkidle0' });
    
    // Wait for events to load
    await page.waitForSelector('[data-testid="expense-event"]', { timeout: 10000 });
    
    // Click first event
    await page.click('[data-testid="expense-event"]:first-child');
    await page.waitForTimeout(1000);
    
    // Open add expense modal
    await page.click('[data-testid="add-expense-button"]');
    await page.waitForSelector('h2:has-text("Add Expense")', { visible: true });
    
    // Check all form elements are visible and clickable
    const elements = {
      titleInput: await page.$('input[placeholder="E.g. Drinks"]'),
      amountInput: await page.$('input[placeholder="0.00"]'),
      paidBySelect: await page.$('select'),
      dateInput: await page.$('input[type="date"]')
    };
    
    for (const [name, element] of Object.entries(elements)) {
      if (element) {
        const isVisible = await element.evaluate(el => {
          const rect = el.getBoundingClientRect();
          const style = window.getComputedStyle(el);
          return rect.width > 0 && 
                 rect.height > 0 && 
                 style.display !== 'none' &&
                 style.visibility !== 'hidden' &&
                 style.opacity !== '0';
        });
        
        if (!isVisible) {
          throw new Error(`${name} is not properly visible - z-index issue detected`);
        }
        
        // Try to interact with the element
        try {
          await element.click();
          console.log(`✅ ${name} is clickable`);
        } catch (e) {
          throw new Error(`${name} is not clickable - ${e.message}`);
        }
      }
    }
    
    console.log('✅ All form elements are properly visible and clickable');
  }, 30000);
});
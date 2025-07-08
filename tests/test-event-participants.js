const puppeteer = require('puppeteer');

describe('Event Participants Update Tests', () => {
  let browser;
  let page;
  
  beforeAll(async () => {
    browser = await puppeteer.launch({
      headless: false,
      defaultViewport: { width: 400, height: 800 }
    });
  });

  afterAll(async () => {
    await browser.close();
  });

  beforeEach(async () => {
    page = await browser.newPage();
    
    // Log console messages
    page.on('console', msg => {
      console.log('Console:', msg.type(), msg.text());
    });
    
    // Log network errors
    page.on('requestfailed', request => {
      console.error('Request failed:', request.url(), request.failure());
    });
    
    // Log responses to see what's happening
    page.on('response', response => {
      if (response.url().includes('supabase') && response.status() >= 400) {
        console.error('Supabase error:', response.status(), response.url());
      }
    });
  });

  afterEach(async () => {
    await page.close();
  });

  test('Test participant update in different events', async () => {
    // Navigate to Split Pay page
    await page.goto('http://localhost:3002/split-pay', { waitUntil: 'networkidle0' });
    
    // Wait for events to load
    await page.waitForSelector('[data-testid="expense-event"]', { timeout: 10000 });
    
    // Get all events
    const events = await page.$$('[data-testid="expense-event"]');
    console.log(`Found ${events.length} events`);
    
    // Test each event
    for (let i = 0; i < Math.min(events.length, 3); i++) {
      console.log(`\n--- Testing event ${i + 1} ---`);
      
      // Get event title
      const eventTitle = await events[i].$eval('h3', el => el.textContent);
      console.log(`Event: ${eventTitle}`);
      
      // Click the event
      await events[i].click();
      await page.waitForTimeout(1000);
      
      // Click three-dot menu
      const menuButton = await page.$('button[aria-label="Event menu"]');
      if (!menuButton) {
        console.error('Menu button not found');
        await page.goBack();
        continue;
      }
      
      await menuButton.click();
      await page.waitForTimeout(300);
      
      // Click Event Settings
      const settingsButton = await page.$('button:has-text("Event Settings")');
      if (!settingsButton) {
        console.error('Settings button not found');
        await page.goBack();
        continue;
      }
      
      await settingsButton.click();
      await page.waitForTimeout(500);
      
      // Check current participants
      const participantElements = await page.$$('.space-y-2 > div');
      console.log(`Current participants: ${participantElements.length}`);
      
      // Try to toggle a participant
      if (participantElements.length > 2) {
        console.log('Toggling third participant...');
        await participantElements[2].click();
        await page.waitForTimeout(300);
      }
      
      // Save
      const saveButton = await page.$('button:has-text("Save")');
      if (saveButton) {
        console.log('Clicking save...');
        await saveButton.click();
        
        // Wait for alert or error
        await page.waitForTimeout(2000);
        
        // Check for alerts
        try {
          const alertText = await page.evaluate(() => {
            const lastAlert = window.lastAlert;
            window.lastAlert = null;
            return lastAlert;
          });
          if (alertText) {
            console.log('Alert:', alertText);
          }
        } catch (e) {
          // No alert
        }
      }
      
      // Go back to main page
      await page.goto('http://localhost:3002/split-pay', { waitUntil: 'networkidle0' });
      await page.waitForSelector('[data-testid="expense-event"]', { timeout: 10000 });
      
      // Re-get events after navigation
      events.length = 0;
      events.push(...await page.$$('[data-testid="expense-event"]'));
    }
    
    console.log('\n--- Test Complete ---');
  }, 60000);

  test('Check event structure in console', async () => {
    // This test will help us understand the data structure
    await page.goto('http://localhost:3002/split-pay', { waitUntil: 'networkidle0' });
    
    // Inject console logging
    await page.evaluate(() => {
      // Override alert to capture messages
      window.lastAlert = null;
      window.alert = (msg) => {
        console.log('ALERT:', msg);
        window.lastAlert = msg;
      };
    });
    
    // Wait for events
    await page.waitForSelector('[data-testid="expense-event"]', { timeout: 10000 });
    
    // Click first event
    await page.click('[data-testid="expense-event"]:first-child');
    await page.waitForTimeout(1000);
    
    // Get event ID from URL
    const url = page.url();
    const eventId = url.split('/').pop();
    console.log('Event ID from URL:', eventId);
    
    // Check console for event structure
    const eventData = await page.evaluate(() => {
      // This would be logged by the component
      return {
        url: window.location.href,
        hasEventData: !!window.eventData,
        localStorage: Object.keys(localStorage)
      };
    });
    
    console.log('Page data:', eventData);
  }, 30000);
});
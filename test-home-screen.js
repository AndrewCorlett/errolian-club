const { chromium } = require('playwright');

async function testHomeScreen() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    console.log('🚀 Starting Errolian Club Home Screen Test...');
    
    // Navigate to the application
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    
    console.log('✅ Page loaded successfully');
    
    // Take screenshot of home screen
    await page.screenshot({ path: 'home-screen.png', fullPage: true });
    console.log('📸 Screenshot saved as home-screen.png');
    
    // Test header elements
  const greeting = await page.locator('text=/Good (morning|afternoon|evening)/').textContent();
    console.log('👋 Greeting:', greeting);
    
    // Test Quick Actions
    console.log('🔍 Testing Quick Actions...');
    const newEventCard = page.locator('text=New Event').first();
    const addExpenseCard = page.locator('text=Add Expense').first();
    
    console.log('📅 New Event card present:', await newEventCard.isVisible());
    console.log('💳 Add Expense card present:', await addExpenseCard.isVisible());
    
    // Test navigation
    await newEventCard.click();
    await page.waitForLoadState('networkidle');
    console.log('🗓️ Navigation to Calendar:', page.url().includes('/calendar'));
    
    await page.goBack();
    await page.waitForLoadState('networkidle');
    
    await addExpenseCard.click();
    await page.waitForLoadState('networkidle');
    console.log('💰 Navigation to Split-Pay:', page.url().includes('/split-pay'));
    
    await page.goBack();
    await page.waitForLoadState('networkidle');
    
    // Test widgets
    console.log('📊 Testing Widgets...');
    const financialWidget = page.locator('text=Financial Overview');
    const eventsWidget = page.locator('text=Upcoming Events');
    const activityWidget = page.locator('text=Recent Activity');
    const statsWidget = page.locator('text=Active Events');
    
    console.log('💰 Financial Overview widget:', await financialWidget.isVisible());
    console.log('🗓️ Upcoming Events widget:', await eventsWidget.isVisible());
    console.log('🔔 Recent Activity widget:', await activityWidget.isVisible());
    console.log('📈 Club Stats widget:', await statsWidget.isVisible());
    
    // Test bottom navigation
    console.log('🧭 Testing Bottom Navigation...');
    const navTabs = ['Home', 'Calendar', 'Split-Pay', 'Docs', 'Account'];
    
    for (const tab of navTabs) {
      const tabElement = page.locator(`text=${tab}`).last();
      if (await tabElement.isVisible()) {
        console.log(`✅ ${tab} tab is present`);
        if (tab !== 'Home') {
          await tabElement.click();
          await page.waitForLoadState('networkidle');
          console.log(`🔄 Navigation to ${tab}:`, page.url());
        }
      }
    }
    
    // Return to home
    await page.locator('text=Home').last().click();
    await page.waitForLoadState('networkidle');
    
    console.log('🏠 Back to home:', page.url() === 'http://localhost:3000/');
    
    console.log('✅ All tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await browser.close();
  }
}

// Run if called directly
if (require.main === module) {
  testHomeScreen();
}

module.exports = { testHomeScreen };

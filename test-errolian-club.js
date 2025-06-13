import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

async function testErrolianClub() {
  console.log('🚀 Starting comprehensive testing of Errolian Club application...\n');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500 // Add delay to see actions
  });
  const context = await browser.newContext({
    viewport: { width: 1200, height: 800 }
  });
  const page = await context.newPage();
  
  const testResults = {
    navigation: {},
    homePageWidgets: {},
    visualElements: {},
    responsiveness: {},
    performance: {},
    issues: []
  };

  try {
    // 1. NAVIGATE AND SCREENSHOT
    console.log('📍 1. Navigation and Screenshot');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    
    await page.screenshot({ 
      path: 'screenshots/home-screen-desktop.png',
      fullPage: true 
    });
    console.log('✅ Home screen screenshot taken (desktop view)');

    // Check for basic elements
    const title = await page.title();
    console.log(`📄 Page title: ${title}`);
    
    // 2. TEST NAVIGATION ELEMENTS
    console.log('\n📱 2. Testing Navigation Elements');
    
    // Get navigation items
    const navItems = await page.locator('nav a, [role="navigation"] a, .bottom-0 a').all();
    console.log(`Found ${navItems.length} navigation items`);
    
    // Test each navigation tab
    const navTabs = ['Home', 'Calendar', 'Split-Pay', 'Docs', 'Account'];
    
    for (const tabName of navTabs) {
      try {
        console.log(`🔗 Testing ${tabName} navigation...`);
        
        // Find and click the tab
        const tabLink = page.locator(`text="${tabName}"`).first();
        if (await tabLink.isVisible()) {
          await tabLink.click();
          await page.waitForTimeout(1000);
          
          // Check URL change
          const currentUrl = page.url();
          console.log(`  📍 Navigated to: ${currentUrl}`);
          
          // Take screenshot of each page
          await page.screenshot({ 
            path: `screenshots/${tabName.toLowerCase().replace('-', '')}-page.png`,
            fullPage: true 
          });
          
          testResults.navigation[tabName] = {
            success: true,
            url: currentUrl,
            screenshot: `${tabName.toLowerCase().replace('-', '')}-page.png`
          };
        } else {
          console.log(`  ❌ ${tabName} tab not found`);
          testResults.navigation[tabName] = { success: false, error: 'Tab not found' };
        }
      } catch (error) {
        console.log(`  ❌ Error testing ${tabName}: ${error.message}`);
        testResults.navigation[tabName] = { success: false, error: error.message };
      }
    }
    
    // Return to home page
    await page.goto('http://localhost:3000');
    await page.waitForTimeout(1000);
    
    // Test browser back button
    console.log('🔙 Testing browser back button functionality...');
    await page.locator('text="Calendar"').first().click();
    await page.waitForTimeout(500);
    await page.goBack();
    await page.waitForTimeout(500);
    const backUrl = page.url();
    testResults.navigation.backButton = { 
      success: backUrl.includes('localhost:3000') || backUrl.endsWith('/'),
      finalUrl: backUrl 
    };

    // 3. TEST HOME PAGE WIDGETS
    console.log('\n🏠 3. Testing Home Page Widgets');
    
    // Test "New Event" quick action
    try {
      console.log('📅 Testing "New Event" button...');
      const newEventBtn = page.locator('text="New Event"').first();
      if (await newEventBtn.isVisible()) {
        await newEventBtn.click();
        await page.waitForTimeout(1000);
        testResults.homePageWidgets.newEvent = { 
          success: true, 
          navigatedTo: page.url() 
        };
        await page.screenshot({ path: 'screenshots/new-event-clicked.png' });
        await page.goBack();
      } else {
        testResults.homePageWidgets.newEvent = { success: false, error: 'Button not found' };
      }
    } catch (error) {
      testResults.homePageWidgets.newEvent = { success: false, error: error.message };
    }

    // Test "Add Expense" quick action
    try {
      console.log('💳 Testing "Add Expense" button...');
      const addExpenseBtn = page.locator('text="Add Expense"').first();
      if (await addExpenseBtn.isVisible()) {
        await addExpenseBtn.click();
        await page.waitForTimeout(1000);
        testResults.homePageWidgets.addExpense = { 
          success: true, 
          navigatedTo: page.url() 
        };
        await page.screenshot({ path: 'screenshots/add-expense-clicked.png' });
        await page.goBack();
      } else {
        testResults.homePageWidgets.addExpense = { success: false, error: 'Button not found' };
      }
    } catch (error) {
      testResults.homePageWidgets.addExpense = { success: false, error: error.message };
    }

    // Test "View All" in Financial Overview
    try {
      console.log('💰 Testing "View All" in Financial Overview...');
      const viewAllBtn = page.locator('text="View All"').first();
      if (await viewAllBtn.isVisible()) {
        await viewAllBtn.click();
        await page.waitForTimeout(1000);
        testResults.homePageWidgets.viewAllFinancial = { 
          success: true, 
          navigatedTo: page.url() 
        };
        await page.screenshot({ path: 'screenshots/view-all-financial.png' });
        await page.goBack();
      } else {
        testResults.homePageWidgets.viewAllFinancial = { success: false, error: 'Button not found' };
      }
    } catch (error) {
      testResults.homePageWidgets.viewAllFinancial = { success: false, error: error.message };
    }

    // Test "View Calendar" in Upcoming Events
    try {
      console.log('🗓️ Testing "View Calendar" button...');
      const viewCalendarBtn = page.locator('text="View Calendar"').first();
      if (await viewCalendarBtn.isVisible()) {
        await viewCalendarBtn.click();
        await page.waitForTimeout(1000);
        testResults.homePageWidgets.viewCalendar = { 
          success: true, 
          navigatedTo: page.url() 
        };
        await page.screenshot({ path: 'screenshots/view-calendar.png' });
        await page.goBack();
      } else {
        testResults.homePageWidgets.viewCalendar = { success: false, error: 'Button not found' };
      }
    } catch (error) {
      testResults.homePageWidgets.viewCalendar = { success: false, error: error.message };
    }

    // Test "Settle Up" or action buttons
    try {
      console.log('💸 Testing "Settle Up" or action buttons...');
      const settleUpBtn = page.locator('text="Settle Up", text="Collect Money"').first();
      if (await settleUpBtn.isVisible()) {
        const buttonText = await settleUpBtn.textContent();
        await settleUpBtn.click();
        await page.waitForTimeout(1000);
        testResults.homePageWidgets.settleUp = { 
          success: true, 
          buttonText,
          navigatedTo: page.url() 
        };
        await page.screenshot({ path: 'screenshots/settle-up-clicked.png' });
        await page.goBack();
      } else {
        testResults.homePageWidgets.settleUp = { success: false, error: 'Button not found' };
      }
    } catch (error) {
      testResults.homePageWidgets.settleUp = { success: false, error: error.message };
    }

    // 4. CHECK VISUAL ELEMENTS
    console.log('\n👀 4. Checking Visual Elements');
    
    // Check time-based greeting
    const greeting = await page.locator('h1, .text-xl, [class*="text-"]').first().textContent();
    const hasTimeGreeting = greeting && (greeting.includes('morning') || greeting.includes('afternoon') || greeting.includes('evening'));
    testResults.visualElements.timeBasedGreeting = {
      success: hasTimeGreeting,
      greetingText: greeting
    };
    console.log(`🌅 Time-based greeting: ${greeting} (${hasTimeGreeting ? 'Valid' : 'Invalid'})`);

    // Check widgets styling
    const widgets = await page.locator('[class*="card"], .bg-white, .rounded').count();
    testResults.visualElements.widgetCount = widgets;
    console.log(`📊 Found ${widgets} styled widgets/cards`);

    // Check for visual issues
    const errors = await page.locator('.error, [class*="error"], [style*="color: red"]').count();
    testResults.visualElements.errors = errors;
    console.log(`❌ Visual errors found: ${errors}`);

    // 5. TEST RESPONSIVENESS
    console.log('\n📱 5. Testing Responsiveness');
    
    // Mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'screenshots/mobile-view.png', fullPage: true });
    testResults.responsiveness.mobile = { 
      success: true, 
      viewport: '375x667',
      screenshot: 'mobile-view.png'
    };
    console.log('📱 Mobile view (375x667) tested');

    // Tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'screenshots/tablet-view.png', fullPage: true });
    testResults.responsiveness.tablet = { 
      success: true, 
      viewport: '768x1024',
      screenshot: 'tablet-view.png'
    };
    console.log('📱 Tablet view (768x1024) tested');

    // Desktop viewport
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'screenshots/desktop-view.png', fullPage: true });
    testResults.responsiveness.desktop = { 
      success: true, 
      viewport: '1200x800',
      screenshot: 'desktop-view.png'
    };
    console.log('🖥️ Desktop view (1200x800) tested');

    // 6. PERFORMANCE TESTING
    console.log('\n⚡ 6. Performance Testing');
    
    const performanceEntries = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0];
      return {
        loadTime: navigation.loadEventEnd - navigation.loadEventStart,
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        firstContentfulPaint: performance.getEntriesByType('paint')
          .find(entry => entry.name === 'first-contentful-paint')?.startTime || 0
      };
    });
    
    testResults.performance = performanceEntries;
    console.log(`⏱️ Page load time: ${performanceEntries.loadTime}ms`);
    console.log(`⏱️ DOM Content Loaded: ${performanceEntries.domContentLoaded}ms`);
    console.log(`⏱️ First Contentful Paint: ${performanceEntries.firstContentfulPaint}ms`);

  } catch (error) {
    console.error('❌ Test execution error:', error);
    testResults.issues.push(`Test execution error: ${error.message}`);
  } finally {
    await browser.close();
  }

  // Generate comprehensive report
  console.log('\n📋 COMPREHENSIVE TEST REPORT');
  console.log('=====================================');
  
  console.log('\n🧭 NAVIGATION TESTING RESULTS:');
  Object.entries(testResults.navigation).forEach(([key, result]) => {
    const status = result.success ? '✅' : '❌';
    console.log(`  ${status} ${key}: ${result.success ? 'Working' : result.error}`);
  });
  
  console.log('\n🏠 HOME PAGE WIDGETS RESULTS:');
  Object.entries(testResults.homePageWidgets).forEach(([key, result]) => {
    const status = result.success ? '✅' : '❌';
    console.log(`  ${status} ${key}: ${result.success ? 'Working' : result.error}`);
  });
  
  console.log('\n👀 VISUAL ELEMENTS RESULTS:');
  Object.entries(testResults.visualElements).forEach(([key, result]) => {
    if (typeof result === 'object' && result.success !== undefined) {
      const status = result.success ? '✅' : '❌';
      console.log(`  ${status} ${key}: ${result.success ? 'Working' : 'Issues found'}`);
    } else {
      console.log(`  ℹ️ ${key}: ${result}`);
    }
  });
  
  console.log('\n📱 RESPONSIVENESS RESULTS:');
  Object.entries(testResults.responsiveness).forEach(([key, result]) => {
    const status = result.success ? '✅' : '❌';
    console.log(`  ${status} ${key}: ${result.viewport} - Screenshot: ${result.screenshot}`);
  });
  
  console.log('\n⚡ PERFORMANCE RESULTS:');
  console.log(`  ⏱️ Load Time: ${testResults.performance.loadTime}ms`);
  console.log(`  ⏱️ DOM Ready: ${testResults.performance.domContentLoaded}ms`);
  console.log(`  ⏱️ First Paint: ${testResults.performance.firstContentfulPaint}ms`);
  
  if (testResults.issues.length > 0) {
    console.log('\n⚠️ ISSUES FOUND:');
    testResults.issues.forEach(issue => console.log(`  - ${issue}`));
  }
  
  console.log('\n📸 Screenshots saved in ./screenshots/ directory');
  console.log('🎉 Testing completed!');
  
  // Save test results to file
  fs.writeFileSync('test-results.json', JSON.stringify(testResults, null, 2));
  console.log('📄 Detailed results saved to test-results.json');
}

// Ensure screenshots directory exists
if (!fs.existsSync('screenshots')) {
  fs.mkdirSync('screenshots');
}

testErrolianClub().catch(console.error);
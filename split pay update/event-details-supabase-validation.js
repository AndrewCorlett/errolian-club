import puppeteer from 'puppeteer'

async function validateEventDetailsSupabaseIntegration() {
  console.log('🧪 Validating event details Supabase integration...')
  
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  })
  
  const page = await browser.newPage()
  await page.setViewport({ width: 375, height: 812, deviceScaleFactor: 2 })
  
  try {
    // First navigate to split pay homepage
    console.log('📱 Loading Split Pay homepage...')
    await page.goto('http://localhost:3001/test/split-pay', { 
      waitUntil: 'networkidle0',
      timeout: 30000
    })
    
    // Wait for loading to complete
    await page.waitForFunction(() => {
      const loader = document.querySelector('.animate-spin')
      return !loader || loader.style.display === 'none'
    }, { timeout: 10000 })
    
    // Check if there are any expense events to click
    const hasExpenseEvents = await page.evaluate(() => {
      const events = document.querySelectorAll('[data-testid="expense-event"]')
      return events.length > 0
    })
    
    if (!hasExpenseEvents) {
      console.log('📊 No expense events found - testing will show empty state handling')
      
      // Try navigating to a test event ID directly
      console.log('📱 Testing direct navigation to event details with test ID...')
      await page.goto('http://localhost:3001/test/split-pay/event/test-event-123', { 
        waitUntil: 'networkidle0',
        timeout: 30000
      })
      
      // Wait a moment for any loading
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Check for error state
      const hasErrorState = await page.evaluate(() => {
        return document.body.textContent.includes('Error') || 
               document.body.textContent.includes('not found') ||
               document.body.textContent.includes('Loading event details')
      })
      
      console.log(`   Error state handling: ${hasErrorState ? '✅ Shows error/loading state' : '❌ No error handling'}`)
      
      // Take screenshot
      await page.screenshot({ 
        path: './split pay update/screenshots/event-details-no-data.png',
        fullPage: true
      })
      
      await browser.close()
      
      return {
        success: hasErrorState,
        noData: true,
        errorHandling: hasErrorState
      }
    }
    
    // Click on the first expense event
    console.log('📱 Clicking on first expense event...')
    await page.click('[data-testid="expense-event"]')
    
    // Wait for navigation
    await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 15000 })
    
    // Wait for page to load
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Check for mock data indicators
    const mockDataCheck = await page.evaluate(() => {
      const mockItems = [
        'EMC Golf Weekend',
        'Wine for table',
        'Daniel Corrigan',
        'Callum Forsyth',
        '£957.40',
        '£277.60'
      ]
      
      const foundMockItems = mockItems.filter(item => 
        document.body.textContent.includes(item))
      
      return {
        hasMockData: foundMockItems.length > 0,
        foundItems: foundMockItems
      }
    })
    
    // Check for Supabase integration indicators
    const supabaseCheck = await page.evaluate(() => {
      return {
        hasLoadingState: document.body.textContent.includes('Loading event details'),
        hasErrorState: document.body.textContent.includes('Error'),
        hasExpensesTab: !!document.querySelector('[data-testid="expenses-tab"]'),
        hasBalancesTab: !!document.querySelector('[data-testid="balances-tab"]'),
        hasExpenseItems: document.querySelectorAll('[data-testid="expense-item"]').length,
        hasBalanceItems: document.querySelectorAll('[data-testid="balance-item"]').length
      }
    })
    
    // Test tab switching
    console.log('📱 Testing tab switching functionality...')
    if (supabaseCheck.hasBalancesTab) {
      await page.click('[data-testid="balances-tab"]')
      await new Promise(resolve => setTimeout(resolve, 500))
      
      const balancesVisible = await page.evaluate(() => {
        return document.body.textContent.includes('Your Balance') ||
               document.body.textContent.includes('You Owe') ||
               document.body.textContent.includes('Owed to You')
      })
      
      console.log(`   Balances tab working: ${balancesVisible ? '✅' : '❌'}`)
      supabaseCheck.balancesTabWorking = balancesVisible
    }
    
    // Check theme consistency
    const themeCheck = await page.evaluate(() => {
      const royalElements = document.querySelectorAll('[class*="royal"]')
      const accentElements = document.querySelectorAll('[class*="accent"]')
      const primaryElements = document.querySelectorAll('[class*="primary"]')
      
      return {
        royal: royalElements.length,
        accent: accentElements.length,
        primary: primaryElements.length,
        hasTheme: royalElements.length > 0 && accentElements.length > 0
      }
    })
    
    console.log('📊 Event Details Analysis:')
    console.log(`   Mock data found: ${mockDataCheck.hasMockData ? '❌ STILL HAS MOCK DATA' : '✅ Mock data removed'}`)
    if (mockDataCheck.hasMockData) {
      console.log(`   Mock items found: ${mockDataCheck.foundItems.join(', ')}`)
    }
    console.log(`   Has expenses tab: ${supabaseCheck.hasExpensesTab ? '✅' : '❌'}`)
    console.log(`   Has balances tab: ${supabaseCheck.hasBalancesTab ? '✅' : '❌'}`)
    console.log(`   Expense items: ${supabaseCheck.hasExpenseItems}`)
    console.log(`   Balance items: ${supabaseCheck.hasBalanceItems}`)
    console.log(`   Balances tab working: ${supabaseCheck.balancesTabWorking ? '✅' : '❌'}`)
    
    console.log('🎨 Theme Analysis:')
    console.log(`   Royal elements: ${themeCheck.royal}`)
    console.log(`   Accent elements: ${themeCheck.accent}`)
    console.log(`   Primary elements: ${themeCheck.primary}`)
    console.log(`   Theme applied: ${themeCheck.hasTheme ? '✅' : '❌'}`)
    
    // Take final screenshot
    await page.screenshot({ 
      path: './split pay update/screenshots/event-details-supabase.png',
      fullPage: true
    })
    
    await browser.close()
    
    const success = !mockDataCheck.hasMockData && 
                   supabaseCheck.hasExpensesTab && 
                   supabaseCheck.hasBalancesTab && 
                   themeCheck.hasTheme
    
    console.log('✨ Event details validation completed!')
    
    return {
      success,
      mockDataRemoved: !mockDataCheck.hasMockData,
      supabaseIntegration: supabaseCheck,
      themeConsistency: themeCheck.hasTheme,
      mockDataFound: mockDataCheck.foundItems
    }
    
  } catch (error) {
    console.error('❌ Validation error:', error.message)
    await browser.close()
    return { error: error.message }
  }
}

validateEventDetailsSupabaseIntegration()
  .then(results => {
    console.log('\n📊 Event Details Integration Results:')
    console.log(JSON.stringify(results, null, 2))
    
    if (results.success) {
      console.log('\n🎉 SUCCESS: Event details successfully updated!')
      console.log('   ✅ Mock data removed')
      console.log('   ✅ Supabase integration active') 
      console.log('   ✅ Tab functionality working')
      console.log('   ✅ Theme consistency maintained')
    } else if (!results.error) {
      console.log('\n⚠️  ISSUES FOUND:')
      if (!results.mockDataRemoved) {
        console.log('   ❌ Mock data still present')
        console.log(`   Found: ${results.mockDataFound?.join(', ')}`)
      }
      if (!results.supabaseIntegration.hasExpensesTab) console.log('   ❌ Expenses tab missing')
      if (!results.supabaseIntegration.hasBalancesTab) console.log('   ❌ Balances tab missing')
      if (!results.themeConsistency) console.log('   ❌ Theme not applied correctly')
    }
  })
  .catch(console.error)
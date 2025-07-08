import puppeteer from 'puppeteer'

async function validateEventDetailsLayout() {
  console.log('🧪 Starting event details layout validation...')
  
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  })
  
  const page = await browser.newPage()
  await page.setViewport({
    width: 375,
    height: 812,
    deviceScaleFactor: 2
  })
  
  console.log('📱 Navigating to event details...')
  await page.goto('http://localhost:3001/test/split-pay/event/1', { 
    waitUntil: 'networkidle0',
    timeout: 30000
  })
  
  console.log('🔍 Validating event details elements...')
  
  // Test 1: Check if header exists with event title
  const header = await page.$eval('h1', el => el.textContent)
  console.log(`✅ Header found: "${header}"`)
  
  // Test 2: Check if toggle tabs exist
  const expensesTab = await page.$('[data-testid="expenses-tab"]')
  const balancesTab = await page.$('[data-testid="balances-tab"]')
  if (expensesTab && balancesTab) {
    console.log('✅ Toggle tabs found')
  } else {
    console.log('❌ Toggle tabs not found')
  }
  
  // Test 3: Check if expenses are displayed by default
  const expenseItems = await page.$$('[data-testid="expense-item"]')
  console.log(`✅ Found ${expenseItems.length} expense items`)
  
  // Test 4: Test toggle functionality
  console.log('🔄 Testing toggle to balances...')
  await balancesTab.click()
  await new Promise(resolve => setTimeout(resolve, 500))
  
  const balanceItems = await page.$$('[data-testid="balance-item"]')
  console.log(`✅ Found ${balanceItems.length} balance items`)
  
  // Test 5: Check balance summary
  const balanceSummary = await page.evaluate(() => {
    const summaryElement = document.querySelector('.text-3xl.font-bold.text-red-600')
    return summaryElement ? summaryElement.textContent : null
  })
  
  if (balanceSummary) {
    console.log(`✅ Balance summary found: "${balanceSummary}"`)
  } else {
    console.log('❌ Balance summary not found')
  }
  
  // Test 6: Switch back to expenses
  console.log('🔄 Testing toggle back to expenses...')
  const expensesTabAfter = await page.$('[data-testid="expenses-tab"]')
  await expensesTabAfter.click()
  await new Promise(resolve => setTimeout(resolve, 500))
  
  const expenseItemsAfter = await page.$$('[data-testid="expense-item"]')
  console.log(`✅ Found ${expenseItemsAfter.length} expense items after toggle`)
  
  // Test 7: Check theme colors
  const themeElements = await page.evaluate(() => {
    const elements = Array.from(document.querySelectorAll('*'))
    const themeColors = {
      royal: elements.filter(el => Array.from(el.classList).some(c => c.includes('royal'))).length,
      accent: elements.filter(el => Array.from(el.classList).some(c => c.includes('accent'))).length,
      primary: elements.filter(el => Array.from(el.classList).some(c => c.includes('primary'))).length
    }
    return themeColors
  })
  console.log('🎨 Theme color usage:')
  console.log(`   Royal: ${themeElements.royal} elements`)
  console.log(`   Accent: ${themeElements.accent} elements`) 
  console.log(`   Primary: ${themeElements.primary} elements`)
  
  // Take final screenshots
  await page.screenshot({ 
    path: './split pay update/screenshots/event-details-expenses.png',
    fullPage: true
  })
  
  await balancesTab.click()
  await new Promise(resolve => setTimeout(resolve, 500))
  await page.screenshot({ 
    path: './split pay update/screenshots/event-details-balances.png',
    fullPage: true
  })
  
  await browser.close()
  
  console.log('✨ Event details validation completed!')
  
  return {
    hasHeader: !!header,
    hasTabs: !!(expensesTab && balancesTab),
    expenseCount: expenseItems.length,
    balanceCount: balanceItems.length,
    hasBalanceSummary: !!balanceSummary,
    themeColors: themeElements
  }
}

// Run validation
validateEventDetailsLayout()
  .then(results => {
    console.log('\n📊 Event Details Validation Summary:')
    console.log(JSON.stringify(results, null, 2))
  })
  .catch(console.error)
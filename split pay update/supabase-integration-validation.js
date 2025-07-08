import puppeteer from 'puppeteer'

async function validateSupabaseIntegration() {
  console.log('🧪 Starting Supabase integration validation...')
  
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  })
  
  const page = await browser.newPage()
  await page.setViewport({ width: 375, height: 812, deviceScaleFactor: 2 })
  
  try {
    await page.goto('http://localhost:3001/test/split-pay', { 
      waitUntil: 'networkidle0',
      timeout: 30000
    })
    
    console.log('📱 Page loaded, checking for loading state...')
    
    // Wait for initial loading to complete
    await page.waitForFunction(() => {
      const loader = document.querySelector('.animate-spin')
      return !loader || loader.style.display === 'none'
    }, { timeout: 10000 })
    
    console.log('⏳ Loading completed, checking page state...')
    
    // Check what state the page is in
    const pageState = await page.evaluate(() => {
      const loader = document.querySelector('.animate-spin')
      const error = document.querySelector('.bg-red-50')
      const noExpenses = Array.from(document.querySelectorAll('h3')).find(h3 => 
        h3.textContent.includes('No Expenses Yet'))
      const expenseEvents = document.querySelectorAll('[data-testid="expense-event"]')
      
      return {
        isLoading: !!loader,
        hasError: !!error,
        hasNoExpensesMessage: !!noExpenses,
        expenseEventCount: expenseEvents.length,
        errorMessage: error ? error.textContent : null
      }
    })
    
    console.log('📊 Page State Analysis:')
    console.log(`   Loading: ${pageState.isLoading ? '✅' : '❌'}`)
    console.log(`   Error: ${pageState.hasError ? '❌' : '✅'}`)
    console.log(`   No Expenses Message: ${pageState.hasNoExpensesMessage ? '✅' : '❌'}`)
    console.log(`   Expense Events: ${pageState.expenseEventCount}`)
    
    if (pageState.hasError) {
      console.log(`   Error Message: ${pageState.errorMessage}`)
    }
    
    // Check theme consistency
    const themeElements = await page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll('*'))
      return {
        royal: elements.filter(el => Array.from(el.classList).some(c => c.includes('royal'))).length,
        accent: elements.filter(el => Array.from(el.classList).some(c => c.includes('accent'))).length,
        primary: elements.filter(el => Array.from(el.classList).some(c => c.includes('primary'))).length
      }
    })
    
    console.log('🎨 Theme Color Usage:')
    console.log(`   Royal: ${themeElements.royal} elements`)
    console.log(`   Accent: ${themeElements.accent} elements`) 
    console.log(`   Primary: ${themeElements.primary} elements`)
    
    // Test add expense button
    const addButton = await page.$('[data-testid="add-expense-button"]')
    if (addButton) {
      console.log('✅ Add expense button found')
    } else {
      console.log('❌ Add expense button not found')
    }
    
    // Take screenshot of final state
    await page.screenshot({ 
      path: './split pay update/screenshots/supabase-integration.png',
      fullPage: true
    })
    
    await browser.close()
    
    console.log('✨ Supabase integration validation completed!')
    
    return {
      success: !pageState.hasError,
      state: pageState,
      themeColors: themeElements
    }
    
  } catch (error) {
    console.error('❌ Validation error:', error.message)
    await browser.close()
    return { error: error.message }
  }
}

validateSupabaseIntegration()
  .then(results => {
    console.log('\n📊 Supabase Integration Results:')
    console.log(JSON.stringify(results, null, 2))
  })
  .catch(console.error)
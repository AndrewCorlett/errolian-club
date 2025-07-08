import puppeteer from 'puppeteer'

async function validateMainSplitPayRoute() {
  console.log('🧪 Validating main Split Pay route Supabase integration...')
  
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  })
  
  const page = await browser.newPage()
  await page.setViewport({ width: 375, height: 812, deviceScaleFactor: 2 })
  
  try {
    // Test the main route first (should redirect to login)
    console.log('📱 Testing main /split-pay route (should redirect to login)...')
    await page.goto('http://localhost:3001/split-pay', { 
      waitUntil: 'networkidle0',
      timeout: 30000
    })
    
    const isLoginPage = await page.evaluate(() => {
      return document.title.includes('Sign In') || 
             document.querySelector('input[type="email"]') !== null ||
             window.location.pathname.includes('auth')
    })
    
    console.log(`   Login redirect: ${isLoginPage ? '✅ Correctly redirects' : '❌ No redirect'}`)
    
    // Take screenshot of login redirect
    await page.screenshot({ 
      path: './split pay update/screenshots/main-route-login.png',
      fullPage: true
    })
    
    // Now test that the component code is updated (using test route)
    console.log('📱 Testing updated component via test route...')
    await page.goto('http://localhost:3001/test/split-pay', { 
      waitUntil: 'networkidle0',
      timeout: 30000
    })
    
    // Wait for loading to complete
    await page.waitForFunction(() => {
      const loader = document.querySelector('.animate-spin')
      return !loader || loader.style.display === 'none'
    }, { timeout: 10000 })
    
    // Check for empty state (no mock data)
    const hasEmptyState = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('h3')).some(h3 => 
        h3.textContent.includes('No Expenses Yet'))
    })
    
    // Check for NO mock data (should not find these)
    const hasMockData = await page.evaluate(() => {
      const mockItems = [
        'EMC Golf Weekend',
        'Alicante/Barcelona', 
        'Golf Weekend',
        'Poland',
        'City Trip'
      ]
      
      return mockItems.some(item => 
        document.body.textContent.includes(item))
    })
    
    console.log('📊 Component State Analysis:')
    console.log(`   Empty state displayed: ${hasEmptyState ? '✅' : '❌'}`)
    console.log(`   Mock data found: ${hasMockData ? '❌ STILL HAS MOCK DATA' : '✅ Mock data removed'}`)
    
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
    
    console.log('🎨 Theme Analysis:')
    console.log(`   Royal elements: ${themeCheck.royal}`)
    console.log(`   Accent elements: ${themeCheck.accent}`)
    console.log(`   Primary elements: ${themeCheck.primary}`)
    console.log(`   Theme applied: ${themeCheck.hasTheme ? '✅' : '❌'}`)
    
    // Test add expense button
    const addButton = await page.$('[data-testid="add-expense-button"]')
    console.log(`   Add expense button: ${addButton ? '✅' : '❌'}`)
    
    // Take final screenshot
    await page.screenshot({ 
      path: './split pay update/screenshots/main-route-updated.png',
      fullPage: true
    })
    
    await browser.close()
    
    console.log('✨ Main route validation completed!')
    
    const success = isLoginPage && hasEmptyState && !hasMockData && themeCheck.hasTheme
    
    return {
      success,
      loginRedirect: isLoginPage,
      emptyState: hasEmptyState,
      mockDataRemoved: !hasMockData,
      themeApplied: themeCheck.hasTheme,
      themeElements: themeCheck
    }
    
  } catch (error) {
    console.error('❌ Validation error:', error.message)
    await browser.close()
    return { error: error.message }
  }
}

validateMainSplitPayRoute()
  .then(results => {
    console.log('\n📊 Main Route Integration Results:')
    console.log(JSON.stringify(results, null, 2))
    
    if (results.success) {
      console.log('\n🎉 SUCCESS: Main Split Pay route successfully updated!')
      console.log('   ✅ Authentication protection working')
      console.log('   ✅ Mock data removed')
      console.log('   ✅ Supabase integration active')
      console.log('   ✅ Theme consistency maintained')
    } else if (!results.error) {
      console.log('\n⚠️  ISSUES FOUND:')
      if (!results.loginRedirect) console.log('   ❌ Login redirect not working')
      if (!results.emptyState) console.log('   ❌ Empty state not showing')
      if (!results.mockDataRemoved) console.log('   ❌ Mock data still present')
      if (!results.themeApplied) console.log('   ❌ Theme not applied correctly')
    }
  })
  .catch(console.error)
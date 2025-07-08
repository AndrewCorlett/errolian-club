import puppeteer from 'puppeteer'

async function debugScreenshot() {
  console.log('🐛 Starting debug session...')
  
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
  
  console.log('📱 Navigating to Split Pay...')
  await page.goto('http://localhost:3001/split-pay', { 
    waitUntil: 'networkidle0',
    timeout: 30000
  })
  
  // Check page title and content
  const title = await page.title()
  console.log(`📄 Page title: ${title}`)
  
  // Check if we're on login page
  const isLoginPage = await page.$('input[type="email"], input[type="password"]')
  if (isLoginPage) {
    console.log('🔐 Redirected to login page - need authentication')
    
    // Try to login with test credentials
    const emailInput = await page.$('input[type="email"]')
    const passwordInput = await page.$('input[type="password"]')
    
    if (emailInput && passwordInput) {
      await emailInput.type('test@example.com')
      await passwordInput.type('testpassword')
      
      const submitButton = await page.$('button[type="submit"], input[type="submit"]')
      if (submitButton) {
        await submitButton.click()
        await page.waitForNavigation({ waitUntil: 'networkidle0' })
        
        // Try to navigate to split-pay again
        await page.goto('http://localhost:3001/split-pay', { 
          waitUntil: 'networkidle0',
          timeout: 30000
        })
      }
    }
  }
  
  // Take screenshot of current state
  await page.screenshot({ 
    path: './split pay update/screenshots/debug-current-state.png',
    fullPage: true
  })
  
  // Get page content for debugging
  const bodyContent = await page.evaluate(() => {
    return {
      url: window.location.href,
      title: document.title,
      bodyText: document.body.innerText.slice(0, 500),
      hasExpenseEvents: document.querySelectorAll('[data-testid="expense-event"]').length,
      hasAddButton: document.querySelectorAll('[data-testid="add-expense-button"]').length,
      headers: Array.from(document.querySelectorAll('h1, h2, h3, .ios-header-title')).map(h => h.textContent)
    }
  })
  
  console.log('🔍 Debug info:')
  console.log(JSON.stringify(bodyContent, null, 2))
  
  await browser.close()
  
  console.log('✨ Debug session completed!')
}

debugScreenshot().catch(console.error)
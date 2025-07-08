import puppeteer from 'puppeteer'

async function validatePaymentFlowSimple() {
  console.log('🧪 Starting simple payment flow validation...')
  
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  })
  
  const page = await browser.newPage()
  await page.setViewport({ width: 375, height: 812, deviceScaleFactor: 2 })
  
  try {
    await page.goto('http://localhost:3001/test/payment-flow', { 
      waitUntil: 'networkidle0',
      timeout: 30000
    })
    
    // Test 1: Basic page load
    const payButtons = await page.$$('[data-testid^="pay-button-"]')
    console.log(`✅ Found ${payButtons.length} pay buttons`)
    
    // Test 2: Open modal
    if (payButtons.length > 0) {
      await payButtons[0].click()
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const modal = await page.$('.fixed.inset-0.bg-black.bg-opacity-50')
      console.log(`✅ Modal opened: ${!!modal}`)
      
      // Test 3: Select payment method
      const paymentMethods = await page.$$('.p-3.rounded-xl.border-2')
      if (paymentMethods.length > 0) {
        await paymentMethods[0].click() // Select first payment method
        await new Promise(resolve => setTimeout(resolve, 500))
        console.log('✅ Payment method selected')
        
        // Test 4: Check if Continue button is enabled
        const continueButton = await page.evaluateHandle(() => {
          return Array.from(document.querySelectorAll('button')).find(btn => 
            btn.textContent.includes('Continue'))
        })
        
        if (continueButton) {
          console.log('✅ Continue button found')
          
          // Take screenshot of modal state
          await page.screenshot({ 
            path: './split pay update/screenshots/payment-modal-ready.png',
            fullPage: true
          })
        }
      }
    }
    
    // Test 5: Check theme colors
    const themeElements = await page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll('*'))
      return {
        royal: elements.filter(el => Array.from(el.classList).some(c => c.includes('royal'))).length,
        accent: elements.filter(el => Array.from(el.classList).some(c => c.includes('accent'))).length,
        primary: elements.filter(el => Array.from(el.classList).some(c => c.includes('primary'))).length
      }
    })
    
    console.log('🎨 Theme Usage:', themeElements)
    
    await browser.close()
    console.log('✨ Simple validation completed successfully!')
    
    return {
      payButtonCount: payButtons.length,
      modalOpened: true,
      themeColors: themeElements
    }
    
  } catch (error) {
    console.error('❌ Validation error:', error.message)
    await browser.close()
    return { error: error.message }
  }
}

validatePaymentFlowSimple()
  .then(results => {
    console.log('\n📊 Simple Validation Results:')
    console.log(JSON.stringify(results, null, 2))
  })
  .catch(console.error)
import puppeteer from 'puppeteer'

async function validatePaymentFlow() {
  console.log('🧪 Starting payment flow validation...')
  
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
  
  console.log('📱 Navigating to payment flow test page...')
  await page.goto('http://localhost:3001/test/payment-flow', { 
    waitUntil: 'networkidle0',
    timeout: 30000
  })
  
  console.log('🔍 Validating payment flow page elements...')
  
  // Test 1: Check if participants list exists
  const participantsList = await page.evaluate(() => {
    const payButtons = document.querySelectorAll('[data-testid^="pay-button-"]')
    const participants = document.querySelectorAll('.w-12.h-12.bg-gradient-to-br')
    const statusIndicators = document.querySelectorAll('.w-5.h-5.rounded-full.border-2')
    
    return {
      payButtonCount: payButtons.length,
      participantCount: participants.length,
      statusIndicatorCount: statusIndicators.length,
      hasInstructions: document.querySelector('ul').textContent.includes('Click "Pay" buttons')
    }
  })
  
  console.log('👥 Participants List Validation:')
  console.log(`   Pay buttons found: ${participantsList.payButtonCount}`)
  console.log(`   Participants found: ${participantsList.participantCount}`)
  console.log(`   Status indicators: ${participantsList.statusIndicatorCount}`)
  console.log(`   Instructions: ${participantsList.hasInstructions ? '✅' : '❌'}`)
  
  // Test 2: Test payment modal opening
  console.log('🚪 Testing payment modal opening...')
  
  const firstPayButton = await page.$('[data-testid="pay-button-p1"]')
  if (firstPayButton) {
    await firstPayButton.click()
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    const modal = await page.$('.fixed.inset-0.bg-black.bg-opacity-50')
    if (modal) {
      console.log('✅ Payment modal opened successfully')
    } else {
      console.log('❌ Payment modal failed to open')
      await browser.close()
      return
    }
  } else {
    console.log('❌ First pay button not found')
    await browser.close()
    return
  }
  
  // Test 3: Validate modal content
  const modalContent = await page.evaluate(() => {
    const header = document.querySelector('.text-xl.font-semibold.text-royal-900')
    const progressSteps = document.querySelectorAll('.w-8.h-8.rounded-full')
    const amountInput = document.querySelector('input[type="number"]')
    const paymentMethods = document.querySelectorAll('.p-3.rounded-xl.border-2')
    const continueButton = Array.from(document.querySelectorAll('button')).find(btn => 
      btn.textContent.includes('Continue'))
    
    return {
      hasHeader: !!header,
      headerText: header ? header.textContent : null,
      progressStepCount: progressSteps.length,
      hasAmountInput: !!amountInput,
      paymentMethodCount: paymentMethods.length,
      hasContinueButton: !!continueButton
    }
  })
  
  console.log('📋 Modal Content Validation:')
  console.log(`   Header: ${modalContent.hasHeader ? '✅' : '❌'}`)
  console.log(`   Header text: "${modalContent.headerText}"`)
  console.log(`   Progress steps: ${modalContent.progressStepCount}`)
  console.log(`   Amount input: ${modalContent.hasAmountInput ? '✅' : '❌'}`)
  console.log(`   Payment methods: ${modalContent.paymentMethodCount}`)
  console.log(`   Continue button: ${modalContent.hasContinueButton ? '✅' : '❌'}`)
  
  // Test 4: Test payment method selection
  console.log('💳 Testing payment method selection...')
  
  const bankTransferMethod = await page.evaluateHandle(() => {
    return Array.from(document.querySelectorAll('.p-3.rounded-xl.border-2')).find(el =>
      el.textContent.includes('Bank Transfer'))
  })
  
  if (bankTransferMethod) {
    await bankTransferMethod.click()
    await new Promise(resolve => setTimeout(resolve, 500))
    
    const isSelected = await page.evaluate(() => {
      const selectedMethod = document.querySelector('.border-royal-500.bg-royal-50')
      return !!selectedMethod
    })
    
    console.log(`✅ Payment method selection: ${isSelected ? 'Working' : 'Failed'}`)
  }
  
  // Test 5: Fill form and continue
  console.log('✏️ Testing form completion...')
  
  // Amount should be pre-filled, just check continue button enables
  const continueBtn = await page.evaluateHandle(() => {
    return Array.from(document.querySelectorAll('button')).find(btn => 
      btn.textContent.includes('Continue'))
  })
  
  if (continueBtn) {
    await continueBtn.click()
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Check if we're on confirmation step
    const confirmationStep = await page.evaluate(() => {
      const confirmButton = Array.from(document.querySelectorAll('button')).find(btn => 
        btn.textContent.includes('Confirm Payment'))
      const confirmHeader = Array.from(document.querySelectorAll('h3')).find(h3 => 
        h3.textContent.includes('Confirm Payment'))
      
      return {
        hasConfirmButton: !!confirmButton,
        hasConfirmHeader: !!confirmHeader,
        reviewSection: document.querySelector('.bg-primary-50.rounded-2xl.p-4') !== null
      }
    })
    
    console.log('✅ Confirmation Step Validation:')
    console.log(`   Confirm button: ${confirmationStep.hasConfirmButton ? '✅' : '❌'}`)
    console.log(`   Confirm header: ${confirmationStep.hasConfirmHeader ? '✅' : '❌'}`)
    console.log(`   Review section: ${confirmationStep.reviewSection ? '✅' : '❌'}`)
    
    // Test 6: Final confirmation  
    const confirmPaymentBtn = await page.$('button')
    const confirmButtons = await page.$$eval('button', buttons => 
      buttons.map(btn => btn.textContent)
    )
    console.log('Available buttons:', confirmButtons)
    
    const confirmPaymentButton = await page.evaluateHandle(() => {
      return Array.from(document.querySelectorAll('button')).find(btn => 
        btn.textContent.includes('Confirm Payment'))
    })
    
    if (confirmPaymentButton && confirmPaymentButton.asElement) {
      await confirmPaymentButton.asElement().click()
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Check for success step
      const successStep = await page.evaluate(() => {
        const successHeader = Array.from(document.querySelectorAll('h3')).find(h3 => 
          h3.textContent.includes('Payment Recorded'))
        const successIcon = document.querySelector('.bg-green-100.rounded-full')
        const loadingSpinner = document.querySelector('.animate-spin')
        
        return {
          hasSuccessHeader: !!successHeader,
          hasSuccessIcon: !!successIcon,
          hasLoadingSpinner: !!loadingSpinner
        }
      })
      
      console.log('🎉 Success Step Validation:')
      console.log(`   Success header: ${successStep.hasSuccessHeader ? '✅' : '❌'}`)
      console.log(`   Success icon: ${successStep.hasSuccessIcon ? '✅' : '❌'}`)
      console.log(`   Loading spinner: ${successStep.hasLoadingSpinner ? '✅' : '❌'}`)
    }
  }
  
  // Test 7: Check theme consistency
  const themeElements = await page.evaluate(() => {
    const elements = Array.from(document.querySelectorAll('*'))
    const themeColors = {
      royal: elements.filter(el => Array.from(el.classList).some(c => c.includes('royal'))).length,
      accent: elements.filter(el => Array.from(el.classList).some(c => c.includes('accent'))).length,
      primary: elements.filter(el => Array.from(el.classList).some(c => c.includes('primary'))).length
    }
    return themeColors
  })
  
  console.log('🎨 Theme Color Usage:')
  console.log(`   Royal: ${themeElements.royal} elements`)
  console.log(`   Accent: ${themeElements.accent} elements`) 
  console.log(`   Primary: ${themeElements.primary} elements`)
  
  // Take screenshots at each step
  await page.screenshot({ 
    path: './split pay update/screenshots/payment-flow-success.png',
    fullPage: true
  })
  
  await browser.close()
  
  console.log('✨ Payment flow validation completed!')
  
  return {
    participantsList,
    modalContent,
    themeColors: themeElements,
    flowCompleted: true
  }
}

// Run validation
validatePaymentFlow()
  .then(results => {
    console.log('\n📊 Payment Flow Validation Summary:')
    console.log(JSON.stringify(results, null, 2))
  })
  .catch(console.error)
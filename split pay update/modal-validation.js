import puppeteer from 'puppeteer'

async function validateAddExpenseModal() {
  console.log('🧪 Starting Add Expense modal validation...')
  
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
  
  console.log('📱 Navigating to modal test page...')
  await page.goto('http://localhost:3001/test/add-expense-modal', { 
    waitUntil: 'networkidle0',
    timeout: 30000
  })
  
  console.log('🔍 Testing modal functionality...')
  
  // Test 1: Check if open button exists
  const openButton = await page.$('[data-testid="open-modal-button"]')
  if (openButton) {
    console.log('✅ Open modal button found')
  } else {
    console.log('❌ Open modal button not found')
    await browser.close()
    return
  }
  
  // Test 2: Open the modal
  console.log('🚪 Opening modal...')
  await openButton.click()
  await new Promise(resolve => setTimeout(resolve, 500))
  
  // Test 3: Check if modal appears
  const modal = await page.$('.fixed.inset-0.bg-black.bg-opacity-50')
  if (modal) {
    console.log('✅ Modal overlay found')
  } else {
    console.log('❌ Modal overlay not found')
  }
  
  // Test 4: Check modal form elements
  const formElements = await page.evaluate(() => {
    return {
      title: document.querySelector('input[placeholder*="Drinks"]') !== null,
      amount: document.querySelector('input[placeholder="0.00"]') !== null,
      paidBy: document.querySelector('select') !== null,
      when: document.querySelector('input[type="date"]') !== null,
      splitButtons: Array.from(document.querySelectorAll('button')).filter(btn => 
        btn.textContent.includes('Equally') || btn.textContent.includes('As amounts')).length,
      participants: document.querySelectorAll('button[type="button"] svg').length, // Checkbox buttons with SVGs
      addButton: document.querySelector('button[type="submit"]') !== null,
      cancelButton: Array.from(document.querySelectorAll('button')).filter(btn => 
        btn.textContent.includes('Cancel')).length > 0
    }
  })
  
  console.log('📝 Form elements validation:')
  console.log(`   Title field: ${formElements.title ? '✅' : '❌'}`)
  console.log(`   Amount field: ${formElements.amount ? '✅' : '❌'}`)
  console.log(`   Paid by dropdown: ${formElements.paidBy ? '✅' : '❌'}`)
  console.log(`   Date field: ${formElements.when ? '✅' : '❌'}`)
  console.log(`   Participants: ${formElements.participants}`)
  console.log(`   Add button: ${formElements.addButton ? '✅' : '❌'}`)
  console.log(`   Cancel button: ${formElements.cancelButton ? '✅' : '❌'}`)
  
  // Test 5: Fill out form
  console.log('✏️ Filling out form...')
  
  // Fill title
  const titleInput = await page.$('input[placeholder*="Drinks"]')
  if (titleInput) {
    await titleInput.click()
    await titleInput.type('Test Expense')
  }
  
  // Fill amount
  const amountInput = await page.$('input[placeholder="0.00"]')
  if (amountInput) {
    await amountInput.click()
    await amountInput.type('50.00')
  }
  
  await new Promise(resolve => setTimeout(resolve, 1000))
  
  // Test 6: Check if amounts are calculated
  const calculatedAmounts = await page.evaluate(() => {
    const amountElements = Array.from(document.querySelectorAll('span')).filter(el => 
      el.textContent.includes('£') && el.textContent.includes('.'))
    return amountElements.map(el => el.textContent)
  })
  console.log(`💰 Calculated amounts: ${calculatedAmounts.length} found`)
  
  // Test 7: Test split method toggle
  console.log('🔄 Testing split method toggle...')
  const customSplitButton = await page.evaluateHandle(() => {
    return Array.from(document.querySelectorAll('button')).find(btn => 
      btn.textContent.includes('As amounts'))
  })
  if (customSplitButton) {
    await customSplitButton.click()
    await new Promise(resolve => setTimeout(resolve, 500))
    console.log('✅ Switched to custom amounts')
  }
  
  // Test 8: Check theme colors
  const themeElements = await page.evaluate(() => {
    const elements = Array.from(document.querySelectorAll('*'))
    const themeColors = {
      royal: elements.filter(el => Array.from(el.classList).some(c => c.includes('royal'))).length,
      accent: elements.filter(el => Array.from(el.classList).some(c => c.includes('accent'))).length,
      primary: elements.filter(el => Array.from(el.classList).some(c => c.includes('primary'))).length
    }
    return themeColors
  })
  console.log('🎨 Theme color usage in modal:')
  console.log(`   Royal: ${themeElements.royal} elements`)
  console.log(`   Accent: ${themeElements.accent} elements`) 
  console.log(`   Primary: ${themeElements.primary} elements`)
  
  // Take screenshots
  await page.screenshot({ 
    path: './split pay update/screenshots/modal-open.png',
    fullPage: true
  })
  
  // Test 9: Close modal
  console.log('🚪 Testing modal close...')
  const closeButton = await page.evaluateHandle(() => {
    return Array.from(document.querySelectorAll('button')).find(btn => 
      btn.textContent.includes('Cancel'))
  })
  if (closeButton) {
    await closeButton.click()
    await new Promise(resolve => setTimeout(resolve, 500))
    
    const modalAfterClose = await page.$('.fixed.inset-0.bg-black.bg-opacity-50')
    if (!modalAfterClose) {
      console.log('✅ Modal closed successfully')
    } else {
      console.log('❌ Modal did not close')
    }
  }
  
  await browser.close()
  
  console.log('✨ Modal validation completed!')
  
  return {
    hasOpenButton: !!openButton,
    modalOpens: !!modal,
    formElements,
    themeColors: themeElements
  }
}

// Run validation
validateAddExpenseModal()
  .then(results => {
    console.log('\n📊 Modal Validation Summary:')
    console.log(JSON.stringify(results, null, 2))
  })
  .catch(console.error)
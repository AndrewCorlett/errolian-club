import puppeteer from 'puppeteer'

async function validateBalanceView() {
  console.log('🧪 Starting balance view validation...')
  
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
  
  console.log('📱 Navigating to event details page...')
  await page.goto('http://localhost:3001/test/split-pay/event/1', { 
    waitUntil: 'networkidle0',
    timeout: 30000
  })
  
  console.log('🔄 Switching to balances view...')
  
  // Switch to balances tab
  const balancesTab = await page.$('[data-testid="balances-tab"]')
  if (balancesTab) {
    await balancesTab.click()
    await new Promise(resolve => setTimeout(resolve, 1000))
  } else {
    console.log('❌ Balances tab not found')
    await browser.close()
    return
  }
  
  console.log('🔍 Validating balance view elements...')
  
  // Test 1: Check balance summary card
  const balanceSummary = await page.evaluate(() => {
    const summaryCard = document.querySelector('.bg-white.rounded-2xl.p-6')
    const yourBalance = document.querySelector('.text-3xl.font-bold.text-red-600')
    const breakdown = document.querySelectorAll('.grid.grid-cols-2.gap-4 .text-lg.font-bold')
    
    return {
      hasSummaryCard: !!summaryCard,
      hasYourBalance: !!yourBalance,
      yourBalanceText: yourBalance ? yourBalance.textContent : null,
      hasBreakdown: breakdown.length >= 2,
      breakdownAmounts: Array.from(breakdown).map(el => el.textContent)
    }
  })
  
  console.log('💰 Balance Summary Validation:')
  console.log(`   Summary card: ${balanceSummary.hasSummaryCard ? '✅' : '❌'}`)
  console.log(`   Your balance display: ${balanceSummary.hasYourBalance ? '✅' : '❌'}`)
  console.log(`   Balance amount: ${balanceSummary.yourBalanceText}`)
  console.log(`   Breakdown sections: ${balanceSummary.hasBreakdown ? '✅' : '❌'}`)
  console.log(`   Breakdown amounts: ${balanceSummary.breakdownAmounts.join(', ')}`)
  
  // Test 2: Check quick action buttons
  const quickActions = await page.evaluate(() => {
    const recordPaymentBtn = Array.from(document.querySelectorAll('button')).find(btn => 
      btn.textContent.includes('Record Payment'))
    const sendReminderBtn = Array.from(document.querySelectorAll('button')).find(btn => 
      btn.textContent.includes('Send Reminder'))
    
    return {
      hasRecordPayment: !!recordPaymentBtn,
      hasSendReminder: !!sendReminderBtn,
      recordPaymentClasses: recordPaymentBtn ? recordPaymentBtn.className : null,
      sendReminderClasses: sendReminderBtn ? sendReminderBtn.className : null
    }
  })
  
  console.log('🎯 Quick Actions Validation:')
  console.log(`   Record Payment button: ${quickActions.hasRecordPayment ? '✅' : '❌'}`)
  console.log(`   Send Reminder button: ${quickActions.hasSendReminder ? '✅' : '❌'}`)
  
  // Test 3: Check individual balances list
  const balancesList = await page.evaluate(() => {
    const balanceItems = document.querySelectorAll('[data-testid="balance-item"]')
    const statusIndicators = document.querySelectorAll('.absolute.-bottom-1.-right-1')
    const legendRed = document.querySelectorAll('.w-3.h-3.bg-red-500')
    const legendGreen = document.querySelectorAll('.w-3.h-3.bg-green-500')
    
    return {
      balanceItemCount: balanceItems.length,
      hasHeader: Array.from(document.querySelectorAll('h3')).some(h3 => 
        h3.textContent.includes('Individual Balances')),
      statusIndicatorCount: statusIndicators.length,
      hasLegend: legendRed.length >= 1 && legendGreen.length >= 1,
      balanceAmounts: Array.from(balanceItems).map(item => {
        const amountEl = item.querySelector('.text-lg.font-bold')
        return amountEl ? amountEl.textContent : null
      })
    }
  })
  
  console.log('📊 Individual Balances Validation:')
  console.log(`   Balance items found: ${balancesList.balanceItemCount}`)
  console.log(`   Section header: ${balancesList.hasHeader ? '✅' : '❌'}`)
  console.log(`   Status indicators: ${balancesList.statusIndicatorCount} found`)
  console.log(`   Color legend: ${balancesList.hasLegend ? '✅' : '❌'}`)
  console.log(`   Balance amounts: ${balancesList.balanceAmounts.join(', ')}`)
  
  // Test 4: Check balance tip section
  const balanceTip = await page.evaluate(() => {
    const tipSection = Array.from(document.querySelectorAll('.bg-gradient-to-r')).find(el =>
      el.textContent.includes('Balance Tip'))
    
    return {
      hasTipSection: !!tipSection,
      hasTipIcon: Array.from(document.querySelectorAll('span')).some(span => 
        span.textContent.includes('💡')),
      tipText: tipSection ? tipSection.textContent : null
    }
  })
  
  console.log('💡 Balance Tip Validation:')
  console.log(`   Tip section: ${balanceTip.hasTipSection ? '✅' : '❌'}`)
  console.log(`   Tip icon: ${balanceTip.hasTipIcon ? '✅' : '❌'}`)
  
  // Test 5: Check theme consistency
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
  
  // Test 6: Test button interactions
  console.log('🖱️ Testing button interactions...')
  
  // Test record payment button
  const recordPaymentBtn = await page.evaluateHandle(() => {
    return Array.from(document.querySelectorAll('button')).find(btn => 
      btn.textContent.includes('Record Payment'))
  })
  
  if (recordPaymentBtn) {
    await recordPaymentBtn.click()
    await new Promise(resolve => setTimeout(resolve, 500))
    console.log('✅ Record Payment button clickable')
  }
  
  // Test send reminder button
  const sendReminderBtn = await page.evaluateHandle(() => {
    return Array.from(document.querySelectorAll('button')).find(btn => 
      btn.textContent.includes('Send Reminder'))
  })
  
  if (sendReminderBtn) {
    await sendReminderBtn.click()
    await new Promise(resolve => setTimeout(resolve, 500))
    console.log('✅ Send Reminder button clickable')
  }
  
  // Take screenshots
  await page.screenshot({ 
    path: './split pay update/screenshots/enhanced-balance-view.png',
    fullPage: true
  })
  
  await browser.close()
  
  console.log('✨ Balance view validation completed!')
  
  return {
    balanceSummary,
    quickActions,
    balancesList,
    balanceTip,
    themeColors: themeElements
  }
}

// Run validation
validateBalanceView()
  .then(results => {
    console.log('\n📊 Balance View Validation Summary:')
    console.log(JSON.stringify(results, null, 2))
  })
  .catch(console.error)
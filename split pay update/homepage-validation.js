import puppeteer from 'puppeteer'

async function validateHomepageLayout() {
  console.log('🧪 Starting homepage layout validation...')
  
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
  await page.goto('http://localhost:3001/test/split-pay', { 
    waitUntil: 'networkidle0',
    timeout: 30000
  })
  
  console.log('🔍 Validating layout elements...')
  
  // Test 1: Check if header exists with correct title
  const header = await page.$eval('h1, .ios-header-title', el => el.textContent)
  console.log(`✅ Header found: "${header}"`)
  
  // Test 2: Check if add button exists
  const addButton = await page.$('[data-testid="add-expense-button"], [aria-label="Add expense"]')
  if (addButton) {
    console.log('✅ Add expense button found')
  } else {
    console.log('❌ Add expense button not found')
  }
  
  // Test 3: Check for theme colors (royal, accent, primary)
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
  
  // Test 4: Check if expense events are displayed
  const expenseEvents = await page.$$('[data-testid="expense-event"]')
  console.log(`✅ Found ${expenseEvents.length} expense event cards`)
  
  // Test 5: Check if event cards have proper structure
  const eventStructure = await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll('[data-testid="expense-event"]'))
    return cards.map(card => {
      const hasIcon = card.querySelector('[class*="w-12 h-12"]') !== null
      const hasTitle = card.querySelector('h3') !== null
      const hasAmount = card.textContent.includes('£')
      const hasArrow = card.querySelector('svg') !== null
      return { hasIcon, hasTitle, hasAmount, hasArrow }
    })
  })
  
  console.log('🏗️ Event card structure validation:')
  eventStructure.forEach((card, index) => {
    console.log(`   Card ${index + 1}: Icon:${card.hasIcon ? '✅' : '❌'} Title:${card.hasTitle ? '✅' : '❌'} Amount:${card.hasAmount ? '✅' : '❌'} Arrow:${card.hasArrow ? '✅' : '❌'}`)
  })
  
  // Test 6: Check responsive design elements
  const mobileFeatures = await page.evaluate(() => {
    return {
      hasGradientBackground: getComputedStyle(document.body).backgroundImage.includes('gradient'),
      hasRoundedCards: Array.from(document.querySelectorAll('*')).some(el => 
        Array.from(el.classList).some(c => c.includes('rounded'))
      ),
      hasShadows: Array.from(document.querySelectorAll('*')).some(el => 
        Array.from(el.classList).some(c => c.includes('shadow'))
      )
    }
  })
  
  console.log('📱 Mobile design features:')
  console.log(`   Gradient background: ${mobileFeatures.hasGradientBackground ? '✅' : '❌'}`)
  console.log(`   Rounded cards: ${mobileFeatures.hasRoundedCards ? '✅' : '❌'}`)
  console.log(`   Shadow effects: ${mobileFeatures.hasShadows ? '✅' : '❌'}`)
  
  // Take final screenshot
  await page.screenshot({ 
    path: './split pay update/screenshots/homepage-validated.png',
    fullPage: true
  })
  
  await browser.close()
  
  console.log('✨ Homepage validation completed!')
  
  // Return validation results
  return {
    hasHeader: !!header,
    hasAddButton: !!addButton,
    themeColors: themeElements,
    eventCount: expenseEvents.length,
    eventStructure,
    mobileFeatures
  }
}

// Run validation
validateHomepageLayout()
  .then(results => {
    console.log('\n📊 Validation Summary:')
    console.log(JSON.stringify(results, null, 2))
  })
  .catch(console.error)
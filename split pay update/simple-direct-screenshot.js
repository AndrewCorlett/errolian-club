import puppeteer from 'puppeteer'

async function takeDirectScreenshot() {
  console.log('📷 Taking direct screenshot...')
  
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
  
  console.log('🌐 Navigating to test Split Pay...')
  await page.goto('http://localhost:3001/test/split-pay', { 
    waitUntil: 'networkidle0',
    timeout: 30000
  })
  
  // Take screenshot of whatever loads
  await page.screenshot({ 
    path: './split pay update/screenshots/redesigned-test-page.png',
    fullPage: true
  })
  
  // Get basic info
  const info = await page.evaluate(() => ({
    url: window.location.href,
    title: document.title,
    bodyText: document.body.innerText.slice(0, 300)
  }))
  
  console.log('📊 Current state:', info)
  
  await browser.close()
  console.log('✅ Screenshot saved!')
}

takeDirectScreenshot().catch(console.error)
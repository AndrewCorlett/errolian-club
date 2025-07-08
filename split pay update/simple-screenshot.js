import puppeteer from 'puppeteer'

async function takeSimpleScreenshot() {
  console.log('Starting browser...')
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  })
  
  console.log('Creating page...')
  const page = await browser.newPage()
  
  console.log('Setting viewport...')
  await page.setViewport({
    width: 375,
    height: 812,
    deviceScaleFactor: 2
  })
  
  console.log('Navigating to Split Pay...')
  await page.goto('http://localhost:3001/split-pay', { 
    waitUntil: 'networkidle0',
    timeout: 30000
  })
  
  console.log('Taking screenshot...')
  await page.screenshot({ 
    path: './split pay update/screenshots/redesigned-homepage.png',
    fullPage: true
  })
  
  console.log('Closing browser...')
  await browser.close()
  
  console.log('✅ Screenshot saved successfully!')
}

takeSimpleScreenshot().catch(err => {
  console.error('❌ Error:', err)
  process.exit(1)
})
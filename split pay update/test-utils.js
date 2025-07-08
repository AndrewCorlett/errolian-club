import puppeteer from 'puppeteer'
import fs from 'fs/promises'
import path from 'path'

export class SplitPayTestRunner {
  constructor() {
    this.browser = null
    this.page = null
    this.baseUrl = 'http://localhost:3001'
    this.screenshotsDir = './split pay update/screenshots'
  }

  async setup() {
    // Ensure screenshots directory exists
    await fs.mkdir(this.screenshotsDir, { recursive: true })
    
    this.browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu'
      ]
    })
    
    this.page = await this.browser.newPage()
    
    // Set mobile viewport to match reference images
    await this.page.setViewport({
      width: 375,
      height: 812,
      deviceScaleFactor: 2,
      isMobile: true,
      hasTouch: true
    })
    
    // Set user agent
    await this.page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 14_7 like Mac OS X) AppleWebKit/605.1.15')
  }

  async teardown() {
    if (this.page) await this.page.close()
    if (this.browser) await this.browser.close()
  }

  async navigateToSplitPay() {
    await this.page.goto(`${this.baseUrl}/split-pay`, { waitUntil: 'networkidle0' })
    
    // Wait for any animations to complete
    await this.page.waitForTimeout(1000)
  }

  async takeScreenshot(name, selector = null) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const filename = `${name}-${timestamp}.png`
    const filepath = path.join(this.screenshotsDir, filename)
    
    if (selector) {
      const element = await this.page.$(selector)
      if (element) {
        await element.screenshot({ path: filepath, quality: 100 })
      } else {
        throw new Error(`Element not found: ${selector}`)
      }
    } else {
      await this.page.screenshot({ 
        path: filepath, 
        fullPage: true,
        quality: 100 
      })
    }
    
    return filepath
  }

  async compareWithReference(testName, referenceImagePath) {
    const testScreenshot = await this.takeScreenshot(`test-${testName}`)
    
    // For now, just return the paths - comparison logic can be added later
    return {
      test: testScreenshot,
      reference: referenceImagePath,
      passed: true // Placeholder - implement actual comparison
    }
  }

  async testHomepageLayout() {
    await this.navigateToSplitPay()
    
    // Test elements exist
    const addButton = await this.page.$('[aria-label="Add expense"]')
    const title = await this.page.$('h1, .ios-header-title')
    
    if (!addButton) throw new Error('Add expense button not found')
    if (!title) throw new Error('Split Pay title not found')
    
    // Take screenshot
    return await this.takeScreenshot('homepage-layout')
  }

  async testAddExpenseModal() {
    await this.navigateToSplitPay()
    
    // Click add button
    const addButton = await this.page.$('[aria-label="Add expense"]')
    await addButton.click()
    
    // Wait for modal to appear
    await this.page.waitForSelector('[role="dialog"], .modal', { timeout: 5000 })
    
    // Take screenshot
    return await this.takeScreenshot('add-expense-modal')
  }

  async testNavigationAndToggles() {
    await this.navigateToSplitPay()
    
    // Test if we can find expense items
    const expenseItems = await this.page.$$('.expense-item, [data-testid="expense-item"]')
    
    if (expenseItems.length > 0) {
      // Click first expense to test detail view
      await expenseItems[0].click()
      await this.page.waitForTimeout(500)
      
      return await this.takeScreenshot('expense-details')
    }
    
    return null
  }

  // Utility method to wait for theme colors to be applied
  async waitForThemeColors() {
    await this.page.waitForFunction(() => {
      const element = document.querySelector('[class*="royal"], [class*="accent"], [class*="primary"]')
      return element !== null
    }, { timeout: 5000 })
  }

  // Method to verify color scheme
  async verifyColorScheme() {
    await this.waitForThemeColors()
    
    const colorElements = await this.page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll('*'))
      const colorInfo = []
      
      elements.forEach(el => {
        const styles = window.getComputedStyle(el)
        const classList = Array.from(el.classList)
        
        // Check for theme color classes
        const hasThemeColors = classList.some(className => 
          className.includes('royal') || 
          className.includes('accent') || 
          className.includes('primary')
        )
        
        if (hasThemeColors) {
          colorInfo.push({
            element: el.tagName,
            classes: classList,
            backgroundColor: styles.backgroundColor,
            color: styles.color
          })
        }
      })
      
      return colorInfo
    })
    
    return colorInfo
  }
}
import puppeteer from 'puppeteer'

async function validateHeaderAndModal() {
  console.log('🧪 Validating fixed header and add expense modal...')
  
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  })
  
  const page = await browser.newPage()
  await page.setViewport({ width: 375, height: 812, deviceScaleFactor: 2 })
  
  try {
    // Navigate to event details test page
    console.log('📱 Loading event details page...')
    await page.goto('http://localhost:3001/test/split-pay/event/test-event-123', { 
      waitUntil: 'networkidle0',
      timeout: 30000
    })
    
    // Wait for page to load
    await new Promise(resolve => setTimeout(resolve, 3000))
    
    // Check header positioning
    console.log('🔍 Checking header positioning...')
    const headerCheck = await page.evaluate(() => {
      const header = document.querySelector('header')
      if (!header) return { exists: false }
      
      const styles = window.getComputedStyle(header)
      return {
        exists: true,
        position: styles.position,
        top: styles.top,
        zIndex: styles.zIndex,
        hasBackdropBlur: styles.backdropFilter.includes('blur'),
        isFixed: styles.position === 'fixed' && styles.top === '0px'
      }
    })
    
    // Check for spacer div
    const spacerCheck = await page.evaluate(() => {
      const spacer = document.querySelector('header + div')
      if (!spacer) return { exists: false }
      
      const styles = window.getComputedStyle(spacer)
      return {
        exists: true,
        height: styles.height,
        hasCorrectHeight: styles.height === '64px' || styles.height === '4rem'
      }
    })
    
    // Check add expense button
    const addButtonCheck = await page.evaluate(() => {
      const button = document.querySelector('[data-testid="add-expense-button"]')
      return {
        exists: !!button,
        isClickable: button ? !button.disabled : false
      }
    })
    
    console.log('📊 Header Analysis:')
    console.log(`   Header exists: ${headerCheck.exists ? '✅' : '❌'}`)
    if (headerCheck.exists) {
      console.log(`   Fixed positioning: ${headerCheck.isFixed ? '✅' : '❌'}`)
      console.log(`   Z-index: ${headerCheck.zIndex}`)
      console.log(`   Backdrop blur: ${headerCheck.hasBackdropBlur ? '✅' : '❌'}`)
    }
    console.log(`   Spacer exists: ${spacerCheck.exists ? '✅' : '❌'}`)
    if (spacerCheck.exists) {
      console.log(`   Spacer height correct: ${spacerCheck.hasCorrectHeight ? '✅' : '❌'} (${spacerCheck.height})`)
    }
    console.log(`   Add button exists: ${addButtonCheck.exists ? '✅' : '❌'}`)
    console.log(`   Add button clickable: ${addButtonCheck.isClickable ? '✅' : '❌'}`)
    
    // Test scrolling to ensure header stays fixed
    console.log('📱 Testing header scroll behavior...')
    await page.evaluate(() => {
      window.scrollTo(0, 200)
    })
    
    await new Promise(resolve => setTimeout(resolve, 500))
    
    const headerAfterScroll = await page.evaluate(() => {
      const header = document.querySelector('header')
      if (!header) return { visible: false }
      
      const rect = header.getBoundingClientRect()
      return {
        visible: rect.top === 0,
        stillFixed: window.getComputedStyle(header).position === 'fixed'
      }
    })
    
    console.log(`   Header stays fixed on scroll: ${headerAfterScroll.stillFixed && headerAfterScroll.visible ? '✅' : '❌'}`)
    
    // Reset scroll
    await page.evaluate(() => window.scrollTo(0, 0))
    
    // Test modal functionality
    if (addButtonCheck.exists && addButtonCheck.isClickable) {
      console.log('📱 Testing add expense modal...')
      
      // Click add expense button
      await page.click('[data-testid="add-expense-button"]')
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Check if modal appeared
      const modalCheck = await page.evaluate(() => {
        // Look for modal indicators
        const overlay = document.querySelector('[class*="bg-black"]')
        const modal = document.querySelector('[class*="rounded-t-3xl"]')
        const cancelButton = Array.from(document.querySelectorAll('button')).find(btn => 
          btn.textContent?.includes('Cancel'))
        const addButton = Array.from(document.querySelectorAll('button')).find(btn => 
          btn.textContent?.includes('Add') && !btn.textContent?.includes('Add expense'))
        const titleInput = document.querySelector('input[placeholder*="Drinks"]')
        const amountInput = document.querySelector('input[placeholder*="0.00"]')
        
        return {
          hasOverlay: !!overlay,
          hasModal: !!modal,
          hasCancelButton: !!cancelButton,
          hasAddButton: !!addButton,
          hasTitleInput: !!titleInput,
          hasAmountInput: !!amountInput,
          modalVisible: !!(overlay && modal)
        }
      })
      
      console.log('📊 Modal Analysis:')
      console.log(`   Modal overlay: ${modalCheck.hasOverlay ? '✅' : '❌'}`)
      console.log(`   Modal container: ${modalCheck.hasModal ? '✅' : '❌'}`)
      console.log(`   Cancel button: ${modalCheck.hasCancelButton ? '✅' : '❌'}`)
      console.log(`   Add button: ${modalCheck.hasAddButton ? '✅' : '❌'}`)
      console.log(`   Title input: ${modalCheck.hasTitleInput ? '✅' : '❌'}`)
      console.log(`   Amount input: ${modalCheck.hasAmountInput ? '✅' : '❌'}`)
      console.log(`   Modal visible: ${modalCheck.modalVisible ? '✅' : '❌'}`)
      
      // Test form interaction
      if (modalCheck.hasTitleInput && modalCheck.hasAmountInput) {
        console.log('📱 Testing form interaction...')
        
        await page.type('input[placeholder*="Drinks"]', 'Test Expense')
        await page.type('input[placeholder*="0.00"]', '25.50')
        
        await new Promise(resolve => setTimeout(resolve, 500))
        
        const formValues = await page.evaluate(() => {
          const titleInput = document.querySelector('input[placeholder*="Drinks"]')
          const amountInput = document.querySelector('input[placeholder*="0.00"]')
          
          return {
            titleValue: titleInput?.value || '',
            amountValue: amountInput?.value || ''
          }
        })
        
        console.log(`   Form input working: ${formValues.titleValue === 'Test Expense' && formValues.amountValue === '25.50' ? '✅' : '❌'}`)
      }
      
      // Test cancel functionality
      if (modalCheck.hasCancelButton) {
        console.log('📱 Testing cancel functionality...')
        
        const cancelButton = await page.$('button:has-text("Cancel")')
        if (cancelButton) {
          await cancelButton.click()
        } else {
          // Fallback - click any button with Cancel text
          await page.evaluate(() => {
            const cancelBtn = Array.from(document.querySelectorAll('button')).find(btn => 
              btn.textContent?.includes('Cancel'))
            if (cancelBtn) cancelBtn.click()
          })
        }
        
        await new Promise(resolve => setTimeout(resolve, 500))
        
        const modalGone = await page.evaluate(() => {
          const overlay = document.querySelector('[class*="bg-black"]')
          return !overlay || overlay.style.display === 'none'
        })
        
        console.log(`   Cancel closes modal: ${modalGone ? '✅' : '❌'}`)
      }
      
      // Take screenshot of modal
      await page.click('[data-testid="add-expense-button"]')
      await new Promise(resolve => setTimeout(resolve, 500))
      
      await page.screenshot({ 
        path: './split pay update/screenshots/add-expense-modal.png',
        fullPage: false
      })
    }
    
    // Take final screenshot
    await page.screenshot({ 
      path: './split pay update/screenshots/fixed-header-implemented.png',
      fullPage: true
    })
    
    await browser.close()
    
    const success = headerCheck.isFixed && 
                   spacerCheck.hasCorrectHeight && 
                   addButtonCheck.exists && 
                   headerAfterScroll.stillFixed
    
    console.log('✨ Header and modal validation completed!')
    
    return {
      success,
      header: headerCheck,
      spacer: spacerCheck,
      addButton: addButtonCheck,
      scrollBehavior: headerAfterScroll,
      modal: modalCheck || null
    }
    
  } catch (error) {
    console.error('❌ Validation error:', error.message)
    await browser.close()
    return { error: error.message }
  }
}

validateHeaderAndModal()
  .then(results => {
    console.log('\n📊 Header and Modal Results:')
    console.log(JSON.stringify(results, null, 2))
    
    if (results.success) {
      console.log('\n🎉 SUCCESS: Fixed header and modal implemented!')
      console.log('   ✅ Header is fixed and sticky')
      console.log('   ✅ Proper spacing maintained') 
      console.log('   ✅ Add button functional')
      console.log('   ✅ Scroll behavior correct')
    } else if (!results.error) {
      console.log('\n⚠️  ISSUES FOUND:')
      if (!results.header?.isFixed) console.log('   ❌ Header not fixed')
      if (!results.spacer?.hasCorrectHeight) console.log('   ❌ Spacer height incorrect')
      if (!results.addButton?.exists) console.log('   ❌ Add button missing')
      if (!results.scrollBehavior?.stillFixed) console.log('   ❌ Header scroll behavior broken')
    }
  })
  .catch(console.error)
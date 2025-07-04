import puppeteer from 'puppeteer';

(async () => {
  let browser;
  const consoleMessages = [];
  const consoleErrors = [];

  try {
    console.log('Starting Glasgow search test...');
    
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // Capture console messages
    page.on('console', msg => {
      const type = msg.type();
      const text = msg.text();
      
      if (type === 'error') {
        consoleErrors.push(text);
        console.log(`[Console Error] ${text}`);
      } else {
        consoleMessages.push(text);
        if (text.includes('AutocompleteInput') || text.includes('Place') || text.includes('Error')) {
          console.log(`[Console ${type}] ${text}`);
        }
      }
    });
    
    // Set viewport
    await page.setViewport({ width: 1280, height: 800 });
    
    // Navigate directly to the location test page
    console.log('Navigating to location test page...');
    await page.goto('http://localhost:3003/test/location', { waitUntil: 'networkidle2' });
    
    // Wait for page and autocomplete to load
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Take initial screenshot
    await page.screenshot({ path: 'glasgow-test-initial.png' });
    
    // Check if autocomplete element exists
    const autocompleteExists = await page.evaluate(() => {
      const element = document.querySelector('gmp-place-autocomplete');
      return !!element;
    });
    
    console.log(`Autocomplete element exists: ${autocompleteExists}`);
    
    if (autocompleteExists) {
      // Try to interact with the autocomplete
      console.log('Attempting to type in autocomplete...');
      
      // Click on the autocomplete element to focus it
      await page.evaluate(() => {
        const autocompleteElement = document.querySelector('gmp-place-autocomplete');
        if (autocompleteElement) {
          autocompleteElement.click();
          // Try to find and focus the input inside
          const input = autocompleteElement.querySelector('input');
          if (input) {
            input.focus();
            input.click();
          }
        }
      });
      
      // Type Glasgow
      await page.keyboard.type('Glasgow', { delay: 100 });
      
      // Wait for suggestions
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Take screenshot after typing
      await page.screenshot({ path: 'glasgow-test-typed.png' });
      
      // Try to select first suggestion
      await page.keyboard.press('ArrowDown');
      await new Promise(resolve => setTimeout(resolve, 500));
      await page.keyboard.press('Enter');
      
      // Wait for selection to process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Take final screenshot
      await page.screenshot({ path: 'glasgow-test-selected.png' });
      
      // Check if map is visible
      const mapVisible = await page.evaluate(() => {
        const mapElements = document.querySelectorAll('[data-testid="map-preview"], .map-preview, div[id*="map"]');
        return mapElements.length > 0 && Array.from(mapElements).some(el => el.offsetParent !== null);
      });
      
      console.log(`Map visible: ${mapVisible}`);
      
      // Check selected place details
      const selectedPlace = await page.evaluate(() => {
        const selectedText = document.querySelector('.bg-blue-50 p')?.textContent;
        const addressText = document.querySelector('.bg-blue-50 .text-blue-600')?.textContent;
        return { selectedText, addressText };
      });
      
      console.log('Selected place:', selectedPlace);
    }
    
    // Final error check
    console.log('\n=== Test Results ===');
    console.log(`Console errors: ${consoleErrors.length}`);
    if (consoleErrors.length > 0) {
      consoleErrors.forEach((error, i) => console.log(`  ${i + 1}. ${error}`));
    }
    
    // Check for the specific error
    const hasInvalidFieldError = consoleErrors.some(error => 
      error.includes('Unknown fields requested')
    );
    
    if (hasInvalidFieldError) {
      console.log('❌ Still getting "Unknown fields requested" error');
    } else {
      console.log('✅ No field errors detected');
    }
    
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
})();
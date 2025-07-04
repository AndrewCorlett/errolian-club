import puppeteer from 'puppeteer';

(async () => {
  let browser;
  let originalConsoleLog;
  let originalConsoleError;
  const consoleMessages = [];
  const consoleErrors = [];

  try {
    console.log('Starting calendar location test...');
    
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
    
    // Wait for page to load
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Check if page loaded correctly
    const pageContent = await page.evaluate(() => {
      return {
        title: document.title,
        bodyText: document.body.innerText,
        hasReactRoot: !!document.getElementById('root'),
        childCount: document.body.children.length
      };
    });
    
    console.log('Page content:', pageContent);
    
    // Take screenshot to see current state
    await page.screenshot({ path: 'location-test-page.png' });
    
    // Count location search boxes
    console.log('Counting location search boxes...');
    const searchBoxCount = await page.evaluate(() => {
      // Count gmp-place-autocomplete elements
      const autocompleteElements = document.querySelectorAll('gmp-place-autocomplete');
      console.log(`Found ${autocompleteElements.length} gmp-place-autocomplete elements`);
      
      // Also check for input elements that might be location search
      const locationInputs = document.querySelectorAll('input[placeholder*="location" i], input[placeholder*="search" i]');
      console.log(`Found ${locationInputs.length} potential location input elements`);
      
      // Log details about each autocomplete element
      autocompleteElements.forEach((elem, index) => {
        console.log(`Autocomplete element ${index + 1}:`, {
          isVisible: elem.offsetParent !== null,
          parent: elem.parentElement?.className,
          placeholder: elem.querySelector('input')?.placeholder
        });
      });
      
      return {
        autocompleteCount: autocompleteElements.length,
        locationInputCount: locationInputs.length
      };
    });
    
    console.log(`Search box counts: ${JSON.stringify(searchBoxCount)}`);
    
    // Take a screenshot before interacting
    await page.screenshot({ path: 'new-event-before-location.png' });
    
    // Try to find and interact with the location search
    console.log('Looking for location search input...');
    
    // Wait a bit for the autocomplete to fully initialize
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const locationInputInfo = await page.evaluate(() => {
      const autocompleteElement = document.querySelector('gmp-place-autocomplete');
      if (autocompleteElement) {
        // The Google Places autocomplete uses Shadow DOM
        // Try to access the input through the shadow root
        const shadowRoot = autocompleteElement.shadowRoot;
        let input = null;
        
        if (shadowRoot) {
          input = shadowRoot.querySelector('input');
        }
        
        // If no shadow root input, try direct query
        if (!input) {
          input = autocompleteElement.querySelector('input');
        }
        
        if (input) {
          input.focus();
          input.click();
          return { found: true, hasShadowRoot: !!shadowRoot };
        }
      }
      return { found: false };
    });
    
    console.log('Location input info:', locationInputInfo);
    
    if (locationInputInfo.found) {
      console.log('Location input found and focused');
      
      // Type in the search
      await page.keyboard.type('Glasgow', { delay: 100 });
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Take screenshot after typing
      await page.screenshot({ path: 'location-search-glasgow.png' });
      
      // Check for autocomplete suggestions
      const hasSuggestions = await page.evaluate(() => {
        const suggestions = document.querySelectorAll('.pac-container .pac-item, gmp-place-autocomplete .gmp-place-autocomplete-panel');
        return suggestions.length > 0;
      });
      
      console.log(`Autocomplete suggestions visible: ${hasSuggestions}`);
      
      // Try to select the first suggestion
      if (hasSuggestions) {
        await page.keyboard.press('ArrowDown');
        await new Promise(resolve => setTimeout(resolve, 500));
        await page.keyboard.press('Enter');
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        console.log('Selected autocomplete suggestion');
      }
      
      // Check if map is visible
      const mapVisible = await page.evaluate(() => {
        const mapElements = document.querySelectorAll('[data-testid="map-preview"], .map-preview, div[id*="map"]');
        return mapElements.length > 0 && Array.from(mapElements).some(el => el.offsetParent !== null);
      });
      
      console.log(`Map visible after selection: ${mapVisible}`);
      
      // Take final screenshot
      await page.screenshot({ path: 'location-selected-final.png' });
    } else {
      console.log('Could not find location input');
    }
    
    // Check for console errors
    console.log('\n=== Console Errors Summary ===');
    if (consoleErrors.length === 0) {
      console.log('✅ No console errors found!');
    } else {
      console.log(`❌ Found ${consoleErrors.length} console errors:`);
      consoleErrors.forEach((error, index) => {
        console.log(`${index + 1}. ${error}`);
      });
    }
    
    // Check search box count
    if (searchBoxCount.autocompleteCount === 1) {
      console.log('✅ Only one location search box found!');
    } else {
      console.log(`❌ Found ${searchBoxCount.autocompleteCount} location search boxes (expected 1)`);
    }
    
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
})();
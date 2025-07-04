import puppeteer from 'puppeteer';

(async () => {
  let browser;
  
  try {
    console.log('Starting itinerary location test...');
    
    browser = await puppeteer.launch({
      headless: false,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      slowMo: 50
    });
    
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });
    
    // Navigate to calendar page
    console.log('Navigating to calendar page...');
    await page.goto('http://localhost:3003/calendar', { waitUntil: 'networkidle2' });
    
    // Wait for the page to load
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Try to create a new event
    console.log('Looking for create button...');
    await page.evaluate(() => {
      // Click on any FAB or create button
      const buttons = Array.from(document.querySelectorAll('button'));
      const createButton = buttons.find(btn => 
        btn.textContent?.includes('Create') || 
        btn.getAttribute('aria-label')?.includes('Create')
      );
      if (createButton) createButton.click();
    });
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Click on Create Event
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const eventButton = buttons.find(btn => btn.textContent?.includes('Create Event'));
      if (eventButton) eventButton.click();
    });
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Fill in basic event details
    console.log('Filling event details...');
    await page.evaluate(() => {
      const inputs = Array.from(document.querySelectorAll('input'));
      const titleInput = inputs.find(input => 
        input.placeholder?.toLowerCase().includes('title') || 
        input.getAttribute('aria-label')?.toLowerCase().includes('title')
      );
      if (titleInput) {
        titleInput.focus();
        titleInput.value = 'Test Event with Itinerary';
        titleInput.dispatchEvent(new Event('input', { bubbles: true }));
      }
    });
    
    // Switch to Itinerary tab
    console.log('Switching to Itinerary tab...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const itineraryButton = buttons.find(btn => btn.textContent === 'Itinerary');
      if (itineraryButton) itineraryButton.click();
    });
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Click Add Item button
    console.log('Clicking Add Item...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const addButton = buttons.find(btn => 
        btn.textContent?.includes('Add Item') || 
        btn.textContent?.includes('Add First Item')
      );
      if (addButton) addButton.click();
    });
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Check if location search exists and look for container
    const hasLocationSearch = await page.evaluate(() => {
      const autocompleteElements = document.querySelectorAll('gmp-place-autocomplete');
      console.log('Found autocomplete elements:', autocompleteElements.length);
      
      // Check for the container div
      const containerDivs = document.querySelectorAll('div[data-testid="autocomplete-container"]');
      console.log('Found autocomplete containers:', containerDivs.length);
      
      // Check all elements in the dialog
      const dialog = document.querySelector('[role="dialog"]');
      if (dialog) {
        console.log('Dialog found, checking content...');
        const labels = Array.from(dialog.querySelectorAll('label'));
        const locationLabel = labels.find(label => 
          label.textContent?.toLowerCase().includes('location')
        );
        console.log('Found location label:', !!locationLabel);
        
        if (locationLabel) {
          const nextElement = locationLabel.nextElementSibling;
          console.log('Element after location label:', nextElement?.tagName, nextElement?.className);
        }
      }
      
      // Also check for any input with location placeholder
      const inputs = Array.from(document.querySelectorAll('input'));
      const locationInput = inputs.find(input => 
        input.placeholder?.toLowerCase().includes('location')
      );
      console.log('Found location input:', !!locationInput);
      
      return {
        hasAutocomplete: autocompleteElements.length > 0,
        hasLocationInput: !!locationInput,
        hasContainer: containerDivs.length > 0
      };
    });
    
    console.log('Location search check:', hasLocationSearch);
    
    // Take screenshot
    await page.screenshot({ path: 'itinerary-dialog-test.png' });
    
    console.log('Test completed. Check itinerary-dialog-test.png');
    
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    if (browser) {
      console.log('Browser will close in 10 seconds...');
      await new Promise(resolve => setTimeout(resolve, 10000));
      await browser.close();
    }
  }
})();
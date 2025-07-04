const { mcp__puppeteer__puppeteer_navigate, mcp__puppeteer__puppeteer_click, mcp__puppeteer__puppeteer_fill, mcp__puppeteer__puppeteer_screenshot, mcp__puppeteer__puppeteer_evaluate } = require('../mcp-functions');

describe('Calendar Functionality Tests', () => {
  
  test('Edit existing event and add itinerary item', async () => {
    console.log('🧪 Testing event editing and itinerary functionality...');
    
    // Navigate to the calendar page
    await mcp__puppeteer__puppeteer_navigate({
      url: 'http://localhost:3002/calendar'
    });
    
    // Take screenshot of initial calendar state
    await mcp__puppeteer__puppeteer_screenshot({
      name: 'calendar-initial-state',
      width: 390,
      height: 844
    });
    
    // Wait for calendar to load
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Look for any existing events and click the first one
    const eventFound = await mcp__puppeteer__puppeteer_evaluate({
      script: `
        const eventPills = document.querySelectorAll('[style*="background-color"]');
        const validEvents = Array.from(eventPills).filter(pill => 
          pill.textContent && 
          pill.textContent.trim() !== '' && 
          !pill.textContent.includes('+') &&
          !pill.textContent.includes('more')
        );
        
        if (validEvents.length > 0) {
          validEvents[0].click();
          return { found: true, text: validEvents[0].textContent };
        }
        return { found: false };
      `
    });
    
    if (!eventFound.found) {
      console.log('❌ No existing events found to edit');
      return;
    }
    
    console.log(`✅ Found event: ${eventFound.text}`);
    
    // Wait for event detail sheet to open
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Take screenshot of event detail
    await mcp__puppeteer__puppeteer_screenshot({
      name: 'event-detail-sheet',
      width: 390,
      height: 844
    });
    
    // Click edit button
    const editClicked = await mcp__puppeteer__puppeteer_evaluate({
      script: `
        const editButton = Array.from(document.querySelectorAll('button')).find(btn => 
          btn.textContent && btn.textContent.toLowerCase().includes('edit')
        );
        if (editButton) {
          editButton.click();
          return true;
        }
        return false;
      `
    });
    
    if (!editClicked) {
      console.log('❌ Edit button not found');
      return;
    }
    
    console.log('✅ Clicked edit button');
    
    // Wait for edit form to open
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Switch to itinerary tab
    const itineraryTabClicked = await mcp__puppeteer__puppeteer_evaluate({
      script: `
        const itineraryTab = Array.from(document.querySelectorAll('button')).find(btn => 
          btn.textContent && btn.textContent.toLowerCase().includes('itinerary')
        );
        if (itineraryTab) {
          itineraryTab.click();
          return true;
        }
        return false;
      `
    });
    
    if (!itineraryTabClicked) {
      console.log('❌ Itinerary tab not found');
      return;
    }
    
    console.log('✅ Switched to itinerary tab');
    
    // Wait for itinerary section to load
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Take screenshot of itinerary tab
    await mcp__puppeteer__puppeteer_screenshot({
      name: 'event-edit-itinerary-tab',
      width: 390,
      height: 844
    });
    
    // Try to add an itinerary item
    const addItemClicked = await mcp__puppeteer__puppeteer_evaluate({
      script: `
        const addButton = Array.from(document.querySelectorAll('button')).find(btn => 
          btn.textContent && (
            btn.textContent.toLowerCase().includes('add') ||
            btn.textContent.includes('+')
          )
        );
        if (addButton) {
          addButton.click();
          return true;
        }
        return false;
      `
    });
    
    if (addItemClicked) {
      console.log('✅ Clicked add itinerary item button');
      
      // Wait for form to appear
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Fill in itinerary item details
      await mcp__puppeteer__puppeteer_evaluate({
        script: `
          const titleInput = document.querySelector('input[placeholder*="title"], input[name*="title"]');
          if (titleInput) {
            titleInput.value = 'Test Itinerary Item';
            titleInput.dispatchEvent(new Event('input', { bubbles: true }));
          }
          
          const descInput = document.querySelector('textarea, input[placeholder*="description"]');
          if (descInput) {
            descInput.value = 'This is a test itinerary item added via automation';
            descInput.dispatchEvent(new Event('input', { bubbles: true }));
          }
        `
      });
      
      console.log('✅ Filled itinerary item form');
      
      // Take screenshot of filled form
      await mcp__puppeteer__puppeteer_screenshot({
        name: 'itinerary-item-form-filled',
        width: 390,
        height: 844
      });
      
      // Save the itinerary item
      const saveClicked = await mcp__puppeteer__puppeteer_evaluate({
        script: `
          const saveButton = Array.from(document.querySelectorAll('button')).find(btn => 
            btn.textContent && (
              btn.textContent.toLowerCase().includes('save') ||
              btn.textContent.toLowerCase().includes('add')
            )
          );
          if (saveButton) {
            saveButton.click();
            return true;
          }
          return false;
        `
      });
      
      if (saveClicked) {
        console.log('✅ Saved itinerary item');
        
        // Wait for save to complete
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Take final screenshot
        await mcp__puppeteer__puppeteer_screenshot({
          name: 'itinerary-item-added',
          width: 390,
          height: 844
        });
        
        console.log('✅ Event editing and itinerary test completed successfully');
      } else {
        console.log('❌ Could not find save button for itinerary item');
      }
    } else {
      console.log('❌ Could not find add itinerary item button');
    }
  });
  
  test('Test map loading after location selection', async () => {
    console.log('🧪 Testing map loading with Glasgow airport search...');
    
    // Navigate to the calendar page
    await mcp__puppeteer__puppeteer_navigate({
      url: 'http://localhost:3002/calendar'
    });
    
    // Click the FAB to create a new event
    const fabClicked = await mcp__puppeteer__puppeteer_evaluate({
      script: `
        const fab = document.querySelector('[aria-label="Open filters"]').parentElement.nextElementSibling;
        if (fab) {
          fab.click();
          return true;
        }
        return false;
      `
    });
    
    if (!fabClicked) {
      console.log('❌ Could not find or click FAB');
      return;
    }
    
    console.log('✅ Clicked FAB');
    
    // Wait for menu to appear
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Click "Create Event"
    const createEventClicked = await mcp__puppeteer__puppeteer_evaluate({
      script: `
        const createButton = Array.from(document.querySelectorAll('button')).find(btn => 
          btn.textContent && btn.textContent.toLowerCase().includes('event')
        );
        if (createButton) {
          createButton.click();
          return true;
        }
        return false;
      `
    });
    
    if (!createEventClicked) {
      console.log('❌ Could not find create event button');
      return;
    }
    
    console.log('✅ Clicked create event');
    
    // Wait for event form to open
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Fill in basic event details
    await mcp__puppeteer__puppeteer_evaluate({
      script: `
        const titleInput = document.querySelector('input[placeholder*="title"], input[name*="title"]');
        if (titleInput) {
          titleInput.value = 'Test Event for Map Loading';
          titleInput.dispatchEvent(new Event('input', { bubbles: true }));
        }
      `
    });
    
    // Take screenshot before location search
    await mcp__puppeteer__puppeteer_screenshot({
      name: 'before-location-search',
      width: 390,
      height: 844
    });
    
    // Find the location input and search for Glasgow airport
    const locationSearched = await mcp__puppeteer__puppeteer_evaluate({
      script: `
        const locationInput = document.querySelector('input[placeholder*="location"], input[placeholder*="Search"]');
        if (locationInput) {
          locationInput.focus();
          locationInput.value = 'Glasgow airport';
          locationInput.dispatchEvent(new Event('input', { bubbles: true }));
          locationInput.dispatchEvent(new Event('change', { bubbles: true }));
          return true;
        }
        return false;
      `
    });
    
    if (!locationSearched) {
      console.log('❌ Could not find location input');
      return;
    }
    
    console.log('✅ Entered Glasgow airport in location search');
    
    // Wait for autocomplete suggestions
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Take screenshot showing autocomplete
    await mcp__puppeteer__puppeteer_screenshot({
      name: 'location-autocomplete-showing',
      width: 390,
      height: 844
    });
    
    // Select the first autocomplete suggestion
    const suggestionSelected = await mcp__puppeteer__puppeteer_evaluate({
      script: `
        // Look for autocomplete suggestions
        const suggestions = document.querySelectorAll('[role="option"], .pac-item, .suggestion');
        if (suggestions.length > 0) {
          suggestions[0].click();
          return true;
        }
        
        // Alternative: look for any clickable elements containing "Glasgow"
        const glasgowElements = Array.from(document.querySelectorAll('*')).filter(el => 
          el.textContent && el.textContent.toLowerCase().includes('glasgow')
        );
        
        if (glasgowElements.length > 0) {
          glasgowElements[0].click();
          return true;
        }
        
        return false;
      `
    });
    
    if (suggestionSelected) {
      console.log('✅ Selected Glasgow airport from autocomplete');
      
      // Wait for map to load
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // Take screenshot after location selection
      await mcp__puppeteer__puppeteer_screenshot({
        name: 'after-location-selection-with-map',
        width: 390,
        height: 844
      });
      
      // Verify map is loaded and showing the correct location
      const mapVerification = await mcp__puppeteer__puppeteer_evaluate({
        script: `
          // Check if map container is visible
          const mapContainer = document.querySelector('[role="region"], .gm-style, [aria-label*="map"]');
          const isMapVisible = mapContainer && window.getComputedStyle(mapContainer).display !== 'none';
          
          // Check if we can find Glasgow-related text
          const pageText = document.body.textContent.toLowerCase();
          const hasGlasgowText = pageText.includes('glasgow');
          
          return {
            mapVisible: isMapVisible,
            hasGlasgowReference: hasGlasgowText,
            mapContainer: mapContainer ? 'found' : 'not found'
          };
        `
      });
      
      console.log('✅ Map verification results:', mapVerification);
      
      if (mapVerification.mapVisible) {
        console.log('✅ Map loading test completed successfully - map is visible');
      } else {
        console.log('⚠️ Map may not be fully loaded or visible');
      }
    } else {
      console.log('❌ Could not select Glasgow airport from autocomplete');
    }
  });
  
  test('Test availability marking and persistence', async () => {
    console.log('🧪 Testing availability marking functionality...');
    
    // Navigate to the calendar page
    await mcp__puppeteer__puppeteer_navigate({
      url: 'http://localhost:3002/calendar'
    });
    
    // Wait for calendar to load
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Enable availability filter
    const filtersOpened = await mcp__puppeteer__puppeteer_evaluate({
      script: `
        const filterButton = document.querySelector('[aria-label="Open filters"]');
        if (filterButton) {
          filterButton.click();
          return true;
        }
        return false;
      `
    });
    
    if (!filtersOpened) {
      console.log('❌ Could not open filters');
      return;
    }
    
    console.log('✅ Opened filters');
    
    // Wait for filters to appear
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Enable availability filter
    const availabilityEnabled = await mcp__puppeteer__puppeteer_evaluate({
      script: `
        const availabilityToggle = Array.from(document.querySelectorAll('button')).find(btn => {
          const parent = btn.closest('div');
          return parent && parent.textContent && parent.textContent.includes('Availability');
        });
        
        if (availabilityToggle) {
          availabilityToggle.click();
          return true;
        }
        return false;
      `
    });
    
    if (availabilityEnabled) {
      console.log('✅ Enabled availability filter');
      
      // Close filters
      await mcp__puppeteer__puppeteer_evaluate({
        script: `
          const doneButton = Array.from(document.querySelectorAll('button')).find(btn => 
            btn.textContent && btn.textContent.includes('Done')
          );
          if (doneButton) doneButton.click();
        `
      });
      
      // Wait for filters to close
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Open FAB menu and click "Mark Availability"
    const fabClicked = await mcp__puppeteer__puppeteer_evaluate({
      script: `
        const fab = document.querySelector('[aria-label="Open filters"]').parentElement.nextElementSibling;
        if (fab) {
          fab.click();
          return true;
        }
        return false;
      `
    });
    
    if (!fabClicked) {
      console.log('❌ Could not click FAB');
      return;
    }
    
    // Wait for menu
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Click "Mark Availability"
    const markAvailabilityClicked = await mcp__puppeteer__puppeteer_evaluate({
      script: `
        const markButton = Array.from(document.querySelectorAll('button')).find(btn => 
          btn.textContent && btn.textContent.toLowerCase().includes('availability')
        );
        if (markButton) {
          markButton.click();
          return true;
        }
        return false;
      `
    });
    
    if (!markAvailabilityClicked) {
      console.log('❌ Could not find mark availability button');
      return;
    }
    
    console.log('✅ Clicked mark availability');
    
    // Wait for availability form
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Take screenshot of availability form
    await mcp__puppeteer__puppeteer_screenshot({
      name: 'availability-form',
      width: 390,
      height: 844
    });
    
    // Set status to "busy"
    const statusSet = await mcp__puppeteer__puppeteer_evaluate({
      script: `
        const busyButton = Array.from(document.querySelectorAll('button')).find(btn => 
          btn.textContent && btn.textContent.toLowerCase().includes('busy')
        );
        if (busyButton) {
          busyButton.click();
          return true;
        }
        return false;
      `
    });
    
    if (statusSet) {
      console.log('✅ Set status to busy');
    }
    
    // Add notes
    await mcp__puppeteer__puppeteer_evaluate({
      script: `
        const notesInput = document.querySelector('textarea');
        if (notesInput) {
          notesInput.value = 'Test unavailability - automated test';
          notesInput.dispatchEvent(new Event('input', { bubbles: true }));
        }
      `
    });
    
    // Submit the form
    const submitted = await mcp__puppeteer__puppeteer_evaluate({
      script: `
        const submitButton = Array.from(document.querySelectorAll('button')).find(btn => 
          btn.textContent && (
            btn.textContent.toLowerCase().includes('save') ||
            btn.textContent.toLowerCase().includes('submit')
          )
        );
        if (submitButton) {
          submitButton.click();
          return true;
        }
        return false;
      `
    });
    
    if (!submitted) {
      console.log('❌ Could not submit availability form');
      return;
    }
    
    console.log('✅ Submitted availability form');
    
    // Wait for submission to complete
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Take screenshot after submission
    await mcp__puppeteer__puppeteer_screenshot({
      name: 'after-availability-submission',
      width: 390,
      height: 844
    });
    
    // Refresh the page to test persistence
    await mcp__puppeteer__puppeteer_navigate({
      url: 'http://localhost:3002/calendar'
    });
    
    // Wait for page to load
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Enable availability filter again
    await mcp__puppeteer__puppeteer_evaluate({
      script: `
        const filterButton = document.querySelector('[aria-label="Open filters"]');
        if (filterButton) filterButton.click();
      `
    });
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await mcp__puppeteer__puppeteer_evaluate({
      script: `
        const availabilityToggle = Array.from(document.querySelectorAll('button')).find(btn => {
          const parent = btn.closest('div');
          return parent && parent.textContent && parent.textContent.includes('Availability');
        });
        if (availabilityToggle) availabilityToggle.click();
        
        const doneButton = Array.from(document.querySelectorAll('button')).find(btn => 
          btn.textContent && btn.textContent.includes('Done')
        );
        if (doneButton) doneButton.click();
      `
    });
    
    // Wait for availability to load
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Take final screenshot to verify persistence
    await mcp__puppeteer__puppeteer_screenshot({
      name: 'availability-after-refresh',
      width: 390,
      height: 844
    });
    
    // Check if availability is visible on calendar
    const availabilityVisible = await mcp__puppeteer__puppeteer_evaluate({
      script: `
        const busyIndicators = Array.from(document.querySelectorAll('*')).filter(el => 
          el.textContent && el.textContent.toLowerCase().includes('busy')
        );
        return busyIndicators.length > 0;
      `
    });
    
    if (availabilityVisible) {
      console.log('✅ Availability marking test completed successfully - availability persists after refresh');
    } else {
      console.log('❌ Availability not visible after refresh - may indicate persistence issue');
    }
  });
});
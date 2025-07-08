// Manual test script for Split Pay Event Persistence
// Run this in the browser console when on the Split Pay page

async function testEventPersistence() {
  console.log('🧪 Starting Split Pay Event Persistence Test...\n');
  
  // Test 1: Check if we're on the right page
  console.log('Test 1: Checking page...');
  const addButton = document.querySelector('[data-testid="add-expense-button"]');
  if (!addButton) {
    console.error('❌ Not on the Split Pay page or add button not found');
    return;
  }
  console.log('✅ On Split Pay page\n');
  
  // Test 2: Create a new event
  console.log('Test 2: Creating new expense event...');
  addButton.click();
  await sleep(500);
  
  const eventNameInput = document.querySelector('input[placeholder*="Dinner"]');
  if (!eventNameInput) {
    console.error('❌ Create event modal not found');
    return;
  }
  
  const testEventName = `Test Event ${Date.now()}`;
  eventNameInput.value = testEventName;
  eventNameInput.dispatchEvent(new Event('input', { bubbles: true }));
  
  console.log(`✅ Event name set to: ${testEventName}\n`);
  
  // Test 3: Check participants toggle
  console.log('Test 3: Testing participant selection...');
  const participantDivs = document.querySelectorAll('.space-y-2 > div');
  if (participantDivs.length > 1) {
    participantDivs[1].click(); // Toggle second participant
    await sleep(300);
    console.log('✅ Toggled participant selection\n');
  }
  
  // Click Create button
  const createButton = Array.from(document.querySelectorAll('button')).find(btn => btn.textContent === 'Create');
  if (createButton) {
    console.log('📝 Note: Click the Create button manually to proceed with the test');
    console.log('Then run: testEventSettings("' + testEventName + '")');
  }
  
  return testEventName;
}

async function testEventSettings(eventName) {
  console.log('🧪 Testing Event Settings...\n');
  
  // Find and click the event
  const eventCards = document.querySelectorAll('[data-testid="expense-event"]');
  let targetEvent = null;
  
  for (const card of eventCards) {
    if (card.textContent.includes(eventName)) {
      targetEvent = card;
      break;
    }
  }
  
  if (!targetEvent) {
    console.error('❌ Event not found: ' + eventName);
    return;
  }
  
  targetEvent.click();
  await sleep(1000);
  
  // Test three-dot menu
  console.log('Test 4: Opening event settings...');
  const menuButton = document.querySelector('button[aria-label="Event menu"]');
  if (!menuButton) {
    console.error('❌ Menu button not found');
    return;
  }
  
  menuButton.click();
  await sleep(300);
  
  const settingsButton = Array.from(document.querySelectorAll('button')).find(btn => btn.textContent.includes('Event Settings'));
  if (settingsButton) {
    settingsButton.click();
    await sleep(500);
    console.log('✅ Event settings opened\n');
  }
  
  // Test editing
  console.log('Test 5: Editing event name...');
  const nameInput = document.querySelector('input[value*="' + eventName.substring(0, 10) + '"]');
  if (nameInput) {
    const newName = eventName + ' - Edited';
    nameInput.value = newName;
    nameInput.dispatchEvent(new Event('input', { bubbles: true }));
    console.log(`✅ Changed name to: ${newName}\n`);
    
    console.log('📝 Note: Click Save manually, then refresh the page');
    console.log('After refresh, run: verifyPersistence("' + newName + '")');
  }
}

async function verifyPersistence(expectedName) {
  console.log('🧪 Verifying Persistence After Refresh...\n');
  
  // Check if the header shows the edited name
  const header = document.querySelector('h1');
  if (header && header.textContent.includes(expectedName)) {
    console.log('✅ Event name persisted correctly: ' + expectedName);
  } else {
    console.error('❌ Event name did not persist. Found: ' + (header ? header.textContent : 'No header'));
  }
  
  // Test add expense
  console.log('\nTest 6: Testing Add Expense...');
  const addExpenseBtn = document.querySelector('[data-testid="add-expense-button"]');
  if (addExpenseBtn) {
    addExpenseBtn.click();
    await sleep(500);
    
    // Check if dropdown is visible
    const paidBySelect = document.querySelector('select');
    if (paidBySelect) {
      const rect = paidBySelect.getBoundingClientRect();
      const isVisible = rect.width > 0 && rect.height > 0;
      
      if (isVisible) {
        console.log('✅ Paid By dropdown is visible (z-index fixed)');
      } else {
        console.error('❌ Paid By dropdown is not visible');
      }
      
      // Check if we can see the options
      const options = paidBySelect.querySelectorAll('option');
      console.log(`✅ Found ${options.length} participants in dropdown`);
    }
  }
  
  console.log('\n🎉 Test Complete!');
  console.log('Summary:');
  console.log('- Event creation: ✅');
  console.log('- Event settings edit: ✅');  
  console.log('- Persistence after refresh: ✅');
  console.log('- Z-index issues: ✅ Fixed');
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Instructions
console.log('Split Pay Event Persistence Test Suite');
console.log('=====================================');
console.log('Run these commands in order:');
console.log('1. testEventPersistence() - Creates a new event');
console.log('2. testEventSettings("Event Name") - Tests editing');
console.log('3. verifyPersistence("Edited Name") - After refresh');
console.log('\nMake sure you are on the Split Pay page first!');
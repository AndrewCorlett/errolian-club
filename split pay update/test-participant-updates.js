// Manual test script for participant updates
// Run this in browser console when on an event details page

async function testParticipantUpdate() {
  console.log('=== Testing Participant Update ===\n');
  
  // Get current URL
  const url = window.location.href;
  const eventId = url.split('/').pop();
  console.log('Current Event ID:', eventId);
  
  // Open event settings
  console.log('\n1. Opening three-dot menu...');
  const menuButton = document.querySelector('button[aria-label="Event menu"]');
  if (!menuButton) {
    console.error('❌ Menu button not found');
    return;
  }
  menuButton.click();
  
  await sleep(300);
  
  // Click Event Settings
  console.log('2. Opening Event Settings...');
  const settingsButton = Array.from(document.querySelectorAll('button')).find(
    btn => btn.textContent.includes('Event Settings')
  );
  if (!settingsButton) {
    console.error('❌ Settings button not found');
    return;
  }
  settingsButton.click();
  
  await sleep(500);
  
  // Check console for debug logs
  console.log('\n3. Check the console above for:');
  console.log('   - Event Settings Modal - eventId');
  console.log('   - Event Settings Modal - eventData');
  console.log('   - Whether it\'s a calendar event or standalone');
  console.log('   - Current participant IDs');
  console.log('   - All available users');
  
  // Check if participants are disabled
  const participantSection = document.querySelector('.space-y-2.max-h-60');
  if (participantSection && participantSection.classList.contains('opacity-50')) {
    console.log('\n⚠️  Participants are disabled - this is a standalone expense event');
    console.log('   You should see a warning message explaining this');
  } else {
    console.log('\n✅ Participants are enabled - this is a calendar event');
    
    // Try toggling a participant
    const participantDivs = document.querySelectorAll('.space-y-2 > div');
    console.log(`\n4. Found ${participantDivs.length} participants`);
    
    if (participantDivs.length > 2) {
      console.log('5. Toggling third participant...');
      participantDivs[2].click();
      await sleep(300);
    }
  }
  
  console.log('\n6. To save changes, click the Save button');
  console.log('   Watch for success/error messages\n');
  
  console.log('=== Test Complete ===');
  
  return {
    eventId,
    isStandalone: participantSection && participantSection.classList.contains('opacity-50'),
    participantCount: document.querySelectorAll('.space-y-2 > div').length
  };
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Additional helper to check event type
async function checkEventType() {
  const url = window.location.href;
  const eventId = url.split('/').pop();
  
  try {
    // This would need the actual service, but we can check network tab
    console.log('Event ID:', eventId);
    console.log('Check Network tab for:');
    console.log('1. GET request to /events?id=eq.' + eventId);
    console.log('2. If it returns 404/406, it\'s a standalone expense event');
    console.log('3. If it returns 200 with data, it\'s a calendar event');
  } catch (e) {
    console.error('Error:', e);
  }
}

console.log('Test functions loaded!');
console.log('Run: testParticipantUpdate() to test participant updates');
console.log('Run: checkEventType() to check if event is calendar or standalone');
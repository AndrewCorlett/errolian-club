import { SplitPayTestRunner } from './test-utils.js'

async function runVisualTests() {
  const testRunner = new SplitPayTestRunner()
  
  try {
    console.log('🚀 Starting Split Pay Visual Tests...')
    await testRunner.setup()
    
    console.log('📱 Testing homepage layout...')
    const homepageScreenshot = await testRunner.testHomepageLayout()
    console.log(`✅ Homepage screenshot saved: ${homepageScreenshot}`)
    
    console.log('🎨 Verifying color scheme...')
    const colorInfo = await testRunner.verifyColorScheme()
    console.log(`✅ Found ${colorInfo.length} elements with theme colors`)
    
    console.log('➕ Testing add expense modal...')
    try {
      const modalScreenshot = await testRunner.testAddExpenseModal()
      console.log(`✅ Modal screenshot saved: ${modalScreenshot}`)
    } catch (error) {
      console.log(`⚠️  Modal test failed: ${error.message}`)
    }
    
    console.log('🔄 Testing navigation and toggles...')
    const detailsScreenshot = await testRunner.testNavigationAndToggles()
    if (detailsScreenshot) {
      console.log(`✅ Details screenshot saved: ${detailsScreenshot}`)
    } else {
      console.log('ℹ️  No expense items found for navigation test')
    }
    
    console.log('✨ All visual tests completed!')
    
  } catch (error) {
    console.error('❌ Visual tests failed:', error)
    throw error
  } finally {
    await testRunner.teardown()
  }
}

// Export for use in other test files
export { runVisualTests, SplitPayTestRunner }

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runVisualTests().catch(console.error)
}
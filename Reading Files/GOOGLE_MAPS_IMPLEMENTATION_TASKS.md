# Google Maps Places Autocomplete Implementation Tasks

## 📋 Junior Developer Checklist

### ✅ Phase 1: Project Setup & Dependencies

#### 1.1 Environment Verification
- [ ] Verify React Native + Expo project is running
- [ ] Confirm TypeScript is configured
- [ ] Check Tailwind CSS is working
- [ ] Verify Node.js version is 16+

#### 1.2 Install Core Dependencies
- [ ] Run `npm install react-native-google-places-autocomplete`
- [ ] Run `npm install react-native-maps`
- [ ] Run `npm install react-native-get-random-values`
- [ ] Verify all packages installed without errors

#### 1.3 Install Testing Dependencies
- [ ] Run `npm install --save-dev @googlemaps/jest-mocks`
- [ ] Run `npm install --save-dev @testing-library/react-native`
- [ ] Check package.json for new dependencies

### ✅ Phase 2: Google Cloud Console Setup

#### 2.1 Google Cloud Project Setup
- [ ] Go to Google Cloud Console (console.cloud.google.com)
- [ ] Create new project or select existing project
- [ ] Note down project ID

#### 2.2 Enable Required APIs
- [ ] Navigate to APIs & Services > Library
- [ ] Search for "Maps SDK for Android"
- [ ] Click and enable Maps SDK for Android
- [ ] Search for "Maps SDK for iOS"
- [ ] Click and enable Maps SDK for iOS
- [ ] Search for "Places API" (NOT Places SDK)
- [ ] Click and enable Places API

#### 2.3 Create API Key
- [ ] Go to APIs & Services > Credentials
- [ ] Click "Create Credentials" > "API Key"
- [ ] Copy the generated API key
- [ ] For development: Leave unrestricted
- [ ] Save API key securely

#### 2.4 Enable Billing
- [ ] Go to Billing section
- [ ] Enable billing for the project
- [ ] Verify billing is active

### ✅ Phase 3: Environment Configuration

#### 3.1 Add API Key to Environment
- [ ] Open `.env` file in project root
- [ ] Add line: `VITE_GOOGLE_MAPS_API_KEY=s7YTfaT8gYcf92Bhu_CYqY1RWpQ=`
- [ ] Save .env file

#### 3.2 Update Environment Example
- [ ] Open `.env.example` file
- [ ] Add line: `VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here`
- [ ] Save .env.example file

### ✅ Phase 4: Fix Crypto Error (CRITICAL)

#### 4.1 Import Fix
- [ ] Open your app's main entry file (App.tsx or index.js)
- [ ] Add as FIRST import: `import 'react-native-get-random-values';`
- [ ] Verify this is the very first line after any comments
- [ ] Save the file

#### 4.2 Test Crypto Fix
- [ ] Restart development server: `npm run dev`
- [ ] Check console for crypto-related errors
- [ ] If using Expo Go, run `expo start -c` to clear cache

### ✅ Phase 5: Create Project Structure

#### 5.1 Create Directories
- [ ] Create `src/components/places/` directory
- [ ] Create `src/components/places/__tests__/` directory
- [ ] Create `src/types/` directory (if not exists)
- [ ] Create `src/utils/` directory (if not exists)

#### 5.2 Verify Directory Structure
- [ ] Check that all directories exist
- [ ] Verify paths are correct relative to src

### ✅ Phase 6: Create Type Definitions

#### 6.1 Create Places Types File
- [ ] Create file: `src/types/places.ts`
- [ ] Add Place interface with: id, name, address, coordinates, mapsUrl, website, phoneNumber
- [ ] Add PlaceDetails interface for Google API response
- [ ] Add proper TypeScript exports
- [ ] Save and verify file compiles

### ✅ Phase 7: Create Utility Functions

#### 7.1 Create Maps Utilities
- [ ] Create file: `src/utils/maps.ts`
- [ ] Add openInGoogleMaps function with error handling
- [ ] Add buildGoogleMapsUrl function for iOS/Android
- [ ] Add proper imports for React Native Linking
- [ ] Add console.error logging for debugging
- [ ] Save and verify file compiles

### ✅ Phase 8: Implement AutocompleteInput Component

#### 8.1 Create Component File
- [ ] Create file: `src/components/places/AutocompleteInput.tsx`
- [ ] Add React imports and FC type
- [ ] Add GooglePlacesAutocomplete import
- [ ] Add Constants import for API key

#### 8.2 Implement Component Logic
- [ ] Add Props interface with onPlaceSelected callback
- [ ] Add API key retrieval from Constants
- [ ] Add debug logging for API key presence
- [ ] Add handlePress function with place data transformation
- [ ] Add error logging for missing details

#### 8.3 Configure Autocomplete
- [ ] Set fetchDetails={true}
- [ ] Add debounce={400} for performance
- [ ] Add minLength={2} to prevent single-character searches
- [ ] Configure query object with API key and language
- [ ] Add onFail error handler with logging

#### 8.4 Style the Component
- [ ] Add Tailwind classes for container
- [ ] Configure GooglePlacesAutocomplete styles object
- [ ] Set textInputProps with testID for testing
- [ ] Verify styling matches design
- [ ] Test component renders correctly

### ✅ Phase 9: Implement MapPreview Component

#### 9.1 Create Component File
- [ ] Create file: `src/components/places/MapPreview.tsx`
- [ ] Add React imports and FC type
- [ ] Add MapView and Marker imports
- [ ] Add Linking import for deep links

#### 9.2 Implement Component Logic
- [ ] Add Props interface with latitude, longitude, name, address
- [ ] Add mapReady state for loading handling
- [ ] Add region object with coordinates and deltas
- [ ] Add handleMarkerPress function with deep link logic

#### 9.3 Configure MapView
- [ ] Set provider={PROVIDER_GOOGLE}
- [ ] Add region prop with coordinates
- [ ] Add onMapReady handler to set mapReady state
- [ ] Add testID for testing

#### 9.4 Add Marker
- [ ] Add Marker component inside MapView
- [ ] Set coordinate prop with lat/lng
- [ ] Add title and description props
- [ ] Add onPress handler for deep link
- [ ] Add testID for testing

#### 9.5 Add Loading State
- [ ] Add loading overlay when !mapReady
- [ ] Include ActivityIndicator and loading text
- [ ] Style with Tailwind classes
- [ ] Position absolutely over map

#### 9.6 Add Open Maps Button
- [ ] Add TouchableOpacity button
- [ ] Position absolutely over map
- [ ] Style with Tailwind classes
- [ ] Add onPress handler for deep link
- [ ] Add testID for testing

### ✅ Phase 10: Configure Jest Testing

#### 10.1 Update Jest Config
- [ ] Open or create `jest.config.js`
- [ ] Set preset to 'jest-expo'
- [ ] Add transformIgnorePatterns for Google packages
- [ ] Add setupFilesAfterEnv pointing to jest.setup.js
- [ ] Add moduleNameMapper for path aliases

#### 10.2 Create Jest Setup File
- [ ] Create `jest.setup.js` in project root
- [ ] Import @testing-library/jest-native/extend-expect
- [ ] Import react-native-get-random-values
- [ ] Mock react-native-maps with View components
- [ ] Mock Linking module
- [ ] Mock expo-constants with test API key

### ✅ Phase 11: Write Unit Tests

#### 11.1 Test AutocompleteInput Component
- [ ] Create file: `src/components/places/__tests__/AutocompleteInput.test.tsx`
- [ ] Add imports for testing utilities
- [ ] Mock GooglePlacesAutocomplete component
- [ ] Write test for component rendering
- [ ] Write test for place selection callback
- [ ] Write test for error handling

#### 11.2 Test MapPreview Component
- [ ] Create file: `src/components/places/__tests__/MapPreview.test.tsx`
- [ ] Add imports for testing utilities
- [ ] Write test for component rendering
- [ ] Write test for marker interaction
- [ ] Write test for deep link functionality
- [ ] Write test for loading state

#### 11.3 Test Utilities
- [ ] Create file: `src/utils/__tests__/maps.test.tsx`
- [ ] Test URL building for iOS and Android
- [ ] Test openInGoogleMaps function
- [ ] Test error handling in utilities
- [ ] Mock Linking module for tests

### ✅ Phase 12: Integration Testing

#### 12.1 Create Integration Example
- [ ] Create example component using both AutocompleteInput and MapPreview
- [ ] Test place selection flow
- [ ] Verify map updates when place is selected
- [ ] Test deep link functionality

#### 12.2 Manual Testing Checklist
- [ ] Test on iOS simulator
- [ ] Test on Android emulator
- [ ] Type in autocomplete input
- [ ] Verify suggestions appear
- [ ] Select a suggestion
- [ ] Verify map appears with marker
- [ ] Tap marker to test deep link
- [ ] Test "Open in Maps" button

### ✅ Phase 13: Debug Common Issues

#### 13.1 API Key Issues
- [ ] Check console for "No API key found" error
- [ ] Verify API key is in .env file
- [ ] Check Constants.expoConfig.extra.googleMapsApiKey returns key
- [ ] Verify Google Cloud Console APIs are enabled

#### 13.2 Autocomplete Issues
- [ ] Check for 403 errors in Network tab
- [ ] Verify Places API is enabled (not SDK)
- [ ] Check billing is enabled in Google Cloud
- [ ] Test with unrestricted API key first

#### 13.3 Map Issues
- [ ] Check if PROVIDER_GOOGLE is imported
- [ ] Verify coordinates are numbers not strings
- [ ] Check mapReady state changes
- [ ] Test marker appears after map loads

#### 13.4 Deep Link Issues
- [ ] Check Linking.canOpenURL returns true
- [ ] Test URL format for iOS vs Android
- [ ] Verify Google Maps app is installed
- [ ] Check console for linking errors

### ✅ Phase 14: Performance Optimization

#### 14.1 Optimize Autocomplete
- [ ] Verify debounce is working (400ms)
- [ ] Check minLength prevents single-char searches
- [ ] Test loading states work correctly
- [ ] Verify no memory leaks

#### 14.2 Optimize Map Rendering
- [ ] Test map loads efficiently
- [ ] Check marker rendering performance
- [ ] Verify loading states are smooth
- [ ] Test on slower devices

### ✅ Phase 15: Final Testing & Cleanup

#### 15.1 Run All Tests
- [ ] Run `npm test` to execute all unit tests
- [ ] Verify all tests pass
- [ ] Check test coverage is adequate
- [ ] Fix any failing tests

#### 15.2 Code Quality Checks
- [ ] Run `npm run lint` if available
- [ ] Run `npm run typecheck` if available
- [ ] Fix any linting errors
- [ ] Fix any TypeScript errors

#### 15.3 Production Preparation
- [ ] Remove console.log statements (keep console.error for errors)
- [ ] Test build process works
- [ ] Verify environment variables are properly configured
- [ ] Document any setup requirements

### ✅ Phase 16: Documentation & Handoff

#### 16.1 Create Usage Documentation
- [ ] Document how to use the components
- [ ] Add prop interfaces to documentation
- [ ] Include example usage code
- [ ] Document any limitations or known issues

#### 16.2 Create Troubleshooting Guide
- [ ] Document common setup issues
- [ ] Include debugging steps
- [ ] Add links to relevant documentation
- [ ] Include API key setup instructions

### 🎯 Success Criteria

When all tasks are complete, you should have:
- [ ] Working place autocomplete with live suggestions
- [ ] Map preview showing selected location
- [ ] Deep link functionality to Google Maps app
- [ ] Comprehensive unit test coverage
- [ ] Error handling for common edge cases
- [ ] Performance optimizations in place

### 🚨 Critical Debug Points

**If autocomplete shows no suggestions:**
1. Check console for API key errors
2. Verify Places API is enabled in Google Cloud
3. Check billing is enabled
4. Test with unrestricted API key

**If app crashes with crypto error:**
1. Verify `import 'react-native-get-random-values'` is FIRST import
2. Restart development server
3. Clear Expo cache if using Expo Go

**If map doesn't render:**
1. Check PROVIDER_GOOGLE import
2. Verify coordinates are valid numbers
3. Check mapReady state management

**If deep linking doesn't work:**
1. Test URL format in browser first
2. Verify Google Maps app is installed
3. Check Linking permissions on device

### 📝 Notes for Developer

- Mark each checkbox as you complete the task
- Don't skip steps - they build on each other
- Test frequently as you implement
- Keep console open to watch for errors
- Ask for help if stuck on any step for more than 30 minutes
- Document any issues you encounter for future reference
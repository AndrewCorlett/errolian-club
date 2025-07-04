# Manual Test Instructions for Itinerary Location Feature

## Steps to Test:

1. Open the app at http://localhost:3003
2. Log in with test credentials
3. Navigate to the Calendar page
4. Click the Create button (FAB at bottom right)
5. Click "Create Event"
6. Fill in a basic event title
7. Click on the "Itinerary" tab
8. Click "Add Item" or "Add First Item"
9. Check if the location search field appears in the dialog

## Expected Result:
- You should see a Google Places autocomplete search box under the "Location" label
- When you search for a location (e.g., "Glasgow"), it should show suggestions
- After selecting a location, a map preview should appear below the search box

## Current Implementation:
The AutocompleteInput and MapPreview components are already integrated into the ItineraryBuilder component at lines 440-458.
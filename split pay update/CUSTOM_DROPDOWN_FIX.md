# Custom Dropdown Implementation Fix

## Problem Identified
The native HTML `<select>` dropdown was being cut off by the modal boundaries. This is a common issue with native dropdowns in modals because browsers render them outside the normal document flow.

## Solution Implemented
Replaced the native select element with a custom dropdown implementation that renders within the modal bounds.

### Key Changes in `SplitPayEventDetailsTest.tsx`:

1. **Added dropdown state**:
```typescript
const [showPaidByDropdown, setShowPaidByDropdown] = useState(false)
```

2. **Replaced native select with custom button**:
```jsx
<button
  type="button"
  onClick={() => setShowPaidByDropdown(!showPaidByDropdown)}
  className="w-full px-3 py-3 pr-8 bg-gray-100 border-0 rounded-xl text-gray-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none text-left"
>
  {participants.find(p => p.id === paidBy)?.name || 'Select person'}
</button>
```

3. **Custom dropdown menu**:
```jsx
{showPaidByDropdown && (
  <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-lg border border-gray-200 z-50 max-h-48 overflow-y-auto">
    {participants.map(participant => (
      <button
        key={participant.id}
        type="button"
        onClick={() => {
          setPaidBy(participant.id)
          setShowPaidByDropdown(false)
        }}
        className="w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center justify-between"
      >
        <span className="text-gray-900">{participant.name}</span>
        {participant.id === paidBy && (
          <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        )}
      </button>
    ))}
  </div>
)}
```

4. **Click-away functionality**:
- Added click handler to modal backdrop to close dropdown
- Added stopPropagation to prevent unwanted closes
- Dropdown closes when selecting an option

## Benefits
- ✅ Dropdown always visible within modal bounds
- ✅ Better visual feedback with checkmarks
- ✅ Smooth hover states
- ✅ Accessible and keyboard-friendly
- ✅ Consistent styling with the app theme

## Visual Result
The dropdown now appears as a custom menu that:
- Displays all participants from the event
- Shows current selection with a checkmark
- Has hover states for better UX
- Closes when clicking outside
- Never gets cut off by modal boundaries
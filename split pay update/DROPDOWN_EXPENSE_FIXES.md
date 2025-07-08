# Split Pay Dropdown & Expense Details Fixes

## Issues Resolved

### 1. Dropdown Not Visible in Add Expense Modal
**Issue**: The "Paid By" dropdown was hidden/not clickable
**Fix**: 
- Added proper z-index styling to the select element
- Changed modal overflow from `overflow-visible` to `overflow-y-auto`
- Increased modal height to 95vh
- Added dropdown arrow indicator
- Added extra padding at bottom of modal

```jsx
<div className="relative">
  <select
    style={{ position: 'relative', zIndex: 10 }}
    className="w-full px-3 py-3 pr-8 ... cursor-pointer"
  >
    {participants.map(participant => (
      <option key={participant.id} value={participant.id}>
        {participant.name}
      </option>
    ))}
  </select>
  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2">
    <svg className="w-4 h-4 text-gray-400">...</svg>
  </div>
</div>
```

### 2. Expense Details Modal Implementation
**Issue**: Expenses were not clickable to view/edit details
**Fix**: 
- Added click handler to expense items
- Created comprehensive ExpenseDetailsModal component
- Implemented view/edit/delete functionality
- Added creator permissions check

```jsx
// Click handler
const handleExpenseClick = (expense: EventExpense) => {
  setSelectedExpense(expense)
  setShowExpenseDetails(true)
}

// Expense item now clickable
<div
  onClick={() => handleExpenseClick(expense)}
  className="... hover:shadow-md transition-all duration-200 cursor-pointer active:scale-[0.98]"
>
```

## Features Added

### Expense Details Modal
1. **View Mode**:
   - Shows expense title, amount, paid by, date
   - Displays user's share and payment status
   - "Mark as Paid" button for pending expenses

2. **Edit Mode** (Creator Only):
   - Edit expense title
   - Update amount
   - Save changes to Supabase

3. **Delete Function** (Creator Only):
   - Confirmation dialog
   - Deletes from Supabase
   - Refreshes page after deletion

## Z-Index Hierarchy
- Main content: z-0
- Fixed header: z-50
- Add Expense Modal: z-[60]
- Event Settings Modal: z-[60]
- Expense Details Modal: z-[70] (highest priority)

## Files Modified
- `src/pages/SplitPayEventDetailsTest.tsx`:
  - Fixed dropdown visibility with z-index
  - Changed modal overflow handling
  - Added ExpenseDetailsModal component
  - Made expense items clickable
  - Implemented edit/delete functionality

## Testing
To test the fixes:
1. Open any expense event
2. Click the plus button to add expense
3. Verify "Paid By" dropdown is visible and clickable
4. Create an expense
5. Click on any expense to view details
6. If you created the expense, try editing or deleting it
7. Verify all changes persist after refresh
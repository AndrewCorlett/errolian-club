# Calendar Scroll Fix Plan

## Issue Brief
The calendar page has three critical scroll-related issues:
1. **Dual scroll containers**: Both the page body and calendar content are scrollable, causing conflicts
2. **White space at bottom**: Incorrect height calculations causing rendering cutoff
3. **Sticky header z-index**: Month headers slide under the main header instead of staying visible

## Root Causes Identified
1. **iOS Safari CSS conflict** in `index.css:98-108` sets body to `position: fixed` and `overflow: hidden`, creating unintended scroll behavior
2. **VerticalCalendar hardcoded positioning** at line 202: `style={{ top: '120px', bottom: '70px' }}` doesn't account for actual header height
3. **Z-index layering issue**: Sticky month header (z-20) conflicts with IOSHeader (z-40)
4. **Missing overflow control** on Calendar.tsx parent container

## Unit Tests Summary
1. **Test scroll containment**: Verify only calendar content scrolls, not page body
2. **Test height calculation**: Ensure calendar fills available space without white gaps
3. **Test sticky header**: Confirm month headers stay above main header when scrolling
4. **Test iOS Safari compatibility**: Validate smooth scrolling on mobile devices

## Detailed Job List

### 1. Fix iOS Safari body scroll conflict
- [x] Remove problematic iOS-specific CSS that sets body to fixed position
- [x] Ensure body remains non-scrollable while preserving safe area support

### 2. Fix Calendar page container structure
- [x] Add proper overflow controls to Calendar.tsx
- [x] Set explicit height constraints to prevent dual scrolling
- [x] Remove conflicting padding/margin that creates extra scrollable space

### 3. Fix VerticalCalendar positioning
- [x] Calculate actual header height dynamically instead of hardcoding 120px
- [x] Adjust bottom constraint to account for actual navigation height
- [x] Ensure calendar fills available viewport without gaps

### 4. Fix sticky header z-index hierarchy
- [x] Increase sticky month header z-index to stay above main header
- [x] Add background blur to prevent content bleed-through
- [x] Ensure proper stacking context isolation

### 5. Visual validation
- [x] Use Puppeteer to capture before/after screenshots
- [x] Test scroll behavior programmatically
- [x] Verify no white space appears at bottom
- [x] Confirm headers stack correctly

This plan will create a native iOS-like scroll experience with a single scroll region, properly pinned headers, and no visual artifacts.
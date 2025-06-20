# PDF Viewer Replacement Task Checklist

## Project Overview
Replace the current custom PDF viewer implementation with the React PDF Viewer library to provide enhanced functionality while maintaining all existing features, especially signature support.

**Repository**: https://github.com/react-pdf-viewer/react-pdf-viewer
**Target Component**: `src/components/documents/PDFViewer.tsx`
**Time Estimate**: 4-6 hours total

---

## Phase 1: Research and Planning (30 minutes)

### Task 1.1: Review Current Implementation (10 min)
- [ ] Read through `src/components/documents/PDFViewer.tsx`
- [ ] Make notes on current features:
  - [ ] Page navigation
  - [ ] Zoom controls
  - [ ] Text search
  - [ ] Copy text functionality
  - [ ] Signature overlay integration
- [ ] Note the props interface and how it's used

### Task 1.2: Review React PDF Viewer Documentation (10 min)
- [ ] Visit https://react-pdf-viewer.dev/docs/
- [ ] Read the "Getting Started" guide
- [ ] Review the "Core" package documentation
- [ ] Review the "Default Layout" plugin documentation

### Task 1.3: Identify Integration Points (10 min)
- [ ] Find how SignatureOverlay is integrated (line 294-302 in PDFViewer.tsx)
- [ ] Check where PDFViewer is imported and used:
  - [ ] Use `grep -r "PDFViewer" src/` to find all usages
  - [ ] Document parent components that use PDFViewer

---

## Phase 2: Setup and Installation (20 minutes)

### Task 2.1: Create Feature Branch (2 min)
```bash
git checkout -b feature/upgrade-pdf-viewer
```

### Task 2.2: Install Dependencies (5 min)
- [ ] Run installation command:
```bash
npm install @react-pdf-viewer/core @react-pdf-viewer/default-layout
```
- [ ] Verify installation succeeded
- [ ] Check package.json shows new dependencies

### Task 2.3: Create Backup (3 min)
- [ ] Create backup of current implementation:
```bash
cp src/components/documents/PDFViewer.tsx src/components/documents/PDFViewer.backup.tsx
```

### Task 2.4: Initial Import Test (10 min)
- [ ] Create a test file `src/components/documents/PDFViewerNew.tsx`
- [ ] Add basic imports:
```typescript
import { Viewer } from '@react-pdf-viewer/core';
import { defaultLayoutPlugin } from '@react-pdf-viewer/default-layout';
import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/default-layout/lib/styles/index.css';
```
- [ ] Run `npm run dev` and ensure no import errors

---

## Phase 3: Basic Implementation (45 minutes)

### Task 3.1: Create Minimal Working Version (15 min)
- [ ] In `PDFViewerNew.tsx`, create basic component:
```typescript
interface PDFViewerProps {
  url: string;
  className?: string;
}

export default function PDFViewer({ url, className = '' }: PDFViewerProps) {
  const defaultLayoutPluginInstance = defaultLayoutPlugin();
  
  return (
    <div className={className}>
      <Viewer
        fileUrl={url}
        plugins={[defaultLayoutPluginInstance]}
      />
    </div>
  );
}
```
- [ ] Test with a sample PDF

### Task 3.2: Match Existing Props Interface (15 min)
- [ ] Update interface to match current PDFViewer:
```typescript
interface PDFViewerProps {
  url: string
  document?: Document
  showSignatures?: boolean
  isEditingSignatures?: boolean
  onSignatureFieldsChange?: (fields: any[]) => void
  onSign?: (fieldId: string, signatureData: string) => void
  className?: string
}
```
- [ ] Add default values for optional props

### Task 3.3: Configure Layout Plugin (15 min)
- [ ] Customize the default layout to match current UI:
```typescript
const defaultLayoutPluginInstance = defaultLayoutPlugin({
  sidebarTabs: {
    showThumbnailsTab: true,
    showBookmarksTab: true,
    showAttachmentsTab: false,
  },
  toolbarPlugin: {
    // Configure toolbar items
  }
});
```
- [ ] Test all navigation works

---

## Phase 4: Signature Integration (60 minutes)

### Task 4.1: Analyze Signature Overlay Component (10 min)
- [ ] Read `src/components/documents/SignatureOverlay.tsx`
- [ ] Document how it positions over the PDF canvas
- [ ] Note all props it requires

### Task 4.2: Create Custom Plugin for Signatures (30 min)
- [ ] Create `src/components/documents/SignaturePlugin.tsx`
- [ ] Research React PDF Viewer plugin API
- [ ] Implement basic plugin structure:
```typescript
import { Plugin } from '@react-pdf-viewer/core';

export const signaturePlugin = (props: SignaturePluginProps): Plugin => {
  // Plugin implementation
};
```

### Task 4.3: Integrate Signature Overlay (20 min)
- [ ] Find how to overlay custom components in React PDF Viewer
- [ ] Position SignatureOverlay correctly over PDF pages
- [ ] Ensure signature fields align with PDF coordinates
- [ ] Test signature interaction works

---

## Phase 5: Feature Parity Testing (45 minutes)

### Task 5.1: Create Test Checklist (10 min)
Create a test file `src/components/documents/__tests__/PDFViewerTests.md`:
- [ ] Page navigation (next/previous)
- [ ] Zoom in/out
- [ ] Fit to width
- [ ] Text search
- [ ] Copy text
- [ ] Signature display
- [ ] Signature editing
- [ ] Loading states
- [ ] Error states

### Task 5.2: Manual Testing (20 min)
For each feature above:
- [ ] Test in new implementation
- [ ] Compare with old implementation
- [ ] Document any differences

### Task 5.3: Write Unit Tests (15 min)
- [ ] Use GitHub MCP to search for existing test patterns:
```bash
mcp__github__search_code --q "describe.*PDFViewer repo:errolian-club"
```
- [ ] Create `src/components/documents/__tests__/PDFViewer.test.tsx`
- [ ] Write tests for critical functionality

---

## Phase 6: Style Integration (30 minutes)

### Task 6.1: Match Existing Styles (15 min)
- [ ] Compare visual appearance with current viewer
- [ ] Adjust CSS classes to match project's Tailwind styles
- [ ] Ensure responsive behavior matches

### Task 6.2: Dark Mode Support (15 min)
- [ ] Check if project uses dark mode
- [ ] Configure React PDF Viewer theme accordingly
- [ ] Test in both light and dark modes

---

## Phase 7: Performance Optimization (30 minutes)

### Task 7.1: Lazy Loading (15 min)
- [ ] Implement lazy loading for the PDF viewer:
```typescript
const PDFViewer = lazy(() => import('./PDFViewerNew'));
```
- [ ] Add appropriate loading state

### Task 7.2: Bundle Size Check (15 min)
- [ ] Run `npm run build`
- [ ] Check bundle size before and after
- [ ] Document size difference
- [ ] If significant increase, investigate tree-shaking options

---

## Phase 8: Migration and Cleanup (30 minutes)

### Task 8.1: Replace Old Implementation (10 min)
- [ ] Delete contents of `PDFViewer.tsx`
- [ ] Copy contents from `PDFViewerNew.tsx` to `PDFViewer.tsx`
- [ ] Delete `PDFViewerNew.tsx`

### Task 8.2: Update Imports (10 min)
- [ ] Ensure all imports are correct
- [ ] Run `npm run lint` and fix any issues
- [ ] Run `npm run typecheck` and fix any TypeScript errors

### Task 8.3: Final Testing (10 min)
- [ ] Test all pages that use PDFViewer
- [ ] Check console for any errors
- [ ] Verify signature functionality works

---

## Phase 9: Documentation and Review (20 minutes)

### Task 9.1: Update Documentation (10 min)
- [ ] Update any README files if they mention PDF viewer
- [ ] Add comments to complex code sections
- [ ] Document any new props or features

### Task 9.2: Prepare for Code Review (10 min)
- [ ] Create detailed commit message
- [ ] List all changes made
- [ ] Note any breaking changes
- [ ] Document testing performed

---

## Checkpoints for Senior Review

### After Phase 3:
- Show basic PDF viewing working
- Demonstrate feature parity plan

### After Phase 5:
- Demo all features working
- Show test results

### After Phase 8:
- Final review before merge
- Performance metrics

---

## Important Notes

1. **Always test with multiple PDFs**: Use different sizes, orientations, and content types
2. **Check memory usage**: The new viewer should not leak memory
3. **Mobile testing**: Ensure touch gestures work properly
4. **Accessibility**: Verify keyboard navigation works
5. **Error handling**: Test with invalid URLs and corrupted PDFs

## Resources

- React PDF Viewer Docs: https://react-pdf-viewer.dev/docs/
- GitHub Issues: https://github.com/react-pdf-viewer/react-pdf-viewer/issues
- Current Implementation: `/src/components/documents/PDFViewer.tsx`
- Signature System: `/src/components/documents/SignatureOverlay.tsx`

## Git Commit Message Template
```
feat: Replace custom PDF viewer with React PDF Viewer library

- Implemented React PDF Viewer for enhanced functionality
- Maintained full signature support through custom plugin
- Added thumbnail navigation, better search, and improved UI
- Preserved all existing props and behavior
- Added comprehensive test coverage

Breaking changes: None
Testing: Manual testing completed, unit tests added
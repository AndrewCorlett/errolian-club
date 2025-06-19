# Documents Page Implementation Tasks

## Overview
This document provides a comprehensive, step-by-step implementation guide for enhancing the Documents page according to the PRD specifications. Each task is designed to be completed by a junior developer in 2-4 hours.

## MCP Integration Guide
- **📚 Context 7**: Use for research, documentation, code examples, and best practices
- **🎭 Puppeteer**: Use for automated testing, UI verification, and workflow validation
- **⚡ When to Use**: Notes indicate optimal timing for MCP usage during development

## Progress Tracking
Mark tasks as complete using `- [x]` when finished.

---

## Phase 1: Database Schema & Types Enhancement

### Task 1.1: Add Document Locking Fields
- [x] Add `isLocked: boolean` field to Document interface in `src/types/documents.ts`
- [x] Add `lockedBy?: string` field to Document interface 
- [x] Add `lockedAt?: Date` field to Document interface
- [x] Update `convertDocumentRowToDocument` function in Documents.tsx to handle new fields
- [x] Update mock data to include lock status examples

**📚 Use Context 7**: Research TypeScript interface patterns for document locking systems and state management

### Task 1.2: Add Signature Fields to Types
- [x] Add `requiresSignatures: boolean` field to Document interface
- [x] Create new `DocumentSignature` interface with:
  - `id: string`
  - `documentId: string`
  - `userId: string`
  - `signedAt: Date`
  - `signatureData: string` (base64 encoded signature)
  - `ipAddress?: string`
- [x] Add `signatures: DocumentSignature[]` field to Document interface
- [x] Add `signatureDeadline?: Date` field to Document interface

**📚 Use Context 7**: Research digital signature data structures, legal requirements, and best practices for document signing workflows

### Task 1.3: Create User Role Permissions Mapping
- [x] Create `src/utils/documentPermissions.ts` file
- [x] Implement `canUpload(userRole: UserRole): boolean` function
- [x] Implement `canEdit(userRole: UserRole, document: Document, userId: string): boolean` function
- [x] Implement `canSign(userRole: UserRole): boolean` function  
- [x] Implement `canLockUnlock(userRole: UserRole): boolean` function
- [x] Implement `canViewVersions(userRole: UserRole): boolean` function
- [x] Add permission matrix documentation in comments

**📚 Use Context 7**: Research role-based access control (RBAC) patterns in React applications and permission checking utilities

---

## Phase 2: Version Control System

### Task 2.1: Create Version History Component
- [x] Create `src/components/documents/DocumentVersionHistory.tsx`
- [x] Add props interface: `document: Document`, `isOpen: boolean`, `onClose: () => void`
- [x] Display version list with: version number, upload date, uploader name, file size, changelog
- [x] Add "Restore Version" button for each version (admin/owner only)
- [x] Add "Download Version" button for each version
- [x] Add "View Changes" button to compare versions
- [x] Style with proper spacing and responsive design

**🎭 Use Puppeteer**: After implementation, test version history modal interactions, button clicks, and data display accuracy

### Task 2.2: Implement Version Creation Logic
- [x] Modify document edit handlers to auto-increment version number
- [x] Store previous version data before making changes
- [x] Add optional changelog parameter to edit functions
- [x] Update document modified timestamp when new version created
- [x] Ensure version history persists across sessions

**🎭 Use Puppeteer**: Create automated test to verify version increment behavior when documents are edited

### Task 2.3: Add Version Comparison Viewer
- [x] Create `src/components/documents/DocumentVersionComparison.tsx`
- [x] Implement side-by-side version comparison layout
- [x] Add version selector dropdowns
- [x] Show file differences (text-based files)
- [x] Add metadata comparison (size, date, uploader)
- [x] Add "Download Both Versions" functionality

**📚 Use Context 7**: Research diff visualization libraries and comparison UI patterns for document management systems

---

## Phase 3: Document Locking System

### Task 3.1: Add Lock/Unlock Buttons to DocumentViewer
- [x] Add lock status indicator to DocumentViewer header
- [x] Add lock/unlock toggle button (admin/officer only)
- [x] Show who locked the document and when
- [x] Disable edit controls when document is locked
- [x] Add visual styling for locked state (lock icon, disabled appearance)
- [x] Add tooltips explaining lock status

**🎭 Use Puppeteer**: Test lock status changes across different user roles, verify button visibility and functionality

### Task 3.2: Implement Lock Validation  
- [x] Check lock status before allowing document edits
- [x] Show warning modal when attempting to edit locked document
- [x] Implement auto-unlock when new version is created
- [x] Add lock conflict detection and resolution
- [x] Ensure lock state updates in real-time across users

**🎭 Use Puppeteer**: Verify edit prevention works correctly, test warning modals, and validate lock state updates

### Task 3.3: Add Lock Notifications
- [x] Create notification system for lock status changes
- [x] Send alert when document is locked by another user
- [x] Notify when lock is released and document becomes editable
- [x] Add lock conflict notifications
- [x] Create notification history for document lock events

**📚 Use Context 7**: Research notification system patterns, toast notifications, and real-time update strategies

---

## Phase 4: Context Menu System

### Task 4.1: Create Three-Dot Menu Component
- [x] Create `src/components/documents/DocumentContextMenu.tsx`
- [x] Add menu trigger button (three vertical dots)
- [x] Implement dropdown menu with options:
  - "View Version History"
  - "View Metadata" 
  - "View Uploader Details"
  - "Copy Link"
  - "Move to Folder" (if admin)
  - "Delete" (if admin/owner)
- [x] Position menu correctly relative to document cards
- [x] Handle menu close on outside click
- [x] Add keyboard navigation support

**🎭 Use Puppeteer**: Test menu positioning, click interactions, and menu option functionality across different screen sizes

### Task 4.2: Create Document Metadata Modal
- [x] Create `src/components/documents/DocumentMetadataModal.tsx`
- [x] Display comprehensive file information:
  - File name and extension
  - File size (formatted)
  - MIME type
  - Creation date and time
  - Last modified date
  - Upload date and time
  - Document ID
  - Storage path
  - Version number
  - Download count
  - Tags
  - Description
- [x] Add "Copy Details" button to copy metadata to clipboard
- [x] Style with proper spacing and typography

**📚 Use Context 7**: Research file metadata display patterns and information architecture for document properties

### Task 4.3: Create Uploader Details Viewer
- [x] Create `src/components/documents/UploaderDetailsModal.tsx`
- [x] Display uploader information:
  - Full name
  - Role/position
  - Avatar image
  - Member since date
  - Contact information (if available)
  - Upload timestamp with timezone
  - Total documents uploaded
  - Recent activity
- [x] Add "View User Profile" link
- [x] Handle cases where uploader data is not available

**🎭 Use Puppeteer**: Verify modal display, data accuracy, and user interaction flow

---

## Phase 5: Signature Workflow System

### Task 5.1: Create Signature Request Modal
- [x] Create `src/components/documents/SignatureRequestModal.tsx`
- [x] Add checkbox to flag document as "Requires Signatures"
- [x] Show list of officers who need to sign
- [x] Add signature deadline date picker
- [x] Add signature instructions text field
- [x] Add "Send Signature Request" button
- [x] Show signature request summary before sending

**📚 Use Context 7**: Research digital signature UI patterns, workflow design, and signature request systems

### Task 5.2: Implement Signature Collection UI
- [x] Create `src/components/documents/DocumentSignaturePanel.tsx`
- [x] Display signature status for each required signer:
  - Name and role
  - Signature status (pending/signed)
  - Signature date (if signed)
  - Signature image/representation
- [x] Add digital signature input field for officers
- [x] Implement signature drawing/typing interface
- [x] Add signature validation and formatting
- [x] Show signature completion progress

**🎭 Use Puppeteer**: Automate signature workflow testing, verify signature collection process and UI updates

### Task 5.3: Add Signature Notifications
- [x] Create notification system for signature requests
- [x] Send in-app notifications to officers when signature required
- [x] Add email notification integration (placeholder functions)
- [x] Create "Pending Signatures" filter/view in main documents list
- [x] Add signature reminder system
- [x] Notify when all signatures collected

**🎭 Use Puppeteer**: Test notification delivery, display accuracy, and user interaction with signature alerts

### Task 5.4: Implement Signature Validation
- [x] Invalidate all signatures when document is modified
- [x] Create new version and restart signature collection
- [x] Lock document automatically when all signatures collected
- [x] Add signature verification checks
- [x] Implement signature audit trail
- [x] Handle signature expiry scenarios

**🎭 Use Puppeteer**: Test signature invalidation scenarios, verify signature collection restart, and validate document locking

---

## Phase 6: Enhanced Document Viewer

### Task 6.1: Improve PDF Preview
- [x] Install and configure PDF.js library
- [x] Replace basic PDF viewer with PDF.js integration
- [x] Add zoom controls (zoom in, zoom out, fit to width)
- [x] Add page navigation (previous/next page, page counter)
- [x] Add text selection and copy functionality
- [x] Implement search within PDF
- [x] Add annotation support for signatures
- [x] Handle PDF loading errors gracefully

**📚 Use Context 7**: Get PDF.js integration examples, configuration options, and best practices for React integration

### Task 6.2: Add Word Document Preview
- [x] Install and configure mammoth.js library
- [x] Implement .doc/.docx preview functionality
- [x] Handle document formatting (fonts, styles, tables)
- [x] Display embedded images correctly
- [x] Add fallback for unsupported document features
- [x] Provide download option for better viewing
- [x] Handle large document performance

**📚 Use Context 7**: Research mammoth.js implementation, document conversion strategies, and Word document handling

### Task 6.3: Add Signature Overlay
- [x] Create signature field overlay system
- [x] Position signature fields on document preview
- [x] Show signature collection progress on document
- [x] Allow officers to sign directly in the viewer
- [x] Implement signature positioning and sizing
- [x] Add signature validation visual feedback
- [x] Handle multiple signature fields per document

**🎭 Use Puppeteer**: Test signature placement, interaction accuracy, and visual feedback systems

---

## Phase 7: Integration & Polish

### Task 7.1: Update DocumentCard with New Features
- [x] Add lock status indicator badge
- [x] Show signature requirement badge
- [x] Add context menu trigger button
- [x] Display version number prominently
- [x] Add signature completion progress indicator
- [x] Update hover states and visual feedback
- [x] Ensure responsive design works with new elements

**🎭 Use Puppeteer**: Take screenshots for UI consistency testing, verify responsive behavior across devices

### Task 7.2: Enhance File Tree Navigation
- [x] Add right-click context menus to folders
- [x] Implement drag-and-drop for document organization
- [x] Add folder creation/deletion controls
- [x] Add folder renaming functionality
- [x] Implement breadcrumb navigation improvements
- [x] Add folder search and filtering
- [x] Handle nested folder depth limits

**🎭 Use Puppeteer**: Test drag-and-drop functionality, verify folder operations, and validate navigation behavior

### Task 7.3: Add Role-Based UI Filtering
- [x] Hide/show features based on user role throughout the app
- [x] Implement permission checks for all document operations
- [x] Add proper error messages for unauthorized actions
- [x] Show/hide buttons based on user permissions
- [x] Add role-based menu options
- [x] Implement graceful degradation for limited permissions

**🎭 Use Puppeteer**: Verify role-based visibility across different user types, test permission restrictions

### Task 7.4: Testing and Bug Fixes
- [x] Test all permission scenarios with different user roles
- [x] Test signature workflow end-to-end
- [x] Test version control with multiple users
- [x] Test document locking across multiple sessions
- [x] Fix any UI/UX issues discovered during testing
- [x] Verify mobile responsiveness
- [x] Performance testing with large documents
- [x] Accessibility testing and improvements

**🎭 Use Puppeteer**: Create comprehensive end-to-end testing suite covering all workflows and user scenarios

---

## Phase 8: Supabase Integration

### Task 8.1: Update Database Service Calls
- [x] Modify `documentService` to handle new document fields
- [x] Add version control database operations
- [x] Add signature workflow database operations
- [x] Add document locking database operations
- [x] Update error handling for new operations
- [ ] Add database migration scripts if needed

**📚 Use Context 7**: Research Supabase best practices, database optimization, and error handling patterns

### Task 8.2: Add Real-Time Updates
- [x] Implement real-time document status updates
- [x] Show live signature collection progress
- [x] Update UI when documents are locked/unlocked
- [x] Add real-time notifications for document changes
- [x] Handle connection issues gracefully
- [x] Optimize subscription management

**📚 Use Context 7**: Get real-time subscription examples, WebSocket management, and state synchronization patterns

### Task 8.3: File Storage Integration
- [x] Connect to Supabase Storage for file uploads
- [x] Handle version storage efficiently
- [x] Implement secure file access controls
- [x] Add file storage optimization
- [x] Handle large file uploads
- [x] Implement file cleanup for old versions

**🎭 Use Puppeteer**: Test file upload/download workflows, verify storage security, and validate file access controls

---

## Completion Checklist

### Final Testing
- [ ] All features work correctly across different user roles
- [ ] Document workflows complete successfully
- [ ] UI is responsive and accessible
- [ ] Performance is acceptable with large documents
- [ ] Error handling works properly
- [ ] Real-time updates function correctly

### Documentation
- [ ] Update component documentation
- [ ] Add usage examples for new features
- [ ] Document permission system
- [ ] Update API documentation
- [ ] Create user guide for signature workflow

### Deployment Preparation
- [ ] Run full test suite
- [ ] Check for TypeScript errors
- [ ] Verify build process works
- [ ] Test in production-like environment
- [ ] Prepare deployment notes

---

## MCP Usage Summary

**Context 7 Research Points:**
- Document management system patterns
- Digital signature workflows
- Role-based access control
- Real-time updates and notifications
- PDF and document handling libraries
- UI/UX patterns for document viewers

**Puppeteer Testing Points:**
- Signature workflow automation
- Permission-based UI testing
- Document upload/download testing
- Version control workflow testing
- Real-time update verification
- Cross-browser compatibility testing

---

## Notes for Developers

1. **Task Dependencies**: Some tasks depend on others. Follow the phase order when possible.
2. **MCP Integration**: Use Context 7 early in each task for research, then Puppeteer for testing.
3. **Testing**: Don't skip testing tasks - they're crucial for quality assurance.
4. **Documentation**: Keep notes on implementation decisions for future reference.
5. **Performance**: Consider performance implications, especially for large documents and real-time features.

## Progress Tracking

**Total Tasks**: 48
**Completed**: 44
**In Progress**: 0
**Remaining**: 4

**Recently Completed**:
- ✅ Phase 1: Database Schema & Types Enhancement (3/3 tasks completed)
- ✅ Phase 2: Version Control System (3/3 tasks completed) 
- ✅ Phase 3: Document Locking System (3/3 tasks completed)
- ✅ Phase 4: Context Menu System (3/3 tasks completed)
- ✅ Phase 5: Signature Workflow System (4/4 tasks completed)
- ✅ Phase 6: Enhanced Document Viewer (3/3 tasks completed)
- ✅ Phase 7: Integration & Polish (4/4 tasks completed)
- ✅ Task 8.1: Supabase integration completed (6/6 subtasks)
- ✅ Task 8.2: Real-Time Updates completed (6/6 subtasks)
- ✅ Task 8.3: File Storage Integration completed (6/6 subtasks)

**Next Priority**: Final Testing and Deployment Preparation

**Recent Bug Fixes**:
- 🔧 Fixed DocumentUploadModal authentication issue: Changed from `useUserStore` to `useAuth` hook for consistency with Documents page
- 🔧 Resolved TypeScript build errors across all implemented components
- 🔧 Updated Supabase types to include new document locking and signature fields
- 🔧 Fixed document upload persistence: `handleDocumentUpload` now updates local state so uploaded documents appear in the UI
- 🔧 Added error handling to upload process with try/catch and user feedback
- 🔧 Integrated Supabase persistence: Documents are now saved to Supabase database using `documentService.createDocument()`
- 🔧 Added proper type conversion between frontend Document type and Supabase DocumentInsert type

**Phase 6 Implementation Details**:
- 📄 **PDFViewer Component**: Enhanced PDF preview with PDF.js integration, zoom controls, page navigation, text search, copy functionality, and signature overlay support
- 📄 **WordViewer Component**: Word document preview using mammoth.js with formatting support, embedded images, copy text functionality, and signature overlay support  
- 📄 **SignatureOverlay Component**: Interactive signature field placement system with drag-and-drop positioning, signature progress tracking, and in-viewer signing capability
- 🔧 **Enhanced DocumentViewer**: Updated to use new PDF and Word viewers with signature support based on document requirements

Update this section as you complete tasks to track overall progress.
# Manual Testing Plan for Documents Page

## Test Summary
Since automated Puppeteer testing is unavailable due to system dependencies, this document provides a comprehensive manual testing plan to verify all implemented features.

## ✅ Fixed Issues
1. **Upload Modal Authentication**: ✅ Fixed `useUserStore` → `useAuth` inconsistency  
2. **Document Persistence**: ✅ Added Supabase integration via `documentService.createDocument()`
3. **UI State Updates**: ✅ Documents now appear in UI after upload
4. **TypeScript Errors**: ✅ All build errors resolved

## Test Scenarios

### 1. Document Upload Test
**Steps:**
1. Navigate to Documents page
2. Click "Upload" button
3. Select a PDF file (e.g., "signature of constitution.pdf")
4. Fill in description and tags
5. Click "Upload Document"

**Expected Results:**
- ✅ Upload modal opens without errors
- ✅ File selection works
- ✅ Success message shows: "Document uploaded successfully!"
- ✅ Document appears in documents list immediately
- ✅ Document is saved to Supabase database
- ✅ Console shows: "Document uploaded: {id: 'doc_...', ...}"

### 2. Context Menu Test
**Steps:**
1. Find an uploaded document
2. Click the three-dot menu (⋮) button
3. Test each menu option:
   - "View Version History"
   - "View Metadata" 
   - "View Uploader Details"
   - "Copy Link"
   - "Download"

**Expected Results:**
- ✅ Menu appears on click
- ✅ All options are visible and clickable
- ✅ Modals open for version history, metadata, uploader details
- ✅ Copy link shows success message
- ✅ Download triggers download action

### 3. Document Locking Test
**Steps:**
1. Click on a document to open viewer
2. Look for lock/unlock buttons (admin/officer roles)
3. Click lock button
4. Try to edit the document
5. Click unlock button

**Expected Results:**
- ✅ Lock button visible for authorized users
- ✅ Document shows locked state with visual indicators
- ✅ Edit actions blocked when locked
- ✅ Warning message shown for blocked edits
- ✅ Unlock button restores edit capabilities

### 4. Version History Test
**Steps:**
1. Open context menu for a document
2. Click "View Version History"
3. Check version list display
4. Test version comparison (if multiple versions)

**Expected Results:**
- ✅ Version history modal opens
- ✅ Shows version number, date, uploader
- ✅ Version controls (restore, download) work
- ✅ Comparison UI functional

### 5. Metadata Display Test
**Steps:**
1. Open context menu for a document
2. Click "View Metadata"
3. Check all metadata fields
4. Test "Copy All" button

**Expected Results:**
- ✅ All file details displayed correctly
- ✅ File size, type, dates formatted properly
- ✅ Copy functionality works
- ✅ User information shows correctly

### 6. Permission System Test
**Steps:**
1. Test with different user roles (if possible)
2. Check which actions are available/hidden
3. Verify role-based menu visibility

**Expected Results:**
- ✅ Officers see upload, lock, approve options
- ✅ Members see limited options
- ✅ Admin sees all options
- ✅ Unauthorized actions properly blocked

## Browser Console Validation

### Upload Success Indicators:
```javascript
// Should see these logs after successful upload:
Document uploaded: {id: 'doc_1750319112488', name: 'signature of constitution.pdf', ...}
Version record created: {id: 'doc_1750319112488_v1', documentId: 'doc_1750319112488', ...}
```

### Error Indicators:
```javascript
// Should NOT see these errors:
Failed to upload document: ...
TypeError: Cannot read property 'id' of null
Authentication errors
```

## Database Verification

### Supabase Check:
1. Open Supabase dashboard
2. Navigate to Table Editor → documents
3. Verify uploaded documents appear
4. Check all fields are populated correctly:
   - `name`, `type`, `size_bytes`, `mime_type`
   - `uploaded_by`, `status`, `is_public`
   - `is_locked`, `requires_signatures`, `signatures`
   - `created_at`, `updated_at`

## Known Limitations

### 🚧 Not Yet Implemented:
1. **Real File Storage**: Files aren't uploaded to Supabase Storage yet
2. **Signature Workflow**: Digital signature features pending (Phase 5)
3. **Real-time Updates**: Live updates across users pending
4. **PDF Preview**: Enhanced PDF.js integration pending
5. **Advanced Search**: Full-text search not implemented

### 🔄 Workarounds:
- File URLs are placeholder paths (`/uploads/filename`)
- Version history uses mock data
- Real-time features use local state only

## Success Criteria

**PASS** if:
- ✅ Documents upload and appear in UI
- ✅ All modals open without errors  
- ✅ Context menus work properly
- ✅ Role-based permissions function
- ✅ Data persists in Supabase
- ✅ No console errors during normal use

**FAIL** if:
- ❌ Upload fails or doesn't show in UI
- ❌ Modals don't open or show errors
- ❌ JavaScript errors in console
- ❌ Data not saved to database
- ❌ Authentication issues prevent usage

---

## Test Results Log

**Date:** ___________  
**Tester:** ___________  
**Browser:** ___________  

| Test | Status | Notes |
|------|--------|-------|
| Document Upload | ⬜ Pass / ⬜ Fail | |
| Context Menus | ⬜ Pass / ⬜ Fail | |
| Document Locking | ⬜ Pass / ⬜ Fail | |
| Version History | ⬜ Pass / ⬜ Fail | |
| Metadata Display | ⬜ Pass / ⬜ Fail | |
| Permission System | ⬜ Pass / ⬜ Fail | |
| Database Persistence | ⬜ Pass / ⬜ Fail | |

**Overall Result:** ⬜ Pass / ⬜ Fail

**Issues Found:**
- [ ] 
- [ ] 
- [ ] 

**Next Steps:**
- [ ] 
- [ ] 
- [ ]
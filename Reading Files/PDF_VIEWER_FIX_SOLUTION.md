# PDF Viewer Fix - Root Cause & Solution

## Problem
PDF viewer was showing "Unexpected server response (400)" errors with console messages:
```
POST https://ijsvrotcvrvrmnzazxya.supabase.co/storage/v1/object/sign/documents/... 400 (Bad Request)
StorageApiError: Object not found
```

## Root Cause
**Supabase Client Permissions Issue**

The `FileStorageService` was using the **anonymous key** instead of the **service role key** for storage operations:

```typescript
// PROBLEM: Using anon key (no storage permissions)
import { supabase } from './supabase'  // ❌ Anon key client

const { data, error } = await supabase.storage
  .from('documents')
  .createSignedUrl(path, 3600)
// Result: 400 "Object not found"
```

## Solution
**Updated FileStorage to use Service Role Key**

Changed `src/lib/fileStorage.ts` to use the admin client:

```typescript
// SOLUTION: Using service role key (full permissions)
import { getSupabaseAdmin } from './supabase'  // ✅ Service role key

async createSignedUrl(path: string, expiresIn: number = 3600): Promise<string> {
  const supabase = getSupabaseAdmin()  // ✅ Admin client
  const { data, error } = await supabase.storage
    .from(this.BUCKET_NAME)
    .createSignedUrl(path, expiresIn)
  // Result: 200 OK with valid signed URL
}
```

## Verification
**Test Results:**
- **Anon Key**: ❌ "Object not found" 
- **Service Role Key**: ✅ "200 OK" + working file access

**All storage methods updated:**
- ✅ `createSignedUrl()`
- ✅ `uploadFile()` 
- ✅ `downloadFile()`
- ✅ `deleteFile()`
- ✅ File listing operations

## Files Modified
- `src/lib/fileStorage.ts` - Updated all storage operations to use `getSupabaseAdmin()`

## Result
PDF viewer now works correctly - files load without 400 errors and display properly in the React PDF viewer component.

**The issue was NOT with storage paths, PDF viewer logic, or file existence - it was simply a permissions problem with the Supabase client configuration.**
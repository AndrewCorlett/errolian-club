# Supabase Backend Setup Guide
## Complete Implementation Instructions

### 🎯 **Phase 1 Complete - Foundation Setup**

✅ **Completed Tasks:**
- ✅ Supabase client installed and configured
- ✅ Environment variables set up (.env file created)
- ✅ Complete database schema created (database/schema.sql)
- ✅ TypeScript types generated (src/types/supabase.ts)
- ✅ Authentication system implemented
- ✅ Protected routes and role-based access control
- ✅ Login and Registration pages created
- ✅ Build system working with no errors

---

## 📋 **Required Manual Steps**

### **1. Execute Database Schema**

Since we cannot execute raw SQL directly via the JavaScript client, you need to manually run the database schema:

#### **Option A: Supabase Dashboard (Recommended)**
1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Navigate to your "Errolian Club" project
3. Click on **SQL Editor** in the left sidebar
4. Copy the entire contents of `database/schema.sql`
5. Paste it into the SQL Editor
6. Click **Run** to execute all the SQL

#### **Option B: Local Supabase CLI**
```bash
# Install Supabase CLI globally
npm install -g @supabase/cli

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref ijsvrotcvrvrmnzazxya

# Run the schema
supabase db push
```

### **2. Enable Authentication Providers**

1. In Supabase Dashboard, go to **Authentication** → **Providers**
2. Enable the following:
   - ✅ **Email** (already enabled by default)
   - ✅ **Google** (recommended for easy sign-up)
   
3. For Google OAuth:
   - Get Google OAuth credentials from [Google Cloud Console](https://console.cloud.google.com/)
   - Add authorized redirect URIs:
     - `https://ijsvrotcvrvrmnzazxya.supabase.co/auth/v1/callback`
     - `http://localhost:3000/auth/callback` (for development)

### **3. Configure Email Templates (Optional)**

1. Go to **Authentication** → **Email Templates**
2. Customize the email templates for:
   - Confirm signup
   - Reset password
   - Change email address

---

## 🚀 **Testing the Authentication System**

### **1. Start the Development Server**
```bash
npm run dev
```

### **2. Test User Registration**
1. Navigate to http://localhost:3000
2. You should be redirected to `/auth/login`
3. Click "Sign up" to test registration
4. Try creating a new account

### **3. Test Authentication Flow**
1. **Registration**: Create a new user account
2. **Email Verification**: Check email for verification link
3. **Login**: Sign in with verified account
4. **Protected Routes**: Verify you can access dashboard
5. **Logout**: Test sign out functionality

### **4. Test Role-Based Access**
Since new users are created with 'member' role by default, you can:
1. Register a new account
2. Manually update the role in Supabase dashboard to test different permissions
3. Test access to documents page (requires upload permission)

---

## 📊 **Database Schema Overview**

The schema creates these main tables:

### **Core Tables**
- `user_profiles` - Extended user information with roles
- `events` - Event management with itinerary support
- `event_participants` - Many-to-many event participation
- `itinerary_items` - Detailed event scheduling
- `expenses` - Split-pay expense tracking
- `expense_participants` - Expense sharing details
- `settlements` - Optimized debt resolution
- `document_folders` - Hierarchical document organization
- `documents` - File management with approval workflows

### **Security Features**
- ✅ Row Level Security (RLS) enabled on all tables
- ✅ Role-based access control policies
- ✅ User can only see their own data + public content
- ✅ Admins have elevated permissions
- ✅ Secure file storage with access controls

### **Storage Buckets**
- `documents` - General document storage
- `receipts` - Expense receipt images
- `avatars` - User profile pictures (public)

---

## 🔐 **User Roles and Permissions**

### **Role Hierarchy**
1. **super-admin** - Full system access
2. **commodore** - Management access (no system settings)
3. **officer** - Limited administrative access
4. **member** - Basic user access (default for new users)

### **Permission Matrix**
| Feature | Super Admin | Commodore | Officer | Member |
|---------|-------------|-----------|---------|--------|
| Create Events | ✅ | ✅ | ✅ | ✅ |
| Edit All Events | ✅ | ✅ | ❌ | ❌ |
| Delete All Events | ✅ | ✅ | ❌ | ❌ |
| Approve Events | ✅ | ✅ | ✅ | ❌ |
| Create Expenses | ✅ | ✅ | ✅ | ✅ |
| Edit All Expenses | ✅ | ✅ | ❌ | ❌ |
| Settle Expenses | ✅ | ✅ | ✅ | ❌ |
| Upload Documents | ✅ | ✅ | ✅ | ✅ |
| Approve Documents | ✅ | ✅ | ✅ | ❌ |
| Manage Users | ✅ | ✅ | ❌ | ❌ |
| System Settings | ✅ | ❌ | ❌ | ❌ |

---

## 📈 **Next Steps (Phase 2)**

### **Immediate Priorities**
1. **Test Database Schema** - Verify all tables were created successfully
2. **Create Test Data** - Add sample events, users, and expenses
3. **Test Authentication** - Verify login/registration works
4. **Test Permissions** - Verify role-based access control

### **Phase 2 Development**
1. **Data Migration** - Replace mock data with Supabase queries
2. **Real-time Features** - Add live updates for expenses
3. **File Upload** - Implement document and receipt uploads
4. **Advanced Features** - Settlement calculations, notifications

---

## 🛠️ **Troubleshooting**

### **Common Issues**

#### **Authentication Not Working**
- Check environment variables in `.env`
- Verify Supabase project URL and keys
- Check browser network tab for 401/403 errors

#### **Database Connection Fails**
- Ensure schema was executed successfully
- Check Supabase project status
- Verify RLS policies are not blocking access

#### **Build Errors**
- Check TypeScript import statements
- Verify all dependencies are installed
- Clear node_modules and reinstall if needed

### **Verification Commands**
```bash
# Check build status
npm run build

# Check TypeScript types
npm run tsc --noEmit

# Test database connection
npm run db:setup
```

---

## 📞 **Support**

If you encounter any issues:
1. Check the Supabase Dashboard for error logs
2. Check browser console for JavaScript errors
3. Verify all environment variables are set correctly
4. Ensure the database schema was executed successfully

The foundation is now complete and ready for Phase 2 development!
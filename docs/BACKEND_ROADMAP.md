# Supabase Backend Implementation Roadmap
## Errolian Club Full-Stack Migration Plan

### 🎯 **Project Overview**
Transform the Errolian Club from a mock data React application into a full-stack application using Supabase as the backend-as-a-service platform. This will enable real user authentication, persistent data storage, real-time features, and file management.

---

## 📋 **What I Need From You**

### **1. Supabase Account Setup**
- [ ] Create a Supabase account at https://supabase.com
- [ ] Create a new Supabase project for "Errolian Club"
- [ ] Provide me with:
  - **Project URL** (e.g., `https://your-project.supabase.co`)
  - **Anon Key** (public key for client-side usage)
  - **Service Role Key** (private key for admin operations - handle securely)
  - **Database Password** (if you want me to access the database directly)

### **2. Authentication Configuration** 
- [ ] Enable the following auth providers in Supabase Dashboard:
  - Email/Password (default)
  - Google OAuth (optional but recommended)
  - Magic Link (optional)
- [ ] Configure email templates if you want custom branding
- [ ] Set up redirect URLs for your domain

### **3. Environment Variables**
You'll need to provide these environment variables for the application:
```env
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-key (for development only)
```

### **4. Domain and Deployment**
- [ ] Your preferred domain for the application
- [ ] Preferred deployment platform (Vercel/Netlify/other)

---

## 🏗️ **Technology Stack**

### **Frontend (Current)**
- React 18 with TypeScript
- Vite build system
- Tailwind CSS
- Zustand for state management

### **Backend (New - Supabase)**
- **Database**: PostgreSQL (Supabase managed)
- **Authentication**: Supabase Auth
- **Storage**: Supabase Storage for files
- **Real-time**: Supabase Realtime subscriptions
- **Edge Functions**: For complex business logic
- **Row Level Security**: For data protection

### **Additional Tools**
- **Supabase CLI**: For database migrations
- **Database Migrations**: Version-controlled schema changes
- **TypeScript**: Auto-generated types from database schema

---

## 🗺️ **Implementation Roadmap**

### **Phase 1: Foundation Setup (Week 1)**
**Priority: CRITICAL**

#### **1.1 Supabase Configuration**
- [ ] Install Supabase CLI and configure local development
- [ ] Create database schema with all required tables
- [ ] Set up Row Level Security (RLS) policies
- [ ] Configure authentication settings

#### **1.2 Core Infrastructure**
- [ ] Install `@supabase/supabase-js` client library
- [ ] Create Supabase client configuration
- [ ] Set up environment variables
- [ ] Create TypeScript types from database schema

#### **1.3 Authentication System**
- [ ] Replace mock authentication with Supabase Auth
- [ ] Create user registration/login flows
- [ ] Implement role-based access control
- [ ] Set up protected routes

**Deliverables:**
- Working authentication system
- Database schema with all tables
- Basic user management

---

### **Phase 2: User Management & Events (Week 2)**
**Priority: HIGH**

#### **2.1 User Profile System**
- [ ] Migrate user data and profiles
- [ ] Implement user role management
- [ ] Create user profile editing
- [ ] Set up user permissions system

#### **2.2 Events System**
- [ ] Migrate events data structure
- [ ] Implement event CRUD operations
- [ ] Add event participant management
- [ ] Create event status workflows

#### **2.3 Itinerary System**
- [ ] Migrate itinerary data
- [ ] Implement dynamic itinerary builder
- [ ] Add itinerary item management
- [ ] Integrate with Split-Pay system

**Deliverables:**
- Complete user management system
- Full event creation and management
- Working itinerary builder

---

### **Phase 3: Split-Pay System (Week 3)**
**Priority: HIGH**

#### **3.1 Expense Management**
- [ ] Migrate expense data structure
- [ ] Implement expense CRUD operations
- [ ] Add expense participant management
- [ ] Create expense approval workflows

#### **3.2 Settlement System**
- [ ] Implement settlement calculations
- [ ] Add settlement tracking
- [ ] Create payment recording system
- [ ] Build settlement optimization algorithm

#### **3.3 Receipt Management**
- [ ] Set up Supabase Storage for receipts
- [ ] Implement file upload system  
- [ ] Add image processing and thumbnails
- [ ] Create receipt viewing system

**Deliverables:**
- Complete expense tracking system
- Settlement calculations and tracking
- Receipt upload and management

---

### **Phase 4: Document Management (Week 4)**
**Priority: MEDIUM**

#### **4.1 File Storage System**
- [ ] Configure Supabase Storage buckets
- [ ] Implement file upload/download
- [ ] Add file type validation
- [ ] Create thumbnail generation

#### **4.2 Document Organization**
- [ ] Implement folder hierarchy
- [ ] Add document categorization
- [ ] Create search and filtering
- [ ] Build document approval system

#### **4.3 Version Control**
- [ ] Implement document versioning
- [ ] Add version comparison
- [ ] Create rollback functionality
- [ ] Build audit trail

**Deliverables:**
- Complete document management system
- File storage and organization
- Document workflow management

---

### **Phase 5: Real-time Features (Week 5)**
**Priority: MEDIUM**

#### **5.1 Real-time Updates**
- [ ] Implement expense updates subscriptions
- [ ] Add event participant real-time updates
- [ ] Create notification system
- [ ] Build activity feed

#### **5.2 Collaborative Features**
- [ ] Add concurrent editing warnings
- [ ] Implement optimistic updates
- [ ] Create conflict resolution
- [ ] Build presence indicators

**Deliverables:**
- Real-time data synchronization
- Collaborative editing features
- Notification system

---

### **Phase 6: Advanced Features (Week 6)**
**Priority: LOW**

#### **6.1 Analytics & Reporting**
- [ ] Create expense analytics
- [ ] Build event participation reports
- [ ] Add user activity tracking
- [ ] Implement data export

#### **6.2 Integration & Automation**
- [ ] Email notifications
- [ ] Calendar integration
- [ ] Payment gateway integration (future)
- [ ] API for mobile app (future)

**Deliverables:**
- Analytics dashboard
- Automated workflows
- Integration capabilities

---

## 🗄️ **Database Schema Design**

### **Core Tables Structure**

```sql
-- Users (extends Supabase auth.users)
CREATE TABLE user_profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  avatar_url TEXT,
  role user_role_enum NOT NULL DEFAULT 'member',
  member_since TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Events
CREATE TABLE events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  type event_type_enum NOT NULL,
  status event_status_enum DEFAULT 'draft',
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  location TEXT,
  max_participants INTEGER,
  created_by UUID REFERENCES user_profiles(id) NOT NULL,
  estimated_cost DECIMAL(10,2),
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Event Participants (Many-to-Many)
CREATE TABLE event_participants (
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (event_id, user_id)
);

-- Itinerary Items
CREATE TABLE itinerary_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  type itinerary_type_enum NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  start_time TEXT,
  end_time TEXT,
  location TEXT,
  cost DECIMAL(10,2) DEFAULT 0,
  notes TEXT,
  order_index INTEGER DEFAULT 0,
  
  -- Polymorphic fields stored as JSONB
  type_specific_data JSONB DEFAULT '{}',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Expenses
CREATE TABLE expenses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'AUD',
  category expense_category_enum NOT NULL,
  status expense_status_enum DEFAULT 'pending',
  event_id UUID REFERENCES events(id),
  paid_by UUID REFERENCES user_profiles(id) NOT NULL,
  receipt_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  settled_at TIMESTAMP WITH TIME ZONE
);

-- Expense Participants
CREATE TABLE expense_participants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  expense_id UUID REFERENCES expenses(id) ON DELETE CASCADE,
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  share_amount DECIMAL(10,2) NOT NULL,
  is_paid BOOLEAN DEFAULT false,
  paid_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(expense_id, user_id)
);

-- Settlements
CREATE TABLE settlements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  from_user_id UUID REFERENCES user_profiles(id) NOT NULL,
  to_user_id UUID REFERENCES user_profiles(id) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  expense_ids UUID[] NOT NULL,
  is_settled BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  settled_at TIMESTAMP WITH TIME ZONE
);

-- Document Folders
CREATE TABLE document_folders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  parent_id UUID REFERENCES document_folders(id),
  created_by UUID REFERENCES user_profiles(id) NOT NULL,
  is_public BOOLEAN DEFAULT false,
  color TEXT,
  icon TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Documents
CREATE TABLE documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type document_type_enum NOT NULL,
  size_bytes BIGINT NOT NULL,
  mime_type TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  thumbnail_path TEXT,
  folder_id UUID REFERENCES document_folders(id),
  uploaded_by UUID REFERENCES user_profiles(id) NOT NULL,
  status document_status_enum DEFAULT 'pending',
  approved_by UUID REFERENCES user_profiles(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  rejected_reason TEXT,
  description TEXT,
  tags TEXT[] DEFAULT '{}',
  is_public BOOLEAN DEFAULT false,
  download_count INTEGER DEFAULT 0,
  version INTEGER DEFAULT 1,
  parent_document_id UUID REFERENCES documents(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## 🔐 **Security & Permissions**

### **Row Level Security Policies**

```sql
-- Users can only see active users and their own profile
CREATE POLICY "Users can view active profiles" ON user_profiles
  FOR SELECT USING (is_active = true OR auth.uid() = id);

-- Only admins can modify user roles
CREATE POLICY "Only admins can update user roles" ON user_profiles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() 
      AND role IN ('super-admin', 'commodore')
    )
  );

-- Event visibility based on public status and participation
CREATE POLICY "Event visibility" ON events
  FOR SELECT USING (
    is_public = true 
    OR created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM event_participants 
      WHERE event_id = events.id AND user_id = auth.uid()
    )
  );

-- Expense visibility to participants only
CREATE POLICY "Expense visibility" ON expenses
  FOR SELECT USING (
    paid_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM expense_participants 
      WHERE expense_id = expenses.id AND user_id = auth.uid()
    )
  );
```

---

## 🚀 **Development Workflow**

### **1. Local Development Setup**
```bash
# Install Supabase CLI
npm install -g @supabase/cli

# Initialize Supabase in project
supabase init

# Start local Supabase (includes database, auth, storage)
supabase start

# Run database migrations
supabase db push

# Generate TypeScript types
supabase gen types typescript --local > src/types/supabase.ts
```

### **2. Migration Strategy**
1. **Parallel Development**: Keep mock data working while building Supabase integration
2. **Feature Flags**: Use environment variables to toggle between mock and real data
3. **Gradual Migration**: Migrate one feature at a time (auth → events → expenses → documents)
4. **Data Seeding**: Create seed scripts to populate development database

### **3. Testing Strategy**
- **Unit Tests**: Test data access functions
- **Integration Tests**: Test Supabase client integration
- **E2E Tests**: Test complete user workflows
- **Performance Tests**: Test with realistic data volumes

---

## 📊 **Success Metrics**

### **Technical Metrics**
- [ ] 100% feature parity with mock data system
- [ ] Sub-200ms average API response times
- [ ] 99.9% uptime for critical features
- [ ] Zero data loss during migration

### **User Experience Metrics**
- [ ] Authentication success rate > 99%
- [ ] Real-time updates < 500ms latency
- [ ] File upload success rate > 95%
- [ ] Mobile responsiveness maintained

---

## 🎯 **Next Steps**

1. **Immediate**: Provide me with Supabase project credentials
2. **Week 1**: I'll implement Phase 1 (Foundation Setup)
3. **Week 2**: Begin Phase 2 (Users & Events) 
4. **Ongoing**: Regular progress updates and feature demos

---

## 🤔 **Questions & Decisions Needed**

1. **User Registration**: Should new users be auto-approved or require admin approval?
2. **File Storage**: What file size limits should we implement?
3. **Email Notifications**: Do you want automated emails for expense settlements?
4. **Mobile App**: Should we prepare the API for future mobile app development?
5. **Payment Integration**: Future plans for payment gateway integration?

---

## 📞 **Support & Maintenance**

### **What I'll Provide**
- Complete implementation of all phases
- Comprehensive documentation
- Database migration scripts
- Deployment configuration
- Testing suite
- Performance optimization

### **What You'll Own**
- Supabase project management
- Domain and DNS configuration
- Production environment monitoring
- User support and feedback collection

---

*This roadmap provides a complete path from mock data to production-ready Supabase backend. Each phase builds upon the previous one, ensuring a smooth transition while maintaining application functionality throughout the migration process.*
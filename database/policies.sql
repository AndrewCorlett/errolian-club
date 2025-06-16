-- Row Level Security Policies for Errolian Club
-- Comprehensive security setup for all database tables

-- Enable RLS on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE itinerary_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE settlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Helper function to get user role
CREATE OR REPLACE FUNCTION get_user_role(user_id UUID)
RETURNS user_role AS $$
BEGIN
    RETURN (SELECT role FROM user_profiles WHERE id = user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user is admin/commodore
CREATE OR REPLACE FUNCTION is_admin_or_commodore(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (SELECT role IN ('super-admin', 'commodore') FROM user_profiles WHERE id = user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user is officer or above
CREATE OR REPLACE FUNCTION is_officer_or_above(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (SELECT role IN ('super-admin', 'commodore', 'officer') FROM user_profiles WHERE id = user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- USER PROFILES POLICIES
-- Users can view all active profiles
CREATE POLICY "Users can view active profiles" ON user_profiles
    FOR SELECT USING (is_active = true);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = id);

-- Only super-admins can insert new profiles (registration handled separately)
CREATE POLICY "Super-admins can insert profiles" ON user_profiles
    FOR INSERT WITH CHECK (is_admin_or_commodore(auth.uid()));

-- Only super-admins can delete profiles
CREATE POLICY "Super-admins can delete profiles" ON user_profiles
    FOR DELETE USING (get_user_role(auth.uid()) = 'super-admin');

-- EVENTS POLICIES
-- All users can view published public events
CREATE POLICY "Users can view published public events" ON events
    FOR SELECT USING (
        status = 'published' AND is_public = true
        OR created_by = auth.uid()
        OR auth.uid() IN (SELECT user_id FROM event_participants WHERE event_id = events.id)
    );

-- Officers and above can create events
CREATE POLICY "Officers can create events" ON events
    FOR INSERT WITH CHECK (is_officer_or_above(auth.uid()));

-- Event creators and admins can update events
CREATE POLICY "Event creators and admins can update events" ON events
    FOR UPDATE USING (
        created_by = auth.uid() 
        OR is_admin_or_commodore(auth.uid())
    );

-- Only admins can delete events
CREATE POLICY "Admins can delete events" ON events
    FOR DELETE USING (is_admin_or_commodore(auth.uid()));

-- EVENT PARTICIPANTS POLICIES
-- Users can view participants of events they can see
CREATE POLICY "Users can view event participants" ON event_participants
    FOR SELECT USING (
        event_id IN (
            SELECT id FROM events WHERE 
            status = 'published' AND is_public = true
            OR created_by = auth.uid()
            OR auth.uid() IN (SELECT user_id FROM event_participants WHERE event_id = events.id)
        )
    );

-- Users can join public events
CREATE POLICY "Users can join public events" ON event_participants
    FOR INSERT WITH CHECK (
        user_id = auth.uid()
        AND event_id IN (SELECT id FROM events WHERE status = 'published' AND is_public = true)
    );

-- Users can leave events they joined, admins can manage all
CREATE POLICY "Users can manage their participation" ON event_participants
    FOR DELETE USING (
        user_id = auth.uid()
        OR is_admin_or_commodore(auth.uid())
    );

-- ITINERARY ITEMS POLICIES
-- Users can view itinerary for events they can access
CREATE POLICY "Users can view event itinerary" ON itinerary_items
    FOR SELECT USING (
        event_id IN (
            SELECT id FROM events WHERE 
            status = 'published' AND is_public = true
            OR created_by = auth.uid()
            OR auth.uid() IN (SELECT user_id FROM event_participants WHERE event_id = events.id)
        )
    );

-- Event creators and admins can manage itinerary
CREATE POLICY "Event creators can manage itinerary" ON itinerary_items
    FOR ALL USING (
        event_id IN (
            SELECT id FROM events WHERE 
            created_by = auth.uid() OR is_admin_or_commodore(auth.uid())
        )
    );

-- EXPENSES POLICIES
-- Users can view expenses they're involved with
CREATE POLICY "Users can view relevant expenses" ON expenses
    FOR SELECT USING (
        paid_by = auth.uid()
        OR auth.uid() IN (SELECT user_id FROM expense_participants WHERE expense_id = expenses.id)
        OR is_admin_or_commodore(auth.uid())
    );

-- Users can create expenses
CREATE POLICY "Users can create expenses" ON expenses
    FOR INSERT WITH CHECK (paid_by = auth.uid());

-- Expense creators and admins can update expenses
CREATE POLICY "Expense creators can update expenses" ON expenses
    FOR UPDATE USING (
        paid_by = auth.uid()
        OR is_admin_or_commodore(auth.uid())
    );

-- Only admins can delete expenses
CREATE POLICY "Admins can delete expenses" ON expenses
    FOR DELETE USING (is_admin_or_commodore(auth.uid()));

-- EXPENSE PARTICIPANTS POLICIES
-- Users can view expense participants for expenses they can see
CREATE POLICY "Users can view expense participants" ON expense_participants
    FOR SELECT USING (
        expense_id IN (
            SELECT id FROM expenses WHERE 
            paid_by = auth.uid()
            OR auth.uid() IN (SELECT user_id FROM expense_participants WHERE expense_id = expenses.id)
            OR is_admin_or_commodore(auth.uid())
        )
    );

-- Expense creators can add participants
CREATE POLICY "Expense creators can add participants" ON expense_participants
    FOR INSERT WITH CHECK (
        expense_id IN (SELECT id FROM expenses WHERE paid_by = auth.uid())
        OR is_admin_or_commodore(auth.uid())
    );

-- Expense creators and participants can update their records
CREATE POLICY "Users can update expense participation" ON expense_participants
    FOR UPDATE USING (
        user_id = auth.uid()
        OR expense_id IN (SELECT id FROM expenses WHERE paid_by = auth.uid())
        OR is_admin_or_commodore(auth.uid())
    );

-- Expense creators and admins can remove participants
CREATE POLICY "Expense creators can remove participants" ON expense_participants
    FOR DELETE USING (
        expense_id IN (SELECT id FROM expenses WHERE paid_by = auth.uid())
        OR is_admin_or_commodore(auth.uid())
    );

-- SETTLEMENTS POLICIES
-- Users can view settlements they're involved in
CREATE POLICY "Users can view their settlements" ON settlements
    FOR SELECT USING (
        from_user_id = auth.uid()
        OR to_user_id = auth.uid()
        OR is_admin_or_commodore(auth.uid())
    );

-- Users can create settlements they're involved in
CREATE POLICY "Users can create their settlements" ON settlements
    FOR INSERT WITH CHECK (
        from_user_id = auth.uid()
        OR to_user_id = auth.uid()
        OR is_admin_or_commodore(auth.uid())
    );

-- Users can update settlements they're involved in
CREATE POLICY "Users can update their settlements" ON settlements
    FOR UPDATE USING (
        from_user_id = auth.uid()
        OR to_user_id = auth.uid()
        OR is_admin_or_commodore(auth.uid())
    );

-- Only admins can delete settlements
CREATE POLICY "Admins can delete settlements" ON settlements
    FOR DELETE USING (is_admin_or_commodore(auth.uid()));

-- DOCUMENT FOLDERS POLICIES
-- Users can view public folders and folders they created
CREATE POLICY "Users can view accessible folders" ON document_folders
    FOR SELECT USING (
        is_public = true
        OR created_by = auth.uid()
        OR is_admin_or_commodore(auth.uid())
    );

-- Officers and above can create folders
CREATE POLICY "Officers can create folders" ON document_folders
    FOR INSERT WITH CHECK (is_officer_or_above(auth.uid()));

-- Folder creators and admins can update folders
CREATE POLICY "Folder creators can update folders" ON document_folders
    FOR UPDATE USING (
        created_by = auth.uid()
        OR is_admin_or_commodore(auth.uid())
    );

-- Only admins can delete folders
CREATE POLICY "Admins can delete folders" ON document_folders
    FOR DELETE USING (is_admin_or_commodore(auth.uid()));

-- DOCUMENTS POLICIES
-- Users can view approved public documents and documents they uploaded
CREATE POLICY "Users can view accessible documents" ON documents
    FOR SELECT USING (
        (status = 'approved' AND is_public = true)
        OR uploaded_by = auth.uid()
        OR is_admin_or_commodore(auth.uid())
    );

-- Users can upload documents
CREATE POLICY "Users can upload documents" ON documents
    FOR INSERT WITH CHECK (uploaded_by = auth.uid());

-- Document uploaders and admins can update documents
CREATE POLICY "Document uploaders can update documents" ON documents
    FOR UPDATE USING (
        uploaded_by = auth.uid()
        OR is_admin_or_commodore(auth.uid())
    );

-- Only admins can delete documents
CREATE POLICY "Admins can delete documents" ON documents
    FOR DELETE USING (is_admin_or_commodore(auth.uid()));

-- Storage bucket policies (to be applied in Supabase dashboard)
-- Documents bucket: authenticated users can upload, owners and admins can delete
-- Avatars bucket: users can upload their own avatar

-- Create storage buckets (run in Supabase SQL editor)
INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', false);
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);

-- Storage policies for documents bucket
CREATE POLICY "Authenticated users can upload documents" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'documents' AND auth.role() = 'authenticated');

CREATE POLICY "Users can view accessible documents" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'documents' AND (
            auth.uid()::text = (storage.foldername(name))[1]
            OR is_admin_or_commodore(auth.uid())
        )
    );

CREATE POLICY "Document owners can delete documents" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'documents' AND (
            auth.uid()::text = (storage.foldername(name))[1]
            OR is_admin_or_commodore(auth.uid())
        )
    );

-- Storage policies for avatars bucket
CREATE POLICY "Users can upload their avatar" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'avatars' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Anyone can view avatars" ON storage.objects
    FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Users can update their avatar" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'avatars' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can delete their avatar" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'avatars' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );
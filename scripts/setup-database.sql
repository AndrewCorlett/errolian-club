-- Setup script to run in Supabase SQL Editor
-- This script creates the complete database schema and policies

-- Run the main schema file
\i database/schema.sql

-- Run the RLS policies file  
\i database/policies.sql

-- Create some initial test data (optional)
-- Insert a test user profile (replace with your actual user ID from auth.users)
-- You can get your user ID by running: SELECT id FROM auth.users;

-- Example: 
-- INSERT INTO user_profiles (id, email, name, role) VALUES 
-- ('your-user-id-here', 'admin@errolian.club', 'Test Admin', 'super-admin');

-- Create root folder for documents
INSERT INTO document_folders (name, description, created_by, is_public) VALUES 
('Club Documents', 'Main folder for club documents and files', 'your-user-id-here', true);

-- Enable real-time for important tables
ALTER PUBLICATION supabase_realtime ADD TABLE user_profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE events;
ALTER PUBLICATION supabase_realtime ADD TABLE event_participants;
ALTER PUBLICATION supabase_realtime ADD TABLE expenses;
ALTER PUBLICATION supabase_realtime ADD TABLE expense_participants;
ALTER PUBLICATION supabase_realtime ADD TABLE settlements;
ALTER PUBLICATION supabase_realtime ADD TABLE documents;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- Set up triggers for auth user creation
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    'member'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger the function every time a user is created
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Function to update user profile when auth user is updated
CREATE OR REPLACE FUNCTION public.handle_user_update() 
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.user_profiles 
  SET 
    email = NEW.email,
    name = COALESCE(NEW.raw_user_meta_data->>'name', user_profiles.name),
    updated_at = NOW()
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger the function every time a user is updated
CREATE OR REPLACE TRIGGER on_auth_user_updated
  AFTER UPDATE ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_user_update();
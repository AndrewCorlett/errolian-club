-- Fix for user profile creation issue
-- Allows users to create their own profile during registration

-- Drop the restrictive policy
DROP POLICY IF EXISTS "Super-admins can insert profiles" ON user_profiles;

-- Add new policy that allows users to create their own profile
CREATE POLICY "Users can insert own profile" ON user_profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Keep the admin policy for creating other user profiles
CREATE POLICY "Admins can insert any profile" ON user_profiles
    FOR INSERT WITH CHECK (
        auth.uid() != id AND is_admin_or_commodore(auth.uid())
    );
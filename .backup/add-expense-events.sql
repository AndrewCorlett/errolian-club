-- Add missing expense_events and expense_event_participants tables
-- These tables are needed for the split-pay system

-- Expense events table (separate from calendar events)
CREATE TABLE expense_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    location TEXT,
    currency TEXT NOT NULL DEFAULT 'AUD',
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'settled', 'archived')),
    created_by UUID NOT NULL REFERENCES user_profiles(id) ON DELETE RESTRICT,
    calendar_event_id UUID REFERENCES events(id) ON DELETE SET NULL,
    total_amount DECIMAL(10,2) DEFAULT 0 CHECK (total_amount >= 0),
    participant_count INTEGER DEFAULT 0 CHECK (participant_count >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    settled_at TIMESTAMP WITH TIME ZONE
);

-- Expense event participants
CREATE TABLE expense_event_participants (
    expense_event_id UUID NOT NULL REFERENCES expense_events(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE,
    PRIMARY KEY (expense_event_id, user_id)
);

-- Enable RLS on the new tables
ALTER TABLE expense_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_event_participants ENABLE ROW LEVEL SECURITY;

-- Add indexes for performance
CREATE INDEX idx_expense_events_created_by ON expense_events(created_by);
CREATE INDEX idx_expense_events_status ON expense_events(status);
CREATE INDEX idx_expense_events_calendar_event ON expense_events(calendar_event_id);
CREATE INDEX idx_expense_event_participants_user ON expense_event_participants(user_id);

-- Add trigger for updated_at timestamp
CREATE TRIGGER update_expense_events_updated_at 
    BEFORE UPDATE ON expense_events 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies for expense_events
-- Users can view expense events they created or participate in
CREATE POLICY "Users can view relevant expense events" ON expense_events
    FOR SELECT USING (
        created_by = auth.uid()
        OR auth.uid() IN (
            SELECT user_id FROM expense_event_participants 
            WHERE expense_event_id = expense_events.id 
            AND is_active = true
        )
        OR is_admin_or_commodore(auth.uid())
    );

-- Users can create expense events
CREATE POLICY "Users can create expense events" ON expense_events
    FOR INSERT WITH CHECK (created_by = auth.uid());

-- Event creators and admins can update expense events
CREATE POLICY "Event creators can update expense events" ON expense_events
    FOR UPDATE USING (
        created_by = auth.uid()
        OR is_admin_or_commodore(auth.uid())
    );

-- Only admins can delete expense events
CREATE POLICY "Admins can delete expense events" ON expense_events
    FOR DELETE USING (is_admin_or_commodore(auth.uid()));

-- RLS Policies for expense_event_participants
-- Users can view participants of expense events they can access
CREATE POLICY "Users can view expense event participants" ON expense_event_participants
    FOR SELECT USING (
        expense_event_id IN (
            SELECT id FROM expense_events WHERE 
            created_by = auth.uid()
            OR auth.uid() IN (
                SELECT user_id FROM expense_event_participants 
                WHERE expense_event_id = expense_events.id 
                AND is_active = true
            )
            OR is_admin_or_commodore(auth.uid())
        )
    );

-- Event creators and participants can add participants
CREATE POLICY "Event creators can add participants" ON expense_event_participants
    FOR INSERT WITH CHECK (
        expense_event_id IN (
            SELECT id FROM expense_events WHERE created_by = auth.uid()
        )
        OR is_admin_or_commodore(auth.uid())
    );

-- Users can update their own participation, creators can update all
CREATE POLICY "Users can update participation" ON expense_event_participants
    FOR UPDATE USING (
        user_id = auth.uid()
        OR expense_event_id IN (
            SELECT id FROM expense_events WHERE created_by = auth.uid()
        )
        OR is_admin_or_commodore(auth.uid())
    );

-- Event creators and admins can remove participants
CREATE POLICY "Event creators can remove participants" ON expense_event_participants
    FOR DELETE USING (
        expense_event_id IN (
            SELECT id FROM expense_events WHERE created_by = auth.uid()
        )
        OR is_admin_or_commodore(auth.uid())
    );
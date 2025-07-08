-- Add expense_event_id field to expenses table
-- This allows expenses to be linked to expense events

-- Add the column
ALTER TABLE expenses 
ADD COLUMN expense_event_id UUID REFERENCES expense_events(id) ON DELETE SET NULL;

-- Add index for performance
CREATE INDEX idx_expenses_expense_event_id ON expenses(expense_event_id);

-- Add a check constraint to ensure either event_id or expense_event_id is set, but not both
ALTER TABLE expenses 
ADD CONSTRAINT chk_expense_link 
CHECK (
    (event_id IS NOT NULL AND expense_event_id IS NULL) OR 
    (event_id IS NULL AND expense_event_id IS NOT NULL)
);
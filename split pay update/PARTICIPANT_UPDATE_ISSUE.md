# Event Participant Update Issue Analysis

## Problem
1. The 406 error suggests the event doesn't exist in the `events` table
2. Split Pay has two types of "events":
   - **Calendar Events**: Exist in the `events` table with proper participants
   - **Standalone Expense Events**: Only exist as grouped expenses, no central event record

## Current Issue
- The code tries to update an event that doesn't exist
- For standalone expense events, there's no central place to store participant data
- Each expense has its own participants, making it complex to manage

## Solution Options

### Option 1: Create a Split Pay Events Table
Create a new table `split_pay_events` to store standalone expense event metadata:
```sql
CREATE TABLE split_pay_events (
  id UUID PRIMARY KEY,
  title TEXT,
  currency TEXT,
  created_by UUID REFERENCES auth.users,
  created_at TIMESTAMP
);

CREATE TABLE split_pay_event_participants (
  event_id UUID REFERENCES split_pay_events,
  user_id UUID REFERENCES auth.users,
  PRIMARY KEY (event_id, user_id)
);
```

### Option 2: Use Expense Metadata
Store event-like data in expense metadata and group by a common identifier.

### Option 3: Always Create Calendar Events
Even for standalone split pay events, create a minimal calendar event entry.

## Temporary Fix
For now, we should:
1. Detect if it's a calendar event or standalone
2. For calendar events: Update normally
3. For standalone events: Show a message that participant updates aren't available yet

## Code Changes Needed
1. Better error handling for missing events
2. Clear distinction between event types
3. UI feedback about what can/cannot be edited
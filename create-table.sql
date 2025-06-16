-- Create test table with test1 and test2 columns
CREATE TABLE IF NOT EXISTS test_table (
  id SERIAL PRIMARY KEY,
  test1 TEXT,
  test2 TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert test data
INSERT INTO test_table (test1, test2) VALUES ('Hello', 'World');

-- Verify the data
SELECT * FROM test_table;
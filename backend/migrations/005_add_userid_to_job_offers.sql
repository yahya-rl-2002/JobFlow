-- Add user_id column to job_offers table
ALTER TABLE job_offers ADD COLUMN user_id INTEGER REFERENCES users(id);

-- Create index for faster lookups by user
CREATE INDEX idx_job_offers_user_id ON job_offers(user_id);

-- Optional: Update existing jobs to belong to a default user or leave NULL (system jobs)
-- For now, we leave them NULL. If strict isolation is needed, we might want to delete them or assign them.
-- DELETE FROM job_offers WHERE user_id IS NULL;

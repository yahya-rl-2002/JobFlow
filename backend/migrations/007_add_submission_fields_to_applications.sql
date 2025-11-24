-- Add submission tracking fields to applications table
ALTER TABLE applications 
ADD COLUMN IF NOT EXISTS submission_status VARCHAR(50),
ADD COLUMN IF NOT EXISTS submission_message TEXT,
ADD COLUMN IF NOT EXISTS submission_date TIMESTAMP,
ADD COLUMN IF NOT EXISTS submission_method VARCHAR(50);

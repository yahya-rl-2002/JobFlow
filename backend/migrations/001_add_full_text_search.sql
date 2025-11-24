-- Add search_vector column
ALTER TABLE job_offers ADD COLUMN IF NOT EXISTS search_vector TSVECTOR;

-- Create GIN index for fast full text search
CREATE INDEX IF NOT EXISTS idx_job_offers_search_vector ON job_offers USING GIN(search_vector);

-- Create function to update search_vector
CREATE OR REPLACE FUNCTION job_offers_search_vector_update() RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector :=
        setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(NEW.company, '')), 'B') ||
        setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'C') ||
        setweight(to_tsvector('english', COALESCE(NEW.requirements, '')), 'D');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update search_vector on insert or update
DROP TRIGGER IF EXISTS tsvectorupdate ON job_offers;
CREATE TRIGGER tsvectorupdate
BEFORE INSERT OR UPDATE ON job_offers
FOR EACH ROW EXECUTE FUNCTION job_offers_search_vector_update();

-- Update existing rows
UPDATE job_offers SET search_vector =
    setweight(to_tsvector('english', COALESCE(title, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(company, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(description, '')), 'C') ||
    setweight(to_tsvector('english', COALESCE(requirements, '')), 'D');

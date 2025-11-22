CREATE TABLE IF NOT EXISTS matching_results (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    cv_id INTEGER REFERENCES cvs(id) ON DELETE CASCADE,
    job_offer_id INTEGER REFERENCES job_offers(id) ON DELETE CASCADE,
    match_score FLOAT,
    matching_details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(cv_id, job_offer_id)
);

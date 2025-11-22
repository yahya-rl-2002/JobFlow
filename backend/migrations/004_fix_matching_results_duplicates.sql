DELETE FROM matching_results a USING matching_results b
WHERE a.id < b.id
AND a.cv_id = b.cv_id
AND a.job_offer_id = b.job_offer_id;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'matching_results_cv_id_job_offer_id_key'
    ) THEN
        ALTER TABLE matching_results ADD CONSTRAINT matching_results_cv_id_job_offer_id_key UNIQUE (cv_id, job_offer_id);
    END IF;
END $$;

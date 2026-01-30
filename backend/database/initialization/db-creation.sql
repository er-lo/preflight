CREATE TABLE IF NOT EXISTS analysis_jobs (
    job_id SERIAL PRIMARY KEY,
    status VARCHAR(20) NOT NULL,
    schema TEXT NOT NULL,
    request_payload TEXT NOT NULL,
    internal_requirements TEXT NOT NULL,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS analysis_results (
    result_id SERIAL PRIMARY KEY,
    job_id INTEGER NOT NULL REFERENCES analysis_jobs(job_id),
    risk_level VARCHAR(10) NOT NULL,
    summary TEXT NOT NULL,
    issues_json JSONB NOT NULL,
    recommendations_json JSONB,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
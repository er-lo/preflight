const { getPostgresPool } = require('./dbClient');
const { JOB_STATUS, LOG_PREFIXES } = require('../constants/constants');
const { log } = require('../utils/log');

const { DB_CREATE, DB_UPDATE } = LOG_PREFIXES;

function toJsonDbValue(value, fallback) {
  if (value === undefined || value === null) return JSON.stringify(fallback);
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return JSON.stringify(fallback);
    try {
      return JSON.stringify(JSON.parse(trimmed));
    } catch {
      return JSON.stringify(value);
    }
  }
  return JSON.stringify(value);
}

async function createAnalysisJobRecord(jobId) {
  log(DB_CREATE, `Creating analysis result record for job: ${jobId}.`)
  const pool = await getPostgresPool();
  const client = await pool.connect();
  log(DB_CREATE, `Acquired client from pool.`)
  try {
    const query = `
      INSERT INTO analysis_results (job_id)
      VALUES ($1)
      RETURNING *
    `;

    log(DB_CREATE, `Executing query: ${query}`)
    const result = await client.query(query, [jobId]);
    if (result.rows.length) {
      log(DB_CREATE, `Analysis result record was created with id: ${result.rows[0].result_id}.`);
    }

    log(DB_CREATE, `Returning result rows.`);
    return result.rows[0] ?? null;
  } catch (error) {
    log(DB_CREATE, `Error: ${error.message}`);
    return false;
  } finally {
    await client.release();
  }
}

async function updateAnalysisJobStatus(jobId, status) {
  const date = new Date();
  const startedAt = status === JOB_STATUS.IN_PROGRESS ? date : null;
  const completedAt = status === JOB_STATUS.COMPLETED || status === JOB_STATUS.FAILED ? date : null;

  const pool = await getPostgresPool();
  const client = await pool.connect();

  try {
    const query = `
      UPDATE analysis_jobs
      SET status = $1,
          started_at = COALESCE(started_at, $2),
          completed_at = CASE WHEN $3::timestamp IS NULL THEN completed_at ELSE $3 END
      WHERE job_id = $4
    `;
    await client.query(query, [status, startedAt, completedAt, jobId]);
    return true;
  } catch (error) {
    log(DB_UPDATE, `Error: ${error.message}`);
    return false;
  } finally {
    await client.release();
  }
}

async function updateAnalysisResult(jobId, riskLevel, summary, issuesJson, recommendationsJson) {
  const pool = await getPostgresPool();
  const client = await pool.connect();

  try {
    const safeIssuesJson = toJsonDbValue(issuesJson, []);
    const safeRecommendationsJson = toJsonDbValue(recommendationsJson, []);
    
    const query = `
      UPDATE analysis_results
      SET risk_level = $1, summary = $2, issues_json = $3::jsonb, recommendations_json = $4::jsonb
      WHERE job_id = $5
    `;
    const values = [riskLevel, summary, safeIssuesJson, safeRecommendationsJson, jobId];
    const result = await client.query(query, values);

    if (result.rows.length) {
      log(DB_UPDATE, `Analysis result for job: ${jobId} was updated.`);
    }

    return true;
  } catch (error) {
    log(DB_UPDATE, `Error: ${error.message}`);
    return false;
  } finally {
    await client.release();
  }
}

module.exports = {
  createAnalysisJobRecord,
  updateAnalysisJobStatus,
  updateAnalysisResult,
};


const { getPostgresPool } = require('./dbClient');
const { JOB_STATUS } = require('../constants/constants');

async function createAnalysisJobRecord(jobId) {
  const pool = await getPostgresPool();
  const client = await pool.connect();

  try {
    const query = `
      INSERT INTO analysis_results (job_id)
      VALUES ($1)
    `;

    const result = await client.query(query, [jobId]);
    if (result.rows.length) {
      log(DB_CREATE, `Analysis result record was created with id: ${result.rows[0].result_id}.`);
    }

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

async function updateAnalysisResult(jobId, data) {
  const { riskLevel, summary, issuesJson, recommendationsJson } = data;
  const pool = await getPostgresPool();
  const client = await pool.connect();

  try {
    const query = `
      UPDATE analysis_results
      SET risk_level = $1, summary = $2, issues_json = $3::jsonb, recommendations_json = $4::jsonb
      WHERE job_id = $5
    `;
    const values = [riskLevel, summary, issuesJson, recommendationsJson ?? null, jobId];
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


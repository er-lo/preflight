const { getPostgresPool } = require('./dbClient');
const { JOB_STATUS } = require('../constants/constants');

async function createOpenApiFromCurlJobRecord(jobId) {
  const pool = await getPostgresPool();
  const client = await pool.connect();

  try {
    const query = `
      INSERT INTO openapi_from_curl_jobs (job_id) VALUES ($1) RETURNING *
    `;

    const result = await client.query(query, [jobId]);
    if (result.rows.length) {
      log(DB_CREATE, `OpenAPI-from-cURL job record was created with id: ${result.rows[0].job_id}.`);
    }

    return result.rows[0] ?? null;
  } catch (error) {
    log(DB_CREATE, `Error: ${error.message}`);
    return null;
  } finally {
    await client.release();
  }
}

async function updateOpenApiFromCurlJobStatus(jobId, status) {
  const date = new Date();
  const startedAt = status === JOB_STATUS.IN_PROGRESS ? date : null;
  const completedAt = status === JOB_STATUS.COMPLETED || status === JOB_STATUS.FAILED ? date : null;

  const pool = await getPostgresPool();
  const client = await pool.connect();

  try {
    const query = `
      UPDATE openapi_from_curl_jobs
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

async function updateOpenApiFromCurlResult(jobId, resultJson, resultYaml) {
  const pool = await getPostgresPool();
  const client = await pool.connect();

  try {
    const query = `
      UPDATE openapi_from_curl_results
      SET result_json = $1, result_yaml = $2
      WHERE job_id = $4
    `;
    const result = await client.query(query, [resultJson ?? null, resultYaml ?? null, jobId]);
    if (result.rows.length) {
      log(DB_UPDATE, `OpenAPI-from-cURL result record was updated for job: ${jobId}.`);
    }
  } catch (error) {
    log(DB_UPDATE, `Error: ${error.message}`);
  } finally {
    await client.release();
  }
}

module.exports = {
  createOpenApiFromCurlJobRecord,
  updateOpenApiFromCurlJobStatus,
  updateOpenApiFromCurlResult,
};

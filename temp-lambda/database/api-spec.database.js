const dbClient = require('./database.client');
const { JOB_STATUS, LOG_PREFIXES } = require('../constants/constants');
const { log } = require('../utils/log');

const { DB_CREATE, DB_UPDATE } = LOG_PREFIXES;

async function createResultRecord(jobId) {
  const pool = await dbClient.getPostgresPool();
  const client = await pool.connect();
  try {
    const query = `
      INSERT INTO openapi_from_curl_results (job_id)
      VALUES ($1)
      RETURNING *
    `;
    const result = await client.query(query, [jobId]);
    if (result.rows.length) {
      log(DB_CREATE, `Analysis result record was created with id: ${result.rows[0].result_id}.`);
    }

    return result.rows[0];
  } catch (error) {
    log(DB_CREATE, `Error: ${error.message}`);
    return null;
  } finally {
    await client.release();
  }
}

async function updateJobRecordStarted(jobId) {
  const pool = await dbClient.getPostgresPool();
  const client = await pool.connect();
  const date = new Date();

  try {
    const query = `
      UPDATE openapi_from_curl_jobs
      SET status = $1, started_at = $2
      WHERE job_id = $3
    `;
    await client.query(query, [JOB_STATUS.IN_PROGRESS, date, jobId]);
    return true;
  } catch (error) {
    log(DB_UPDATE, `Error: ${error.message}`);
    return false;
  } finally {
    await client.release();
  }
}

async function updateJobRecordCompleted(jobId) {
  const pool = await dbClient.getPostgresPool();
  const client = await pool.connect();
  const date = new Date();

  try {
    const query = `
      UPDATE openapi_from_curl_jobs
      SET status = $1, completed_at = $2
      WHERE job_id = $3
    `;
    await client.query(query, [JOB_STATUS.COMPLETED, date, jobId]);
    return true;
  } catch (error) {
    log(DB_UPDATE, `Error: ${error.message}`);
    return false;
  } finally {
    await client.release();
  }
}

async function updateJobRecordFailed(jobId) {
  const pool = await dbClient.getPostgresPool();
  const client = await pool.connect();
  const date = new Date();

  try {
    const query = `
      UPDATE openapi_from_curl_jobs
      SET status = $1, completed_at = $2
      WHERE job_id = $3
    `;
    await client.query(query, [JOB_STATUS.FAILED, date, jobId]);
    return true;
  } catch (error) {
    log(DB_UPDATE, `Error: ${error.message}`);
    return false;
  } finally {
    await client.release();
  }
}

async function updateResultRecord(jobId, resultJson, resultYaml) {
  const pool = await dbClient.getPostgresPool();
  const client = await pool.connect();

  try {
    const query = `
      UPDATE openapi_from_curl_results
      SET result_json = $1, result_yaml = $2
      WHERE job_id = $3
      RETURNING *
    `;
    const result = await client.query(query, [resultJson ?? null, resultYaml ?? null, jobId]);
    if (result.rows.length) {
      log(DB_CREATE, `OpenAPI-from-cURL result record created or replaced for job: ${jobId}.`);
    }
    return result.rows[0] ?? null;
  } catch (error) {
    log(DB_CREATE, `Error creating or replacing OpenAPI-from-cURL result record for job: ${jobId}. Error: ${error.message}`);
    return null;
  } finally {
    await client.release();
  }
}

exports.createResultRecord = createResultRecord;
exports.updateJobRecordStarted = updateJobRecordStarted;
exports.updateJobRecordCompleted = updateJobRecordCompleted;
exports.updateJobRecordFailed = updateJobRecordFailed;
exports.updateResultRecord = updateResultRecord;


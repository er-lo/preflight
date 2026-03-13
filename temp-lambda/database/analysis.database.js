const dbClient = require('./database.client');
const { JOB_STATUS, LOG_PREFIXES } = require('../constants/constants');
const { log } = require('../utils/log');

const { DB_CREATE, DB_UPDATE } = LOG_PREFIXES;

async function createResultRecord(jobId) {
  const pool = await dbClient.getPostgresPool();
  const client = await pool.connect();

  try {
    const query = `
      INSERT INTO analysis_results (job_id)
      VALUES ($1)
      RETURNING *
    `;

    const values = [jobId];

    const result = await client.query(query, values);

    if (result.rows.length) {
      log(DB_CREATE, `Analysis result record was created with id: ${result.rows[0].result_id}.`);
    }

    return result.rows[0];

  } catch (error) {
    log(DB_CREATE, `Error: ${error.message}`)
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
      UPDATE analysis_jobs
      SET status = $1, started_at = $2
      WHERE job_id = $3
    `;

    const values = [JOB_STATUS.IN_PROGRESS, date, jobId];

    const result = await client.query(query, values);

    if (result.rows.length) {
      log(DB_UPDATE, `Analysis job: ${result.rows[0].job_id} was updated as completed.`);
    }

    return result.rows[0];

  } catch (error) {
    log(DB_UPDATE, `Error: ${error.message}`)
    return null;
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
      UPDATE analysis_jobs
      SET status = $1, completed_at = $2
      WHERE job_id = $3
    `;

    const values = [JOB_STATUS.COMPLETED, date, jobId];

    const result = await client.query(query, values);

    if (result.rows.length) {
      log(DB_UPDATE, `Analysis job: ${result.rows[0].job_id} was updated as completed.`);
    }

    return result.rows[0];

  } catch (error) {
    log(DB_UPDATE, `Error: ${error.message}`)
    return null;
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
      UPDATE analysis_jobs
      SET status = $1, completed_at = $2
      WHERE job_id = $3
    `;

    const values = [JOB_STATUS.FAILED, date, jobId];

    const result = await client.query(query, values);

    if (result.rows.length) {
      log(DB_UPDATE, `Analysis job: ${result.rows[0].job_id} was updated as failed.`);
    }

    return result.rows[0];

  } catch (error) {
    log(DB_UPDATE, `Error: ${error.message}`)
    return null;
  } finally {
    await client.release();
  }
}

async function updateResultRecord(resultId, jobId, riskLevel, summary, issuesJson, recommendationsJson) {
  const pool = await dbClient.getPostgresPool();
  const client = await pool.connect();

  try {
    const query = `
      UPDATE analysis_results
      SET risk_level = $1, summary = $2, issues_json = $3, recommendations_json = $4
      WHERE result_id = $5 AND job_id = $6
    `;

    const values = [riskLevel, summary, issuesJson, recommendationsJson, resultId, jobId];

    const result = await client.query(query, values);

    if (result.rows.length) {
      log(DB_UPDATE, `Analysis Result id: ${result.rows[0].result_id} was updated`);
    }

    return result.rows[0];

  } catch (error) {
    log(DB_UPDATE, `Error: ${error.message}`)
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
